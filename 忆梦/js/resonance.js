/* ============================================================
   忆梦 · resonance.js（共振 · 占位页）
   ============================================================ */
(function () {
  'use strict';

  var app = document.querySelector('.resonance-app');
  if (!app) return;

  function paint() {
    app.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light');
  }

  paint();
  YM.event.on('ym:data', function (detail) {
    if (!detail || detail.scope === 'settings' || detail.scope === 'all') paint();
  });
})();
