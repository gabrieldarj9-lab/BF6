export type MetricSupportKind =
  | "DIRECT_RESOLVED"
  | "DERIVED_PHYSICAL"
  | "MODELED_COMPOSITE"
  | "CONTEXTUAL_DERIVED";

const COMPOSITES = new Set([
  "accuracy.ads",
  "handling.aggregate",
  "mobility.aggregate",
  "hipfire.aggregate",
  "recoil.aggregate",
  "recoil.aggregateVariation",
  "spread.ads.sequence",
  "spread.sequence",
  "sequenceStability",
  "firstShotQuality",
  "shotgunAccuracy.aggregate",
  "pelletGrouping",
  "accurateFollowUpOutput.8s",
]);

const CONTEXTUAL = new Set([
  "damagePerMagazine",
  "oneShotConsistency",
  "lethalityProfile",
  "lethality.close",
  "hipfireLethality.aggregate",
  "shotgunRangeBreakpoints",
]);

export function classifyMetricSupport(
  metricId: string,
): MetricSupportKind {
  if (COMPOSITES.has(metricId)) return "MODELED_COMPOSITE";
  if (CONTEXTUAL.has(metricId)) return "CONTEXTUAL_DERIVED";

  if (
    /^ttk\./.test(metricId) ||
    /SustainedOutput\./.test(metricId) ||
    /^sustainedOutput\./.test(metricId) ||
    /^shotgunLethality\./.test(metricId) ||
    metricId === "followUpSpeed"
  ) {
    return "DERIVED_PHYSICAL";
  }

  return "DIRECT_RESOLVED";
}
