import { getSample } from "./data/catalog";
import { INFO_PAGES } from "./data/pages";
import { cartPage } from "./pages/cart";
import { homePage } from "./pages/home";
import { contactPage, infoPage, menuPage, notFoundPage, ourStoryPage } from "./pages/info";
import { samplePage } from "./pages/sample";
import { quote, QuoteError } from "./quote";
import { robots, sitemap } from "./seo";

export interface Env {
  ASSETS: Fetcher;
  /** Optional canonical origin, e.g. "https://www.ashtrayapparel.com". Defaults to the request's origin. */
  SITE_ORIGIN?: string;
}

const CSP = [
  "default-src 'self'",
  "img-src 'self' data:",
  "style-src 'self'",
  "script-src 'self'",
  "font-src 'self'",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

function securityHeaders(headers: Headers): Headers {
  headers.set("Content-Security-Policy", CSP);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("Strict-Transport-Security", "max-age=31536000");
  return headers;
}

function htmlResponse(body: string, status = 200, cache = "public, max-age=0, must-revalidate"): Response {
  return new Response(body, {
    status,
    headers: securityHeaders(new Headers({ "Content-Type": "text/html; charset=utf-8", "Cache-Control": cache })),
  });
}

function textResponse(body: string, type: string, status = 200): Response {
  return new Response(body, { status, headers: securityHeaders(new Headers({ "Content-Type": type, "Cache-Control": "public, max-age=3600" })) });
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: securityHeaders(new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" })),
  });
}

const LEGACY_PAGES: Record<string, string> = {
  "/index.html": "/",
  "/products": "/",
  "/products.html": "/",
  "/cart.html": "/cart",
  "/contact.html": "/contact",
  "/our-story.html": "/our-story",
  "/refund-policy.html": "/refund-policy",
  "/privacy-policy.html": "/privacy-policy",
  "/shipping-policy.html": "/shipping-policy",
};

const MAX_BODY_BYTES = 20_000;

/**
 * Old Big Cartel and archive-copy addresses map to the new canonical paths. Repeated slashes and backslashes
 * collapse to one (so "//other.site/" can never become a redirect to another website), trailing slashes are
 * dropped, and mixed-case paths are lowered when that matches a real page.
 */
export function canonicalPath(path: string): string {
  let target = path.replace(/[/\\]+/g, "/");
  if (!target.startsWith("/")) target = `/${target}`;
  target = target.length > 1 ? target.replace(/\/+$/, "") || "/" : target;
  const mapped = mapKnown(target);
  if (mapped) return mapped;
  // Mixed-case addresses (e.g. "/Product/Basic-Mocha") only redirect when the lowercase form is a real page.
  return (target !== target.toLowerCase() && mapKnown(target.toLowerCase())) || target;
}

const PAGE_PATHS = new Set(["/", "/cart", "/menu", "/our-story", "/contact", ...INFO_PAGES.map((page) => `/${page.slug}`)]);

function mapKnown(path: string): string | undefined {
  const legacy = LEGACY_PAGES[path];
  if (legacy) return legacy;
  const legacySample = path.match(/^\/product[/-]([a-z0-9-]+?)(?:\.html)?$/);
  if (legacySample?.[1] && getSample(legacySample[1])) return `/sample/${legacySample[1]}`;
  const sample = path.match(/^\/sample\/([a-z0-9-]+)$/);
  if (PAGE_PATHS.has(path) || (sample?.[1] && getSample(sample[1]))) return path;
  return undefined;
}

/** Reads a request body as text, giving up (null) once it passes `limit` bytes. */
async function readLimited(request: Request, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("Content-Length"));
  if (Number.isFinite(declared) && declared > limit) return null;
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

export async function handle(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const origin = (env.SITE_ORIGIN || url.origin).replace(/\/+$/, "");
  const method = request.method.toUpperCase();
  const path = url.pathname;

  const target = canonicalPath(path);
  if (target !== path && (method === "GET" || method === "HEAD")) {
    const destination = new URL(`${target}${url.search}`, url.origin);
    if (destination.origin === url.origin) {
      return new Response(null, { status: 301, headers: { Location: `${destination.pathname}${destination.search}` } });
    }
  }

  if (path === "/api/quote") {
    if (method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
    const text = await readLimited(request, MAX_BODY_BYTES);
    if (text === null) return jsonResponse({ error: "too_large" }, 413);
    try {
      return jsonResponse(quote(JSON.parse(text)));
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof QuoteError) return jsonResponse({ error: "bad_request" }, 400);
      throw error;
    }
  }

  if (path === "/contact" && method === "POST") {
    // The form isn't connected yet (next build step): nothing is stored or sent. The page comes back with
    // the notice and the visitor's own text, so they can copy it into a DM.
    const text = (await readLimited(request, MAX_BODY_BYTES)) ?? "";
    const form = new URLSearchParams(text);
    const values = {
      name: (form.get("name") ?? "").slice(0, 120),
      email: (form.get("email") ?? "").slice(0, 200),
      subject: (form.get("subject") ?? "").slice(0, 200),
      message: (form.get("message") ?? "").slice(0, 5000),
    };
    return htmlResponse(contactPage(origin, values), 200, "no-store");
  }

  if (method !== "GET" && method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: securityHeaders(new Headers({ Allow: "GET, HEAD" })) });
  }

  if (path === "/") return htmlResponse(homePage(origin));
  if (path === "/cart") return htmlResponse(cartPage(origin));
  if (path === "/menu") return htmlResponse(menuPage(origin));
  if (path === "/our-story") return htmlResponse(ourStoryPage(origin));
  if (path === "/contact") return htmlResponse(contactPage(origin));
  if (path === "/robots.txt") return textResponse(robots(origin), "text/plain; charset=utf-8");
  if (path === "/sitemap.xml") return textResponse(sitemap(origin), "application/xml; charset=utf-8");
  if (path === "/healthz") return textResponse("ok\n", "text/plain; charset=utf-8");

  const sampleMatch = path.match(/^\/sample\/([a-z0-9-]+)$/);
  if (sampleMatch?.[1]) {
    const sample = getSample(sampleMatch[1]);
    if (sample) return htmlResponse(samplePage(origin, sample));
  }

  const info = INFO_PAGES.find((page) => `/${page.slug}` === path);
  if (info) return htmlResponse(infoPage(origin, info));

  return htmlResponse(notFoundPage(origin, path), 404, "no-store");
}
