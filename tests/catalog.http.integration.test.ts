const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? "assert.ok failed");
  },
};

import { createBf6HttpServer } from "../src/http/server";

async function main() {
  const server = createBf6HttpServer({ serveUi: false });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Catalog test server did not expose a TCP address.");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    {
      const response = await fetch(`${baseUrl}/v1/catalog`);
      const body = await response.json() as {
        data: {
          classes: Array<{ id: string }>;
          weapons: Array<{
            id: string;
            name: string;
            classId: string;
            legacyMockId?: string;
            budgetPoints: number;
            careerUnlockLevel?: number;
            dataStatus: string;
            engineReady: boolean;
            mastery: { minRank: number; maxRank: number };
            accessories: Array<{ id: string; costPoints: number | null }>;
          }>;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(body.data.weapons.length, 8);
      assert.ok(body.data.classes.some((weaponClass) => weaponClass.id === "dmrs"));
      assert.ok(body.data.classes.some((weaponClass) => weaponClass.id === "carbines"));
      assert.ok(body.data.classes.some((weaponClass) => weaponClass.id === "assault-rifles"));

      const svk = body.data.weapons.find((weapon) => weapon.id === "svk-86");
      assert.ok(svk, "SVK-8.6 must be exposed by the real catalog endpoint");
      assert.equal(svk!.name, "SVK-8.6");
      assert.equal(svk!.classId, "dmrs");
      assert.equal(svk!.legacyMockId, "svk");
      assert.equal(svk!.budgetPoints, 100);
      assert.equal(svk!.dataStatus, "source-backed");
      assert.equal(svk!.mastery.minRank, 1);
      assert.equal(svk!.mastery.maxRank, 50);
      assert.ok(svk!.accessories.length > 20);
      assert.equal(svk!.engineReady, false);

      const svdm = body.data.weapons.find((weapon) => weapon.id === "svdm");
      assert.ok(svdm, "SVDM must be exposed by the real catalog endpoint");
      assert.equal(svdm!.classId, "dmrs");
      assert.equal(svdm!.budgetPoints, 100);
      assert.equal(svdm!.dataStatus, "source-backed");
      assert.equal(svdm!.mastery.minRank, 1);
      assert.equal(svdm!.mastery.maxRank, 50);
      assert.equal(svdm!.engineReady, false);

      const m4a1 = body.data.weapons.find((weapon) => weapon.id === "m4a1");
      const ak205 = body.data.weapons.find((weapon) => weapon.id === "ak-205");
      const qbz192 = body.data.weapons.find((weapon) => weapon.id === "qbz-192");
      const m433 = body.data.weapons.find((weapon) => weapon.id === "m433");
      const nvo228e = body.data.weapons.find((weapon) => weapon.id === "nvo-228e");
      const tr7 = body.data.weapons.find((weapon) => weapon.id === "tr-7");

      for (const weapon of [m4a1, ak205, qbz192]) {
        assert.ok(weapon, "All migrated carbines must be exposed");
        assert.equal(weapon!.classId, "carbines");
        assert.equal(weapon!.budgetPoints, 100);
        assert.equal(weapon!.mastery.minRank, 1);
        assert.equal(weapon!.mastery.maxRank, 50);
        assert.equal(weapon!.engineReady, false);
        assert.ok(weapon!.accessories.length > 30);
      }

      for (const weapon of [m433, nvo228e, tr7]) {
        assert.ok(weapon, "All migrated assault rifles must be exposed");
        assert.equal(weapon!.classId, "assault-rifles");
        assert.equal(weapon!.budgetPoints, 100);
        assert.equal(weapon!.mastery.minRank, 1);
        assert.equal(weapon!.mastery.maxRank, 50);
        assert.equal(weapon!.engineReady, false);
        assert.ok(weapon!.accessories.length > 30);
      }

      assert.equal(m4a1!.careerUnlockLevel, 2);
      assert.equal(ak205!.careerUnlockLevel, 22);
      assert.equal(qbz192!.careerUnlockLevel, undefined);
      assert.equal(m433!.careerUnlockLevel, 1);
      assert.equal(nvo228e!.careerUnlockLevel, 5);
      assert.equal(nvo228e!.legacyMockId, "nvo-228");
      assert.equal(tr7!.careerUnlockLevel, 50);
    }

    {
      const response = await fetch(`${baseUrl}/v1/catalog/report`);
      const body = await response.json() as {
        data: {
          totals: {
            manifestWeapons: number;
            sourceBackedWeapons: number;
            mockWeaponsRemaining: number;
            structuralErrors: number;
          };
          nextBatch: number | null;
          nextBatchWeaponIds: string[];
        };
      };

      assert.equal(response.status, 200);
      assert.equal(body.data.totals.manifestWeapons, 24);
      assert.equal(body.data.totals.sourceBackedWeapons, 8);
      assert.equal(body.data.totals.mockWeaponsRemaining, 16);
      assert.equal(body.data.totals.structuralErrors, 0);
      assert.equal(body.data.nextBatch, 1);
      assert.equal(body.data.nextBatchWeaponIds[0], "m39-emr");
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

main()
  .then(() => console.log("OK: source-backed catalog HTTP test passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
