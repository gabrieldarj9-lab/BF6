import type {
  CandidateAttachment,
  CandidateGeneratorInput,
  CandidateSlot,
} from "./types";

export interface PreparedCandidateData {
  slotById: Map<string, CandidateSlot>;
  attachmentById: Map<string, CandidateAttachment>;
  availableAttachments: CandidateAttachment[];
}

export function prepareCandidateData(
  input: CandidateGeneratorInput,
): PreparedCandidateData {
  if (!input.weaponId) {
    throw new Error("weaponId é obrigatório.");
  }

  if (!Number.isFinite(input.budget) || input.budget < 0) {
    throw new Error("budget deve ser um número finito >= 0.");
  }

  const slotById = new Map<string, CandidateSlot>();

  for (const slot of input.slots) {
    if (!slot.id) throw new Error("slot.id é obrigatório.");
    if (!Number.isInteger(slot.maxEquipped) || slot.maxEquipped < 0) {
      throw new Error(
        `${slot.id}: maxEquipped deve ser inteiro >= 0.`,
      );
    }
    if (slot.required && slot.maxEquipped < 1) {
      throw new Error(
        `${slot.id}: slot required precisa aceitar ao menos 1 item.`,
      );
    }
    if (slotById.has(slot.id)) {
      throw new Error(`slot duplicado: ${slot.id}`);
    }
    slotById.set(slot.id, slot);
  }

  const attachmentById = new Map<string, CandidateAttachment>();

  for (const attachment of input.attachments) {
    if (!attachment.id) {
      throw new Error("attachment.id é obrigatório.");
    }
    if (attachmentById.has(attachment.id)) {
      throw new Error(`attachment duplicado: ${attachment.id}`);
    }
    if (!slotById.has(attachment.slotId)) {
      throw new Error(
        `${attachment.id}: slot desconhecido ${attachment.slotId}`,
      );
    }
    if (!Number.isFinite(attachment.cost) || attachment.cost < 0) {
      throw new Error(
        `${attachment.id}: cost deve ser finito >= 0.`,
      );
    }
    attachmentById.set(attachment.id, attachment);
  }

  const availableIds = new Set(input.availableAttachmentIds);

  for (const id of availableIds) {
    if (!attachmentById.has(id)) {
      throw new Error(
        `availableAttachmentIds contém ID desconhecido: ${id}`,
      );
    }
  }

  const availableAttachments = input.attachments.filter(
    (attachment) => {
      if (!availableIds.has(attachment.id)) return false;

      if (
        attachment.compatibleWeaponIds &&
        !attachment.compatibleWeaponIds.includes(input.weaponId)
      ) {
        return false;
      }

      return attachment.cost <= input.budget;
    },
  );

  return {
    slotById,
    attachmentById,
    availableAttachments,
  };
}
