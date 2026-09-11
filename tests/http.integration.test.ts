const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) {
      throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
    }
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? "assert.ok failed");
  },
  deepEqual(actual: unknown, expected: unknown, message?: string) {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) throw new Error(message ?? `${a} !== ${b}`);
  },
};

import { createBf6HttpServer } from "../src/http/server";
import { integrationFixtureRequest } from "../src/fixtures/integration-fixture";

async function main() {
  const server = createBf6HttpServer();

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("HTTP test server did not expose a TCP address.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const {
    candidateDominance: _candidateDominance,
    evaluateStructuralMajor: _evaluateStructuralMajor,
    ...httpFixture
  } = integrationFixtureRequest;

  try {
    // 1. Health/readiness surface.
    {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json() as { data: { status: string; service: string } };
      assert.equal(response.status, 200);
      assert.equal(body.data.status, "ok");
      assert.equal(body.data.service, "bf6-v1-engine");
    }

    // 2. Full progression over real HTTP request/response serialization.
    {
      const response = await fetch(`${baseUrl}/v1/progression`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(httpFixture),
      });
      const body = await response.json() as {
        data: {
          progression: {
            reachedMeta: boolean;
            metaMastery: number;
            metaBuild: { attachmentIds: string[] };
            steps: { mastery: number; importance: string }[];
          };
        };
      };

      assert.equal(response.status, 200);
      assert.equal(body.data.progression.reachedMeta, true);
      assert.equal(body.data.progression.metaMastery, 8);
      assert.deepEqual(body.data.progression.metaBuild.attachmentIds, ["heavy-ammo-conversion"]);
      assert.deepEqual(
        body.data.progression.steps.map((step) => [step.mastery, step.importance]),
        [[1, "RECOMMENDED"], [5, "MAJOR"], [8, "META"]],
      );
    }

    // 3. Metrics endpoint resolves a concrete build and derives requested metrics.
    {
      const response = await fetch(`${baseUrl}/v1/metrics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weapon: httpFixture.weapon,
          attachmentIds: ["quick-grip", "rapid-barrel"],
          metricIds: ["ttk.10m", "handling.adsTime", "fire.rpm"],
        }),
      });
      const body = await response.json() as {
        data: {
          totalCost: number;
          resolvedTechnical: Record<string, number | null>;
          metrics: Record<string, { value: number | null; evidence: string }>;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(body.data.totalCost, 30);
      assert.equal(body.data.resolvedTechnical["handling.adsTime"], 250);
      assert.equal(body.data.resolvedTechnical["fire.rpm"], 720);
      assert.equal(body.data.metrics["ttk.10m"].value, 250);
      assert.equal(body.data.metrics["ttk.10m"].evidence, "DERIVED_EXACT");
    }

    // 4. Source-backed catalog exposes both migrated DMRs with stable IDs.
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
            accessories: Array<{ name: string; slotId: string; costPoints: number | null }>;
          }>;
        };
      };

      assert.equal(response.status, 200);
      assert.equal(body.data.weapons.length, 2);

      const svk = body.data.weapons.find((weapon) => weapon.id === "svk-86");
      const svdm = body.data.weapons.find((weapon) => weapon.id === "svdm");
      assert.ok(svk);
      assert.ok(svdm);
      assert.equal(svdm?.name, "SVDM");
      assert.equal(svdm?.classId, "dmrs");
      assert.equal(svdm?.budgetPoints, 100);
      assert.equal(svdm?.dataStatus, "source-backed");
      assert.equal(svdm?.engineReady, false);
      assert.equal(svdm?.mastery.minRank, 1);
      assert.equal(svdm?.mastery.maxRank, 50);
      assert.ok(svdm?.accessories.some((item) => item.name === "IMPROVED MAG CATCH" && item.slotId === "ergonomics"));
      assert.ok(svdm?.accessories.some((item) => item.name === "620MM CLASSIC" && item.costPoints === null));
    }

    // 5. Structural input validation returns machine-readable 422 issues.
    {
      const response = await fetch(`${baseUrl}/v1/progression`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const body = await response.json() as {
        error: { code: string; issues?: { path: string; code: string; message: string }[] };
      };

      assert.equal(response.status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.issues?.some((item) => item.path === "$.weapon"));
      assert.ok(body.error.issues?.some((item) => item.path === "$.primaryProfile"));
    }

    // 6. Unknown attachment is rejected before reaching metric resolution.
    {
      const response = await fetch(`${baseUrl}/v1/metrics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          weapon: httpFixture.weapon,
          attachmentIds: ["does-not-exist"],
          metricIds: ["ttk.10m"],
        }),
      });
      const body = await response.json() as {
        error: { code: string; issues?: { code: string }[] };
      };

      assert.equal(response.status, 422);
      assert.equal(body.error.code, "VALIDATION_ERROR");
      assert.ok(body.error.issues?.some((item) => item.code === "UNKNOWN_REFERENCE"));
    }

    // 7. Invalid JSON is a transport/input error, not a 500.
    {
      const response = await fetch(`${baseUrl}/v1/progression`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not-json",
      });
      const body = await response.json() as { error: { code: string } };
      assert.equal(response.status, 400);
      assert.equal(body.error.code, "INVALID_JSON");
    }

    // 8. Oversized bodies are rejected deterministically.
    {
      const response = await fetch(`${baseUrl}/v1/progression`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ padding: "x".repeat(1024 * 1024) }),
      });
      const body = await response.json() as { error: { code: string } };
      assert.equal(response.status, 413);
      assert.equal(body.error.code, "PAYLOAD_TOO_LARGE");
    }

    // 9. Media type and routing errors are explicit.
    {
      const response = await fetch(`${baseUrl}/v1/metrics`, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "{}",
      });
      const body = await response.json() as { error: { code: string } };
      assert.equal(response.status, 415);
      assert.equal(body.error.code, "UNSUPPORTED_MEDIA_TYPE");
    }

    {
      const response = await fetch(`${baseUrl}/does-not-exist`);
      const body = await response.json() as { error: { code: string } };
      assert.equal(response.status, 404);
      assert.equal(body.error.code, "NOT_FOUND");
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

main()
  .then(() => console.log("OK: HTTP integration tests passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
