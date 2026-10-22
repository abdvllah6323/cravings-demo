/* Cravins: catalogue (Phase 2)
   Renders the category cards and product grid from CRAVINS_DATA, handles
   category filtering and the ice cream builder (flavour, scoops, add-ons).

   Add-to-cart is not wired to a cart yet (Phase 3). Every add fires a
   "cravins:add" event on document with the order line in event.detail, which
   the cart will listen for.
*/
(function () {
  "use strict";

  var D = window.CRAVINS_DATA;
  var grid = document.getElementById("product-grid");
  var catGrid = document.getElementById("category-grid");
  if (!D || !grid || !catGrid) return;

  var statusEl = document.getElementById("catalogue-status");
  var clearBtn = document.getElementById("clear-filter");
  var liveEl = document.getElementById("sr-live");

  var state = { category: null, flavourId: null, scoops: 1, addOns: {} };

  /* ---------- helpers ---------- */
  function money(n) { return "₦" + Number(n).toLocaleString("en-NG"); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function categoryName(id) { var c = find(D.categories, id); return c ? c.name : ""; }

  /* ---------- small inline icons ---------- */
  var ICONS = {
    shake: '<path d="M18 24h28l-3.5 29a3 3 0 0 1-3 2.6H24.5a3 3 0 0 1-3-2.6L18 24z"/><path d="M16 24c0-7 7-12 16-12s16 5 16 12"/><path d="M36 13l5-9"/><path d="M22 36h20"/>',
    wrap: '<rect x="21" y="8" width="22" height="46" rx="11" transform="rotate(32 32 31)"/><path d="M22 28l15 9"/><path d="M26 20l15 9"/>',
    bottle: '<path d="M28 6h8v9l4 6v33a4 4 0 0 1-4 4H28a4 4 0 0 1-4-4V21l4-6V6z"/><path d="M24 32h16"/><path d="M24 44h16"/>',
    camera: '<path d="M10 22h10l4-6h16l4 6h10v30H10z"/><circle cx="32" cy="37" r="8"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.camera) + "</svg>";
  }

  function pendingPhoto() {
    return '<div class="photo-pending">' + icon("camera", "photo-pending__icon") + "<span>Photo pending</span></div>";
  }

  /* ---------- categories ---------- */
  function countLabel(cat) {
    if (cat.id === "ice-cream") return D.flavours.length + " flavours";
    var n = D.products.filter(function (p) { return p.category === cat.id; }).length;
    return n + (n === 1 ? " item" : " items");
  }

  function renderCategories() {
    catGrid.innerHTML = D.categories.map(function (cat) {
      var art = cat.image
        ? '<img src="' + esc(cat.image) + '" alt="' + esc(cat.imageAlt || "") + '" loading="lazy" width="320" height="240">'
        : icon(cat.icon, "category-card__icon");
      return '<button class="category-card" type="button" data-category="' + cat.id + '" aria-pressed="false">' +
        '<span class="category-card__art category-card__art--' + cat.id + '">' + art + "</span>" +
        '<span class="category-card__name">' + esc(cat.name) + "</span>" +
        '<span class="category-card__count">' + countLabel(cat) + "</span></button>";
    }).join("");
  }

  function syncCategoryUI() {
    var buttons = catGrid.querySelectorAll(".category-card");
    Array.prototype.forEach.call(buttons, function (b) {
      var active = b.getAttribute("data-category") === state.category;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
    });
    clearBtn.hidden = !state.category;
    if (!state.category) {
      statusEl.textContent = "Showing everything on the menu";
    } else {
      var cat = find(D.categories, state.category);
      statusEl.textContent = "Showing " + cat.name + " · " + countLabel(cat);
    }
  }

  /* ---------- product cards ---------- */
  function photoBlock(p) {
    if (!p.image) return pendingPhoto();
    return '<img src="' + esc(p.image) + '" alt="' + esc(p.imageAlt) + '" loading="lazy" width="320" height="320">';
  }

  function productCard(p, i) {
    return '<article class="product-card" style="--i:' + i + '" data-category="' + p.category + '">' +
      '<div class="product-card__photo">' + photoBlock(p) + "</div>" +
      '<div class="product-card__body">' +
      '<p class="product-card__cat">' + esc(categoryName(p.category)) + "</p>" +
      '<h3 class="product-card__name">' + esc(p.name) + "</h3>" +
      '<div class="product-card__foot"><p class="price">' + money(p.price) + "</p>" +
      '<button class="clay-btn clay-btn--primary clay-btn--small" type="button" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to cart">Add to cart</button>' +
      "</div></div></article>";
  }

  /* ---------- ice cream builder ---------- */
  function builderCard(i) {
    var flavourChips = D.flavours.map(function (f) {
      return '<label class="chip chip--flavour"><input type="radio" name="flavour" value="' + f.id + '"' + (state.flavourId === f.id ? " checked" : "") + ">" +
        '<span class="chip__face"><img src="' + esc(f.image) + '" alt="" loading="lazy" width="48" height="48"><span>' + esc(f.name) + "</span></span></label>";
    }).join("");

    var scoopChips = D.scoopOptions.map(function (s) {
      return '<label class="chip chip--scoop"><input type="radio" name="scoops" value="' + s.count + '"' + (state.scoops === s.count ? " checked" : "") + ">" +
        '<span class="chip__face"><strong>' + s.count + (s.count === 1 ? " scoop" : " scoops") + "</strong><span>" + money(s.price) + "</span></span></label>";
    }).join("");

    var addOnChips = D.addOns.map(function (a) {
      return '<label class="chip chip--addon"><input type="checkbox" name="addon" value="' + a.id + '"' + (state.addOns[a.id] ? " checked" : "") + ">" +
        '<span class="chip__face"><strong>' + esc(a.name) + "</strong><span>+" + money(a.price) + "</span></span></label>";
    }).join("");

    return '<article class="product-card product-card--builder" style="--i:' + i + '" data-category="ice-cream">' +
      '<div class="builder__visual">' +
      '<figure class="builder__photo"><img id="builder-photo" src="" alt="" width="480" height="480" loading="lazy"></figure>' +
      '<p class="builder__flavour-name" id="builder-flavour-name" aria-live="polite"></p></div>' +
      '<div class="builder__controls">' +
      '<p class="product-card__cat">Ice Cream</p>' +
      '<h3 class="product-card__name">Build your scoop</h3>' +
      '<fieldset class="builder__group"><legend>1. Pick a flavour</legend><div class="flavour-grid">' + flavourChips + "</div></fieldset>" +
      '<fieldset class="builder__group"><legend>2. How many scoops?</legend><div class="scoop-grid">' + scoopChips + "</div></fieldset>" +
      '<fieldset class="builder__group"><legend>3. Add-ons (optional)</legend><div class="addon-grid">' + addOnChips + "</div></fieldset>" +
      '<div class="product-card__foot builder__foot"><p class="price" id="builder-total"></p>' +
      '<button class="clay-btn clay-btn--primary clay-btn--small" type="button" id="builder-add" data-add-ice-cream>Add to cart</button></div>' +
      '<p class="builder__hint" id="builder-hint"></p>' +
      "</div></article>";
  }

  function builderTotal() {
    var scoop = find(D.scoopOptions.map(function (s) { return { id: s.count, price: s.price }; }), state.scoops);
    var total = scoop ? scoop.price : 0;
    D.addOns.forEach(function (a) { if (state.addOns[a.id]) total += a.price; });
    return total;
  }

  function updateBuilder() {
    var photo = document.getElementById("builder-photo");
    if (!photo) return;
    var flavour = find(D.flavours, state.flavourId);
    var src = flavour ? flavour.image : D.categories[0].image;
    var alt = flavour ? flavour.imageAlt : D.categories[0].imageAlt;
    if (photo.getAttribute("src") !== src) {
      photo.setAttribute("src", src);
      photo.setAttribute("alt", alt);
      photo.classList.remove("is-swapping");
      void photo.offsetWidth; // restart the swap animation
      photo.classList.add("is-swapping");
    }
    document.getElementById("builder-flavour-name").textContent = flavour ? flavour.name : "Pick a flavour";
    document.getElementById("builder-total").textContent = money(builderTotal());
    var add = document.getElementById("builder-add");
    add.disabled = !flavour;
    document.getElementById("builder-hint").textContent = flavour ? "" : "Choose a flavour to add this to your cart.";
    add.setAttribute("aria-label", flavour ? "Add " + state.scoops + (state.scoops === 1 ? " scoop of " : " scoops of ") + flavour.name + " ice cream to cart" : "Add to cart (choose a flavour first)");
  }

  /* ---------- grid ---------- */
  function renderProducts() {
    var list = D.products.filter(function (p) { return !state.category || p.category === state.category; });
    grid.innerHTML = list.map(function (p, i) {
      return p.type === "ice-cream-builder" ? builderCard(i) : productCard(p, i);
    }).join("");
    grid.classList.toggle("product-grid--single", list.length === 1);
    updateBuilder();
    syncCategoryUI();
  }

  /* ---------- add-to-cart hook + feedback ---------- */
  var timers = new WeakMap();
  function confirmAdded(btn, label) {
    if (timers.has(btn)) clearTimeout(timers.get(btn));
    if (!btn.hasAttribute("data-label")) btn.setAttribute("data-label", btn.textContent);
    btn.classList.add("is-added");
    btn.textContent = "Added ✓";
    liveEl.textContent = label + " added.";
    timers.set(btn, setTimeout(function () {
      btn.classList.remove("is-added");
      btn.textContent = btn.getAttribute("data-label");
      timers.delete(btn);
    }, 1400));
  }

  function emitAdd(line) {
    document.dispatchEvent(new CustomEvent("cravins:add", { detail: line }));
  }

  /* ---------- events ---------- */
  catGrid.addEventListener("click", function (e) {
    var btn = e.target.closest(".category-card");
    if (!btn) return;
    var id = btn.getAttribute("data-category");
    state.category = state.category === id ? null : id;
    renderProducts();
    document.getElementById("catalogue-bar").scrollIntoView({ block: "start" });
  });

  clearBtn.addEventListener("click", function () {
    state.category = null;
    renderProducts();
  });

  grid.addEventListener("change", function (e) {
    var input = e.target;
    if (input.name === "flavour") state.flavourId = input.value;
    else if (input.name === "scoops") state.scoops = Number(input.value);
    else if (input.name === "addon") state.addOns[input.value] = input.checked;
    else return;
    updateBuilder();
  });

  grid.addEventListener("click", function (e) {
    var simple = e.target.closest("[data-add]");
    if (simple) {
      var p = find(D.products, simple.getAttribute("data-add"));
      if (!p) return;
      emitAdd({ productId: p.id, name: p.name, unitPrice: p.price, quantity: 1, options: null });
      confirmAdded(simple, p.name);
      return;
    }
    var ice = e.target.closest("[data-add-ice-cream]");
    if (ice && !ice.disabled) {
      var flavour = find(D.flavours, state.flavourId);
      if (!flavour) return;
      var chosen = D.addOns.filter(function (a) { return state.addOns[a.id]; });
      emitAdd({
        productId: "ice-cream",
        name: "Ice Cream",
        unitPrice: builderTotal(),
        quantity: 1,
        options: {
          flavour: { id: flavour.id, name: flavour.name },
          scoops: state.scoops,
          addOns: chosen.map(function (a) { return { id: a.id, name: a.name, price: a.price }; })
        }
      });
      confirmAdded(ice, flavour.name + " ice cream");
    }
  });

  renderCategories();
  renderProducts();
})();
