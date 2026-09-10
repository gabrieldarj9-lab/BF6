export type UpgradeImportance =
  | "RECOMMENDED"
  | "MAJOR"
  | "META";

export interface AttachmentUnlock {
  type: "DEFAULT" | "MASTERY" | "SEASONAL" | "UNKNOWN";
  level?: number;
  label: string;
}

export interface AttachmentAvailability {
  attachmentId: string;
  unlock: AttachmentUnlock;
}

export interface ProgressionBuild {
  candidateId: string;
  weaponId: string;
  attachmentIds: readonly string[];
  totalCost: number;

  primaryScore: number;
  secondaryScore?: number | null;
  negativeImpactScore: number;

  /**
   * Métricas normalizadas, 100 = melhor.
   */
  normalizedMetrics: Readonly<Record<string, number | null | undefined>>;

  /**
   * Métricas técnicas/reais para UI e explicações.
   */
  resolvedMetrics?: Readonly<Record<string, number | null | undefined>>;

  sourceIds?: readonly string[];
}

export interface ProgressionSelection {
  winner: ProgressionBuild | null;
  status:
    | "WINNER"
    | "NO_SCORABLE_CANDIDATE"
    | "ALL_REJECTED_BY_GUARDRAILS";
}

export interface ProgressionThresholds {
  primaryEquivalenceThreshold: number;
  minimumRelevantGain: number;
  majorUpgradeThreshold: number;
}

export interface ProgressionChange {
  removedAttachmentIds: readonly string[];
  addedAttachmentIds: readonly string[];
}

export interface MetricDelta {
  metricId: string;
  before: number | null;
  after: number | null;
  delta: number | null;
}

export interface StructuralMajorContext {
  mastery: number;
  previousBuild: ProgressionBuild;
  nextBuild: ProgressionBuild;
  primaryScoreGain: number;
  changes: ProgressionChange;
}

export interface StructuralMajorResult {
  isMajor: boolean;
  reasons: readonly string[];
}

export interface ProgressionStep {
  mastery: number;
  importance: UpgradeImportance;

  previousCandidateId: string;
  candidateId: string;

  previousAttachmentIds: readonly string[];
  attachmentIds: readonly string[];

  removedAttachmentIds: readonly string[];
  addedAttachmentIds: readonly string[];

  totalCost: number;

  primaryScoreBefore: number;
  primaryScoreAfter: number;
  primaryScoreGain: number;

  secondaryScoreAfter?: number | null;
  negativeImpactScore: number;

  metricsBefore: Readonly<Record<string, number | null | undefined>>;
  metricsAfter: Readonly<Record<string, number | null | undefined>>;
  metricDeltas: readonly MetricDelta[];

  reasonCodes: readonly string[];

  nextMastery?: number;
}

export interface BuildProgression {
  weaponId: string;

  metaBuild: ProgressionBuild;
  metaMastery: number;

  relevantMasteries: readonly number[];
  evaluatedMasteries: readonly number[];
  skippedMasteries: readonly {
    mastery: number;
    reason:
      | "NO_WINNER"
      | "UNCHANGED_BUILD"
      | "BELOW_RELEVANCE_THRESHOLD";
  }[];

  steps: readonly ProgressionStep[];

  reachedMeta: boolean;
}

export interface ProgressionEngineConfig {
  weaponId: string;

  /**
   * Build sem acessórios; é o "Antes" da M1.
   */
  baseBuild: ProgressionBuild;

  attachments: readonly AttachmentAvailability[];

  thresholds: ProgressionThresholds;

  /**
   * Define se um desbloqueio está disponível.
   * DEFAULT normalmente true.
   * MASTERY <= mastery normalmente true.
   * SEASONAL precisa ser decidido pela camada de dados.
   */
  isAttachmentAvailable?: (
    attachment: AttachmentAvailability,
    mastery: number,
  ) => boolean;

  /**
   * Deve gerar TODAS as configurações válidas ou um conjunto exaustivo equivalente
   * para aquela maestria. O progression engine nunca faz "build anterior + peça nova".
   */
  getCandidatesForMastery: (
    mastery: number,
    availableAttachmentIds: readonly string[],
  ) => readonly ProgressionBuild[];

  /**
   * Usa o mesmo scoring engine tanto no meta quanto nas etapas intermediárias.
   */
  selectWinner: (
    candidates: readonly ProgressionBuild[],
  ) => ProgressionSelection;

  /**
   * Hook objetivo para breakpoints estruturais:
   * BTK, one-shot, grande salto de handling etc.
   */
  evaluateStructuralMajor?: (
    context: StructuralMajorContext,
  ) => StructuralMajorResult;
}
