/* ============================================================
   忆梦 · cards.js（字卡库）
   ============================================================ */
(function () {
  'use strict';

  var groupList = document.getElementById('groupList');
  var memberBar = document.getElementById('memberBar');
  var emptyEl = document.getElementById('cardsEmpty');
  var emptyText = document.getElementById('emptyText');
  var searchInput = document.getElementById('searchInput');
  var batchBar = document.getElementById('batchBar');
  var batchCount = document.getElementById('batchCount');

  var root = 'general';
  var kind = 'text';
  var memberId = null;
  var query = '';
  var openMap = {};
  var batchMode = false;
  var selected = {};

  var SORT_LABELS = { manual: '手动', recent: '最近添加', length: '文本长度', alpha: '字母' };

  /* ---------- 数据访问 ---------- */
  function groupsOf(d, rootType, mid) {
    if (rootType === 'general') return d.cardStore.general.groups;
    var ex = d.cardStore.exclusive[mid];
    return ex ? ex.groups : [];
  }

  function ensureExclusive(d, mid) {
    if (!d.cardStore.exclusive[mid]) {
      d.cardStore.exclusive[mid] = {
        hidden: false,
        groups: [{ id: 'g_default', name: '默认分组', order: 0, hidden: false, cards: [] }]
      };
    }
    return d.cardStore.exclusive[mid];
  }

  function currentData() {
    var d = YM.store.get();
    return { data: d, groups: groupsOf(d, root, memberId) };
  }

  function countRoot(d, rootType, mid) {
    var groups = groupsOf(d, rootType, mid);
    var n = 0;
    groups.forEach(function (g) {
      g.cards.forEach(function (c) { if (!c.hidden) n++; });
    });
    return n;
  }

  function countAllExclusive(d) {
    var n = 0;
    Object.keys(d.cardStore.exclusive || {}).forEach(function (mid) {
      var ex = d.cardStore.exclusive[mid];
      (ex.groups || []).forEach(function (g) {
        g.cards.forEach(function (c) { if (!c.hidden) n++; });
      });
    });
    return n;
  }

  function sortCards(cards, mode) {
    var out = cards.slice();
    if (mode === 'recent') out.sort(function (a, b) { return b.createdAt - a.createdAt; });
    else if (mode === 'length') out.sort(function (a, b) { return a.text.length - b.text.length; });
    else if (mode === 'alpha') out.sort(function (a, b) { return a.text.localeCompare(b.text, 'zh-Hans-CN'); });
    else out.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    return out;
  }

  function groupKey(gid) {
    return root + ':' + (memberId || '-') + ':' + gid;
  }

  /* ---------- 渲染 ---------- */
  function renderSegCounts(d) {
    var seg = document.getElementById('segRoot');
    var g = seg.querySelector('[data-root="general"]');
    var e = seg.querySelector('[data-root="exclusive"]');
    g.textContent = '通用 ' + countRoot(d, 'general', null);
    e.textContent = '专属 ' + countAllExclusive(d);
    g.setAttribute('aria-selected', root === 'general' ? 'true' : 'false');
    e.setAttribute('aria-selected', root === 'exclusive' ? 'true' : 'false');
    renderKindTabs(d);
  }

  var KIND_META = {
    text: { label: '字卡', empty: '还没有字卡', search: '搜索字卡', add: '添加字卡' },
    sticker: { label: '表情包', empty: '还没有表情包', search: '搜索表情包', add: '添加表情包' },
    emoji: { label: 'emoji', empty: '还没有 emoji', search: '搜索 emoji', add: '添加 emoji' }
  };

  function countKind(groups, k) {
    var n = 0;
    (groups || []).forEach(function (g) {
      (g.cards || []).forEach(function (c) {
        if (!c.hidden && YM.util.cardKind(c.text) === k) n++;
      });
    });
    return n;
  }

  function renderKindTabs(d) {
    var tabs = document.getElementById('kindTabs');
    if (!tabs) return;
    var groups = groupsOf(d, root, memberId);
    Array.prototype.forEach.call(tabs.querySelectorAll('.kind-tab'), function (btn) {
      var k = btn.getAttribute('data-kind');
      btn.setAttribute('aria-selected', k === kind ? 'true' : 'false');
      btn.textContent = KIND_META[k].label + ' ' + countKind(groups, k);
    });
    searchInput.setAttribute('placeholder', KIND_META[kind].search);
    document.getElementById('btnEmptyAdd').textContent = KIND_META[kind].add;
  }

  function renderMemberBar(d) {
    if (root !== 'exclusive') {
      memberBar.classList.remove('is-on');
      memberBar.innerHTML = '';
      return;
    }
    buildRoleBar(d);
  }

  // 角色列表：以会话为准（会话名就是角色名），再把还没建会话的角色补在后面
  function roleList(d) {
    // 只列会话列表里还在的角色：会话被删掉后，字卡库这里也跟着消失
    var list = [], seen = {};
    (d.sessions || []).forEach(function (s) {
      if (!s.memberId || seen[s.memberId]) return;
      seen[s.memberId] = 1;
      list.push({ id: s.memberId, name: s.name });
    });
    return list;
  }

  function buildRoleBar(d) {
    var memberBar = document.getElementById('memberBar');
    if (!memberBar) return;
    memberBar.classList.add('is-on');
    var roles = roleList(d);
    if (!roles.length) {
      memberBar.innerHTML = '<button class="btn btn-sm" id="btnNoMember">去会话页新建角色</button>';
      var b = document.getElementById('btnNoMember');
      if (b) b.addEventListener('click', function () { location.href = 'sessions.html'; });
      return;
    }
    if (!memberId || !roles.some(function (m) { return m.id === memberId; })) {
      memberId = roles[0].id;
    }
    // 切到还没建过字卡的角色时，顺手给它一个默认分组
    if (!d.cardStore.exclusive[memberId]) {
      ensureExclusive(d, memberId);
      YM.store.save(d, true);
    }
    var cur = roles.filter(function (m) { return m.id === memberId; })[0] || roles[0];
    // 菜单已经展开时不要重写 DOM，否则会把用户正看着的列表顶掉
    var menu = document.getElementById('roleMenu');
    if (menu && !menu.hidden) {
      var label = document.querySelector('#roleBtn .role-name');
      if (label) label.textContent = cur.name;
      return;
    }
    memberBar.innerHTML =
      '<div class="field role-field">' +
        '<button type="button" class="role-btn" id="roleBtn" aria-haspopup="listbox" aria-expanded="false">' +
          '<span class="role-name">' + YM.util.escapeHtml(cur.name) + '</span>' +
          '<svg class="role-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6.5 9.5L12 15l5.5-5.5"/></svg>' +
        '</button>' +
        '<div class="role-menu" id="roleMenu" role="listbox" hidden>' +
          roles.map(function (m) {
            return '<button type="button" class="role-opt' + (m.id === memberId ? ' is-on' : '') + '"' +
              ' role="option" data-mid="' + YM.util.escapeHtml(m.id) + '"' +
              ' aria-selected="' + (m.id === memberId ? 'true' : 'false') + '">' +
              YM.util.escapeHtml(m.name) + '</button>';
          }).join('') +
        '</div>' +
      '</div>';

    var btn = document.getElementById('roleBtn');
    var list = document.getElementById('roleMenu');

    function closeMenu() {
      if (!list) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = list.hidden;
      list.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    list.addEventListener('click', function (e) {
      var opt = e.target.closest('.role-opt');
      if (!opt) return;
      var mid = opt.getAttribute('data-mid');
      if (!mid || mid === memberId) { closeMenu(); return; }
      memberId = mid;
      selected = {};
      closeMenu();
      render();
    });

    document.addEventListener('click', function () { closeMenu(); });
  }

  function matches(card) {
    if (!query) return true;
    return card.text.toLowerCase().indexOf(query.toLowerCase()) >= 0;
  }

  function renderGroups(d, groups) {
    var mode = (d.ui && d.ui.sortMode) || 'manual';
    var html = '';
    var visibleTotal = 0;

    groups.forEach(function (g) {
      var cards = sortCards(g.cards, mode);
      // 先按二级 tab 分类，再按搜索词过滤
      cards = cards.filter(function (c) { return YM.util.cardKind(c.text) === kind; });
      if (query) cards = cards.filter(matches);
      if (query && !cards.length && g.name.toLowerCase().indexOf(query.toLowerCase()) < 0) return;

      var isOpen = query ? true : (openMap[groupKey(g.id)] != null ? openMap[groupKey(g.id)] : g.cards.length > 0);
      visibleTotal += cards.length;

      html += '<div class="group' + (isOpen ? ' is-open' : '') + (g.hidden ? ' is-hidden' : '') + '" data-gid="' + YM.util.escapeHtml(g.id) + '">' +
        '<div class="group-head">' +
          '<button class="group-toggle" data-toggle="' + YM.util.escapeHtml(g.id) + '">' +
            '<svg class="group-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 6l7 6-7 6"/></svg>' +
            '<span class="group-name">' + YM.util.escapeHtml(g.name) + '</span>' +
            '<span class="group-count">' + cards.length + '</span>' +
          '</button>' +
          '<button class="group-more" data-gmore="' + YM.util.escapeHtml(g.id) + '" aria-label="分组操作">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="group-body">';

      if (!cards.length) {
        html += '<div class="group-empty">这一组还是空的</div>';
      } else {
        cards.forEach(function (c) {
          var on = !!selected[c.id];
          var body;
          if (kind === 'sticker') {
            body = '<img class="card-thumb" src="' + YM.util.escapeHtml(c.text) + '" alt="" loading="lazy">';
          } else if (kind === 'emoji') {
            body = '<span class="card-text is-emoji">' + YM.util.escapeHtml(c.text) + '</span>';
          } else {
            body = '<span class="card-text">' + YM.util.escapeHtml(c.text) + '</span>';
          }
          html += '<div class="card-row' + (c.hidden ? ' is-hidden' : '') + '" data-cid="' + YM.util.escapeHtml(c.id) + '" data-gid="' + YM.util.escapeHtml(g.id) + '">' +
            (batchMode
              ? '<span class="card-check' + (on ? ' is-on' : '') + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12.5l4.5 4.5 9.5-10"/></svg></span>'
              : '') +
            body +
            (batchMode ? '' :
              '<button class="card-eye' + (c.hidden ? ' is-off' : '') + '" data-eye="' + YM.util.escapeHtml(c.id) + '" aria-label="显示或屏蔽">' +
                (c.hidden
                  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 12s3.4-5.5 9-5.5S21 12 21 12s-3.4 5.5-9 5.5S3 12 3 12z"/><path d="M4 4l16 16"/></svg>'
                  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M3 12s3.4-5.5 9-5.5S21 12 21 12s-3.4 5.5-9 5.5S3 12 3 12z"/><circle cx="12" cy="12" r="2.6"/></svg>') +
              '</button>') +
          '</div>';
        });
      }

      html += '</div></div>';
    });

    groupList.innerHTML = html;

    var showEmpty = !groups.length || (query && visibleTotal === 0);
    emptyEl.classList.toggle('hide', !showEmpty);
    if (showEmpty) {
      if (root === 'exclusive' && !(d.members || []).length) emptyText.textContent = '先在设置里添加群成员';
      else if (query) emptyText.textContent = '没有匹配的内容';
      else emptyText.textContent = KIND_META[kind].empty;
    }
  }

  function render() {
    var cur = currentData();
    renderSegCounts(cur.data);
    renderMemberBar(cur.data);
    // 角色下拉可能在上面刚补齐了默认分组，这里重新取一次
    cur = currentData();
    if (root === 'exclusive' && !(cur.data.members || []).length) {
      groupList.innerHTML = '';
      emptyEl.classList.remove('hide');
      emptyText.textContent = '先在设置里添加角色';
      return;
    }
    renderGroups(cur.data, cur.groups);
    updateBatchBar();
  }

  function updateBatchBar() {
    batchBar.classList.toggle('hide', !batchMode);
    batchCount.textContent = '已选 ' + Object.keys(selected).length + ' 条';
    document.getElementById('btnAdd').classList.toggle('hide', batchMode);
  }

  /* ---------- 单条添加 ---------- */
  function addSingle() {
    var cur = currentData();
    var groups = cur.groups;
    if (!groups.length) {
      YM.ui.toast('请先新建一个分组');
      return;
    }
    var meta = KIND_META[kind];
    var tips = {
      text: '一句话就是一张卡',
      sticker: '粘贴图片直链，会自动归到表情包',
      emoji: '直接输入表情符号，例如 😀'
    };
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title">' + meta.add + '</h3>' +
        '<p class="sheet-sub">' + tips[kind] + '</p>' +
        '<div class="form-stack">' +
          '<div class="field"><textarea id="acText" rows="3" maxlength="200" placeholder="' +
            (kind === 'sticker' ? 'https://… 图片直链' : kind === 'emoji' ? '😀' : '写一句对方可能会说的话') +
          '"></textarea></div>' +
          '<div class="field"><label>分组</label><select id="acGroup">' +
            groups.map(function (g) {
              return '<option value="' + YM.util.escapeHtml(g.id) + '">' + YM.util.escapeHtml(g.name) + '</option>';
            }).join('') +
          '</select></div>' +
        '</div>' +
        '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" id="acCancel">取消</button>' +
          '<button class="btn btn-primary" id="acSave">添加</button>' +
        '</div>';

      var ta = sheet.querySelector('#acText');
      setTimeout(function () { ta.focus(); }, 60);

      sheet.querySelector('#acCancel').addEventListener('click', close);
      sheet.querySelector('#acSave').addEventListener('click', function () {
        var text = ta.value.trim();
        if (!text) { YM.ui.toast('内容不能为空'); return; }
        if (text.length > 200) { YM.ui.toast('单条最多 200 字'); return; }
        var got = YM.util.cardKind(text);
        if (kind === 'sticker' && got !== 'sticker') { YM.ui.toast('表情包要粘贴图片直链'); return; }
        if (kind === 'emoji' && got !== 'emoji') { YM.ui.toast('这一栏只放表情符号'); return; }
        var gid = sheet.querySelector('#acGroup').value;
        var norm = YM.util.normalizeText(text);
        var exist = false;

        YM.store.update(function (d) {
          var gs = groupsOf(d, root, memberId);
          gs.forEach(function (g) {
            g.cards.forEach(function (c) { if (YM.util.normalizeText(c.text) === norm) exist = true; });
          });
          if (exist) return;
          var g = gs.filter(function (x) { return x.id === gid; })[0];
          if (!g) return;
          g.cards.push({ id: YM.util.uid('c'), text: text, hidden: false, order: g.cards.length, createdAt: Date.now() });
        }, 'cards');

        if (exist) { YM.ui.toast('这条已经有了'); return; }
        close();
        YM.ui.toast('已添加');
        render();
      });
    });
  }

  /* ---------- 批量解析 ---------- */
  function parseBatch(text) {
    var order = [];
    var map = {};
    var truncated = 0;

    function bucket(name) {
      if (!map[name]) {
        map[name] = { name: name, cards: [] };
        order.push(name);
      }
      return map[name];
    }

    var current = null;
    String(text).split(/\r?\n/).forEach(function (line) {
      var raw = line.trim();
      if (!raw) return;
      var m = /^【(.+)】$/.exec(raw);
      if (m) {
        current = bucket(m[1].trim());
        return;
      }
      if (!current) current = bucket('默认分组');
      var t = raw;
      if (t.length > 200) { t = t.slice(0, 200); truncated++; }
      current.cards.push(t);
    });

    return {
      groups: order.map(function (n) { return map[n]; }),
      truncated: truncated
    };
  }

  function analyze(parsed, rootType, mid) {
    var d = YM.store.get();
    var groups = groupsOf(d, rootType, mid);
    var existingNames = {};
    var norm = {};
    groups.forEach(function (g) {
      existingNames[g.name] = g.id;
      g.cards.forEach(function (c) { norm[YM.util.normalizeText(c.text)] = true; });
    });

    var newGroups = 0;
    var total = 0;
    var dup = 0;
    parsed.groups.forEach(function (g) {
      if (!existingNames[g.name]) newGroups++;
      g.cards.forEach(function (c) {
        var n = YM.util.normalizeText(c);
        if (norm[n]) dup++;
        else { norm[n] = true; total++; }
      });
    });

    return { newGroups: newGroups, total: total, dup: dup, truncated: parsed.truncated };
  }

  function applyParsed(parsed, rootType, mid) {
    var added = 0;
    YM.store.update(function (d) {
      if (rootType === 'exclusive') ensureExclusive(d, mid);
      var groups = groupsOf(d, rootType, mid);
      var byName = {};
      groups.forEach(function (g) { byName[g.name] = g; });

      var norm = {};
      groups.forEach(function (g) {
        g.cards.forEach(function (c) { norm[YM.util.normalizeText(c.text)] = true; });
      });

      parsed.groups.forEach(function (pg) {
        var g = byName[pg.name];
        if (!g) {
          g = { id: YM.util.uid('g'), name: pg.name, order: groups.length, hidden: false, cards: [] };
          groups.push(g);
          byName[pg.name] = g;
        }
        pg.cards.forEach(function (text) {
          var n = YM.util.normalizeText(text);
          if (norm[n]) return;
          norm[n] = true;
          g.cards.push({ id: YM.util.uid('c'), text: text, hidden: false, order: g.cards.length, createdAt: Date.now() });
          added++;
        });
      });
    }, 'cards');
    return added;
  }

  /* ---------- 批量添加 ---------- */
  function addBatch() {
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title">批量添加</h3>' +
        '<p class="sheet-sub">【分组名】换组，每行一条</p>' +
        '<textarea class="batch-input" id="batchText" placeholder="【日常】&#10;刚看到，怎么了？&#10;在做什么呢&#10;【睡前】&#10;早点睡"></textarea>' +
        '<div class="preview-box" id="batchPreview">还没有内容</div>' +
        '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" id="batchCancel">取消</button>' +
          '<button class="btn btn-primary" id="batchSave">写入</button>' +
        '</div>';

      var ta = sheet.querySelector('#batchText');
      var preview = sheet.querySelector('#batchPreview');
      var parsed = { groups: [], truncated: 0 };
      var stat = { total: 0, newGroups: 0, dup: 0, truncated: 0 };

      function refresh() {
        parsed = parseBatch(ta.value);
        stat = analyze(parsed, root, memberId);
        if (!ta.value.trim()) {
          preview.textContent = '还没有内容';
          return;
        }
        preview.innerHTML =
          '新建分组 <b>' + stat.newGroups + '</b> 个　' +
          '新增字卡 <b>' + stat.total + '</b> 条　' +
          '跳过重复 <b>' + stat.dup + '</b> 条' +
          (stat.truncated ? '<br>超长被截断 <b>' + stat.truncated + '</b> 条' : '');
      }

      ta.addEventListener('input', YM.util.debounce(refresh, 180));
      setTimeout(function () { ta.focus(); }, 60);

      sheet.querySelector('#batchCancel').addEventListener('click', close);
      sheet.querySelector('#batchSave').addEventListener('click', function () {
        if (!ta.value.trim()) { YM.ui.toast('还没有内容'); return; }
        var added = applyParsed(parseBatch(ta.value), root, memberId);
        close();
        YM.ui.toast(added ? '已写入 ' + added + ' 条字卡' : '没有新的字卡可写入');
        render();
      });
    });
  }

  /* ---------- 字卡操作 ---------- */
  function cardAction(cid, gid) {
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    var g = groups.filter(function (x) { return x.id === gid; })[0];
    var c = g ? g.cards.filter(function (x) { return x.id === cid; })[0] : null;
    if (!c) return;

    YM.ui.actionSheet({
      items: [
        { key: 'edit', label: '编辑' },
        { key: 'move', label: '移动到其它分组' },
        { key: 'hide', label: c.hidden ? '取消屏蔽' : '屏蔽这条' },
        { key: 'delete', label: '删除' }
      ]
    }).then(function (item) {
      if (!item) return;
      if (item.key === 'edit') editCard(gid, cid);
      if (item.key === 'move') moveCards(gid, [cid]);
      if (item.key === 'hide') toggleCard(cid);
      if (item.key === 'delete') deleteCard(cid, gid);
    });
  }

  function editCard(gid, cid) {
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    var g = groups.filter(function (x) { return x.id === gid; })[0];
    var c = g ? g.cards.filter(function (x) { return x.id === cid; })[0] : null;
    if (!c) return;

    YM.ui.input({
      title: '编辑字卡',
      value: c.text,
      maxlength: 200,
      rows: 3,
      required: true,
      okText: '保存'
    }).then(function (val) {
      if (val == null) return;
      var norm = YM.util.normalizeText(val);
      var dup = false;
      YM.store.update(function (dd) {
        var gs = groupsOf(dd, root, memberId);
        gs.forEach(function (gg) {
          if (gg.id === gid) return;
          gg.cards.forEach(function (cc) { if (YM.util.normalizeText(cc.text) === norm) dup = true; });
        });
        if (dup) return;
        gs.forEach(function (gg) {
          gg.cards.forEach(function (cc) { if (cc.id === cid) cc.text = val; });
        });
      }, 'cards');
      if (dup) YM.ui.toast('同组之外已有相同内容');
      render();
    });
  }

  function toggleCard(cid) {
    YM.store.update(function (d) {
      groupsOf(d, root, memberId).forEach(function (g) {
        g.cards.forEach(function (c) { if (c.id === cid) c.hidden = !c.hidden; });
      });
    }, 'cards');
    render();
  }

  function deleteCard(cid, gid) {
    var backup = null;
    YM.store.update(function (d) {
      var gs = groupsOf(d, root, memberId);
      gs.forEach(function (g) {
        if (g.id !== gid) return;
        g.cards = g.cards.filter(function (c) {
          if (c.id === cid) { backup = { text: c.text, order: c.order }; return false; }
          return true;
        });
      });
    }, 'cards');
    render();
    if (backup) showUndo('已删除一条字卡', function () {
      YM.store.update(function (d) {
        var gs = groupsOf(d, root, memberId);
        var g = gs.filter(function (x) { return x.id === gid; })[0];
        if (!g) return;
        if (g.cards.some(function (c) { return YM.util.normalizeText(c.text) === YM.util.normalizeText(backup.text); })) return;
        g.cards.push({ id: YM.util.uid('c'), text: backup.text, hidden: false, order: backup.order, createdAt: Date.now() });
      }, 'cards');
      render();
    });
  }

  var undoTimer = null;
  function showUndo(text, cb) {
    var bar = document.getElementById('ym-undo');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'ym-undo';
      bar.className = 'batch-bar';
      bar.style.bottom = '84px';
      document.body.appendChild(bar);
    }
    bar.innerHTML = '<span class="batch-count">' + YM.util.escapeHtml(text) + '</span>' +
      '<button class="btn btn-sm" id="undoBtn">撤销</button>';
    bar.classList.remove('hide');
    document.getElementById('undoBtn').onclick = function () {
      cb();
      bar.classList.add('hide');
    };
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { bar.classList.add('hide'); }, 5000);
  }

  function moveCards(fromGid, ids) {
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    if (groups.length < 2) { YM.ui.toast('只有一个分组，先新建一个'); return; }

    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title">移动到</h3>' +
        '<p class="sheet-sub">共 ' + ids.length + ' 条</p>' +
        '<div class="form-stack"><div class="field"><select id="mvGroup">' +
          groups.filter(function (g) { return g.id !== fromGid; }).map(function (g) {
            return '<option value="' + YM.util.escapeHtml(g.id) + '">' + YM.util.escapeHtml(g.name) + '</option>';
          }).join('') +
        '</select></div></div>' +
        '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" id="mvCancel">取消</button>' +
          '<button class="btn btn-primary" id="mvOk">移动</button>' +
        '</div>';

      sheet.querySelector('#mvCancel').addEventListener('click', close);
      sheet.querySelector('#mvOk').addEventListener('click', function () {
        var toGid = sheet.querySelector('#mvGroup').value;
        YM.store.update(function (dd) {
          var gs = groupsOf(dd, root, memberId);
          var from = gs.filter(function (g) { return g.id === fromGid; })[0];
          var to = gs.filter(function (g) { return g.id === toGid; })[0];
          if (!from || !to) return;
          var moving = [];
          from.cards = from.cards.filter(function (c) {
            if (ids.indexOf(c.id) >= 0) { moving.push(c); return false; }
            return true;
          });
          moving.forEach(function (c) {
            c.order = to.cards.length;
            to.cards.push(c);
          });
        }, 'cards');
        close();
        selected = {};
        batchMode = false;
        updateBatchBar();
        render();
        YM.ui.toast('已移动');
      });
    });
  }

  /* ---------- 分组操作 ---------- */
  function groupAction(gid) {
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    var g = groups.filter(function (x) { return x.id === gid; })[0];
    if (!g) return;

    YM.ui.actionSheet({
      title: g.name,
      items: [
        { key: 'add', label: '在这一组添加字卡' },
        { key: 'rename', label: '重命名' },
        { key: 'hide', label: g.hidden ? '取消屏蔽整组' : '屏蔽整组' },
        { key: 'up', label: '上移' },
        { key: 'down', label: '下移' },
        { key: 'delete', label: '删除分组' }
      ]
    }).then(function (item) {
      if (!item) return;
      if (item.key === 'add') addSingleIn(gid);
      if (item.key === 'rename') renameGroup(gid, g.name);
      if (item.key === 'hide') {
        YM.store.update(function (dd) {
          groupsOf(dd, root, memberId).forEach(function (x) { if (x.id === gid) x.hidden = !x.hidden; });
        }, 'cards');
        render();
      }
      if (item.key === 'up' || item.key === 'down') reorderGroup(gid, item.key === 'up' ? -1 : 1);
      if (item.key === 'delete') deleteGroup(gid, g.name, g.cards.length);
    });
  }

  function addSingleIn(gid) {
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    YM.ui.input({
      title: '添加字卡',
      placeholder: '写一句对方可能会说的话',
      rows: 3,
      maxlength: 200,
      required: true,
      okText: '添加'
    }).then(function (text) {
      if (text == null) return;
      var norm = YM.util.normalizeText(text);
      var dup = false;
      YM.store.update(function (dd) {
        var gs = groupsOf(dd, root, memberId);
        gs.forEach(function (gg) {
          gg.cards.forEach(function (c) { if (YM.util.normalizeText(c.text) === norm) dup = true; });
        });
        if (dup) return;
        var g = gs.filter(function (x) { return x.id === gid; })[0];
        if (!g) return;
        g.cards.push({ id: YM.util.uid('c'), text: text, hidden: false, order: g.cards.length, createdAt: Date.now() });
      }, 'cards');
      if (dup) YM.ui.toast('这条已经有了');
      else YM.ui.toast('已添加');
      render();
    });
  }

  function renameGroup(gid, oldName) {
    YM.ui.input({
      title: '重命名分组',
      value: oldName,
      maxlength: 12,
      rows: 1,
      required: true,
      okText: '保存'
    }).then(function (val) {
      if (val == null) return;
      var dup = false;
      YM.store.update(function (d) {
        var gs = groupsOf(d, root, memberId);
        gs.forEach(function (g) { if (g.id !== gid && g.name === val) dup = true; });
        if (dup) return;
        gs.forEach(function (g) { if (g.id === gid) g.name = val; });
      }, 'cards');
      if (dup) YM.ui.toast('这一组已有同名分组');
      render();
    });
  }

  function reorderGroup(gid, delta) {
    YM.store.update(function (d) {
      var gs = groupsOf(d, root, memberId);
      var idx = gs.findIndex(function (g) { return g.id === gid; });
      var target = idx + delta;
      if (idx < 0 || target < 0 || target >= gs.length) return;
      var tmp = gs[idx];
      gs[idx] = gs[target];
      gs[target] = tmp;
      gs.forEach(function (g, i) { g.order = i; });
    }, 'cards');
    render();
  }

  function deleteGroup(gid, name, count) {
    YM.ui.confirm({
      title: '删除分组',
      body: '「' + name + '」及其下的 ' + count + ' 条字卡会一起删除。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      YM.store.update(function (d) {
        var gs = groupsOf(d, root, memberId);
        var idx = gs.findIndex(function (g) { return g.id === gid; });
        if (idx >= 0) gs.splice(idx, 1);
      }, 'cards');
      render();
      YM.ui.toast('已删除分组');
    });
  }

  function newGroup() {
    YM.ui.input({
      title: '新建分组',
      maxlength: 12,
      rows: 1,
      required: true,
      placeholder: '例如：日常',
      okText: '新建'
    }).then(function (val) {
      if (val == null) return;
      var dup = false;
      YM.store.update(function (d) {
        if (root === 'exclusive') ensureExclusive(d, memberId);
        var gs = groupsOf(d, root, memberId);
        if (gs.some(function (g) { return g.name === val; })) { dup = true; return; }
        gs.push({ id: YM.util.uid('g'), name: val, order: gs.length, hidden: false, cards: [] });
      }, 'cards');
      if (dup) { YM.ui.toast('已有同名分组'); return; }
      render();
    });
  }

  /* ---------- 导入导出（JSON） ---------- */
  function roleNameOf(d, mid) {
    var m = (d.members || []).filter(function (x) { return x.id === mid; })[0];
    return m ? m.name : '';
  }

  function exportJson() {
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    var payload = {
      app: '忆梦',
      type: 'cards',
      version: YM.VERSION,
      root: root,
      role: root === 'exclusive' ? roleNameOf(d, memberId) : null,
      exportedAt: YM.util.todayLabel(),
      groups: groups.map(function (g) {
        return {
          name: g.name,
          hidden: !!g.hidden,
          cards: (g.cards || []).map(function (c) {
            return { text: c.text, hidden: !!c.hidden };
          })
        };
      })
    };
    var fname = '忆梦字卡_' + (root === 'general' ? '通用' :
      ('专属_' + (payload.role || '未命名'))) + '_' + YM.util.todayLabel() + '.json';
    YM.util.download(fname, JSON.stringify(payload, null, 2));
    YM.ui.toast('已导出');
  }

  /* 把 JSON 归一成内部结构 {groups:[{name,cards:[文本]}], truncated} */
  function parseJsonCards(text) {
    var raw;
    try {
      raw = JSON.parse(String(text).replace(/^\uFEFF/, ''));
    } catch (e) {
      return null;
    }
    var list = null;
    if (Array.isArray(raw)) list = raw;
    else if (raw && Array.isArray(raw.groups)) list = raw.groups;
    else return null;

    var order = [];
    var map = {};
    var truncated = 0;

    function bucket(name) {
      var key = String(name || '').trim() || '默认分组';
      if (!map[key]) {
        map[key] = { name: key, cards: [] };
        order.push(key);
      }
      return map[key];
    }

    list.forEach(function (g) {
      if (!g) return;
      var name = typeof g === 'string' ? '默认分组' : (g.name || '默认分组');
      var cards = [];
      if (typeof g === 'string') cards = [g];
      else if (Array.isArray(g.cards)) cards = g.cards;
      else if (typeof g.cards === 'string') cards = [g.cards];
      var b = bucket(name);
      cards.forEach(function (c) {
        var t = (c && typeof c === 'object') ? c.text : c;
        if (typeof t !== 'string') return;
        t = t.trim();
        if (!t) return;
        if (t.length > 200) { t = t.slice(0, 200); truncated++; }
        b.cards.push(t);
      });
    });

    return { groups: order.map(function (n) { return map[n]; }), truncated: truncated };
  }

  function importJson() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      document.body.removeChild(input);
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var parsed = parseJsonCards(reader.result || '');
        if (!parsed) { YM.ui.toast('不是有效的字卡 JSON 文件', 3200); return; }
        if (!parsed.groups.length) { YM.ui.toast('JSON 里没有字卡'); return; }
        var stat = analyze(parsed, root, memberId);

        YM.ui.sheet(function (sheet, close) {
          sheet.innerHTML =
            '<h3 class="sheet-title">导入预览</h3>' +
            '<p class="sheet-sub">导入到 ' + (root === 'general' ? '通用' :
              ('专属 · ' + roleNameOf(YM.store.get(), memberId))) + '</p>' +
            '<div class="preview-box">' +
              '新建分组 <b>' + stat.newGroups + '</b> 个<br>' +
              '新增字卡 <b>' + stat.total + '</b> 条<br>' +
              '跳过重复 <b>' + stat.dup + '</b> 条' +
              (stat.truncated ? '<br>超长被截断 <b>' + stat.truncated + '</b> 条' : '') +
            '</div>' +
            '<div class="sheet-actions">' +
              '<button class="btn btn-ghost" id="impCancel">取消</button>' +
              '<button class="btn btn-primary" id="impOk">导入</button>' +
            '</div>';
          sheet.querySelector('#impCancel').addEventListener('click', close);
          sheet.querySelector('#impOk').addEventListener('click', function () {
            var added = applyParsed(parsed, root, memberId);
            close();
            render();
            YM.ui.toast('已导入 ' + added + ' 条');
          });
        });
      };
      reader.readAsText(f, 'utf-8');
    });
    input.click();
  }

  function dedupeAll() {
    var seen = {};
    var removed = 0;
    YM.store.update(function (d) {
      groupsOf(d, root, memberId).forEach(function (g) {
        g.cards = g.cards.filter(function (c) {
          var n = YM.util.normalizeText(c.text);
          if (seen[n]) { removed++; return false; }
          seen[n] = true;
          return true;
        });
      });
    }, 'cards');
    render();
    if (removed) YM.ui.toast('已清理 ' + removed + ' 条重复字卡');
    else YM.ui.toast('没有重复的字卡');
  }

  /* ---------- 快捷动作 ---------- */
  document.getElementById('quickRow').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'import') importJson();
    if (act === 'export') exportJson();
    if (act === 'group') newGroup();
    if (act === 'batch') toggleBatch();
  });

  /* ---------- 菜单 ---------- */
  document.getElementById('btnMenu').addEventListener('click', function () {
    YM.ui.actionSheet({
      items: [
        { key: 'sort', label: '排序方式（当前：' + SORT_LABELS[(YM.store.get().ui || {}).sortMode || 'manual'] + '）' },
        { key: 'dedupe', label: '全库去重' }
      ]
    }).then(function (item) {
      if (!item) return;
      if (item.key === 'sort') cycleSort();
      if (item.key === 'dedupe') dedupeAll();
    });
  });

  function cycleSort() {
    var modes = ['manual', 'recent', 'length', 'alpha'];
    var d = YM.store.get();
    var cur = (d.ui && d.ui.sortMode) || 'manual';
    var next = modes[(modes.indexOf(cur) + 1) % modes.length];
    YM.store.update(function (dd) { dd.ui.sortMode = next; }, 'ui');
    YM.ui.toast('排序：' + SORT_LABELS[next]);
    render();
  }

  function toggleBatch() {
    batchMode = !batchMode;
    if (!batchMode) selected = {};
    updateBatchBar();
    render();
    if (batchMode) YM.ui.toast('点字卡勾选，底部可移动或删除');
  }

  /* ---------- 交互绑定 ---------- */
  groupList.addEventListener('click', function (e) {
    var eye = e.target.closest('[data-eye]');
    if (eye) {
      e.stopPropagation();
      toggleCard(eye.getAttribute('data-eye'));
      return;
    }
    var gmore = e.target.closest('[data-gmore]');
    if (gmore) {
      e.stopPropagation();
      groupAction(gmore.getAttribute('data-gmore'));
      return;
    }
    var toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      var gid = toggle.getAttribute('data-toggle');
      openMap[groupKey(gid)] = !openMap[groupKey(gid)];
      if (openMap[groupKey(gid)] == null) openMap[groupKey(gid)] = true;
      render();
      return;
    }
    var row = e.target.closest('.card-row');
    if (row) {
      var cid = row.getAttribute('data-cid');
      var gid2 = row.getAttribute('data-gid');
      if (batchMode) {
        if (selected[cid]) delete selected[cid];
        else selected[cid] = true;
        updateBatchBar();
        render();
      } else {
        cardAction(cid, gid2);
      }
    }
  });

  document.getElementById('segRoot').addEventListener('click', function (e) {
    var item = e.target.closest('[data-root]');
    if (!item) return;
    root = item.getAttribute('data-root');
    selected = {};
    batchMode = false;
    updateBatchBar();
    render();
  });

  document.getElementById('kindTabs').addEventListener('click', function (e) {
    var item = e.target.closest('[data-kind]');
    if (!item) return;
    var k = item.getAttribute('data-kind');
    if (k === kind) return;
    kind = k;
    selected = {};
    batchMode = false;
    updateBatchBar();
    render();
  });

  searchInput.addEventListener('input', YM.util.debounce(function () {
    query = searchInput.value.trim();
    render();
  }, 200));

  document.getElementById('btnAdd').addEventListener('click', function () {
    YM.ui.actionSheet({
      items: [
        { key: 'single', label: '单条添加' },
        { key: 'batch', label: '批量添加' }
      ]
    }).then(function (item) {
      if (!item) return;
      if (item.key === 'single') addSingle();
      if (item.key === 'batch') addBatch();
    });
  });

  document.getElementById('btnEmptyAdd').addEventListener('click', function () {
    if (root === 'exclusive' && !(YM.store.get().members || []).length) {
      location.href = 'settings.html#members';
      return;
    }
    addSingle();
  });

  document.getElementById('btnBatchMove').addEventListener('click', function () {
    var ids = Object.keys(selected);
    if (!ids.length) { YM.ui.toast('还没有选中任何字卡'); return; }
    var d = YM.store.get();
    var groups = groupsOf(d, root, memberId);
    var gid = null;
    groups.forEach(function (g) {
      g.cards.forEach(function (c) { if (ids.indexOf(c.id) >= 0 && !gid) gid = g.id; });
    });
    if (!gid) return;
    moveCards(gid, ids);
  });

  document.getElementById('btnBatchDelete').addEventListener('click', function () {
    var ids = Object.keys(selected);
    if (!ids.length) { YM.ui.toast('还没有选中任何字卡'); return; }
    YM.ui.confirm({
      title: '删除所选',
      body: '将删除 ' + ids.length + ' 条字卡，不可恢复。',
      okText: '删除',
      danger: true
    }).then(function (ok) {
      if (!ok) return;
      YM.store.update(function (d) {
        groupsOf(d, root, memberId).forEach(function (g) {
          g.cards = g.cards.filter(function (c) { return ids.indexOf(c.id) < 0; });
        });
      }, 'cards');
      selected = {};
      updateBatchBar();
      render();
    });
  });

  document.getElementById('btnBatchExit').addEventListener('click', function () {
    batchMode = false;
    selected = {};
    updateBatchBar();
    render();
  });

  YM.event.on('ym:data', function (detail) {
    var scope = (detail && detail.scope) || 'all';
    // 聊天里的消息写入不影响字卡库，跳过，避免后台回复把正在展开的下拉框顶掉
    if (scope === 'settings' || scope === 'messages') return;
    render();
  });

  render();
})();
