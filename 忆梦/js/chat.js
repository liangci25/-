/* ============================================================
   忆梦 · chat.js（聊天页）
   依赖：window.YM（common.js）
   ============================================================ */
(function () {
  'use strict';

  var sid = YM.util.qs('sid');
  if (!sid) {
    location.replace('sessions.html');
    return;
  }

  var chatScroll = document.getElementById('chatScroll');
  var msgList = document.getElementById('msgList');
  var chatTitle = document.getElementById('chatTitle');
  var navEcg = document.getElementById('navEcg');
  var chatStatus = document.getElementById('chatStatus');
  var inputMsg = document.getElementById('inputMsg');
  var btnPlus = document.getElementById('btnPlus');
  var plusPanel = document.getElementById('plusPanel');
  var btnSend = document.getElementById('btnSend');
  var quoteBar = document.getElementById('quoteBar');
  var quoteTextEl = document.getElementById('quoteText');
  var msgToolbar = document.getElementById('msgToolbar');
  var mtFavEl = document.getElementById('mtFav');
  var callMask = document.getElementById('callMask');
  var callView = document.getElementById('callView');
  var callBack = document.getElementById('callBack');
  var callFab = document.getElementById('callFab');
  var callFaces = document.getElementById('callFaces');
  var cfAvatar = document.getElementById('cfAvatar');
  var cfTime = document.getElementById('cfTime');
  var callStatus = document.getElementById('callStatus');
  var callAvatar = document.getElementById('callAvatar');
  var callBg = document.getElementById('callBg');
  var callMute = document.getElementById('callMute');
  var callMuteText = document.getElementById('callMuteText');
  var callHang = document.getElementById('callHang');
  var callHangText = document.getElementById('callHangText');
  var callAnswer = document.getElementById('callAnswer');
  var chatBg = document.getElementById('chatBg');

  var selectedId = null;
  var quoteId = null;
  var toolbarId = null;
  var statusTimer = null;
  var callBackTimer = null;
  var formTimer = null;
  var pollTimer = null;
  var buddyTimer = null;
  var moneyTimer = null;

  /* ---------- 基础 ---------- */
  function session() {
    return YM.findSession(YM.store.get(), sid);
  }

  function markLastUserRead(sn) {
    for (var i = sn.messages.length - 1; i >= 0; i--) {
      if (sn.messages[i].role === 'user') {
        sn.messages[i].readStatus = 'read';
        return;
      }
    }
  }

  function findMsg(sn, id) {
    for (var i = 0; i < sn.messages.length; i++) {
      if (sn.messages[i].id === id) return sn.messages[i];
    }
    return null;
  }

  function nearBottom() {
    return chatScroll.scrollHeight - chatScroll.scrollTop - chatScroll.clientHeight < 150;
  }

  function scrollBottom(smooth) {
    chatScroll.scrollTo({
      top: chatScroll.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  /* ---------- 渲染 ---------- */
  function escape(s) { return YM.util.escapeHtml(s); }

  function readMarkHtml(style) {
    if (style === 'dot') return '<span class="read-dot"></span>';
    if (style === 'doublecheck') {
      return '<span class="read-checks" aria-label="已读">' +
        '<svg viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
        '<path d="M1.5 6.4l3 3.2 6-7"/><path d="M8.6 9.2l.9.9 6.4-7"/></svg></span>';
    }
    return '<span class="read-mark">已读</span>';
  }

  function quoteHtml(m, sn) {
    if (!m.quotedMessageId) return '';
    var q = findMsg(sn, m.quotedMessageId);
    var text = q ? q.text : '消息已删除';
    return '<div class="quote"><span class="quote-line"></span><span class="quote-text">' +
      escape(text) + '</span></div>';
  }

  /* ---------- 红包 / 转账 ---------- */
  var MONEY_NOTE = { packet: '我的思念那么深', transfer: '转账给你' };

  var MONEY_ICON = {
    packet:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">' +
      '<g transform="translate(12 12.4)">' +
        '<path d="M0 -3.1 C-2.7 -4.6 -3.1 -8.4 0 -8.6 C3.1 -8.4 2.7 -4.6 0 -3.1" transform="rotate(0)"/>' +
        '<path d="M0 -3.1 C-2.7 -4.6 -3.1 -8.4 0 -8.6 C3.1 -8.4 2.7 -4.6 0 -3.1" transform="rotate(72)"/>' +
        '<path d="M0 -3.1 C-2.7 -4.6 -3.1 -8.4 0 -8.6 C3.1 -8.4 2.7 -4.6 0 -3.1" transform="rotate(144)"/>' +
        '<path d="M0 -3.1 C-2.7 -4.6 -3.1 -8.4 0 -8.6 C3.1 -8.4 2.7 -4.6 0 -3.1" transform="rotate(216)"/>' +
        '<path d="M0 -3.1 C-2.7 -4.6 -3.1 -8.4 0 -8.6 C3.1 -8.4 2.7 -4.6 0 -3.1" transform="rotate(288)"/>' +
        '<circle cx="0" cy="0" r="1.25"/>' +
      '</g></svg>',
    transfer:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
      '<path d="M4.6 8.4h12.4"/><path d="M14 5.4l3 3-3 3"/>' +
      '<path d="M19.4 15.6H7"/><path d="M10 12.6l-3 3 3 3"/></svg>'
  };

  function moneyText(n) {
    var v = Math.round(Number(n) * 100) / 100;
    if (!v || v <= 0) return '¥0';
    return '¥' + (v % 1 === 0 ? String(v) : v.toFixed(2));
  }

  function moneyKind(m) {
    return m.kind === 'transfer' ? 'transfer' : (m.kind === 'packet' ? 'packet' : '');
  }

  // 我点开别人的红包才是「要不要领」；我发出去的那个，等 TA 自己接住或者退回来
  function moneyCardHtml(m) {
    var kind = moneyKind(m);
    var mine = m.role !== 'peer';
    var claimed = !!m.claimed;
    var refunded = !!m.refunded;
    var state;
    if (mine) {
      state = refunded ? '已退还' : (claimed ? '已领取' : '待领取');
    } else if (refunded) {
      state = '已退还';
    } else {
      state = claimed ? (kind === 'transfer' ? '已收款' : '已领取') : (kind === 'packet' ? '领取' : '收款');
    }
    return '<button type="button" class="money-card ' + kind +
      ((claimed || refunded) ? ' is-claimed' : '') +
      (refunded ? ' is-refunded' : '') + '"' +
      ' data-money="' + escape(m.id) + '">' +
      '<span class="mc-ico">' + MONEY_ICON[kind] + '</span>' +
      '<span class="mc-body">' +
        '<span class="mc-amount">' + escape(moneyText(m.amount)) + '</span>' +
        '<span class="mc-note">' + escape(m.note || MONEY_NOTE[kind]) + '</span>' +
        '<span class="mc-state">' + state + '</span>' +
      '</span>' +
    '</button>';
  }

  /* ---------- 问卷 ---------- */
  var FORM_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
    '<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8 9h8M8 13h5.5"/>' +
    '<path d="M8 16.6l1.4 1.4 2.4-2.4"/></svg>';

  function isForm(m) {
    return m.kind === 'form' && m.form && m.form.length > 0;
  }

  // 出题时就把答案定下来，到点才显示，关掉页面再回来也不会丢
  function answerForm(form) {
    return form.map(function (q) {
      return YM.util.randInt(0, q.options.length - 1);
    });
  }

  function formCardHtml(m) {
    var answers = m.answers || [];
    var pending = !!m.answeredAt && Date.now() < m.answeredAt;
    var items = m.form.map(function (q, qi) {
      var opts = q.options.map(function (o, oi) {
        var pick = !pending && answers[qi] === oi;
        return '<span class="fc-opt' + (pick ? ' is-pick' : '') + '">' +
          '<span class="fc-dot"></span>' + escape(o) + '</span>';
      }).join('');
      return '<div class="fc-item"><span class="fc-no">' + (qi + 1) + '</span>' +
        '<span class="fc-text">' + escape(q.text) + '</span></div>' +
        '<div class="fc-opts">' + opts + '</div>';
    }).join('');

    return '<div class="form-card' + (pending ? ' is-pending' : '') + '" data-form="' + escape(m.id) + '">' +
      '<div class="fc-head">' +
        '<span class="fc-ico">' + FORM_ICON + '</span>' +
        '<span class="fc-name">问卷</span>' +
        '<span class="fc-state">' + (pending ? '待填写' : '已填写') + '</span>' +
      '</div>' +
      '<div class="fc-body">' + items + '</div>' +
    '</div>';
  }

  /* ---------- 投票（群聊里替掉问卷） ---------- */
  var POLL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
    '<path d="M5 19.5V9.5M12 19.5V4.5M19 19.5v-7"/></svg>';

  var POLL_MAX_OPT = 4;

  function isPoll(m) {
    return m.kind === 'poll' && m.poll && Array.isArray(m.poll.options) && m.poll.options.length > 1;
  }

  function pollSeats(sn) {
    return 1 + ((sn && sn.params && sn.params.memberIds) || []).length;
  }

  function pollCounts(m) {
    var votes = m.votes || {};
    var out = m.poll.options.map(function () { return 0; });
    Object.keys(votes).forEach(function (k) {
      var i = votes[k];
      if (typeof i === 'number' && out[i] != null) out[i] += 1;
    });
    return out;
  }

  function pollCardHtml(m, sn) {
    var counts = pollCounts(m);
    var total = counts.reduce(function (a, b) { return a + b; }, 0);
    var mine = (m.votes || {}).me;
    var seats = pollSeats(sn);
    var rows = m.poll.options.map(function (o, i) {
      var pct = total ? Math.round(counts[i] / total * 100) : 0;
      return '<div class="pc-opt' + (mine === i ? ' is-mine' : '') + '" data-vote="' + i + '">' +
        '<span class="pc-o-dot"></span>' +
        '<span class="pc-o-text">' + escape(o) + '</span>' +
        '<span class="pc-o-num">' + counts[i] + '</span>' +
        '<span class="pc-bar"><span class="pc-fill" style="width:' + pct + '%"></span></span>' +
      '</div>';
    }).join('');

    return '<div class="poll-card" data-poll="' + escape(m.id) + '">' +
      '<div class="pc-head">' +
        '<span class="pc-ico">' + POLL_ICON + '</span>' +
        '<span class="pc-name">投票</span>' +
        '<span class="pc-state">' + total + '/' + seats + ' 票</span>' +
      '</div>' +
      '<div class="pc-q">' + escape(m.poll.q) + '</div>' +
      '<div class="pc-opts">' + rows + '</div>' +
      (typeof mine === 'number' ? '' : '<div class="pc-hint">点一项，投出你这一票</div>') +
    '</div>';
  }

  function votePoll(mid, idx) {
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      var m = sn.messages.filter(function (x) { return x.id === mid; })[0];
      if (!m || !isPoll(m)) return;
      if (!m.votes) m.votes = {};
      m.votes.me = idx;
    }, 'messages');
    render();
  }

  /* ---------- 陪伴邀请（共鉴四类落到会话里的卡片） ---------- */
  var BUDDY_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="8.4" cy="9" r="2.6"/><circle cx="16" cy="9.4" r="2.1"/>' +
    '<path d="M3.4 18.6c0-2.6 2.2-4.6 5-4.6s5 2 5 4.6"/><path d="M14.2 14.7c2.4.3 4 2 4 4"/></svg>';

  function isBuddy(m) {
    return m.kind === 'buddy' && m.buddy && m.buddy.kind;
  }

  // 答应之后把「这一类的陪伴」记到共鉴页的数据里
  function markBuddy(d, m) {
    if (!d.mirror) d.mirror = {};
    if (!d.mirror.pals) d.mirror.pals = {};
    var k = YM.util.dayKey(Date.now());
    if (!d.mirror.pals[k]) d.mirror.pals[k] = {};
    var who = m.buddy.memberId || m.memberId;
    if (who) {
      var cur = d.mirror.pals[k][m.buddy.kind];
      var arr = Array.isArray(cur) ? cur.slice() : (cur ? [cur] : []);
      if (arr.indexOf(who) < 0) arr.push(who);
      d.mirror.pals[k][m.buddy.kind] = arr;
    }
  }

  function buddyStateText(st) {
    if (st === 'accepted') return '接受了';
    if (st === 'declined') return '没答应';
    return '等待回应';
  }

  function buddyPeerName(m) {
    if (m.memberName) return m.memberName;
    if (m.buddy.memberName) return m.buddy.memberName;
    var d = YM.store.get() || {};
    var list = d.members || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].id === m.buddy.memberId) return list[i].name || '';
    }
    return 'TA';
  }

  function buddyCardHtml(m) {
    var dir = m.buddy.dir === 'in' ? 'in' : 'out';
    var st = m.state || 'pending';
    var name = escape(m.buddy.name || '');
    var who = buddyPeerName(m);
    var line = dir === 'in'
      ? escape(who) + ' 想陪你' + name
      : '你在请 ' + escape(who) + ' 陪你' + name;
    var acts = (dir === 'in' && st === 'pending')
      ? '<div class="bc-acts">' +
        '<button class="bc-btn" type="button" data-buddy="yes" data-mid="' + escape(m.id) + '">接受</button>' +
        '<button class="bc-btn is-mute" type="button" data-buddy="no" data-mid="' + escape(m.id) + '">拒绝</button>' +
        '</div>'
      : '';
    return '<div class="buddy-card' + (st === 'pending' ? ' is-pending' : '') + '" data-buddy-card="' + escape(m.id) + '">' +
      '<div class="bc-head">' +
      '<span class="bc-ico">' + BUDDY_ICON + '</span>' +
      '<span class="bc-name">陪伴</span>' +
      '<span class="bc-state">' + buddyStateText(st) + '</span>' +
      '</div>' +
      '<div class="bc-line">' + line + '</div>' +
      acts +
      '</div>';
  }

  // 我点「接受 / 拒绝」回应角色的邀请
  function answerBuddy(mid, yes) {
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      sn.messages.forEach(function (m) {
        if (m.id !== mid || !isBuddy(m)) return;
        if ((m.state || 'pending') !== 'pending') return;
        m.state = yes ? 'accepted' : 'declined';
        m.decidedAt = Date.now();
        if (yes) markBuddy(d, m);
      });
    }, 'all');
    render();
  }

  // 我发出的邀请，过几秒由 TA 给出答复
  function tickBuddy() {
    var sn = session();
    if (!sn) return;
    var now = Date.now();
    var due = sn.messages.filter(function (m) {
      return isBuddy(m) && (m.state || 'pending') === 'pending' &&
        m.buddy.dir === 'out' && m.buddy.dueAt && m.buddy.dueAt <= now;
    });
    if (!due.length) return;
    YM.store.update(function (d) {
      var s2 = YM.findSession(d, sid);
      if (!s2) return;
      s2.messages.forEach(function (m) {
        if (!isBuddy(m) || (m.state || 'pending') !== 'pending' || m.buddy.dir !== 'out') return;
        if (!m.buddy.dueAt || m.buddy.dueAt > Date.now()) return;
        var yes = Math.random() < 0.7;
        m.state = yes ? 'accepted' : 'declined';
        m.decidedAt = Date.now();
        if (yes) markBuddy(d, m);
      });
    }, 'all');
    render();
  }

  // 我发出去的红包：过几秒由 TA 决定收下还是退回来；谁发的都一样，放着 24 小时没人领就原路退回
  var MONEY_EXPIRE = 24 * 60 * 60 * 1000;

  function tickMoney() {
    var sn = session();
    if (!sn) return;
    var now = Date.now();
    var due = sn.messages.filter(function (m) {
      if (!moneyKind(m) || m.claimed || m.refunded) return false;
      if (now - (m.createdAt || 0) >= MONEY_EXPIRE) return true;
      return m.role !== 'peer' && m.moneyDueAt && m.moneyDueAt <= now;
    });
    if (!due.length) return;
    YM.store.update(function (d) {
      var s2 = YM.findSession(d, sid);
      if (!s2) return;
      var now2 = Date.now();
      s2.messages.forEach(function (m) {
        if (!moneyKind(m) || m.claimed || m.refunded) return;
        if (now2 - (m.createdAt || 0) >= MONEY_EXPIRE) { m.refunded = true; return; }
        if (m.role === 'peer') return;
        if (!m.moneyDueAt || m.moneyDueAt > now2) return;
        if (m.moneyAnswer === 'back') m.refunded = true;
        else m.claimed = true;
      }, 'messages');
    }, 'messages');
    render();
  }

  // 发起投票之后，群里的人陆续投票；到点还没投的按仓位补上
  function tickPolls() {
    var sn = session();
    if (!sn) return;
    var group = !!(sn.params.groupEnabled && sn.params.memberIds.length >= 2);
    if (!group) return;
    var now = Date.now();
    var due = sn.messages.filter(function (m) {
      return isPoll(m) && m.pollDueAt && m.pollDueAt <= now && !m.pollSettled;
    });
    if (!due.length) return;
    YM.store.update(function (dd) {
      var s2 = YM.findSession(dd, sid);
      if (!s2) return;
      var muted = s2.params.muted || {};
      var ids = (s2.params.memberIds || []).filter(function (mid) { return !muted[mid]; });
      var t = Date.now();
      s2.messages.forEach(function (m) {
        if (!isPoll(m) || !m.pollDueAt || m.pollDueAt > t) return;
        if (!m.votes) m.votes = {};
        ids.forEach(function (mid) {
          if (typeof m.votes[mid] !== 'number') {
            m.votes[mid] = YM.util.randInt(0, m.poll.options.length - 1);
          }
        });
        m.pollSettled = true;
      });
    }, 'messages');
    render();
  }

  function openPollSheet() {
    if (plusPanel.classList.contains('is-open')) togglePanel(false);

    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title">投票</h3>' +
        '<p class="sheet-sub">群里每人一票，投完当场看结果</p>' +
        '<div class="form-stack">' +
          '<div class="field"><input id="pollQ" type="text" maxlength="20" placeholder="投票问什么" autocomplete="off"></div>' +
          '<div class="form-opts" id="pollOpts"></div>' +
          '<button type="button" class="form-add form-add-opt" id="pollAddOpt">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
            '<path d="M12 6v12M6 12h12"/></svg><span>加一个选项</span>' +
          '</button>' +
        '</div>' +
        '<div class="sheet-actions">' +
          '<button type="button" class="btn btn-ghost" id="pollCancel">取消</button>' +
          '<button type="button" class="btn btn-primary" id="pollOk">发起投票</button>' +
        '</div>';

      var qEl = sheet.querySelector('#pollQ');
      var boxEl = sheet.querySelector('#pollOpts');

      function optRow(v) {
        var row = document.createElement('div');
        row.className = 'form-opt';
        row.innerHTML =
          '<span class="fc-dot"></span>' +
          '<input type="text" maxlength="12" placeholder="选项" autocomplete="off">' +
          '<button type="button" class="form-del" data-del="opt" aria-label="删掉这个选项">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' +
          '</button>';
        row.querySelector('input').value = v || '';
        row.querySelector('[data-del="opt"]').addEventListener('click', function () {
          if (boxEl.querySelectorAll('.form-opt').length <= 2) { YM.ui.toast('至少留两个选项'); return; }
          row.remove();
        });
        return row;
      }

      boxEl.appendChild(optRow(''));
      boxEl.appendChild(optRow(''));

      sheet.querySelector('#pollAddOpt').addEventListener('click', function () {
        if (boxEl.querySelectorAll('.form-opt').length >= POLL_MAX_OPT) {
          YM.ui.toast('最多 ' + POLL_MAX_OPT + ' 个选项');
          return;
        }
        var r = optRow('');
        boxEl.appendChild(r);
        r.querySelector('input').focus();
      });

      sheet.querySelector('#pollCancel').addEventListener('click', function () { close(); });

      sheet.querySelector('#pollOk').addEventListener('click', function () {
        var q = (qEl.value || '').trim();
        if (!q) { YM.ui.toast('先写一句投票的事'); qEl.focus(); return; }
        var options = [];
        Array.prototype.forEach.call(boxEl.querySelectorAll('.form-opt input'), function (inp) {
          var v = (inp.value || '').trim();
          if (v) options.push(v.slice(0, 12));
        });
        if (options.length < 2) { YM.ui.toast('至少写两个选项'); return; }

        close();
        YM.store.update(function (d) {
          var sn = YM.findSession(d, sid);
          if (!sn) return;
          sn.messages.push({
            id: YM.util.uid('msg'),
            role: 'user',
            kind: 'poll',
            poll: { q: q.slice(0, 20), options: options },
            votes: {},
            pollDueAt: Date.now() + 2500 + YM.util.randInt(2, 5) * 1000,
            text: '投票 · ' + options.length + ' 个选项',
            createdAt: Date.now(),
            readStatus: null,
            memberId: null,
            memberName: '',
            memberAvatar: '',
            quotedMessageId: null,
            mergedParts: null,
            triggerId: null
          });
          sn.updatedAt = Date.now();
        }, 'messages');
        YM.sound.play('user');
        render();
        scrollBottom(true);
        YM.ui.toast('投票发出了');
      });
    });
  }

  /* ---------- 视频通话（模拟画面，不调用摄像头） ---------- */
  var CALL_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
    '<rect x="3" y="6" width="12" height="12" rx="2.5"/><path d="M15.5 11.2l4.2-2.6v6.8l-4.2-2.6z"/></svg>';

  var callTimer = null;
  var callNoTimer = null;
  var callSeconds = 0;
  var callToken = 0;
  var callActive = false;
  var callConnected = false;
  var callDir = 'out';          // out = 我方拨出，in = 对方打来
  var callMember = null;        // 群聊里第一位接起来的成员（记录卡 / 小窗用）
  var callJoiners = [];         // 群聊里已经接起来的成员

  function durText(sec) {
    return YM.util.pad2(Math.floor(sec / 60)) + ':' + YM.util.pad2(sec % 60);
  }

  function callCardHtml(m) {
    var tail = String(m.text || '').replace(/^视频通话\s*·\s*/, '');
    return '<div class="call-card">' +
      '<span class="cc-ico">' + CALL_ICON + '</span>' +
      '<span class="cc-text">' + escape(tail) + '</span>' +
    '</div>';
  }

  /* 群聊里随机挑几位成员接起来（2~3 位，人不够就全接）；单聊返回空数组 */
  function pickCallJoiners(sn) {
    var pr = sn.params || {};
    if (!pr.groupEnabled || (pr.memberIds || []).length < 2) return [];
    var d = YM.store.get();
    var muted = pr.muted || {};
    var list = (pr.memberIds || []).map(function (id) {
      return (d.members || []).filter(function (m) { return m.id === id; })[0];
    }).filter(function (m) { return m && !muted[m.id]; });
    if (!list.length) return [];
    var n = Math.min(list.length, YM.util.randInt(2, 3));
    return YM.util.shuffle(list).slice(0, n).map(function (m) {
      return { id: m.id, name: m.name, avatar: m.avatar || '' };
    });
  }

  /* 舞台：一位接起来用大圆头像，两三位就排一排头像 */
  function paintCallFaces(sn) {
    if (!callJoiners.length) {
      callFaces.hidden = true;
      callAvatar.hidden = false;
      callAvatar.style.display = '';
      paintCallFace(sn);
      return;
    }
    callMember = callJoiners[0];
    paintCallFace(sn);
    callAvatar.hidden = true;
    callAvatar.style.display = 'none';
    callFaces.hidden = false;
    callFaces.innerHTML = callJoiners.map(function (f) {
      return '<span class="call-face' + (f.avatar ? ' has-img' : '') + '"' +
        (f.avatar ? ' style="background-image:url(\'' + String(f.avatar).replace(/'/g, '%27') + '\')"' : '') + '>' +
        (f.avatar ? '' : escape(YM.avatarText(f.name))) + '</span>';
    }).join('');
  }

  /* 通话页的人脸：有头像铺图，没头像落一个字 */
  function paintCallFace(sn) {
    var face = callMember || { name: sn.name, avatar: sn.avatar || '' };
    callAvatar.textContent = '';
    callAvatar.classList.remove('has-img');
    callBg.classList.remove('has-img');
    cfAvatar.classList.remove('has-img');
    if (face.avatar) {
      callAvatar.style.backgroundImage = "url('" + String(face.avatar).replace(/'/g, '%27') + "')";
      callAvatar.classList.add('has-img');
      callBg.style.backgroundImage = "url('" + String(face.avatar).replace(/'/g, '%27') + "')";
      callBg.classList.add('has-img');
      cfAvatar.style.backgroundImage = "url('" + String(face.avatar).replace(/'/g, '%27') + "')";
      cfAvatar.classList.add('has-img');
      cfAvatar.textContent = '';
    } else {
      callAvatar.style.backgroundImage = '';
      callBg.style.backgroundImage = '';
      callAvatar.textContent = YM.avatarText(face.name || '对');
      cfAvatar.style.backgroundImage = '';
      cfAvatar.textContent = YM.avatarText(face.name || '对');
    }
  }

  /* 按钮组随状态换：来电响铃 → 拒绝 / 接听；拨出 → 静音 / 取消；通话中 → 静音 / 挂断 */
  function setCallButtons(state) {
    callAnswer.hidden = state !== 'ring-in';
    callMute.hidden = state === 'ring-in' || state === 'ring-out';
    callBack.hidden = state !== 'talking';
    callHangText.textContent = state === 'ring-in' ? '拒绝' : (state === 'ring-out' ? '取消' : '挂断');
    callMask.classList.toggle('is-incoming', state === 'ring-in');
  }

  function stopCallTimers() {
    if (callTimer) { clearInterval(callTimer); callTimer = null; }
    if (callNoTimer) { clearTimeout(callNoTimer); callNoTimer = null; }
  }

  function prepareCall(sn, dir, text) {
    stopCallTimers();
    callToken++;
    callSeconds = 0;
    callConnected = false;
    callActive = true;
    callDir = dir;
    callMember = null;
    callJoiners = [];
    callAvatar.hidden = false;
    callAvatar.style.display = '';
    callFaces.hidden = true;
    callFaces.innerHTML = '';
    callStatus.textContent = text;
    paintCallFace(sn);
    callMute.classList.remove('is-off');
    callMuteText.textContent = '静音';
    cfTime.textContent = '00:00';
    callFab.hidden = true;
    callMask.hidden = false;
  }

  function startTalking() {
    callConnected = true;
    var sn = session();
    if (sn && !callJoiners.length && !callMember) {
      callJoiners = pickCallJoiners(sn);
      if (callJoiners.length) paintCallFaces(sn);
    }
    callStatus.textContent = '通话中 00:00';
    setCallButtons('talking');
    YM.sound.play('peer');
    if (callTimer) clearInterval(callTimer);
    callTimer = setInterval(function () {
      callSeconds++;
      callStatus.textContent = '通话中 ' + durText(callSeconds);
      cfTime.textContent = durText(callSeconds);
    }, 1000);
  }

  /* 我方拨出：先响铃，对方可能接，也可能没人接 */
  function openCall() {
    if (plusPanel.classList.contains('is-open')) togglePanel(false);
    var sn = session();
    if (!sn) return;
    if (callActive) { resumeCall(); return; }
    prepareCall(sn, 'out', '正在呼叫…');
    setCallButtons('ring-out');
    YM.sound.unlock();

    var token = callToken;
    callNoTimer = setTimeout(function () {
      if (!callActive || token !== callToken) return;
      var r = Math.random();
      if (r < 0.65) startTalking();
      else if (r < 0.8) endCall('refused');
      else endCall('missed');
    }, 2400);
  }

  /* 对方主动打来：响铃，等接听 / 拒绝，长时间不理算无人接听 */
  function incomingCall() {
    var sn = session();
    if (!sn || callActive) return;
    var pr = sn.params || {};
    if (pr.groupEnabled && (pr.memberIds || []).length >= 2) return;
    prepareCall(sn, 'in', '邀请你视频通话');
    setCallButtons('ring-in');
    YM.sound.unlock();
    YM.sound.play('peer');
    var token = callToken;
    callNoTimer = setTimeout(function () {
      if (!callActive || token !== callToken) return;
      endCall('missed');
    }, 22000);
  }

  function acceptCall() {
    if (!callActive || callConnected || callDir !== 'in') return;
    if (callNoTimer) { clearTimeout(callNoTimer); callNoTimer = null; }
    startTalking();
  }

  /* 最小化：只在通话中有效，响铃阶段不藏 */
  function minimizeCall() {
    if (callMask.hidden || !callActive || !callConnected) return;
    callMask.hidden = true;
    callFab.hidden = false;
    cfTime.textContent = durText(callSeconds);
  }

  function resumeCall() {
    if (!callActive) return;
    callFab.hidden = true;
    callMask.hidden = false;
  }

  /* kind: hang 通话中挂断 / cancel 拨出后取消 / declined 拒接来电 / missed 无人接听 */
  function endCall(kind) {
    if (!callActive) return;
    var token = callToken;
    callActive = false;
    callToken++;
    stopCallTimers();

    var sec = callSeconds;
    var connected = callConnected;
    var dir = callDir;
    callSeconds = 0;
    callConnected = false;
    cfTime.textContent = '00:00';

    var inGroup = !!callMember;
    if (!connected) {
      callStatus.textContent = kind === 'missed'
        ? ((dir === 'out' && !inGroup) ? '对方暂时无人接听' : '无人接听')
        : (kind === 'refused' ? '对方已拒绝' : (kind === 'declined' ? '已拒绝' : '已取消'));
      setCallButtons('ending');
    }

    var text = null;
    if (connected) text = '视频通话 · ' + durText(sec);
    else if (kind === 'missed') text = '视频通话 · 无人接听';
    else if (kind === 'refused') text = '视频通话 · 对方已拒绝';
    else if (kind === 'declined') text = '视频通话 · 已拒绝';
    else if (kind === 'cancel') text = '视频通话 · 已取消';

    var who = dir === 'in' ? 'peer' : 'user';

    setTimeout(function () {
      if (!callMask.hidden && !callActive) {
        callMask.hidden = true;
        callFab.hidden = true;
      }
    }, token ? 1100 : 0);

    if (!text) return;
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      sn.messages.push({
        id: YM.util.uid('msg'),
        role: who,
        kind: 'call',
        text: text,
        duration: sec,
        createdAt: Date.now(),
        readStatus: null,
        memberId: callMember ? callMember.id : null,
        memberName: callMember ? callMember.name : '',
        memberAvatar: callMember ? callMember.avatar : '',
        quotedMessageId: null,
        mergedParts: null,
        triggerId: null
      });
      sn.updatedAt = Date.now();
    }, 'messages');
    callMember = null;
    callJoiners = [];
    render();
    scrollBottom(true);

    /* 我拨出去、对方没接上：过一会儿对方会回拨过来 */
    if (kind === 'missed' && dir === 'out') scheduleCallBack();
  }

  function scheduleCallBack() {
    if (callBackTimer) clearTimeout(callBackTimer);
    var delay = YM.util.randInt(20, 45) * 1000;
    callBackTimer = setTimeout(function () {
      callBackTimer = null;
      if (callActive || !callMask.hidden) return;
      incomingCall();
    }, delay);
  }

  function onHangClick() {
    if (!callActive) return;
    if (callConnected) { endCall('hang'); return; }
    endCall(callDir === 'in' ? 'declined' : 'cancel');
  }

  /* 角色可能自己打来：一天只摇一次概率（5%~8%），到点才响；到点判定在内核 YM.ring，这里负责把整屏来电层弹出来 */
  function maybeIncomingCall() {
    if (document.hidden || callActive || !callMask.hidden) return;
    var sn = session();
    if (!sn) return;
    var pr = sn.params || {};
    if (pr.groupEnabled && (pr.memberIds || []).length >= 2) return;
    incomingCall();
  }

  function toggleMute() {
    var off = callMute.classList.toggle('is-off');
    callMuteText.textContent = off ? '已静音' : '静音';
    YM.ui.toast(off ? '麦克风已静音' : '麦克风已打开');
  }

  /* ---------- 图片 / 视频消息 ---------- */
  function mediaSrc(m) {
    return (m.media && m.media.src) || '';
  }

  function mediaSize(m) {
    var w = (m.media && m.media.w) || 0;
    var h = (m.media && m.media.h) || 0;
    if (!w || !h) return { w: 196, h: 148 };
    var maxW = 196;
    var maxH = 260;
    var scale = Math.min(maxW / w, maxH / h, 1);
    return { w: Math.max(56, Math.round(w * scale)), h: Math.max(42, Math.round(h * scale)) };
  }

  function mediaBubbleHtml(m, isUser) {
    var src = mediaSrc(m);
    if (!src) {
      return '<div class="msg-bubble ' + (isUser ? 'user' : 'peer') + '">' + escape(m.text || '') + '</div>';
    }
    var size = mediaSize(m);
    var box = ' style="width:' + size.w + 'px;height:' + size.h + 'px"';
    if (m.kind === 'video') {
      return '<div class="msg-media is-video' + (isUser ? ' user' : ' peer') + '"' + box + '>' +
        '<video src="' + escape(src) + '" controls playsinline preload="metadata"></video>' +
      '</div>';
    }
    return '<button type="button" class="msg-media is-image' + (isUser ? ' user' : ' peer') + '"' + box +
      ' data-media="' + escape(src) + '"><img src="' + escape(src) + '" alt=""></button>';
  }

  function openMediaView(src) {
    if (!src) return;
    var wrap = document.createElement('div');
    wrap.className = 'media-view';
    wrap.innerHTML = '<img src="' + escape(src) + '" alt="">';
    document.body.appendChild(wrap);
    wrap.addEventListener('click', function () { wrap.remove(); });
  }

  function msgHtml(m, sn, s, d) {
    var isUser = m.role === 'user';
    var showAvatar = !!s.showAvatar;
    var group = !!(sn.params.groupEnabled && sn.params.memberIds.length >= 2);
    var showName = !isUser && s.showName && group;

    var who = null;
    if (isUser) {
      var me = (d && d.me) || {};
      who = { name: me.name || '我', avatar: me.avatar || '' };
    } else if (m.memberId) {
      who = { name: m.memberName || '成员', avatar: m.memberAvatar || '' };
    } else {
      who = { name: sn.name, avatar: sn.avatar };
    }

    var avatarHtml = showAvatar
      ? '<span class="avatar"' + (isUser ? ' data-me="1"' : '') + (who && who.avatar ? ' style="background-image:url(\'' + String(who.avatar).replace(/'/g, '%27') + '\')"' : '') + '>' +
        (who && who.avatar ? '' : escape(YM.avatarText(who && who.name))) + '</span>'
      : '';

    var nameHtml = showName
      ? '<span class="msg-name">' + escape(m.memberName || (who && who.name) || '') + '</span>'
      : '';

    var metaRead = (isUser && s.showReadStatus && m.readStatus === 'read') ? readMarkHtml(s.readStyle) : '';
    var hasMeta = !!(metaRead || s.showTimestamp);

    var bubbleHtml = (m.kind === 'image' || m.kind === 'video')
      ? mediaBubbleHtml(m, isUser)
      : (isBuddy(m)
        ? buddyCardHtml(m)
        : (moneyKind(m)
        ? moneyCardHtml(m)
        : (isPoll(m)
          ? pollCardHtml(m, sn)
          : (isForm(m)
            ? formCardHtml(m)
            : (m.kind === 'call'
              ? callCardHtml(m)
              : '<div class="msg-bubble ' + (isUser ? 'user' : 'peer') + '">' + escape(m.text) + '</div>')))));

    return '<li class="msg ' + (isUser ? 'user' : 'peer') + '" data-id="' + escape(m.id) + '"' +
      (selectedId === m.id ? ' data-selected="1"' : '') + '>' +
      avatarHtml +
      '<div class="msg-body">' +
        nameHtml +
        '<div class="msg-stack">' +
          quoteHtml(m, sn) +
          bubbleHtml +
        '</div>' +
        '<div class="msg-meta' + (hasMeta ? ' has-meta' : '') + '">' +
          (s.showTimestamp
            ? '<span class="msg-time">' + YM.util.formatMsgTime(m.createdAt) + '</span>'
            : '') +
          metaRead +
        '</div>' +
      '</div>' +
      '</li>';
  }

  function daySep(ts) {
    return '<li class="day-sep"><span>' + YM.util.formatDateLabel(ts) + '</span></li>';
  }

  function typingInfo() {
    var d = YM.store.get();
    var tasks = YM.task.list(sid).filter(function (t) { return t.type === 'reply'; });
    if (!tasks.length) return null;
    var memberId = tasks[0].payload && tasks[0].payload.memberId;
    var member = memberId ? (d.members || []).filter(function (x) { return x.id === memberId; })[0] : null;
    var sn = YM.findSession(d, sid);
    var text = (sn && sn.params.typingText) || d.settings.typingText || '正在输入…';
    return { name: member ? member.name : '', text: text, member: member };
  }

  function typingHtml(s, d) {
    var info = typingInfo();
    if (!info) return '';
    var group = d.settings.showName && info.name;
    var avatar = d.settings.showAvatar && info.member
      ? '<span class="avatar"' + (info.member.avatar ? ' style="background-image:url(\'' + String(info.member.avatar).replace(/'/g, '%27') + '\')"' : '') + '>' +
        (info.member.avatar ? '' : escape(YM.avatarText(info.member.name))) + '</span>'
      : '<span style="width:30px;flex:0 0 30px"></span>';
    return '<li class="typing-row">' + avatar +
      '<span class="typing-bubble">' + (group ? escape(info.name) + ' ' : '') +
      '<span class="typing-text">' + escape(info.text) + '</span>' +
      '<span class="dots"><i></i><i></i><i></i></span></span></li>';
  }

  var readingFlag = false;

  // 在会话里（或回到前台）时，把最新的角色消息记成已读
  function markRead() {
    if (readingFlag) return;
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) return;
    var last = 0;
    (sn.messages || []).forEach(function (m) {
      if (m && m.role === 'peer' && (m.createdAt || 0) > last) last = m.createdAt || 0;
    });
    if (!last || (sn.lastReadAt || 0) >= last) return;
    readingFlag = true;
    YM.store.update(function (dd) {
      var s2 = YM.findSession(dd, sid);
      if (s2) s2.lastReadAt = last;
    }, 'sessions');
    readingFlag = false;
  }

  var BUDDY_KIND_NAME = { study: '学习', work: '办公', novel: '小说', video: '视频', music: '音乐', rest: '休息', game: '游戏', exercise: '锻炼' };

  // 今天这位角色正在陪哪一类；没有就返回 null
  function buddyKindOn(d, sn) {
    if (!sn || !sn.memberId) return null;
    var k = YM.util.dayKey(Date.now());
    var day = (d.mirror && d.mirror.pals && d.mirror.pals[k]) || {};
    for (var kind in day) {
      if (!Object.prototype.hasOwnProperty.call(day, kind)) continue;
      var v = day[kind];
      if (v === sn.memberId) return kind;
      if (Array.isArray(v) && v.indexOf(sn.memberId) >= 0) return kind;
    }
    return null;
  }

  function isBuddyOn(d, sn) {
    return !!buddyKindOn(d, sn);
  }

  // 点这枚心电图可以结束这次陪伴
  function endBuddy() {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    var kind = buddyKindOn(d, sn);
    if (!kind) return;
    YM.ui.confirm({
      title: '结束陪伴',
      body: '结束和' + (sn.name || 'TA') + '今天的「' + (BUDDY_KIND_NAME[kind] || '陪伴') + '」？',
      okText: '结束陪伴',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      YM.store.update(function (dd) {
        var day = dd.mirror && dd.mirror.pals && dd.mirror.pals[YM.util.dayKey(Date.now())];
        if (!day) return;
        for (var k in day) {
          if (!Object.prototype.hasOwnProperty.call(day, k)) continue;
          var v = day[k];
          if (v === sn.memberId) { delete day[k]; continue; }
          if (Array.isArray(v) && v.indexOf(sn.memberId) >= 0) {
            var left = v.filter(function (x) { return x !== sn.memberId; });
            if (left.length) day[k] = left;
            else delete day[k];
          }
        }
      }, 'all');
      YM.ui.toast('已结束陪伴');
      render();
    });
  }

  /* ---------- 角色状态：在线 / 忙碌 / 离开 / 休息 ---------- */
  var STATUS = {
    online: { n: '在线', k: 'online' },
    busy: { n: '忙碌', k: 'busy' },
    away: { n: '离开', k: 'away' },
    rest: { n: '休息', k: 'rest' },
    buddy: { n: '陪伴中', k: 'buddy' }
  };

  /* 手动定的优先；没定就按角色随机（每人各走各的），正在陪着你时改说「陪伴中」 */
  function statusOf(d, sn) {
    var pick = (sn.params && sn.params.status) || 'auto';
    if (pick !== 'auto' && STATUS[pick]) return STATUS[pick];
    if (isBuddyOn(d, sn)) return STATUS.buddy;
    var mid = sn.memberId;
    if (!mid && (sn.params.memberIds || []).length) mid = sn.params.memberIds[0];
    return YM.roleStatus.get(mid || sn.id);
  }

  function statusHtml(d, sn) {
    if (sn.params.groupEnabled && (sn.params.memberIds || []).length >= 2) return '';
    var st = statusOf(d, sn);
    return '<span class="nav-on is-' + st.k + '" aria-label="当前状态 ' + st.n + '">' +
      '<i class="nav-on-dot"></i>' + st.n + '</span>';
  }

  function pickStatus() {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) return;
    var cur = (sn.params && sn.params.status) || 'auto';
    var items = [
      { key: 'auto', label: '跟随时间' },
      { key: 'online', label: '在线' },
      { key: 'busy', label: '忙碌' },
      { key: 'away', label: '离开' },
      { key: 'rest', label: '休息' }
    ];
    YM.ui.actionSheet({
      title: '现在是什么状态',
      items: items.map(function (it) {
        return { label: it.label + (cur === it.key ? '　✓' : ''), key: it.key };
      })
    }).then(function (got) {
      if (!got) return;
      var hit = items.filter(function (it) { return it.label + (cur === it.key ? '　✓' : '') === got.label; })[0];
      if (!hit) return;
      var key = hit.key;
      YM.store.update(function (dd) {
        var s2 = YM.findSession(dd, sid);
        if (!s2 || !s2.params) return;
        s2.params.status = key;
        s2.updatedAt = Date.now();
      }, 'params');
      render();
      YM.ui.toast('状态已改为「' + hit.label + '」');
    });
  }

  function render() {
    hideToolbar();
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) { location.replace('sessions.html'); return; }
    var s = d.settings;

    if (navEcg) navEcg.classList.toggle('is-on', isBuddyOn(d, sn));

    // 群公告贴在顶部一条，点它进群资料去改
    var nBox = document.getElementById('chatNotice');
    var nTxt = document.getElementById('chatNoticeText');
    if (nBox && nTxt) {
      var notice = (((sn.params || {}).notice) || '').replace(/\s+/g, ' ').trim();
      var isGroup = !!(sn.params && sn.params.groupEnabled);
      if (isGroup && notice) {
        nTxt.textContent = notice;
        nBox.classList.add('is-on');
      } else {
        nBox.classList.remove('is-on');
      }
    }
    chatTitle.textContent = sn.name || '忆梦';
    // 每次重绘先摘掉上一次那枚状态，否则会一行行往上叠
    var oldOn = document.querySelector('.chat-title .nav-on');
    if (oldOn) oldOn.remove();
    if (chatStatus) chatStatus.insertAdjacentHTML('beforebegin', statusHtml(d, sn));
    if (sn.pinned) {
      var pin = document.createElement('span');
      pin.className = 'nav-pin';
      pin.setAttribute('aria-label', '已置顶');
      pin.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M9.6 3.8h4.8l-.7 5.4 3 3.3H7.3l3-3.3z"/><path d="M12 12.5v7.7"/></svg>';
      chatTitle.appendChild(pin);
    }
    document.title = (sn.name || '忆梦') + ' · 忆梦';

    var wasBottom = nearBottom();
    var prevTop = chatScroll.scrollTop;

    var html = '';
    var lastDay = '';
    sn.messages.forEach(function (m) {
      var day = YM.util.dayKey(m.createdAt);
      if (day !== lastDay) {
        html += daySep(m.createdAt);
        lastDay = day;
      }
      html += msgHtml(m, sn, s, d);
    });
    html += typingHtml(s, d);
    msgList.innerHTML = html;

    if (selectedId && !findMsg(sn, selectedId)) {
      selectedId = null;
      hideActions();
    }

    if (wasBottom) scrollBottom(false);
    else chatScroll.scrollTop = prevTop;

    updateSpeakState();
    updateStatus();
    markRead();
  }

  function updateSpeakState() {
    var busy = YM.task.isLocked(sid);
    btnPlus.classList.toggle('is-busy', busy);
    btnPlus.setAttribute('aria-disabled', busy ? 'true' : 'false');
  }

  function updateStatus() {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) return;
    var info = typingInfo();
    if (info) {
      chatStatus.textContent = (d.settings.showName && info.name ? info.name + ' ' : '') + info.text;
      chatStatus.classList.add('is-on');
      return;
    }
    if (sn.params.activeEnabled) {
      var next = YM.task.nextActiveAt(sid);
      if (next) {
        var mins = Math.max(1, Math.round((next - Date.now()) / 60000));
        chatStatus.textContent = '下一条约 ' + mins + ' 分钟后';
        chatStatus.classList.add('is-on');
        return;
      }
    }
    chatStatus.classList.remove('is-on');
  }

  /* ---------- 选中 ---------- */
  function hideActions() {
    var shown = msgList.querySelectorAll('.msg[data-selected="1"]');
    for (var i = 0; i < shown.length; i++) shown[i].removeAttribute('data-selected');
  }

  function selectMsg(id) {
    selectedId = id;
    var nodes = msgList.querySelectorAll('.msg');
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute('data-id') === id) nodes[i].setAttribute('data-selected', '1');
      else nodes[i].removeAttribute('data-selected');
    }
  }

  /* ---------- 发送 ---------- */
  function autoGrow() {
    inputMsg.style.height = 'auto';
    inputMsg.style.height = Math.min(104, inputMsg.scrollHeight) + 'px';
  }

  function send() {
    var text = inputMsg.value.trim();
    if (!text) return;
    if (plusPanel.classList.contains('is-open')) togglePanel(false);
    if (text.length > 500) {
      YM.ui.toast('最多 500 字，当前 ' + text.length + ' 字');
      return;
    }
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      sn.messages.push({
        id: YM.util.uid('msg'),
        role: 'user',
        text: text,
        createdAt: Date.now(),
        readStatus: null,
        memberId: null,
        memberName: '',
        memberAvatar: '',
        quotedMessageId: quoteId || null,
        mergedParts: null,
        triggerId: null
      });
      sn.updatedAt = Date.now();
    }, 'messages');

    inputMsg.value = '';
    autoGrow();
    clearQuote();
    YM.sound.play('user');
    render();
    scrollBottom(true);
    updateSendState();
  }

  function updateSendState() {
    var empty = !inputMsg.value.trim();
    btnSend.classList.toggle('is-empty', empty);
  }

  /* ---------- 相册 / 拍照 ---------- */
  var VIDEO_MAX_CHARS = 2600000;

  function makeFileInput(accept, multiple, capture) {
    var el = document.createElement('input');
    el.type = 'file';
    el.accept = accept;
    el.multiple = !!multiple;
    if (capture) el.setAttribute('capture', capture);
    el.hidden = true;
    document.body.appendChild(el);
    el.addEventListener('change', function () {
      var files = Array.prototype.slice.call(el.files || []);
      el.value = '';
      files.forEach(handlePick);
    });
    return el;
  }

  var fileAlbum = makeFileInput('image/*,video/*', true, null);
  var fileCam = makeFileInput('image/*', false, 'environment');

  function openAlbum() {
    if (plusPanel.classList.contains('is-open')) togglePanel(false);
    setTimeout(function () { fileAlbum.click(); }, 60);
  }

  function openCamera() {
    if (plusPanel.classList.contains('is-open')) togglePanel(false);
    setTimeout(function () { fileCam.click(); }, 60);
  }

  function handlePick(file) {
    if (!file) return;
    if (/^video\//i.test(file.type)) { pickVideo(file); return; }
    if (/^image\//i.test(file.type)) { pickImageFile(file); return; }
    YM.ui.toast('只认图片和视频');
  }

  function pickVideo(file) {
    if (file.size > 1900000) {
      YM.ui.toast('视频太大了，2MB 以内才放得进信袋');
      return;
    }
    var fr = new FileReader();
    fr.onload = function () {
      var src = String(fr.result || '');
      if (src.length > VIDEO_MAX_CHARS) {
        YM.ui.toast('视频太大，换短一点的');
        return;
      }
      pushMedia('video', src, 0, 0);
    };
    fr.onerror = function () { YM.ui.toast('这个视频读不出来'); };
    fr.readAsDataURL(file);
  }

  function pickImageFile(file) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var edge = 1080;
        var out = '';
        while (edge >= 640) {
          out = shrink(img, edge, 0.72);
          if (out.length <= 240000) break;
          out = shrink(img, edge, 0.6);
          if (out.length <= 240000) break;
          edge = Math.round(edge * 0.78);
        }
        if (!out || out.length > 480000) {
          YM.ui.toast('这张图太大，换一张试试');
          return;
        }
        pushMedia('image', out, img.naturalWidth, img.naturalHeight);
      };
      img.onerror = function () { YM.ui.toast('这张图读不出来'); };
      img.src = String(fr.result || '');
    };
    fr.onerror = function () { YM.ui.toast('这张图读不出来'); };
    fr.readAsDataURL(file);
  }

  function shrink(img, maxEdge, quality) {
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    if (!w || !h) return '';
    var scale = Math.min(1, maxEdge / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * scale));
    var ch = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, 0, 0, cw, ch);
    try { return c.toDataURL('image/jpeg', quality); } catch (e) { return ''; }
  }

  function pushMedia(kind, src, w, h) {
    var label = kind === 'video' ? '[视频]' : '[图片]';
    var res = YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      sn.messages.push({
        id: YM.util.uid('msg'),
        role: 'user',
        kind: kind,
        text: label,
        media: { src: src, w: w || 0, h: h || 0 },
        createdAt: Date.now(),
        readStatus: null,
        memberId: null,
        memberName: '',
        memberAvatar: '',
        quotedMessageId: null,
        mergedParts: null,
        triggerId: null
      });
      sn.updatedAt = Date.now();
    }, 'messages');

    if (!res || !res.ok) {
      YM.ui.toast('存储放不下这个文件，换小一点的');
      return;
    }
    clearQuote();
    YM.sound.play('user');
    render();
    scrollBottom(true);
  }

  /* ---------- 出问卷 ---------- */
  var FORM_MAX_Q = 5;
  var FORM_MAX_OPT = 4;

  function openFormSheet() {
    if (plusPanel.classList.contains('is-open')) togglePanel(false);

    YM.ui.sheet(function (sheet, close) {
      sheet.classList.add('is-full');
      sheet.innerHTML =
        '<div class="fs-head">' +
          '<h3 class="sheet-title">问卷</h3>' +
          '<button type="button" class="fs-close" id="formClose">关闭</button>' +
        '</div>' +
        '<div class="fs-body">' +
        '<p class="sheet-sub" id="formSub">写题目和选项，发出去之后对方会自己填</p>' +
        '<div class="seg form-seg" id="formSeg">' +
          '<button type="button" class="seg-item" data-tab="out" aria-selected="true">发出</button>' +
          '<button type="button" class="seg-item" data-tab="in" aria-selected="false">收到</button>' +
        '</div>' +
        '<div id="formOut">' +
          '<div class="form-editor" id="formEditor"></div>' +
          '<button type="button" class="form-add form-add-q" id="formAddQ">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>' +
            '再加一题' +
          '</button>' +
        '</div>' +
        '<div id="formIn" hidden><div class="fi-list" id="formHits"></div></div>' +
        '</div>' +
        '<div class="fs-foot" id="formFoot">' +
          '<div class="sheet-actions">' +
            '<button type="button" class="btn btn-ghost" id="formCancel">取消</button>' +
            '<button type="button" class="btn btn-primary" id="formSend">发送</button>' +
          '</div>' +
        '</div>';

      var editor = sheet.querySelector('#formEditor');
      var outBox = sheet.querySelector('#formOut');
      var inBox = sheet.querySelector('#formIn');
      var hitsBox = sheet.querySelector('#formHits');
      var subEl = sheet.querySelector('#formSub');
      var segEl = sheet.querySelector('#formSeg');
      var footEl = sheet.querySelector('#formFoot');
      var tab = 'out';

      function qBlock(text, options) {
        var wrap = document.createElement('div');
        wrap.className = 'form-q';
        var opts = (options && options.length) ? options : ['', ''];
        wrap.innerHTML =
          '<div class="form-q-head"><span class="form-q-no"></span>' +
            '<input class="form-q-input" type="text" maxlength="20" placeholder="写点什么，比如「今天心情怎么样」" autocomplete="off">' +
            '<button type="button" class="form-del" data-del="q" aria-label="删掉这题">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' +
            '</button></div>' +
          '<div class="form-opts"></div>' +
          '<button type="button" class="form-add form-add-opt" data-add="opt">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>' +
            '加选项' +
          '</button>';

        wrap.querySelector('.form-q-input').value = text || '';

        var optBox = wrap.querySelector('.form-opts');
        opts.forEach(function (v) { optBox.appendChild(optRow(v)); });

        wrap.querySelector('[data-del="q"]').addEventListener('click', function () {
          if (editor.querySelectorAll('.form-q').length <= 1) { YM.ui.toast('至少留一题'); return; }
          wrap.remove();
          syncNo();
        });

        wrap.querySelector('[data-add="opt"]').addEventListener('click', function () {
          if (optBox.querySelectorAll('.form-opt').length >= FORM_MAX_OPT) { YM.ui.toast('每题最多 ' + FORM_MAX_OPT + ' 个选项'); return; }
          optBox.appendChild(optRow(''));
        });

        editor.appendChild(wrap);
        return wrap;
      }

      function optRow(v) {
        var row = document.createElement('div');
        row.className = 'form-opt';
        row.innerHTML =
          '<span class="fc-dot"></span>' +
          '<input type="text" maxlength="12" placeholder="选项" autocomplete="off">' +
          '<button type="button" class="form-del" data-del="opt" aria-label="删掉这个选项">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>' +
          '</button>';
        row.querySelector('input').value = v || '';
        row.querySelector('[data-del="opt"]').addEventListener('click', function () {
          var opts = row.parentNode.querySelectorAll('.form-opt');
          if (opts.length <= 2) { YM.ui.toast('每题至少两个选项'); return; }
          row.remove();
        });
        return row;
      }

      function syncNo() {
        var all = editor.querySelectorAll('.form-q');
        Array.prototype.forEach.call(all, function (q, i) {
          q.querySelector('.form-q-no').textContent = i + 1;
        });
      }

      qBlock('', ['', '']);
      syncNo();

      // 收到：当前会话里发出去的问卷，以及对方填没填
      function renderHits() {
        var sn = session();
        var list = sn ? sn.messages.filter(isForm) : [];
        if (!list.length) {
          hitsBox.innerHTML = '<p class="fi-empty">这个会话还没有问卷<br><span>发出一份，对方填完就会出现在这里</span></p>';
          return;
        }
        list = list.slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
        hitsBox.innerHTML = list.map(function (m) {
          var filled = !!(m.answers && m.answers.length && m.answeredAt && m.answeredAt <= Date.now());
          var lines = m.form.map(function (q, i) {
            var a = filled && m.answers[i] != null ? q.options[m.answers[i]] : '';
            return '<div class="fi-line"><span class="fi-q">' + YM.util.escapeHtml(q.text) + '</span>' +
              (a ? '<span class="fi-dot">·</span><span class="fi-ans">' + YM.util.escapeHtml(a) + '</span>' : '') +
              '</div>';
          }).join('');
          return '<button type="button" class="fi-item" data-goto="' + m.id + '">' +
            '<div class="fi-head"><span class="fi-title">问卷 · ' + m.form.length + ' 题</span>' +
              '<span class="fi-state' + (filled ? ' is-done' : '') + '">' + (filled ? '已填写' : '待填写') + '</span></div>' +
            '<div class="fi-body">' + lines + '</div>' +
            (filled ? '<div class="fi-time">填写于 ' + YM.util.formatSince(m.answeredAt) + '</div>' : '') +
            '</button>';
        }).join('');
      }

      function syncTab() {
        Array.prototype.forEach.call(segEl.querySelectorAll('.seg-item'), function (b) {
          b.setAttribute('aria-selected', b.getAttribute('data-tab') === tab ? 'true' : 'false');
        });
        outBox.hidden = tab !== 'out';
        inBox.hidden = tab !== 'in';
        footEl.hidden = tab !== 'out';
        subEl.textContent = tab === 'out'
          ? '写题目和选项，发出去之后对方会自己填'
          : '这个会话里已发出的问卷，点开回到那条消息';
        if (tab === 'in') renderHits();
      }

      segEl.addEventListener('click', function (e) {
        var b = e.target.closest('.seg-item');
        if (!b) return;
        tab = b.getAttribute('data-tab');
        syncTab();
      });

      hitsBox.addEventListener('click', function (e) {
        var it = e.target.closest('.fi-item');
        if (!it) return;
        openFormDetail(it.getAttribute('data-goto'));   // 直接叠一层详情，不先关列表，避免中间露出聊天页
      });

      sheet.querySelector('#formAddQ').addEventListener('click', function () {
        if (editor.querySelectorAll('.form-q').length >= FORM_MAX_Q) { YM.ui.toast('最多 ' + FORM_MAX_Q + ' 题'); return; }
        var w = qBlock('', ['', '']);
        syncNo();
        var input = w.querySelector('.form-q-input');
        try { input.focus(); } catch (e) {}
        input.scrollIntoView({ block: 'center' });
      });

      sheet.querySelector('#formCancel').addEventListener('click', function () { close(); });
      sheet.querySelector('#formClose').addEventListener('click', function () { close(); });

      sheet.querySelector('#formSend').addEventListener('click', function () {
        var form = [];
        var bad = '';
        Array.prototype.some.call(editor.querySelectorAll('.form-q'), function (q, qi) {
          var text = q.querySelector('.form-q-input').value.trim();
          var options = [];
          Array.prototype.forEach.call(q.querySelectorAll('.form-opt input'), function (inp) {
            var v = inp.value.trim();
            if (v) options.push(v);
          });
          if (!text) { bad = '第 ' + (qi + 1) + ' 题还没写'; return true; }
          if (options.length < 2) { bad = '第 ' + (qi + 1) + ' 题至少两个选项'; return true; }
          form.push({ text: text.slice(0, 20), options: options.slice(0, FORM_MAX_OPT) });
          return false;
        });
        if (bad) { YM.ui.toast(bad); return; }

        var delayMs = 4000 + YM.util.randInt(4, 12) * 1000;
        close();
        YM.store.update(function (d) {
          var sn = YM.findSession(d, sid);
          if (!sn) return;
          sn.messages.push({
            id: YM.util.uid('msg'),
            role: 'user',
            kind: 'form',
            form: form,
            answers: answerForm(form),
            answeredAt: Date.now() + delayMs,
            text: '问卷 · ' + form.length + ' 题',
            createdAt: Date.now(),
            readStatus: null,
            memberId: null,
            memberName: '',
            memberAvatar: '',
            quotedMessageId: null,
            mergedParts: null,
            triggerId: null
          });
          sn.updatedAt = Date.now();
        }, 'messages');
        YM.sound.play('user');
        render();
        scrollBottom(true);
        YM.ui.toast('问卷已发出，等对方填');
      });
    });
  }

  // 到点把「待填写」翻成「已填写」
  function tickForms() {
    var sn = session();
    if (!sn) return;
    var now = Date.now();
    var due = sn.messages.filter(function (m) {
      return isForm(m) && m.answeredAt && m.answeredAt <= now && !m.formSeen;
    });
    if (!due.length) return;
    YM.store.update(function (dd) {
      var s2 = YM.findSession(dd, sid);
      if (!s2) return;
      var t = Date.now();
      s2.messages.forEach(function (m) {
        if (isForm(m) && m.answeredAt && m.answeredAt <= t) m.formSeen = true;
      });
    }, 'messages');
    YM.sound.play('peer');
    render();
  }

  // 点卡片看整份问卷
  function openFormDetail(mid) {
    var sn = session();
    var m = sn ? findMsg(sn, mid) : null;
    if (!m || !isForm(m)) return;
    var answers = m.answers || [];
    var pending = !!m.answeredAt && Date.now() < m.answeredAt;

    YM.ui.sheet(function (sheet, close) {
      var lines = m.form.map(function (q, qi) {
        var opts = q.options.map(function (o, oi) {
          var pick = !pending && answers[qi] === oi;
          return '<span class="fc-opt' + (pick ? ' is-pick' : '') + '">' +
            '<span class="fc-dot"></span>' + escape(o) + '</span>';
        }).join('');
        return '<div class="fd-item">' +
          '<div class="fc-item"><span class="fc-no">' + (qi + 1) + '</span>' +
            '<span class="fc-text">' + escape(q.text) + '</span></div>' +
          '<div class="fc-opts">' + opts + '</div></div>';
      }).join('');

      sheet.classList.add('is-full');
      sheet.innerHTML =
        '<div class="fs-head">' +
          '<h3 class="sheet-title">问卷 · ' + m.form.length + ' 题</h3>' +
          '<button type="button" class="fs-close" id="fdClose">关闭</button>' +
        '</div>' +
        '<div class="fs-body">' +
          '<p class="sheet-sub">' + (pending
            ? '对方还没填，填好会在这里亮出来'
            : '对方填好的答案 · ' + YM.util.formatSince(m.answeredAt)) + '</p>' +
          '<div class="fd-list">' + lines + '</div>' +
        '</div>';
      sheet.querySelector('#fdClose').addEventListener('click', function () { close(); });
    });
  }


  /* ---------- 发红包 / 转账 ---------- */
  function openMoneySheet(kindInit) {
    var kind = kindInit === 'transfer' ? 'transfer' : 'packet';
    if (plusPanel.classList.contains('is-open')) togglePanel(false);

    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title" id="moneyTitle">发一个红包</h3>' +
        '<p class="sheet-sub" id="moneySub">钱只走这一个会话，不会动到别处</p>' +
        '<div class="seg money-seg" id="moneySeg">' +
          '<button type="button" class="seg-item" data-kind="packet" aria-selected="true">红包</button>' +
          '<button type="button" class="seg-item" data-kind="transfer" aria-selected="false">转账</button>' +
        '</div>' +
        '<div class="form-stack">' +
          '<div class="field money-field"><span class="money-sign">¥</span>' +
            '<input id="moneyAmount" type="text" inputmode="decimal" placeholder="0.00" autocomplete="off"></div>' +
          '<div class="field"><input id="moneyNote" type="text" maxlength="20" autocomplete="off"></div>' +
        '</div>' +
        '<div class="sheet-actions">' +
          '<button type="button" class="btn btn-ghost" id="moneyCancel">取消</button>' +
          '<button type="button" class="btn btn-primary" id="moneyOk">塞进红包</button>' +
        '</div>';

      var segEl = sheet.querySelector('#moneySeg');
      var titleEl = sheet.querySelector('#moneyTitle');
      var amountEl = sheet.querySelector('#moneyAmount');
      var noteEl = sheet.querySelector('#moneyNote');
      var okEl = sheet.querySelector('#moneyOk');

      function syncKind() {
        var isPacket = kind === 'packet';
        Array.prototype.forEach.call(segEl.querySelectorAll('.seg-item'), function (b) {
          b.setAttribute('aria-selected', b.getAttribute('data-kind') === kind ? 'true' : 'false');
        });
        titleEl.textContent = isPacket ? '发一个红包' : '转一笔账';
        okEl.textContent = isPacket ? '塞进红包' : '转账';
        noteEl.placeholder = MONEY_NOTE[kind];
        noteEl.value = '';
        sheet.querySelector('.money-field').classList.toggle('is-transfer', !isPacket);
      }

      segEl.addEventListener('click', function (e) {
        var b = e.target.closest('.seg-item');
        if (!b) return;
        kind = b.getAttribute('data-kind');
        syncKind();
      });

      function submit() {
        var raw = String(amountEl.value).replace(/[^\d.]/g, '');
        var v = Math.round(Number(raw) * 100) / 100;
        if (!v || v <= 0) { YM.ui.toast('先填一个金额'); amountEl.focus(); return; }
        if (v > 99999) { YM.ui.toast('最多 99999'); amountEl.focus(); return; }
        var note = (noteEl.value.trim() || MONEY_NOTE[kind]).slice(0, 20);
        close();
        YM.store.update(function (d) {
          var sn = YM.findSession(d, sid);
          if (!sn) return;
          sn.messages.push({
            id: YM.util.uid('msg'),
            role: 'user',
            kind: kind,
            amount: v,
            note: note,
            claimed: false,
            refunded: false,
            moneyDueAt: Date.now() + YM.util.randInt(2000, 3600),
            moneyAnswer: Math.random() < 0.82 ? 'take' : 'back',
            text: (kind === 'packet' ? '红包 ' : '转账 ') + moneyText(v) + ' ' + note,
            createdAt: Date.now(),
            readStatus: null,
            memberId: null,
            memberName: '',
            memberAvatar: '',
            quotedMessageId: null,
            mergedParts: null,
            triggerId: null
          });
          sn.updatedAt = Date.now();
        }, 'messages');
        YM.sound.play('user');
        render();
        scrollBottom(true);
      }

      okEl.addEventListener('click', submit);
      amountEl.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); submit(); }
      });
      sheet.querySelector('#moneyCancel').addEventListener('click', function () { close(); });
      syncKind();
      setTimeout(function () { try { amountEl.focus(); } catch (err) {} }, 220);
    });
  }

  function claimMoney(id) {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    var m = sn ? findMsg(sn, id) : null;
    if (!m || !moneyKind(m)) return;
    if (m.role !== 'peer') {
      YM.ui.toast(m.refunded ? '这个被退回来了' : (m.claimed ? 'TA 已经收了' : '等 TA 那边'));
      return;
    }
    if (m.refunded) { YM.ui.toast('这个已经退回去了'); return; }
    if (m.claimed) { YM.ui.toast('这个已经领过了'); return; }
    YM.store.update(function (dd) {
      var s2 = YM.findSession(dd, sid);
      if (!s2) return;
      for (var i = 0; i < s2.messages.length; i++) {
        if (s2.messages[i].id === id) s2.messages[i].claimed = true;
      }
      s2.updatedAt = Date.now();
    }, 'messages');
    YM.sound.play('peer');
    YM.ui.toast((moneyKind(m) === 'transfer' ? '已收款 ' : '已领取 ') + moneyText(m.amount));
    render();
  }

  /* ---------- 加入字卡 ---------- */
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

  function groupsOf(d, root, memberId) {
    if (root === 'general') return d.cardStore.general.groups;
    var ex = d.cardStore.exclusive[memberId];
    return ex ? ex.groups : [];
  }

  function addToCard() {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    var m = sn ? findMsg(sn, selectedId) : null;
    if (!m || m.role !== 'user') return;

    YM.ui.sheet(function (sheet, close) {
      var members = d.members || [];
      var root = 'general';
      // 默认挂到本会话绑定的角色上
      var memberId = (sn && sn.memberId && members.some(function (x) { return x.id === sn.memberId; }))
        ? sn.memberId
        : (members.length ? members[0].id : null);

      function optionsHtml(rootType, mid) {
        var groups = groupsOf(d, rootType, mid);
        return groups.map(function (g) {
          return '<option value="' + escape(g.id) + '">' + escape(g.name) + '</option>';
        }).join('');
      }

      function memberOptions() {
        return members.map(function (x) {
          return '<option value="' + escape(x.id) + '"' +
            (x.id === memberId ? ' selected' : '') + '>' + escape(x.name) + '</option>';
        }).join('');
      }

      sheet.innerHTML =
        '<h3 class="sheet-title">加入字卡库</h3>' +
        '<p class="sheet-sub">可以改一改再收进去</p>' +
        '<div class="form-stack">' +
          '<div class="field"><textarea id="acText" rows="3" maxlength="200"></textarea></div>' +
          '<div class="field"><select id="acRoot">' +
            '<option value="general">通用</option>' +
            '<option value="exclusive"' + (members.length ? '' : ' disabled') + '>专属</option>' +
          '</select></div>' +
          '<div class="field hide" id="acMemberWrap"><select id="acMember">' + memberOptions() + '</select></div>' +
          '<div class="field"><select id="acGroup">' + optionsHtml('general', null) + '</select></div>' +
        '</div>' +
        '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" id="acCancel">取消</button>' +
          '<button class="btn btn-primary" id="acSave">保存</button>' +
        '</div>';

      var ta = sheet.querySelector('#acText');
      ta.value = m.text;
      var rootSel = sheet.querySelector('#acRoot');
      var memberWrap = sheet.querySelector('#acMemberWrap');
      var memberSel = sheet.querySelector('#acMember');
      var groupSel = sheet.querySelector('#acGroup');

      rootSel.addEventListener('change', function () {
        root = rootSel.value;
        memberWrap.classList.toggle('hide', root !== 'exclusive');
        memberId = memberSel.value || null;
        groupSel.innerHTML = optionsHtml(root, memberId);
      });

      memberSel.addEventListener('change', function () {
        memberId = memberSel.value;
        groupSel.innerHTML = optionsHtml(root, memberId);
      });

      sheet.querySelector('#acCancel').addEventListener('click', close);

      sheet.querySelector('#acSave').addEventListener('click', function () {
        var text = ta.value.trim();
        if (!text) { YM.ui.toast('内容不能为空'); return; }
        if (text.length > 200) { YM.ui.toast('单条字卡最多 200 字'); return; }
        if (root === 'exclusive' && !memberId) { YM.ui.toast('请先选择成员'); return; }

        var groupId = groupSel.value;
        var norm = YM.util.normalizeText(text);
        var exist = false;

        YM.store.update(function (dd) {
          var groups = groupsOf(dd, root, memberId);
          // 去重：同根内查重
          groups.forEach(function (g) {
            g.cards.forEach(function (c) {
              if (YM.util.normalizeText(c.text) === norm) exist = true;
            });
          });
          if (exist) return;
          var g = groups.filter(function (x) { return x.id === groupId; })[0] || groups[0];
          if (!g) return;
          g.cards.push({
            id: YM.util.uid('c'),
            text: text,
            hidden: false,
            order: g.cards.length,
            createdAt: Date.now()
          });
          if (root === 'exclusive') {
            if (!dd.cardStore.exclusive[memberId]) {
              dd.cardStore.exclusive[memberId] = { hidden: false, groups: [] };
            }
          }
        }, 'cards');

        if (exist) YM.ui.toast('已存在相同字卡');
        else YM.ui.toast('已加入字卡库');
        close();
      });
    });
  }

  /* ---------- 背景 ---------- */
  function applyBackground() {
    var d = YM.store.get();
    /* 旧版本默认盖一层白雾，照片全糊；这里一次性把存量压暗值清零（只清一次） */
    if (!(d.settings && d.settings.bgDimV2)) {
      YM.store.update(function (dd) {
        dd.settings = dd.settings || {};
        dd.settings.bgDimV2 = true;
        if (dd.settings.chatBackground) dd.settings.chatBackground.dim = 0;
        (dd.sessions || []).forEach(function (s2) {
          if (s2.params && s2.params.background) s2.params.background.dim = 0;
        });
      }, 'settings');
      d = YM.store.get();
    }
    var sn = YM.findSession(d, sid);
    var global = d.settings.chatBackground || { type: 'none', value: '', dim: 0.88 };
    var local = sn && sn.params.background ? sn.params.background : { type: 'inherit' };
    var bg = (local.type && local.type !== 'inherit') ? local : global;

    chatBg.style.backgroundImage = '';
    chatBg.style.backgroundColor = 'var(--bg)';

    var dim = bg.dim != null ? bg.dim : 0.88;
    chatBg.style.setProperty('--bg-dim', dim);

    if (bg.type === 'image' && bg.value) {
      chatBg.style.backgroundImage = 'url("' + String(bg.value).replace(/"/g, '%22') + '")';
    } else if (bg.type === 'color' && bg.value) {
      chatBg.style.backgroundColor = bg.value;
    }
  }

  /* ---------- 删除 / 清空 ---------- */
  function deleteMsg(mid) {
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    var m = sn ? findMsg(sn, mid) : null;
    if (!m) return;
    YM.ui.confirm({
      title: '删除这条消息',
      body: '删除后不可恢复。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      YM.task.cancelMessage(mid);
      YM.store.update(function (dd) {
        var s2 = YM.findSession(dd, sid);
        if (!s2) return;
        s2.messages = s2.messages.filter(function (x) { return x.id !== mid; });
        s2.updatedAt = Date.now();
      }, 'messages');
      if (selectedId === mid) selectedId = null;
      render();
    });
  }

  /* ---------- 长按菜单 ---------- */
  function msgBrief(m) {
    if (m.kind === 'form') return '问卷 · ' + m.form.length + ' 题';
    if (m.kind === 'image') return '[图片]';
    if (m.kind === 'video') return '[视频]';
    if (m.kind === 'packet') return '红包 ¥' + m.amount;
    if (m.kind === 'transfer') return '转账 ¥' + m.amount;
    return m.text;
  }

  function setQuote(mid) {
    var sn = session();
    var m = sn ? findMsg(sn, mid) : null;
    if (!m) return;
    quoteId = mid;
    quoteTextEl.textContent = msgBrief(m).slice(0, 26);
    quoteBar.hidden = false;
    try { inputMsg.focus(); } catch (e) {}
  }

  function clearQuote() {
    quoteId = null;
    quoteBar.hidden = true;
    quoteTextEl.textContent = '';
  }

  function toggleFav(mid) {
    var faved = false;
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      var m = findMsg(sn, mid);
      if (!m) return;
      m.favorited = !m.favorited;
      faved = !!m.favorited;
    }, 'messages');
    YM.ui.toast(faved ? '已收藏' : '已取消收藏');
  }

  function openMsgMenu(mid) {
    var sn = session();
    var m = sn ? findMsg(sn, mid) : null;
    if (!m) return;
    var node = msgList.querySelector('.msg[data-id="' + mid + '"]');
    if (!node) return;
    selectMsg(mid);
    toolbarId = mid;
    mtFavEl.textContent = m.favorited ? '取消收藏' : '收藏';
    msgToolbar.hidden = false;
    placeToolbar(node);
  }

  function placeToolbar(node) {
    var bubble = node.querySelector('.msg-bubble') || node.querySelector('.form-card') ||
      node.querySelector('.money-card') || node;
    var sc = chatScroll.getBoundingClientRect();
    var br = bubble.getBoundingClientRect();
    var w = msgToolbar.offsetWidth;
    var h = msgToolbar.offsetHeight;
    var pw = chatScroll.clientWidth;
    var top = br.bottom - sc.top + chatScroll.scrollTop + 6;
    var left = node.classList.contains('user')
      ? br.right - sc.left + chatScroll.scrollLeft - w
      : br.left - sc.left + chatScroll.scrollLeft;
    left = Math.max(8, Math.min(left, pw - w - 8));
    if (top + h > chatScroll.scrollTop + chatScroll.clientHeight - 6) {
      top = br.top - sc.top + chatScroll.scrollTop - h - 6;
    }
    msgToolbar.style.top = Math.round(top) + 'px';
    msgToolbar.style.left = Math.round(left) + 'px';
  }

  function hideToolbar() {
    msgToolbar.hidden = true;
    toolbarId = null;
  }

  /* ---------- 事件绑定 ---------- */
  msgList.addEventListener('click', function (e) {
    if (lpFired) { lpFired = false; return; }
    if (!msgToolbar.hidden) hideToolbar();
    var meEl = e.target.closest('[data-me]');
    if (meEl) {
      location.href = 'me.html';
      return;
    }
    var budEl = e.target.closest('[data-buddy]');
    if (budEl) {
      answerBuddy(budEl.getAttribute('data-mid'), budEl.getAttribute('data-buddy') === 'yes');
      return;
    }
    var optEl = e.target.closest('.pc-opt');
    if (optEl) {
      votePoll(optEl.closest('.poll-card').getAttribute('data-poll'), +optEl.getAttribute('data-vote'));
      return;
    }
    var formEl = e.target.closest('.form-card');
    if (formEl) {
      openFormDetail(formEl.getAttribute('data-form'));
      return;
    }
    var moneyEl = e.target.closest('.money-card');
    if (moneyEl) {
      claimMoney(moneyEl.getAttribute('data-money'));
      return;
    }
    var imgEl = e.target.closest('.msg-media.is-image');
    if (imgEl) {
      openMediaView(imgEl.getAttribute('data-media'));
      return;
    }
    var el = e.target.closest('.msg');
    if (!el) {
      selectedId = null;
      hideActions();
      if (plusPanel.classList.contains('is-open')) togglePanel(false);
      return;
    }
    var id = el.getAttribute('data-id');
    if (selectedId === id) {
      selectedId = null;
      hideActions();
      return;
    }
    selectMsg(id);
  });

  chatScroll.addEventListener('click', function (e) {
    if (e.target === chatScroll || e.target === msgList) {
      selectedId = null;
      hideActions();
      hideToolbar();
    }
  });

  /* 长按 450ms 出菜单；手指挪动超过 8px 视为滚动，取消 */
  var lpTimer = null;
  var lpStart = null;
  var lpFired = false;

  msgList.addEventListener('pointerdown', function (e) {
    var el = e.target.closest('.msg');
    if (!el) return;
    lpStart = { x: e.clientX, y: e.clientY };
    lpFired = false;
    if (lpTimer) clearTimeout(lpTimer);
    var id = el.getAttribute('data-id');
    lpTimer = setTimeout(function () {
      lpTimer = null;
      lpFired = true;
      try { if (navigator.vibrate) navigator.vibrate(8); } catch (err) {}
      openMsgMenu(id);
    }, 450);
  });

  msgList.addEventListener('pointermove', function (e) {
    if (!lpTimer || !lpStart) return;
    if (Math.abs(e.clientX - lpStart.x) > 8 || Math.abs(e.clientY - lpStart.y) > 8) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) {
    msgList.addEventListener(t, function () {
      if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
    });
  });

  document.getElementById('quoteCancel').addEventListener('click', clearQuote);

  callMute.addEventListener('click', toggleMute);
  callHang.addEventListener('click', onHangClick);
  callAnswer.addEventListener('click', acceptCall);
  callBack.addEventListener('click', minimizeCall);
  callFab.addEventListener('click', resumeCall);

  msgToolbar.addEventListener('click', function (e) {
    var btn = e.target.closest('.mt-btn');
    if (!btn) return;
    e.stopPropagation();
    var act = btn.getAttribute('data-act');
    var mid = toolbarId;
    hideToolbar();
    if (!mid) return;
    if (act === 'quote') setQuote(mid);
    if (act === 'fav') toggleFav(mid);
    if (act === 'del') deleteMsg(mid);
  });

  chatScroll.addEventListener('scroll', hideToolbar, { passive: true });

  /* ---------- ＋ 上升面板 ---------- */
  var PANEL_PAGE_SIZE = 6;
  var PANEL_ITEMS = [
    { key: 'album', label: '相册', icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M4.5 16l4.6-4.8 3.4 3.5 2.6-2.6 4.4 4.4"/>' +
      '<circle cx="16" cy="9.2" r="1.3"/></svg>' },
    { key: 'camera', label: '拍照', icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M8.6 7l1.3-2h4.2l1.3 2"/>' +
      '<circle cx="12" cy="13.2" r="3.1"/></svg>' },
    { key: 'call', label: '视频通话', icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<rect x="3" y="6" width="12" height="12" rx="2.5"/><path d="M15.5 11.2l4.2-2.6v6.8l-4.2-2.6z"/></svg>' },
    { key: 'packet', label: '红包', icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<rect x="4" y="4.5" width="16" height="15" rx="2.5"/><path d="M8 10.4c1.2 1.5 2.7 2.3 4 2.3s2.8-.8 4-2.3"/>' +
      '<circle cx="12" cy="8.2" r="1.2"/></svg>' },
    { key: 'share', label: '分享', icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<circle cx="12" cy="12" r="8.2"/><path d="M8.5 12h3.6"/>' +
      '<circle cx="15.6" cy="9" r="1.1"/><circle cx="15.6" cy="15" r="1.1"/></svg>' },
    { key: 'form', label: '问卷', icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">' +
      '<rect x="4.5" y="3.5" width="15" height="17" rx="2.5"/><path d="M8 9h8M8 13h5.5"/>' +
      '<path d="M8 16.6l1.4 1.4 2.4-2.4"/></svg>' }
  ];

  var panelApi = null;

  function togglePanel(force) {
    if (panelApi) panelApi.toggle(force);
  }

  btnPlus.addEventListener('click', function () {
    YM.sound.unlock();
    togglePanel();
  });

  btnSend.addEventListener('click', function () {
    YM.sound.unlock();
    send();
  });

  inputMsg.addEventListener('input', function () {
    autoGrow();
    updateSendState();
  });

  inputMsg.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  });

  // 顶部只剩「⋯」一个入口：点开是当前会话角色的个人资料页
  var noticeBtn = document.getElementById('chatNotice');
  if (noticeBtn) {
    noticeBtn.addEventListener('click', function () {
      location.href = 'profile.html?sid=' + encodeURIComponent(sid);
    });
  }

  chatTitle.addEventListener('click', function () { pickStatus(); });

  document.getElementById('btnMore').addEventListener('click', function () {
    location.href = 'profile.html?sid=' + encodeURIComponent(sid);
  });

  document.getElementById('btnBack').addEventListener('click', function (e) {
    e.preventDefault();
    location.href = 'sessions.html';
  });

  YM.event.on('ym:data', function (detail) {
    if (detail && detail.scope === 'settings') {
      applyBackground();
      render();
      return;
    }
    render();
    if (detail && detail.scope === 'messages') markRead();
  });

  window.addEventListener('focus', markRead);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) markRead();
  });

  YM.event.on('ym:realtime', function () {
    updateSpeakState();
    updateStatus();
  });

  /* ---------- 启动 ---------- */
  function boot() {
    var d0 = YM.store.get();
    var sn0 = YM.findSession(d0, sid);
    var isGroup = !!(sn0 && sn0.params.groupEnabled && sn0.params.memberIds.length >= 2);
    var items = PANEL_ITEMS.map(function (it) {
      if (it.key === 'form' && isGroup) return { key: 'poll', label: '投票', icon: POLL_ICON };
      return it;
    });
    panelApi = YM.ui.panel({
      root: plusPanel,
      btn: btnPlus,
      items: items,
      pageSize: PANEL_PAGE_SIZE,
      cols: 3,
      onPick: function (item) {
        if (item.key === 'album') { openAlbum(); return; }
        if (item.key === 'camera') { openCamera(); return; }
        if (item.key === 'packet') { openMoneySheet('packet'); return; }
        if (item.key === 'form') { openFormSheet(); return; }
        if (item.key === 'poll') { openPollSheet(); return; }
        if (item.key === 'call') { openCall(); return; }
        YM.ui.toast('「' + item.label + '」还没接入');
      }
    });
    togglePanel(false);
    var d = YM.store.get();
    var sn = YM.findSession(d, sid);
    if (!sn) { location.replace('sessions.html'); return; }
    applyBackground();
    render();
    scrollBottom(false);
    updateSendState();

    YM.task.start(sid, {
      onMessage: function (msg) {
        YM.sound.play('peer');
        YM.notify.check('peer', {
          sessionId: sid,
          text: (msg.memberName ? msg.memberName + '：' : '') + msg.text
        });
        render();
        if (nearBottom()) scrollBottom(true);
      },
      onTick: function () { updateStatus(); updateSpeakState(); },
      onSkip: function () { render(); },
      onPause: function () {
        YM.ui.toast('没有可用字卡，主动消息已暂停');
        render();
      }
    });

    statusTimer = setInterval(function () {
      updateStatus();
      updateSpeakState();
    }, 15000);

    formTimer = setInterval(tickForms, 1000);
  if (navEcg) navEcg.addEventListener('click', endBuddy);
    pollTimer = setInterval(tickPolls, 1000);
    buddyTimer = setInterval(tickBuddy, 1000);
    moneyTimer = setInterval(tickMoney, 1000);

    // 到点来电由内核 YM.ring 统一判定，聊天页交回整屏来电层自己弹
    if (YM.ring) {
      YM.ring.onDue = maybeIncomingCall;
      YM.ring.busy = function () { return callActive || !callMask.hidden; };
    }
    // 角色主动打进来时，若正开着的就是这个会话，就直接弹整屏来电
    if (YM.invite) {
      YM.invite.claim = function (targetSid) {
        if (targetSid !== sid) return false;
        if (document.hidden || callActive || !callMask.hidden) return false;
        incomingCall();
        return true;
      };
    }
    if (YM.util.qs('callin')) setTimeout(incomingCall, 1200);
    // 从别的页面横幅点「接听」跳过来：进门直接弹来电并接通
    if (YM.util.qs('call')) {
      setTimeout(function () {
        incomingCall();
        setTimeout(acceptCall, 320);
      }, 500);
    }

    setTimeout(function () { scrollBottom(false); }, 120);
    focusMessage();
  }

  // 从资料页「查找聊天记录」跳过来时，滚到那条消息并短暂选中
  function focusMsgInChat(mid) {
    var node = msgList.querySelector('.msg[data-id="' + mid + '"]');
    if (!node) {
      YM.ui.toast('那条消息已经不在了');
      return;
    }
    node.scrollIntoView({ block: 'center' });
    selectMsg(mid);
    setTimeout(function () { hideActions(); }, 1400);
  }

  function focusMessage() {
    var mid = YM.util.qs('focus');
    if (!mid) return;
    setTimeout(function () { focusMsgInChat(mid); }, 260);
  }

  window.addEventListener('beforeunload', function () {
    if (statusTimer) clearInterval(statusTimer);
    if (formTimer) clearInterval(formTimer);
    if (callTimer) clearInterval(callTimer);
    if (callNoTimer) clearTimeout(callNoTimer);
    if (callBackTimer) clearTimeout(callBackTimer);
    if (YM.ring) { YM.ring.onDue = null; YM.ring.busy = null; }
    if (YM.invite) YM.invite.claim = null;
    YM.task.stop();
  });

  // 首次触摸解锁音频
  document.addEventListener('touchstart', function once() {
    YM.sound.unlock();
    document.removeEventListener('touchstart', once);
  }, { passive: true });

  boot();
})();
