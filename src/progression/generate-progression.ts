import type {
  BuildProgression,
  ProgressionBuild,
  ProgressionEngineConfig,
  ProgressionStep,
} from "./types";
import {
  getAvailableAttachmentIds,
  getRelevantMasteries,
} from "./masteries";
import {
  compareAttachments,
  compareMetrics,
  sameConfiguration,
} from "./compare-builds";
import { classifyStep } from "./classify-step";

function selectMeta(
  config: ProgressionEngineConfig,
  relevantMasteries: readonly number[],
): {
  metaBuild: ProgressionBuild;
  metaMasteryCeiling: number;
} {
  const metaMasteryCeiling =
    relevantMasteries[relevantMasteries.length - 1] ?? 1;

  const available = getAvailableAttachmentIds(
    config.attachments,
    metaMasteryCeiling,
    config.isAttachmentAvailable,
  );

  const candidates = config.getCandidatesForMastery(
    metaMasteryCeiling,
    available,
  );

  const selection = config.selectWinner(candidates);

  if (!selection.winner) {
    throw new Error(
      "Não foi possível calcular a meta build com o catálogo completo disponível.",
    );
  }

  return {
    metaBuild: selection.winner,
    metaMasteryCeiling,
  };
}

export function generateProgression(
  config: ProgressionEngineConfig,
): BuildProgression {
  const relevantMasteries = getRelevantMasteries(config.attachments);

  const { metaBuild } = selectMeta(config, relevantMasteries);

  const evaluatedMasteries: number[] = [];
  const skippedMasteries: BuildProgression["skippedMasteries"][number][] = [];
  const steps: ProgressionStep[] = [];

  /**
   * "previousAccepted" é sempre o último estágio realmente exibido.
   * Na M1, o Antes é obrigatoriamente a arma base sem acessórios.
   */
  let previousAccepted = config.baseBuild;
  let reachedMeta = sameConfiguration(previousAccepted, metaBuild);
  let metaMastery = reachedMeta ? 1 : -1;

  if (!reachedMeta) {
    for (const mastery of relevantMasteries) {
      evaluatedMasteries.push(mastery);

      const available = getAvailableAttachmentIds(
        config.attachments,
        mastery,
        config.isAttachmentAvailable,
      );

      /**
       * Recalcula globalmente do zero em CADA maestria relevante.
       */
      const candidates = config.getCandidatesForMastery(
        mastery,
        available,
      );

      const selection = config.selectWinner(candidates);

      if (!selection.winner) {
        skippedMasteries.push({
          mastery,
          reason: "NO_WINNER",
        });
        continue;
      }

      const winner = selection.winner;

      if (sameConfiguration(previousAccepted, winner)) {
        skippedMasteries.push({
          mastery,
          reason: "UNCHANGED_BUILD",
        });

        if (sameConfiguration(winner, metaBuild)) {
          reachedMeta = true;
          metaMastery = mastery;
          break;
        }

        continue;
      }

      const primaryScoreGain =
        winner.primaryScore - previousAccepted.primaryScore;

      /**
       * Meta não pode ser escondida pelo threshold de relevância.
       * Se a configuração vencedora já é a meta, ela entra no timeline.
       */
      const isMeta = sameConfiguration(winner, metaBuild);

      if (
        !isMeta &&
        primaryScoreGain < config.thresholds.minimumRelevantGain
      ) {
        skippedMasteries.push({
          mastery,
          reason: "BELOW_RELEVANCE_THRESHOLD",
        });

        /**
         * Importante:
         * NÃO promovemos uma mudança irrelevante a previousAccepted.
         * O próximo "Antes" continua sendo o último estágio exibido.
         */
        continue;
      }

      const changes = compareAttachments(
        previousAccepted,
        winner,
      );

      const structuralMajor =
        config.evaluateStructuralMajor?.({
          mastery,
          previousBuild: previousAccepted,
          nextBuild: winner,
          primaryScoreGain,
          changes,
        });

      const classification = classifyStep({
        nextBuild: winner,
        metaBuild,
        primaryScoreGain,
        thresholds: config.thresholds,
        structuralMajor,
      });

      const metricsBefore =
        previousAccepted.resolvedMetrics ??
        previousAccepted.normalizedMetrics;

      const metricsAfter =
        winner.resolvedMetrics ??
        winner.normalizedMetrics;

      steps.push({
        mastery,
        importance: classification.importance,

        previousCandidateId: previousAccepted.candidateId,
        candidateId: winner.candidateId,

        previousAttachmentIds: [...previousAccepted.attachmentIds],
        attachmentIds: [...winner.attachmentIds],

        removedAttachmentIds: changes.removedAttachmentIds,
        addedAttachmentIds: changes.addedAttachmentIds,

        totalCost: winner.totalCost,

        primaryScoreBefore: previousAccepted.primaryScore,
        primaryScoreAfter: winner.primaryScore,
        primaryScoreGain,

        secondaryScoreAfter: winner.secondaryScore,
        negativeImpactScore: winner.negativeImpactScore,

        metricsBefore,
        metricsAfter,
        metricDeltas: compareMetrics(metricsBefore, metricsAfter),

        reasonCodes: classification.reasonCodes,
      });

      previousAccepted = winner;

      if (isMeta) {
        reachedMeta = true;
        metaMastery = mastery;
        break;
      }
    }
  }

  /**
   * nextMastery aponta para o próximo estágio REALMENTE exibido,
   * nunca para um unlock intermediário ignorado.
   */
  for (let i = 0; i < steps.length - 1; i += 1) {
    steps[i].nextMastery = steps[i + 1].mastery;
  }

  if (!reachedMeta) {
    /**
     * Esse caso só deveria ocorrer se getCandidatesForMastery / availability
     * forem inconsistentes entre a etapa meta e a varredura.
     */
    throw new Error(
      "A progressão terminou sem atingir a configuração meta calculada.",
    );
  }

  return {
    weaponId: config.weaponId,
    metaBuild,
    metaMastery,
    relevantMasteries,
    evaluatedMasteries,
    skippedMasteries,
    steps,
    reachedMeta,
  };
}
