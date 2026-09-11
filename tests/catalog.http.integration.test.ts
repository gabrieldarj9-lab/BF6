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
          weapons: Array<{
            id: string;
            name: string;
            classId: string;
            budgetPoints: number;
            dataStatus: string;
            engineReady: boolean;
            mastery: { minRank: number; maxRank: number };
            accessories: Array<{ id: string; costPoints: number | null }>;
          }>;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(body.data.weapons.length, 2);

      const svk = body.data.weapons.find((weapon) => weapon.id === "svk-86");
      assert.ok(svk, "SVK-8.6 must be exposed by the real catalog endpoint");
      assert.equal(svk!.name, "SVK-8.6");
      assert.equal(svk!.classId, "dmrs");
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
      assert.equal(body.data.totals.sourceBackedWeapons, 2);
      assert.equal(body.data.totals.mockWeaponsRemaining, 22);
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
