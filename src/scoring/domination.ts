import type {
  NormalizedBuildCandidate,
  PriorityProfile,
} from "./types";

function metricSet(
  primary: PriorityProfile,
  secondary?: PriorityProfile,
): string[] {
  return [
    ...new Set([
      ...primary.primaryMetrics.map((m) => m.metricId),
      ...primary.protectedMetrics.map((m) => m.metricId),
      ...(secondary?.primaryMetrics.map((m) => m.metricId) ?? []),
    ]),
  ];
}

function dominates(
  a: NormalizedBuildCandidate,
  b: NormalizedBuildCandidate,
  metricIds: readonly string[],
): boolean {
  if (a.totalCost > b.totalCost) return false;

  let strictlyBetter = a.totalCost < b.totalCost;

  for (const metricId of metricIds) {
    const av = a.metrics[metricId]?.normalizedValue;
    const bv = b.metrics[metricId]?.normalizedValue;

    // Com dados ausentes, não inferir dominância.
    if (av === null || av === undefined || bv === null || bv === undefined) {
      return false;
    }

    if (av < bv) return false;
    if (av > bv) strictlyBetter = true;
  }

  return strictlyBetter;
}

export function removeStrictlyDominatedCandidates(
  candidates: readonly NormalizedBuildCandidate[],
  primary: PriorityProfile,
  secondary?: PriorityProfile,
): {
  remaining: NormalizedBuildCandidate[];
  dominatedIds: string[];
} {
  const ids = metricSet(primary, secondary);
  const dominated = new Set<string>();

  for (let i = 0; i < candidates.length; i += 1) {
    for (let j = 0; j < candidates.length; j += 1) {
      if (i === j) continue;

      if (dominates(candidates[j], candidates[i], ids)) {
        dominated.add(candidates[i].id);
        break;
      }
    }
  }

  return {
    remaining: candidates.filter((c) => !dominated.has(c.id)),
    dominatedIds: [...dominated].sort(),
  };
}
