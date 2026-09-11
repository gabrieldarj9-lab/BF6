import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { generateWeaponProgression } from "../api/generate-weapon-progression";
import { queryBuildMetrics } from "../api/query-build-metrics";
import { getPublicWeaponCatalog } from "../data/catalog";
import { integrationFixtureRequest } from "../fixtures/integration-fixture";
import type { HttpErrorBody, HttpSuccessBody } from "./types";
import {
  asMetricsRequest,
  asProgressionRequest,
  validateMetricsRequest,
  validateProgressionRequest,
} from "./validation";

export interface HttpServerOptions {
  maxBodyBytes?: number;
  serveUi?: boolean;
}

function sendStatic(
  response: ServerResponse,
  status: number,
  contentType: string,
  body: string | Buffer,
  cacheControl: string,
) {
  response.statusCode = status;
  response.setHeader("content-type", contentType);
  response.setHeader("cache-control", cacheControl);
  response.setHeader("x-content-type-options", "nosniff");
  response.end(body);
}

function projectRoot() {
  return resolve(__dirname, "../../..");
}

function contentTypeFor(file: string): string {
  switch (extname(file).toLowerCase()) {
    case ".html": return "text/html; charset=utf-8";
    case ".js": return "application/javascript; charset=utf-8";
    case ".css": return "text/css; charset=utf-8";
    case ".json": return "application/json; charset=utf-8";
    case ".svg": return "image/svg+xml; charset=utf-8";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

function setUiSecurityHeaders(response: ServerResponse) {
  response.setHeader(
    "content-security-policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  );
  response.setHeader("referrer-policy", "same-origin");
}

function tryServeUi(path: string, response: ServerResponse): boolean {
  const uiRoot = resolve(projectRoot(), "dist/frontend");

  if (path === "/" || path === "/design-system") {
    try {
      const file = resolve(uiRoot, "index.html");
      const body = readFileSync(file, "utf8");
      setUiSecurityHeaders(response);
      sendStatic(response, 200, contentTypeFor(file), body, "no-store");
      return true;
    } catch {
      return false;
    }
  }

  const isBundledAsset = path.startsWith("/assets/");
  const isPublicWeaponAsset = path.startsWith("/weapons/");
  if (!isBundledAsset && !isPublicWeaponAsset) return false;

  let decodedPath: string;
  try {
    decodedPath = decodeURIComponent(path);
  } catch {
    return false;
  }

  const file = resolve(uiRoot, `.${decodedPath}`);
  const allowedPrefix = `${uiRoot}${sep}`;
  if (!file.startsWith(allowedPrefix)) return false;

  try {
    const body = readFileSync(file);
    sendStatic(response, 200, contentTypeFor(file), body, "public, max-age=31536000, immutable");
    return true;
  } catch {
    return false;
  }
}

class HttpInputError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: HttpErrorBody["error"]["code"],
    message: string,
  ) {
    super(message);
    this.name = "HttpInputError";
  }
}

function sendJson<T>(response: ServerResponse, status: number, body: T) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(JSON.stringify(body));
}

function success<T>(data: T): HttpSuccessBody<T> {
  return { data };
}

function errorBody(
  code: HttpErrorBody["error"]["code"],
  message: string,
  issues?: HttpErrorBody["error"]["issues"],
): HttpErrorBody {
  return { error: { code, message, ...(issues?.length ? { issues } : {}) } };
}

function contentTypeIsJson(request: IncomingMessage): boolean {
  const raw = request.headers["content-type"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.toLowerCase().split(";", 1)[0]?.trim() === "application/json";
}

function readJsonBody(request: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  return new Promise((resolveBody, reject) => {
    let body = "";
    let bytes = 0;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    request.on("data", (chunk) => {
      if (settled) return;
      const text = String(chunk);
      bytes += new TextEncoder().encode(text).byteLength;
      if (bytes > maxBodyBytes) {
        fail(new HttpInputError(413, "PAYLOAD_TOO_LARGE", `Request body exceeds ${maxBodyBytes} bytes.`));
        return;
      }
      body += text;
    });

    request.on("end", () => {
      if (settled) return;
      settled = true;
      if (!body.trim()) {
        resolveBody({});
        return;
      }
      try {
        resolveBody(JSON.parse(body));
      } catch {
        reject(new HttpInputError(400, "INVALID_JSON", "Request body is not valid JSON."));
      }
    });
    request.on("error", fail);
  });
}

async function routeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  maxBodyBytes: number,
  serveUi: boolean,
) {
  const method = (request.method ?? "GET").toUpperCase();
  const url = new URL(request.url ?? "/", "http://localhost");
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;

  if (method === "GET" && path === "/health") {
    sendJson(response, 200, success({ status: "ok", service: "bf6-v1-engine" }));
    return;
  }

  if (method === "GET" && path === "/v1") {
    sendJson(response, 200, success({
      name: "BF6 V1 Engine HTTP API",
      endpoints: {
        catalog: "GET /v1/catalog",
        progression: "POST /v1/progression",
        metrics: "POST /v1/metrics",
        demoRequest: "GET /v1/demo-request",
        health: "GET /health",
        ui: "GET /",
        designSystem: "GET /design-system",
      },
    }));
    return;
  }

  if (method === "GET" && path === "/v1/catalog") {
    sendJson(response, 200, success(getPublicWeaponCatalog()));
    return;
  }

  if (method === "GET" && path === "/v1/demo-request") {
    const {
      candidateDominance: _candidateDominance,
      evaluateStructuralMajor: _evaluateStructuralMajor,
      ...transportFixture
    } = integrationFixtureRequest;
    sendJson(response, 200, success(transportFixture));
    return;
  }

  if (method === "POST" && (path === "/v1/progression" || path === "/v1/metrics")) {
    if (!contentTypeIsJson(request)) {
      throw new HttpInputError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json.");
    }

    const body = await readJsonBody(request, maxBodyBytes);

    if (path === "/v1/progression") {
      const issues = validateProgressionRequest(body);
      if (issues.length) {
        sendJson(response, 422, errorBody("VALIDATION_ERROR", "Request validation failed.", issues));
        return;
      }
      try {
        const result = generateWeaponProgression(asProgressionRequest(body));
        sendJson(response, 200, success(result));
      } catch (error) {
        sendJson(response, 422, errorBody(
          "ENGINE_VALIDATION_ERROR",
          error instanceof Error ? error.message : "Progression request could not be processed.",
        ));
      }
      return;
    }

    const issues = validateMetricsRequest(body);
    if (issues.length) {
      sendJson(response, 422, errorBody("VALIDATION_ERROR", "Request validation failed.", issues));
      return;
    }
    try {
      const result = queryBuildMetrics(asMetricsRequest(body));
      sendJson(response, 200, success(result));
    } catch (error) {
      sendJson(response, 422, errorBody(
        "ENGINE_VALIDATION_ERROR",
        error instanceof Error ? error.message : "Metrics request could not be processed.",
      ));
    }
    return;
  }

  if (serveUi && method === "GET" && tryServeUi(path, response)) return;

  sendJson(response, 404, errorBody("NOT_FOUND", `No route for ${method} ${path}.`));
}

export function createBf6HttpServer(options: HttpServerOptions = {}): Server {
  const maxBodyBytes = options.maxBodyBytes ?? 1024 * 1024;
  const serveUi = options.serveUi ?? true;
  return createServer(async (request, response) => {
    try {
      await routeRequest(request, response, maxBodyBytes, serveUi);
    } catch (error) {
      if (error instanceof HttpInputError) {
        sendJson(response, error.status, errorBody(error.code, error.message));
        return;
      }
      sendJson(response, 500, errorBody(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Unexpected server error.",
      ));
    }
  });
}
