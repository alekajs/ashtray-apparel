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
  });

  it("shows sold-out samples without an add button", async () => {
    const body = await (await get("/sample/kiss-tee")).text();
    expect(body).toContain("[ SOLD OUT ]");
    expect(body).not.toContain("data-add-button");
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

  it("answers the contact form without storing anything", async () => {
    const res = await get("/contact", { method: "POST", body: new URLSearchParams({ name: "a", email: "a@b.c", message: "hi" }) });
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("THE CONTACT FORM OPENS SOON");
  });

  it("serves robots.txt and a sitemap with every public page", async () => {
    expect(await (await get("/robots.txt")).text()).toContain("Sitemap: https://ashtray.test/sitemap.xml");
    const map = await (await get("/sitemap.xml")).text();
    for (const s of SAMPLES) expect(map).toContain(`https://ashtray.test/sample/${s.slug}`);
    expect(map).not.toContain("/cart");
  });

  it("uses SITE_ORIGIN for canonical links when set", async () => {
    const res = await handle(new Request("https://ashtray-apparel.example.workers.dev/"), { ...env, SITE_ORIGIN: "https://www.ashtrayapparel.com" });
    expect(await res.text()).toContain('<link rel="canonical" href="https://www.ashtrayapparel.com/">');
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
    expect((await get("/api/quote")).status).toBe(405);
  });
});
