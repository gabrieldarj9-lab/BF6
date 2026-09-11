const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? "assert.ok failed");
  },
};

import { buildSourceBackedWeaponBatch } from "../src/data/migration/batch-builder";
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

// O builder permite cadastrar um lote declarativamente sem repetir budget,
// mastery, ids derivados, sourceIds e effects=null em cada acessório.
{
  const [weapon] = buildSourceBackedWeaponBatch([
    {
      id: "fixture-batch-weapon",
      name: "Fixture Batch Weapon",
      categoryId: "dmr",
      slots: [{ id: "scope", maxEquipped: 1 }],
      sources: [{
        id: "fixture-source",
        kind: "OTHER",
        title: "Fixture source",
        url: "https://example.com/fixture",
        observedAt: "2026-09-11",
      }],
      defaultAttachmentSourceIds: ["fixture-source"],
      attachments: [{
        name: "TEST OPTIC 2.00X",
        slotId: "scope",
        costPoints: 10,
        unlock: { type: "DEFAULT", label: "Disponível por padrão" },
      }],
      baseStatEvidence: [],
    },
  ]);

  assert.ok(weapon);
  assert.equal(weapon!.budget, 100);
  assert.equal(weapon!.mastery.minRank, 0);
  assert.equal(weapon!.mastery.maxRank, 50);
  assert.equal(weapon!.attachments[0]?.id, "fixture-batch-weapon-test-optic-2-00x");
  assert.equal(weapon!.attachments[0]?.sourceIds[0], "fixture-source");
  assert.equal(weapon!.attachments[0]?.effects, null);
}

console.log("OK: catalog migration coverage test passed.");
