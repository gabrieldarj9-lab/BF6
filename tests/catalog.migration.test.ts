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
import { SOURCE_BACKED_WEAPONS } from "../src/data/source-backed-weapons";

{
  const report = getCatalogMigrationReport();

  assert.equal(WEAPON_MANIFEST.length, 24);
  assert.equal(report.totals.manifestWeapons, 24);
  assert.equal(report.totals.sourceBackedWeapons, 8);
  assert.equal(report.totals.mockWeaponsRemaining, 16);
  assert.equal(report.totals.structuralErrors, 0);
  assert.equal(report.nextBatch, 1);
  assert.equal(report.nextBatchWeaponIds.length, 1);
  assert.equal(report.nextBatchWeaponIds[0], "m39-emr");

  const svk = report.weapons.find((weapon) => weapon.id === "svk-86");
  const svdm = report.weapons.find((weapon) => weapon.id === "svdm");
  const m39 = report.weapons.find((weapon) => weapon.id === "m39-emr");
  const m4a1 = report.weapons.find((weapon) => weapon.id === "m4a1");
  const ak205 = report.weapons.find((weapon) => weapon.id === "ak-205");
  const qbz192 = report.weapons.find((weapon) => weapon.id === "qbz-192");
  const m433 = report.weapons.find((weapon) => weapon.id === "m433");
  const nvo228e = report.weapons.find((weapon) => weapon.id === "nvo-228e");
  const tr7 = report.weapons.find((weapon) => weapon.id === "tr-7");

  assert.ok(svk?.sourceBacked);
  assert.ok(svk?.catalogValid);
  assert.equal(svk?.engineReady, false);
  assert.ok(svdm?.sourceBacked);
  assert.ok(svdm?.catalogValid);
  assert.equal(svdm?.engineReady, false);
  assert.equal(m39?.sourceBacked, false);

  for (const weapon of [m4a1, ak205, qbz192, m433, nvo228e, tr7]) {
    assert.ok(weapon?.sourceBacked);
    assert.ok(weapon?.catalogValid);
    assert.equal(weapon?.engineReady, false);
  }

  const manifestM4 = WEAPON_MANIFEST.find((weapon) => weapon.id === "m4a1");
  const manifestM433 = WEAPON_MANIFEST.find((weapon) => weapon.id === "m433");
  const manifestNvo = WEAPON_MANIFEST.find((weapon) => weapon.id === "nvo-228e");
  const manifestTr7 = WEAPON_MANIFEST.find((weapon) => weapon.id === "tr-7");
  assert.equal(manifestM4?.classId, "carbines");
  assert.equal(manifestM433?.classId, "assault-rifles");
  assert.equal(manifestNvo?.legacyMockId, "nvo-228");
  assert.equal(manifestTr7?.classId, "assault-rifles");

  const qbzRecord = SOURCE_BACKED_WEAPONS.find((weapon) => weapon.id === "qbz-192");
  assert.ok(qbzRecord);
  assert.equal(qbzRecord?.careerUnlockLevel, undefined);
  assert.ok(qbzRecord?.baseStatEvidence.some((stat) => stat.metricId === "unlock.careerLevel"));

  const m4Record = SOURCE_BACKED_WEAPONS.find((weapon) => weapon.id === "m4a1");
  const m4Carbine = m4Record?.attachments.find((attachment) => attachment.name === '14.5" CARBINE');
  assert.ok(m4Carbine);
  assert.equal(m4Carbine?.costPoints, null);
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
