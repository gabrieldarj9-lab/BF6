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

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/v1/catalog`);
    const body = await response.json() as {
      data: {
        weapons: Array<{
          id: string;
          name: string;
          classId: string;
          budgetPoints: number;
          dataStatus: string;
          engineReady: boolean;
          mastery: { maxRank: number };
          accessories: Array<{ id: string; costPoints: number | null }>;
        }>;
      };
    };

    assert.equal(response.status, 200);
    const svk = body.data.weapons.find((weapon) => weapon.id === "svk-86");
    assert.ok(svk, "SVK-8.6 must be exposed by the real catalog endpoint");
    assert.equal(svk!.name, "SVK-8.6");
    assert.equal(svk!.classId, "dmrs");
    assert.equal(svk!.budgetPoints, 100);
    assert.equal(svk!.dataStatus, "source-backed");
    assert.equal(svk!.mastery.maxRank, 50);
    assert.ok(svk!.accessories.length > 20);
    assert.equal(svk!.engineReady, false);
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
