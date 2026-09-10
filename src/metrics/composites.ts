import type { MetricResult } from "./types";

export interface CompositeTerm {
  metricId: string;
  weight: number;
}

/**
 * Recebe utilidades normalizadas no sentido:
 * 100 = melhor.
 */
export function weightedNormalizedComposite(
  metricId: string,
  normalized: Readonly<Record<string, number | null | undefined>>,
  terms: readonly CompositeTerm[],
): MetricResult {
  let weighted = 0;
  let totalWeight = 0;
  const missing: string[] = [];

  for (const term of terms) {
    const value = normalized[term.metricId];

    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(value)
    ) {
      missing.push(term.metricId);
      continue;
    }

    weighted += value * term.weight;
    totalWeight += term.weight;
  }

  if (missing.length || totalWeight <= 0) {
    return {
      metricId,
      value: null,
      direction: "HIGHER_IS_BETTER",
      evidence: "UNAVAILABLE",
      dependencies: terms.map((term) => term.metricId),
      reason: `composite incompleto; faltando: ${missing.join(", ")}`,
    };
  }

  return {
    metricId,
    value: weighted / totalWeight,
    unit: "utility-0-100",
    direction: "HIGHER_IS_BETTER",
    evidence: "MODELED_TRANSPARENT",
    dependencies: terms.map((term) => term.metricId),
    metadata: {
      recipe: terms,
    },
  };
}

export const COMPOSITE_RECIPES: Record<
  string,
  readonly CompositeTerm[]
> = {
  "accuracy.ads": [
    { metricId: "spread.ads.stand", weight: 35 },
    { metricId: "spread.ads.move", weight: 25 },
    { metricId: "spread.ads.growth", weight: 20 },
    { metricId: "spread.ads.recovery", weight: 20 },
  ],

  "handling.aggregate": [
    { metricId: "handling.adsTime", weight: 40 },
    { metricId: "handling.sprintRecovery", weight: 30 },
    { metricId: "handling.drawTime", weight: 30 },
  ],

  "mobility.aggregate": [
    { metricId: "mobility.adsMove", weight: 40 },
    { metricId: "handling.sprintRecovery", weight: 30 },
    { metricId: "handling.drawTime", weight: 30 },
  ],

  "hipfire.aggregate": [
    { metricId: "spread.hip.move", weight: 30 },
    { metricId: "spread.hip.stand", weight: 25 },
    { metricId: "recoil.hip.amount", weight: 20 },
    { metricId: "spread.hip.growth", weight: 15 },
    { metricId: "spread.hip.recovery", weight: 10 },
  ],

  "recoil.aggregate": [
    { metricId: "recoil.ads.amount", weight: 45 },
    { metricId: "recoil.ads.variation", weight: 25 },
    { metricId: "recoil.ads.recovery", weight: 30 },
  ],

  "recoil.aggregateVariation": [
    { metricId: "recoil.ads.variation", weight: 50 },
    { metricId: "recoil.hip.variation", weight: 50 },
  ],

  "spread.ads.sequence": [
    { metricId: "spread.ads.growth", weight: 50 },
    { metricId: "spread.ads.recovery", weight: 50 },
  ],

  "spread.sequence": [
    { metricId: "spread.ads.growth", weight: 25 },
    { metricId: "spread.ads.recovery", weight: 25 },
    { metricId: "spread.hip.growth", weight: 25 },
    { metricId: "spread.hip.recovery", weight: 25 },
  ],

  "sequenceStability": [
    { metricId: "recoil.ads.amount", weight: 25 },
    { metricId: "recoil.ads.variation", weight: 20 },
    { metricId: "recoil.ads.recovery", weight: 25 },
    { metricId: "spread.ads.growth", weight: 15 },
    { metricId: "spread.ads.recovery", weight: 15 },
  ],

  "firstShotQuality": [
    { metricId: "spread.ads.stand", weight: 60 },
    { metricId: "aim.sway", weight: 40 },
  ],

  "shotgunAccuracy.multi": [
    { metricId: "spread.ads.stand", weight: 35 },
    { metricId: "spread.hip.stand", weight: 20 },
    { metricId: "spread.ads.growth", weight: 15 },
    { metricId: "spread.ads.recovery", weight: 15 },
    { metricId: "recoil.ads.variation", weight: 15 },
  ],

  "shotgunAccuracy.single": [
    { metricId: "spread.ads.stand", weight: 35 },
    { metricId: "spread.ads.move", weight: 15 },
    { metricId: "recoil.ads.variation", weight: 15 },
    { metricId: "recoil.ads.recovery", weight: 15 },
    { metricId: "ballistics.velocity", weight: 10 },
    { metricId: "aim.sway", weight: 10 },
  ],
};
