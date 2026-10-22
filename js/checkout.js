/* Cravins: checkout (Phase 4)

   A second step inside the slide-out cart. The customer enters a name, picks a
   branch and Pickup or Delivery, and we open WhatsApp (wa.me click-to-chat)
   with the order already written out. Nothing is sent to a server; the order
   only exists in the WhatsApp message the customer chooses to send.

   Needs: CRAVINS_BRANCHES (branches.js), CravinsCart (cart.js).
*/
(function () {
  "use strict";

  var BRANCHES = window.CRAVINS_BRANCHES;
  var Cart = window.CravinsCart;
  var panel = document.getElementById("cart-panel");
  var cartCheckoutBtn = document.getElementById("cart-checkout");
  var titleEl = document.getElementById("cart-title");
  if (!BRANCHES || !Cart || !panel || !cartCheckoutBtn || !titleEl) return;

  var NAME_MAX = 60;
  var ADDRESS_MAX = 240;
  var active = false;
  var lastUrl = "";
  var lastMessage = "";

  /* ---------- helpers ---------- */
  function money(n) { return "₦" + Number(n).toLocaleString("en-NG"); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function clean(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function branchById(id) {
    for (var i = 0; i < BRANCHES.length; i++) if (BRANCHES[i].id === id) return BRANCHES[i];
    return null;
  }

  /* ---------- markup ---------- */
  var view = document.createElement("section");
  view.className = "checkout";
  view.id = "checkout-view";
  view.hidden = true;

  function branchOptions() {
    return '<option value="">Choose a branch</option>' +
      BRANCHES.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.name) + "</option>"; }).join("");
  }

  view.innerHTML =
    '<form class="checkout__form" id="checkout-form" novalidate>' +
      '<div class="checkout__scroll">' +
        '<button type="button" class="checkout__back" id="checkout-back">&#8249; Back to cart</button>' +

        '<div class="field">' +
          '<label for="co-name">Your name</label>' +
          '<input type="text" id="co-name" name="name" autocomplete="name" maxlength="' + NAME_MAX + '" aria-describedby="co-name-err" required>' +
          '<p class="field__error" id="co-name-err" aria-live="polite"></p>' +
        "</div>" +

        '<div class="field">' +
          '<label for="co-branch">Branch</label>' +
          '<select id="co-branch" name="branch" aria-describedby="co-branch-hint co-branch-err" required>' + branchOptions() + "</select>" +
          '<p class="field__hint" id="co-branch-hint" aria-live="polite"></p>' +
          '<p class="field__error" id="co-branch-err" aria-live="polite"></p>' +
        "</div>" +

        '<fieldset class="field field--options">' +
          "<legend>Order type</legend>" +
          '<label class="co-choice"><input type="radio" name="type" value="pickup" checked><span class="co-choice__face">Pickup</span></label>' +
          '<label class="co-choice"><input type="radio" name="type" value="delivery"><span class="co-choice__face">Delivery enquiry</span></label>' +
          '<p class="field__hint" id="co-type-hint">You collect from the branch.</p>' +
        "</fieldset>" +

        '<div class="field" id="co-address-wrap" hidden>' +
          '<label for="co-address">Delivery area or address <span class="field__opt">(optional)</span></label>' +
          '<textarea id="co-address" name="address" rows="3" maxlength="' + ADDRESS_MAX + '"></textarea>' +
          '<p class="field__hint">The branch confirms if they deliver to you, and the delivery fee.</p>' +
        "</div>" +

        '<div class="co-summary" aria-labelledby="co-summary-title">' +
          '<h3 id="co-summary-title">Order summary</h3>' +
          '<ul class="co-summary__lines" id="co-summary-lines"></ul>' +
        "</div>" +

        '<div class="co-sent" id="co-sent" hidden>' +
          '<p><strong>WhatsApp should have opened with your order.</strong> If it did not, use the buttons below.</p>' +
          '<div class="co-sent__actions">' +
            '<a class="clay-btn clay-btn--ivory clay-btn--small" id="co-sent-link" href="#" target="_blank" rel="noopener">Open WhatsApp</a>' +
            '<button type="button" class="clay-btn clay-btn--ivory clay-btn--small" id="co-copy">Copy message</button>' +
          "</div>" +
          '<p class="field__hint" id="co-copy-status" aria-live="polite"></p>' +
          '<p class="field__hint">Your cart is kept until you clear it.</p>' +
        "</div>" +
      "</div>" +

      '<div class="cart-panel__foot checkout__foot">' +
        '<div class="cart-total"><span>Total</span><strong id="co-total">&#8358;0</strong></div>' +
        '<button type="submit" class="clay-btn clay-btn--primary" id="co-submit">Send order on WhatsApp</button>' +
        '<p class="cart-note">The branch confirms availability and the final amount.</p>' +
      "</div>" +
    "</form>";

  /* Sit between the cart body and the cart footer. */
  var bodyEl = document.getElementById("cart-body");
  bodyEl.parentNode.insertBefore(view, bodyEl.nextSibling);

  var form = view.querySelector("#checkout-form");
  var nameEl = view.querySelector("#co-name");
  var branchEl = view.querySelector("#co-branch");
  var branchHint = view.querySelector("#co-branch-hint");
  var typeHint = view.querySelector("#co-type-hint");
  var addrWrap = view.querySelector("#co-address-wrap");
  var addrEl = view.querySelector("#co-address");
  var linesEl = view.querySelector("#co-summary-lines");
  var totalEl = view.querySelector("#co-total");
  var sentBox = view.querySelector("#co-sent");
  var sentLink = view.querySelector("#co-sent-link");
  var copyBtn = view.querySelector("#co-copy");
  var copyStatus = view.querySelector("#co-copy-status");
  var submitBtn = view.querySelector("#co-submit");
  var backBtn = view.querySelector("#checkout-back");

  /* ---------- message ---------- */
  function orderType() {
    var r = form.querySelector('input[name="type"]:checked');
    return r ? r.value : "pickup";
  }

  function buildMessage(name, branch, type, address) {
    var lines = Cart.getLines();
    var out = [];
    out.push("Hello Cravins!", "", "I'd like to place an order.", "");
    out.push("Name: " + name);
    out.push("Branch: " + branch.name + ", " + branch.city, "");
    out.push("ORDER DETAILS", "");
    lines.forEach(function (l) {
      out.push(l.quantity + "x " + l.name);
      if (l.detail) out.push(l.detail.replace(/ · \+ /g, ", ").replace(/ · /g, ", "));
      out.push(money(l.unitPrice * l.quantity), "");
    });
    out.push("--------------------");
    out.push("TOTAL: " + money(Cart.getTotal()));
    out.push("--------------------", "");
    out.push("Order Type: " + (type === "delivery" ? "Delivery (please confirm if available)" : "Pickup"));
    if (type === "delivery" && address) out.push("Delivery area/address: " + address);
    out.push("", "Please confirm availability", "and the final amount.", "", "Thank you!");
    return out.join("\n");
  }

  function waUrl(branch, message) {
    return "https://wa.me/" + branch.whatsapp + "?text=" + encodeURIComponent(message);
  }

  /* ---------- rendering ---------- */
  function renderSummary() {
    var lines = Cart.getLines();
    linesEl.innerHTML = lines.map(function (l) {
      var detail = l.detail ? '<span class="co-summary__detail">' + esc(l.detail.replace(/ · \+ /g, ", ").replace(/ · /g, ", ")) + "</span>" : "";
      return '<li><span class="co-summary__name">' + l.quantity + "&times; " + esc(l.name) + detail + "</span>" +
        "<strong>" + money(l.unitPrice * l.quantity) + "</strong></li>";
    }).join("");
    totalEl.textContent = money(Cart.getTotal());
  }

  function updateBranchHint() {
    var b = branchById(branchEl.value);
    branchHint.textContent = b ? b.address + ". Open " + b.openingHours + "." : "";
  }

  function updateTypeUi() {
    var delivery = orderType() === "delivery";
    addrWrap.hidden = !delivery;
    typeHint.textContent = delivery ? "Delivery is not automatic: the branch will confirm with you on WhatsApp." : "You collect from the branch.";
  }

  function setError(input, errId, msg) {
    var err = view.querySelector("#" + errId);
    err.textContent = msg || "";
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function clearSent() {
    sentBox.hidden = true;
    copyStatus.textContent = "";
  }

  /* ---------- show / hide ---------- */
  function show() {
    if (!Cart.getCount()) return;
    active = true;
    renderSummary();
    updateBranchHint();
    updateTypeUi();
    clearSent();
    panel.classList.add("is-checkout");
    view.hidden = false;
    titleEl.textContent = "Checkout";
    window.setTimeout(function () { nameEl.focus(); }, 30);
  }

  function hide(returnFocus) {
    if (!active) return;
    active = false;
    panel.classList.remove("is-checkout");
    view.hidden = true;
    titleEl.textContent = "Your cart";
    if (returnFocus && !cartCheckoutBtn.disabled) cartCheckoutBtn.focus();
  }

  /* ---------- events ---------- */
  cartCheckoutBtn.addEventListener("click", show);
  backBtn.addEventListener("click", function () { hide(true); });

  branchEl.addEventListener("change", function () {
    updateBranchHint();
    setError(branchEl, "co-branch-err", "");
    clearSent();
  });
  nameEl.addEventListener("input", function () {
    if (clean(nameEl.value).length >= 2) setError(nameEl, "co-name-err", "");
    clearSent();
  });
  form.addEventListener("change", function (e) {
    if (e.target.name === "type") { updateTypeUi(); clearSent(); }
  });
  addrEl.addEventListener("input", clearSent);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = clean(nameEl.value).slice(0, NAME_MAX);
    var branch = branchById(branchEl.value);
    var firstBad = null;

    if (name.length < 2) { setError(nameEl, "co-name-err", "Please enter your name."); firstBad = firstBad || nameEl; }
    else setError(nameEl, "co-name-err", "");
    if (!branch) { setError(branchEl, "co-branch-err", "Please choose a branch."); firstBad = firstBad || branchEl; }
    else setError(branchEl, "co-branch-err", "");
    if (!Cart.getCount()) { hide(false); return; }
    if (firstBad) { firstBad.focus(); return; }

    var type = orderType();
    var address = type === "delivery" ? clean(addrEl.value).slice(0, ADDRESS_MAX) : "";
    lastMessage = buildMessage(name, branch, type, address);
    lastUrl = waUrl(branch, lastMessage);

    sentLink.href = lastUrl;
    sentBox.hidden = false;
    var win = window.open(lastUrl, "_blank", "noopener");
    if (!win) sentLink.focus(); // pop-up blocked: the visible link is the fallback
    sentBox.scrollIntoView({ block: "nearest" });
  });

  copyBtn.addEventListener("click", function () {
    if (!lastMessage) return;
    function done(ok) { copyStatus.textContent = ok ? "Message copied. Paste it into WhatsApp." : "Could not copy. Select and copy it from WhatsApp instead."; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastMessage).then(function () { done(true); }, function () { done(false); });
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = lastMessage;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    done(ok);
  });

  /* Cart changes while checkout is open: refresh, or go back if emptied. */
  document.addEventListener("cravins:cart-change", function () {
    if (!active) return;
    if (!Cart.getCount()) { hide(false); return; }
    renderSummary();
    clearSent();
  });

  /* Closing the panel always returns to the cart step next time. */
  document.addEventListener("cravins:cart-close", function () { hide(false); });
})();
