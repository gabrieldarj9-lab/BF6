const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? "assert.ok failed");
  },
};

import { getCatalogMigrationReport } from "../src/data/migration/catalog-report";
import { WEAPON_MANIFEST } from "../src/data/migration/weapon-manifest";

{
  const report = getCatalogMigrationReport();

  assert.equal(WEAPON_MANIFEST.length, 24);
  assert.equal(report.totals.manifestWeapons, 24);
  assert.equal(report.totals.sourceBackedWeapons, 2);
  assert.equal(report.totals.mockWeaponsRemaining, 22);
  assert.equal(report.totals.structuralErrors, 0);
  assert.equal(report.nextBatch, 1);
  assert.equal(report.nextBatchWeaponIds.length, 1);
  assert.equal(report.nextBatchWeaponIds[0], "m39-emr");

  const svk = report.weapons.find((weapon) => weapon.id === "svk-86");
  const svdm = report.weapons.find((weapon) => weapon.id === "svdm");
  const m39 = report.weapons.find((weapon) => weapon.id === "m39-emr");

  assert.ok(svk?.sourceBacked);
  assert.ok(svk?.catalogValid);
  assert.equal(svk?.engineReady, false);
  assert.ok(svdm?.sourceBacked);
  assert.ok(svdm?.catalogValid);
  assert.equal(svdm?.engineReady, false);
  assert.equal(m39?.sourceBacked, false);
}

console.log("OK: catalog migration coverage test passed.");
