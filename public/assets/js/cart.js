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
  const announce = $("[data-cart-announce]");
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
    const rest = abs % 100;
    return `${sign}€${Math.floor(abs / 100)}${rest ? `.${String(rest).padStart(2, "0")}` : ""}`;
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "S"}`;
  const keyOf = (line) => `${line.sample}|${line.size}`;
  // "OS" is a one-size item such as a sticker.
  const sizeText = (size) => (size === "OS" ? "ONE SIZE" : `SIZE ${size}`);
  const setText = (node, text) => {
    if (node.textContent !== text) node.textContent = text;
  };

  function stateNote(line) {
    if (line.state === "sold_out") return "SOLD OUT. REMOVE IT TO CHECK OUT.";
    if (line.state === "reduced") return `ONLY ${line.maxQty} LEFT. QUANTITY LOWERED.`;
    if (line.state === "unavailable") return "NO LONGER AVAILABLE.";
    return "";
  }

  // What to focus after the list is rebuilt (the element that had focus is replaced).
  let pendingFocus = null;
  let pendingAnnouncement = "";
  let announceQuote = false;
  let codeSubmitted = false;

  const titleCase = (text) => text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

  function speak(text) {
    if (announce.textContent === text) {
      announce.textContent = "";
      requestAnimationFrame(() => {
        announce.textContent = text;
      });
    } else {
      announce.textContent = text;
    }
  }

  function updateItem(line, qty, focusHint) {
    pendingFocus = focusHint;
    const items = cart.read();
    const next = qty > 0
      ? items.map((item) => (item.sample === line.sample && item.size === line.size ? { ...item, qty } : item))
      : items.filter((item) => !(item.sample === line.sample && item.size === line.size));
    cart.write(next);
  }

  function renderRow(line, index) {
    const row = el("li", `row${line.state === "ok" ? "" : " row--problem"}`);
    row.dataset.key = keyOf(line);
    const title = line.name ? [line.name, line.colour].filter(Boolean).join(" ") : "Sample";

    if (line.image) {
      const img = el("img", "row__img");
      img.src = line.image;
      img.alt = "";
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
    meta.append(el("span", "row__size-inline", `${line.colour ? " · " : ""}${sizeText(line.size)}`));
    info.append(name, meta);
    const note = stateNote(line);
    if (note) info.append(el("span", "label label--accent", note));

    const actions = el("div", "row__actions");
    if (line.maxQty > 1 && line.qty > 0) {
      const select = el("select", "select");
      select.setAttribute("aria-label", `Quantity of ${title}, ${sizeText(line.size).toLowerCase()}`);
      select.dataset.focus = "qty";
      for (let n = 1; n <= Math.min(line.maxQty, 10); n += 1) select.append(new Option(String(n), String(n), false, n === line.qty));
      select.addEventListener("change", () => {
        pendingAnnouncement = `${title}, ${sizeText(line.size).toLowerCase()}: quantity ${select.value}.`;
        updateItem(line, Number(select.value), { key: keyOf(line), kind: "qty", index });
      });
      actions.append(select);
    } else if (line.qty > 0) {
      const qty = el("span", "row__qty-value");
      qty.append(el("span", "row__qty-label", "QTY "), String(line.qty));
      actions.append(qty);
    }
    const remove = el("button", "textbutton", "REMOVE");
    remove.type = "button";
    remove.dataset.focus = "remove";
    remove.setAttribute("aria-label", `Remove ${title}, ${sizeText(line.size).toLowerCase()}`);
    remove.addEventListener("click", () => {
      pendingAnnouncement = `Removed ${title}, ${sizeText(line.size).toLowerCase()}.`;
      updateItem(line, 0, { key: keyOf(line), kind: "remove", index });
    });
    actions.append(remove);

    const lineTotal = line.state === "sold_out" || line.state === "unavailable" ? "—" : eur(line.lineCents);
    row.append(info, el("span", "row__size", line.size === "OS" ? "ONE SIZE" : line.size), actions, el("span", "row__total", lineTotal));
    return row;
  }

  function restoreFocus() {
    if (!pendingFocus) return;
    const hint = pendingFocus;
    pendingFocus = null;
    const allRows = Array.from(rows.children);
    const same = allRows.find((row) => row.dataset.key === hint.key);
    const target =
      (same && same.querySelector(`[data-focus="${hint.kind}"]`)) ||
      (allRows[Math.min(hint.index, allRows.length - 1)] && allRows[Math.min(hint.index, allRows.length - 1)].querySelector('[data-focus="remove"]')) ||
      empty.querySelector("a");
    if (target) target.focus();
  }

  let requestId = 0;
  let lastQuote = null;

  function render(quote, items) {
    // Keep the stored cart in step with what can actually be bought.
    const synced = items
      .filter((item) => {
        const line = quote.lines.find((l) => l.sample === item.sample && l.size === item.size);
        return !line || line.state !== "unavailable";
      })
      .map((item) => {
        const line = quote.lines.find((l) => l.sample === item.sample && l.size === item.size);
        return line && line.state === "reduced" ? { ...item, qty: line.qty } : item;
      });
    if (JSON.stringify(synced) !== JSON.stringify(items)) cart.write(synced, { silent: true });

    const lines = quote.lines.filter((line) => line.state !== "unavailable");
    rows.replaceChildren(...lines.map(renderRow));
    empty.hidden = lines.length > 0;
    if (headingCount) setText(headingCount, quote.units ? `[${plural(quote.units, "SAMPLE")}]` : "");

    setText(subtotal, eur(quote.subtotalCents));
    if (quote.discount) {
      discountRow.hidden = false;
      setText(discountLabel, quote.discount.kind === "free_shipping" ? `FREE SHIPPING [${quote.discount.code}]` : `DISCOUNT [${quote.discount.code}]`);
      setText(discount, eur(-quote.discount.cents));
    } else {
      discountRow.hidden = true;
    }
    setText(shippingLabel, quote.units ? `SHIPPING [${quote.country} · ${plural(quote.units, "ITEM")}]` : "SHIPPING");
    setText(shipping, quote.shipping ? eur(quote.shipping.cents) : "—");
    if (quote.shipping) {
      delivery.replaceChildren("OMNIVA WITH TRACKING · ", el("span", "nowrap", quote.shipping.delivery));
    } else {
      delivery.replaceChildren("WE DON'T SHIP TO THAT COUNTRY YET.");
    }
    setText(total, eur(quote.totalCents));
    setText(
      codeMessage,
      quote.discount ? `* CODE APPLIED — “${quote.discount.description}”` : quote.codeMessage ? `* ${quote.codeMessage}` : "",
    );
    checkout.disabled = quote.units === 0;
    setText(checkoutMessage, "");

    restoreFocus();
    if (pendingAnnouncement || announceQuote || codeSubmitted) {
      const codeText = codeSubmitted ? (quote.discount ? `Code ${quote.discount.code} applied.` : (quote.codeMessage || "")) : "";
      const where = quote.units && quote.shipping
        ? `Shipping to ${titleCase(quote.countryName)} ${eur(quote.shipping.cents)}, ${quote.shipping.delivery.toLowerCase()}.`
        : quote.units ? "We don't ship to that country yet." : "";
      const totalText = quote.units ? `Total ${eur(quote.totalCents)}.` : "Your cart is empty.";
      speak([pendingAnnouncement, codeText, where, totalText].filter(Boolean).join(" "));
      pendingAnnouncement = "";
      announceQuote = false;
      codeSubmitted = false;
    }
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
      if (id === requestId) setText(checkoutMessage, "* COULDN'T UPDATE THE CART. CHECK YOUR CONNECTION AND TRY AGAIN.");
    }
  }

  document.addEventListener("ashtray:cart", refresh);

  country.addEventListener("change", () => {
    setStored(localStorage, COUNTRY_KEY, country.value);
    announceQuote = true;
    refresh();
  });

  codeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    codeInput.value = codeInput.value.trim().toUpperCase();
    setStored(sessionStorage, CODE_KEY, codeInput.value);
    codeSubmitted = true;
    refresh();
  });

  checkout.addEventListener("click", () => {
    if (!lastQuote) return;
    checkoutMessage.textContent = lastQuote.checkoutMessage ? `* ${lastQuote.checkoutMessage}` : "";
  });

  refresh();
})();
