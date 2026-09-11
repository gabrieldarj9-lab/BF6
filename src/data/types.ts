import type { EngineWeaponDefinition } from "../api/types";
import type { CandidateRestriction, CandidateSlot } from "../candidate/types";
import type { AttachmentEffect } from "../resolver/types";
import type { WeaponCategoryId } from "../scoring/types";

export type WeaponDataSourceKind =
  | "EA_OFFICIAL"
  | "BATTLEFIELDMETA"
  | "RNKD"
  | "BATTLEFIELD_COMPANION"
  | "OTHER";

export interface WeaponDataSource {
  id: string;
  kind: WeaponDataSourceKind;
  title: string;
  url: string;
  observedAt: string;
}

export interface NumericEvidenceObservation {
  value: number;
  unit?: string;
  sourceId: string;
}

export interface WeaponBaseStatEvidence {
  metricId: string;
  observations: readonly NumericEvidenceObservation[];
}

export type WeaponAttachmentSlotId =
  | "scope"
  | "optic-accessory"
  | "muzzle"
  | "barrel"
  | "underbarrel"
  | "magazine"
  | "ammunition"
  | "ergonomics"
  | "top-accessory"
  | "left-accessory"
  | "right-accessory";

export type WeaponAttachmentUnlock =
  | { type: "DEFAULT"; label: string }
  | { type: "MASTERY"; level: number; label: string }
  | { type: "SEASONAL"; label: string }
  | { type: "ASSIGNMENT"; label: string }
  | { type: "UNKNOWN"; label: string };

export interface WeaponAttachmentRecord {
  id: string;
  name: string;
  slotId: WeaponAttachmentSlotId;
  costPoints: number | null;
  unlock: WeaponAttachmentUnlock;
  sourceIds: readonly string[];

  /**
   * Null means the gameplay effect is not yet verified strongly enough to feed
   * the resolver. An empty array means the absence of an engine effect was
   * explicitly verified.
   */
  effects: readonly AttachmentEffect[] | null;
}

export interface WeaponMasteryDefinition {
  minRank: number;
  maxRank: number;
}

export interface WeaponDataRecord {
  id: string;
  name: string;
  categoryId: WeaponCategoryId;
  budget: number;
  careerUnlockLevel?: number;
  mastery: WeaponMasteryDefinition;
  slots: readonly CandidateSlot[];
  restrictions?: readonly CandidateRestriction[];
  attachments: readonly WeaponAttachmentRecord[];
  baseStatEvidence: readonly WeaponBaseStatEvidence[];
  sources: readonly WeaponDataSource[];

  /**
   * Only populated after the technical baseline has been reconciled from
   * sources. Catalog/UI data can be complete while this remains null.
   */
  engineBase: EngineWeaponDefinition["base"] | null;
}

export interface WeaponEngineReadiness {
  ready: boolean;
  diagnostics: readonly string[];
}
