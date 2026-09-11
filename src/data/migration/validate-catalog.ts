import type { WeaponDataRecord } from "../types";
import { WEAPON_MANIFEST } from "./weapon-manifest";

export type CatalogValidationSeverity = "ERROR" | "WARNING";

export interface CatalogValidationIssue {
  severity: CatalogValidationSeverity;
  code: string;
  weaponId?: string;
  path: string;
  message: string;
}

function duplicateValues(values: readonly string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

export function validateSourceBackedCatalog(
  weapons: readonly WeaponDataRecord[],
): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const manifestById = new Map(WEAPON_MANIFEST.map((weapon) => [weapon.id, weapon]));

  for (const id of duplicateValues(WEAPON_MANIFEST.map((weapon) => weapon.id))) {
    issues.push({
      severity: "ERROR",
      code: "DUPLICATE_MANIFEST_ID",
      path: `manifest.${id}`,
      message: `Weapon manifest contains duplicate id ${id}.`,
    });
  }

  for (const id of duplicateValues(weapons.map((weapon) => weapon.id))) {
    issues.push({
      severity: "ERROR",
      code: "DUPLICATE_SOURCE_BACKED_ID",
      weaponId: id,
      path: `weapons.${id}`,
      message: `Source-backed registry contains duplicate weapon id ${id}.`,
    });
  }

  for (const weapon of weapons) {
    const manifest = manifestById.get(weapon.id);
    if (!manifest) {
      issues.push({
        severity: "ERROR",
        code: "WEAPON_NOT_IN_MANIFEST",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}`,
        message: `Source-backed weapon ${weapon.id} is not present in the canonical manifest.`,
      });
    } else {
      if (manifest.name !== weapon.name) {
        issues.push({
          severity: "ERROR",
          code: "NAME_MISMATCH",
          weaponId: weapon.id,
          path: `weapons.${weapon.id}.name`,
          message: `Manifest name ${manifest.name} does not match record name ${weapon.name}.`,
        });
      }
      if (manifest.categoryId !== weapon.categoryId) {
        issues.push({
          severity: "ERROR",
          code: "CATEGORY_MISMATCH",
          weaponId: weapon.id,
          path: `weapons.${weapon.id}.categoryId`,
          message: `Manifest category ${manifest.categoryId} does not match record category ${weapon.categoryId}.`,
        });
      }
    }

    if (weapon.budget !== 100) {
      issues.push({
        severity: "ERROR",
        code: "INVALID_BUDGET",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.budget`,
        message: `Weapon budget must be 100 points; received ${weapon.budget}.`,
      });
    }

    if (weapon.mastery.minRank < 0 || weapon.mastery.minRank > 1 || weapon.mastery.maxRank !== 50) {
      issues.push({
        severity: "ERROR",
        code: "INVALID_MASTERY_RANGE",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.mastery`,
        message: `Internal mastery must start at 0/1 and end at 50; received ${weapon.mastery.minRank}-${weapon.mastery.maxRank}.`,
      });
    }

    const sourceIds = weapon.sources.map((source) => source.id);
    for (const sourceId of duplicateValues(sourceIds)) {
      issues.push({
        severity: "ERROR",
        code: "DUPLICATE_SOURCE_ID",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.sources.${sourceId}`,
        message: `Source id ${sourceId} is duplicated within ${weapon.id}.`,
      });
    }
    const sourceIdSet = new Set(sourceIds);

    const slotIds = weapon.slots.map((slot) => slot.id);
    for (const slotId of duplicateValues(slotIds)) {
      issues.push({
        severity: "ERROR",
        code: "DUPLICATE_SLOT_ID",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.slots.${slotId}`,
        message: `Slot ${slotId} is duplicated within ${weapon.id}.`,
      });
    }
    const slotIdSet = new Set(slotIds);

    for (const attachmentId of duplicateValues(weapon.attachments.map((attachment) => attachment.id))) {
      issues.push({
        severity: "ERROR",
        code: "DUPLICATE_ATTACHMENT_ID",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.attachments.${attachmentId}`,
        message: `Attachment id ${attachmentId} is duplicated within ${weapon.id}.`,
      });
    }

    for (const attachment of weapon.attachments) {
      const basePath = `weapons.${weapon.id}.attachments.${attachment.id}`;
      if (!slotIdSet.has(attachment.slotId)) {
        issues.push({
          severity: "ERROR",
          code: "UNKNOWN_ATTACHMENT_SLOT",
          weaponId: weapon.id,
          path: `${basePath}.slotId`,
          message: `Attachment ${attachment.id} references undeclared slot ${attachment.slotId}.`,
        });
      }
      if (attachment.costPoints !== null && (attachment.costPoints < 0 || attachment.costPoints > weapon.budget)) {
        issues.push({
          severity: "ERROR",
          code: "INVALID_ATTACHMENT_COST",
          weaponId: weapon.id,
          path: `${basePath}.costPoints`,
          message: `Attachment ${attachment.id} has invalid cost ${attachment.costPoints}.`,
        });
      }
      if (attachment.unlock.type === "MASTERY" && (attachment.unlock.level < 1 || attachment.unlock.level > 50)) {
        issues.push({
          severity: "ERROR",
          code: "INVALID_ATTACHMENT_MASTERY",
          weaponId: weapon.id,
          path: `${basePath}.unlock.level`,
          message: `Attachment ${attachment.id} unlock mastery ${attachment.unlock.level} is outside M1-M50.`,
        });
      }
      if (!attachment.sourceIds.length) {
        issues.push({
          severity: "ERROR",
          code: "ATTACHMENT_WITHOUT_SOURCE",
          weaponId: weapon.id,
          path: `${basePath}.sourceIds`,
          message: `Attachment ${attachment.id} has no source evidence.`,
        });
      }
      for (const sourceId of attachment.sourceIds) {
        if (!sourceIdSet.has(sourceId)) {
          issues.push({
            severity: "ERROR",
            code: "UNKNOWN_ATTACHMENT_SOURCE",
            weaponId: weapon.id,
            path: `${basePath}.sourceIds`,
            message: `Attachment ${attachment.id} references unknown source ${sourceId}.`,
          });
        }
      }
    }

    for (const stat of weapon.baseStatEvidence) {
      for (const observation of stat.observations) {
        if (!sourceIdSet.has(observation.sourceId)) {
          issues.push({
            severity: "ERROR",
            code: "UNKNOWN_STAT_SOURCE",
            weaponId: weapon.id,
            path: `weapons.${weapon.id}.baseStatEvidence.${stat.metricId}`,
            message: `Metric ${stat.metricId} references unknown source ${observation.sourceId}.`,
          });
        }
      }
    }

    if (!weapon.sources.length) {
      issues.push({
        severity: "ERROR",
        code: "WEAPON_WITHOUT_SOURCES",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.sources`,
        message: `Source-backed weapon ${weapon.id} must declare at least one source.`,
      });
    }

    if (!weapon.attachments.length) {
      issues.push({
        severity: "WARNING",
        code: "WEAPON_WITHOUT_ATTACHMENTS",
        weaponId: weapon.id,
        path: `weapons.${weapon.id}.attachments`,
        message: `Source-backed weapon ${weapon.id} does not have attachments cataloged yet.`,
      });
    }
  }

  return issues;
}
