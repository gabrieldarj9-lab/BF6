import type {
  GuardrailFailure,
  NormalizedBuildCandidate,
  PriorityProfile,
} from "./types";
import { calculateNegativeImpact } from "./negative-impact";

export interface GuardrailEvaluation {
  passed: boolean;
  failures: GuardrailFailure[];
}

export function evaluateGuardrails(
  candidate: NormalizedBuildCandidate,
  baseline: NormalizedBuildCandidate,
  profile: PriorityProfile,
): GuardrailEvaluation {
  const failures: GuardrailFailure[] = [];

  for (const protectedRule of profile.protectedMetrics) {
    const candidateMetric = candidate.metrics[protectedRule.metricId];
    const baselineMetric = baseline.metrics[protectedRule.metricId];

    if (
      !candidateMetric ||
      !baselineMetric ||
      candidateMetric.normalizedValue === null ||
      baselineMetric.normalizedValue === null
    ) {
      continue;
    }

    const loss = Math.max(
      0,
      baselineMetric.normalizedValue -
        candidateMetric.normalizedValue,
    );

    if (loss > protectedRule.maxAllowedLoss) {
      failures.push({
        metricId: protectedRule.metricId,
        rule: "PROTECTED_MAX_LOSS",
        actual: loss,
        threshold: protectedRule.maxAllowedLoss,
      });
    }
  }

  for (const guardrail of profile.guardrails ?? []) {
    const candidateMetric = candidate.metrics[guardrail.metricId];
    const baselineMetric = baseline.metrics[guardrail.metricId];

    if (
      !candidateMetric ||
      candidateMetric.normalizedValue === null
    ) {
      continue;
    }

    if (guardrail.mode === "MIN_VALUE") {
      if (candidateMetric.normalizedValue < guardrail.threshold) {
        failures.push({
          metricId: guardrail.metricId,
          rule: "MIN_VALUE",
          actual: candidateMetric.normalizedValue,
          threshold: guardrail.threshold,
          note: guardrail.note,
        });
      }
      continue;
    }

    if (guardrail.mode === "MAX_VALUE") {
      if (candidateMetric.normalizedValue > guardrail.threshold) {
        failures.push({
          metricId: guardrail.metricId,
          rule: "MAX_VALUE",
          actual: candidateMetric.normalizedValue,
          threshold: guardrail.threshold,
          note: guardrail.note,
        });
      }
      continue;
    }

    if (
      guardrail.mode === "MAX_LOSS" &&
      baselineMetric?.normalizedValue !== null &&
      baselineMetric?.normalizedValue !== undefined
    ) {
      const loss = Math.max(
        0,
        baselineMetric.normalizedValue -
          candidateMetric.normalizedValue,
      );

      if (loss > guardrail.threshold) {
        failures.push({
          metricId: guardrail.metricId,
          rule: "MAX_LOSS",
          actual: loss,
          threshold: guardrail.threshold,
          note: guardrail.note,
        });
      }
    }
  }

  const negativeImpact = calculateNegativeImpact(
    candidate,
    baseline,
    profile,
  );

  if (
    negativeImpact.score >
    profile.defaults.hardTotalCollateralLoss
  ) {
    failures.push({
      metricId: "__TOTAL_COLLATERAL__",
      rule: "HARD_TOTAL_COLLATERAL_LOSS",
      actual: negativeImpact.score,
      threshold: profile.defaults.hardTotalCollateralLoss,
    });
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
