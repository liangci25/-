/* ============================================================
   忆梦 · letters.js（信笺）
   ============================================================ */
(function () {
  'use strict';

  var listEl = document.getElementById('letterList');
  var emptyEl = document.getElementById('letterEmpty');
  var emptyTitle = document.getElementById('emptyTitle');
  var emptySub = document.getElementById('emptySub');
  var segEl = document.getElementById('letterSeg');
  var writeBtn = document.getElementById('btnWrite');

  var seg = 'out';

  var esc = function (v) { return YM.util.escapeHtml(v == null ? '' : String(v)); };

  /* 对方回信时可用的句子，随机拼几行 */
  var LINES = [
    '收到你的信了，拆信封的时候手指有点抖。',
    '这几日天气转凉，记得多添一件外衣。',
    '你写下的那件事，我反复看了两遍。',
    '窗外的风声很像你那晚说话的语气。',
    '纸上还有一点你写字时留下的折痕。',
    '我把信折好，压在了常翻的那本书里。',
    '有些话隔着纸反而更容易说出口。',
    '夜里睡不太着，就想着把回信写完。',
    '你提到的那个地方，我记住了。',
    '不必急着回信，慢慢写就好。',
    '信到得晚一点也没关系，我会等。',
    '下次写信，多写一点你自己的事。'
  ];

  var TITLES = ['见字如面', '秋日短笺', '灯下', '一封回信', '给你的几句话'];

  /* 时空来信：角色主动写来，不接我的话头 */
  var DRIFT_TITLES = ['无事的傍晚', '一页便笺', '随手写写', '未寄出的句子', '路过时想起'];

  var DRIFT_LINES = [
    '今天没别的事，就是想给你写几行字。',
    '整理抽屉时翻到一张旧纸，上面是空的，就拿来写了。',
    '窗外下了一阵雨，停了，我又坐了一会儿。',
    '你上次提过的那本书，我读完了。',
    '有些话说出口太轻，写在纸上会重一点。',
    '如果这会儿你也没睡，就当作我们隔着一张桌子。',
    '不必回。我只是想把这一页留在你那里。',
    '路过一间旧书店，想起你翻书的样子。'
  ];

  /* 一对一会话（群聊不算），按最近更新排前 */
  function dmSessions(d) {
    return (d.sessions || []).slice().filter(function (sn) {
      var p = sn.params || {};
      var group = !!p.groupEnabled && (p.memberIds || []).length >= 2;
      return !group;
    }).sort(function (a, b) {
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  }

  function peerName() {
    var sns = dmSessions(YM.store.get());
    return sns.length ? (sns[0].name || '对方') : '远方的人';
  }

  function letters(d) {
    if (!Array.isArray(d.letters)) d.letters = [];
    return d.letters;
  }

  function pushLetter(item) {
    YM.store.update(function (d) {
      letters(d).push(item);
      return d;
    });
  }

  function saveAll(fn) {
    YM.store.update(fn);
  }

  /* 早先的回信没记 replyTo，按「同一位、时间在后」补挂一次 */
  function linkOld(d) {
    var need = false;
    letters(d).forEach(function (x) {
      if (x.role !== 'peer' || x.replyTo) return;
      var cands = letters(d).filter(function (u) {
        return u.role === 'user' && u.peerName === x.peerName && (u.createdAt || 0) <= (x.createdAt || 0);
      }).sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      for (var i = 0; i < cands.length; i++) {
        if (!replyOf(d, cands[i].id)) {
          x.replyTo = cands[i].id;
          need = true;
          break;
        }
      }
    });
    return need;
  }

  /* 时空来信：一天最多落一封，且第一次进来一定有一封 */
  function rollDrift() {
    var d = YM.store.get();
    var today = YM.util.dayKey(Date.now());
    var meta = d.letterDrift || {};
    if (meta.day === today) return;
    var sns = dmSessions(d);
    var had = letters(d).filter(function (x) { return x.role === 'peer' && !x.replyTo; }).length;
    YM.store.update(function (dd) {
      dd.letterDrift = { day: today };
      if (!sns.length) return dd;
      if (had > 0 && YM.util.randInt(1, 100) > 45) return dd;
      var sn = sns[YM.util.randInt(0, sns.length - 1)];
      var pool = YM.util.shuffle(DRIFT_LINES.slice());
      var n = YM.util.randInt(2, 3);
      letters(dd).push({
        id: YM.util.uid('l'),
        role: 'peer',
        peerName: sn.name || '对方',
        title: YM.util.pickOne(DRIFT_TITLES),
        body: pool.slice(0, n).join('\n'),
        createdAt: Date.now(),
        read: false
      });
      return dd;
    });
    render();
  }

  /* ---------- 回信：到点了就落一封 ---------- */
  function tick() {
    var d = YM.store.get();
    var now = Date.now();
    var due = letters(d).filter(function (l) { return l.replyAt && !l.replied && l.replyAt <= now; });
    if (!due.length) return;
    YM.store.update(function (dd) {
      letters(dd).forEach(function (l) {
        if (l.replyAt && !l.replied && l.replyAt <= now) {
          l.replied = true;
          letters(dd).push({
            id: YM.util.uid('l'),
            role: 'peer',
            peerName: l.peerName,
            replyTo: l.id,
            title: YM.util.pickOne(TITLES),
            body: makeBody(),
            createdAt: l.replyAt,
            read: false
          });
        }
      });
      return dd;
    });
    YM.ui.toast('收到一封回信');
    render();
  }

  function makeBody() {
    var n = YM.util.randInt(3, 4);
    var pool = YM.util.shuffle(LINES.slice());
    var out = [];
    for (var i = 0; i < n && i < pool.length; i++) out.push(pool[i]);
    return out.join('\n');
  }

  /* ---------- 列表 ---------- */
  function excerpt(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function replyOf(d, uid) {
    return letters(d).filter(function (x) { return x.replyTo === uid; })[0] || null;
  }

  function dot(on) {
    return '<span class="lc-dot' + (on ? '' : ' is-read') + '"></span>';
  }

  function cardHtml(it) {
    if (it.kind === 'in') {
      var l = it.l;
      var r = it.r;
      return '<li><button type="button" class="letter-card" data-id="' + esc(l.id) + '" data-kind="in">' +
        '<div class="lc-top">' +
          '<span class="lc-title">' + esc(l.title || '无题') + '</span>' +
          '<span class="lc-time">' + YM.util.formatMsgTime(r.createdAt) + '</span>' +
        '</div>' +
        '<div class="lc-excerpt">' + esc(excerpt(r.body)) + '</div>' +
        '<div class="lc-foot"><span>' + esc(r.peerName || l.peerName || '对方') + ' · 回信</span>' +
          dot(!r.read) + '</div>' +
        '</button></li>';
    }
    var one = it.l;
    var foot = it.kind === 'out'
      ? '写给 ' + esc(one.peerName || '对方')
      : esc(one.peerName || '对方') + ' 寄来';
    return '<li><button type="button" class="letter-card" data-id="' + esc(one.id) + '" data-kind="' + it.kind + '">' +
      '<div class="lc-top">' +
        '<span class="lc-title">' + esc(one.title || '无题') + '</span>' +
        '<span class="lc-time">' + YM.util.formatMsgTime(one.createdAt) + '</span>' +
      '</div>' +
      '<div class="lc-excerpt">' + esc(excerpt(one.body)) + '</div>' +
      '<div class="lc-foot"><span>' + foot + '</span>' + dot(!one.read) + '</div>' +
      '</button></li>';
  }

  function render() {
    var d = YM.store.get();
    var all = letters(d);
    var items;
    var emptyT;
    var emptyS;

    if (seg === 'out') {
      items = all.filter(function (l) { return l.role === 'user'; })
        .map(function (l) { return { kind: 'out', id: l.id, at: l.createdAt, l: l }; });
      emptyT = '还没有寄出过信';
      emptyS = '右上角写一封，交给时间送出去。';
    } else if (seg === 'in') {
      items = [];
      all.forEach(function (l) {
        if (l.role !== 'user') return;
        var r = replyOf(d, l.id);
        if (r) items.push({ kind: 'in', id: l.id, at: r.createdAt, l: l, r: r });
      });
      emptyT = '还没有收到回信';
      emptyS = '先写一封寄出去，回信会落回这一格。';
    } else {
      items = all.filter(function (l) { return l.role === 'peer' && !l.replyTo; })
        .map(function (l) { return { kind: 'drift', id: l.id, at: l.createdAt, l: l }; });
      emptyT = '时空里还没有来信';
      emptyS = '有些信不是等来的，TA 会先写给你。';
    }

    items.sort(function (a, b) { return (b.at || 0) - (a.at || 0); });

    if (!items.length) {
      listEl.innerHTML = '';
      emptyTitle.textContent = emptyT;
      emptySub.textContent = emptyS;
      emptyEl.classList.remove('hide');
      return;
    }
    emptyEl.classList.add('hide');
    listEl.innerHTML = items.map(cardHtml).join('');
  }

  /* ---------- 读信 ---------- */
  function bodyHtml(text) {
    return String(text || '').split('\n').filter(function (x) { return x.trim(); })
      .map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('');
  }

  /* 信纸角落那朵栀子：五瓣线描 + 一枝一叶 */
  var BLOOM =
    '<svg class="lp-bloom" viewBox="0 0 64 72" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">' +
        '<g transform="translate(31 25)">' +
          '<g transform="rotate(0)"><ellipse cx="0" cy="-11" rx="8" ry="10.5"/></g>' +
          '<g transform="rotate(72)"><ellipse cx="0" cy="-11" rx="8" ry="10.5"/></g>' +
          '<g transform="rotate(144)"><ellipse cx="0" cy="-11" rx="8" ry="10.5"/></g>' +
          '<g transform="rotate(216)"><ellipse cx="0" cy="-11" rx="8" ry="10.5"/></g>' +
          '<g transform="rotate(288)"><ellipse cx="0" cy="-11" rx="8" ry="10.5"/></g>' +
          '<circle cx="0" cy="0" r="3.4" opacity="0.5"/>' +
        '</g>' +
        '<path d="M31 38c0 10 2 16 2 24" opacity="0.55"/>' +
        '<path d="M33 49c7-3 12 3 11 10-6 1-10-2-11-10z" opacity="0.7"/>' +
        '<path d="M31 58c-6-2-10 2-10 8 5 1 9-1 10-8z" opacity="0.55"/>' +
      '</g>' +
    '</svg>';

  // 信纸上的时间写全：2026年11月12日 17:20
  function fullStamp(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 ' +
      YM.util.pad2(d.getHours()) + ':' + YM.util.pad2(d.getMinutes());
  }

  function paperHtml(l) {
    return '<div class="letter-paper">' + BLOOM +
      '<div class="lp-sheet">' +
        '<div class="lp-head">' +
          '<span class="lp-to">' + (l.role === 'user' ? '写给 ' + esc(l.peerName || '对方') : esc(l.peerName || '对方') + ' 寄来') + '</span>' +
          '<span class="lp-date">' + fullStamp(l.createdAt) + '</span>' +
        '</div>' +
        '<h3 class="lp-title">' + esc(l.title || '无题') + '</h3>' +
        '<div class="lp-body">' + bodyHtml(l.body) + '</div>' +
        '<div class="lp-sign">' + (l.role === 'user' ? '我' : esc(l.peerName || '对方')) + '<br>' +
          fullStamp(l.createdAt) + '</div>' +
      '</div>' +
    '</div>';
  }

  function openSheet(headLabel, bodyInner, id, kind, markIds) {
    YM.ui.sheet(function (sheet, close) {
      sheet.classList.add('is-full');
      sheet.innerHTML =
        '<div class="fs-head"><h2 class="sheet-title">' + headLabel + '</h2>' +
          '<div class="lt-head-acts">' +
            '<button type="button" class="fs-close" id="ltDel">删除</button>' +
            '<button type="button" class="fs-close" id="ltClose">关闭</button>' +
          '</div></div>' +
        '<div class="fs-body">' + bodyInner + '</div>';

      sheet.querySelector('#ltClose').onclick = close;
      sheet.querySelector('#ltDel').onclick = function () {
        deleteLetter(id, function () { close(); }, kind);
      };

      var need = (markIds || []).filter(function (mid) {
        return !(letters(YM.store.get()).filter(function (x) { return x.id === mid; })[0] || {}).read;
      });
      if (need.length) {
        saveAll(function (dd) {
          letters(dd).forEach(function (x) { if (need.indexOf(x.id) >= 0) x.read = true; });
          return dd;
        });
        render();
      }
    });
  }

  function openLetter(id) {
    var d = YM.store.get();
    var l = letters(d).filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    openSheet('信', paperHtml(l), id, 'one', [id]);
  }

  // 收到：我的信在最上，回信接在下面
  function openThread(uid) {
    var d = YM.store.get();
    var u = letters(d).filter(function (x) { return x.id === uid; })[0];
    var r = replyOf(d, uid);
    if (!u) return;
    var inner = '<div class="letter-thread">' + paperHtml(u) + (r ? paperHtml(r) : '') + '</div>';
    openSheet('一来一回', inner, uid, 'in', r ? [r.id] : []);
  }

  /* ---------- 写信 ---------- */
  var CARET =
    '<svg class="lt-caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M3 4.6l3 3 3-3"/></svg>';

  function roleNames() {
    return dmSessions(YM.store.get()).map(function (sn) { return sn.name || '未命名会话'; });
  }

  function openWrite() {
    var who = peerName();

    YM.ui.sheet(function (sheet, close) {
      sheet.classList.add('is-full');
      sheet.innerHTML =
        '<div class="fs-head"><div class="sheet-title lt-head">' +
          '<span>写给</span>' +
          '<button type="button" class="lt-to" id="ltTo">' +
            '<span id="ltToName">' + esc(who) + '</span>' + CARET +
          '</button>' +
        '</div>' +
          '<button type="button" class="fs-close" id="ltCancel">关闭</button></div>' +
        '<div class="fs-body">' +
          '<div class="letter-paper lw-paper">' + BLOOM +
          '<div class="lp-sheet lw-sheet">' +
            '<div class="lw-field">' +
              '<div class="lw-label">标题</div>' +
              '<input class="lw-input" id="ltTitle" maxlength="24" placeholder="不加标题也行" autocomplete="off">' +
            '</div>' +
            '<textarea class="lw-body" id="ltBody" maxlength="1200" placeholder="写点什么…"></textarea>' +
            '<div class="lw-foot-hint">写完封好，信会自己走到对方手里。</div>' +
          '</div>' +
          '</div>' +
        '</div>' +
        '<div class="fs-foot"><div class="sheet-actions">' +
          '<button type="button" class="btn btn-ghost" id="ltSave">取消</button>' +
          '<button type="button" class="btn" id="ltSend">封好寄出</button>' +
        '</div></div>';

      var titleEl = sheet.querySelector('#ltTitle');
      var bodyEl = sheet.querySelector('#ltBody');
      var toBtn = sheet.querySelector('#ltTo');
      var toName = sheet.querySelector('#ltToName');

      /* 写给谁：会话列表里的角色，点开自绘下拉 */
      var names = roleNames();
      if (!names.length) names = [who];

      var menu = document.createElement('div');
      menu.className = 'lt-menu';
      menu.hidden = true;
      menu.innerHTML = names.map(function (n) {
        return '<button type="button" class="lt-opt' + (n === who ? ' is-on' : '') + '" data-name="' + esc(n) + '">' +
          '<span>' + esc(n) + '</span><i></i></button>';
      }).join('');
      sheet.querySelector('.fs-head').appendChild(menu);

      toBtn.onclick = function (e) {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
      };

      menu.onclick = function (e) {
        var opt = e.target.closest('.lt-opt');
        if (!opt) return;
        who = opt.getAttribute('data-name');
        toName.textContent = who;
        Array.prototype.forEach.call(menu.querySelectorAll('.lt-opt'), function (b) {
          b.classList.toggle('is-on', b === opt);
        });
        menu.hidden = true;
      };

      sheet.addEventListener('click', function (e) {
        if (!menu.hidden && !e.target.closest('.lt-menu') && !e.target.closest('#ltTo')) menu.hidden = true;
      });

      sheet.querySelector('#ltCancel').onclick = close;
      sheet.querySelector('#ltSave').onclick = close;

      sheet.querySelector('#ltSend').onclick = function () {
        var body = (bodyEl.value || '').trim();
        if (!body) { YM.ui.toast('信纸上还空着'); return; }
        var now = Date.now();
        pushLetter({
          id: YM.util.uid('l'),
          role: 'user',
          peerName: who,
          title: (titleEl.value || '').trim() || '无题',
          body: body,
          createdAt: now,
          read: true,
          replyAt: now + YM.util.randInt(4000, 12000),
          replied: false
        });
        close();
        setSeg('out');
        YM.ui.toast('信已寄出');
        tick();
      };
    });
  }

  /* ---------- 启动 ---------- */
  function setSeg(next) {
    if (seg === next) return;
    seg = next;
    Array.prototype.forEach.call(segEl.querySelectorAll('.seg-item'), function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-seg') === seg ? 'true' : 'false');
    });
    render();
  }

  segEl.addEventListener('click', function (e) {
    var b = e.target.closest('.seg-item');
    if (b) setSeg(b.getAttribute('data-seg'));
  });

  listEl.addEventListener('click', function (e) {
    if (suppressClick) { suppressClick = false; return; }
    var card = e.target.closest('.letter-card');
    if (!card) return;
    if (card.getAttribute('data-kind') === 'in') openThread(card.getAttribute('data-id'));
    else openLetter(card.getAttribute('data-id'));
  });

  /* ---------- 长按：删除这封信 ---------- */
  var pressTimer = null;
  var pressCard = null;
  var pressX = 0;
  var pressY = 0;
  var suppressClick = false;

  function dropPress() {
    if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
    pressCard = null;
  }

  function letterMenu(id, kind) {
    var d = YM.store.get();
    var l = letters(d).filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    YM.ui.actionSheet({
      title: '这封信',
      items: [{ label: '删除这封信', key: 'del' }]
    }).then(function (item) {
      if (!item || item.key !== 'del') return;
      deleteLetter(id, null, kind);
    });
  }

  function deleteLetter(id, after, kind) {
    var d = YM.store.get();
    var l = letters(d).filter(function (x) { return x.id === id; })[0];
    if (!l) return;
    YM.ui.confirm({
      title: '删除这封信',
      body: '《' + (l.title || '无题') + '》会从信袋里拿掉，删了就找不回来。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      saveAll(function (dd) {
        var drop = [id];
        if (kind === 'in') {
          letters(dd).forEach(function (x) { if (x.replyTo === id) drop.push(x.id); });
        }
        dd.letters = letters(dd).filter(function (x) { return drop.indexOf(x.id) < 0; });
        return dd;
      });
      render();
      YM.ui.toast('已删除');
      if (after) after();
    });
  }

  function startPress(e) {
    var card = e.target.closest('.letter-card');
    if (!card) return;
    var pt = e.touches && e.touches[0] ? e.touches[0] : e;
    dropPress();
    pressX = pt.clientX;
    pressY = pt.clientY;
    pressCard = card;
    pressTimer = setTimeout(function () {
      pressTimer = null;
      var id = card.getAttribute('data-id');
      var kind = card.getAttribute('data-kind');
      pressCard = null;
      suppressClick = true;
      letterMenu(id, kind);
    }, 450);
  }

  function movePress(e) {
    if (!pressCard) return;
    var pt = e.touches && e.touches[0] ? e.touches[0] : e;
    if (Math.abs(pt.clientX - pressX) > 8 || Math.abs(pt.clientY - pressY) > 8) dropPress();
  }

  listEl.addEventListener('touchstart', startPress, { passive: true });
  listEl.addEventListener('touchmove', movePress, { passive: true });
  listEl.addEventListener('touchend', dropPress);
  listEl.addEventListener('touchcancel', dropPress);
  listEl.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;
    startPress(e);
  });
  listEl.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    movePress(e);
  });
  listEl.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'touch') return;
    dropPress();
  });
  listEl.addEventListener('pointercancel', dropPress);
  listEl.addEventListener('pointerleave', dropPress);
  listEl.addEventListener('contextmenu', function (e) {
    var card = e.target.closest('.letter-card');
    if (!card) return;
    e.preventDefault();
    suppressClick = true;
    letterMenu(card.getAttribute('data-id'), card.getAttribute('data-kind'));
  });

  writeBtn.addEventListener('click', openWrite);

  if (linkOld(YM.store.get())) {
    saveAll(function (dd) { linkOld(dd); return dd; });
  }

  render();
  tick();
  rollDrift();
  setInterval(function () { tick(); rollDrift(); }, 1500);
})();
