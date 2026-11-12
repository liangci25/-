/* ============================================================
   忆梦 · settings.js
   ============================================================ */
(function () {
  'use strict';

  function data() { return YM.store.get(); }

  function saveSettings(fn, scope) {
    YM.store.update(function (d) { fn(d.settings, d); }, scope || 'settings');
  }

  function switchVal(el) {
    return el.getAttribute('aria-checked') === 'true';
  }

  function bindSwitch(id, getter, setter) {
    var el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('aria-checked', getter() ? 'true' : 'false');
    el.addEventListener('click', function () {
      var next = !switchVal(el);
      el.setAttribute('aria-checked', next ? 'true' : 'false');
      setter(next);
    });
  }

  function pickFile(accept, maxBytes, asText) {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        document.body.removeChild(input);
        if (!f) { resolve(null); return; }
        if (!asText && maxBytes && f.size > maxBytes) {
          YM.ui.toast('文件请控制在 ' + Math.round(maxBytes / 1024) + 'KB 以内');
          resolve(null);
          return;
        }
        var reader = new FileReader();
        reader.onload = function () { resolve(String(reader.result || '')); };
        reader.onerror = function () { YM.ui.toast('文件读取失败'); resolve(null); };
        if (asText) reader.readAsText(f, 'utf-8');
        else reader.readAsDataURL(f);
      });
      input.click();
    });
  }

  /* ==========================================================
     外观
     ========================================================== */
  function initAppearance() {
    var s = data().settings;

    var seg = document.getElementById('segTheme');
    function renderThemeSeg() {
      var mode = data().settings.theme;
      seg.querySelectorAll('[data-mode]').forEach(function (b) {
        b.setAttribute('aria-selected', b.getAttribute('data-mode') === mode ? 'true' : 'false');
      });
    }
    seg.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-mode]');
      if (!btn) return;
      YM.theme.setMode(btn.getAttribute('data-mode'));
      renderThemeSeg();
    });
    renderThemeSeg();

    var range = document.getElementById('rangeFontSize');
    var label = document.getElementById('valFontSize');
    range.value = s.fontSize;
    label.textContent = s.fontSize;
    range.addEventListener('input', function () {
      var v = parseInt(range.value, 10);
      label.textContent = v;
      document.documentElement.style.setProperty('--font-size', v + 'px');
    });
    range.addEventListener('change', function () {
      saveSettings(function (ss) { ss.fontSize = parseInt(range.value, 10); });
    });

    var family = document.getElementById('inputFontFamily');
    family.value = s.fontFamily || '';
    family.addEventListener('change', function () {
      saveSettings(function (ss) { ss.fontFamily = family.value.trim() || '"Songti SC", "SimSun", serif'; });
    });

    var fontUrl = document.getElementById('inputFontUrl');
    fontUrl.value = s.fontUrl || '';
    fontUrl.addEventListener('change', function () {
      saveSettings(function (ss) { ss.fontUrl = fontUrl.value.trim(); });
      YM.ui.toast(fontUrl.value.trim() ? '字体已切换，加载失败会自动回退' : '已恢复默认字体');
    });

    var preset = document.getElementById('selBubblePreset');
    preset.value = s.bubblePreset || 'rounded';
    preset.addEventListener('change', function () {
      saveSettings(function (ss) { ss.bubblePreset = preset.value; });
    });

    var bUser = document.getElementById('inputBubbleUser');
    var bPeer = document.getElementById('inputBubblePeer');
    bUser.value = s.bubbleCssUser || '';
    bPeer.value = s.bubbleCssPeer || '';
    function saveBubble(el, key) {
      return function () {
        var v = el.value.trim();
        if (!YM.util.cssSafe(v)) {
          YM.ui.toast('自定义内容含不安全写法，已拒绝');
          el.value = data().settings[key] || '';
          return;
        }
        saveSettings(function (ss) { ss[key] = v; });
      };
    }
    bUser.addEventListener('change', saveBubble(bUser, 'bubbleCssUser'));
    bPeer.addEventListener('change', saveBubble(bPeer, 'bubbleCssPeer'));

    var bgType = document.getElementById('selBgType');
    var bgValue = document.getElementById('inputBgValue');
    var bgDim = document.getElementById('rangeBgDim');
    var bgDimLabel = document.getElementById('valBgDim');

    bgType.value = s.chatBackground.type || 'none';
    bgValue.value = s.chatBackground.value || '';
    bgDim.value = s.chatBackground.dim == null ? 0.88 : s.chatBackground.dim;
    bgDimLabel.textContent = bgDim.value;

    bgType.addEventListener('change', function () {
      saveSettings(function (ss) { ss.chatBackground.type = bgType.value; });
    });
    bgValue.addEventListener('change', function () {
      saveSettings(function (ss) {
        ss.chatBackground.value = bgValue.value.trim();
        if (ss.chatBackground.value && ss.chatBackground.type === 'none') {
          ss.chatBackground.type = 'color';
        }
      });
      if (bgValue.value.trim() && bgType.value === 'none') bgType.value = 'color';
    });
    bgDim.addEventListener('input', function () {
      bgDimLabel.textContent = bgDim.value;
    });
    bgDim.addEventListener('change', function () {
      saveSettings(function (ss) { ss.chatBackground.dim = parseFloat(bgDim.value); });
    });

    document.getElementById('btnBgUpload').addEventListener('click', function () {
      pickFile('image/*', 500 * 1024, false).then(function (b64) {
        if (!b64) return;
        saveSettings(function (ss) {
          ss.chatBackground.type = 'image';
          ss.chatBackground.value = b64;
        });
        bgType.value = 'image';
        bgValue.value = '';
        YM.ui.toast('背景已更换');
      });
    });

    document.getElementById('btnBgClear').addEventListener('click', function () {
      saveSettings(function (ss) {
        ss.chatBackground.type = 'none';
        ss.chatBackground.value = '';
      });
      bgType.value = 'none';
      bgValue.value = '';
    });

    bindSwitch('swShowName', function () { return data().settings.showName; },
      function (v) { saveSettings(function (s2) { s2.showName = v; }); });
    bindSwitch('swShowAvatar', function () { return data().settings.showAvatar; },
      function (v) { saveSettings(function (s2) { s2.showAvatar = v; }); });
    bindSwitch('swShowTimestamp', function () { return data().settings.showTimestamp; },
      function (v) { saveSettings(function (s2) { s2.showTimestamp = v; }); });
    bindSwitch('swShowRead', function () { return data().settings.showReadStatus; },
      function (v) { saveSettings(function (s2) { s2.showReadStatus = v; }); });
    bindSwitch('swOpening', function () { return data().settings.openingAnimation; },
      function (v) { saveSettings(function (s2) { s2.openingAnimation = v; }); });

    var readStyle = document.getElementById('selReadStyle');
    readStyle.value = s.readStyle || 'text';
    readStyle.addEventListener('change', function () {
      saveSettings(function (ss) { ss.readStyle = readStyle.value; });
    });
  }

  /* ==========================================================
     聊天体验
     ========================================================== */
  function initChatExperience() {
    var s = data().settings;

    var typing = document.getElementById('inputTyping');
    typing.value = s.typingText || '';
    typing.addEventListener('change', function () {
      saveSettings(function (ss) { ss.typingText = typing.value.trim() || '正在输入…'; });
    });

    renderSymbols();

    document.getElementById('btnAddSymbol').addEventListener('click', function () {
      var input = document.getElementById('inputMergeSymbol');
      var v = input.value;
      if (!v) { YM.ui.toast('先输入一个符号'); return; }
      var list = data().settings.mergeSymbols.slice();
      if (list.indexOf(v) >= 0) { YM.ui.toast('这个符号已经有了'); return; }
      list.push(v);
      saveSettings(function (ss) { ss.mergeSymbols = list; });
      input.value = '';
      renderSymbols();
    });

    bindSwitch('swSound', function () { return data().settings.soundEnabled; },
      function (v) { saveSettings(function (s2) { s2.soundEnabled = v; }); });

    bindSwitch('swPeerRandom', function () { return data().settings.peerSoundRandom; },
      function (v) { saveSettings(function (s2) { s2.peerSoundRandom = v; }); });

    document.getElementById('btnSoundUpload').addEventListener('click', function () {
      pickFile('audio/*', 200 * 1024, false).then(function (b64) {
        if (!b64) return;
        var list = data().settings.soundList.slice();
        if (list.length >= 10) { YM.ui.toast('最多 10 条音效'); return; }
        list.push({ id: YM.util.uid('snd'), name: '音效 ' + (list.length + 1), src: b64, enabled: true, builtin: false });
        saveSettings(function (ss) { ss.soundList = list; });
        renderSounds();
        YM.ui.toast('已添加音效');
      });
    });

    document.getElementById('btnSoundTest').addEventListener('click', function () {
      YM.sound.unlock();
      YM.sound.play('peer');
    });

    renderSounds();
  }

  function renderSymbols() {
    var s = data().settings;
    var wrap = document.getElementById('mergeChips');
    wrap.innerHTML = s.mergeSymbols.map(function (sym, i) {
      return '<span class="symbol-chip" data-idx="' + i + '">' +
        YM.util.escapeHtml(sym === ' ' ? '空格' : sym) +
        '<button data-del="' + i + '" aria-label="删除符号">×</button></span>';
    }).join('');

    wrap.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var idx = parseInt(btn.getAttribute('data-del'), 10);
        var list = data().settings.mergeSymbols.slice();
        if (list.length <= 1) { YM.ui.toast('至少保留 1 个符号'); return; }
        list.splice(idx, 1);
        saveSettings(function (ss) { ss.mergeSymbols = list; });
        renderSymbols();
      });
    });
  }

  function renderSounds() {
    var s = data().settings;
    var wrap = document.getElementById('soundList');
    wrap.innerHTML = s.soundList.map(function (item) {
      return '<div class="sound-item" data-sid="' + YM.util.escapeHtml(item.id) + '">' +
        '<button class="switch" data-toggle="' + YM.util.escapeHtml(item.id) + '" role="switch" aria-checked="' + (item.enabled ? 'true' : 'false') + '" style="width:36px;height:22px;flex-basis:36px"></button>' +
        '<span class="row-main"><span class="sound-name">' + YM.util.escapeHtml(item.name) +
          (item.builtin ? '<span class="sound-tag">内置</span>' : '') + '</span></span>' +
        '<button class="sound-del" data-del="' + YM.util.escapeHtml(item.id) + '" aria-label="删除音效"' + (item.builtin ? ' disabled' : '') + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M5 7h14M9.5 7V5.5h5V7M7 7l1 12h8l1-12"/></svg>' +
        '</button>' +
      '</div>';
    }).join('');

    wrap.querySelectorAll('[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-toggle');
        var list = data().settings.soundList.map(function (x) {
          if (x.id === id) x.enabled = !x.enabled;
          return x;
        });
        saveSettings(function (ss) { ss.soundList = list; });
        renderSounds();
      });
    });

    wrap.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var id = btn.getAttribute('data-del');
        var list = data().settings.soundList.filter(function (x) { return x.id !== id; });
        saveSettings(function (ss) { ss.soundList = list; });
        renderSounds();
        renderUserSoundSelect();
      });
    });

    renderUserSoundSelect();
  }

  function renderUserSoundSelect() {
    var s = data().settings;
    var sel = document.getElementById('selUserSound');
    var enabled = s.soundList.filter(function (x) { return x.enabled; });
    sel.innerHTML = enabled.map(function (x) {
      return '<option value="' + YM.util.escapeHtml(x.id) + '">' + YM.util.escapeHtml(x.name) + '</option>';
    }).join('') || '<option value="">没有可用音效</option>';
    if (enabled.some(function (x) { return x.id === s.userSoundId; })) sel.value = s.userSoundId;
    sel.onchange = function () {
      saveSettings(function (ss) { ss.userSoundId = sel.value; });
    };
  }

  /* ==========================================================
     通知
     ========================================================== */
  function initNotify() {
    bindSwitch('swNotify', function () { return data().settings.notifyEnabled; },
      function (v) { saveSettings(function (s2) { s2.notifyEnabled = v; }); });

    var sys = document.getElementById('swSystemNotify');
    sys.addEventListener('click', function () {
      YM.ui.toast('系统通知需要挂到 localhost 才能使用');
    });
  }

  /* ==========================================================
     数据
     ========================================================== */
  function renderData() {
    var size = YM.store.size();
    document.getElementById('dataSize').textContent = YM.util.formatBytes(size);
  }

  function initData() {
    renderData();

    document.getElementById('btnExport').addEventListener('click', function () {
      YM.store.exportAll();
      YM.ui.toast('已导出备份文件');
    });

    document.getElementById('btnImport').addEventListener('click', function () {
      pickFile('.json,application/json', 0, true).then(function (text) {
        if (!text) return;
        var parsed;
        try { parsed = JSON.parse(text); } catch (e) {
          YM.ui.toast('备份文件格式不正确，未做任何修改', 3000);
          return;
        }
        if (!parsed || !parsed.sessions || !parsed.cardStore || !parsed.settings) {
          YM.ui.toast('备份内容不完整，未做任何修改', 3000);
          return;
        }
        var msgCount = (parsed.sessions || []).reduce(function (n, s) {
          return n + ((s.messages || []).length);
        }, 0);

        YM.ui.confirm({
          title: '导入备份',
          body: '会话 ' + parsed.sessions.length + ' 个，消息 ' + msgCount +
            ' 条，字卡 ' + YM.countCards(parsed) + ' 条。导入会覆盖当前全部数据，现有数据会自动留一份备份。',
          okText: '覆盖导入'
        }).then(function (ok) {
          if (!ok) return;
          var res = YM.store.importAll(text);
          if (!res.ok) { YM.ui.toast('导入失败：' + res.error); return; }
          YM.ui.toast('导入完成，正在刷新');
          setTimeout(function () { location.reload(); }, 900);
        });
      });
    });

    document.getElementById('btnRestore').addEventListener('click', function () {
      if (!YM.store.hasBackup()) { YM.ui.toast('还没有自动备份'); return; }
      YM.ui.confirm({
        title: '恢复自动备份',
        body: '将用上一次导入或重置前的自动备份覆盖当前数据。',
        okText: '恢复'
      }).then(function (ok) {
        if (!ok) return;
        var res = YM.store.restoreBackup();
        if (!res.ok) { YM.ui.toast('恢复失败'); return; }
        YM.ui.toast('已恢复，正在刷新');
        setTimeout(function () { location.reload(); }, 900);
      });
    });

    document.getElementById('btnReset').addEventListener('click', function () {
      YM.ui.sheet(function (sheet, close) {
        sheet.innerHTML =
          '<h3 class="sheet-title">重置所有数据</h3>' +
          '<p class="reset-note">所有会话、消息、字卡与设置都会清空。重置前会自动留一份备份，可在本页恢复。</p>' +
          '<div class="field"><input type="text" id="resetWord" placeholder="输入 重置 两个字"></div>' +
          '<div class="sheet-actions">' +
            '<button class="btn btn-ghost" id="rsCancel">取消</button>' +
            '<button class="btn btn-danger" id="rsOk" disabled>确认重置</button>' +
          '</div>';

        var word = sheet.querySelector('#resetWord');
        var okBtn = sheet.querySelector('#rsOk');
        word.addEventListener('input', function () {
          okBtn.disabled = word.value.trim() !== '重置';
        });
        sheet.querySelector('#rsCancel').addEventListener('click', close);
        okBtn.addEventListener('click', function () {
          YM.store.reset();
          YM.task.cancelAll();
          close();
          YM.ui.toast('已重置');
          setTimeout(function () { location.href = '../index.html'; }, 800);
        });
      });
    });
  }

  /* ==========================================================
     启动
     ========================================================== */
  initAppearance();
  initChatExperience();
  initNotify();
  initData();

  YM.event.on('ym:data', function (detail) {
    if (detail && detail.scope === 'settings') { renderData(); return; }
    renderData();
  });

})();
