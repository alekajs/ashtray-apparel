// Cart page: prices come from POST /api/quote; the browser only stores sample, size and quantity.
(() => {
  "use strict";

  const root = document.querySelector("[data-cart]");
  const cart = window.AshtrayCart;
  if (!root || !cart) return;

  const $ = (selector) => root.querySelector(selector);
  const rows = $("[data-cart-rows]");
  const empty = $("[data-cart-empty]");
  const country = $("[data-country]");
  const delivery = $("[data-delivery]");
  const codeForm = $("[data-code-form]");
  const codeInput = codeForm.querySelector("input");
  const codeMessage = $("[data-code-message]");
  const subtotal = $("[data-subtotal]");
  const discountRow = $("[data-discount-row]");
  const discountLabel = $("[data-discount-label]");
  const discount = $("[data-discount]");
  const shippingLabel = $("[data-shipping-label]");
  const shipping = $("[data-shipping]");
  const total = $("[data-total]");
  const checkout = $("[data-checkout]");
  const checkoutMessage = $("[data-checkout-message]");
  const headingCount = document.querySelector("[data-cart-heading-count]");

  const COUNTRY_KEY = "ashtray_country";
  const CODE_KEY = "ashtray_code";

  function getStored(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function setStored(storage, key, value) {
    try {
      if (value) storage.setItem(key, value);
      else storage.removeItem(key);
    } catch {
      // storage unavailable
    }
  }

  const savedCountry = getStored(localStorage, COUNTRY_KEY);
  if (savedCountry && Array.from(country.options).some((option) => option.value === savedCountry)) country.value = savedCountry;
  codeInput.value = getStored(sessionStorage, CODE_KEY) || "";

  const eur = (cents) => {
    const sign = cents < 0 ? "−" : "";
    const abs = Math.abs(Math.round(cents));
    return `${sign}€${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "S"}`;

  function stateNote(line) {
    if (line.state === "sold_out") return "SOLD OUT. REMOVE IT TO CHECK OUT.";
    if (line.state === "reduced") return `ONLY ${line.maxQty} LEFT. QUANTITY LOWERED.`;
    if (line.state === "unavailable") return "NO LONGER AVAILABLE.";
    return "";
  }

  function updateItem(line, qty) {
    const items = cart.read();
    const next = qty > 0
      ? items.map((item) => (item.sample === line.sample && item.size === line.size ? { ...item, qty } : item))
      : items.filter((item) => !(item.sample === line.sample && item.size === line.size));
    cart.write(next);
  }

  function renderRow(line) {
    const row = el("li", `row${line.state === "ok" ? "" : " row--problem"}`);
    const title = line.name ? `${line.name} ${line.colour}` : "Sample";

    if (line.image) {
      const img = el("img", "row__img");
      img.src = line.image;
      img.alt = title;
      img.width = 76;
      img.height = 95;
      img.loading = "lazy";
      row.append(img);
    } else {
      row.append(el("span", "row__img"));
    }

    const info = el("div", "row__info");
    const name = el(line.url ? "a" : "span", "row__name");
    if (line.url) name.href = line.url;
    name.append(line.name || "UNKNOWN SAMPLE");
    if (line.number) name.append(" ", el("span", "num", `[${line.number}]`));
    const meta = el("span", "label", line.colour || "");
    meta.append(el("span", "row__size-inline", `${line.colour ? " · " : ""}SIZE ${line.size}`));
    info.append(name, meta);
    const note = stateNote(line);
    if (note) info.append(el("span", "label label--accent", note));
    const remove = el("button", "textbutton", "REMOVE");
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${title}, size ${line.size}`);
    remove.addEventListener("click", () => updateItem(line, 0));
    info.append(remove);

    const qty = el("div", "row__qty");
    if (line.maxQty > 1 && line.qty > 0) {
      const select = el("select", "select");
      select.setAttribute("aria-label", `Quantity of ${title}, size ${line.size}`);
      for (let n = 1; n <= Math.min(line.maxQty, 10); n += 1) select.append(new Option(String(n), String(n), false, n === line.qty));
      select.addEventListener("change", () => updateItem(line, Number(select.value)));
      qty.append(select);
    } else if (line.qty > 0) {
      qty.append(el("span", "label label--ink", `QTY ${line.qty}`));
    }

    const lineTotal = line.state === "sold_out" || line.state === "unavailable" ? "—" : eur(line.lineCents);
    row.append(info, el("span", "row__size", line.size), qty, el("span", "row__total", lineTotal));
    return row;
  }

  let requestId = 0;
  let lastQuote = null;

  function render(quote, items) {
    const synced = items.map((item) => {
      const line = quote.lines.find((l) => l.sample === item.sample && l.size === item.size);
      return line && line.state === "reduced" ? { ...item, qty: line.qty } : item;
    });
    if (JSON.stringify(synced) !== JSON.stringify(items)) cart.write(synced, { silent: true });

    rows.replaceChildren(...quote.lines.map(renderRow));
    empty.hidden = quote.lines.length > 0;
    if (headingCount) headingCount.textContent = quote.units ? `[${plural(quote.units, "SAMPLE")}]` : "";

    subtotal.textContent = eur(quote.subtotalCents);
    if (quote.discount) {
      discountRow.hidden = false;
      discountLabel.textContent = quote.discount.kind === "free_shipping" ? `FREE SHIPPING [${quote.discount.code}]` : `DISCOUNT [${quote.discount.code}]`;
      discount.textContent = eur(-quote.discount.cents);
    } else {
      discountRow.hidden = true;
    }
    shippingLabel.textContent = quote.units ? `SHIPPING [${quote.country} · ${plural(quote.units, "ITEM")}]` : "SHIPPING";
    shipping.textContent = quote.shipping ? eur(quote.shipping.cents) : "—";
    delivery.textContent = quote.shipping ? `OMNIVA WITH TRACKING · ${quote.shipping.delivery}` : "WE DON'T SHIP TO THAT COUNTRY YET.";
    total.textContent = eur(quote.totalCents);
    codeMessage.textContent = quote.discount
      ? `* CODE APPLIED — “${quote.discount.description}”`
      : quote.codeMessage
        ? `* ${quote.codeMessage}`
        : "";
    checkout.disabled = quote.units === 0;
    checkoutMessage.textContent = "";
  }

  async function refresh() {
    const items = cart.read();
    const id = ++requestId;
    try {
      const response = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, country: country.value, code: codeInput.value }),
      });
      if (!response.ok) throw new Error(`quote failed: ${response.status}`);
      const quote = await response.json();
      if (id !== requestId) return;
      lastQuote = quote;
      render(quote, items);
    } catch {
      if (id === requestId) checkoutMessage.textContent = "* COULDN'T UPDATE THE CART. CHECK YOUR CONNECTION AND TRY AGAIN.";
    }
  }

  document.addEventListener("ashtray:cart", refresh);

  country.addEventListener("change", () => {
    setStored(localStorage, COUNTRY_KEY, country.value);
    refresh();
  });

  codeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    codeInput.value = codeInput.value.trim().toUpperCase();
    setStored(sessionStorage, CODE_KEY, codeInput.value);
    refresh();
  });

  checkout.addEventListener("click", () => {
    if (!lastQuote) return;
    checkoutMessage.textContent = lastQuote.checkoutMessage ? `* ${lastQuote.checkoutMessage}` : "";
  });

  refresh();
})();
