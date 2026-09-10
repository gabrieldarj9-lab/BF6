import type {
  AttachmentEffect,
  MetricResolutionRule,
  ResolvedBuildState,
  ResolverAttachment,
  ResolverDiagnostic,
  ResolverWeapon,
} from "./types";

function clampIndex(index: number, table: readonly number[]): number {
  return Math.max(0, Math.min(table.length - 1, Math.round(index)));
}

function resolveDirect(
  metricId: string,
  base: number | null | undefined,
  effects: readonly AttachmentEffect[],
  diagnostics: ResolverDiagnostic[],
): number | null {
  if (base === null || base === undefined || !Number.isFinite(base)) {
    diagnostics.push({
      metricId,
      code: "MISSING_BASE_VALUE",
      message: `No finite base value for ${metricId}.`,
    });
    return null;
  }

  if (effects.some((effect) =>
    effect.operation === "TIER_MOD" || effect.operation === "TIER_SHIFT"
  )) {
    diagnostics.push({
      metricId,
      code: "UNSUPPORTED_TIER_EFFECT",
      message: `Tier effect exists for ${metricId}, but no tier-aware resolution rule is configured.`,
    });
    return null;
  }

  const setValues = effects
    .filter((effect) => effect.operation === "SET")
    .map((effect) => effect.value);

  if (new Set(setValues).size > 1) {
    diagnostics.push({
      metricId,
      code: "MULTIPLE_SET_VALUES",
      message: `Conflicting SET values for ${metricId}.`,
    });
    return null;
  }

  let value = setValues.length ? setValues[0] : base;

  for (const effect of effects) {
    if (effect.operation === "MULTIPLY") value *= effect.value;
  }

  for (const effect of effects) {
    if (effect.operation === "ADD") value += effect.value;
  }

  return Number.isFinite(value) ? value : null;
}

function resolveIndexed(
  metricId: string,
  rule: Extract<MetricResolutionRule, { kind: "INDEXED" }>,
  effects: readonly AttachmentEffect[],
  diagnostics: ResolverDiagnostic[],
): number | null {
  if (!rule.table.length || !Number.isFinite(rule.baseIndex)) {
    diagnostics.push({
      metricId,
      code: "INVALID_INDEXED_RULE",
      message: `Invalid indexed rule for ${metricId}.`,
    });
    return null;
  }

  const tierMod = effects
    .filter((effect) => effect.operation === "TIER_MOD")
    .reduce((sum, effect) => sum + effect.value, 0);

  const tierShift = effects
    .filter((effect) => effect.operation === "TIER_SHIFT")
    .reduce((sum, effect) => sum + effect.value, 0);

  const index =
    rule.baseIndex +
    rule.tierModCoefficient * tierMod +
    rule.tierShiftCoefficient * tierShift;

  let value = rule.table[clampIndex(index, rule.table)];

  const setValues = effects
    .filter((effect) => effect.operation === "SET")
    .map((effect) => effect.value);

  if (new Set(setValues).size > 1) {
    diagnostics.push({
      metricId,
      code: "MULTIPLE_SET_VALUES",
      message: `Conflicting SET values for ${metricId}.`,
    });
    return null;
  }

  if (setValues.length) value = setValues[0];

  for (const effect of effects) {
    if (effect.operation === "MULTIPLY") value *= effect.value;
  }
  for (const effect of effects) {
    if (effect.operation === "ADD") value += effect.value;
  }

  return Number.isFinite(value) ? value : null;
}

function resolveVelocityTier(
  metricId: string,
  base: number | null | undefined,
  rule: Extract<MetricResolutionRule, { kind: "VELOCITY_TIER" }>,
  effects: readonly AttachmentEffect[],
  diagnostics: ResolverDiagnostic[],
): number | null {
  if (base === null || base === undefined || !Number.isFinite(base)) {
    diagnostics.push({
      metricId,
      code: "MISSING_BASE_VALUE",
      message: `No finite base velocity for ${metricId}.`,
    });
    return null;
  }

  const tierMod = effects
    .filter((effect) => effect.operation === "TIER_MOD")
    .reduce((sum, effect) => sum + effect.value, 0);

  let value = base * Math.pow(rule.factorBase ?? 0.8, -tierMod);

  const setValues = effects
    .filter((effect) => effect.operation === "SET")
    .map((effect) => effect.value);
  if (new Set(setValues).size > 1) {
    diagnostics.push({
      metricId,
      code: "MULTIPLE_SET_VALUES",
      message: `Conflicting SET values for ${metricId}.`,
    });
    return null;
  }
  if (setValues.length) value = setValues[0];

  for (const effect of effects) {
    if (effect.operation === "MULTIPLY") value *= effect.value;
  }
  for (const effect of effects) {
    if (effect.operation === "ADD") value += effect.value;
  }

  return Number.isFinite(value) ? value : null;
}

function resolveReloadTier(
  metricId: string,
  base: number | null | undefined,
  rule: Extract<MetricResolutionRule, { kind: "RELOAD_TIER" }>,
  effects: readonly AttachmentEffect[],
  diagnostics: ResolverDiagnostic[],
): number | null {
  if (base === null || base === undefined || !Number.isFinite(base)) {
    diagnostics.push({
      metricId,
      code: "MISSING_BASE_VALUE",
      message: `No finite base reload value for ${metricId}.`,
    });
    return null;
  }

  const tier = effects
    .filter((effect) => effect.operation === "TIER_MOD")
    .reduce((sum, effect) => sum + effect.value, 0);

  const multipliers = rule.tierMultipliers ?? { 0: 1, 1: 1.13, 2: 1.277 };
  const tierMultiplier = multipliers[tier];

  if (tierMultiplier === undefined) {
    diagnostics.push({
      metricId,
      code: "INVALID_INDEXED_RULE",
      message: `No reload multiplier configured for tier ${tier}.`,
    });
    return null;
  }

  let value = base / tierMultiplier;

  const setValues = effects
    .filter((effect) => effect.operation === "SET")
    .map((effect) => effect.value);
  if (new Set(setValues).size > 1) {
    diagnostics.push({
      metricId,
      code: "MULTIPLE_SET_VALUES",
      message: `Conflicting SET values for ${metricId}.`,
    });
    return null;
  }
  if (setValues.length) value = setValues[0];

  for (const effect of effects) {
    if (effect.operation === "MULTIPLY") value *= effect.value;
  }
  for (const effect of effects) {
    if (effect.operation === "ADD") value += effect.value;
  }

  return Number.isFinite(value) ? value : null;
}

export function resolveBuildState(
  weapon: ResolverWeapon,
  allAttachments: readonly ResolverAttachment[],
  selectedAttachmentIds: readonly string[],
): ResolvedBuildState {
  const diagnostics: ResolverDiagnostic[] = [];
  const attachmentById = new Map(allAttachments.map((attachment) => [attachment.id, attachment]));
  const selected = [...selectedAttachmentIds].sort();

  const effectsByMetric = new Map<string, AttachmentEffect[]>();

  for (const id of selected) {
    const attachment = attachmentById.get(id);
    if (!attachment) {
      diagnostics.push({
        metricId: "__ATTACHMENT__",
        code: "UNKNOWN_ATTACHMENT",
        message: `Unknown attachment ${id}.`,
      });
      continue;
    }

    for (const effect of attachment.effects) {
      const bucket = effectsByMetric.get(effect.metricId) ?? [];
      bucket.push(effect);
      effectsByMetric.set(effect.metricId, bucket);
    }
  }

  const metricIds = new Set<string>([
    ...Object.keys(weapon.baseTechnical),
    ...Object.keys(weapon.resolutionRules ?? {}),
    ...effectsByMetric.keys(),
  ]);

  const technical: Record<string, number | null> = {};

  for (const metricId of [...metricIds].sort()) {
    const base = weapon.baseTechnical[metricId];
    const effects = effectsByMetric.get(metricId) ?? [];
    const rule = weapon.resolutionRules?.[metricId] ?? { kind: "DIRECT" as const };

    if (rule.kind === "DIRECT") {
      technical[metricId] = resolveDirect(metricId, base, effects, diagnostics);
    } else if (rule.kind === "INDEXED") {
      technical[metricId] = resolveIndexed(metricId, rule, effects, diagnostics);
    } else if (rule.kind === "VELOCITY_TIER") {
      technical[metricId] = resolveVelocityTier(metricId, base, rule, effects, diagnostics);
    } else {
      technical[metricId] = resolveReloadTier(metricId, base, rule, effects, diagnostics);
    }
  }

  return {
    weaponId: weapon.id,
    attachmentIds: selected,
    technical,
    diagnostics,
  };
}
