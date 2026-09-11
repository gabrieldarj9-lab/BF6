import type { EngineWeaponDefinition } from "../../api/types";
import type { CandidateRestriction, CandidateSlot } from "../../candidate/types";
import type { AttachmentEffect } from "../../resolver/types";
import type { WeaponCategoryId } from "../../scoring/types";
import type {
  WeaponAttachmentRecord,
  WeaponAttachmentSlotId,
  WeaponAttachmentUnlock,
  WeaponBaseStatEvidence,
  WeaponDataRecord,
  WeaponDataSource,
  WeaponMasteryDefinition,
} from "../types";

export interface SourceBackedAttachmentDraft {
  id?: string;
  name: string;
  slotId: WeaponAttachmentSlotId;
  costPoints: number | null;
  unlock: WeaponAttachmentUnlock;
  sourceIds?: readonly string[];
  effects?: readonly AttachmentEffect[] | null;
}

export interface SourceBackedWeaponDraft {
  id: string;
  name: string;
  categoryId: WeaponCategoryId;
  careerUnlockLevel?: number;
  budget?: number;
  mastery?: WeaponMasteryDefinition;
  slots: readonly CandidateSlot[];
  restrictions?: readonly CandidateRestriction[];
  attachments: readonly SourceBackedAttachmentDraft[];
  baseStatEvidence: readonly WeaponBaseStatEvidence[];
  sources: readonly WeaponDataSource[];
  defaultAttachmentSourceIds?: readonly string[];
  engineBase?: EngineWeaponDefinition["base"] | null;
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function compileAttachment(
  weaponId: string,
  draft: SourceBackedAttachmentDraft,
  defaultSourceIds: readonly string[],
): WeaponAttachmentRecord {
  return {
    id: draft.id ?? `${weaponId}-${slug(draft.name)}`,
    name: draft.name,
    slotId: draft.slotId,
    costPoints: draft.costPoints,
    unlock: draft.unlock,
    sourceIds: draft.sourceIds ?? defaultSourceIds,
    effects: draft.effects ?? null,
  };
}

export function buildSourceBackedWeaponRecord(
  draft: SourceBackedWeaponDraft,
): WeaponDataRecord {
  const defaultSourceIds = draft.defaultAttachmentSourceIds ?? [];

  return {
    id: draft.id,
    name: draft.name,
    categoryId: draft.categoryId,
    budget: draft.budget ?? 100,
    careerUnlockLevel: draft.careerUnlockLevel,
    mastery: draft.mastery ?? { minRank: 0, maxRank: 50 },
    slots: draft.slots,
    restrictions: draft.restrictions,
    attachments: draft.attachments.map((attachment) =>
      compileAttachment(draft.id, attachment, defaultSourceIds)
    ),
    baseStatEvidence: draft.baseStatEvidence,
    sources: draft.sources,
    engineBase: draft.engineBase ?? null,
  };
}

export function buildSourceBackedWeaponBatch(
  drafts: readonly SourceBackedWeaponDraft[],
): WeaponDataRecord[] {
  return drafts.map(buildSourceBackedWeaponRecord);
}
