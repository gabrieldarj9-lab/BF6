import type {
  CandidateConfiguration,
  DominancePruningConfig,
  DominanceVector,
} from "./types";

function dominates(
  a: CandidateConfiguration,
  aVector: DominanceVector,
  b: CandidateConfiguration,
  bVector: DominanceVector,
  metricIds: readonly string[],
): boolean {
  if (a.totalCost > b.totalCost) return false;

  let strictlyBetter = a.totalCost < b.totalCost;

  for (const metricId of metricIds) {
    const av = aVector.values[metricId];
    const bv = bVector.values[metricId];

    /**
     * Se uma das dimensões não existe ou não é finita,
     * NÃO inferimos dominância.
     */
    if (
      av === undefined ||
      bv === undefined ||
      !Number.isFinite(av) ||
      !Number.isFinite(bv)
    ) {
      return false;
    }

    if (av < bv) return false;
    if (av > bv) strictlyBetter = true;
  }

  return strictlyBetter;
}

export interface DominancePruningResult {
  candidates: CandidateConfiguration[];
  removedIds: string[];
}

/**
 * Skyline incremental conservador.
 *
 * Todas as dimensões do DominanceVector devem estar orientadas:
 * maior = melhor.
 *
 * comparisonKey impede comparações entre contextos que não devem compartilhar
 * a mesma fronteira de Pareto, como fire modes ou tipos de munição distintos.
 */
export function pruneDominatedCandidates(
  candidates: readonly CandidateConfiguration[],
  config: DominancePruningConfig,
): DominancePruningResult {
  if (config.metricIds.length === 0) {
    return {
      candidates: [...candidates],
      removedIds: [],
    };
  }

  const groups = new Map<
    string,
    {
      candidate: CandidateConfiguration;
      vector: DominanceVector | null;
    }[]
  >();

  for (const candidate of candidates) {
    const key = config.comparisonKey?.(candidate) ?? "__all__";
    const bucket = groups.get(key) ?? [];
    bucket.push({
      candidate,
      vector: config.evaluate(candidate),
    });
    groups.set(key, bucket);
  }

  const kept: CandidateConfiguration[] = [];
  const removedIds: string[] = [];

  for (const entries of groups.values()) {
    /**
     * Menor custo primeiro melhora eficiência da skyline e é determinístico.
     */
    entries.sort(
      (a, b) =>
        a.candidate.totalCost - b.candidate.totalCost ||
        a.candidate.id.localeCompare(b.candidate.id),
    );

    const frontier: typeof entries = [];

    for (const entry of entries) {
      if (!entry.vector) {
        frontier.push(entry);
        continue;
      }

      let isDominated = false;

      for (const incumbent of frontier) {
        if (!incumbent.vector) continue;

        if (
          dominates(
            incumbent.candidate,
            incumbent.vector,
            entry.candidate,
            entry.vector,
            config.metricIds,
          )
        ) {
          isDominated = true;
          break;
        }
      }

      if (isDominated) {
        removedIds.push(entry.candidate.id);
        continue;
      }

      /**
       * O novo candidato pode tornar membros anteriores da skyline dominados.
       */
      for (let i = frontier.length - 1; i >= 0; i -= 1) {
        const incumbent = frontier[i];
        if (!incumbent.vector) continue;

        if (
          dominates(
            entry.candidate,
            entry.vector,
            incumbent.candidate,
            incumbent.vector,
            config.metricIds,
          )
        ) {
          removedIds.push(incumbent.candidate.id);
          frontier.splice(i, 1);
        }
      }

      frontier.push(entry);
    }

    kept.push(...frontier.map((entry) => entry.candidate));
  }

  kept.sort((a, b) => a.id.localeCompare(b.id));
  removedIds.sort();

  return {
    candidates: kept,
    removedIds,
  };
}
