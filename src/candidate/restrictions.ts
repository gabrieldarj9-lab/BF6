import type {
  CandidateAttachment,
  CandidateConfiguration,
  CandidateRejection,
  CandidateRestriction,
  CandidateSlot,
} from "./types";

export interface ValidationContext {
  weaponId: string;
  budget: number;
  slots: readonly CandidateSlot[];
  attachmentById: ReadonlyMap<string, CandidateAttachment>;
  restrictions: readonly CandidateRestriction[];
}

export function validateCompleteCandidate(
  candidate: CandidateConfiguration,
  context: ValidationContext,
): CandidateRejection {
  if (candidate.totalCost > context.budget) {
    return { valid: false, reason: "BUDGET" };
  }

  const selected = new Set(candidate.attachmentIds);

  const exclusiveGroups = new Set<string>();

  for (const attachmentId of candidate.attachmentIds) {
    const attachment = context.attachmentById.get(attachmentId);

    if (!attachment) {
      return { valid: false, reason: "WEAPON_COMPATIBILITY" };
    }

    if (
      attachment.compatibleWeaponIds &&
      !attachment.compatibleWeaponIds.includes(context.weaponId)
    ) {
      return { valid: false, reason: "WEAPON_COMPATIBILITY" };
    }

    for (const groupId of attachment.exclusiveGroupIds ?? []) {
      if (exclusiveGroups.has(groupId)) {
        return { valid: false, reason: "EXCLUSIVE_GROUP" };
      }
      exclusiveGroups.add(groupId);
    }
  }

  for (const slot of context.slots) {
    const count = candidate.occupiedSlots[slot.id]?.length ?? 0;

    if (count > slot.maxEquipped) {
      return { valid: false, reason: "SLOT_CAPACITY" };
    }

    if (slot.required && count === 0) {
      return { valid: false, reason: "SLOT_CAPACITY" };
    }
  }

  for (const restriction of context.restrictions) {
    if (!selected.has(restriction.attachmentId)) continue;

    if (restriction.type === "INCOMPATIBLE_WITH_ATTACHMENT") {
      if (selected.has(restriction.incompatibleAttachmentId)) {
        return {
          valid: false,
          reason: "ATTACHMENT_INCOMPATIBILITY",
        };
      }
      continue;
    }

    if (restriction.type === "REQUIRES_ATTACHMENT") {
      if (!selected.has(restriction.requiredAttachmentId)) {
        return {
          valid: false,
          reason: "MISSING_REQUIRED_ATTACHMENT",
        };
      }
      continue;
    }

    if (restriction.type === "REQUIRES_ONE_OF") {
      if (
        !restriction.requiredAttachmentIds.some((id) =>
          selected.has(id),
        )
      ) {
        return {
          valid: false,
          reason: "MISSING_REQUIRED_ONE_OF",
        };
      }
      continue;
    }

    if (restriction.type === "INCOMPATIBLE_WITH_SLOT") {
      const occupied =
        candidate.occupiedSlots[restriction.incompatibleSlotId] ?? [];

      if (occupied.length > 0) {
        return {
          valid: false,
          reason: "SLOT_INCOMPATIBILITY",
        };
      }
      continue;
    }

    if (restriction.type === "REQUIRES_SLOT_OCCUPIED") {
      const occupied =
        candidate.occupiedSlots[restriction.requiredSlotId] ?? [];

      if (occupied.length === 0) {
        return {
          valid: false,
          reason: "MISSING_REQUIRED_SLOT",
        };
      }
    }
  }

  return { valid: true };
}

export function conflictsImmediately(
  attachment: CandidateAttachment,
  selectedIds: ReadonlySet<string>,
  selectedExclusiveGroups: ReadonlySet<string>,
  restrictions: readonly CandidateRestriction[],
): boolean {
  for (const groupId of attachment.exclusiveGroupIds ?? []) {
    if (selectedExclusiveGroups.has(groupId)) return true;
  }

  for (const restriction of restrictions) {
    if (restriction.type !== "INCOMPATIBLE_WITH_ATTACHMENT") {
      continue;
    }

    if (
      restriction.attachmentId === attachment.id &&
      selectedIds.has(restriction.incompatibleAttachmentId)
    ) {
      return true;
    }

    if (
      restriction.incompatibleAttachmentId === attachment.id &&
      selectedIds.has(restriction.attachmentId)
    ) {
      return true;
    }
  }

  return false;
}
