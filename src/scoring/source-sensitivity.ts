import type {
  MetricNormalizationRule,
  PriorityProfile,
  SourceScenario,
  SourceSensitivityResult,
} from "./types";
import { normalizeCandidate, normalizeCandidates } from "./normalization";
import { selectWinner } from "./select-winner";

export function evaluateSourceSensitivity(
  scenarios: readonly SourceScenario[],
  normalizationRules: Readonly<
    Record<string, MetricNormalizationRule>
  >,
  primaryProfile: PriorityProfile,
  secondaryProfile?: PriorityProfile,
): SourceSensitivityResult {
  const winnerIdsByScenario: Record<string, string | null> = {};
  const scenarioSelections: Record<string, ReturnType<typeof selectWinner>> = {};

  for (const scenario of scenarios) {
    const normalizedCandidates = normalizeCandidates(
      scenario.candidates,
      normalizationRules,
    );

    const normalizedBaseline = normalizeCandidate(
      scenario.baseline,
      normalizationRules,
    );

    const selection = selectWinner(
      normalizedCandidates,
      normalizedBaseline,
      primaryProfile,
      secondaryProfile,
    );

    scenarioSelections[scenario.id] = selection;
    winnerIdsByScenario[scenario.id] =
      selection.winner?.candidateId ?? null;
  }

  const uniqueWinnerIds = [
    ...new Set(
      Object.values(winnerIdsByScenario).filter(
        (id): id is string => id !== null,
      ),
    ),
  ].sort();

  return {
    sourceSensitive: uniqueWinnerIds.length > 1,
    winnerIdsByScenario,
    uniqueWinnerIds,
    scenarioSelections,
  };
}
