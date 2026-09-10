import type {
  CandidateAttachment,
  CandidateConfiguration,
  CandidateGenerationResult,
  CandidateGeneratorInput,
} from "./types";
import { CandidateGenerationLimitError } from "./types";
import { combinationsUpTo } from "./combinations";
import {
  conflictsImmediately,
  validateCompleteCandidate,
} from "./restrictions";
import { prepareCandidateData } from "./validation";
import { pruneDominatedCandidates } from "./dominance";

interface SlotOption {
  attachmentIds: string[];
  cost: number;
  exclusiveGroupIds: string[];
}

function makeCandidateId(
  weaponId: string,
  attachmentIds: readonly string[],
): string {
  const suffix = [...attachmentIds].sort().join("+") || "base";
  return `${weaponId}__${suffix}`;
}

function buildSlotOptions(
  slotId: string,
  maxEquipped: number,
  required: boolean,
  attachments: readonly CandidateAttachment[],
  budget: number,
  restrictions: CandidateGeneratorInput["restrictions"],
): SlotOption[] {
  const combos = combinationsUpTo(
    attachments,
    required ? 1 : 0,
    maxEquipped,
  );

  const options: SlotOption[] = [];

  for (const combo of combos) {
    let cost = 0;
    const selectedIds = new Set<string>();
    const selectedGroups = new Set<string>();
    let invalid = false;

    for (const attachment of combo) {
      cost += attachment.cost;

      if (cost > budget) {
        invalid = true;
        break;
      }

      if (
        conflictsImmediately(
          attachment,
          selectedIds,
          selectedGroups,
          restrictions ?? [],
        )
      ) {
        invalid = true;
        break;
      }

      selectedIds.add(attachment.id);
      for (const groupId of attachment.exclusiveGroupIds ?? []) {
        selectedGroups.add(groupId);
      }
    }

    if (invalid) continue;

    options.push({
      attachmentIds: [...selectedIds].sort(),
      cost,
      exclusiveGroupIds: [...selectedGroups].sort(),
    });
  }

  /**
   * Menor custo primeiro para encontrar cedo fronteiras úteis
   * e tornar a enumeração determinística.
   */
  options.sort(
    (a, b) =>
      a.cost - b.cost ||
      a.attachmentIds.join("|").localeCompare(
        b.attachmentIds.join("|"),
      ),
  );

  return options;
}

function canStillSatisfyDependencies(
  selectedIds: ReadonlySet<string>,
  occupiedSlots: ReadonlySet<string>,
  remainingAttachmentIds: ReadonlySet<string>,
  remainingSlotIds: ReadonlySet<string>,
  restrictions: NonNullable<CandidateGeneratorInput["restrictions"]>,
): boolean {
  for (const restriction of restrictions) {
    if (!selectedIds.has(restriction.attachmentId)) continue;

    if (restriction.type === "REQUIRES_ATTACHMENT") {
      if (
        !selectedIds.has(restriction.requiredAttachmentId) &&
        !remainingAttachmentIds.has(
          restriction.requiredAttachmentId,
        )
      ) {
        return false;
      }
      continue;
    }

    if (restriction.type === "REQUIRES_ONE_OF") {
      const alreadySatisfied =
        restriction.requiredAttachmentIds.some((id) =>
          selectedIds.has(id),
        );

      const canStillBeSatisfied =
        restriction.requiredAttachmentIds.some((id) =>
          remainingAttachmentIds.has(id),
        );

      if (!alreadySatisfied && !canStillBeSatisfied) {
        return false;
      }
      continue;
    }

    if (restriction.type === "REQUIRES_SLOT_OCCUPIED") {
      if (
        !occupiedSlots.has(restriction.requiredSlotId) &&
        !remainingSlotIds.has(restriction.requiredSlotId)
      ) {
        return false;
      }
      continue;
    }
  }

  return true;
}

export function generateCandidates(
  input: CandidateGeneratorInput,
): CandidateGenerationResult {
  const prepared = prepareCandidateData(input);
  const restrictions = input.restrictions ?? [];
  const maxSearchNodes =
    input.maxSearchNodes ?? Number.POSITIVE_INFINITY;

  const attachmentsBySlot = new Map<string, CandidateAttachment[]>();

  for (const attachment of prepared.availableAttachments) {
    const bucket = attachmentsBySlot.get(attachment.slotId) ?? [];
    bucket.push(attachment);
    attachmentsBySlot.set(attachment.slotId, bucket);
  }

  /**
   * Geramos as opções de cada slot antes do DFS.
   * Slots com menor branching factor são processados primeiro.
   */
  const slotEntries = input.slots.map((slot) => {
    const attachments =
      attachmentsBySlot.get(slot.id) ?? [];

    const options = buildSlotOptions(
      slot.id,
      slot.maxEquipped,
      slot.required ?? false,
      attachments,
      input.budget,
      restrictions,
    );

    return {
      slot,
      attachments,
      options,
    };
  });

  slotEntries.sort(
    (a, b) =>
      a.options.length - b.options.length ||
      a.slot.id.localeCompare(b.slot.id),
  );

  /**
   * Um slot required sem nenhuma opção válida torna o espaço vazio.
   */
  if (
    slotEntries.some(
      ({ slot, options }) =>
        (slot.required ?? false) && options.length === 0,
    )
  ) {
    return {
      candidates: [],
      stats: {
        searchNodes: 0,
        completedConfigurations: 0,
        rejectedByBudget: 0,
        rejectedByImmediateConflict: 0,
        rejectedByFinalRestriction: 0,
        structuralDuplicatesRemoved: 0,
        dominatedRemoved: 0,
      },
    };
  }

  const remainingAttachmentsFromIndex: Set<string>[] = [];
  const remainingSlotsFromIndex: Set<string>[] = [];

  for (let i = 0; i <= slotEntries.length; i += 1) {
    const attachmentIds = new Set<string>();
    const slotIds = new Set<string>();

    for (let j = i; j < slotEntries.length; j += 1) {
      slotIds.add(slotEntries[j].slot.id);

      for (const attachment of slotEntries[j].attachments) {
        attachmentIds.add(attachment.id);
      }
    }

    remainingAttachmentsFromIndex[i] = attachmentIds;
    remainingSlotsFromIndex[i] = slotIds;
  }

  let searchNodes = 0;
  let completedConfigurations = 0;
  let rejectedByBudget = 0;
  let rejectedByImmediateConflict = 0;
  let rejectedByFinalRestriction = 0;

  const rawCandidates: CandidateConfiguration[] = [];

  const selectedIds = new Set<string>();
  const selectedGroups = new Set<string>();
  const occupiedSlots = new Map<string, string[]>();

  function visit(
    slotIndex: number,
    currentCost: number,
  ) {
    searchNodes += 1;

    if (searchNodes > maxSearchNodes) {
      throw new CandidateGenerationLimitError(maxSearchNodes);
    }

    if (slotIndex >= slotEntries.length) {
      completedConfigurations += 1;

      const attachmentIds = [...selectedIds].sort();

      const occupied: Record<string, readonly string[]> = {};
      for (const slot of input.slots) {
        occupied[slot.id] = [
          ...(occupiedSlots.get(slot.id) ?? []),
        ].sort();
      }

      const candidate: CandidateConfiguration = {
        id: makeCandidateId(input.weaponId, attachmentIds),
        weaponId: input.weaponId,
        attachmentIds,
        totalCost: currentCost,
        occupiedSlots: occupied,
      };

      const validation = validateCompleteCandidate(candidate, {
        weaponId: input.weaponId,
        budget: input.budget,
        slots: input.slots,
        attachmentById: prepared.attachmentById,
        restrictions,
      });

      if (!validation.valid) {
        rejectedByFinalRestriction += 1;
        return;
      }

      rawCandidates.push(candidate);
      return;
    }

    const entry = slotEntries[slotIndex];

    for (const option of entry.options) {
      const nextCost = currentCost + option.cost;

      if (nextCost > input.budget) {
        rejectedByBudget += 1;
        continue;
      }

      let conflict = false;
      const addedIds: string[] = [];
      const addedGroups: string[] = [];

      for (const attachmentId of option.attachmentIds) {
        const attachment =
          prepared.attachmentById.get(attachmentId)!;

        if (
          conflictsImmediately(
            attachment,
            selectedIds,
            selectedGroups,
            restrictions,
          )
        ) {
          conflict = true;
          break;
        }

        selectedIds.add(attachment.id);
        addedIds.push(attachment.id);

        for (const groupId of attachment.exclusiveGroupIds ?? []) {
          selectedGroups.add(groupId);
          addedGroups.push(groupId);
        }
      }

      if (conflict) {
        /**
         * Rollback dos itens já adicionados antes do conflito.
         */
        for (const id of addedIds) selectedIds.delete(id);
        for (const groupId of addedGroups) {
          selectedGroups.delete(groupId);
        }

        rejectedByImmediateConflict += 1;
        continue;
      }

      occupiedSlots.set(
        entry.slot.id,
        [...option.attachmentIds],
      );

      const occupiedSlotIds = new Set(
        [...occupiedSlots.entries()]
          .filter(([, ids]) => ids.length > 0)
          .map(([slotId]) => slotId),
      );

      const canContinue = canStillSatisfyDependencies(
        selectedIds,
        occupiedSlotIds,
        remainingAttachmentsFromIndex[slotIndex + 1],
        remainingSlotsFromIndex[slotIndex + 1],
        restrictions,
      );

      if (canContinue) {
        visit(slotIndex + 1, nextCost);
      } else {
        rejectedByFinalRestriction += 1;
      }

      occupiedSlots.delete(entry.slot.id);
      for (const id of addedIds) selectedIds.delete(id);
      for (const groupId of addedGroups) {
        selectedGroups.delete(groupId);
      }
    }
  }

  visit(0, 0);

  /**
   * Dedupe estrutural por assinatura. Em teoria o DFS já não duplica,
   * mas mantemos essa proteção para slots maxEquipped > 1 e futuras extensões.
   */
  const uniqueBySignature = new Map<string, CandidateConfiguration>();

  for (const candidate of rawCandidates) {
    const signature = candidate.attachmentIds.join("|");
    const existing = uniqueBySignature.get(signature);

    if (
      !existing ||
      candidate.totalCost < existing.totalCost ||
      (
        candidate.totalCost === existing.totalCost &&
        candidate.id.localeCompare(existing.id) < 0
      )
    ) {
      uniqueBySignature.set(signature, candidate);
    }
  }

  const structuralDuplicatesRemoved =
    rawCandidates.length - uniqueBySignature.size;

  let candidates = [...uniqueBySignature.values()].sort(
    (a, b) =>
      a.totalCost - b.totalCost ||
      a.id.localeCompare(b.id),
  );

  let dominatedRemoved = 0;

  if (input.dominance) {
    const pruned = pruneDominatedCandidates(
      candidates,
      input.dominance,
    );

    dominatedRemoved = pruned.removedIds.length;
    candidates = pruned.candidates;
  }

  return {
    candidates,
    stats: {
      searchNodes,
      completedConfigurations,
      rejectedByBudget,
      rejectedByImmediateConflict,
      rejectedByFinalRestriction,
      structuralDuplicatesRemoved,
      dominatedRemoved,
    },
  };
}
