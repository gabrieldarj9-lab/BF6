import type {
  DerivedMetricContext,
  MetricDirection,
  MetricResult,
  ResolvedBuildMetricInput,
} from "./types";
import { damageAtDistance, shotsToKill } from "./damage";
import { firingTimeForShotsMs, firstMechanicalFollowUpMs } from "./cadence";
import { timeToImpactMs } from "./ballistics";
import { sustainedOutput } from "./sustained";
import {
  farthestSampledOneShotDistance,
  shotgunLethalityAtDistance,
} from "./shotgun";
import {
  COMPOSITE_RECIPES,
  weightedNormalizedComposite,
} from "./composites";

function result(
  metricId: string,
  value: number | null,
  direction: MetricDirection,
  evidence: MetricResult["evidence"],
  dependencies: string[],
  unit?: string,
  reason?: string,
  metadata?: Record<string, unknown>,
): MetricResult {
  return {
    metricId,
    value,
    direction,
    evidence,
    dependencies,
    unit,
    reason,
    metadata,
  };
}

function directDirection(metricId: string): MetricDirection {
  if (
    metricId === "mobility.adsMove" ||
    metricId === "ballistics.velocity" ||
    metricId === "magazine.capacity"
  ) {
    return "HIGHER_IS_BETTER";
  }

  return "LOWER_IS_BETTER";
}

export function directResolvedMetric(
  input: ResolvedBuildMetricInput,
  metricId: string,
): MetricResult {
  if (metricId === "ballistics.velocity") {
    const value =
      input.technical[metricId] ??
      input.projectileVelocityMps ??
      null;

    return result(
      metricId,
      value,
      "HIGHER_IS_BETTER",
      value === null ? "UNAVAILABLE" : "DIRECT_RESOLVED",
      ["projectileVelocityMps"],
      "m/s",
      value === null ? "velocidade não resolvida" : undefined,
    );
  }

  if (metricId === "magazine.capacity") {
    const value =
      input.technical[metricId] ??
      input.magazineCapacity ??
      null;

    return result(
      metricId,
      value,
      "HIGHER_IS_BETTER",
      value === null ? "UNAVAILABLE" : "DIRECT_RESOLVED",
      ["magazineCapacity"],
      "rounds",
      value === null ? "capacidade não resolvida" : undefined,
    );
  }

  if (metricId === "reload.effective") {
    const value =
      input.technical[metricId] ??
      input.reload?.effectiveEmptyReloadMs ??
      null;

    return result(
      metricId,
      value,
      "LOWER_IS_BETTER",
      value === null ? "UNAVAILABLE" : "DIRECT_RESOLVED",
      ["reload.effective"],
      "ms",
      value === null ? "recarga efetiva não resolvida" : undefined,
    );
  }

  const value = input.technical[metricId] ?? null;

  return result(
    metricId,
    value,
    directDirection(metricId),
    value === null ? "UNAVAILABLE" : "DIRECT_RESOLVED",
    [metricId],
    undefined,
    value === null ? "métrica não fornecida pelo resolver" : undefined,
  );
}

function damagePerShotAtDistance(
  input: ResolvedBuildMetricInput,
  distanceM: number,
): number | null {
  if (!input.damageCurve) return null;
  const perProjectile = damageAtDistance(input.damageCurve, distanceM);
  if (perProjectile === null) return null;

  const count = input.projectileCount ?? 1;
  const body = input.bodyMultiplier ?? 1;

  if (!Number.isInteger(count) || count <= 0 || !Number.isFinite(body)) {
    return null;
  }

  return perProjectile * count * body;
}

export function ttkAtDistance(
  input: ResolvedBuildMetricInput,
  distanceM: number,
): MetricResult {
  const metricId = `ttk.${distanceM}m`;
  const damage = damagePerShotAtDistance(input, distanceM);
  const health = input.healthBaseline ?? 100;

  if (damage === null || !input.cadence) {
    return result(
      metricId,
      null,
      "LOWER_IS_BETTER",
      "UNAVAILABLE",
      ["damageCurve", "cadence"],
      "ms",
      "dano ou cadência indisponível",
    );
  }

  const btk = shotsToKill(damage, health, 1);
  if (btk === null) {
    return result(
      metricId,
      null,
      "LOWER_IS_BETTER",
      "UNAVAILABLE",
      ["damageCurve"],
      "ms",
      "não foi possível calcular BTK",
    );
  }

  const ttk = firingTimeForShotsMs(input.cadence, btk);

  return result(
    metricId,
    ttk,
    "LOWER_IS_BETTER",
    ttk === null ? "UNAVAILABLE" : "DERIVED_EXACT",
    ["damageCurve", "cadence"],
    "ms",
    ttk === null
      ? "ciclo entre disparos não resolvido para esta arma/configuração"
      : undefined,
    { bulletsOrShotsToKill: btk, distanceM },
  );
}

function meanMetric(
  metricId: string,
  values: readonly number[],
  direction: MetricDirection,
  dependencies: string[],
  unit?: string,
): MetricResult {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    return result(
      metricId,
      null,
      direction,
      "UNAVAILABLE",
      dependencies,
      unit,
      "amostras incompletas",
    );
  }

  return result(
    metricId,
    values.reduce((sum, value) => sum + value, 0) / values.length,
    direction,
    "DERIVED_EXACT",
    dependencies,
    unit,
  );
}

function weightedMeanTtk(
  input: ResolvedBuildMetricInput,
  metricId: string,
  samples: readonly { distanceM: number; weight: number }[],
): MetricResult {
  let weighted = 0;
  let totalWeight = 0;

  for (const sample of samples) {
    const ttk = ttkAtDistance(input, sample.distanceM);
    if (ttk.value === null) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "UNAVAILABLE",
        samples.map((x) => `ttk.${x.distanceM}m`),
        "ms",
        `TTK indisponível em ${sample.distanceM} m`,
      );
    }

    weighted += ttk.value * sample.weight;
    totalWeight += sample.weight;
  }

  return result(
    metricId,
    weighted / totalWeight,
    "LOWER_IS_BETTER",
    "DERIVED_EXACT",
    samples.map((x) => `ttk.${x.distanceM}m`),
    "ms",
    undefined,
    { samples },
  );
}

function sustainedMetric(
  input: ResolvedBuildMetricInput,
  metricId: string,
  windowSeconds: number,
  distanceM: number | undefined,
): MetricResult {
  if (distanceM === undefined) {
    return result(
      metricId,
      null,
      "HIGHER_IS_BETTER",
      "CONTEXT_REQUIRED",
      [
        "damageCurve",
        "cadence",
        "magazineCapacity",
        "reload.effective",
      ],
      "damage",
      "referenceDistanceM é obrigatório",
    );
  }

  const damage = damagePerShotAtDistance(input, distanceM);
  const capacity = input.magazineCapacity;
  const reloadMs = input.reload?.effectiveEmptyReloadMs;

  if (
    damage === null ||
    !input.cadence ||
    !Number.isInteger(capacity) ||
    capacity === undefined ||
    reloadMs === undefined
  ) {
    return result(
      metricId,
      null,
      "HIGHER_IS_BETTER",
      "UNAVAILABLE",
      [
        "damageCurve",
        "cadence",
        "magazineCapacity",
        "reload.effective",
      ],
      "damage",
      "dados insuficientes para sustained output",
    );
  }

  const output = sustainedOutput(
    windowSeconds * 1000,
    damage,
    input.cadence,
    capacity,
    reloadMs,
  );

  return result(
    metricId,
    output?.damage ?? null,
    "HIGHER_IS_BETTER",
    output ? "DERIVED_EXACT" : "UNAVAILABLE",
    [
      "damageCurve",
      "cadence",
      "magazineCapacity",
      "reload.effective",
    ],
    "damage",
    output ? undefined : "não foi possível simular a janela",
    output ? { ...output, distanceM, windowSeconds } : undefined,
  );
}

function followUpMetric(
  input: ResolvedBuildMetricInput,
): MetricResult {
  const mechanical = input.cadence
    ? firstMechanicalFollowUpMs(input.cadence)
    : null;

  if (mechanical === null) {
    return result(
      "followUpSpeed",
      null,
      "LOWER_IS_BETTER",
      "UNAVAILABLE",
      ["cadence", "recovery"],
      "ms",
      "intervalo mecânico não resolvido",
    );
  }

  const recoilReady = input.recovery?.recoilReadyMs ?? 0;
  const spreadReady = input.recovery?.spreadReadyMs ?? 0;

  return result(
    "followUpSpeed",
    Math.max(mechanical, recoilReady, spreadReady),
    "LOWER_IS_BETTER",
    "MODELED_TRANSPARENT",
    ["cadence", "recovery.recoilReadyMs", "recovery.spreadReadyMs"],
    "ms",
    undefined,
    {
      mechanicalMs: mechanical,
      recoilReadyMs: recoilReady,
      spreadReadyMs: spreadReady,
      formula: "max(mechanical, recoilReady, spreadReady)",
    },
  );
}

function shotgunLethalityMetric(
  input: ResolvedBuildMetricInput,
  metricId: string,
  distances: readonly number[],
): MetricResult {
  const shots: number[] = [];

  for (const distanceM of distances) {
    const sample = shotgunLethalityAtDistance(input, distanceM);
    if (sample?.theoreticalShotsToKill === null || !sample) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "UNAVAILABLE",
        ["damageCurve", "projectileCount"],
        "shots",
        `letalidade indisponível em ${distanceM} m`,
      );
    }
    shots.push(sample.theoreticalShotsToKill);
  }

  return meanMetric(
    metricId,
    shots,
    "LOWER_IS_BETTER",
    distances.map((d) => `shotgunLethality.${d}m`),
    "shots",
  );
}

function oneShotConsistency(
  input: ResolvedBuildMetricInput,
  distances: readonly number[],
): MetricResult {
  const margins: number[] = [];

  for (const distanceM of distances) {
    const sample = shotgunLethalityAtDistance(input, distanceM);
    if (!sample || sample.oneShotMargin === null) {
      return result(
        "oneShotConsistency",
        null,
        "HIGHER_IS_BETTER",
        "UNAVAILABLE",
        ["damageCurve", "projectileCount"],
        "projectiles",
        `margem indisponível em ${distanceM} m`,
      );
    }
    margins.push(sample.oneShotMargin);
  }

  return meanMetric(
    "oneShotConsistency",
    margins,
    "HIGHER_IS_BETTER",
    distances.map((d) => `oneShotMargin.${d}m`),
    "projectiles",
  );
}

function meanShotsToKillProfile(
  input: ResolvedBuildMetricInput,
  metricId: string,
  distances: readonly number[],
): MetricResult {
  const values: number[] = [];

  for (const distanceM of distances) {
    const damage = damagePerShotAtDistance(input, distanceM);
    if (damage === null) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "UNAVAILABLE",
        ["damageCurve"],
        "shots",
        `dano indisponível em ${distanceM} m`,
      );
    }

    const stk = shotsToKill(
      damage,
      input.healthBaseline ?? 100,
      1,
    );

    if (stk === null) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "UNAVAILABLE",
        ["damageCurve"],
        "shots",
        `STK indisponível em ${distanceM} m`,
      );
    }

    values.push(stk);
  }

  return meanMetric(
    metricId,
    values,
    "LOWER_IS_BETTER",
    distances.map((d) => `shotsToKill.${d}m`),
    "shots",
  );
}

function modeledComposite(
  input: ResolvedBuildMetricInput,
  metricId: string,
): MetricResult | null {
  if (!input.normalized) return null;

  if (metricId === "shotgunAccuracy.aggregate") {
    const recipe =
      input.projectileType === "MULTI_PROJECTILE"
        ? COMPOSITE_RECIPES["shotgunAccuracy.multi"]
        : COMPOSITE_RECIPES["shotgunAccuracy.single"];

    return weightedNormalizedComposite(
      metricId,
      input.normalized,
      recipe,
    );
  }

  if (metricId === "pelletGrouping") {
    return weightedNormalizedComposite(
      metricId,
      input.normalized,
      [
        { metricId: "spread.ads.stand", weight: 65 },
        { metricId: "spread.hip.stand", weight: 35 },
      ],
    );
  }

  if (metricId === "accurateFollowUpOutput.8s") {
    return weightedNormalizedComposite(
      metricId,
      input.normalized,
      [
        { metricId: "sustainedOutput.8s", weight: 60 },
        { metricId: "followUpSpeed", weight: 40 },
      ],
    );
  }

  const recipe = COMPOSITE_RECIPES[metricId];
  if (!recipe) return null;

  return weightedNormalizedComposite(
    metricId,
    input.normalized,
    recipe,
  );
}

export function deriveMetric(
  input: ResolvedBuildMetricInput,
  metricId: string,
  context: DerivedMetricContext = {},
): MetricResult {
  // Distância explícita: ttk.20m etc.
  const ttkMatch = /^ttk\.(\d+(?:\.\d+)?)m$/.exec(metricId);
  if (ttkMatch) {
    return ttkAtDistance(input, Number(ttkMatch[1]));
  }

  // Grupos de TTK com pesos transparentes.
  if (metricId === "ttk.close.5-30m") {
    return weightedMeanTtk(input, metricId, [
      { distanceM: 5, weight: 10 },
      { distanceM: 10, weight: 25 },
      { distanceM: 20, weight: 40 },
      { distanceM: 30, weight: 25 },
    ]);
  }

  if (metricId === "ttk.long.40-120m") {
    return weightedMeanTtk(input, metricId, [
      { distanceM: 40, weight: 10 },
      { distanceM: 60, weight: 20 },
      { distanceM: 80, weight: 30 },
      { distanceM: 100, weight: 25 },
      { distanceM: 120, weight: 15 },
    ]);
  }

  if (metricId === "ttk.3-10m") {
    return weightedMeanTtk(input, metricId, [
      { distanceM: 3, weight: 1 },
      { distanceM: 5, weight: 1 },
      { distanceM: 10, weight: 1 },
    ]);
  }

  if (metricId === "ttk.15-20m") {
    return weightedMeanTtk(input, metricId, [
      { distanceM: 15, weight: 1 },
      { distanceM: 20, weight: 1 },
    ]);
  }

  if (metricId === "followUpSpeed") {
    return followUpMetric(input);
  }

  if (metricId === "damagePerMagazine") {
    const distanceM = context.referenceDistanceM;

    if (distanceM === undefined) {
      return result(
        metricId,
        null,
        "HIGHER_IS_BETTER",
        "CONTEXT_REQUIRED",
        ["damageCurve", "magazineCapacity"],
        "damage",
        "referenceDistanceM é obrigatório",
      );
    }

    const damage = damagePerShotAtDistance(input, distanceM);
    const capacity = input.magazineCapacity;

    if (
      damage === null ||
      capacity === undefined ||
      !Number.isInteger(capacity) ||
      capacity <= 0
    ) {
      return result(
        metricId,
        null,
        "HIGHER_IS_BETTER",
        "UNAVAILABLE",
        ["damageCurve", "magazineCapacity"],
        "damage",
        "dados insuficientes",
      );
    }

    return result(
      metricId,
      damage * capacity,
      "HIGHER_IS_BETTER",
      "DERIVED_EXACT",
      ["damageCurve", "magazineCapacity"],
      "damage",
      undefined,
      { distanceM },
    );
  }

  const sustainedMatch =
    /^(?:sustainedOutput|secondarySustainedOutput|shotgunSustainedOutput)\.(\d+)s(?:\.(\d+)m)?$/.exec(metricId);

  if (sustainedMatch) {
    const windowSeconds = Number(sustainedMatch[1]);
    const fixedDistance = sustainedMatch[2]
      ? Number(sustainedMatch[2])
      : undefined;

    return sustainedMetric(
      input,
      metricId,
      windowSeconds,
      fixedDistance ?? context.referenceDistanceM,
    );
  }

  const shotgunPoint =
    /^shotgunLethality\.(\d+)m$/.exec(metricId);

  if (shotgunPoint) {
    return shotgunLethalityMetric(
      input,
      metricId,
      [Number(shotgunPoint[1])],
    );
  }

  if (metricId === "shotgunLethality.3-10m") {
    return shotgunLethalityMetric(input, metricId, [3, 5, 10]);
  }

  if (metricId === "shotgunLethality.15-20m") {
    return shotgunLethalityMetric(input, metricId, [15, 20]);
  }

  if (metricId === "oneShotConsistency") {
    return oneShotConsistency(
      input,
      context.distanceSamplesM ?? [3, 5, 10],
    );
  }

  if (metricId === "shotgunRangeBreakpoints") {
    const samples =
      context.distanceSamplesM ?? [20, 25, 30, 40, 50];

    const distance = farthestSampledOneShotDistance(input, samples);

    return result(
      metricId,
      distance ?? 0,
      "HIGHER_IS_BETTER",
      "DERIVED_EXACT",
      ["damageCurve", "projectileCount"],
      "m",
      undefined,
      { samples, interpretation: "farthest sampled one-shot distance" },
    );
  }

  if (metricId === "lethalityProfile") {
    const samples =
      context.distanceSamplesM ?? [50, 75, 100, 125, 150, 200];

    return meanShotsToKillProfile(
      input,
      metricId,
      samples,
    );
  }

  if (
    metricId === "lethality.close" ||
    metricId === "hipfireLethality.aggregate"
  ) {
    const samples = context.distanceSamplesM ?? [5, 10, 15];
    const values: number[] = [];

    for (const d of samples) {
      const ttk = ttkAtDistance(input, d);
      if (ttk.value === null) {
        return result(
          metricId,
          null,
          "LOWER_IS_BETTER",
          "UNAVAILABLE",
          samples.map((x) => `ttk.${x}m`),
          "ms",
          `TTK indisponível em ${d} m`,
        );
      }
      values.push(ttk.value);
    }

    return meanMetric(
      metricId,
      values,
      "LOWER_IS_BETTER",
      samples.map((d) => `ttk.${d}m`),
      "ms",
    );
  }

  if (metricId === "timeToFirstDamage") {
    const distanceM =
      context.engagementDistanceM ??
      context.referenceDistanceM;

    if (distanceM === undefined) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "CONTEXT_REQUIRED",
        ["handling.drawTime", "handling.adsTime", "timeToImpact"],
        "ms",
        "engagementDistanceM é obrigatório",
      );
    }

    const draw = input.technical["handling.drawTime"];
    const ads =
      context.aimMode === "ADS"
        ? input.technical["handling.adsTime"]
        : 0;
    const flight =
      input.projectileVelocityMps !== undefined
        ? timeToImpactMs(
            distanceM,
            input.projectileVelocityMps,
            input.dragPerMeter ?? 0,
          )
        : null;

    if (
      draw === null ||
      draw === undefined ||
      ads === null ||
      ads === undefined ||
      flight === null
    ) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "UNAVAILABLE",
        ["handling.drawTime", "handling.adsTime", "timeToImpact"],
        "ms",
        "dados de saque/ADS/voo incompletos",
      );
    }

    return result(
      metricId,
      draw + ads + flight,
      "LOWER_IS_BETTER",
      "MODELED_TRANSPARENT",
      ["handling.drawTime", "handling.adsTime", "timeToImpact"],
      "ms",
      undefined,
      { distanceM, aimMode: context.aimMode ?? "HIP" },
    );
  }

  if (metricId === "emergencyEngagementTime") {
    const distanceM =
      context.engagementDistanceM ??
      context.referenceDistanceM;

    if (distanceM === undefined) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "CONTEXT_REQUIRED",
        ["timeToFirstDamage", "ttk"],
        "ms",
        "engagementDistanceM é obrigatório",
      );
    }

    const first = deriveMetric(input, "timeToFirstDamage", {
      ...context,
      engagementDistanceM: distanceM,
    });
    const ttk = ttkAtDistance(input, distanceM);

    if (first.value === null || ttk.value === null) {
      return result(
        metricId,
        null,
        "LOWER_IS_BETTER",
        "UNAVAILABLE",
        ["timeToFirstDamage", `ttk.${distanceM}m`],
        "ms",
        "componentes indisponíveis",
      );
    }

    return result(
      metricId,
      first.value + ttk.value,
      "LOWER_IS_BETTER",
      "MODELED_TRANSPARENT",
      ["timeToFirstDamage", `ttk.${distanceM}m`],
      "ms",
      undefined,
      { distanceM },
    );
  }

  const composite = modeledComposite(input, metricId);
  if (composite) return composite;

  return directResolvedMetric(input, metricId);
}
