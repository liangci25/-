/* ============================================================
   忆梦 · common.js
   内核：存储 / 事件 / 工具 / 界面组件 / 主题 / 音效 / 回复引擎 / 任务调度
   规则：页面脚本不得直接操作 localStorage，一律通过 YM.store
   ============================================================ */
(function () {
  'use strict';

  var KEY_DATA = 'ym_data_v1';
  var KEY_RT = 'ym_runtime_v1';
  var KEY_BK = 'ym_data_backup_auto';
  var KEY_CORRUPT = 'ym_data_corrupt_v1';

  var YM = (window.YM = {});
  YM.VERSION = '1.0';

  /* ==========================================================
     01 工具
     ========================================================== */
  var util = (YM.util = {});

  util.uid = function (prefix) {
    return (
      (prefix || 'id') +
      '_' +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 6)
    );
  };

  util.escapeHtml = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  util.randInt = function (min, max) {
    min = Math.floor(Number(min));
    max = Math.floor(Number(max));
    if (!isFinite(min)) min = 0;
    if (!isFinite(max)) max = min;
    if (min > max) { var t = min; min = max; max = t; }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  util.clamp = function (v, min, max) {
    v = Number(v);
    if (!isFinite(v)) v = min;
    return Math.min(max, Math.max(min, v));
  };

  util.pickOne = function (arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  };

  util.shuffle = function (arr) {
    var out = (arr || []).slice();
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = out[i]; out[i] = out[j]; out[j] = t;
    }
    return out;
  };

  util.normalizeText = function (s) {
    return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
  };

  util.debounce = function (fn, wait) {
    var timer = null;
    return function () {
      var args = arguments, self = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, wait || 200);
    };
  };

  util.pad2 = function (n) { return n < 10 ? '0' + n : '' + n; };

  util.formatRelative = function (ts) {
    var now = Date.now();
    var diff = Math.max(0, now - ts);
    var min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return min + ' 分钟前';
    var hour = Math.floor(min / 60);
    if (hour < 24) return hour + ' 小时前';
    if (hour < 48) return '昨天';
    var d = new Date(ts);
    return util.pad2(d.getMonth() + 1) + '-' + util.pad2(d.getDate());
  };

  // 一律显年月日时分，不用「3 天前」这类相对说法：一个月内省略年份，超过一个月带两位年份
  util.formatStamp = function (ts) {
    var d = new Date(ts);
    var now = new Date();
    var md = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + util.pad2(d.getHours()) + ':' + util.pad2(d.getMinutes());
    if (now.getTime() - d.getTime() <= 30 * 86400000) return md;
    return util.pad2(d.getFullYear() % 100) + '年' + md;
  };

  util.formatClock = function (ts) {
    var d = new Date(ts);
    var hm = util.pad2(d.getHours()) + ':' + util.pad2(d.getMinutes());
    var now = new Date();
    var sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (sameDay) return hm;
    return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm;
  };

  /**
   * 气泡下的消息时间：当天只给「20:39」；昨天 / 前天前面挂「昨天」「前天」；
   * 更早给「11月8日 20:39」，跨年再补两位年份「25年11月8日 20:39」。
   */
  util.formatMsgTime = function (ts) {
    var d = new Date(ts);
    var now = new Date();
    var hm = util.pad2(d.getHours()) + ':' + util.pad2(d.getMinutes());
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    var diff = Math.round((today - day) / 86400000);
    if (diff === 0) return hm;
    if (diff === 1) return '昨天 ' + hm;
    if (diff === 2) return '前天 ' + hm;
    var md = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + hm;
    if (d.getFullYear() === now.getFullYear()) return md;
    return util.pad2(d.getFullYear() % 100) + '年' + md;
  };

  util.formatDateLabel = function (ts) {
    var d = new Date(ts);
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  };

  /**
   * 一个点离现在多久：一个月内用相对说法（刚刚 / 5分钟前 / 一天前 / 三个星期前），
   * 超过一个月落到绝对时间「26年11月8日20时44分」。问卷「填写于」用它。
   */
  util.formatSince = function (ts) {
    var d = new Date(ts);
    var now = new Date();
    var gap = now.getTime() - d.getTime();
    if (gap < 60000) return '刚刚';
    var mins = Math.floor(gap / 60000);
    if (mins < 60) return mins + '分钟前';
    var hours = Math.floor(gap / 3600000);
    if (hours < 24) return hours + '小时前';
    var days = Math.floor(gap / 86400000);
    if (days <= 1) return '一天前';
    if (days <= 6) return days + '天前';
    if (days <= 13) return '一个星期前';
    if (days <= 20) return '两个星期前';
    if (days < 30) return '三个星期前';
    return util.pad2(d.getFullYear() % 100) + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日' +
      d.getHours() + '时' + util.pad2(d.getMinutes()) + '分';
  };

  util.dayKey = function (ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + util.pad2(d.getMonth() + 1) + '-' + util.pad2(d.getDate());
  };

  util.fileToBase64 = function (file, maxBytes) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('no_file')); return; }
      if (maxBytes && file.size > maxBytes) {
        reject(new Error('too_large'));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var s = String(reader.result || '');
        if (!/^data:/.test(s) || s.length < 12) { reject(new Error('read_failed')); return; }
        resolve(s);
      };
      reader.onerror = function () { reject(new Error('read_failed')); };
      reader.readAsDataURL(file);
    });
  };

  util.download = function (filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  };

  util.bytes = function (data) {
    try { return new Blob([JSON.stringify(data)]).size; } catch (e) { return 0; }
  };

  util.formatBytes = function (n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  };

  util.stamp = function () {
    var d = new Date();
    return (
      d.getFullYear() +
      util.pad2(d.getMonth() + 1) +
      util.pad2(d.getDate()) +
      '_' +
      util.pad2(d.getHours()) +
      util.pad2(d.getMinutes())
    );
  };

  util.todayLabel = function () {
    var d = new Date();
    return d.getFullYear() + '-' + util.pad2(d.getMonth() + 1) + '-' + util.pad2(d.getDate());
  };

  util.cssSafe = function (css) {
    var s = String(css || '');
    var bad = [/<\/style/i, /javascript:/i, /expression\s*\(/i, /@import/i, /behavior\s*:/i];
    for (var i = 0; i < bad.length; i++) { if (bad[i].test(s)) return false; }
    return true;
  };

  // 一条卡片内容归哪一类：图片直链 → 表情包；纯表情 → emoji；其余 → 字卡
  util.cardKind = function (text) {
    var t = String(text || '').trim();
    if (!t) return 'text';
    if (/^(https?:)?\/\//i.test(t) || /^data:image\//i.test(t)) return 'sticker';
    if (/^[a-z0-9._-]+\.(png|jpe?g|gif|webp|bmp|avif)(\?|#|$)/i.test(t)) return 'sticker';
    try {
      var onlyEmoji = /^[\p{Extended_Pictographic}\u200d\uFE0F\u{1F3FB}-\u{1F3FF}\s]+$/u;
      if (t.length <= 12 && onlyEmoji.test(t)) return 'emoji';
    } catch (e) { /* 老浏览器不支持 Unicode 属性，一律归为字卡 */ }
    return 'text';
  };

  util.qs = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  };

  /* ==========================================================
     02 默认数据
     ========================================================== */
  function defaultSettings() {
    return {
      theme: 'auto',
      accentColor: '#4B5BD6',
      fontSize: 15,
      fontFamily: '"Songti SC", "SimSun", "Noto Serif CJK SC", serif',
      fontUrl: '',
      bubblePreset: 'rounded',
      bubbleCssUser: '',
      bubbleCssPeer: '',
      showName: true,
      showAvatar: true,
      showTimestamp: true,
      showReadStatus: true,
      readStyle: 'text',
      typingText: '正在输入…',
      mergeSymbols: ['，', '、', '。', ' ', '～'],
      soundEnabled: true,
      soundList: [
        { id: 'snd_default_1', name: '轻叮', src: 'builtin:ding1', enabled: true, builtin: true },
        { id: 'snd_default_2', name: '木鱼', src: 'builtin:wood', enabled: true, builtin: true },
        { id: 'snd_default_3', name: '气泡', src: 'builtin:pop', enabled: true, builtin: true }
      ],
      userSoundId: 'snd_default_1',
      peerSoundRandom: true,
      notifyEnabled: true,
      notifySystem: false,
      openingAnimation: true,
      chatBackground: { type: 'none', value: '', dim: 0.88 }
    };
  }

  function defaultParams() {
    return {
      delayMin: 3,
      delayMax: 10,
      replyMin: 1,
      replyMax: 3,
      skipChance: 30,
      activeEnabled: false,
      activeMinMin: 30,
      activeMaxMin: 90,
      quoteEnabled: true,
      mergeEnabled: false,
      groupEnabled: false,
      memberIds: [],
      owner: 'user',       // 我发起群聊，群主永远是我
      muted: {},           // 被禁言的成员：{ memberId: { at: 时间戳 } }
      notice: '',          // 群公告
      status: 'auto',      // 角色此刻的状态：auto / online / busy / away / rest
      soundEnabled: null,
      notifyEnabled: null,
      typingText: null,
      background: { type: 'inherit', value: '', dim: null }
    };
  }

  function defaultGroup(name, order) {
    return { id: 'g_default', name: name || '默认分组', order: order || 0, hidden: false, cards: [] };
  }

  function defaultData() {
    return {
      version: YM.VERSION,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: defaultSettings(),
      members: [],
      sessions: [],
      cardStore: {
        general: { hidden: false, groups: [defaultGroup('默认分组', 0)] },
        exclusive: {}
      },
      letters: [],
      moments: [],
      me: { name: '我', avatar: '', bio: '' },
      ui: { lastSessionId: null, lastImportAt: 0, capacityWarnAt: 0, sortMode: 'manual' }
    };
  }

  YM.defaultData = defaultData;
  YM.defaultParams = defaultParams;

  function migrate(d) {
    var def = defaultData();
    if (!d || typeof d !== 'object') return def;
    if (!d.settings || typeof d.settings !== 'object') d.settings = def.settings;
    var s = d.settings, ds = def.settings;
    for (var k in ds) {
      if (!(k in s)) s[k] = ds[k];
    }
    if (!Array.isArray(s.mergeSymbols) || !s.mergeSymbols.length) s.mergeSymbols = ds.mergeSymbols;
    if (!Array.isArray(s.soundList)) s.soundList = ds.soundList;
    if (!Array.isArray(d.members)) d.members = [];
    if (!Array.isArray(d.sessions)) d.sessions = [];
    if (!Array.isArray(d.letters)) d.letters = [];
    if (!Array.isArray(d.moments)) d.moments = [];
    if (!d.me || typeof d.me !== 'object') d.me = def.me;
    if (typeof d.me.name !== 'string' || !d.me.name) d.me.name = def.me.name;
    if (typeof d.me.avatar !== 'string') d.me.avatar = '';
    if (typeof d.me.bio !== 'string') d.me.bio = '';
    if (!d.cardStore || typeof d.cardStore !== 'object') d.cardStore = def.cardStore;
    if (!d.cardStore.general || !Array.isArray(d.cardStore.general.groups)) {
      d.cardStore.general = { hidden: false, groups: [defaultGroup('默认分组', 0)] };
    }
    if (!d.cardStore.exclusive || typeof d.cardStore.exclusive !== 'object') d.cardStore.exclusive = {};
    if (!d.ui || typeof d.ui !== 'object') d.ui = def.ui;
    if (!('sortMode' in d.ui)) d.ui.sortMode = 'manual';
    d.sessions.forEach(function (sn) {
      var dp = defaultParams();
      if (!sn.params) sn.params = dp;
      for (var pk in dp) { if (!(pk in sn.params)) sn.params[pk] = dp[pk]; }
      if (!Array.isArray(sn.params.memberIds)) sn.params.memberIds = [];
      if (!sn.params.muted || typeof sn.params.muted !== 'object') sn.params.muted = {};
      if (typeof sn.params.notice !== 'string') sn.params.notice = '';
      if (!Array.isArray(sn.messages)) sn.messages = [];
      if (!sn.params.background) sn.params.background = { type: 'inherit', value: '', dim: null };
      sn.params.delayMin = util.clamp(sn.params.delayMin, 1, 120);
      sn.params.delayMax = util.clamp(Math.max(sn.params.delayMax, sn.params.delayMin), 1, 120);
      sn.params.replyMin = util.clamp(sn.params.replyMin, 1, 3);
      sn.params.replyMax = util.clamp(Math.max(sn.params.replyMax, sn.params.replyMin), 1, 3);
      sn.params.skipChance = util.clamp(sn.params.skipChance, 0, 100);
      // 专属字卡按角色绑定：老会话没有 memberId 时，按同名角色补齐
      if (!sn.memberId) {
        var role = (d.members || []).filter(function (m) { return m.name === sn.name; })[0];
        sn.memberId = role ? role.id : null;
      } else if (!(d.members || []).some(function (m) { return m.id === sn.memberId; })) {
        sn.memberId = null;
      }
    });
    // 角色名与头像统一跟会话走：字卡库下拉、设置里的角色区都显示会话列表上的名字
    d.sessions.forEach(function (sn) {
      if (!sn.memberId || (sn.params && sn.params.groupEnabled)) return;
      var m = (d.members || []).filter(function (x) { return x.id === sn.memberId; })[0];
      if (!m) return;
      if (sn.name && m.name !== sn.name) m.name = sn.name;
      if (sn.avatar && m.avatar !== sn.avatar) m.avatar = sn.avatar;
    });
    d.version = d.version || YM.VERSION;
    return d;
  }

  /* ==========================================================
     03 存储
     ========================================================== */
  var store = (YM.store = {});
  store.corrupt = false;

  function ls() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  store.available = function () {
    var s = ls();
    if (!s) return false;
    try {
      s.setItem('ym_probe', '1');
      s.removeItem('ym_probe');
      return true;
    } catch (e) { return false; }
  };

  var memoryData = null;

  store.get = function () {
    var s = ls();
    if (!s) {
      if (!memoryData) memoryData = defaultData();
      return memoryData;
    }
    var raw = s.getItem(KEY_DATA);
    if (!raw) {
      var d = defaultData();
      try { s.setItem(KEY_DATA, JSON.stringify(d)); } catch (e) {}
      return d;
    }
    try {
      var parsed = JSON.parse(raw);
      return migrate(parsed);
    } catch (e) {
      store.corrupt = true;
      try { s.setItem(KEY_CORRUPT, raw); } catch (e2) {}
      var def = defaultData();
      try { s.setItem(KEY_DATA, JSON.stringify(def)); } catch (e3) {}
      return def;
    }
  };

  store.save = function (data, silent) {
    data.updatedAt = Date.now();
    var s = ls();
    var size = util.bytes(data);
    if (!s) {
      memoryData = data;
      return { ok: true, size: size, memory: true };
    }
    try {
      s.setItem(KEY_DATA, JSON.stringify(data));
      return { ok: true, size: size };
    } catch (e) {
      if (!silent) {
        var isQuota = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
        ui.toast(isQuota ? '存储已满，请先导出备份' : '数据保存失败，请刷新重试');
      }
      return { ok: false, size: size, error: e && e.name ? e.name : 'save_failed' };
    }
  };

  store.update = function (mutator, scope, silent) {
    var d = store.get();
    mutator(d);
    var res = store.save(d, silent);
    if (res.ok) YM.event.emit('ym:data', { scope: scope || 'all' });
    return res;
  };

  /* ==========================================================
     03.5 作息感应（息屏推断睡眠）
     ----------------------------------------------------------
     读不到手机硬件，就用「页面还有没有在动」来推断：
     前台时每 60 秒留一个心跳；息屏 / 切走以后页面不再有心跳。
     下次回到前台时，若从「最后一次有心跳」到现在这段够长，
     就把这一段当成一觉，写进 d.tide.sleep[醒来的那天]。
     ========================================================== */
  var KEY_AWAKE = 'ym_awake';
  var ASLEEP_MIN = 120 * 60 * 1000;     // 短于 2 小时不作数
  var ASLEEP_MAX = 16 * 60 * 60 * 1000; // 长于 16 小时当作没在用
  var awakeTimer = null;

  var watch = (YM.sleepWatch = {});

  watch.stamp = function () {
    var s = ls();
    if (!s) return;
    try { s.setItem(KEY_AWAKE, String(Date.now())); } catch (e) {}
  };

  watch.last = function () {
    var s = ls();
    var v = s ? +s.getItem(KEY_AWAKE) : 0;
    return v > 0 ? v : 0;
  };

  function hhmm(ts) {
    var x = new Date(ts);
    return util.pad2(x.getHours()) + ':' + util.pad2(x.getMinutes());
  }

  /* 把这段「没动静」记成睡眠；已经有手记的那天不动 */
  watch.guess = function (now) {
    var last = watch.last();
    if (!last || now <= last) return null;
    var gap = now - last;
    if (gap < ASLEEP_MIN || gap > ASLEEP_MAX) return null;
    var key = util.dayKey(now);
    var d = store.get();
    var bag = (d && d.tide && d.tide.sleep) || {};
    if (bag[key]) return null;
    var rec = { bed: hhmm(last), wake: hhmm(now), createdAt: Date.now(), auto: true };
    store.update(function (dd) {
      if (!dd.tide) dd.tide = {};
      if (!dd.tide.sleep) dd.tide.sleep = {};
      dd.tide.sleep[key] = rec;
    }, 'all');
    var got = { key: key, rec: rec };
    YM.event.emit('ym:sleep-auto', got);
    return got;
  };

  watch.boot = function () {
    watch.stamp();
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        watch.guess(Date.now());
        watch.stamp();
        startBeat();
      } else {
        watch.stamp();
        stopBeat();
      }
    });
    document.addEventListener('pointerdown', watch.stamp, { passive: true });
    window.addEventListener('focus', function () {
      watch.guess(Date.now());
      watch.stamp();
    });
    startBeat();
  };

  function startBeat() {
    if (awakeTimer) return;
    awakeTimer = setInterval(function () {
      if (document.visibilityState === 'visible') watch.stamp();
    }, 60000);
  }

  function stopBeat() {
    if (awakeTimer) { clearInterval(awakeTimer); awakeTimer = null; }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch.boot);
  } else {
    watch.boot();
  }

  store.size = function () {
    var s = ls();
    var raw = s ? s.getItem(KEY_DATA) : '';
    return raw ? Math.round(new Blob([raw]).size) : 0;
  };

  store.backup = function () {
    var s = ls();
    if (!s) return false;
    try {
      s.setItem(KEY_BK, JSON.stringify(store.get()));
      return true;
    } catch (e) { return false; }
  };

  store.hasBackup = function () {
    var s = ls();
    return !!(s && s.getItem(KEY_BK));
  };

  store.restoreBackup = function () {
    var s = ls();
    if (!s) return { ok: false, error: 'no_storage' };
    var raw = s.getItem(KEY_BK);
    if (!raw) return { ok: false, error: 'no_backup' };
    try {
      var d = migrate(JSON.parse(raw));
      s.setItem(KEY_DATA, JSON.stringify(d));
      return { ok: true };
    } catch (e) { return { ok: false, error: 'corrupt' }; }
  };

  store.exportObject = function () {
    return JSON.parse(JSON.stringify(store.get()));
  };

  store.exportAll = function () {
    var d = store.get();
    util.download('忆梦_全量备份_' + util.stamp() + '.json', JSON.stringify(d, null, 2), 'application/json');
  };

  store.importAll = function (json) {
    var d;
    try { d = typeof json === 'string' ? JSON.parse(json) : json; }
    catch (e) { return { ok: false, error: 'parse' }; }
    if (!d || typeof d !== 'object' || !d.sessions || !d.cardStore || !d.settings) {
      return { ok: false, error: 'shape' };
    }
    if (!Array.isArray(d.sessions) || !d.cardStore.general) {
      return { ok: false, error: 'shape' };
    }
    var versionWarn = String(d.version || '') > YM.VERSION;
    store.backup();
    var normalized = migrate(d);
    var res = store.save(normalized);
    if (!res.ok) return { ok: false, error: 'save' };
    var summary = {
      sessions: normalized.sessions.length,
      messages: normalized.sessions.reduce(function (n, s) { return n + s.messages.length; }, 0),
      cards: countCards(normalized),
      exportedAt: normalized.updatedAt || 0,
      versionWarn: versionWarn
    };
    return { ok: true, summary: summary };
  };

  function countCards(d) {
    var n = 0;
    var g = d.cardStore.general;
    if (g && g.groups) g.groups.forEach(function (grp) { n += grp.cards.length; });
    var ex = d.cardStore.exclusive || {};
    Object.keys(ex).forEach(function (mid) {
      (ex[mid].groups || []).forEach(function (grp) { n += grp.cards.length; });
    });
    return n;
  }
  YM.countCards = countCards;

  store.reset = function () {
    var s = ls();
    store.backup();
    if (s) {
      try {
        s.removeItem(KEY_DATA);
        s.removeItem(KEY_RT);
      } catch (e) {}
    }
    memoryData = defaultData();
    return { ok: true };
  };

  /* ==========================================================
     04 事件
     ========================================================== */
  var event = (YM.event = {});
  var handlers = {};
  var bc = null;
  try { if (window.BroadcastChannel) bc = new BroadcastChannel('ym'); } catch (e) { bc = null; }

  event.on = function (type, fn) {
    if (!handlers[type]) handlers[type] = [];
    handlers[type].push(fn);
    return function () { event.off(type, fn); };
  };

  event.off = function (type, fn) {
    if (!handlers[type]) return;
    handlers[type] = handlers[type].filter(function (h) { return h !== fn; });
  };

  event.emit = function (type, detail, broadcast) {
    (handlers[type] || []).forEach(function (fn) {
      try { fn(detail); } catch (e) { console.error(e); }
    });
    if (broadcast !== false && bc) {
      try { bc.postMessage({ type: type, detail: detail }); } catch (e) {}
    }
  };

  if (bc) {
    bc.onmessage = function (ev) {
      var msg = ev.data || {};
      if (msg.type) {
        (handlers[msg.type] || []).forEach(function (fn) {
          try { fn(msg.detail); } catch (e) {}
        });
      }
    };
  }

  window.addEventListener('storage', function (e) {
    if (e.key === KEY_DATA) YM.event.emit('ym:data', { scope: 'external' }, false);
    if (e.key === KEY_RT) YM.event.emit('ym:realtime', { scope: 'external' }, false);
  });

  /* ==========================================================
     05 界面组件
     ========================================================== */
  var ui = (YM.ui = {});

  ui.toast = (function () {
    var el = null, timer = null;
    return function (text, duration) {
      if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
      }
      el.textContent = text;
      el.classList.add('show');
      clearTimeout(timer);
      timer = setTimeout(function () { el.classList.remove('show'); }, duration || 2200);
    };
  })();

  function makeMask(center) {
    var mask = document.createElement('div');
    mask.className = 'mask' + (center ? ' center' : '');
    document.body.appendChild(mask);
    return mask;
  }

  ui.closeMask = function (mask) {
    if (mask && mask.parentNode) mask.parentNode.removeChild(mask);
  };

  ui.confirm = function (opts) {
    return new Promise(function (resolve) {
      var mask = makeMask(true);
      var box = document.createElement('div');
      box.className = 'dialog';
      box.innerHTML =
        '<h3 class="dialog-title">' + util.escapeHtml(opts.title || '确认') + '</h3>' +
        '<p class="dialog-body">' + util.escapeHtml(opts.body || '') + '</p>' +
        '<div class="dialog-actions">' +
        '<button class="btn btn-ghost" data-act="cancel">' + util.escapeHtml(opts.cancelText || '取消') + '</button>' +
        '<button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ok">' +
        util.escapeHtml(opts.okText || '确认') + '</button>' +
        '</div>';
      mask.appendChild(box);
      function done(val) { ui.closeMask(mask); resolve(val); }
      box.addEventListener('click', function (e) {
        var act = e.target.getAttribute('data-act');
        if (act === 'ok') done(true);
        if (act === 'cancel') done(false);
      });
      mask.addEventListener('click', function (e) { if (e.target === mask) done(false); });
    });
  };

  ui.input = function (opts) {
    return new Promise(function (resolve) {
      var mask = makeMask(true);
      var box = document.createElement('div');
      box.className = 'dialog';
      box.innerHTML =
        '<h3 class="dialog-title">' + util.escapeHtml(opts.title || '输入') + '</h3>' +
        (opts.body ? '<p class="dialog-body">' + util.escapeHtml(opts.body) + '</p>' : '') +
        '<div class="field"><textarea rows="' + (opts.rows || 3) + '" maxlength="' + (opts.maxlength || 200) +
        '" placeholder="' + util.escapeHtml(opts.placeholder || '') + '"></textarea></div>' +
        '<div class="dialog-actions">' +
        '<button class="btn btn-ghost" data-act="cancel">取消</button>' +
        '<button class="btn btn-primary" data-act="ok">' + util.escapeHtml(opts.okText || '确定') + '</button>' +
        '</div>';
      mask.appendChild(box);
      var ta = box.querySelector('textarea');
      ta.value = opts.value || '';
      setTimeout(function () { ta.focus(); }, 30);
      function done(val) { ui.closeMask(mask); resolve(val); }
      box.addEventListener('click', function (e) {
        var act = e.target.getAttribute('data-act');
        if (act === 'cancel') done(null);
        if (act === 'ok') {
          var v = ta.value.trim();
          if (opts.required && !v) { ui.toast('不能为空'); return; }
          done(v);
        }
      });
      mask.addEventListener('click', function (e) { if (e.target === mask) done(null); });
    });
  };

  ui.sheet = function (build) {
    var mask = makeMask(false);
    var sheet = document.createElement('div');
    sheet.className = 'sheet';
    var handle = document.createElement('div');
    handle.className = 'sheet-handle';
    sheet.appendChild(handle);
    mask.appendChild(sheet);
    function close() { ui.closeMask(mask); }
    mask.addEventListener('click', function (e) { if (e.target === mask) close(); });
    build(sheet, close);
    return { close: close, el: sheet };
  };

  ui.actionSheet = function (opts) {
    return new Promise(function (resolve) {
      var mask = makeMask(false);
      var sheet = document.createElement('div');
      sheet.className = 'sheet';
      var html = '<div class="sheet-handle"></div>';
      if (opts.title) html += '<h3 class="sheet-title">' + util.escapeHtml(opts.title) + '</h3>';
      (opts.items || []).forEach(function (it, i) {
        html += '<button class="row" style="width:100%;text-align:left;padding:12px 0" data-idx="' + i + '">' +
          '<span class="row-main"><span class="row-title">' + util.escapeHtml(it.label) + '</span></span></button>' +
          '<div class="divider"></div>';
      });
      html += '<button class="btn btn-ghost btn-block mt-16" data-cancel="1">取消</button>';
      sheet.innerHTML = html;
      mask.appendChild(sheet);
      function done(v) { ui.closeMask(mask); resolve(v); }
      sheet.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        if (btn.hasAttribute('data-cancel')) { done(null); return; }
        var idx = Number(btn.getAttribute('data-idx'));
        if (!isNaN(idx)) done(opts.items[idx]);
      });
      mask.addEventListener('click', function (e) { if (e.target === mask) done(null); });
    });
  };

  ui.setSwitch = function (el, on) {
    el.setAttribute('aria-checked', on ? 'true' : 'false');
  };

  /* ---------- 上升面板：按 pageSize 分页，超出可横向滑动 ---------- */
  ui.panel = function (opts) {
    var root = opts.root;
    var track = root.querySelector('.action-track');
    var dots = root.querySelector('.action-dots');
    var items = opts.items || [];
    var pageSize = opts.pageSize || 6;
    var cols = opts.cols || 3;

    var pages = [];
    for (var i = 0; i < items.length; i += pageSize) {
      pages.push(items.slice(i, i + pageSize));
    }

    // 只有一页时按实际项数分列，两三项也能均分整宽，不留空列
    var placed = pages.length === 1 ? Math.min(cols, items.length || cols) : cols;
    root.style.setProperty('--cols', placed);
    track.innerHTML = pages.map(function (group) {
      return '<div class="action-page">' + group.map(function (it) {
        return '<button class="action-item" data-key="' + util.escapeHtml(it.key) + '">' +
          '<span class="action-ico">' + (it.icon || '') + '</span>' +
          '<span>' + util.escapeHtml(it.label) + '</span></button>';
      }).join('') + '</div>';
    }).join('');

    dots.innerHTML = pages.map(function (_, idx) {
      return '<i' + (idx === 0 ? ' class="is-active"' : '') + '></i>';
    }).join('');
    dots.classList.toggle('is-multi', pages.length > 1);

    // 面板高度按实际内容算（scrollHeight 已含内边距），打开时升到该高度
    var h = root.scrollHeight + (pages.length > 1 ? 16 : 0) + 2;
    root.style.setProperty('--panel-h', Math.round(h) + 'px');

    function index() {
      var w = track.clientWidth || 1;
      return Math.round(track.scrollLeft / w);
    }

    function syncDots() {
      var idx = index();
      Array.prototype.forEach.call(dots.children, function (dot, i) {
        dot.classList.toggle('is-active', i === idx);
      });
    }

    track.addEventListener('scroll', syncDots, { passive: true });

    function toggle(force) {
      var open = typeof force === 'boolean' ? force : !root.classList.contains('is-open');
      root.classList.toggle('is-open', open);
      if (opts.btn) {
        opts.btn.classList.toggle('is-on', open);
        opts.btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
      return open;
    }

    track.addEventListener('click', function (e) {
      var el = e.target.closest('.action-item');
      if (!el) return;
      var key = el.getAttribute('data-key');
      var item = null;
      items.forEach(function (x) { if (x.key === key) item = x; });
      if (!item) return;
      toggle(false);
      if (opts.onPick) opts.onPick(item);
    });

    return { toggle: toggle, close: function () { toggle(false); }, pages: pages.length };
  };

  /* ==========================================================
     06 主题与样式
     ========================================================== */
  var theme = (YM.theme = {});

  function systemDark() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
    catch (e) { return false; }
  }

  theme.resolve = function (mode, settings) {
    if (mode === 'auto') return systemDark() ? 'dark' : 'light';
    return mode === 'dark' ? 'dark' : 'light';
  };

  theme.apply = function () {
    var d = store.get();
    var s = d.settings;
    var mode = theme.resolve(s.theme, s);
    document.documentElement.setAttribute('data-theme', mode);
    return mode;
  };

  theme.setMode = function (mode) {
    store.update(function (d) { d.settings.theme = mode; }, 'settings');
    theme.apply();
  };

  theme.cycle = function () {
    var d = store.get();
    var order = ['light', 'dark', 'auto'];
    var next = order[(order.indexOf(d.settings.theme) + 1) % order.length];
    theme.setMode(next);
    return next;
  };

  theme.iconFor = function (mode) {
    if (mode === 'light') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17L5.6 18.4"/></svg>';
    }
    if (mode === 'dark') {
      return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.6 8.6 0 1 0 10.5 10.5z"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17" fill="currentColor" fill-opacity="0.35" stroke="none"/></svg>';
  };

  var style = (YM.style = {});

  style.applyAll = function () {
    var d = store.get();
    var s = d.settings;
    var root = document.documentElement;
    root.style.setProperty('--font-size', util.clamp(s.fontSize, 12, 22) + 'px');
    root.style.setProperty('--accent', s.accentColor || '#4B5BD6');
    root.style.setProperty('--accent-weak', hexToRgba(s.accentColor || '#4B5BD6', 0.12));

    var fam = s.fontUrl ? '"YMUserFont", ' + (s.fontFamily || 'serif') : (s.fontFamily || 'serif');
    root.style.setProperty('--font-family', fam);

    var bubbleMap = {
      rounded: 'border-radius: 16px 16px 16px 16px;',
      capsule: 'border-radius: 22px;',
      square: 'border-radius: 4px;',
      outline: 'border-radius: 14px;'
    };
    var base = bubbleMap[s.bubblePreset] || bubbleMap.rounded;
    var userCss = util.cssSafe(s.bubbleCssUser) ? s.bubbleCssUser : '';
    var peerCss = util.cssSafe(s.bubbleCssPeer) ? s.bubbleCssPeer : '';

    var css = '';
    if (s.fontUrl) {
      css += '@font-face{font-family:"YMUserFont";src:url("' + s.fontUrl.replace(/"/g, '%22') + '");font-display:swap;}';
    }
    css += '.msg-bubble{';
    css += base;
    if (s.bubblePreset === 'outline') css += 'background:transparent;border:1px solid var(--line-strong);';
    css += '}';
    css += '.msg-bubble.user{' + userCss + '}';
    css += '.msg-bubble.peer{' + peerCss + '}';

    var el = document.getElementById('ym-dynamic-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'ym-dynamic-style';
      document.head.appendChild(el);
    }
    el.textContent = css;

    if (s.fontUrl) {
      try {
        if (document.fonts && document.fonts.load) {
          document.fonts.load('16px YMUserFont').catch(function () {});
        }
      } catch (e) {}
    }
  };

  function hexToRgba(hex, alpha) {
    var m = /^#?([a-f0-9]{6}|[a-f0-9]{3})$/i.exec(String(hex).trim());
    if (!m) return 'rgba(75,91,214,' + alpha + ')';
    var h = m[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16);
    var g = parseInt(h.slice(2, 4), 16);
    var b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }
  YM.hexToRgba = hexToRgba;

  // 跟随系统主题
  try {
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        var d = store.get();
        if (d.settings.theme === 'auto') {
          document.documentElement.setAttribute('data-theme', systemDark() ? 'dark' : 'light');
        }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  } catch (e) {}

  /* ==========================================================
     07 音效
     ========================================================== */
  var sound = (YM.sound = {});
  var audioCtx = null;
  var audioEls = {};

  sound.unlock = function () {
    try {
      if (!audioCtx) {
        var Ctx = window.AudioContext || window.webkitAudioContext;
        if (Ctx) audioCtx = new Ctx();
      }
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) {}
  };

  function tone(name) {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var cfg;
    if (name === 'ding1') cfg = { f1: 880, f2: 1320, dur: 0.16, type: 'sine', gain: 0.12 };
    else if (name === 'wood') cfg = { f1: 420, f2: 240, dur: 0.1, type: 'triangle', gain: 0.14 };
    else cfg = { f1: 660, f2: 990, dur: 0.09, type: 'sine', gain: 0.1 };

    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.f1, t);
    osc.frequency.exponentialRampToValueAtTime(cfg.f2, t + cfg.dur * 0.7);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(cfg.gain, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + cfg.dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + cfg.dur + 0.02);
  }

  sound.play = function (kind) {
    var d = store.get();
    var s = d.settings;
    if (!s.soundEnabled) return;
    var list = (s.soundList || []).filter(function (x) { return x.enabled; });
    if (!list.length) return;

    var item;
    if (kind === 'user') {
      item = list.filter(function (x) { return x.id === s.userSoundId; })[0] || list[0];
    } else {
      item = s.peerSoundRandom ? util.pickOne(list) : list[0];
    }
    if (!item) return;

    if (/^builtin:/.test(item.src)) {
      sound.unlock();
      tone(item.src.split(':')[1]);
      return;
    }
    try {
      var el = audioEls[item.id];
      if (!el) {
        el = new Audio(item.src);
        audioEls[item.id] = el;
      }
      el.currentTime = 0;
      var p = el.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  };

  /* ==========================================================
     08 字卡与回复引擎
     ========================================================== */
  var reply = (YM.reply = {});

  reply.getPool = function (sessionId, memberId) {
    var d = store.get();
    var pool = [];
    var general = d.cardStore.general;
    if (general && !general.hidden) {
      (general.groups || []).forEach(function (g) {
        if (g.hidden) return;
        (g.cards || []).forEach(function (c) {
          // 表情包是图片，不能当文字回复发出去
          if (!c.hidden && c.text && util.cardKind(c.text) !== 'sticker') pool.push({ id: c.id, text: c.text });
        });
      });
    }
    if (memberId) {
      var ex = d.cardStore.exclusive && d.cardStore.exclusive[memberId];
      if (ex && !ex.hidden) {
        (ex.groups || []).forEach(function (g) {
          if (g.hidden) return;
          (g.cards || []).forEach(function (c) {
            if (!c.hidden && c.text && util.cardKind(c.text) !== 'sticker') pool.push({ id: c.id, text: c.text, exclusive: true });
          });
        });
      }
    }
    return pool;
  };

  reply.rollSkip = function (chance) {
    return Math.random() * 100 < Number(chance || 0);
  };

  reply.pickCount = function (min, max, total) {
    var n = util.randInt(min, max);
    return Math.min(n, total);
  };

  reply.pickQuote = function (sessionId) {
    var d = store.get();
    var sn = findSession(d, sessionId);
    if (!sn) return null;
    var users = sn.messages.filter(function (m) { return m.role === 'user'; });
    if (!users.length) return null;
    var recent = users.slice(-10);
    return util.pickOne(recent).id;
  };

  reply.mergeTexts = function (parts, symbols) {
    var syms = (symbols && symbols.length) ? symbols : ['，'];
    var out = '';
    (parts || []).forEach(function (p, i) {
      if (i > 0) out += util.pickOne(syms);
      out += p;
    });
    return out;
  };

  reply.buildDelays = function (n, minSec, maxSec) {
    minSec = util.clamp(minSec, 1, 120);
    maxSec = Math.max(minSec, util.clamp(maxSec, 1, 120));
    var base = [];
    for (var i = 0; i < n; i++) base.push(util.randInt(minSec, maxSec) * 1000);
    base.sort(function (a, b) { return a - b; });
    return base.map(function (v, i) { return v + i * 600; });
  };

  reply.planTrigger = function (opts) {
    var sessionId = opts.sessionId;
    var d = store.get();
    var sn = findSession(d, sessionId);
    if (!sn) return { ok: false, reason: 'no_session' };
    var p = sn.params;

    if (YM.task.isLocked(sessionId)) return { ok: false, reason: 'locked' };

    var useGroup = !!p.groupEnabled && p.memberIds.length >= 2;
    var memberId = sn.memberId || null;
    if (useGroup) {
      var validMembers = p.memberIds.filter(function (id) {
        return d.members.some(function (m) { return m.id === id; });
      });
      /* 被禁言的成员不出声；全被禁就这轮没人说话 */
      var able = validMembers.filter(function (id) { return !(p.muted && p.muted[id]); });
      if (!able.length) return { ok: false, reason: 'all_muted' };
      if (able.length) memberId = util.pickOne(able);
    }

    var pool = reply.getPool(sessionId, memberId);
    if (!pool.length) return { ok: false, reason: 'empty_pool' };

    if (reply.rollSkip(p.skipChance)) {
      return { ok: true, skipped: true, reason: 'read_skip', triggerId: null, memberId: memberId, messages: [] };
    }

    var n = reply.pickCount(p.replyMin, p.replyMax, pool.length);
    var picked = util.shuffle(pool).slice(0, n);
    var texts = picked.map(function (c) { return c.text; });

    var merged = false;
    var parts = null;
    if (p.mergeEnabled && texts.length > 1) {
      merged = true;
      parts = texts.slice();
      texts = [reply.mergeTexts(texts, d.settings.mergeSymbols)];
    }

    var quoteId = null;
    if (p.quoteEnabled) quoteId = reply.pickQuote(sessionId);

    var delays = reply.buildDelays(texts.length, p.delayMin, p.delayMax);
    var messages = texts.map(function (t, i) {
      return {
        text: t,
        quotedMessageId: i === 0 ? quoteId : null,
        mergedParts: merged ? parts : null,
        delayMs: delays[i]
      };
    });

    return {
      ok: true,
      skipped: false,
      reason: '',
      triggerId: util.uid('trg'),
      memberId: memberId,
      messages: messages
    };
  };

  /* ==========================================================
     09 运行时任务（延迟回复 / 主动发消息）
     ========================================================== */
  var task = (YM.task = {});
  var tickTimer = null;

  function readRuntime() {
    var s = ls();
    if (!s) return { tasks: [] };
    try {
      var raw = s.getItem(KEY_RT);
      var obj = raw ? JSON.parse(raw) : { tasks: [] };
      if (!obj || !Array.isArray(obj.tasks)) return { tasks: [] };
      return obj;
    } catch (e) { return { tasks: [] }; }
  }

  function writeRuntime(rt) {
    var s = ls();
    if (!s) return;
    try { s.setItem(KEY_RT, JSON.stringify(rt)); } catch (e) {}
    YM.event.emit('ym:realtime', { count: rt.tasks.length });
  }

  function findSession(d, sid) {
    return (d.sessions || []).filter(function (s) { return s.id === sid; })[0] || null;
  }
  YM.findSession = findSession;

  task.list = function (sessionId) {
    var rt = readRuntime();
    return rt.tasks.filter(function (t) { return !sessionId || t.sessionId === sessionId; });
  };

  task.isLocked = function (sessionId) {
    return task.list(sessionId).some(function (t) { return t.type === 'reply'; });
  };

  task.schedule = function (sessionId, plan) {
    var rt = readRuntime();
    var now = Date.now();
    var sid = sessionId;
    plan.messages.forEach(function (m) {
      rt.tasks.push({
        id: util.uid('task'),
        sessionId: sid,
        type: 'reply',
        triggerId: plan.triggerId,
        fireAt: now + m.delayMs,
        payload: {
          memberId: plan.memberId,
          text: m.text,
          quotedMessageId: m.quotedMessageId,
          mergedParts: m.mergedParts
        }
      });
    });
    writeRuntime(rt);
    return rt.tasks;
  };

  task.scheduleActive = function (sessionId) {
    var d = store.get();
    var sn = findSession(d, sessionId);
    if (!sn) return null;
    var p = sn.params;
    if (!p.activeEnabled) return null;
    var rt = readRuntime();
    var exists = rt.tasks.some(function (t) { return t.sessionId === sessionId && t.type === 'active'; });
    if (exists) return null;
    var t = {
      id: util.uid('task'),
      sessionId: sessionId,
      type: 'active',
      triggerId: null,
      fireAt: Date.now() + util.randInt(p.activeMinMin, p.activeMaxMin) * 60000,
      payload: null
    };
    rt.tasks.push(t);
    writeRuntime(rt);
    return t;
  };

  task.nextActiveAt = function (sessionId) {
    var t = task.list(sessionId).filter(function (x) { return x.type === 'active'; })[0];
    return t ? t.fireAt : null;
  };

  task.cancel = function (sessionId) {
    var rt = readRuntime();
    var before = rt.tasks.length;
    rt.tasks = rt.tasks.filter(function (t) { return t.sessionId !== sessionId; });
    writeRuntime(rt);
    return before - rt.tasks.length;
  };

  task.cancelMessage = function (messageId) {
    var rt = readRuntime();
    rt.tasks = rt.tasks.filter(function (t) {
      return !(t.payload && t.payload.quotedMessageId === messageId);
    });
    writeRuntime(rt);
  };

  task.cancelActive = function (sessionId) {
    var rt = readRuntime();
    rt.tasks = rt.tasks.filter(function (t) {
      return !(t.sessionId === sessionId && t.type === 'active');
    });
    writeRuntime(rt);
  };

  task.cancelAll = function () {
    writeRuntime({ tasks: [] });
  };

  function deliver(taskItem, d) {
    var sn = findSession(d, taskItem.sessionId);
    if (!sn) return null;
    var payload = taskItem.payload || {};
    var member = payload.memberId ? (d.members || []).filter(function (m) { return m.id === payload.memberId; })[0] : null;
    var msg = {
      id: util.uid('msg'),
      role: 'peer',
      text: payload.text,
      createdAt: Date.now(),
      readStatus: null,
      memberId: payload.memberId || null,
      memberName: member ? member.name : '',
      memberAvatar: member ? member.avatar : '',
      quotedMessageId: payload.quotedMessageId || null,
      mergedParts: payload.mergedParts || null,
      triggerId: taskItem.triggerId || null
    };
    sn.messages.push(msg);
    sn.updatedAt = Date.now();
    // 标记最后一条未读的用户消息为已读
    for (var i = sn.messages.length - 1; i >= 0; i--) {
      if (sn.messages[i].role === 'user') {
        sn.messages[i].readStatus = 'read';
        break;
      }
    }
    return msg;
  }

  task.start = function (sessionId, hooks) {
    task.stop();
    hooks = hooks || {};
    task.resume(sessionId, hooks);

    tickTimer = setInterval(function () {
      task.tick(sessionId, hooks);
    }, 400);
  };

  task.stop = function () {
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
  };

  task.resume = function (sessionId, hooks) {
    var rt = readRuntime();
    var mine = rt.tasks.filter(function (t) { return t.sessionId === sessionId; });
    var overdue = mine.filter(function (t) { return t.fireAt <= Date.now(); });
    if (!overdue.length) {
      task.scheduleActive(sessionId);
      return;
    }
    var replies = overdue.filter(function (t) { return t.type === 'reply'; })
      .sort(function (a, b) { return a.fireAt - b.fireAt; });
    var d = store.get();
    var delivered = 0;
    var keep = [];

    rt.tasks.forEach(function (t) {
      if (t.sessionId !== sessionId) { keep.push(t); return; }
      if (t.fireAt > Date.now()) { keep.push(t); return; }
      if (t.type === 'active') {
        // 过期主动任务：交给 tick 立即触发一次
        keep.push(t);
        return;
      }
      if (delivered < 3) {
        var msg = deliver(t, d);
        delivered++;
        if (msg && hooks && hooks.onMessage) hooks.onMessage(msg);
      } else {
        t.fireAt = Date.now() + 800;
        keep.push(t);
      }
    });

    if (delivered) {
      store.save(d);
      YM.event.emit('ym:data', { scope: 'messages' });
      if (hooks && hooks.onTick) hooks.onTick();
    }
    writeRuntime({ tasks: keep });
    task.scheduleActive(sessionId);
  };

  task.tick = function (sessionId, hooks) {
    var rt = readRuntime();
    var now = Date.now();
    var due = rt.tasks.filter(function (t) { return t.sessionId === sessionId && t.fireAt <= now; });
    if (!due.length) return;

    var d = store.get();
    var changed = false;
    var rest = rt.tasks.slice();

    due.forEach(function (t) {
      if (t.type === 'reply') {
        var msg = deliver(t, d);
        rest = rest.filter(function (x) { return x.id !== t.id; });
        changed = true;
        if (msg && hooks && hooks.onMessage) hooks.onMessage(msg);
      } else if (t.type === 'active') {
        rest = rest.filter(function (x) { return x.id !== t.id; });
        var plan = reply.planTrigger({ sessionId: sessionId, source: 'active' });
        if (!plan.ok) {
          if (plan.reason === 'empty_pool') {
            store.update(function (dd) {
              var s2 = findSession(dd, sessionId);
              if (s2) s2.params.activeEnabled = false;
            }, 'params');
            if (hooks && hooks.onPause) hooks.onPause('empty_pool');
          } else {
            rest.push(Object.assign({}, t, { fireAt: Date.now() + 5000 }));
          }
        } else if (plan.skipped) {
          changed = true;
          var sn = findSession(d, sessionId);
          if (sn) markLastRead(sn);
          store.save(d);
          if (hooks && hooks.onSkip) hooks.onSkip();
        } else {
          plan.messages.forEach(function (m) {
            rest.push({
              id: util.uid('task'),
              sessionId: sessionId,
              type: 'reply',
              triggerId: plan.triggerId,
              fireAt: Date.now() + m.delayMs,
              payload: {
                memberId: plan.memberId,
                text: m.text,
                quotedMessageId: m.quotedMessageId,
                mergedParts: m.mergedParts
              }
            });
          });
          changed = true;
        }
        if (plan.ok && !plan.skipped) {
          // 继续下一轮主动消息
          var s3 = findSession(store.get(), sessionId);
          if (s3 && s3.params.activeEnabled) {
            rest.push({
              id: util.uid('task'),
              sessionId: sessionId,
              type: 'active',
              triggerId: null,
              fireAt: Date.now() + util.randInt(s3.params.activeMinMin, s3.params.activeMaxMin) * 60000,
              payload: null
            });
          }
        }
      }
    });

    if (changed) {
      store.save(d);
      YM.event.emit('ym:data', { scope: 'messages' });
      writeRuntime({ tasks: rest });
      if (hooks && hooks.onTick) hooks.onTick();
    }
  };

  function markLastRead(sn) {
    for (var i = sn.messages.length - 1; i >= 0; i--) {
      if (sn.messages[i].role === 'user') { sn.messages[i].readStatus = 'read'; break; }
    }
  }

  /* ==========================================================
     10 通知（页内降级）
     ========================================================== */
  var notify = (YM.notify = {});
  var bannerTimer = null;
  var baseTitle = document.title;

  notify.check = function (kind, opts) {
    var d = store.get();
    var s = d.settings;
    var sn = opts.sessionId ? findSession(d, opts.sessionId) : null;
    var enabled = (sn && sn.params.notifyEnabled != null) ? sn.params.notifyEnabled : s.notifyEnabled;
    if (!enabled || !s.notifyEnabled) return false;
    var hidden = document.hidden || !document.hasFocus();
    if (!hidden) return false;

    var el = document.getElementById('ym-banner');
    if (!el) {
      el = document.createElement('div');
      el.className = 'banner';
      el.id = 'ym-banner';
      document.body.appendChild(el);
    }
    el.innerHTML = '<span class="banner-dot"></span><span class="grow">' +
      util.escapeHtml(opts.text || '收到一条消息') + '</span>';
    el.classList.add('show');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);

    document.title = '● 新消息 · ' + baseTitle;
    return true;
  };

  window.addEventListener('focus', function () {
    document.title = baseTitle;
    var el = document.getElementById('ym-banner');
    if (el) el.classList.remove('show');
  });

  /* ==========================================================
     11 会话参数默认值补齐（页面共用）
     ========================================================== */
  YM.sessionName = function (sn) {
    if (!sn) return '';
    return sn.name || '未命名会话';
  };

  YM.avatarText = function (name) {
    var s = String(name || '').trim();
    if (!s) return '忆';
    return s.slice(0, 1);
  };

  /* ---------- 角色状态：每个人各走各的，跟时间无关 ---------- */
  // 四个状态按权重随机，但同一个 4 小时窗口里保持不变，所以列表和聊天页读到的是同一个
  YM.roleStatus = (function () {
    var MAP = {
      online: { k: 'online', n: '在线' },
      busy: { k: 'busy', n: '忙碌' },
      away: { k: 'away', n: '离开' },
      rest: { k: 'rest', n: '休息' }
    };
    var BAG = ['online', 'online', 'online', 'online', 'busy', 'busy', 'away', 'away', 'rest'];
    var SLOT = 4 * 3600 * 1000;   // 每 4 小时换一次，一个人不会一秒一变

    function hash(s) {
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = (h * 16777619) >>> 0;
      }
      return h;
    }

    // 同一角色、同一时段恒定；不同角色各自算，所以同一刻有人在线、有人忙碌
    function keyOf(mid, now) {
      var slot = Math.floor((now || Date.now()) / SLOT);
      return BAG[hash(String(mid) + '#' + slot) % BAG.length];
    }

    return {
      MAP: MAP,
      get: function (mid, now) { return MAP[keyOf(mid, now)] || MAP.online; }
    };
  })();

  // 还在会话里露面的角色：单聊的 memberId、群聊的 memberIds 都算；删掉的会话留下的角色不再算
  YM.membersInUse = function (d) {
    d = d || YM.store.get() || {};
    var ids = {};
    (d.sessions || []).forEach(function (sn) {
      if (!sn) return;
      if (sn.memberId) ids[sn.memberId] = 1;
      ((sn.params && sn.params.memberIds) || []).forEach(function (id) { ids[id] = 1; });
    });
    return (d.members || []).filter(function (m) { return m && m.id && ids[m.id]; });
  };

  YM.avatarHtml = function (item, size) {
    var px = size || 44;
    var style = 'width:' + px + 'px;height:' + px + 'px;';
    // 有图时也把名字首字留在底下：图还在加载（或加载失败）时不会出现一个空白方块
    if (item && item.avatar) {
      return '<span class="avatar has-img" style="' + style + "background-image:url('" +
        String(item.avatar).replace(/'/g, '%27') + "')" + '">' +
        util.escapeHtml(YM.avatarText(item.name)) + '</span>';
    }
    return '<span class="avatar" style="' + style + '">' + util.escapeHtml(YM.avatarText(item && item.name)) + '</span>';
  };

  /* ==========================================================
     11.5 角色来电横幅（不在聊天页时的降级形态）
     ========================================================== */
  var ring = (YM.ring = {});
  var ringEl = null;
  var ringTimer = null;
  var ringSid = '';
  var ringToken = 0;

  function ringMake() {
    if (ringEl) return ringEl;
    ringEl = document.createElement('div');
    ringEl.className = 'ring-bar';
    ringEl.id = 'ym-ring';
    ringEl.hidden = true;
    ringEl.innerHTML =
      '<span class="rb-face"></span>' +
      '<span class="rb-body"><span class="rb-name"></span><span class="rb-sub">邀请你视频通话</span></span>' +
      '<button type="button" class="rb-btn" data-act="no">拒绝</button>' +
      '<button type="button" class="rb-btn is-yes" data-act="yes">接听</button>';
    document.body.appendChild(ringEl);
    ringEl.addEventListener('click', function (e) {
      var btn = e.target.closest('.rb-btn');
      if (!btn) return;
      e.stopPropagation();
      if (btn.getAttribute('data-act') === 'yes') ring.go();
      else ring.drop('视频通话 · 已拒绝');
    });
    return ringEl;
  }

  function ringHide() {
    ringToken++;
    if (ringTimer) { clearTimeout(ringTimer); ringTimer = null; }
    if (ringEl) {
      ringEl.classList.remove('show');
      ringEl.hidden = true;
    }
  }

  function ringShow(sn) {
    var el = ringMake();
    ringSid = sn.id;
    var face = el.querySelector('.rb-face');
    if (sn.avatar) {
      face.className = 'rb-face has-img';
      face.style.backgroundImage = "url('" + String(sn.avatar).replace(/'/g, '%27') + "')";
      face.textContent = '';
    } else {
      face.className = 'rb-face';
      face.style.backgroundImage = '';
      face.textContent = YM.avatarText(YM.sessionName(sn));
    }
    el.querySelector('.rb-name').textContent = YM.sessionName(sn);
    el.hidden = false;
    el.classList.add('show');
    sound.unlock();
    sound.play('peer');

    var token = ++ringToken;
    ringTimer = setTimeout(function () {
      if (token !== ringToken) return;
      ring.drop('视频通话 · 无人接听');
    }, 22000);
  }

  ring.drop = function (text) {
    var sid = ringSid;
    ringHide();
    if (!sid || !text) return;
    store.update(function (d) {
      var sn = findSession(d, sid);
      if (!sn) return;
      sn.messages.push({
        id: util.uid('msg'),
        role: 'peer',
        kind: 'call',
        text: text,
        duration: 0,
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
  };

  // 指定会话弹横幅（角色主动来电时由 YM.invite 调）
  ring.showSid = function (sid) {
    var d = store.get() || {};
    var sn = findSession(d, sid);
    if (!sn) return;
    ringShow(sn);
  };

  ring.go = function () {
    var sid = ringSid;
    ringHide();
    if (!sid) return;
    var base = /\/pages\//.test(location.pathname) ? 'chat.html' : 'pages/chat.html';
    location.href = base + '?sid=' + encodeURIComponent(sid) + '&call=1';
  };

  ring.boot = function () {
    ring.plan();
    setInterval(function () {
      if (document.hidden) return;
      if (ringEl && !ringEl.hidden) return;
      if (!ring.due()) return;
      if (ring.busy && ring.busy()) return;
      ring.mark();
      if (ring.onDue) { ring.onDue(); return; }
      var d = store.get();
      var pool = (d.sessions || []).filter(function (s) {
        var p = s.params || {};
        return !(p.groupEnabled && (p.memberIds || []).length >= 2);
      });
      if (!pool.length) return;
      ringShow(util.pickOne(pool));
    }, 20000);
  };

  /* 按时段摇：每个小时算一个时段，进到这个时段时摇一次「这个小时会不会来」，
     概率本身随机落在 5%~8%；中了就在这个小时剩余时间随机挑一分钟响。
     20 秒的轮询只查「到点没有」，不做逐次掷骰子。一天可以来几通，不设上限 */
  var RING_KEY = 'ym_call_hour';

  function ringSlot() {
    var now = new Date();
    var slot = util.dayKey(now.getTime()) + ':' + (now.getHours() < 10 ? '0' : '') + now.getHours();
    var raw = null;
    try { raw = localStorage.getItem(RING_KEY); } catch (e) {}
    var p = null;
    try { p = raw ? JSON.parse(raw) : null; } catch (e) { p = null; }
    if (!p || p.slot !== slot) {
      var percent = util.randInt(5, 8);
      var nowMin = now.getMinutes() + now.getSeconds() / 60;
      var left = 59 - Math.floor(nowMin);
      var gap = left > 1 ? util.randInt(1, left) : 0;
      p = {
        slot: slot,
        percent: percent,
        hit: Math.random() * 100 < percent,
        at: nowMin + gap,
        rang: false
      };
      try { localStorage.setItem(RING_KEY, JSON.stringify(p)); } catch (e) {}
      try { localStorage.removeItem('ym_call_day'); } catch (e) {}
    }
    return p;
  }

  ring.plan = ringSlot;

  ring.due = function () {
    var p = ringSlot();
    if (!p.hit || p.rang) return false;
    var now = new Date();
    return (now.getMinutes() + now.getSeconds() / 60) >= p.at;
  };

  ring.mark = function () {
    var p = ringSlot();
    p.rang = true;
    try { localStorage.setItem(RING_KEY, JSON.stringify(p)); } catch (e) {}
  };

  /* ==========================================================
     11.6 角色也会主动找你：来电 / 红包 / 陪伴邀请
     ========================================================== */
  // 每个单聊角色每天排一件主动的事（概率约六成），时间落在今天剩下的时段里；
  // 到点后：红包与陪伴邀请写进会话消息，来电交给 YM.ring / 聊天页的整屏来电层
  YM.invite = (function () {
    var KEY = 'ym_invite_v1';
    var BUDDY = ['study', 'work', 'novel', 'video', 'music', 'rest', 'game', 'exercise'];
    var BUDDY_NAME = { study: '学习', work: '办公', novel: '小说', video: '视频', music: '音乐', rest: '休息', game: '游戏', exercise: '锻炼' };
    var AMOUNT = [6.66, 8.88, 12.34, 18.88];
    var NOTES = ['拿去买杯热的', '今天辛苦了', '一点小心意'];
    // 三类各算各的概率：来电 10~15%、红包 11~18%、陪伴 7~20%，每次落一个具体数再摇
    var RANGE = { call: [10, 15], packet: [11, 18], buddy: [7, 20] };
    var KINDS = ['call', 'packet', 'buddy'];
    var PKEY = 'ym_persona_v1';
    // 三种作息各一张 24 小时权重表：早睡型天黑就收，正常型白天到睡前，夜猫子越晚越精神
    var HOUR_W = [0.16, 0.12, 0.08, 0.06, 0.06, 0.16, 0.34, 0.5, 0.72, 0.86, 0.9, 0.9,
                  0.82, 0.86, 0.9, 0.92, 0.95, 1, 1, 1, 0.96, 0.9, 0.7, 0.42];
    var W_EARLY = [0.01, 0.01, 0.01, 0.01, 0.04, 0.18, 0.6, 0.9, 0.95, 0.78, 0.5, 0.38,
                   0.42, 0.6, 0.85, 0.95, 1, 1, 0.88, 0.55, 0.3, 0.12, 0.04, 0.02];
    var W_OWL = [0.78, 0.95, 0.9, 0.62, 0.32, 0.15, 0.06, 0.04, 0.05, 0.08, 0.12, 0.16,
                 0.2, 0.24, 0.3, 0.42, 0.58, 0.78, 0.92, 1, 1, 1, 0.92, 0.85];

    function read() {
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) {}
      var v = null;
      try { v = raw ? JSON.parse(raw) : null; } catch (e) { v = null; }
      return v && typeof v === 'object' && v.map ? v : null;
    }

    function write(v) {
      try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {}
    }

    function isSingle(sn) {
      var p = (sn && sn.params) || {};
      return !(p.groupEnabled && (p.memberIds || []).length >= 2);
    }

    function findSn(d, id) {
      var list = d.sessions || [];
      for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
      return null;
    }

    function readPersona() {
      var raw = null;
      try { raw = localStorage.getItem(PKEY); } catch (e) {}
      var v = null;
      try { v = raw ? JSON.parse(raw) : null; } catch (e) { v = null; }
      return v && typeof v === 'object' ? v : {};
    }

    function writePersona(v) {
      try { localStorage.setItem(PKEY, JSON.stringify(v)); } catch (e) {}
    }

    // 每个人的性格：爱不爱打电话、爱不爱发红包、想不想陪人，长期不变
    function trait(mid) {
      var all = readPersona();
      var p = all[mid];
      if (p && typeof p.call === 'number') return p;
      // 少数极端：有人特别黏、有人几乎不主动；大多数人落在中间
      function k() {
        var r = Math.random();
        if (r < 0.22) return 0.25 + Math.random() * 0.35;
        if (r > 0.82) return 1.4 + Math.random() * 0.7;
        return 0.65 + Math.random() * 0.6;
      }
      // 作息：约三成早睡型、五成正常、两成夜猫子
      var sleep = 'normal';
      var r = Math.random();
      if (r < 0.3) sleep = 'early';
      else if (r > 0.78) sleep = 'owl';
      p = { call: k(), packet: k(), buddy: k(), sleep: { v: sleep, since: Date.now() }, mood: null };
      all[mid] = p;
      writePersona(all);
      return p;
    }

    // 作息不是标签：过一阵子可能挪一档，也可能就这么待着。相邻的更容易串门
    function sleepOf(mid) {
      var all = readPersona();
      var p = all[mid] || trait(mid);
      var sl = p.sleep;
      if (!sl || typeof sl === 'string') {
        p.sleep = { v: sl || 'normal', since: Date.now(), span: util.randInt(3, 12) };
        all[mid] = p;
        writePersona(all);
        return p.sleep.v;
      }
      var span = sl.span || util.randInt(3, 12);
      if (Date.now() - sl.since < span * 86400000) return sl.v;

      // 到期了：七成挪到相邻的一档，三成维持原样但重新计时
      var v = sl.v;
      if (Math.random() < 0.7) {
        if (v === 'early') v = Math.random() < 0.75 ? 'normal' : 'owl';
        else if (v === 'owl') v = Math.random() < 0.75 ? 'normal' : 'early';
        else v = Math.random() < 0.5 ? 'early' : 'owl';
      }
      p.sleep = { v: v, since: Date.now(), span: util.randInt(3, 12) };
      all[mid] = p;
      writePersona(all);
      return v;
    }

    // 当天心情：同一个人今天可能格外沉默，也可能格外想说话
    function moodOf(mid, day) {
      var all = readPersona();
      var p = all[mid] || trait(mid);
      if (!p.mood || p.mood.day !== day) {
        p.mood = { day: day, v: 0.45 + Math.random() * 1.35 };
        all[mid] = p;
        writePersona(all);
      }
      return p.mood.v;
    }

    // 在之后 24 小时里按这个人的作息曲线挑一个点：早睡型往前挪，夜猫子把峰搬到夜里
    function pickAt(now, mid) {
      var base = new Date(now);
      base.setMinutes(0, 0, 0);
      var startH = base.getHours();
      var sl = sleepOf(mid);
      var W = sl === 'early' ? W_EARLY : (sl === 'owl' ? W_OWL : HOUR_W);
      var total = 0;
      var i;
      for (i = 0; i < 24; i++) total += W[(startH + i) % 24];
      var r = Math.random() * total;
      var acc = 0;
      var off = 0;
      for (i = 0; i < 24; i++) {
        acc += W[(startH + i) % 24];
        if (r <= acc) { off = i; break; }
      }
      return base.getTime() + off * 3600000 + util.randInt(0, 59) * 60000 + 5 * 60000;
    }

    // 摇一次：基础概率取自区间，再乘这人的性格系数与当天心情，所以谁什么时候来都不均匀
    function roll(kind, now, mid) {
      var r = RANGE[kind] || [10, 20];
      var base = util.randInt(r[0], r[1]);
      var p = trait(mid);
      var k = typeof p[kind] === 'number' ? p[kind] : 1;
      var mood = moodOf(mid, util.dayKey(now));
      var pct = Math.max(3, Math.min(45, base * k * mood));
      var hit = Math.random() * 100 < pct;
      return {
        pct: Math.round(pct * 10) / 10,
        hit: hit,
        at: hit ? pickAt(now, mid) : 0,
        done: false
      };
    }

    function plan() {
      var day = util.dayKey(Date.now());
      var st = read() || { day: day, map: {} };
      var d = store.get() || {};
      var now = Date.now();

      (d.sessions || []).forEach(function (sn) {
        if (!sn || !isSingle(sn)) return;
        KINDS.forEach(function (kind) {
          var key = sn.id + '|' + kind;
          var rec = st.map[key];
          // 还没到点的（含跨过午夜那种）留着
          if (rec && rec.hit && !rec.done && rec.at > now) return;
          // 今天已经来过的，当天不再排
          if (rec && rec.done && rec.rollDay === day) return;
          // 其余的今天重摇
          var n = roll(kind, now, sn.memberId || sn.id);
          n.rollDay = day;
          st.map[key] = n;
        });
      });

      write(st);
      return st;
    }

    function due(now) {
      var st = plan();
      var out = [];
      Object.keys(st.map || {}).forEach(function (key) {
        var rec = st.map[key];
        if (!rec || !rec.hit || rec.done) return;
        if (rec.at > (now || Date.now())) return;
        var parts = key.split('|');
        out.push({ sid: parts[0], kind: parts[1], rec: rec });
      });
      return out;
    }

    function fire(sn, kind) {
      if (kind === 'call') {
        // 聊天页正开着这个会话 → 交它弹整屏来电；否则用全局来电横幅
        if (YM.invite.claim && YM.invite.claim(sn.id)) return;
        if (ring.showSid) ring.showSid(sn.id);
        return;
      }

      store.update(function (d) {
        var s2 = findSn(d, sn.id);
        if (!s2) return;
        var mid = s2.memberId || null;
        var mname = '';
        if (mid) {
          var list = d.members || [];
          for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].id === mid) { mname = list[i].name || ''; break; }
          }
        }
        var base = {
          id: util.uid('msg'),
          role: 'peer',
          createdAt: Date.now(),
          readStatus: null,
          memberId: mid,
          memberName: mname,
          memberAvatar: '',
          quotedMessageId: null,
          mergedParts: null,
          triggerId: null
        };
        if (kind === 'packet') {
          base.kind = 'packet';
          base.amount = util.pickOne(AMOUNT);
          base.note = util.pickOne(NOTES);
          base.claimed = false;
          base.text = '';
        } else {
          var bk = util.pickOne(BUDDY);
          base.kind = 'buddy';
          base.text = '';
          base.state = 'pending';
          base.buddy = {
            kind: bk,
            name: BUDDY_NAME[bk],
            dir: 'in',
            memberId: mid,
            memberName: mname,
            at: Date.now()
          };
        }
        s2.messages.push(base);
        s2.updatedAt = Date.now();
      }, 'messages');
    }

    function boot() {
      plan();
      setInterval(function () {
        if (document.hidden) return;
        var list = due();
        if (!list.length) return;
        var d = store.get() || {};
        list.forEach(function (it) {
          var sn = findSn(d, it.sid);
          var st = read();
          if (st && st.map && st.map[it.sid + '|' + it.kind]) st.map[it.sid + '|' + it.kind].done = true;
          write(st);
          if (!sn || !isSingle(sn)) return;
          fire(sn, it.kind);
        });
      }, 45000);
    }

    return { plan: plan, due: due, fire: fire, boot: boot, claim: null };
  })();

  /* ==========================================================
     12 启动
     ========================================================== */
  function boot() {
    theme.apply();
    style.applyAll();
    YM.event.on('ym:data', function (detail) {
      if (detail && detail.scope === 'settings') {
        theme.apply();
        style.applyAll();
      }
    });
    if (!store.available()) {
      setTimeout(function () {
        ui.toast('当前浏览器禁止本地存储，刷新后数据会丢失');
      }, 600);
    }
    if (YM.ring && YM.ring.boot) YM.ring.boot();
    if (YM.invite && YM.invite.boot) YM.invite.boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
