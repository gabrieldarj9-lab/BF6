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
  const server = createBf6HttpServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("UI test server did not expose a TCP address.");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. The executable HTTP server also exposes the UI shell.
    {
      const response = await fetch(`${baseUrl}/`);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.ok(response.headers.get("content-type")?.includes("text/html"));
      assert.ok(html.includes('id="root"'));
      assert.ok(html.includes('/assets/app.js'));
      assert.ok(html.includes('cdn.tailwindcss.com/3.4.17'));
      assert.ok(html.includes('react@18.3.1'));
      assert.ok(response.headers.get("content-security-policy")?.includes("unpkg.com"));
    }

    // 2. Compiled React/TypeScript UI is served by the same process.
    {
      const response = await fetch(`${baseUrl}/assets/app.js`);
      const js = await response.text();
      assert.equal(response.status, 200);
      assert.ok(response.headers.get("content-type")?.includes("application/javascript"));
      assert.ok(js.includes("generateProgression"));
      assert.ok(js.includes("Build recomendada"));
      assert.ok(js.includes("/v1/progression"));
      assert.ok(js.includes("/v1/metrics"));
    }

    // 3. Design-system tokens and required interaction states are present.
    {
      const response = await fetch(`${baseUrl}/assets/styles.css`);
      const css = await response.text();
      assert.equal(response.status, 200);
      assert.ok(css.includes("--background: #090c10"));
      assert.ok(css.includes("--accent: #ff6a2a"));
      assert.ok(css.includes(":focus-visible"));
      assert.ok(css.includes("prefers-reduced-motion"));
      assert.ok(!css.includes("linear-gradient"), "V1 UI must not use gratuitous gradients.");
      assert.ok(!css.includes("backdrop-filter"), "V1 UI must not use glass/blur effects.");
    }

    // 4. The UI receives a transport-safe request fixture from the server.
    let demoRequest: any;
    {
      const response = await fetch(`${baseUrl}/v1/demo-request`);
      const body = await response.json() as { data: any };
      assert.equal(response.status, 200);
      demoRequest = body.data;
      assert.equal(demoRequest.weapon.id, "fixture-rifle");
      assert.ok(!("candidateDominance" in demoRequest));
      assert.ok(!("evaluateStructuralMajor" in demoRequest));
    }

    // 5. Same request consumed by the browser succeeds through the real E2E endpoint.
    {
      const response = await fetch(`${baseUrl}/v1/progression`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(demoRequest),
      });
      const body = await response.json() as { data: { progression: { metaMastery: number; reachedMeta: boolean } } };
      assert.equal(response.status, 200);
      assert.equal(body.data.progression.metaMastery, 8);
      assert.equal(body.data.progression.reachedMeta, true);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

main()
  .then(() => console.log("OK: UI integration tests passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
