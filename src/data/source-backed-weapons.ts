import type { WeaponDataRecord } from "./types";
import { automaticRifleWeaponRecords } from "./weapons/automatic-rifle-batch";
import { svdmWeaponRecord } from "./weapons/svdm";
import { svk86WeaponRecord } from "./weapons/svk-86";

export const SOURCE_BACKED_WEAPONS: readonly WeaponDataRecord[] = [
  svk86WeaponRecord,
  svdmWeaponRecord,
  ...automaticRifleWeaponRecords,
];
