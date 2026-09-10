import type {
  CandidateScore,
  NormalizedBuildCandidate,
  PriorityProfile,
  SelectionTrace,
  WinnerSelection,
} from "./types";
import { evaluateCandidate, addSecondaryScore } from "./evaluate-candidate";
import { removeStrictlyDominatedCandidates } from "./domination";

function byId<T extends { candidateId: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) =>
    a.candidateId.localeCompare(b.candidateId),
  );
}

function within(
  value: number,
  best: number,
  threshold: number,
): boolean {
  return best - value <= threshold + 1e-9;
}

export function selectWinner(
  candidates: readonly NormalizedBuildCandidate[],
  baseline: NormalizedBuildCandidate,
  primaryProfile: PriorityProfile,
  secondaryProfile?: PriorityProfile,
): WinnerSelection {
  const initialCandidateIds = candidates.map((c) => c.id);

  const dominance = removeStrictlyDominatedCandidates(
    candidates,
    primaryProfile,
    secondaryProfile,
  );

  const candidateById = new Map(
    dominance.remaining.map((c) => [c.id, c]),
  );

  let scores = dominance.remaining.map((candidate) =>
    evaluateCandidate(candidate, baseline, primaryProfile),
  );

  const scorable = scores.filter(
    (score) => score.scorable && score.primaryScore !== null,
  );

  if (!scorable.length) {
    const trace: SelectionTrace = {
      initialCandidateIds,
      dominatedCandidateIds: dominance.dominatedIds,
      guardrailRejectedIds: [],
      primaryBestScore: null,
      primaryEquivalentIds: [],
      secondaryApplied: false,
      secondarySkippedReason: "nenhum candidato pontuável",
      cheapestIds: [],
      lowestNegativeImpactIds: [],
      deterministicWinnerId: null,
    };

    return {
      winner: null,
      scores: byId(scores),
      trace,
      status: "NO_SCORABLE_CANDIDATE",
    };
  }

  const accepted = scorable.filter((score) => !score.rejected);
  const guardrailRejectedIds = scorable
    .filter((score) => score.rejected)
    .map((score) => score.candidateId)
    .sort();

  if (!accepted.length) {
    const trace: SelectionTrace = {
      initialCandidateIds,
      dominatedCandidateIds: dominance.dominatedIds,
      guardrailRejectedIds,
      primaryBestScore: null,
      primaryEquivalentIds: [],
      secondaryApplied: false,
      secondarySkippedReason: "todos os candidatos foram rejeitados",
      cheapestIds: [],
      lowestNegativeImpactIds: [],
      deterministicWinnerId: null,
    };

    return {
      winner: null,
      scores: byId(scores),
      trace,
      status: "ALL_REJECTED_BY_GUARDRAILS",
    };
  }

  const primaryBestScore = Math.max(
    ...accepted.map((score) => score.primaryScore!),
  );

  let pool = accepted.filter((score) =>
    within(
      score.primaryScore!,
      primaryBestScore,
      primaryProfile.defaults.primaryEquivalenceThreshold,
    ),
  );

  const primaryEquivalentIds = pool
    .map((score) => score.candidateId)
    .sort();

  let secondaryApplied = false;
  let secondarySkippedReason: string | undefined;
  let secondaryBestScore: number | null | undefined;
  let secondaryEquivalentIds: string[] | undefined;

  if (secondaryProfile && pool.length > 1) {
    const scoredSecondary = pool.map((score) => {
      const candidate = candidateById.get(score.candidateId)!;
      return addSecondaryScore(
        score,
        candidate,
        secondaryProfile,
      );
    });

    const allSecondaryScorable = scoredSecondary.every(
      (score) =>
        score.secondaryScore !== null &&
        score.secondaryScore !== undefined,
    );

    if (allSecondaryScorable) {
      secondaryApplied = true;
      secondaryBestScore = Math.max(
        ...scoredSecondary.map((score) => score.secondaryScore!),
      );

      pool = scoredSecondary.filter((score) =>
        within(
          score.secondaryScore!,
          secondaryBestScore!,
          secondaryProfile.defaults.primaryEquivalenceThreshold,
        ),
      );

      secondaryEquivalentIds = pool
        .map((score) => score.candidateId)
        .sort();

      const replacements = new Map(
        scoredSecondary.map((score) => [
          score.candidateId,
          score,
        ]),
      );

      scores = scores.map(
        (score) => replacements.get(score.candidateId) ?? score,
      );
    } else {
      secondarySkippedReason =
        "prioridade secundária não foi aplicada porque nem todos os candidatos equivalentes possuem suas métricas completas";
    }
  } else if (secondaryProfile) {
    secondarySkippedReason =
      "pool primário possui apenas um candidato";
  } else {
    secondarySkippedReason =
      "nenhuma prioridade secundária selecionada";
  }

  // Primeiro desempate: menor custo.
  const minCost = Math.min(...pool.map((score) => score.totalCost));
  pool = pool.filter((score) => score.totalCost === minCost);
  const cheapestIds = pool
    .map((score) => score.candidateId)
    .sort();

  // Segundo desempate: menor dano colateral.
  const minNegativeImpact = Math.min(
    ...pool.map((score) => score.negativeImpactScore),
  );

  pool = pool.filter(
    (score) =>
      Math.abs(score.negativeImpactScore - minNegativeImpact) < 1e-9,
  );

  const lowestNegativeImpactIds = pool
    .map((score) => score.candidateId)
    .sort();

  // Último desempate neutro/determinístico.
  const winner = [...pool].sort((a, b) =>
    a.candidateId.localeCompare(b.candidateId),
  )[0] ?? null;

  const trace: SelectionTrace = {
    initialCandidateIds,
    dominatedCandidateIds: dominance.dominatedIds,
    guardrailRejectedIds,
    primaryBestScore,
    primaryEquivalentIds,
    secondaryApplied,
    secondarySkippedReason,
    secondaryBestScore,
    secondaryEquivalentIds,
    cheapestIds,
    lowestNegativeImpactIds,
    deterministicWinnerId: winner?.candidateId ?? null,
  };

  return {
    winner,
    scores: byId(scores),
    trace,
    status: "WINNER",
  };
}
