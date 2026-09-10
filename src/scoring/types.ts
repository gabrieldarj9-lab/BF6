export type MetricEvidence =
  | "DIRECT_RESOLVED"
  | "DERIVED_EXACT"
  | "MODELED_TRANSPARENT"
  | "CONTEXT_REQUIRED"
  | "UNAVAILABLE";

export type BuildPriorityId =
  | "recoil"
  | "accuracy"
  | "ads-speed"
  | "mobility"
  | "hipfire"
  | "short-range"
  | "range"
  | "sustained-fire";

export type WeaponCategoryId =
  | "assault-rifles"
  | "carbines"
  | "smt"
  | "ml"
  | "dmr"
  | "sniper-rifles"
  | "shotguns"
  | "secondary";

export interface MetricWeight {
  metricId: string;
  weight: number;
}

export interface ProtectedMetricRule {
  metricId: string;
  maxAllowedLoss: number;
  penaltyWeight?: number;
}

export interface Guardrail {
  metricId: string;
  mode: "MAX_LOSS" | "MIN_VALUE" | "MAX_VALUE";
  threshold: number;
  note?: string;
}

export interface PriorityProfileDefaults {
  primaryEquivalenceThreshold: number;
  minimumRelevantGain: number;
  majorUpgradeThreshold: number;
  softCollateralLossStart: number;
  hardTotalCollateralLoss: number;
}

export interface PriorityProfile {
  id: string;
  categoryId: WeaponCategoryId;
  priorityId: BuildPriorityId;
  name: string;
  primaryMetrics: readonly MetricWeight[];
  protectedMetrics: readonly ProtectedMetricRule[];
  guardrails?: readonly Guardrail[];
  defaults: PriorityProfileDefaults;
}

export type MetricDirection = "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";

export interface RawMetricValue {
  metricId: string;
  value: number | null;
  direction: MetricDirection;
  evidence: MetricEvidence;
  unit?: string;
}

export type NormalizationMode =
  | "FIXED_RANGE"
  | "PASSTHROUGH_0_100";

export interface MetricNormalizationRule {
  metricId: string;
  mode: NormalizationMode;
  /**
   * Necessário em FIXED_RANGE.
   * São limites de referência estáveis, não min/max do conjunto de candidatos.
   */
  min?: number;
  max?: number;
  direction?: MetricDirection;
}

export interface NormalizedMetricValue {
  metricId: string;
  rawValue: number | null;
  normalizedValue: number | null;
  evidence: MetricEvidence;
  normalizationStatus:
    | "OK"
    | "MISSING_VALUE"
    | "MISSING_RULE"
    | "INVALID_RULE";
  rule?: MetricNormalizationRule;
}

export interface BuildCandidate {
  id: string;
  weaponId: string;
  attachmentIds: readonly string[];
  totalCost: number;

  /**
   * Métricas já derivadas/resolvidas, antes da normalização.
   */
  metrics: Readonly<Record<string, RawMetricValue>>;
}

export interface NormalizedBuildCandidate
  extends Omit<BuildCandidate, "metrics"> {
  metrics: Readonly<Record<string, NormalizedMetricValue>>;
}

export interface ScoreBreakdownItem {
  metricId: string;
  normalizedValue: number;
  weight: number;
  contribution: number;
  evidence: MetricEvidence;
}

export interface CollateralLossItem {
  metricId: string;
  baselineValue: number;
  candidateValue: number;
  loss: number;
  penaltyWeight: number;
  weightedLoss: number;
  exceedsSoftStart: boolean;
}

export interface GuardrailFailure {
  metricId: string;
  rule: string;
  actual: number | null;
  threshold: number;
  note?: string;
}

export interface CandidateScore {
  candidateId: string;

  scorable: boolean;
  rejected: boolean;

  primaryScore: number | null;
  primaryBreakdown: readonly ScoreBreakdownItem[];

  secondaryScore?: number | null;
  secondaryBreakdown?: readonly ScoreBreakdownItem[];

  negativeImpactScore: number;
  collateralLosses: readonly CollateralLossItem[];

  guardrailFailures: readonly GuardrailFailure[];
  missingPrimaryMetrics: readonly string[];
  missingProtectedMetrics: readonly string[];

  totalCost: number;
}

export interface SelectionTrace {
  initialCandidateIds: readonly string[];
  dominatedCandidateIds: readonly string[];
  guardrailRejectedIds: readonly string[];
  primaryBestScore: number | null;
  primaryEquivalentIds: readonly string[];
  secondaryApplied: boolean;
  secondarySkippedReason?: string;
  secondaryBestScore?: number | null;
  secondaryEquivalentIds?: readonly string[];
  cheapestIds: readonly string[];
  lowestNegativeImpactIds: readonly string[];
  deterministicWinnerId: string | null;
}

export interface WinnerSelection {
  winner: CandidateScore | null;
  scores: readonly CandidateScore[];
  trace: SelectionTrace;
  status:
    | "WINNER"
    | "NO_SCORABLE_CANDIDATE"
    | "ALL_REJECTED_BY_GUARDRAILS";
}

export interface SourceScenario {
  id: string;
  candidates: readonly BuildCandidate[];
  baseline: BuildCandidate;
}

export interface SourceSensitivityResult {
  sourceSensitive: boolean;
  winnerIdsByScenario: Readonly<Record<string, string | null>>;
  uniqueWinnerIds: readonly string[];
  scenarioSelections: Readonly<Record<string, WinnerSelection>>;
}
