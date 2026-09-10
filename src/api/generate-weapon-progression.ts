import { generateCandidates } from "../candidate/generate-candidates";
import type { CandidateConfiguration } from "../candidate/types";
import { selectWinner as selectScoringWinner } from "../scoring/select-winner";
import type { CandidateScore } from "../scoring/types";
import { generateProgression } from "../progression/generate-progression";
import type { ProgressionBuild, ProgressionSelection } from "../progression/types";
import type {
  EndToEndProgressionRequest,
  EndToEndProgressionResult,
  MaterializationDiagnostic,
} from "./types";
import { materializeCandidate, type MaterializedCandidate } from "./materialize";

function structuralBaseCandidate(
  weaponId: string,
  slotIds: readonly string[],
): CandidateConfiguration {
  return {
    id: `${weaponId}__base`,
    weaponId,
    attachmentIds: [],
    totalCost: 0,
    occupiedSlots: Object.fromEntries(slotIds.map((slotId) => [slotId, []])),
  };
}

function rawMetricRecord(materialized: MaterializedCandidate) {
  const result: Record<string, number | null | undefined> = {
    ...materialized.resolvedTechnical,
  };

  for (const [metricId, metric] of Object.entries(materialized.raw.metrics)) {
    result[metricId] = metric.value;
  }

  return result;
}

function normalizedMetricRecord(materialized: MaterializedCandidate) {
  const result: Record<string, number | null | undefined> = {};

  for (const [metricId, metric] of Object.entries(materialized.normalized.metrics)) {
    result[metricId] = metric.normalizedValue;
  }

  return result;
}

function toProgressionBuild(
  materialized: MaterializedCandidate,
  score: CandidateScore,
): ProgressionBuild {
  if (score.primaryScore === null) {
    throw new Error(`Candidate ${score.candidateId} has no primary score.`);
  }

  return {
    candidateId: materialized.raw.id,
    weaponId: materialized.raw.weaponId,
    attachmentIds: materialized.raw.attachmentIds,
    totalCost: materialized.raw.totalCost,
    primaryScore: score.primaryScore,
    secondaryScore: score.secondaryScore,
    negativeImpactScore: score.negativeImpactScore,
    normalizedMetrics: normalizedMetricRecord(materialized),
    resolvedMetrics: rawMetricRecord(materialized),
  };
}

export function generateWeaponProgression(
  request: EndToEndProgressionRequest,
): EndToEndProgressionResult {
  const { weapon, primaryProfile, secondaryProfile, normalizationRules } = request;

  if (primaryProfile.categoryId !== weapon.categoryId) {
    throw new Error(
      `Primary profile category ${primaryProfile.categoryId} does not match weapon category ${weapon.categoryId}.`,
    );
  }

  if (secondaryProfile && secondaryProfile.categoryId !== weapon.categoryId) {
    throw new Error(
      `Secondary profile category ${secondaryProfile.categoryId} does not match weapon category ${weapon.categoryId}.`,
    );
  }

  const materializedCache = new Map<string, MaterializedCandidate>();
  const diagnosticMap = new Map<string, string[]>();
  const generationStatsByMastery: Record<number, {
    searchNodes: number;
    completedConfigurations: number;
    rejectedByBudget: number;
    rejectedByImmediateConflict: number;
    rejectedByFinalRestriction: number;
    structuralDuplicatesRemoved: number;
    dominatedRemoved: number;
    candidateCount: number;
  }> = {};

  const materialize = (candidate: CandidateConfiguration): MaterializedCandidate => {
    const cached = materializedCache.get(candidate.id);
    if (cached) return cached;

    const value = materializeCandidate(
      weapon,
      candidate,
      primaryProfile,
      secondaryProfile,
      normalizationRules,
      request.metricContext ?? {},
    );

    materializedCache.set(candidate.id, value);
    if (value.diagnostics.length) {
      diagnosticMap.set(candidate.id, [...value.diagnostics]);
    }
    return value;
  };

  const baseStructural = structuralBaseCandidate(
    weapon.id,
    weapon.slots.map((slot) => slot.id),
  );
  const baseMaterialized = materialize(baseStructural);

  const baseSelection = selectScoringWinner(
    [baseMaterialized.normalized],
    baseMaterialized.normalized,
    primaryProfile,
    secondaryProfile,
  );

  if (!baseSelection.winner || baseSelection.winner.primaryScore === null) {
    throw new Error(
      `Base weapon is not scorable for profile ${primaryProfile.id}. ` +
      `Diagnostics: ${(diagnosticMap.get(baseStructural.id) ?? []).join("; ")}`,
    );
  }

  const baseBuild = toProgressionBuild(
    baseMaterialized,
    baseSelection.winner,
  );

  const activeSeasonal = new Set(request.activeSeasonalAttachmentIds ?? []);
  const knownAttachmentIds = new Set(weapon.attachments.map((attachment) => attachment.id));
  for (const id of activeSeasonal) {
    if (!knownAttachmentIds.has(id)) {
      throw new Error(`Unknown active seasonal attachment: ${id}`);
    }
  }

  const progression = generateProgression({
    weaponId: weapon.id,
    baseBuild,
    attachments: weapon.attachments.map((attachment) => ({
      attachmentId: attachment.id,
      unlock: attachment.unlock,
    })),
    thresholds: {
      primaryEquivalenceThreshold: primaryProfile.defaults.primaryEquivalenceThreshold,
      minimumRelevantGain: primaryProfile.defaults.minimumRelevantGain,
      majorUpgradeThreshold: primaryProfile.defaults.majorUpgradeThreshold,
    },
    isAttachmentAvailable(attachment, mastery) {
      if (attachment.unlock.type === "DEFAULT") return true;
      if (attachment.unlock.type === "MASTERY") {
        return Number.isInteger(attachment.unlock.level) &&
          (attachment.unlock.level ?? Infinity) <= mastery;
      }
      if (attachment.unlock.type === "SEASONAL") {
        return activeSeasonal.has(attachment.attachmentId);
      }
      return false;
    },
    getCandidatesForMastery(mastery, availableAttachmentIds) {
      const generated = generateCandidates({
        weaponId: weapon.id,
        budget: weapon.budget,
        slots: weapon.slots,
        attachments: weapon.attachments.map((attachment) => ({
          id: attachment.id,
          slotId: attachment.slotId,
          cost: attachment.cost,
          compatibleWeaponIds: attachment.compatibleWeaponIds,
          exclusiveGroupIds: attachment.exclusiveGroupIds,
        })),
        availableAttachmentIds,
        restrictions: weapon.restrictions,
        maxSearchNodes: request.maxSearchNodes,
        dominance: request.candidateDominance,
      });

      generationStatsByMastery[mastery] = {
        ...generated.stats,
        candidateCount: generated.candidates.length,
      };

      return generated.candidates.map((candidate) => {
        const m = materialize(candidate);

        // Temporary score fields are replaced by selectWinner below.
        return {
          candidateId: candidate.id,
          weaponId: candidate.weaponId,
          attachmentIds: candidate.attachmentIds,
          totalCost: candidate.totalCost,
          primaryScore: Number.NEGATIVE_INFINITY,
          secondaryScore: null,
          negativeImpactScore: Number.POSITIVE_INFINITY,
          normalizedMetrics: normalizedMetricRecord(m),
          resolvedMetrics: rawMetricRecord(m),
        } satisfies ProgressionBuild;
      });
    },
    selectWinner(candidates): ProgressionSelection {
      const materialized = candidates.map((candidate) => {
        const found = materializedCache.get(candidate.candidateId);
        if (!found) {
          throw new Error(`Missing materialized candidate ${candidate.candidateId}.`);
        }
        return found;
      });

      const selection = selectScoringWinner(
        materialized.map((candidate) => candidate.normalized),
        baseMaterialized.normalized,
        primaryProfile,
        secondaryProfile,
      );

      if (!selection.winner) {
        return {
          winner: null,
          status: selection.status,
        };
      }

      const winnerMaterialized = materializedCache.get(selection.winner.candidateId);
      if (!winnerMaterialized) {
        throw new Error(`Winning candidate was not materialized: ${selection.winner.candidateId}`);
      }

      return {
        winner: toProgressionBuild(winnerMaterialized, selection.winner),
        status: "WINNER",
      };
    },
    evaluateStructuralMajor: request.evaluateStructuralMajor,
  });

  const materializationDiagnostics: MaterializationDiagnostic[] = [
    ...diagnosticMap.entries(),
  ]
    .map(([candidateId, messages]) => ({ candidateId, messages }))
    .sort((a, b) => a.candidateId.localeCompare(b.candidateId));

  return {
    progression,
    generationStatsByMastery,
    materializationDiagnostics,
  };
}
