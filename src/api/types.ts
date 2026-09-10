import type { CandidateRestriction, CandidateSlot, DominancePruningConfig } from "../candidate/types";
import type { DerivedMetricContext, DamagePoint, FireCadence, ProjectileType, ReloadModel } from "../metrics/types";
import type { AttachmentEffect, MetricResolutionRule } from "../resolver/types";
import type { MetricNormalizationRule, PriorityProfile, WeaponCategoryId } from "../scoring/types";
import type { BuildProgression, StructuralMajorContext, StructuralMajorResult } from "../progression/types";

export interface EngineAttachmentRuntimeOverride {
  damageCurve?: readonly DamagePoint[];
  projectileType?: ProjectileType;
  projectileCount?: number;
  cadence?: FireCadence;
  dragPerMeter?: number;
}

export interface EngineAttachment {
  id: string;
  slotId: string;
  cost: number;
  unlock: {
    type: "DEFAULT" | "MASTERY" | "SEASONAL" | "UNKNOWN";
    level?: number;
    label: string;
  };
  compatibleWeaponIds?: readonly string[];
  exclusiveGroupIds?: readonly string[];
  effects: readonly AttachmentEffect[];
  runtimeOverride?: EngineAttachmentRuntimeOverride;
}

export interface EngineWeaponDefinition {
  id: string;
  categoryId: WeaponCategoryId;
  budget: number;
  slots: readonly CandidateSlot[];
  attachments: readonly EngineAttachment[];
  restrictions?: readonly CandidateRestriction[];

  base: {
    technical: Readonly<Record<string, number | null | undefined>>;
    resolutionRules?: Readonly<Record<string, MetricResolutionRule>>;
    damageCurve?: readonly DamagePoint[];
    projectileType?: ProjectileType;
    projectileCount?: number;
    cadence?: FireCadence;
    magazineCapacity?: number;
    reload?: ReloadModel;
    projectileVelocityMps?: number;
    dragPerMeter?: number;
    healthBaseline?: number;
    bodyMultiplier?: number;
  };
}

export interface EndToEndProgressionRequest {
  weapon: EngineWeaponDefinition;
  primaryProfile: PriorityProfile;
  secondaryProfile?: PriorityProfile;
  normalizationRules: Readonly<Record<string, MetricNormalizationRule>>;
  metricContext?: DerivedMetricContext;

  /** Seasonal pieces explicitly enabled for this run. */
  activeSeasonalAttachmentIds?: readonly string[];

  maxSearchNodes?: number;
  candidateDominance?: DominancePruningConfig;

  evaluateStructuralMajor?: (
    context: StructuralMajorContext,
  ) => StructuralMajorResult;
}

export interface MaterializationDiagnostic {
  candidateId: string;
  messages: readonly string[];
}

export interface EndToEndProgressionResult {
  progression: BuildProgression;
  generationStatsByMastery: Readonly<Record<number, {
    searchNodes: number;
    completedConfigurations: number;
    rejectedByBudget: number;
    rejectedByImmediateConflict: number;
    rejectedByFinalRestriction: number;
    structuralDuplicatesRemoved: number;
    dominatedRemoved: number;
    candidateCount: number;
  }>>;
  materializationDiagnostics: readonly MaterializationDiagnostic[];
}
