/* ============================================================
   忆梦 · sessions.js（会话列表）
   ============================================================ */
(function () {
  'use strict';

  var listEl = document.getElementById('sessionList');
  var emptyEl = document.getElementById('emptyState');

  /* ---------- 头像选择 ---------- */
  function pickImage(maxBytes) {
    return new Promise(function (resolve) {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        document.body.removeChild(input);
        if (!f) { resolve(null); return; }
        YM.util.fileToBase64(f, maxBytes).then(resolve).catch(function (err) {
          YM.ui.toast(err.message === 'too_large'
            ? '图片请控制在 ' + Math.round(maxBytes / 1024) + 'KB 以内'
            : '图片读取失败，请换一张');
          resolve(null);
        });
      });
      input.click();
    });
  }

  /* ---------- 渲染 ---------- */
  function lastSummary(sn) {
    if (!sn.messages.length) return { text: '还没有消息', empty: true };
    var m = sn.messages[sn.messages.length - 1];
    var t = String(m.text || '').replace(/\s+/g, ' ');
    if (m.kind === 'call') t = t.replace(/^视频通话\s*·\s*/, '');
    return { text: t, empty: false };
  }

  // 角色在我上次看这条会话之后发来的消息，算未读
  function unreadOf(sn) {
    var lastRead = sn.lastReadAt || 0;
    var n = 0;
    (sn.messages || []).forEach(function (m) {
      if (m && m.role === 'peer' && (m.createdAt || 0) > lastRead) n++;
    });
    return n;
  }

  function render() {
    var d = YM.store.get();
    // 置顶的排最前，其余按最近消息倒序
    var sessions = d.sessions.slice().sort(function (a, b) {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

    listEl.innerHTML = '';
    if (!sessions.length) {
      emptyEl.classList.remove('hide');
      return;
    }
    emptyEl.classList.add('hide');

    sessions.forEach(function (sn) {
      var sub = lastSummary(sn);
      var lastAt = sn.messages.length ? sn.messages[sn.messages.length - 1].createdAt : sn.createdAt;

      var li = document.createElement('li');
      li.className = 'session-card';
      li.setAttribute('data-sid', sn.id);
      var unread = unreadOf(sn);
      li.innerHTML =
        '<span class="s-av">' + YM.avatarHtml(sn, 44) +
          (unread ? '<span class="s-dot" aria-label="有新消息"></span>' : '') +
        '</span>' +
        '<div class="s-main">' +
          '<div class="s-top">' +
            '<span class="s-name">' +
              (sn.pinned ? '<span class="s-pin" aria-label="已置顶">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                '<path d="M9.6 3.8h4.8l-.7 5.4 3 3.3H7.3l3-3.3z"/><path d="M12 12.5v7.7"/></svg></span>' : '') +
              YM.util.escapeHtml(sn.name || '未命名会话') + '</span>' +
            '<span class="s-time">' + YM.util.formatStamp(lastAt) + '</span>' +
          '</div>' +
          '<div class="s-sub' + (sub.empty ? ' is-empty' : '') + '">' + YM.util.escapeHtml(sub.text) + '</div>' +
        '</div>' +
        '<button class="s-more" aria-label="会话操作" data-more="' + sn.id + '">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>' +
        '</button>';

      listEl.appendChild(li);
    });
  }

  /* ---------- 加好友（单个或一次多位） ---------- */
  var createMask = document.getElementById('createMask');
  var createCard = document.getElementById('createCard');

  var URL_HINT = '点头像可上传本地图片，也可以粘贴头像直链自动解析';
  var rowsWrap = null;
  var rows = [];
  var urlTimer = null;

  // 头像是直链时，接收前先探一次能不能打开
  function probeUrl(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      var done = false;
      img.onload = function () {
        if (done) return;
        done = true;
        resolve({ ok: true, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = function () {
        if (done) return;
        done = true;
        resolve({ ok: false });
      };
      img.src = url;
      setTimeout(function () {
        if (done) return;
        done = true;
        resolve({ ok: false });
      }, 6000);
    });
  }

  function looksLikeImageUrl(v) {
    if (/^data:image\//i.test(v)) return true;
    return /^(https?:)?\/\//i.test(v) || /^[a-z0-9._-]+\.(png|jpe?g|gif|webp|bmp|avif)(\?|#|$)/i.test(v);
  }

  function normalizeUrl(v) {
    if (/^\/\//.test(v)) return 'https:' + v;
    if (/^(https?:|data:)/i.test(v)) return v;
    return 'https://' + v.replace(/^\/+/, '');
  }

  // 多行时提示会带上行号，免得不知道是哪一位
  function rowTag(row) {
    if (!row || rows.length <= 1) return '';
    var i = rows.indexOf(row);
    return '第 ' + (i + 1) + ' 位：';
  }

  function hint(text, bad, row) {
    var hintEl = createCard.querySelector('#urlHint');
    if (!hintEl) return;
    hintEl.textContent = rowTag(row) + text;
    hintEl.classList.toggle('is-bad', !!bad);
    rows.forEach(function (r) {
      r.urlBox.classList.remove('is-good', 'is-bad');
      if (r === row && text !== URL_HINT) r.urlBox.classList.add(bad ? 'is-bad' : 'is-good');
    });
  }

  function paintRow(row) {
    if (row.avatar) {
      row.avEl.style.backgroundImage = 'url(' + JSON.stringify(row.avatar) + ')';
      row.textEl.textContent = '';
    } else {
      row.avEl.style.backgroundImage = '';
      row.textEl.textContent = (row.input.value.trim() || '忆').slice(0, 1);
    }
  }

  function syncRemoveButtons() {
    rows.forEach(function (r) {
      r.delEl.classList.toggle('hide', rows.length <= 1);
    });
  }

  function addRow() {
    var row = { avatar: '', fromUrl: false };
    var el = document.createElement('div');
    el.className = 'cc-friend';
    el.innerHTML =
      '<div class="cc-row">' +
        '<button type="button" class="cc-av" data-act="av" aria-label="选择头像">' +
          '<span class="cc-av-text">忆</span>' +
          '<span class="cc-av-badge">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<path d="M12 5.5v13M5.5 12h13"/>' +
            '</svg>' +
          '</span>' +
        '</button>' +
        '<div class="field cc-name">' +
          '<input type="text" maxlength="20" placeholder="例如：阿凛" data-act="name" autocomplete="off">' +
        '</div>' +
        '<button type="button" class="cc-del hide" data-act="del" aria-label="去掉这一位">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">' +
            '<path d="M6 6l12 12M18 6L6 18"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="cc-url cc-url-line" data-act="urlbox">' +
        '<span class="cc-url-ico">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
            '<path d="M10 13.6a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.3"/>' +
            '<path d="M14 10.4a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3"/>' +
          '</svg>' +
        '</span>' +
        '<input type="text" inputmode="url" placeholder="头像直链 URL，粘贴即解析" data-act="url" autocomplete="off">' +
      '</div>';
    row.el = el;
    row.avEl = el.querySelector('[data-act="av"]');
    row.textEl = el.querySelector('.cc-av-text');
    row.input = el.querySelector('[data-act="name"]');
    row.urlInput = el.querySelector('[data-act="url"]');
    row.urlBox = el.querySelector('[data-act="urlbox"]');
    row.delEl = el.querySelector('[data-act="del"]');
    rowsWrap.appendChild(el);
    rows.push(row);
    syncRemoveButtons();
    return row;
  }

  function openCreate() {
    rows = [];
    createCard.innerHTML =
      '<div class="cc-rows" id="ccRows"></div>' +
      '<p class="cc-hint" id="urlHint">' + URL_HINT + '</p>' +
      '<div class="cc-foot">' +
        '<button type="button" class="cc-add" id="btnAddRow">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
            '<path d="M12 6v12M6 12h12"/>' +
          '</svg>再添加一位' +
        '</button>' +
        '<div class="cc-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" id="btnCancel">取消</button>' +
          '<button type="submit" class="btn btn-primary btn-sm" id="btnCreate">创建</button>' +
        '</div>' +
      '</div>';
    rowsWrap = createCard.querySelector('#ccRows');
    var r = addRow();
    hint(URL_HINT, false, r);
    createMask.classList.remove('hide');
    createMask.setAttribute('aria-hidden', 'false');
    setTimeout(function () { r.input.focus(); }, 60);
  }

  function closeCreate() {
    createMask.classList.add('hide');
    createMask.setAttribute('aria-hidden', 'true');
  }

  createMask.addEventListener('click', function (e) {
    if (e.target === createMask) closeCreate();
  });

  // 点胶囊任意位置都把光标交给里面的输入框（输入框只占胶囊中间那条，点边缘不会自动聚焦）
  createCard.addEventListener('mousedown', function (e) {
    var box = e.target.closest('.cc-name, .cc-url, .field');
    if (!box || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var inp = box.querySelector('input, textarea');
    if (inp) setTimeout(function () { inp.focus(); }, 0);
  });

  // 卡片内容每次重开都重建，行内按钮与增删行走事件委托
  createCard.addEventListener('click', function (e) {
    if (e.target.closest('#btnAddRow')) {
      var nr = addRow();
      nr.input.focus();
      hint(URL_HINT, false, nr);
      return;
    }
    if (e.target.closest('#btnCancel')) {
      closeCreate();
      return;
    }
    var rowEl = e.target.closest('.cc-friend');
    if (!rowEl) return;
    var row = rows.filter(function (x) { return x.el === rowEl; })[0];
    if (!row) return;
    var act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.getAttribute('data-act') === 'av') {
      pickImage(300 * 1024).then(function (b64) {
        if (!b64) return;
        row.avatar = b64;
        row.fromUrl = false;
        paintRow(row);
        row.urlInput.value = '';
        hint('已用本地图片', false, row);
      });
    } else if (act.getAttribute('data-act') === 'del') {
      if (rows.length <= 1) return;
      row.el.remove();
      rows = rows.filter(function (x) { return x !== row; });
      syncRemoveButtons();
      hint(URL_HINT, false, null);
    }
  });

  createCard.addEventListener('input', function (e) {
    var act = e.target.getAttribute('data-act');
    if (!act) return;
    var rowEl = e.target.closest('.cc-friend');
    var row = rows.filter(function (x) { return x.el === rowEl; })[0];
    if (act === 'name' && row && !row.avatar) paintRow(row);
    if (act !== 'url' || !row) return;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(function () { parseUrlField(row); }, 500);
  });

  createCard.addEventListener('focusout', function (e) {
    if (e.target.getAttribute('data-act') !== 'url') return;
    var rowEl = e.target.closest('.cc-friend');
    var row = rows.filter(function (x) { return x.el === rowEl; })[0];
    if (!row) return;
    clearTimeout(urlTimer);
    parseUrlField(row);
  });

  function parseUrlField(row) {
    var raw = row.urlInput.value.trim();
    if (!raw) {
      hint(URL_HINT, false, row);
      if (row.fromUrl) {
        row.avatar = '';
        row.fromUrl = false;
        paintRow(row);
      }
      return;
    }
    if (!looksLikeImageUrl(raw)) {
      hint('看起来不是图片直链，检查一下后缀或链接格式', true, row);
      return;
    }
    var url = normalizeUrl(raw);
    // 先把链接直接铺到头像上，探图成功后报尺寸；失败再退回
    var prev = row.avatar;
    var prevFromUrl = row.fromUrl;
    row.avatar = url;
    row.fromUrl = true;
    paintRow(row);
    hint('解析中…', false, row);
    probeUrl(url).then(function (res) {
      if (row.urlInput.value.trim() !== raw) return;
      if (!res.ok) {
        row.avatar = prev;
        row.fromUrl = prevFromUrl;
        paintRow(row);
        hint('这个链接打不开，可能不是图片直链或需要登录', true, row);
        return;
      }
      row.avatar = url;
      row.fromUrl = true;
      paintRow(row);
      hint('已解析 ' + res.w + ' × ' + res.h + '，可用', false, row);
    });
  }

  createCard.addEventListener('submit', function (e) {
    e.preventDefault();
    var filled = rows.filter(function (r) { return r.input.value.trim(); });
    if (!filled.length) {
      YM.ui.toast(rows.length > 1 ? '至少填一位的名字' : '请先给会话起个名字');
      rows[0].input.focus();
      return;
    }
    if (filled.length !== rows.length) {
      YM.ui.toast('还有一位没填名字，补上或去掉这一位');
      var empty = rows.filter(function (r) { return !r.input.value.trim(); })[0];
      empty.input.focus();
      return;
    }
    var created = [];
    YM.store.update(function (d) {
      filled.forEach(function (r) {
        var name = r.input.value.trim();
        // 会话名即角色名：同名角色复用，没有就建一个，专属字卡挂在这个角色名下
        var role = (d.members || []).filter(function (m) { return m.name === name; })[0];
        if (!role) {
          role = { id: YM.util.uid('m'), name: name, avatar: r.avatar, createdAt: Date.now() };
          d.members.push(role);
        } else if (r.avatar && !role.avatar) {
          role.avatar = r.avatar;
        }
        var newId = YM.util.uid('s');
        d.sessions.push({
          id: newId,
          name: name,
          avatar: r.avatar || role.avatar || '',
          memberId: role.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          params: YM.defaultParams(),
          messages: []
        });
        d.ui.lastSessionId = newId;
        created.push(newId);
      });
    }, 'sessions');
    closeCreate();
    if (created.length === 1) {
      location.href = 'chat.html?sid=' + encodeURIComponent(created[0]);
    } else {
      YM.ui.toast('已建好 ' + created.length + ' 个会话');
      render();
    }
  });

  /* ---------- 创建群聊 ---------- */
  // 可选成员只认会话列表里还在的角色，和字卡库、设置里的名单保持一致
  function groupRoles(d) {
    var out = [], seen = {};
    (d.sessions || []).forEach(function (s) {
      if (!s.memberId || seen[s.memberId]) return;
      seen[s.memberId] = 1;
      out.push({ id: s.memberId, name: s.name, avatar: s.avatar || '' });
    });
    return out;
  }

  function openCreateGroup() {
    var d = YM.store.get();
    var roles = groupRoles(d);
    if (roles.length < 2) {
      YM.ui.toast('至少要有两个角色才能建群，先加一个好友');
      openCreate();
      return;
    }

    var card = document.getElementById('groupCard');
    var mask = document.getElementById('groupMask');
    var gAvatar = '';
    var gFromUrl = false;
    var gTimer = null;

    card.innerHTML =
      '<div class="cc-row">' +
        '<button type="button" class="cc-av" id="gAv" aria-label="选择群头像">' +
          '<span class="cc-av-text" id="gAvText">群</span>' +
          '<span class="cc-av-badge">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
              '<path d="M12 5.5v13M5.5 12h13"/>' +
            '</svg>' +
          '</span>' +
        '</button>' +
        '<div class="field cc-name">' +
          '<input id="groupName" type="text" maxlength="20" placeholder="例如：周三夜谈">' +
        '</div>' +
      '</div>' +
      '<div class="cc-url" id="gUrlBox">' +
        '<span class="cc-url-ico">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
            '<path d="M10 13.6a3.6 3.6 0 0 0 5.1 0l2.6-2.6a3.6 3.6 0 0 0-5.1-5.1l-1.3 1.3"/>' +
            '<path d="M14 10.4a3.6 3.6 0 0 0-5.1 0l-2.6 2.6a3.6 3.6 0 0 0 5.1 5.1l1.3-1.3"/>' +
          '</svg>' +
        '</span>' +
        '<input id="gUrl" type="text" inputmode="url" placeholder="头像直链 URL，粘贴即解析" autocomplete="off">' +
      '</div>' +
      '<p class="cc-hint" id="gHint">也可直接点头像上传本地图片</p>' +
      '<p class="cc-label">群成员（至少两个）</p>' +
      '<div class="pick-grid" id="pickGrid">' +
        roles.map(function (m) {
          return '<button type="button" class="pick-chip" data-mid="' + m.id + '" aria-pressed="false">' +
            '<span class="pick-av">' + YM.util.escapeHtml((m.name || '忆').slice(0, 1)) + '</span>' +
            '<span class="pick-name">' + YM.util.escapeHtml(m.name) + '</span>' +
            '</button>';
        }).join('') +
      '</div>' +
      '<div class="cc-actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" id="btnGroupCancel">取消</button>' +
        '<button type="submit" class="btn btn-primary btn-sm" id="btnGroupOk">创建</button>' +
      '</div>';

    var gAv = card.querySelector('#gAv');
    var gAvText = card.querySelector('#gAvText');
    var nameInput = card.querySelector('#groupName');
    var urlInput = card.querySelector('#gUrl');
    var urlBox = card.querySelector('#gUrlBox');
    var hintEl = card.querySelector('#gHint');
    var grid = card.querySelector('#pickGrid');

    function gSetAvatar(src, fromUrl) {
      gAvatar = src || '';
      gFromUrl = !!gAvatar && !!fromUrl;
      if (gAvatar) {
        gAv.style.backgroundImage = 'url(' + JSON.stringify(gAvatar) + ')';
        gAvText.textContent = '';
      } else {
        gAv.style.backgroundImage = '';
        gAvText.textContent = (nameInput.value.trim() || '群').slice(0, 1);
      }
    }

    function gHint(text, bad) {
      hintEl.textContent = text;
      hintEl.classList.toggle('is-bad', !!bad);
      urlBox.classList.remove('is-good', 'is-bad');
      if (text !== URL_HINT) urlBox.classList.add(bad ? 'is-bad' : 'is-good');
    }

    function gParse() {
      var raw = urlInput.value.trim();
      if (!raw) {
        gHint(URL_HINT, false);
        if (gFromUrl) gSetAvatar('', false);
        return;
      }
      if (!looksLikeImageUrl(raw)) {
        gHint('看起来不是图片直链，检查一下后缀或链接格式', true);
        return;
      }
      var url = normalizeUrl(raw);
      gHint('解析中…', false);
      probeUrl(url).then(function (res) {
        if (urlInput.value.trim() !== raw) return;
        if (!res.ok) {
          gHint('这个链接打不开，可能不是图片直链或需要登录', true);
          return;
        }
        gSetAvatar(url, true);
        gHint('已解析 ' + res.w + ' × ' + res.h + '，可用', false);
      });
    }

    gSetAvatar('', false);
    nameInput.value = '';
    urlInput.value = '';
    gHint(URL_HINT, false);

    gAv.addEventListener('click', function () {
      pickImage(300 * 1024).then(function (b64) {
        if (!b64) return;
        gSetAvatar(b64, false);
        urlInput.value = '';
        gHint('已用本地图片，要改回直链就清空这行再粘贴', false);
      });
    });

    nameInput.addEventListener('input', function () {
      if (!gAvatar) gAvText.textContent = (nameInput.value.trim() || '群').slice(0, 1);
    });

    urlInput.addEventListener('input', function () {
      clearTimeout(gTimer);
      gTimer = setTimeout(gParse, 500);
    });

    urlInput.addEventListener('blur', function () {
      clearTimeout(gTimer);
      gParse();
    });

    grid.addEventListener('click', function (e) {
      var chip = e.target.closest('.pick-chip');
      if (!chip) return;
      var on = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', on ? 'false' : 'true');
      // 群头像还没选时，跟着第一个选中的成员走
      if (!gAvatar) {
        var first = grid.querySelector('.pick-chip[aria-pressed="true"]');
        var mid = first && first.getAttribute('data-mid');
        var m = roles.filter(function (x) { return x.id === mid; })[0];
        if (m && m.avatar) {
          gAv.style.backgroundImage = 'url(' + JSON.stringify(m.avatar) + ')';
          gAvText.textContent = '';
        } else if (!gAvatar) {
          gAv.style.backgroundImage = '';
          gAvText.textContent = (nameInput.value.trim() || '群').slice(0, 1);
        }
      }
    });

    card.querySelector('#btnGroupCancel').addEventListener('click', function () { closeGroup(); });

    mask.addEventListener('click', function (e) {
      if (e.target === mask) closeGroup();
    });

    function closeGroup() {
      mask.classList.add('hide');
      mask.setAttribute('aria-hidden', 'true');
    }

    card.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      if (!name) {
        YM.ui.toast('请先给群聊起个名字');
        nameInput.focus();
        return;
      }
      var picked = Array.prototype.slice.call(grid.querySelectorAll('.pick-chip'))
        .filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
        .map(function (c) { return c.getAttribute('data-mid'); });
      if (picked.length < 2) {
        YM.ui.toast('至少选两个角色');
        return;
      }
      var newId = YM.util.uid('s');
      YM.store.update(function (dd) {
        var p = YM.defaultParams();
        p.groupEnabled = true;
        p.memberIds = picked;
        dd.sessions.push({
          id: newId,
          name: name,
          avatar: gAvatar,
          memberId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          params: p,
          messages: []
        });
        dd.ui.lastSessionId = newId;
      }, 'sessions');
      closeGroup();
      location.href = 'chat.html?sid=' + encodeURIComponent(newId);
    });

    mask.classList.remove('hide');
    mask.setAttribute('aria-hidden', 'false');
    setTimeout(function () { nameInput.focus(); }, 60);
  }

  /* ---------- 会话操作 ---------- */
  function openMore(sid) {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) return;

    YM.ui.actionSheet({
      title: sn.name,
      items: [
        { key: 'rename', label: '重命名' },
        { key: 'avatar', label: '更换头像' },
        { key: 'copy', label: '复制会话' },
        { key: 'delete', label: '删除会话' }
      ]
    }).then(function (item) {
      if (!item) return;
      if (item.key === 'rename') doRename(sid);
      if (item.key === 'avatar') doAvatar(sid);
      if (item.key === 'copy') doCopy(sid);
      if (item.key === 'delete') doDelete(sid);
    });
  }

  function doRename(sid) {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) return;
    YM.ui.input({
      title: '重命名',
      value: sn.name,
      maxlength: 20,
      rows: 1,
      required: true,
      okText: '保存'
    }).then(function (val) {
      if (val == null) return;
      YM.store.update(function (dd) {
        var s = YM.findSession(dd, sid);
        if (s) {
          s.name = val;
          s.updatedAt = Date.now();
          // 角色名跟着会话名走，字卡库下拉与设置里的角色名保持一致
          if (s.memberId) {
            (dd.members || []).forEach(function (m) { if (m.id === s.memberId) m.name = val; });
          }
        }
      }, 'sessions');
    });
  }

  function doAvatar(sid) {
    pickImage(300 * 1024).then(function (b64) {
      if (!b64) return;
      YM.store.update(function (dd) {
        var s = YM.findSession(dd, sid);
        if (s) {
          s.avatar = b64;
          s.updatedAt = Date.now();
          if (s.memberId) {
            (dd.members || []).forEach(function (m) { if (m.id === s.memberId) m.avatar = b64; });
          }
        }
      }, 'sessions');
    });
  }

  function doCopy(sid) {
    var newId = YM.util.uid('s');
    YM.store.update(function (dd) {
      var s = YM.findSession(dd, sid);
      if (!s) return;
      var copy = JSON.parse(JSON.stringify(s));
      copy.id = newId;
      copy.name = s.name + ' 副本';
      copy.createdAt = Date.now();
      copy.updatedAt = Date.now();
      copy.messages = copy.messages.map(function (m) {
        m.id = YM.util.uid('msg');
        return m;
      });
      dd.sessions.push(copy);
    }, 'sessions');
    YM.ui.toast('已创建副本');
  }

  function doDelete(sid) {
    YM.ui.confirm({
      title: '删除会话',
      body: '删除后该会话的聊天记录一并清除，无法恢复。字卡库不受影响。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      YM.task.cancel(sid);
      YM.store.update(function (dd) {
        dd.sessions = dd.sessions.filter(function (s) { return s.id !== sid; });
        if (dd.ui.lastSessionId === sid) dd.ui.lastSessionId = null;
      }, 'sessions');
      YM.ui.toast('已删除');
    });
  }

  /* ---------- 事件 ---------- */
  listEl.addEventListener('click', function (e) {
    setPop(false);
    var moreBtn = e.target.closest('[data-more]');
    if (moreBtn) {
      e.preventDefault();
      e.stopPropagation();
      openMore(moreBtn.getAttribute('data-more'));
      return;
    }
    var card = e.target.closest('.session-card');
    if (!card) return;
    YM.sound.unlock();
    location.href = 'chat.html?sid=' + encodeURIComponent(card.getAttribute('data-sid'));
  });

  listEl.addEventListener('contextmenu', function (e) {
    var card = e.target.closest('.session-card');
    if (!card) return;
    e.preventDefault();
    openMore(card.getAttribute('data-sid'));
  });

  /* ---------- ＋ 侧弹窗（加好友 / 创建群聊） ---------- */
  var btnNew = document.getElementById('btnNew');
  var btnNewEmpty = document.getElementById('btnNewEmpty');
  var popEl = document.getElementById('newPanel');

  function setPop(open) {
    popEl.classList.toggle('is-open', open);
    popEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    btnNew.classList.toggle('is-on', open);
    btnNew.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btnNew.addEventListener('click', function () {
    YM.sound.unlock();
    setPop(!popEl.classList.contains('is-open'));
  });

  btnNewEmpty.addEventListener('click', function () {
    YM.sound.unlock();
    openCreate();
  });

  popEl.addEventListener('click', function (e) {
    var item = e.target.closest('.np-item');
    if (!item) return;
    var key = item.getAttribute('data-key');
    setPop(false);
    if (key === 'friend') openCreate();
    if (key === 'group') openCreateGroup();
  });

  // 点弹窗以外的地方收起
  document.addEventListener('click', function (e) {
    if (!popEl.classList.contains('is-open')) return;
    if (e.target.closest('#newPanel') || e.target.closest('#btnNew')) return;
    setPop(false);
  });


  YM.event.on('ym:data', function (detail) {
    if (detail && detail.scope === 'settings') return;
    render();
  });

  render();
})();
