import { describe, expect, it } from "vitest";
import { canonicalPath, handle, type Env } from "../src/router";
import { escapeHtml, html } from "../src/html";
import { SAMPLES } from "../src/data/catalog";

const env = { ASSETS: { fetch: async () => new Response("asset") } } as unknown as Env;
const get = (path: string, init?: RequestInit) => handle(new Request(`https://ashtray.test${path}`, init), env);

describe("html", () => {
  it("escapes interpolated values", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    expect(html`<p>${"<script>"}</p>`.value).toBe("<p>&lt;script&gt;</p>");
    expect(html`<p>${["a", html`<b>b</b>`]}</p>`.value).toBe("<p>a<b>b</b></p>");
    expect(html`<p>${null}${undefined}${false}</p>`.value).toBe("<p></p>");
  });
});

describe("canonicalPath", () => {
  it("maps old addresses to new ones", () => {
    expect(canonicalPath("/product/basic-mocha")).toBe("/sample/basic-mocha");
    expect(canonicalPath("/product/basic-mocha/")).toBe("/sample/basic-mocha");
    expect(canonicalPath("/product-crawler")).toBe("/sample/crawler");
    expect(canonicalPath("/product-kiss-tee.html")).toBe("/sample/kiss-tee");
    expect(canonicalPath("/products")).toBe("/");
    expect(canonicalPath("/products.html")).toBe("/");
    expect(canonicalPath("/our-story/")).toBe("/our-story");
    expect(canonicalPath("/cart.html")).toBe("/cart");
    expect(canonicalPath("/")).toBe("/");
    expect(canonicalPath("/product/unknown")).toBe("/product/unknown");
    expect(canonicalPath("/Product/Basic-Mocha")).toBe("/sample/basic-mocha");
    expect(canonicalPath("/OUR-STORY")).toBe("/our-story");
  });

  it("never produces a protocol-relative path", () => {
    for (const path of ["//evil.com/", "///evil.com/", String.raw`/\evil.com/`, "//evil.com/x/", String.raw`/\/evil.com`]) {
      expect(canonicalPath(path).startsWith("//")).toBe(false);
    }
  });
});

describe("pages", () => {
  it.each([
    ["/", "Sample Library | Ashtray"],
    ["/cart", "Cart | Ashtray"],
    ["/menu", "Menu | Ashtray"],
    ["/our-story", "Our Story | Ashtray"],
    ["/refund-policy", "Refund policy | Ashtray"],
    ["/privacy-policy", "Privacy policy | Ashtray"],
    ["/shipping-policy", "Shipping policy | Ashtray"],
    ["/contact", "Contact | Ashtray"],
  ])("%s renders", async (path, title) => {
    const res = await get(path);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/html");
    expect(res.headers.get("Content-Security-Policy")).toContain("default-src 'self'");
    const body = await res.text();
    expect(body).toContain(`<title>${title}</title>`);
    expect(body).not.toMatch(/style="/);
  });

  it("renders every sample page with its number, price and sizes", async () => {
    for (const sample of SAMPLES) {
      const res = await get(`/sample/${sample.slug}`);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain(`SAMPLE [${sample.number}]`);
      expect(body).toContain(`data-sample="${sample.slug}"`);
      for (const size of sample.sizes) expect(body).toContain(`value="${size.code}"`);
    }
  });

  it("lists all samples on the home page in number order", async () => {
    const body = await (await get("/")).text();
    const positions = SAMPLES.map((s) => body.indexOf(`href="/sample/${s.slug}"`));
    expect(positions.every((p) => p > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(body).toContain("SOLD OUT");
    expect(body.indexOf('class="library__intro label"')).toBeLessThan(body.indexOf('class="grid"'));
    expect(body).toContain("If enough pre-orders go through, you receive the piece. If not, you&#39;re refunded.");
  });

  it("shows sold-out samples without an add button", async () => {
    const body = await (await get("/sample/kiss-tee")).text();
    expect(body).toContain("[ SOLD OUT ]");
    expect(body).not.toContain("data-add-button");
  });

  it("never redirects to another website", async () => {
    for (const path of ["//evil.com/", "///evil.com/", "//evil.com/x/?q=1", "/%2F%2Fevil.com/"]) {
      const res = await get(path);
      const location = res.headers.get("Location");
      if (location) {
        expect(location.startsWith("/")).toBe(true);
        expect(location.startsWith("//")).toBe(false);
      }
    }
  });

  it("escapes the requested path on the 404 page and leaves out canonical links", async () => {
    const res = await get('/nope/"><script>alert(1)</script>');
    const body = await res.text();
    expect(res.status).toBe(404);
    expect(body).not.toContain("<script>alert(1)");
    expect(body).not.toContain('rel="canonical"');
  });

  it("keeps policy links on this site", async () => {
    for (const path of ["/refund-policy", "/shipping-policy", "/privacy-policy"]) {
      const body = await (await get(path)).text();
      expect(body).not.toContain("bigcartel");
    }
    expect(await (await get("/refund-policy")).text()).toContain('<a href="/contact">Contact page</a>');
  });

  it("sends security headers including HSTS", async () => {
    const res = await get("/");
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("redirects old links permanently", async () => {
    const res = await get("/product/basic-olive?ref=ig");
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("/sample/basic-olive?ref=ig");
  });

  it("returns a styled 404", async () => {
    const res = await get("/nope/nothing");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("NOT FOUND.");
    expect((await get("/sample/ghost")).status).toBe(404);
  });

  it("refuses cross-site contact posts and oversized bodies", async () => {
    const body = new URLSearchParams({ name: "x", message: "fake" }).toString();
    const cross = await get("/contact", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://evil.example" }, body });
    expect(cross.status).toBe(403);
    expect(await cross.text()).not.toContain("fake");
    const huge = await get("/contact", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "message=" + "a".repeat(70_000) });
    expect(huge.status).toBe(413);
    const unicode = await get("/contact", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ message: "ž".repeat(4000) }).toString() });
    expect(unicode.status).toBe(200);
    expect(await unicode.text()).toContain("ž".repeat(4000));
  });

  it("never cuts an emoji in half", async () => {
    const res = await get("/contact", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ name: "a" + "🚀".repeat(100) }).toString() });
    const text = await res.text();
    expect(text).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
  });

  it("answers the contact form without storing anything and keeps the visitor's text, escaped", async () => {
    const res = await get("/contact", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name: "Ann", email: "a@b.c", message: "hi </textarea><script>x</script>" }).toString(),
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("THE CONTACT FORM OPENS SOON");
    expect(body).toContain('value="Ann"');
    expect(body).toContain("hi &lt;/textarea&gt;&lt;script&gt;x&lt;/script&gt;");
  });

  it("serves robots.txt and a sitemap with every public page", async () => {
    expect(await (await get("/robots.txt")).text()).toContain("Sitemap: https://ashtray.test/sitemap.xml");
    const map = await (await get("/sitemap.xml")).text();
    for (const s of SAMPLES) expect(map).toContain(`https://ashtray.test/sample/${s.slug}`);
    expect(map).not.toContain("/cart");
  });

  it("uses SITE_ORIGIN for canonical links when set", async () => {
    const res = await handle(new Request("https://ashtray-apparel.example.workers.dev/"), { ...env, SITE_ORIGIN: "https://ashtrayapparel.com" });
    expect(await res.text()).toContain('<link rel="canonical" href="https://ashtrayapparel.com/">');
  });

  it("forwards www to the main domain in one hop", async () => {
    const site = { ...env, SITE_ORIGIN: "https://ashtrayapparel.com" };
    const home = await handle(new Request("https://www.ashtrayapparel.com/?utm_source=instagram"), site);
    expect(home.status).toBe(301);
    expect(home.headers.get("Location")).toBe("https://ashtrayapparel.com/?utm_source=instagram");
    const old = await handle(new Request("https://www.ashtrayapparel.com/product/basic-mocha"), site);
    expect(old.headers.get("Location")).toBe("https://ashtrayapparel.com/sample/basic-mocha");
    const sneaky = await handle(new Request("https://www.ashtrayapparel.com//evil.example/x"), site);
    expect(new URL(sneaky.headers.get("Location") ?? "").hostname).toBe("ashtrayapparel.com");
    const post = await handle(new Request("https://www.ashtrayapparel.com/contact", { method: "POST", body: "a=1" }), site);
    expect(post.status).toBe(308);
    expect(post.headers.get("Location")).toBe("https://ashtrayapparel.com/contact");
    for (const path of ["//evil.example/x", String.raw`/\evil.example/x`]) {
      const sneakyPost = await handle(new Request(`https://www.ashtrayapparel.com${path}`, { method: "POST", body: "a=1" }), site);
      expect(new URL(sneakyPost.headers.get("Location") ?? "").hostname).toBe("ashtrayapparel.com");
    }
    const direct = await handle(new Request("https://ashtrayapparel.com/"), site);
    expect(direct.status).toBe(200);
  });

  it("labels the library grid with the name and a whole-euro price only", async () => {
    const body = await (await get("/")).text();
    expect(body).not.toContain("tile__colour");
    expect(body).not.toMatch(/tile__name">[^<]*<span class="num">/);
    for (const s of SAMPLES) expect(body).toContain(`<span class="tile__num" aria-hidden="true">[${s.number}]</span>`);
    expect(body).toContain(">€15</span>");
    expect(body).toContain(">€55</span>");
    expect(body).not.toContain("€15.00");
  });

  it("sends plain http to https in one hop, except on this computer", async () => {
    const res = await handle(new Request("http://ashtray-apparel.example.workers.dev/product/basic-mocha?ref=ig"), env);
    expect(res.status).toBe(301);
    expect(res.headers.get("Location")).toBe("https://ashtray-apparel.example.workers.dev/sample/basic-mocha?ref=ig");
    const post = await handle(new Request("http://ashtray-apparel.example.workers.dev/contact", { method: "POST", body: "a=1" }), env);
    expect(post.status).toBe(308);
    expect(post.headers.get("Location")).toBe("https://ashtray-apparel.example.workers.dev/contact");
    const sneaky = await handle(new Request("http://ashtray-apparel.example.workers.dev//evil.example/x", { method: "POST", body: "a=1" }), env);
    expect(new URL(sneaky.headers.get("Location") ?? "").hostname).toBe("ashtray-apparel.example.workers.dev");
    expect((await handle(new Request("http://127.0.0.1:8787/"), env)).status).toBe(200);
  });

  it("renders newly added samples without a description", async () => {
    const res = await get("/sample/cyber-tee-red");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("<title>CYBER TEE RED [08] | Ashtray</title>");
    expect(body).not.toContain("SPEC SHEET");
    expect(body).toContain("€50");
    const jeans = await (await get("/sample/baggy-jeans")).text();
    expect(jeans).toContain("<title>BAGGY JEANS [05] | Ashtray</title>");
    expect(jeans).not.toMatch(/BAGGY JEANS {2}|BAGGY JEANS in |library: \./);
  });

  it("opens links to other websites in a new tab", async () => {
    for (const path of ["/", "/sample/basic-mocha", "/cart", "/contact", "/menu", "/refund-policy", "/shipping-policy", "/our-story"]) {
      const body = await (await get(path)).text();
      const external = [...body.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g)].map((m) => m[0]);
      expect(external.length).toBeGreaterThan(0);
      for (const tag of external) {
        expect(tag, `${path}: ${tag}`).toContain('target="_blank"');
        expect(tag, `${path}: ${tag}`).toContain('rel="noopener"');
      }
    }
  });

  it("rejects other methods on pages", async () => {
    expect((await get("/", { method: "POST" })).status).toBe(405);
  });
});

describe("/api/quote", () => {
  const post = (body: string) => get("/api/quote", { method: "POST", body, headers: { "Content-Type": "application/json" } });

  it("returns a priced quote", async () => {
    const res = await post(JSON.stringify({ items: [{ sample: "basic-mocha", size: "L", qty: 1 }], country: "LV" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const data = (await res.json()) as { totalCents: number };
    expect(data.totalCents).toBe(5750);
  });

  it("rejects bad JSON, big bodies and GET", async () => {
    expect((await post("{nope")).status).toBe(400);
    expect((await post(JSON.stringify({ items: "x".repeat(30000) }))).status).toBe(413);
    const wrongMethod = await get("/api/quote");
    expect(wrongMethod.status).toBe(405);
    expect(wrongMethod.headers.get("Allow")).toBe("POST");
  });
});
