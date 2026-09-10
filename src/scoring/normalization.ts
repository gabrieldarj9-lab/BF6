import type {
  BuildCandidate,
  MetricNormalizationRule,
  NormalizedBuildCandidate,
  NormalizedMetricValue,
  RawMetricValue,
} from "./types";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function normalizeMetric(
  metric: RawMetricValue,
  rule: MetricNormalizationRule | undefined,
): NormalizedMetricValue {
  if (metric.value === null || !Number.isFinite(metric.value)) {
    return {
      metricId: metric.metricId,
      rawValue: metric.value,
      normalizedValue: null,
      evidence: metric.evidence,
      normalizationStatus: "MISSING_VALUE",
      rule,
    };
  }

  if (!rule) {
    return {
      metricId: metric.metricId,
      rawValue: metric.value,
      normalizedValue: null,
      evidence: metric.evidence,
      normalizationStatus: "MISSING_RULE",
    };
  }

  if (rule.mode === "PASSTHROUGH_0_100") {
    return {
      metricId: metric.metricId,
      rawValue: metric.value,
      normalizedValue: Math.max(0, Math.min(100, metric.value)),
      evidence: metric.evidence,
      normalizationStatus: "OK",
      rule,
    };
  }

  if (
    rule.min === undefined ||
    rule.max === undefined ||
    !Number.isFinite(rule.min) ||
    !Number.isFinite(rule.max) ||
    rule.max <= rule.min
  ) {
    return {
      metricId: metric.metricId,
      rawValue: metric.value,
      normalizedValue: null,
      evidence: metric.evidence,
      normalizationStatus: "INVALID_RULE",
      rule,
    };
  }

  const direction = rule.direction ?? metric.direction;
  const raw01 = clamp01(
    (metric.value - rule.min) / (rule.max - rule.min),
  );

  const utility01 =
    direction === "HIGHER_IS_BETTER"
      ? raw01
      : 1 - raw01;

  return {
    metricId: metric.metricId,
    rawValue: metric.value,
    normalizedValue: utility01 * 100,
    evidence: metric.evidence,
    normalizationStatus: "OK",
    rule,
  };
}

export function normalizeCandidate(
  candidate: BuildCandidate,
  rules: Readonly<Record<string, MetricNormalizationRule>>,
): NormalizedBuildCandidate {
  const metrics: Record<string, NormalizedMetricValue> = {};

  for (const [metricId, metric] of Object.entries(candidate.metrics)) {
    metrics[metricId] = normalizeMetric(metric, rules[metricId]);
  }

  return {
    id: candidate.id,
    weaponId: candidate.weaponId,
    attachmentIds: candidate.attachmentIds,
    totalCost: candidate.totalCost,
    metrics,
  };
}

export function normalizeCandidates(
  candidates: readonly BuildCandidate[],
  rules: Readonly<Record<string, MetricNormalizationRule>>,
): NormalizedBuildCandidate[] {
  return candidates.map((candidate) =>
    normalizeCandidate(candidate, rules),
  );
}
