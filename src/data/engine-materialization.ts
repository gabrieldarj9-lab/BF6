import type { EngineWeaponDefinition } from "../api/types";
import type { WeaponDataRecord, WeaponEngineReadiness } from "./types";

export class WeaponDataNotReadyError extends Error {
  constructor(
    public readonly weaponId: string,
    public readonly diagnostics: readonly string[],
  ) {
    super(`Weapon ${weaponId} is not ready for engine materialization: ${diagnostics.join("; ")}`);
    this.name = "WeaponDataNotReadyError";
  }
}

function distinctNumericValues(values: readonly number[]) {
  return [...new Set(values.map((value) => Number(value.toPrecision(10))))];
}

export function inspectWeaponEngineReadiness(weapon: WeaponDataRecord): WeaponEngineReadiness {
  const diagnostics: string[] = [];

  if (!weapon.engineBase) {
    diagnostics.push("technical baseline is not reconciled");
  }

  for (const stat of weapon.baseStatEvidence) {
    const values = distinctNumericValues(stat.observations.map((observation) => observation.value));
    if (values.length > 1) {
      diagnostics.push(`conflicting source values for ${stat.metricId}: ${values.join(" vs ")}`);
    }
  }

  for (const attachment of weapon.attachments) {
    if (attachment.costPoints === null) {
      diagnostics.push(`missing point cost for attachment ${attachment.id}`);
    }
    if (attachment.unlock.type === "UNKNOWN") {
      diagnostics.push(`unresolved unlock for attachment ${attachment.id}`);
    }
    if (attachment.effects === null) {
      diagnostics.push(`unverified engine effects for attachment ${attachment.id}`);
    }
  }

  return {
    ready: diagnostics.length === 0,
    diagnostics,
  };
}

export function materializeEngineWeaponDefinition(weapon: WeaponDataRecord): EngineWeaponDefinition {
  const readiness = inspectWeaponEngineReadiness(weapon);
  if (!readiness.ready || !weapon.engineBase) {
    throw new WeaponDataNotReadyError(weapon.id, readiness.diagnostics);
  }

  return {
    id: weapon.id,
    categoryId: weapon.categoryId,
    budget: weapon.budget,
    slots: weapon.slots,
    restrictions: weapon.restrictions,
    attachments: weapon.attachments.map((attachment) => ({
      id: attachment.id,
      slotId: attachment.slotId,
      cost: attachment.costPoints!,
      unlock: attachment.unlock.type === "DEFAULT"
        ? { type: "DEFAULT", label: attachment.unlock.label }
        : attachment.unlock.type === "MASTERY"
          ? { type: "MASTERY", level: attachment.unlock.level, label: attachment.unlock.label }
          : attachment.unlock.type === "SEASONAL" || attachment.unlock.type === "ASSIGNMENT"
            ? { type: "SEASONAL", label: attachment.unlock.label }
            : { type: "UNKNOWN", label: attachment.unlock.label },
      effects: attachment.effects!,
    })),
    base: weapon.engineBase,
  };
}
