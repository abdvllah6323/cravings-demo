/* Cravins: Phase 1 behaviour
   - Mobile navigation toggle
   - Cart count hook (the cart itself arrives in Phase 3)
*/
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".menu-toggle");
  var links = document.getElementById("nav-links");

  function setMenu(open) {
    if (!toggle || !links) return;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("is-open", open);
  }

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });

    // Close after choosing a link, pressing Escape, or tapping outside the nav.
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".clay-nav")) setMenu(false);
    });

    // Reset when resizing up to the desktop layout.
    window.matchMedia("(min-width: 820px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }

  /* ---------- Cart count (display only for now) ---------- */
  var cartButton = document.querySelector(".cart-btn");
  var cartBadge = document.querySelector("[data-cart-count]");

  window.updateCartCount = function (count) {
    var n = Math.max(0, Number(count) || 0);
    if (cartBadge) cartBadge.textContent = String(n);
    if (cartButton) {
      cartButton.setAttribute("aria-label", "Open cart, " + n + (n === 1 ? " item" : " items"));
    }
  };
})();
