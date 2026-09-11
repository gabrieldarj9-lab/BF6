const assert = {
  equal(actual: unknown, expected: unknown, message?: string) {
    if (actual !== expected) throw new Error(message ?? `${String(actual)} !== ${String(expected)}`);
  },
  ok(value: unknown, message?: string) {
    if (!value) throw new Error(message ?? "assert.ok failed");
  },
};

import { createBf6HttpServer } from "../src/http/server";

function assetFromHtml(html: string, extension: "js" | "css"): string {
  const pattern = extension === "js"
    ? /<script[^>]+src="([^"]+\.js)"/i
    : /<link[^>]+href="([^"]+\.css)"/i;
  const match = html.match(pattern);
  if (!match?.[1]) throw new Error(`Could not find ${extension} asset in Vite HTML.`);
  return match[1];
}

async function main() {
  const server = createBf6HttpServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("UI test server did not expose a TCP address.");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    let html = "";
    let jsAsset = "";
    let cssAsset = "";

    // 1. Production shell is the Vite build: no React/Tailwind CDN runtime remains.
    {
      const response = await fetch(`${baseUrl}/`);
      html = await response.text();
      assert.equal(response.status, 200);
      assert.ok(response.headers.get("content-type")?.includes("text/html"));
      assert.ok(html.includes('id="root"'));
      assert.ok(!html.includes("cdn.tailwindcss.com"), "Production UI must not load Tailwind from CDN.");
      assert.ok(!html.includes("unpkg.com"), "Production UI must not load React from CDN.");
      assert.ok(response.headers.get("content-security-policy")?.includes("script-src 'self'"));
      assert.ok(!response.headers.get("content-security-policy")?.includes("unpkg.com"));
      jsAsset = assetFromHtml(html, "js");
      cssAsset = assetFromHtml(html, "css");
      assert.ok(jsAsset.startsWith("/assets/"));
      assert.ok(cssAsset.startsWith("/assets/"));
    }

    // 2. The Vite JavaScript bundle includes both the product UI and the shadcn showcase.
    {
      const response = await fetch(`${baseUrl}${jsAsset}`);
      const js = await response.text();
      assert.equal(response.status, 200);
      assert.ok(response.headers.get("content-type")?.includes("application/javascript"));
      assert.ok(js.includes("/v1/progression"));
      assert.ok(js.includes("/v1/metrics"));
      assert.ok(js.includes("Build recomendada agora"));
      assert.ok(js.includes("BF6 Builds Design System"));
      assert.ok(js.includes("shadcn/ui"));
      assert.ok(js.includes("Radix UI"));
      assert.ok(js.includes("Lucide"));
    }

    // 3. Compiled Tailwind v4 theme exposes the semantic BF6/shadcn tokens and accessibility motion rule.
    {
      const response = await fetch(`${baseUrl}${cssAsset}`);
      const css = await response.text();
      const compact = css.replace(/\s+/g, "");
      assert.equal(response.status, 200);
      assert.ok(response.headers.get("content-type")?.includes("text/css"));
      assert.ok(compact.includes("--background:#090c10"));
      assert.ok(compact.includes("--primary:#ff6a2a"));
      assert.ok(compact.includes("--card:#10151b"));
      assert.ok(compact.includes("--ring:#ff6a2a"));
      assert.ok(css.includes("prefers-reduced-motion"));
      assert.ok(!css.includes("backdrop-filter"), "BF6 theme must not introduce glass/blur effects.");
    }

    // 4. /design-system is a client-side route backed by the same production Vite shell.
    {
      const response = await fetch(`${baseUrl}/design-system`);
      const designHtml = await response.text();
      assert.equal(response.status, 200);
      assert.ok(response.headers.get("content-type")?.includes("text/html"));
      assert.ok(designHtml.includes('id="root"'));
      assert.equal(assetFromHtml(designHtml, "js"), jsAsset);
      assert.equal(assetFromHtml(designHtml, "css"), cssAsset);
      assert.ok(!designHtml.includes("cdn.tailwindcss.com"));
      assert.ok(!designHtml.includes("unpkg.com"));
    }

    // 5. Static asset serving is constrained to Vite's /assets tree.
    {
      const response = await fetch(`${baseUrl}/assets/%2e%2e/%2e%2e/package.json`);
      assert.equal(response.status, 404);
    }

    // 6. The product UI still receives a transport-safe request fixture from the server.
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

    // 7. Same request consumed by the product browser succeeds through the real E2E endpoint.
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
  .then(() => console.log("OK: Vite/shadcn UI integration tests passed."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
