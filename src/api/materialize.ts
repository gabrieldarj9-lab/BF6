import type { CandidateConfiguration } from "../candidate/types";
import { deriveMetric } from "../metrics/derive-metrics";
import { classifyMetricSupport } from "../metrics/metric-support";
import { COMPOSITE_RECIPES } from "../metrics/composites";
import type { DerivedMetricContext, MetricResult, ResolvedBuildMetricInput } from "../metrics/types";
import { resolveBuildState } from "../resolver/resolve-build";
import type { ResolverAttachment } from "../resolver/types";
import { normalizeCandidate } from "../scoring/normalization";
import type {
  BuildCandidate,
  MetricDirection,
  MetricNormalizationRule,
  NormalizedBuildCandidate,
  PriorityProfile,
  RawMetricValue,
} from "../scoring/types";
import type { ProgressionBuild } from "../progression/types";
import type { EngineAttachment, EngineWeaponDefinition } from "./types";

const SPECIAL_COMPOSITE_DEPENDENCIES: Record<string, readonly string[]> = {
  "pelletGrouping": ["spread.ads.stand", "spread.hip.stand"],
  "accurateFollowUpOutput.8s": ["sustainedOutput.8s", "followUpSpeed"],
  "shotgunAccuracy.aggregate": [
    "spread.ads.stand",
    "spread.ads.move",
    "spread.hip.stand",
    "spread.ads.growth",
    "spread.ads.recovery",
    "recoil.ads.variation",
    "recoil.ads.recovery",
    "ballistics.velocity",
    "aim.sway",
  ],
};

function collectProfileMetricIds(
  primary: PriorityProfile,
  secondary?: PriorityProfile,
): Set<string> {
  const ids = new Set<string>();

  for (const metric of primary.primaryMetrics) ids.add(metric.metricId);
  for (const metric of primary.protectedMetrics) ids.add(metric.metricId);
  for (const guardrail of primary.guardrails ?? []) ids.add(guardrail.metricId);
  for (const metric of secondary?.primaryMetrics ?? []) ids.add(metric.metricId);

  let changed = true;
  while (changed) {
    changed = false;
    for (const metricId of [...ids]) {
      const recipe = COMPOSITE_RECIPES[metricId];
      const dependencies = recipe?.map((term) => term.metricId)
        ?? SPECIAL_COMPOSITE_DEPENDENCIES[metricId]
        ?? [];
      for (const dependency of dependencies) {
        if (!ids.has(dependency)) {
          ids.add(dependency);
          changed = true;
        }
      }
    }
  }

  return ids;
}

function profileMetricIdsOnly(
  primary: PriorityProfile,
  secondary?: PriorityProfile,
): Set<string> {
  const ids = new Set<string>();
  for (const metric of primary.primaryMetrics) ids.add(metric.metricId);
  for (const metric of primary.protectedMetrics) ids.add(metric.metricId);
  for (const guardrail of primary.guardrails ?? []) ids.add(guardrail.metricId);
  for (const metric of secondary?.primaryMetrics ?? []) ids.add(metric.metricId);
  return ids;
}

function metricDirection(
  metricId: string,
  rules: Readonly<Record<string, MetricNormalizationRule>>,
): MetricDirection {
  return rules[metricId]?.direction ?? (
    metricId === "ballistics.velocity" ||
    metricId === "magazine.capacity" ||
    metricId.startsWith("sustainedOutput.") ||
    metricId.startsWith("secondarySustainedOutput.") ||
    metricId.startsWith("shotgunSustainedOutput.") ||
    metricId === "damagePerMagazine" ||
    metricId === "oneShotConsistency" ||
    metricId === "shotgunRangeBreakpoints" ||
    metricId === "pelletGrouping" ||
    metricId === "firstShotQuality" ||
    metricId === "sequenceStability" ||
    metricId === "accuracy.ads" ||
    metricId === "handling.aggregate" ||
    metricId === "mobility.aggregate" ||
    metricId === "hipfire.aggregate" ||
    metricId === "recoil.aggregate" ||
    metricId === "recoil.aggregateVariation" ||
    metricId === "shotgunAccuracy.aggregate" ||
    metricId === "accurateFollowUpOutput.8s"
      ? "HIGHER_IS_BETTER"
      : "LOWER_IS_BETTER"
  );
}

function metricResultToRaw(
  result: MetricResult,
): RawMetricValue {
  return {
    metricId: result.metricId,
    value: result.value,
    direction: result.direction,
    evidence: result.evidence,
    unit: result.unit,
  };
}

function mergeOverride<T>(
  field: string,
  current: T | undefined,
  next: T | undefined,
): T | undefined {
  if (next === undefined) return current;
  if (current === undefined) return next;

  if (JSON.stringify(current) !== JSON.stringify(next)) {
    throw new Error(`Conflicting runtime overrides for ${field}.`);
  }

  return current;
}

export function buildResolvedMetricInput(
  weapon: EngineWeaponDefinition,
  selected: readonly EngineAttachment[],
  technical: Readonly<Record<string, number | null>>,
): ResolvedBuildMetricInput {
  let attachmentDamageCurve: typeof weapon.base.damageCurve | undefined;
  let attachmentProjectileType: typeof weapon.base.projectileType | undefined;
  let attachmentProjectileCount: typeof weapon.base.projectileCount | undefined;
  let attachmentCadence: typeof weapon.base.cadence | undefined;
  let attachmentDrag: typeof weapon.base.dragPerMeter | undefined;

  for (const attachment of [...selected].sort((a, b) => a.id.localeCompare(b.id))) {
    const override = attachment.runtimeOverride;
    if (!override) continue;
    attachmentDamageCurve = mergeOverride("damageCurve", attachmentDamageCurve, override.damageCurve);
    attachmentProjectileType = mergeOverride("projectileType", attachmentProjectileType, override.projectileType);
    attachmentProjectileCount = mergeOverride("projectileCount", attachmentProjectileCount, override.projectileCount);
    attachmentCadence = mergeOverride("cadence", attachmentCadence, override.cadence);
    attachmentDrag = mergeOverride("dragPerMeter", attachmentDrag, override.dragPerMeter);
  }

  let damageCurve = attachmentDamageCurve ?? weapon.base.damageCurve;
  let projectileType = attachmentProjectileType ?? weapon.base.projectileType;
  let projectileCount = attachmentProjectileCount ?? weapon.base.projectileCount;
  let cadence = attachmentCadence ?? weapon.base.cadence;
  let dragPerMeter = attachmentDrag ?? weapon.base.dragPerMeter;

  const damageMultiplier = technical["damage.multiplier"];
  if (damageCurve && damageMultiplier !== undefined && damageMultiplier !== null) {
    damageCurve = damageCurve.map((point) => ({
      ...point,
      damage: point.damage * damageMultiplier,
    }));
  }

  const resolvedRpm = technical["fire.rpm"];
  if (
    cadence?.kind === "STANDARD" &&
    resolvedRpm !== undefined &&
    resolvedRpm !== null &&
    Number.isFinite(resolvedRpm) &&
    resolvedRpm > 0
  ) {
    cadence = { kind: "STANDARD", rpm: resolvedRpm };
  }

  const resolvedCapacity = technical["magazine.capacity"];
  const magazineCapacity =
    resolvedCapacity !== undefined && resolvedCapacity !== null
      ? Math.round(resolvedCapacity)
      : weapon.base.magazineCapacity;

  const resolvedReload = technical["reload.effective"];
  const reload = weapon.base.reload
    ? {
        ...weapon.base.reload,
        effectiveEmptyReloadMs:
          resolvedReload !== undefined && resolvedReload !== null
            ? resolvedReload
            : weapon.base.reload.effectiveEmptyReloadMs,
      }
    : resolvedReload !== undefined && resolvedReload !== null
      ? { kind: "OTHER" as const, effectiveEmptyReloadMs: resolvedReload }
      : undefined;

  const resolvedVelocity = technical["ballistics.velocity"];
  const projectileVelocityMps =
    resolvedVelocity !== undefined && resolvedVelocity !== null
      ? resolvedVelocity
      : weapon.base.projectileVelocityMps;

  return {
    weaponId: weapon.id,
    categoryId: weapon.categoryId,
    healthBaseline: weapon.base.healthBaseline,
    bodyMultiplier: weapon.base.bodyMultiplier,
    damageCurve,
    projectileType,
    projectileCount,
    cadence,
    magazineCapacity,
    reload,
    projectileVelocityMps,
    dragPerMeter,
    technical,
    recovery: {
      recoilReadyMs: technical["recovery.recoilReadyMs"] ?? undefined,
      spreadReadyMs: technical["recovery.spreadReadyMs"] ?? undefined,
    },
  };
}

export interface MaterializedCandidate {
  raw: BuildCandidate;
  normalized: NormalizedBuildCandidate;
  resolvedTechnical: Readonly<Record<string, number | null>>;
  diagnostics: readonly string[];
}

export function materializeCandidate(
  weapon: EngineWeaponDefinition,
  candidate: CandidateConfiguration,
  primary: PriorityProfile,
  secondary: PriorityProfile | undefined,
  normalizationRules: Readonly<Record<string, MetricNormalizationRule>>,
  metricContext: DerivedMetricContext,
): MaterializedCandidate {
  const attachmentById = new Map(weapon.attachments.map((attachment) => [attachment.id, attachment]));
  const selected = candidate.attachmentIds.map((id) => {
    const attachment = attachmentById.get(id);
    if (!attachment) throw new Error(`Unknown attachment ${id}.`);
    return attachment;
  });

  const resolverAttachments: ResolverAttachment[] = weapon.attachments.map((attachment) => ({
    id: attachment.id,
    effects: attachment.effects,
  }));

  const resolved = resolveBuildState(
    {
      id: weapon.id,
      baseTechnical: weapon.base.technical,
      resolutionRules: weapon.base.resolutionRules,
    },
    resolverAttachments,
    candidate.attachmentIds,
  );

  const metricInput = buildResolvedMetricInput(weapon, selected, resolved.technical);
  const allNeeded = collectProfileMetricIds(primary, secondary);
  const finalNeeded = profileMetricIdsOnly(primary, secondary);
  const rawMetrics: Record<string, RawMetricValue> = {};

  // Seed all resolved technical metrics so composites can normalize dependencies.
  for (const [metricId, value] of Object.entries(resolved.technical)) {
    rawMetrics[metricId] = {
      metricId,
      value,
      direction: metricDirection(metricId, normalizationRules),
      evidence: value === null ? "UNAVAILABLE" : "DIRECT_RESOLVED",
    };
  }

  // First pass: physical/contextual/direct metrics. Composites wait for normalization.
  for (const metricId of allNeeded) {
    if (classifyMetricSupport(metricId) === "MODELED_COMPOSITE") continue;
    const derived = deriveMetric(metricInput, metricId, metricContext);
    rawMetrics[metricId] = metricResultToRaw(derived);
  }

  let rawCandidate: BuildCandidate = {
    id: candidate.id,
    weaponId: candidate.weaponId,
    attachmentIds: candidate.attachmentIds,
    totalCost: candidate.totalCost,
    metrics: rawMetrics,
  };

  let normalized = normalizeCandidate(rawCandidate, normalizationRules);

  const normalizedMap: Record<string, number | null | undefined> = {};
  for (const [metricId, metric] of Object.entries(normalized.metrics)) {
    normalizedMap[metricId] = metric.normalizedValue;
  }

  const secondPassInput: ResolvedBuildMetricInput = {
    ...metricInput,
    normalized: normalizedMap,
  };

  for (const metricId of allNeeded) {
    if (classifyMetricSupport(metricId) !== "MODELED_COMPOSITE") continue;
    const derived = deriveMetric(secondPassInput, metricId, metricContext);
    rawMetrics[metricId] = metricResultToRaw(derived);
  }

  rawCandidate = {
    ...rawCandidate,
    metrics: rawMetrics,
  };
  normalized = normalizeCandidate(rawCandidate, normalizationRules);

  const diagnostics = [
    ...resolved.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`),
  ];

  for (const metricId of finalNeeded) {
    const metric = normalized.metrics[metricId];
    if (!metric || metric.normalizedValue === null) {
      diagnostics.push(`UNAVAILABLE_METRIC: ${metricId}`);
    }
  }

  return {
    raw: rawCandidate,
    normalized,
    resolvedTechnical: resolved.technical,
    diagnostics,
  };
}
