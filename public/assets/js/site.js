// Menu, cart count, add to cart and the phone photo index. No dependencies.
(() => {
  "use strict";

  const KEY = "ashtray_cart_v1";

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(value)) return [];
      return value
        .filter((item) => item && typeof item.sample === "string" && typeof item.size === "string" && Number.isInteger(item.qty) && item.qty > 0)
        .slice(0, 20);
    } catch {
      return [];
    }
  }

  function count(items) {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }

  function renderCount(items = read()) {
    const n = count(items);
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
      el.textContent = n ? ` ${n}` : "";
    });
    document.querySelectorAll("[data-cart-count-bracket]").forEach((el) => {
      el.textContent = n ? `[${n}]` : "";
    });
  }

  function write(items, options = {}) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // Private mode or storage full: the cart simply won't persist.
    }
    renderCount(items);
    if (!options.silent) document.dispatchEvent(new CustomEvent("ashtray:cart"));
  }

  window.AshtrayCart = Object.freeze({ read, write, count });
  renderCount();

  window.addEventListener("storage", (event) => {
    if (event.key !== KEY) return;
    renderCount();
    document.dispatchEvent(new CustomEvent("ashtray:cart"));
  });

  // ---------------------------------------------------------------- menu
  const menu = document.getElementById("menu");
  let lastTrigger = null;

  document.querySelectorAll("[data-menu-open]").forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (!menu || typeof menu.showModal !== "function") return; // falls back to the /menu page
      event.preventDefault();
      lastTrigger = trigger;
      renderCount();
      menu.showModal();
      document.body.classList.add("menu-open");
    });
  });

  if (menu) {
    menu.querySelectorAll("[data-menu-close]").forEach((button) => {
      button.addEventListener("click", () => menu.close());
    });
    menu.addEventListener("close", () => {
      document.body.classList.remove("menu-open");
      if (lastTrigger) lastTrigger.focus();
    });
  }

  // ---------------------------------------------------------------- add to cart
  document.querySelectorAll("form[data-add-to-cart]").forEach((form) => {
    const status = form.querySelector("[data-add-status]");
    const button = form.querySelector("[data-add-button]");
    let timer = 0;

    function setStatus(text, withCartLink) {
      if (!status) return;
      status.textContent = text;
      if (withCartLink) {
        const link = document.createElement("a");
        link.href = "/cart";
        link.textContent = "VIEW CART →";
        status.append(" ", link);
      }
      status.classList.remove("label--faint");
      status.classList.add("label--ink");
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const choice = form.querySelector('input[name="size"]:checked');
      if (!choice) {
        setStatus("PICK A SIZE FIRST.", false);
        const firstOpen = form.querySelector('input[name="size"]:not(:disabled)');
        if (firstOpen) firstOpen.focus();
        return;
      }
      const sample = form.dataset.sample;
      const size = choice.value;
      const stock = Number(choice.dataset.stock || "0");
      const items = read();
      const existing = items.find((item) => item.sample === sample && item.size === size);
      if ((existing ? existing.qty : 0) >= stock) {
        setStatus(`SIZE ${size} IS ALREADY IN YOUR CART.`, true);
        return;
      }
      if (existing) existing.qty += 1;
      else items.push({ sample, size, qty: 1 });
      write(items);
      setStatus(`ADDED SIZE ${size}.`, true);
      if (button) {
        button.textContent = "[ ADDED ]";
        clearTimeout(timer);
        timer = setTimeout(() => {
          button.textContent = "[ ADD TO CART ]";
        }, 2000);
      }
    });
  });

  // ---------------------------------------------------------------- photo index (phones)
  document.querySelectorAll("[data-gallery]").forEach((track) => {
    const index = track.parentElement && track.parentElement.querySelector("[data-gallery-index]");
    if (!index) return;
    const buttons = Array.from(index.querySelectorAll("button"));
    const figures = Array.from(track.querySelectorAll(".fig"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const figure = document.getElementById(button.dataset.target || "");
        if (!figure) return;
        track.scrollTo({ left: figure.offsetLeft - figures[0].offsetLeft, behavior: reduceMotion ? "auto" : "smooth" });
      });
    });

    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const current = figures.indexOf(entry.target);
          buttons.forEach((button, i) => button.setAttribute("aria-current", String(i === current)));
        });
      },
      { root: track, threshold: 0.6 },
    );
    figures.forEach((figure) => observer.observe(figure));
  });
})();
