/* ============================================================
   忆梦 · profile.js（个人资料页）
   依赖：window.YM（common.js）
   ============================================================ */
(function () {
  'use strict';

  var sid = YM.util.qs('sid');
  if (!sid) {
    location.replace('sessions.html');
    return;
  }

  var avatarEl = document.getElementById('pfAvatar');
  var nameEl = document.getElementById('pfName');
  var subEl = document.getElementById('pfSub');
  var navTitle = document.getElementById('pfNavTitle');
  var membersSec = document.getElementById('pfMembers');
  var membersGrid = document.getElementById('pfMemberGrid');
  var membersCount = document.getElementById('pfMemberCount');
  var manageSec = document.getElementById('pfManage');
  var manageList = document.getElementById('pfManageList');
  var groupSec = document.getElementById('pfGroup');
  var groupNameVal = document.getElementById('pfGroupNameVal');
  var groupNoticeVal = document.getElementById('pfGroupNoticeVal');

  function escape(s) { return YM.util.escapeHtml(s); }

  function current() {
    var d = YM.store.get();
    return { d: d, sn: YM.findSession(d, sid) };
  }

  function bgText(p) {
    var bg = (p && p.background) || { type: 'inherit' };
    if (bg.type === 'none') return '无';
    if (bg.type === 'image') return '已设置';
    if (bg.type === 'color') return '已设置';
    return '跟随全局';
  }

  /* ---------- 顶部资料 ---------- */
  function isGroup(sn) {
    var p = (sn && sn.params) || {};
    return !!p.groupEnabled && (p.memberIds || []).length >= 2;
  }

  // 群里的人：以 d.members 为准，成员会话里的名字 / 头像优先
  function groupMembers(d, sn) {
    var ids = ((sn.params && sn.params.memberIds) || []);
    var byId = {};
    (d.members || []).forEach(function (m) { byId[m.id] = m; });
    var out = [];
    ids.forEach(function (mid) {
      var m = byId[mid];
      var s2 = (d.sessions || []).filter(function (s) { return s.memberId === mid; })[0];
      var name = (s2 && s2.name) || (m && m.name) || '未命名';
      var avatar = (s2 && s2.avatar) || (m && m.avatar) || '';
      out.push({ id: mid, name: name, avatar: avatar });
    });
    return out;
  }

  function mutedOf(sn) {
    return (sn && sn.params && sn.params.muted) || {};
  }

  /* 群成员 + 群管理两块：谁被禁言，两处都跟着变 */
  /* 群名称与群公告：名称改会话名，公告存 params.notice */
  function renderGroupInfo(sn) {
    if (!sn || !isGroup(sn)) {
      groupSec.hidden = true;
      return;
    }
    groupSec.hidden = false;
    groupNameVal.textContent = (sn.name || '未命名').slice(0, 18);
    var notice = ((sn.params && sn.params.notice) || '').replace(/\s+/g, ' ').trim();
    groupNoticeVal.textContent = notice ? (notice.length > 16 ? notice.slice(0, 16) + '…' : notice) : '还没写';
  }

  function openGroupName() {
    var cur = current();
    if (!cur.sn) return;
    YM.ui.input({
      title: '群名称',
      body: '群里所有成员都看得到这个名字',
      value: cur.sn.name || '',
      rows: 2,
      maxlength: 20,
      required: true,
      okText: '改好了'
    }).then(function (v) {
      if (v === null) return;
      YM.store.update(function (d) {
        var sn = YM.findSession(d, sid);
        if (!sn) return;
        sn.name = v;
        sn.updatedAt = Date.now();
      }, 'sessions');
      renderHero();
      YM.ui.toast('群名称已改');
    });
  }

  function openGroupNotice() {
    var cur = current();
    if (!cur.sn) return;
    YM.ui.input({
      title: '群公告',
      body: '写几句群里的约定，只有这一栏',
      value: (cur.sn.params && cur.sn.params.notice) || '',
      rows: 5,
      maxlength: 200,
      placeholder: '比如：晚上十一点后不聊正事'
    }).then(function (v) {
      if (v === null) return;
      save(function (pp) { pp.notice = v; });
      YM.ui.toast(v ? '群公告已更新' : '群公告已清空');
    });
  }

  function renderManage(sn, list) {
    if (!sn || !isGroup(sn)) {
      manageSec.hidden = true;
      manageList.innerHTML = '';
      groupSec.hidden = true;
      return;
    }
    var muted = mutedOf(sn);
    var me = (YM.store.get().me) || { name: '我', avatar: '' };
    var offCount = list.filter(function (m) { return !!muted[m.id]; }).length;
    manageSec.hidden = false;
    document.getElementById('pfOwnerNote').textContent = offCount ? ('已禁言 ' + offCount + ' 位') : '还没有禁言谁';
    var meRow = '<div class="pf-manage-row is-me">' +
      '<span class="pm-av is-sm">' + (me.avatar
        ? '<i style="background-image:url(\'' + String(me.avatar).replace(/'/g, '%27') + '\')"></i>'
        : escape(YM.avatarText(me.name || '我'))) + '</span>' +
      '<span class="pf-manage-name">' + escape(me.name || '我') + '</span>' +
      '<span class="pf-manage-role">群主</span></div>';

    manageList.innerHTML = meRow + list.map(function (m) {
      var off = !!muted[m.id];
      return '<div class="pf-manage-row" data-mid="' + escape(m.id) + '">' +
        '<span class="pm-av is-sm' + (off ? ' is-muted' : '') + '">' + (m.avatar
          ? '<i style="background-image:url(\'' + String(m.avatar).replace(/'/g, '%27') + '\')"></i>'
          : escape(YM.avatarText(m.name))) + '</span>' +
        '<span class="pf-manage-name">' + escape(m.name) +
          (off ? '<i class="pf-manage-state">已禁言</i>' : '') + '</span>' +
        '<button type="button" class="switch" role="switch" aria-checked="' + (off ? 'true' : 'false') +
          '" data-mute="' + escape(m.id) + '"></button>' +
        '</div>';
    }).join('');

    manageList.querySelectorAll('[data-mute]').forEach(function (sw) {
      sw.addEventListener('click', function () {
        var mid = sw.getAttribute('data-mute');
        var cur = !!mutedOf(current().sn)[mid];
        YM.store.update(function (d) {
          var s2 = YM.findSession(d, sid);
          if (!s2 || !s2.params) return;
          if (!s2.params.muted) s2.params.muted = {};
          if (cur) delete s2.params.muted[mid];
          else s2.params.muted[mid] = { at: Date.now() };
          s2.updatedAt = Date.now();
        }, 'params');
        var m = list.filter(function (x) { return x.id === mid; })[0];
        renderHero();
        YM.ui.toast(cur ? ('已解除 ' + (m ? m.name : '') + ' 的禁言') : ('已禁言 ' + (m ? m.name : '') + '，群里暂时听不到 TA'));
      });
    });
  }

  function renderMembers(sn) {
    if (!sn || !isGroup(sn)) {
      membersSec.hidden = true;
      membersGrid.innerHTML = '';
      manageSec.hidden = true;
      manageList.innerHTML = '';
      return;
    }
    var d = YM.store.get();
    var list = groupMembers(d, sn);
    var muted = mutedOf(sn);
    var me = d.me || { name: '我', avatar: '' };
    membersSec.hidden = false;
    membersCount.textContent = (list.length + 1) + ' 位';

    /* 群是我建的，我排在最前，头像角上标一个「主」 */
    var meHtml = '<div class="pm-item is-me">' +
      '<span class="pm-av">' + (me.avatar
        ? '<i style="background-image:url(\'' + String(me.avatar).replace(/'/g, '%27') + '\')"></i>'
        : escape(YM.avatarText(me.name || '我'))) +
        '<i class="pm-owner-mark" aria-hidden="true">主</i></span>' +
      '<span class="pm-name">' + escape(me.name || '我') + '</span></div>';

    var html = meHtml + list.map(function (m) {
      var off = !!muted[m.id];
      return '<div class="pm-item' + (off ? ' is-muted' : '') + '">' +
        '<span class="pm-av">' + (m.avatar
          ? '<i style="background-image:url(\'' + String(m.avatar).replace(/'/g, '%27') + '\')"></i>'
          : escape(YM.avatarText(m.name))) +
          (off ? '<i class="pm-muted-mark" aria-hidden="true"></i>' : '') + '</span>' +
        '<span class="pm-name">' + escape(m.name) + '</span></div>';
    }).join('');

    html += '<button type="button" class="pm-item pm-add" id="pmAdd">' +
      '<span class="pm-av">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
          '<path d="M12 6v12M6 12h12"/></svg>' +
      '</span>' +
      '<span class="pm-name">添加</span></button>';

    membersGrid.innerHTML = html;
    document.getElementById('pmAdd').onclick = function () { openAddMembers(sn); };
    renderManage(sn, list);
  }

  function renderHero() {
    var cur = current();
    var sn = cur.sn;
    if (!sn) { location.replace('sessions.html'); return; }
    var group = isGroup(sn);

    document.title = (sn.name || '忆梦') + (group ? ' · 群聊资料' : ' · 个人资料');
    navTitle.textContent = group ? '群聊资料' : '个人资料';
    nameEl.textContent = sn.name || '忆梦';
    subEl.hidden = !group;
    subEl.textContent = group ? '群主 · 我' : '';

    if (sn.avatar) {
      avatarEl.style.backgroundImage = 'url(\'' + String(sn.avatar).replace(/'/g, '%27') + '\')';
      avatarEl.textContent = '';
    } else {
      avatarEl.style.backgroundImage = '';
      avatarEl.textContent = YM.avatarText(sn.name);
    }

    document.getElementById('pfBgNote').textContent = bgText(sn.params);

    var pinSw = document.getElementById('pfPinSwitch');
    pinSw.setAttribute('aria-checked', sn.pinned ? 'true' : 'false');

    renderGroupInfo(sn);
    renderMembers(sn);
  }

  groupSec.addEventListener('click', function (e) {
    var btn = e.target.closest('.pf-item');
    if (!btn) return;
    var g = btn.getAttribute('data-g');
    if (g === 'name') openGroupName();
    if (g === 'notice') openGroupNotice();
  });

  /* ---------- 往群里加成员 ---------- */
  function openAddMembers(sn) {
    var d = YM.store.get();
    var inIds = ((sn.params && sn.params.memberIds) || []).slice();
    var pool = YM.membersInUse(d).filter(function (m) {
      return inIds.indexOf(m.id) === -1 && m.name;
    });

    if (!pool.length) {
      YM.ui.toast('没有可以拉进来的人了，先去会话页加一位');
      return;
    }

    var picked = [];
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h2 class="sheet-title">添加成员</h2>' +
        '<div class="chip-list pm-pool" id="pmPool">' +
          pool.map(function (m) {
            return '<button type="button" class="member-chip" data-mid="' + escape(m.id) + '" aria-pressed="false">' +
              escape(m.name) + '</button>';
          }).join('') +
        '</div>' +
        '<div class="sheet-actions">' +
          '<button type="button" class="btn btn-ghost" id="pmCancel">取消</button>' +
          '<button type="button" class="btn" id="pmOk">添进去</button>' +
        '</div>';

      sheet.querySelector('#pmPool').addEventListener('click', function (e) {
        var chip = e.target.closest('.member-chip');
        if (!chip) return;
        var mid = chip.getAttribute('data-mid');
        var on = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', on ? 'true' : 'false');
        if (on) picked.push(mid);
        else picked = picked.filter(function (x) { return x !== mid; });
      });

      sheet.querySelector('#pmCancel').onclick = close;
      sheet.querySelector('#pmOk').onclick = function () {
        if (!picked.length) { YM.ui.toast('先选一位'); return; }
        YM.store.update(function (dd) {
          var s2 = YM.findSession(dd, sid);
          if (!s2 || !s2.params) return;
          s2.params.groupEnabled = true;
          s2.params.memberIds = (s2.params.memberIds || []).concat(picked);
          s2.updatedAt = Date.now();
        }, 'params');
        var names = picked.map(function (mid) {
          var m = (YM.store.get().members || []).filter(function (x) { return x.id === mid; })[0];
          return m ? m.name : '';
        }).filter(Boolean).join('、');
        close();
        renderHero();
        YM.ui.toast(names ? ('已加入 ' + names) : '已加入');
      };
    });
  }

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
            : '这张图读不出来，换一张试试');
          resolve(null);
        });
      });
      input.click();
    });
  }

  avatarEl.addEventListener('click', function () {
    pickImage(300 * 1024).then(function (b64) {
      if (!b64) return;
      YM.store.update(function (d) {
        var sn = YM.findSession(d, sid);
        if (!sn) return;
        sn.avatar = b64;
        sn.updatedAt = Date.now();
        if (sn.memberId) {
          (d.members || []).forEach(function (m) { if (m.id === sn.memberId) m.avatar = b64; });
        }
      }, 'sessions');
      renderHero();
      YM.ui.toast('头像已更新');
    });
  });

  /* ---------- 行列表 ---------- */
  document.getElementById('pfRows').addEventListener('click', function (e) {
    var btn = e.target.closest('.pf-item');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'settings') openSettings();
    if (act === 'pin') togglePin();
    if (act === 'background') openBackground();
    if (act === 'search') openSearch();
    if (act === 'clear') clearChat();
  });

  function togglePin() {
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      sn.pinned = !sn.pinned;
    }, 'sessions');
    var pinned = current().sn.pinned;
    renderHero();
    YM.ui.toast(pinned ? '已置顶，排到会话列表最上面' : '已取消置顶');
  }

  function clearChat() {
    YM.ui.confirm({
      title: '清空聊天记录',
      body: '会话本身与字卡库都会保留，聊天记录不可恢复。',
      okText: '清空',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      YM.task.cancel(sid);
      YM.store.update(function (d) {
        var sn = YM.findSession(d, sid);
        if (!sn) return;
        sn.messages = [];
        sn.updatedAt = Date.now();
      }, 'messages');
      YM.ui.toast('已清空');
    });
  }

  /* ---------- 聊天设置 ---------- */
  function save(fn) {
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (!sn) return;
      fn(sn.params, d);
      sn.updatedAt = Date.now();
    }, 'params');
    renderHero();
  }

  function bindNum(root, id, key, min, max, after) {
    var el = root.querySelector('#' + id);
    el.addEventListener('change', function () {
      var v = YM.util.clamp(parseInt(el.value, 10) || min, min, max);
      el.value = v;
      save(function (pp) { pp[key] = v; });
      if (after) after();
    });
  }

  function bindSwitch(root, id, key, after) {
    var el = root.querySelector('#' + id);
    el.addEventListener('click', function () {
      var next = el.getAttribute('aria-checked') !== 'true';
      el.setAttribute('aria-checked', next ? 'true' : 'false');
      save(function (pp) { pp[key] = next; });
      if (after) after(next);
    });
  }

  function resizeActive() {
    YM.task.cancelActive(sid);
    var cur = current();
    if (cur.sn && cur.sn.params.activeEnabled) YM.task.scheduleActive(sid);
  }

  function speakNow(close) {
    YM.sound.unlock();
    var plan = YM.reply.planTrigger({ sessionId: sid, source: 'speak' });
    if (!plan.ok) {
      if (plan.reason === 'locked') YM.ui.toast('对方还在回应');
      else if (plan.reason === 'all_muted') YM.ui.toast('群里都被禁言了，先去群管理解除一位', 2600);
      else if (plan.reason === 'empty_pool') YM.ui.toast('没有可用字卡，先去字卡库添加', 2600);
      else YM.ui.toast('这次没接上，再点一次试试');
      return;
    }
    if (plan.skipped) {
      YM.ui.toast('这次已读不回');
      return;
    }
    YM.task.schedule(sid, plan);
    var n = (plan.messages && plan.messages.length) || 1;
    YM.ui.toast('已排好 ' + n + ' 条，回聊天页就能看到');
    if (close) close();
  }

  function openSettings() {
    var cur = current();
    var sn = cur.sn;
    if (!sn) return;
    var p = sn.params;

    YM.ui.sheet(function (sheet, close) {
      sheet.classList.add('is-full');
      sheet.innerHTML =
        '<div class="fs-head">' +
          '<h3 class="sheet-title">聊天设置</h3>' +
          '<button type="button" class="fs-close" id="pfClose">关闭</button>' +
        '</div>' +
        '<div class="fs-body">' +
        '<p class="sheet-sub">点击即生效，不需要保存</p>' +

        '<div class="pf-sheet-actions">' +
          '<button type="button" class="btn btn-sm" id="pfSpeak">让对方说话</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" id="pfToCards">去字卡库</button>' +
        '</div>' +

        '<div class="param-group">' +
          '<div class="param-head">回复节奏</div>' +
          '<div class="param-item"><span class="row-main row-title">延迟下限</span>' +
            '<span class="num-pair"><input type="number" id="pDelayMin" min="1" max="120" value="' + p.delayMin + '"><span class="num-unit">秒</span></span></div>' +
          '<div class="param-item"><span class="row-main row-title">延迟上限</span>' +
            '<span class="num-pair"><input type="number" id="pDelayMax" min="1" max="120" value="' + p.delayMax + '"><span class="num-unit">秒</span></span></div>' +
          '<div class="divider"></div>' +
          '<div class="param-item"><span class="row-main row-title">回复条数下限</span>' +
            '<span class="num-pair"><input type="number" id="pReplyMin" min="1" max="3" value="' + p.replyMin + '"><span class="num-unit">条</span></span></div>' +
          '<div class="param-item"><span class="row-main row-title">回复条数上限</span>' +
            '<span class="num-pair"><input type="number" id="pReplyMax" min="1" max="3" value="' + p.replyMax + '"><span class="num-unit">条</span></span></div>' +
          '<div class="divider"></div>' +
          '<div class="param-item"><span class="row-main row-title">已读不回</span>' +
            '<span class="small text-2 mono-num" id="pSkipVal">' + p.skipChance + '%</span></div>' +
          '<input class="range" type="range" id="pSkip" min="0" max="100" step="5" value="' + p.skipChance + '">' +
        '</div>' +

        '<div class="param-group">' +
          '<div class="param-head">主动消息</div>' +
          '<div class="param-item"><span class="row-main row-title">开启</span>' +
            '<button class="switch" id="pActive" role="switch" aria-checked="' + (p.activeEnabled ? 'true' : 'false') + '"></button></div>' +
          '<div class="param-item"><span class="row-main row-title">间隔下限</span>' +
            '<span class="num-pair"><input type="number" id="pActiveMin" min="1" max="1440" value="' + p.activeMinMin + '"><span class="num-unit">分</span></span></div>' +
          '<div class="param-item"><span class="row-main row-title">间隔上限</span>' +
            '<span class="num-pair"><input type="number" id="pActiveMax" min="1" max="1440" value="' + p.activeMaxMin + '"><span class="num-unit">分</span></span></div>' +
        '</div>' +

        '<div class="param-group">' +
          '<div class="param-head">对话形式</div>' +
          '<div class="param-item"><span class="row-main row-title">引用回复</span>' +
            '<button class="switch" id="pQuote" role="switch" aria-checked="' + (p.quoteEnabled ? 'true' : 'false') + '"></button></div>' +
          '<div class="param-item"><span class="row-main row-title">连句合并</span>' +
            '<button class="switch" id="pMerge" role="switch" aria-checked="' + (p.mergeEnabled ? 'true' : 'false') + '"></button></div>' +
        '</div>' +

        '<div class="param-group">' +
          '<div class="param-head">正在输入</div>' +
          '<div class="field"><input type="text" id="pTyping" maxlength="20" placeholder="跟随全局（' + escape(cur.d.settings.typingText) + '）" value="' + escape(p.typingText || '') + '"></div>' +
        '</div>' +

        '<div class="param-group">' +
          '<div class="param-head">声音</div>' +
          '<div class="param-item"><span class="row-main row-title">消息音效</span>' +
            '<select class="pf-select" id="pSound">' +
              '<option value="inherit">跟随全局</option>' +
              '<option value="on">开启</option>' +
              '<option value="off">关闭</option>' +
            '</select></div>' +
        '</div>' +
        '<div class="sheet-gap"></div>' +
        '</div>';

      sheet.querySelector('#pfClose').addEventListener('click', close);
      sheet.querySelector('#pfSpeak').addEventListener('click', function () { speakNow(close); });
      sheet.querySelector('#pfToCards').addEventListener('click', function () { location.href = 'cards.html'; });

      var skip = sheet.querySelector('#pSkip');
      var skipVal = sheet.querySelector('#pSkipVal');
      skip.addEventListener('input', function () { skipVal.textContent = skip.value + '%'; });
      skip.addEventListener('change', function () {
        var v = parseInt(skip.value, 10) || 0;
        save(function (pp) { pp.skipChance = v; });
      });

      bindNum(sheet, 'pDelayMin', 'delayMin', 1, 120, function () {
        var minEl = sheet.querySelector('#pDelayMin');
        var maxEl = sheet.querySelector('#pDelayMax');
        if ((parseInt(maxEl.value, 10) || 0) < (parseInt(minEl.value, 10) || 0)) {
          maxEl.value = minEl.value;
          save(function (pp) { pp.delayMax = parseInt(maxEl.value, 10); });
        }
      });
      bindNum(sheet, 'pDelayMax', 'delayMax', 1, 120);
      bindNum(sheet, 'pReplyMin', 'replyMin', 1, 3);
      bindNum(sheet, 'pReplyMax', 'replyMax', 1, 3);
      bindNum(sheet, 'pActiveMin', 'activeMinMin', 1, 1440, resizeActive);
      bindNum(sheet, 'pActiveMax', 'activeMaxMin', 1, 1440, resizeActive);

      bindSwitch(sheet, 'pActive', 'activeEnabled', function (on) {
        if (on) YM.task.scheduleActive(sid);
        else YM.task.cancelActive(sid);
      });
      bindSwitch(sheet, 'pQuote', 'quoteEnabled');
      bindSwitch(sheet, 'pMerge', 'mergeEnabled');
      sheet.querySelector('#pTyping').addEventListener('change', function (e) {
        var v = e.target.value.trim();
        save(function (pp) { pp.typingText = v || null; });
      });

      var soundEl = sheet.querySelector('#pSound');
      soundEl.value = p.soundEnabled === true ? 'on' : (p.soundEnabled === false ? 'off' : 'inherit');
      soundEl.addEventListener('change', function () {
        var v = soundEl.value;
        save(function (pp) { pp.soundEnabled = v === 'on' ? true : (v === 'off' ? false : null); });
      });
    });
  }

  /* ---------- 聊天背景 ---------- */
  function bgState() {
    var d = YM.store.get();
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
    var global = (d.settings && d.settings.chatBackground) || { type: 'none', value: '', dim: 0 };
    var local = (sn && sn.params.background) || { type: 'inherit' };
    return {
      global: global,
      local: local,
      scope: (local.type && local.type !== 'inherit') ? 'local' : 'global'
    };
  }

  function bgShown(state, scope) {
    if (scope === 'local') {
      return (state.local.type && state.local.type !== 'inherit') ? state.local : { type: 'none' };
    }
    return state.global || { type: 'none' };
  }

  function saveBg(scope, payload) {
    YM.store.update(function (d) {
      var sn = YM.findSession(d, sid);
      if (scope === 'local' && sn) sn.params.background = payload;
      else d.settings.chatBackground = payload;
    }, 'settings');
    var d2 = YM.store.get();
    var sn2 = YM.findSession(d2, sid);
    if (sn2) document.getElementById('pfBgNote').textContent = bgText(sn2.params);
  }

  function shrinkToData(file, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var max = 1280;
        var w = img.width;
        var h = img.height;
        if (w > max || h > max) {
          var k = max / Math.max(w, h);
          w = Math.round(w * k);
          h = Math.round(h * k);
        }
        var cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        var cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, w, h);
        try { cb(cv.toDataURL('image/jpeg', 0.82)); }
        catch (e) { cb(String(reader.result || '')); }
      };
      img.onerror = function () { cb(''); };
      img.src = String(reader.result || '');
    };
    reader.onerror = function () { cb(''); };
    reader.readAsDataURL(file);
  }

  function openBackground() {
    var st = bgState();
    var scope = st.scope === 'global' && st.global.type && st.global.type !== 'none' && st.global.type !== 'inherit'
      ? 'global' : 'local';
    var dim0 = (function () {
      var s0 = bgShown(st, scope);
      return s0.dim != null ? s0.dim : 0;
    })();

    YM.ui.sheet(function (sheet) {
      sheet.innerHTML =
        '<h3 class="sheet-title">聊天背景</h3>' +
        '<p class="sheet-sub">换成自己的照片，字会自己压暗一层</p>' +
        '<div class="bgs-preview" id="bgsPrev"></div>' +
        '<div class="bgs-acts">' +
          '<button type="button" class="bgs-act" id="bgsPick">从相册上传</button>' +
          '<button type="button" class="bgs-act is-plain" id="bgsReset">恢复默认</button>' +
        '</div>' +
        '<div class="bgs-url-row">' +
          '<input class="bgs-url" id="bgsUrl" type="url" placeholder="粘贴图片链接，自动预览">' +
          '<div class="bgs-url-note" id="bgsUrlNote" hidden></div>' +
        '</div>' +
        '<div class="bgs-row">' +
          '<span class="bgs-label">压暗</span>' +
          '<input type="range" class="bgs-range" id="bgsDim" min="0" max="80" value="' +
            Math.round(dim0 * 100) + '">' +
        '</div>' +
        '<div class="bgs-row">' +
          '<span class="bgs-label">用到哪儿</span>' +
          '<div class="bgs-chips">' +
            '<button type="button" class="bgs-chip' + (scope === 'local' ? ' is-on' : '') + '" data-scope="local">这个会话</button>' +
            '<button type="button" class="bgs-chip' + (scope === 'global' ? ' is-on' : '') + '" data-scope="global">全部会话</button>' +
          '</div>' +
        '</div>' +
        '<input type="file" id="bgsFile" accept="image/*" hidden>';

      var prev = sheet.querySelector('#bgsPrev');
      var file = sheet.querySelector('#bgsFile');
      var dimEl = sheet.querySelector('#bgsDim');

      var urlEl = sheet.querySelector('#bgsUrl');
      var urlNote = sheet.querySelector('#bgsUrlNote');

      function note(text, bad) {
        if (!text) { urlNote.hidden = true; urlNote.textContent = ''; urlEl.classList.remove('is-bad'); return; }
        urlNote.hidden = false;
        urlNote.textContent = text;
        urlNote.classList.toggle('is-bad', !!bad);
        urlEl.classList.toggle('is-bad', !!bad);
      }

      function paint() {
        var shown = bgShown(bgState(), scope);
        prev.classList.remove('is-empty');
        prev.style.backgroundImage = '';
        if (shown.type === 'image' && shown.value) {
          prev.style.backgroundImage = 'url("' + String(shown.value).replace(/"/g, '%22') + '")';
          prev.innerHTML = '<span class="bgs-veil" id="bgsVeil"></span>' +
            '<span class="bgs-sample"></span><span class="bgs-sample bgs-sample-2"></span>';
          var veil = prev.querySelector('#bgsVeil');
          if (veil) veil.style.opacity = String(shown.dim != null ? shown.dim : 0);
        } else {
          prev.innerHTML = '当前是默认底色';
          prev.classList.add('is-empty');
        }
      }
      paint();

      (function prefill() {
        var shown = bgShown(bgState(), scope);
        if (shown.type === 'image' && shown.value && String(shown.value).indexOf('data:') !== 0) {
          urlEl.value = String(shown.value);
        }
      })();

      /* 链接直链：一边粘一边试，能加载出来就直接当背景 */
      var urlSeq = 0;
      var tryUrl = YM.util.debounce(function () {
        var raw = urlEl.value.trim();
        var mine = ++urlSeq;
        if (!raw) { note(''); return; }
        if (!/^(https?:|file:|data:image\/)/i.test(raw)) {
          note('链接要以 http(s):// 开头', true);
          return;
        }
        note('正在读这张图…');
        var probe = new Image();
        probe.onload = function () {
          if (mine !== urlSeq) return;
          saveBg(scope, { type: 'image', value: raw, dim: dimEl.value / 100 });
          paint();
          note('已经用这张图了');
        };
        probe.onerror = function () {
          if (mine !== urlSeq) return;
          note('这个链接打不开，换个能直接显示图片的地址', true);
        };
        probe.src = raw;
      }, 420);

      urlEl.addEventListener('input', tryUrl);
      urlEl.addEventListener('change', tryUrl);

      sheet.querySelector('#bgsPick').addEventListener('click', function () { file.click(); });

      file.addEventListener('change', function () {
        var f = file.files && file.files[0];
        if (!f) return;
        YM.ui.toast('正在处理这张图…');
        shrinkToData(f, function (data) {
          if (!data) { YM.ui.toast('这张图读不出来，换一张试试'); return; }
          saveBg(scope, { type: 'image', value: data, dim: dimEl.value / 100 });
          urlEl.value = '';
          note('已经用这张图了');
          paint();
          YM.ui.toast('背景换好了');
        });
      });

      sheet.querySelector('#bgsReset').addEventListener('click', function () {
        if (scope === 'local') saveBg('local', { type: 'inherit' });
        else saveBg('global', { type: 'none', value: '', dim: 0 });
        urlEl.value = '';
        note('');
        paint();
        YM.ui.toast('回到默认底色');
      });

      dimEl.addEventListener('input', function () {
        var shown = bgShown(bgState(), scope);
        saveBg(scope, {
          type: shown.type === 'inherit' ? 'none' : shown.type,
          value: shown.value || '',
          dim: dimEl.value / 100
        });
        var veil = prev.querySelector('#bgsVeil');
        if (veil) veil.style.opacity = String(dimEl.value / 100);
      });

      sheet.querySelectorAll('[data-scope]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          scope = btn.getAttribute('data-scope');
          sheet.querySelectorAll('[data-scope]').forEach(function (x) {
            x.classList.toggle('is-on', x === btn);
          });
          var shown = bgShown(bgState(), scope);
          dimEl.value = Math.round((shown.dim != null ? shown.dim : 0) * 100);
          urlEl.value = (shown.type === 'image' && shown.value && String(shown.value).indexOf('data:') !== 0)
            ? String(shown.value) : '';
          note('');
          paint();
        });
      });
    });
  }

  /* ---------- 查找聊天记录 ---------- */
  function openSearch() {
    var cur = current();
    var sn = cur.sn;
    var all = (sn.messages || []).slice().reverse();

    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title">查找聊天记录</h3>' +
        '<p class="sheet-sub">只搜这个会话，新消息在前</p>' +
        '<div class="field"><input type="text" id="pfSearch" placeholder="输入关键词"></div>' +
        '<div class="pf-hits" id="pfHits"></div>';

      var input = sheet.querySelector('#pfSearch');
      var hits = sheet.querySelector('#pfHits');

      function mark(text, q) {
        var raw = String(text || '');
        if (!q) return escape(raw.slice(0, 90));
        var idx = raw.toLowerCase().indexOf(q.toLowerCase());
        if (idx < 0) return escape(raw.slice(0, 90));
        var from = Math.max(0, idx - 24);
        var to = Math.min(raw.length, idx + q.length + 40);
        var head = from > 0 ? '…' : '';
        var tail = to < raw.length ? '…' : '';
        return escape(head + raw.slice(from, idx)) + '<mark>' + escape(raw.slice(idx, idx + q.length)) + '</mark>' +
          escape(raw.slice(idx + q.length, to) + tail);
      }

      function draw() {
        var q = input.value.trim();
        if (!q) {
          hits.innerHTML = '<div class="pf-hit-empty text-2 small">输入关键词开始查找</div>';
          return;
        }
        var found = all.filter(function (m) { return String(m.text || '').toLowerCase().indexOf(q.toLowerCase()) >= 0; });
        if (!found.length) {
          hits.innerHTML = '<div class="pf-hit-empty text-2 small">没找到包含「' + escape(q) + '」的消息</div>';
          return;
        }
        hits.innerHTML = found.slice(0, 60).map(function (m) {
          return '<button type="button" class="pf-hit" data-mid="' + escape(m.id) + '">' +
            '<span class="pf-hit-tag">' + (m.role === 'user' ? '我' : escape(sn.name)) + '</span>' +
            '<span class="pf-hit-text">' + mark(m.text, q) + '</span>' +
            '<span class="pf-hit-time">' + YM.util.formatStamp(m.createdAt) + '</span>' +
          '</button>';
        }).join('');
      }

      input.addEventListener('input', YM.util.debounce(draw, 200));
      draw();

      hits.addEventListener('click', function (e) {
        var btn = e.target.closest('.pf-hit');
        if (!btn) return;
        var mid = btn.getAttribute('data-mid');
        close();
        location.href = 'chat.html?sid=' + encodeURIComponent(sid) + '&focus=' + encodeURIComponent(mid);
      });
    });
  }

  /* ---------- 启动 ---------- */
  document.getElementById('pfBack').setAttribute('href', 'chat.html?sid=' + encodeURIComponent(sid));
  renderHero();

  YM.event.on('ym:data', function () {
    renderHero();
  });
})();
