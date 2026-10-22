/* Cravins: shopping cart (Phase 3)

   Part 1: cart data. Only ids and quantities are stored; names, prices and
   photos are rebuilt from CRAVINS_DATA every time, so a stale or edited
   localStorage entry can never change what something costs.
   Part 2: the slide-out panel.

   Listens for "cravins:add" (fired by catalogue.js) and announces
   "cravins:cart-change" so checkout (Phase 4) can react.
*/
(function () {
  "use strict";

  var D = window.CRAVINS_DATA;
  if (!D) return;

  var STORAGE_KEY = "cravins-cart-v1";
  var MAX_QTY = 99;
  var entries = []; // [{ productId, quantity, flavourId?, scoops?, addOnIds? }]

  /* ---------- helpers ---------- */
  function find(list, test) {
    for (var i = 0; i < list.length; i++) if (test(list[i])) return list[i];
    return null;
  }
  function byId(list, id) { return find(list, function (x) { return x.id === id; }); }
  function money(n) { return "₦" + Number(n).toLocaleString("en-NG"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Part 1: cart data ---------- */
  function keyOf(e) {
    if (!e.flavourId) return e.productId;
    return e.productId + "|" + e.flavourId + "|" + e.scoops + "|" + (e.addOnIds || []).slice().sort().join(",");
  }

  /* Turn a stored entry into a displayable line, or null if it no longer matches the menu. */
  function resolve(e) {
    var p = byId(D.products, e.productId);
    if (!p) return null;
    var line = { key: keyOf(e), name: p.name, quantity: e.quantity, unitPrice: 0, detail: "", image: p.image || null, imageAlt: p.imageAlt || "" };

    if (p.type === "ice-cream-builder") {
      var flavour = byId(D.flavours, e.flavourId);
      var scoop = find(D.scoopOptions, function (s) { return s.count === e.scoops; });
      if (!flavour || !scoop) return null;
      var price = scoop.price;
      var names = [];
      for (var i = 0; i < (e.addOnIds || []).length; i++) {
        var a = byId(D.addOns, e.addOnIds[i]);
        if (!a) return null;
        price += a.price;
        names.push(a.name);
      }
      line.unitPrice = price;
      line.detail = flavour.name + " · " + scoop.count + (scoop.count === 1 ? " scoop" : " scoops") + (names.length ? " · + " + names.join(", ") : "");
      line.image = flavour.image;
      line.imageAlt = flavour.imageAlt;
    } else {
      line.unitPrice = p.price;
    }
    return line;
  }

  function sanitize(raw) {
    var clean = [];
    if (!Array.isArray(raw)) return clean;
    raw.forEach(function (r) {
      if (!r || typeof r !== "object" || typeof r.productId !== "string") return;
      var qty = Math.floor(Number(r.quantity));
      if (!isFinite(qty) || qty < 1) return;
      var e = { productId: r.productId, quantity: Math.min(qty, MAX_QTY) };
      if (r.flavourId !== undefined) {
        if (typeof r.flavourId !== "string" || !Array.isArray(r.addOnIds)) return;
        e.flavourId = r.flavourId;
        e.scoops = Math.floor(Number(r.scoops));
        e.addOnIds = r.addOnIds.filter(function (x) { return typeof x === "string"; });
      }
      if (!resolve(e)) return;
      var existing = find(clean, function (c) { return keyOf(c) === keyOf(e); });
      if (existing) existing.quantity = Math.min(existing.quantity + e.quantity, MAX_QTY);
      else clean.push(e);
    });
    return clean;
  }

  function load() {
    try { entries = sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY))); }
    catch (err) { entries = []; }
  }
  function save() {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch (err) { /* storage unavailable: cart still works for this visit */ }
  }

  function getLines() {
    return entries.map(resolve).filter(Boolean);
  }
  function getCount() {
    return entries.reduce(function (n, e) { return n + e.quantity; }, 0);
  }
  function getTotal() {
    return getLines().reduce(function (sum, l) { return sum + l.unitPrice * l.quantity; }, 0);
  }

  function changed() {
    save();
    render();
    document.dispatchEvent(new CustomEvent("cravins:cart-change", { detail: { count: getCount(), total: getTotal() } }));
  }

  function add(detail) {
    if (!detail) return;
    var e = { productId: detail.productId, quantity: Math.max(1, Math.min(MAX_QTY, Math.floor(Number(detail.quantity)) || 1)) };
    if (detail.options && detail.options.flavour) {
      e.flavourId = detail.options.flavour.id;
      e.scoops = Number(detail.options.scoops);
      e.addOnIds = (detail.options.addOns || []).map(function (a) { return a.id; });
    }
    if (!resolve(e)) return;
    var existing = find(entries, function (c) { return keyOf(c) === keyOf(e); });
    if (existing) existing.quantity = Math.min(existing.quantity + e.quantity, MAX_QTY);
    else entries.push(e);
    bumpBadge();
    changed();
  }

  function setQuantity(key, qty) {
    var e = find(entries, function (c) { return keyOf(c) === key; });
    if (!e) return;
    if (qty < 1) { remove(key); return; }
    e.quantity = Math.min(qty, MAX_QTY);
    changed();
  }
  function remove(key) {
    entries = entries.filter(function (c) { return keyOf(c) !== key; });
    changed();
  }
  function clear() {
    entries = [];
    changed();
  }

  /* ---------- Part 2: slide-out panel ---------- */
  var panel = document.getElementById("cart-panel");
  var overlay = document.getElementById("cart-overlay");
  var body = document.getElementById("cart-body");
  var totalEl = document.getElementById("cart-total");
  var checkoutBtn = document.getElementById("cart-checkout");
  var clearBtn = document.getElementById("cart-clear");
  var closeBtn = document.getElementById("cart-close");
  var cartBtn = document.querySelector(".cart-btn");
  var badge = document.querySelector("[data-cart-count]");
  var lastFocus = null;

  function bumpBadge() {
    if (!badge) return;
    badge.classList.remove("is-bump");
    void badge.offsetWidth;
    badge.classList.add("is-bump");
  }

  function lineHTML(l) {
    var thumb = l.image
      ? '<img class="cart-line__thumb" src="' + esc(l.image) + '" alt="" width="64" height="64">'
      : '<span class="cart-line__thumb cart-line__thumb--empty" aria-hidden="true"></span>';
    return '<li class="cart-line" data-key="' + esc(l.key) + '">' + thumb +
      '<div class="cart-line__main">' +
      '<p class="cart-line__name">' + esc(l.name) + "</p>" +
      (l.detail ? '<p class="cart-line__detail">' + esc(l.detail) + "</p>" : "") +
      '<p class="cart-line__unit">' + money(l.unitPrice) + " each</p>" +
      '<div class="cart-line__controls">' +
      '<div class="qty" role="group" aria-label="Quantity of ' + esc(l.name) + '">' +
      '<button type="button" class="qty__btn" data-act="dec" aria-label="Decrease quantity of ' + esc(l.name) + '">−</button>' +
      '<span class="qty__num" aria-live="polite">' + l.quantity + "</span>" +
      '<button type="button" class="qty__btn" data-act="inc" aria-label="Increase quantity of ' + esc(l.name) + '"' + (l.quantity >= MAX_QTY ? " disabled" : "") + ">+</button></div>" +
      '<p class="cart-line__sub">' + money(l.unitPrice * l.quantity) + "</p></div>" +
      '<button type="button" class="cart-line__remove" data-act="remove" aria-label="Remove ' + esc(l.name) + ' from cart">Remove</button>' +
      "</div></li>";
  }

  function render() {
    var lines = getLines();
    var count = getCount();

    if (badge) badge.textContent = String(count);
    if (cartBtn) cartBtn.setAttribute("aria-label", "Open cart, " + count + (count === 1 ? " item" : " items"));
    if (!panel) return;

    if (!lines.length) {
      body.innerHTML = '<div class="cart-empty"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>' +
        "<h3>Your cart is empty</h3><p>Add something sweet from the menu.</p>" +
        '<button type="button" class="clay-btn clay-btn--primary clay-btn--small" data-act="browse">Browse the menu</button></div>';
    } else {
      body.innerHTML = '<ul class="cart-lines">' + lines.map(lineHTML).join("") + "</ul>";
    }
    totalEl.textContent = money(getTotal());
    checkoutBtn.disabled = !lines.length;
    clearBtn.hidden = !lines.length;
  }

  function open() {
    if (!panel || panel.classList.contains("is-open")) return;
    lastFocus = document.activeElement;
    panel.classList.add("is-open");
    overlay.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("cart-open");
    window.setTimeout(function () { closeBtn.focus(); }, 30);
  }
  function close() {
    if (!panel || !panel.classList.contains("is-open")) return;
    panel.classList.remove("is-open");
    overlay.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("cart-open");
    document.dispatchEvent(new CustomEvent("cravins:cart-close"));
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (panel) {
    if (cartBtn) cartBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", close);
    clearBtn.addEventListener("click", clear);

    body.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      if (btn.getAttribute("data-act") === "browse") {
        close();
        var menu = document.getElementById("menu");
        if (menu) menu.scrollIntoView({ block: "start" });
        return;
      }
      var li = btn.closest(".cart-line");
      if (!li) return;
      var key = li.getAttribute("data-key");
      var entry = find(entries, function (c) { return keyOf(c) === key; });
      if (!entry) return;
      var act = btn.getAttribute("data-act");
      if (act === "inc") setQuantity(key, entry.quantity + 1);
      else if (act === "dec") setQuantity(key, entry.quantity - 1);
      else if (act === "remove") remove(key);
    });

    /* Escape closes; Tab stays inside the open panel. */
    document.addEventListener("keydown", function (e) {
      if (!panel.classList.contains("is-open")) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      var focusable = Array.prototype.filter.call(
        panel.querySelectorAll("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"),
        function (el) { return el.getClientRects().length > 0; }
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  document.addEventListener("cravins:add", function (e) { add(e.detail); });

  /* Keep several open tabs in step. */
  window.addEventListener("storage", function (e) {
    if (e.key === STORAGE_KEY) { load(); render(); }
  });

  window.CravinsCart = { add: add, setQuantity: setQuantity, remove: remove, clear: clear, getLines: getLines, getCount: getCount, getTotal: getTotal, open: open, close: close };

  load();
  render();
})();
