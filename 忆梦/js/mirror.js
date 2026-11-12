/* ============================================================
   忆梦 · mirror.js（共鉴 · 学习 / 办公 / 小说 / 视频 / 音乐 / 休息 / 游戏 / 锻炼 八格，点开是陪伴）
   ============================================================ */
(function () {
  'use strict';

  var app = document.querySelector('.mirror-app');
  if (!app) return;

  var KINDS = [
    { key: 'study', name: '学习' },
    { key: 'work', name: '办公' },
    { key: 'novel', name: '小说' },
    { key: 'video', name: '视频' },
    { key: 'music', name: '音乐' },
    { key: 'rest', name: '休息' },
    { key: 'game', name: '游戏' },
    { key: 'exercise', name: '锻炼' }
  ];

  // 八类各一枚细线图标：学习 = 一支笔、办公 = 公文包、小说 = 一本书、视频 = 播放、音乐 = 音符、休息 = 月牙、游戏 = 手柄、锻炼 = 哑铃
  var KIND_ICONS = {
    study: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M16.4 4.6l3 3.1L9.4 17.6l-4 1 1-4z"/><path d="M13.6 7.5l3 3.1"/></svg>',
    work: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3.2" y="7.4" width="17.6" height="11.2" rx="2"/><path d="M9.2 7.4v-1.6a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2v1.6"/></svg>',
    novel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="5" y="4.6" width="14" height="14.8" rx="2"/>' +
      '<path d="M9 4.6v14.8"/><path d="M12.2 9h4.2M12.2 12.6h4.2"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="3.4" y="5" width="17.2" height="14" rx="3"/>' +
      '<path d="M10.4 9.4l4.8 2.6-4.8 2.6z"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<circle cx="6.6" cy="17.4" r="2.2"/><circle cx="17.4" cy="15.6" r="2.2"/>' +
      '<path d="M8.8 17.4V6.6l10.8-1.8v10.8"/></svg>',
    rest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M15.6 4.4a8 8 0 1 0 4 13.6 8.9 8.9 0 0 1-4-13.6z"/></svg>',
    game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M7.7 7.9h8.6a4.5 4.5 0 0 1 4.4 5.2l-.8 4.2a2.6 2.6 0 0 1-4.5 1.2l-1.5-1.8H9.9l-1.5 1.8a2.6 2.6 0 0 1-4.5-1.2l-.8-4.2A4.5 4.5 0 0 1 7.7 7.9z"/>' +
      '<path d="M8.3 10.4v3.6M6.5 12.2h3.6"/><circle cx="15.2" cy="10.6" r="1.1"/><circle cx="17.4" cy="13" r="1.1"/></svg>',
    exercise: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M4.4 8.6v6.8M7.2 6.6v10.8"/><path d="M16.8 6.6v10.8M19.6 8.6v6.8"/>' +
      '<path d="M7.2 12h9.6"/></svg>'
  };

  function kindIcon(key) {
    return KIND_ICONS[key] || '';
  }

  function kindName(key) {
    for (var i = 0; i < KINDS.length; i++) {
      if (KINDS[i].key === key) return KINDS[i].name;
    }
    return '';
  }

  function keyOf(d) {
    return d.getFullYear() + '-' + YM.util.pad2(d.getMonth() + 1) + '-' + YM.util.pad2(d.getDate());
  }

  /* ---------- 陪伴 ---------- */

  // 陪的人按总表查（不必还挂在会话上）；能被邀请的候选只列会话里露面过的
  function memberOf(id) {
    var d = YM.store.get() || {};
    var list = d.members || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === id) return list[i];
    }
    return null;
  }

  function pals() {
    var d = YM.store.get();
    return (d && d.mirror && d.mirror.pals) || {};
  }

  // 一格可以只有一个人陪，也可以几个人一起（存字符串或数组都认）
  function palIds(kind) {
    var day = pals()[keyOf(new Date())] || {};
    var v = day[kind];
    if (!v) return [];
    return Array.isArray(v) ? v.slice() : [v];
  }

  function setPal(kind, ids) {
    var list = ids || [];
    YM.store.update(function (d) {
      if (!d.mirror) d.mirror = {};
      if (!d.mirror.pals) d.mirror.pals = {};
      var k = keyOf(new Date());
      if (!d.mirror.pals[k]) d.mirror.pals[k] = {};
      if (list.length) d.mirror.pals[k][kind] = list.slice();
      else delete d.mirror.pals[k][kind];
    }, 'mirror');
  }

  // 角色主动发来的邀请，现在落在 TA 的会话里；这里按卡片反查
  function pendingFor(kind) {
    var d = YM.store.get() || {};
    var hit = null;
    (d.sessions || []).forEach(function (sn) {
      if (hit) return;
      (sn.messages || []).forEach(function (m) {
        if (hit || !m || m.kind !== 'buddy' || !m.buddy) return;
        if (m.buddy.dir !== 'in' || m.buddy.kind !== kind) return;
        if ((m.state || 'pending') !== 'pending') return;
        hit = { sn: sn, msg: m };
      });
    });
    return hit;
  }

  // 一天只掷一次：某位角色主动发来一张「想陪你」的卡
  function rollCard() {
    var d = YM.store.get() || {};
    var day = keyOf(new Date());
    if (d.mirror && d.mirror.rollDay === day) return;
    YM.store.update(function (dd) {
      if (!dd.mirror) dd.mirror = {};
      if (dd.mirror.rollDay === day) return;
      dd.mirror.rollDay = day;
      var list = YM.membersInUse(dd);
      if (!list.length) return;
      if (Math.random() > 0.45) return;
      var who = list[YM.util.randInt(0, list.length - 1)];
      var kind = KINDS[YM.util.randInt(0, KINDS.length - 1)];
      var sn = (dd.sessions || []).filter(function (x) { return x && x.memberId === who.id; })[0];
      if (!sn) return;
      if (!Array.isArray(sn.messages)) sn.messages = [];
      sn.messages.push({
        id: YM.util.uid('msg'),
        role: 'peer',
        kind: 'buddy',
        buddy: { kind: kind.key, name: kind.name, dir: 'in', memberId: who.id },
        state: 'pending',
        text: '陪伴邀请 · ' + kind.name,
        createdAt: Date.now(),
        readStatus: null,
        memberId: who.id,
        memberName: who.name,
        memberAvatar: who.avatar || '',
        quotedMessageId: null,
        mergedParts: null,
        triggerId: null
      });
      sn.updatedAt = Date.now();
    }, 'all');
  }

  /* ---------- 渲染 ---------- */

  function render() {
    var box = document.getElementById('mirrorKinds');
    if (!box) return;

    var html = '';
    KINDS.forEach(function (kn) {
      var inv = pendingFor(kn.key);
      var names = palIds(kn.key).map(function (id) {
        var m = memberOf(id);
        return m ? m.name : '';
      }).filter(Boolean);
      var note = '';
      if (inv) {
        var who = memberOf(inv.msg.buddy.memberId);
        note = '<span class="mirror-kind-note is-call" data-open="' + kn.key + '">' +
          YM.util.escapeHtml(who ? who.name : '有人') + ' 想陪你</span>';
      } else if (names.length) {
        note = '<span class="mirror-kind-note">' + YM.util.escapeHtml(names.join('、')) + '</span>';
      } else {
        note = '<span class="mirror-kind-note is-empty">没人陪</span>';
      }
      html += '<span class="mirror-kind" data-kind="' + kn.key + '">' +
        '<span class="mirror-kind-tile" data-invite="' + kn.key + '">' + kindIcon(kn.key) + '</span>' +
        '<span class="mirror-kind-label">' + kn.name + '</span>' +
        note +
        '</span>';
    });
    box.innerHTML = html;
  }

  /* ---------- 我邀请角色 ---------- */

  function sessionOfMember(id) {
    var d = YM.store.get() || {};
    var list = d.sessions || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].memberId === id) return list[i];
    }
    return null;
  }

  // 邀请落到 TA 的会话里：一张「陪伴邀请」卡，过几秒由 TA 给出接受 / 拒绝
  function sendInvite(kind, memberId) {
    var who = memberOf(memberId);
    var sn = sessionOfMember(memberId);
    var name = who ? who.name : '对方';
    if (!sn) {
      YM.ui.toast('还没有和 ' + name + ' 的会话');
      return;
    }
    var now = Date.now();
    YM.store.update(function (d) {
      var s2 = YM.findSession(d, sn.id);
      if (!s2) return;
      if (!Array.isArray(s2.messages)) s2.messages = [];
      s2.messages.push({
        id: YM.util.uid('msg'),
        role: 'user',
        kind: 'buddy',
        buddy: {
          kind: kind,
          name: kindName(kind),
          dir: 'out',
          memberId: memberId,
          memberName: name,
          dueAt: now + 2400
        },
        state: 'pending',
        text: '陪伴邀请 · ' + kindName(kind),
        createdAt: now,
        readStatus: null,
        memberId: null,
        memberName: '',
        memberAvatar: '',
        quotedMessageId: null,
        mergedParts: null,
        triggerId: null
      });
      s2.updatedAt = now;
    }, 'messages');

    render();
    YM.ui.toast('邀请已发到 ' + name + ' 的会话');
  }

  // 可以只点一位，也可以一次点好几位：点一行选中，再点取消选中
  function openInvite(kind) {
    var list = YM.membersInUse();
    if (!list.length) {
      YM.ui.toast('还没有可以邀请的人');
      return;
    }
    var picked = palIds(kind);
    var had = picked.length;

    YM.ui.sheet(function (sheet, close) {
      var rows = list.map(function (m) {
        var on = picked.indexOf(m.id) >= 0;
        return '<button type="button" class="mk-row' + (on ? ' is-on' : '') + '" data-mid="' + YM.util.escapeHtml(m.id) + '">' +
          '<span class="mk-row-name">' + YM.util.escapeHtml(m.name || '未命名') + '</span>' +
          '<i class="mk-tick"></i></button>';
      }).join('');

      sheet.innerHTML =
        '<h2 class="sheet-title">邀请谁一起' + YM.util.escapeHtml(kindName(kind)) + '</h2>' +
        '<div class="mk-rows" id="mkRows">' + rows + '</div>' +
        (had ? '<button type="button" class="mk-row is-none" id="mkClear">' +
          '<span class="mk-row-name">取消今天的陪伴</span><i class="mk-tick"></i></button>' : '') +
        '<div class="sheet-actions">' +
          '<button type="button" class="btn btn-ghost" id="mkCancel">取消</button>' +
          '<button type="button" class="btn" id="mkOk">邀请</button>' +
        '</div>';

      var okBtn = sheet.querySelector('#mkOk');
      function syncOk() {
        okBtn.textContent = picked.length ? '邀请（' + picked.length + '）' : '邀请';
      }
      syncOk();

      sheet.querySelector('#mkRows').addEventListener('click', function (e) {
        var row = e.target.closest('.mk-row');
        if (!row) return;
        var mid = row.getAttribute('data-mid');
        var on = picked.indexOf(mid) >= 0;
        if (on) picked = picked.filter(function (x) { return x !== mid; });
        else picked.push(mid);
        row.classList.toggle('is-on', !on);
        syncOk();
      });

      var clearBtn = sheet.querySelector('#mkClear');
      if (clearBtn) {
        clearBtn.onclick = function () {
          picked = [];
          close();
          setPal(kind, []);
          render();
          YM.ui.toast('已取消今天的陪伴');
        };
      }

      sheet.querySelector('#mkCancel').onclick = close;
      okBtn.onclick = function () {
        if (!picked.length) {
          YM.ui.toast('先选一位');
          return;
        }
        picked.slice().forEach(function (mid) {
          if (palIds(kind).indexOf(mid) < 0) sendInvite(kind, mid);
        });
        close();
        YM.ui.toast('邀请已发到 ' + (picked.length > 1 ? picked.length + ' 位的会话' : 'TA 的会话'));
      };
    });
  }

  /* ---------- 角色邀请我 ---------- */

  // 这一格的邀请在会话里等着应答，点小字直接跳到那个会话
  function goAnswer(kind) {
    var inv = pendingFor(kind);
    if (!inv) {
      render();
      return;
    }
    location.href = 'chat.html?sid=' + encodeURIComponent(inv.sn.id);
  }

  function bind() {
    var box = document.getElementById('mirrorKinds');
    if (!box) return;
    box.addEventListener('click', function (e) {
      var t = e.target;
      var ans = t.closest ? t.closest('[data-open]') : null;
      if (ans) {
        goAnswer(ans.getAttribute('data-open'));
        return;
      }
      var inv = t.closest ? t.closest('[data-invite]') : null;
      if (inv) openInvite(inv.getAttribute('data-invite'));
    });
  }

  rollCard();
  render();
  bind();
  app.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light');
  YM.event.on('ym:data', function (detail) {
    if (!detail || detail.scope === 'mirror' || detail.scope === 'all') {
      app.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light');
      render();
    }
  });
})();
