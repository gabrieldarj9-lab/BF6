import type { WeaponCategoryId } from "../../scoring/types";

export type WeaponMigrationArchetype =
  | "DMR_SEMIAUTO"
  | "AUTOMATIC_RIFLE"
  | "SMG"
  | "LMG"
  | "SECONDARY"
  | "BOLT_ACTION"
  | "SHOTGUN";

export interface WeaponManifestEntry {
  id: string;
  name: string;
  classId: string;
  categoryId: WeaponCategoryId;
  archetype: WeaponMigrationArchetype;
  migrationBatch: number;
  legacyMockId?: string;
}

export const WEAPON_MANIFEST: readonly WeaponManifestEntry[] = [
  { id: "svk-86", name: "SVK-8.6", classId: "dmrs", categoryId: "dmr", archetype: "DMR_SEMIAUTO", migrationBatch: 1, legacyMockId: "svk" },
  { id: "svdm", name: "SVDM", classId: "dmrs", categoryId: "dmr", archetype: "DMR_SEMIAUTO", migrationBatch: 1 },
  { id: "m39-emr", name: "M39 EMR", classId: "dmrs", categoryId: "dmr", archetype: "DMR_SEMIAUTO", migrationBatch: 1 },

  { id: "m4a1", name: "M4A1", classId: "carbines", categoryId: "carbines", archetype: "AUTOMATIC_RIFLE", migrationBatch: 2 },
  { id: "ak-205", name: "AK-205", classId: "carbines", categoryId: "carbines", archetype: "AUTOMATIC_RIFLE", migrationBatch: 2 },
  { id: "qbz-192", name: "QBZ-192", classId: "carbines", categoryId: "carbines", archetype: "AUTOMATIC_RIFLE", migrationBatch: 2 },
  { id: "m433", name: "M433", classId: "assault-rifles", categoryId: "assault-rifles", archetype: "AUTOMATIC_RIFLE", migrationBatch: 2 },
  { id: "nvo-228e", name: "NVO-228E", classId: "assault-rifles", categoryId: "assault-rifles", archetype: "AUTOMATIC_RIFLE", migrationBatch: 2, legacyMockId: "nvo-228" },
  { id: "tr-7", name: "TR-7", classId: "assault-rifles", categoryId: "assault-rifles", archetype: "AUTOMATIC_RIFLE", migrationBatch: 2 },

  { id: "pw5a3", name: "PW5A3", classId: "smgs", categoryId: "smt", archetype: "SMG", migrationBatch: 3 },
  { id: "scw-10", name: "SCW-10", classId: "smgs", categoryId: "smt", archetype: "SMG", migrationBatch: 3 },
  { id: "sgx", name: "SGX", classId: "smgs", categoryId: "smt", archetype: "SMG", migrationBatch: 3 },

  { id: "p18", name: "P18", classId: "secondaries", categoryId: "secondary", archetype: "SECONDARY", migrationBatch: 4 },
  { id: "m45a1", name: "M45A1", classId: "secondaries", categoryId: "secondary", archetype: "SECONDARY", migrationBatch: 4 },
  { id: "g57", name: "G57", classId: "secondaries", categoryId: "secondary", archetype: "SECONDARY", migrationBatch: 4 },

  { id: "l110", name: "L110", classId: "lmgs", categoryId: "ml", archetype: "LMG", migrationBatch: 5 },
  { id: "m240l", name: "M240L", classId: "lmgs", categoryId: "ml", archetype: "LMG", migrationBatch: 5 },
  { id: "rpkm", name: "RPKM", classId: "lmgs", categoryId: "ml", archetype: "LMG", migrationBatch: 5 },

  { id: "m2010-esr", name: "M2010 ESR", classId: "snipers", categoryId: "sniper-rifles", archetype: "BOLT_ACTION", migrationBatch: 6 },
  { id: "sv-98", name: "SV-98", classId: "snipers", categoryId: "sniper-rifles", archetype: "BOLT_ACTION", migrationBatch: 6 },
  { id: "m98b", name: "M98B", classId: "snipers", categoryId: "sniper-rifles", archetype: "BOLT_ACTION", migrationBatch: 6 },

  { id: "m87a1", name: "M87A1", classId: "shotguns", categoryId: "shotguns", archetype: "SHOTGUN", migrationBatch: 7 },
  { id: "m1014", name: "M1014", classId: "shotguns", categoryId: "shotguns", archetype: "SHOTGUN", migrationBatch: 7 },
  { id: "12m-auto", name: "12M Auto", classId: "shotguns", categoryId: "shotguns", archetype: "SHOTGUN", migrationBatch: 7 },
];

export function getWeaponManifestEntry(weaponId: string) {
  return WEAPON_MANIFEST.find((weapon) => weapon.id === weaponId);
}
