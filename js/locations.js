/* Cravins: branch directory (Phase 5)
   Renders a card for every branch in CRAVINS_BRANCHES (branches.js), with a
   state filter. Call and WhatsApp links are built from the same data checkout uses. */
(function () {
  "use strict";

  var B = window.CRAVINS_BRANCHES;
  var grid = document.getElementById("branch-grid");
  var bar = document.getElementById("state-filter");
  var status = document.getElementById("branch-status");
  if (!B || !grid || !bar) return;

  var current = "all";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var states = [];
  B.forEach(function (b) { if (states.indexOf(b.state) === -1) states.push(b.state); });

  function renderFilter() {
    var items = [{ id: "all", label: "All branches" }].concat(states.map(function (s) { return { id: s, label: s }; }));
    bar.innerHTML = items.map(function (it) {
      var on = it.id === current;
      return '<button type="button" class="clay-btn clay-btn--small ' + (on ? "clay-btn--primary" : "clay-btn--ivory") +
        '" data-state="' + esc(it.id) + '" aria-pressed="' + on + '">' + esc(it.label) + "</button>";
    }).join("");
  }

  function cardHTML(b) {
    var wa = "https://wa.me/" + b.whatsapp + "?text=" + encodeURIComponent("Hello Cravins! I have a question for the " + b.name + " branch.");
    return '<li class="branch-card">' +
      '<p class="branch-card__state">' + esc(b.state) + " State</p>" +
      '<h3 class="branch-card__name">' + esc(b.name) + "</h3>" +
      '<p class="branch-card__row"><span class="branch-card__label">Address</span>' + esc(b.address) + "</p>" +
      '<p class="branch-card__row"><span class="branch-card__label">Open</span>' + esc(b.openingHours) + "</p>" +
      '<div class="branch-card__actions">' +
      '<a class="clay-btn clay-btn--ivory clay-btn--small" href="tel:+' + esc(b.whatsapp) + '" aria-label="Call ' + esc(b.name) + '">Call</a>' +
      '<a class="clay-btn clay-btn--primary clay-btn--small" href="' + wa + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(b.name) + '">WhatsApp</a>' +
      "</div></li>";
  }

  function renderGrid() {
    var list = B.filter(function (b) { return current === "all" || b.state === current; });
    grid.innerHTML = list.map(cardHTML).join("");
    if (status) {
      status.textContent = current === "all"
        ? "Showing all " + list.length + " branches"
        : "Showing " + list.length + (list.length === 1 ? " branch" : " branches") + " in " + current + " State";
    }
  }

  bar.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-state]");
    if (!btn) return;
    current = btn.getAttribute("data-state");
    renderFilter();
    renderGrid();
    var again = bar.querySelector('[data-state="' + current + '"]');
    if (again) again.focus();
  });

  renderFilter();
  renderGrid();
})();
