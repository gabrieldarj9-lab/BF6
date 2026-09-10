import type {
  CandidateScore,
  NormalizedBuildCandidate,
  PriorityProfile,
} from "./types";
import { scoreProfile } from "./score-profile";
import { calculateNegativeImpact } from "./negative-impact";
import { evaluateGuardrails } from "./guardrails";

export function evaluateCandidate(
  candidate: NormalizedBuildCandidate,
  baseline: NormalizedBuildCandidate,
  primaryProfile: PriorityProfile,
): CandidateScore {
  const primary = scoreProfile(candidate, primaryProfile);
  const negativeImpact = calculateNegativeImpact(
    candidate,
    baseline,
    primaryProfile,
  );
  const guardrails = evaluateGuardrails(
    candidate,
    baseline,
    primaryProfile,
  );

  return {
    candidateId: candidate.id,
    scorable: primary.score !== null,
    rejected: !guardrails.passed,
    primaryScore: primary.score,
    primaryBreakdown: primary.breakdown,
    negativeImpactScore: negativeImpact.score,
    collateralLosses: negativeImpact.losses,
    guardrailFailures: guardrails.failures,
    missingPrimaryMetrics: primary.missingMetrics,
    missingProtectedMetrics: negativeImpact.missingMetrics,
    totalCost: candidate.totalCost,
  };
}

export function addSecondaryScore(
  score: CandidateScore,
  candidate: NormalizedBuildCandidate,
  secondaryProfile: PriorityProfile,
): CandidateScore {
  const secondary = scoreProfile(candidate, secondaryProfile);

  return {
    ...score,
    secondaryScore: secondary.score,
    secondaryBreakdown: secondary.breakdown,
  };
}
