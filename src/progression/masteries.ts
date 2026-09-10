import type {
  AttachmentAvailability,
} from "./types";

export function defaultAttachmentAvailability(
  attachment: AttachmentAvailability,
  mastery: number,
): boolean {
  if (attachment.unlock.type === "DEFAULT") {
    return true;
  }

  if (attachment.unlock.type === "MASTERY") {
    return (
      Number.isInteger(attachment.unlock.level) &&
      (attachment.unlock.level ?? Infinity) <= mastery
    );
  }

  /**
   * Seasonal/unknown precisam ser resolvidos pela camada de dados.
   * O default conservador é NÃO disponibilizar.
   */
  return false;
}

export function getRelevantMasteries(
  attachments: readonly AttachmentAvailability[],
): number[] {
  const masteries = new Set<number>([1]);

  for (const attachment of attachments) {
    if (
      attachment.unlock.type === "MASTERY" &&
      Number.isInteger(attachment.unlock.level) &&
      (attachment.unlock.level ?? 0) >= 1
    ) {
      masteries.add(attachment.unlock.level!);
    }
  }

  return [...masteries].sort((a, b) => a - b);
}

export function getAvailableAttachmentIds(
  attachments: readonly AttachmentAvailability[],
  mastery: number,
  isAvailable = defaultAttachmentAvailability,
): string[] {
  return attachments
    .filter((attachment) => isAvailable(attachment, mastery))
    .map((attachment) => attachment.attachmentId)
    .sort();
}
