/* ============================================================
   忆梦 · index.js（桌面主屏）
   ============================================================ */
(function () {
  'use strict';

  var home = document.querySelector('.home');
  var themeBtn = document.getElementById('btnTheme');
  var opening = document.getElementById('opening');
  var openingWord = document.getElementById('openingWord');

  /* ---------- 主题按钮 ---------- */
  var labels = { light: '日间', dark: '夜间', auto: '跟随系统' };

  function renderThemeBtn() {
    var d = YM.store.get();
    var mode = d.settings.theme;
    themeBtn.innerHTML = YM.theme.iconFor(mode);
    themeBtn.setAttribute('aria-label', '主题：' + (labels[mode] || '日间'));
  }

  themeBtn.addEventListener('click', function () {
    YM.sound.unlock();
    YM.theme.cycle();
    renderThemeBtn();
  });

  YM.event.on('ym:data', function (detail) {
    if (detail && detail.scope === 'settings') renderThemeBtn();
  });

  /* ---------- 开场动画 ---------- */
  function revealDesk() {
    home.classList.add('is-ready');
  }

  function finishOpening() {
    if (!opening || opening.classList.contains('is-gone')) return;
    opening.classList.add('is-out');
    setTimeout(function () { opening.classList.add('is-gone'); }, 460);
    revealDesk();
  }

  function startOpening() {
    var d = YM.store.get();
    var reduced = false;
    var seen = false;
    try {
      reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      seen = sessionStorage.getItem('ym_intro_seen') === '1';
    } catch (e) {}

    // 从任意页面返回桌面时不重播开场，只在整个浏览器会话的首次进入时播一次
    if (seen || !d.settings.openingAnimation || reduced) {
      opening.classList.add('is-gone');
      revealDesk();
      return;
    }

    try { sessionStorage.setItem('ym_intro_seen', '1'); } catch (e) {}

    // 动画主体在 CSS 中，这里只负责收尾与跳过
    opening.addEventListener('click', finishOpening, { once: true });
    setTimeout(finishOpening, 2050);
  }

  /* ---------- 图标点击：缩放反馈 + 音效解锁 ---------- */
  document.getElementById('iconGrid').addEventListener('click', function (e) {
    var link = e.target.closest('a.app-icon');
    if (!link) return;
    YM.sound.unlock();
  });

  /* ---------- 容量检查 ---------- */
  function checkCapacity() {
    var d = YM.store.get();
    var size = YM.store.size();
    if (size < 4 * 1024 * 1024) return;
    var today = YM.util.todayLabel();
    var warned = d.ui.capacityWarnAt ? YM.util.dayKey(d.ui.capacityWarnAt) : '';
    if (warned === today) return;
    YM.store.update(function (dd) { dd.ui.capacityWarnAt = Date.now(); }, 'ui', true);
    setTimeout(function () {
      YM.ui.toast('存储接近上限，建议导出备份', 3200);
    }, 1200);
  }

  /* ---------- 启动 ---------- */
  renderThemeBtn();
  startOpening();
  checkCapacity();

  if (YM.store.corrupt) {
    setTimeout(function () {
      YM.ui.toast('检测到数据损坏，已重置为初始状态，原数据已留存', 3600);
    }, 2300);
  }

  if (!YM.store.available()) {
    setTimeout(function () {
      YM.ui.toast('浏览器已禁用本地存储，本次记录不会保存', 3600);
    }, 2300);
  }
})();
