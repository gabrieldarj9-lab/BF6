import type {
  CollateralLossItem,
  NormalizedBuildCandidate,
  PriorityProfile,
} from "./types";

export interface NegativeImpactResult {
  score: number;
  totalRawLoss: number;
  losses: CollateralLossItem[];
  missingMetrics: string[];
}

export function calculateNegativeImpact(
  candidate: NormalizedBuildCandidate,
  baseline: NormalizedBuildCandidate,
  profile: PriorityProfile,
): NegativeImpactResult {
  const losses: CollateralLossItem[] = [];
  const missingMetrics: string[] = [];

  let score = 0;
  let totalRawLoss = 0;

  for (const rule of profile.protectedMetrics) {
    const candidateMetric = candidate.metrics[rule.metricId];
    const baselineMetric = baseline.metrics[rule.metricId];

    if (
      !candidateMetric ||
      !baselineMetric ||
      candidateMetric.normalizedValue === null ||
      baselineMetric.normalizedValue === null
    ) {
      missingMetrics.push(rule.metricId);
      continue;
    }

    const loss = Math.max(
      0,
      baselineMetric.normalizedValue -
        candidateMetric.normalizedValue,
    );

    if (loss <= 0) continue;

    const penaltyWeight = rule.penaltyWeight ?? 1;
    const weightedLoss = loss * penaltyWeight;

    totalRawLoss += loss;
    score += weightedLoss;

    losses.push({
      metricId: rule.metricId,
      baselineValue: baselineMetric.normalizedValue,
      candidateValue: candidateMetric.normalizedValue,
      loss,
      penaltyWeight,
      weightedLoss,
      exceedsSoftStart:
        loss > profile.defaults.softCollateralLossStart,
    });
  }

  return {
    score,
    totalRawLoss,
    losses,
    missingMetrics,
  };
}
