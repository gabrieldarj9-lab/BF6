import type {
  NormalizedBuildCandidate,
  PriorityProfile,
  ScoreBreakdownItem,
} from "./types";

export interface ProfileScoreResult {
  score: number | null;
  breakdown: ScoreBreakdownItem[];
  missingMetrics: string[];
}

export function scoreProfile(
  candidate: NormalizedBuildCandidate,
  profile: PriorityProfile,
): ProfileScoreResult {
  const breakdown: ScoreBreakdownItem[] = [];
  const missingMetrics: string[] = [];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const rule of profile.primaryMetrics) {
    const metric = candidate.metrics[rule.metricId];

    if (
      !metric ||
      metric.normalizedValue === null ||
      !Number.isFinite(metric.normalizedValue)
    ) {
      missingMetrics.push(rule.metricId);
      continue;
    }

    const contribution =
      metric.normalizedValue * (rule.weight / 100);

    breakdown.push({
      metricId: rule.metricId,
      normalizedValue: metric.normalizedValue,
      weight: rule.weight,
      contribution,
      evidence: metric.evidence,
    });

    weightedSum += contribution;
    totalWeight += rule.weight;
  }

  /**
   * V1 é estrita:
   * se uma métrica primária não está disponível, não renormalizamos os pesos.
   * Isso evita que uma build ganhe porque "faltou" justamente uma métrica ruim.
   */
  if (missingMetrics.length > 0 || totalWeight <= 0) {
    return {
      score: null,
      breakdown,
      missingMetrics,
    };
  }

  return {
    score: weightedSum,
    breakdown,
    missingMetrics,
  };
}
