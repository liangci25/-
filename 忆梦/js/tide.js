/* ============================================================
   忆梦 · tide.js（潮汐 · 内置日历）
   ============================================================ */
(function () {
  'use strict';

  var app = document.querySelector('.tide-app');
  if (!app) return;

  var view = null;                // { y, m }
  var pick = null;                // Date（当天 00:00）
  var mode = 'plan';              // plan / period / sleep
  var periodStart = null;         // 经期起日 'YYYY-MM-DD'（等第二下点讫）

  var elGrid = document.getElementById('tideGrid');
  var elMonth = document.getElementById('tideMonth');

  function day0(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function sameDay(a, b) {
    if (!a || !b) return false;
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // 标签的小图标：生日是插了蜡烛的蛋糕，纪念日是一颗心
  var TAG_ICONS = {
    birthday: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="13" width="16" height="6.6" rx="1.6" fill="currentColor" stroke="none"/><rect x="11.1" y="8.6" width="1.8" height="4.6" fill="currentColor" stroke="none"/><circle cx="12" cy="6.9" r="1.7" fill="currentColor" stroke="none"/></svg>',
    anniversary: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.4S4.6 14.8 4.6 9.9c0-2.6 2-4.3 4.4-4.3 1.3 0 2.4.6 3 1.5.6-.9 1.7-1.5 3-1.5 2.4 0 4.4 1.7 4.4 4.3 0 4.9-7.4 9.5-7.4 9.5z"/></svg>'
  };

  function tagIcon(tag) {
    return TAG_ICONS[tag] || '';
  }

  function tagLabel(tag) {
    return tag === 'birthday' ? '生日' : tag === 'anniversary' ? '纪念日' : '';
  }

  function keyOf(d) {
    return YM.util.dayKey(d.getTime());
  }

  function parseKey(k) {
    var a = String(k || '').split('-');
    return new Date(+a[0], (+a[1] || 1) - 1, +a[2] || 1);
  }

  function periods() {
    var d = YM.store.get();
    return (d && d.tide && d.tide.periods) || [];
  }

  function savePeriods(fn) {
    YM.store.update(function (d) {
      if (!d.tide) d.tide = { periods: [] };
      if (!d.tide.periods) d.tide.periods = [];
      fn(d.tide.periods);
    }, 'tide');
  }

  function plans() {
    var d = YM.store.get();
    return (d && d.tide && d.tide.plans) || {};
  }

  function plansOf(key) {
    var all = plans();
    var one = Array.isArray(all[key]) ? all[key] : [];
    return one.concat(annualOf(key)).sort(function (a, b) {
      return String(a.tag || '') < String(b.tag || '') ? -1 : 1;
    });
  }

  function hasPlan(key) {
    var all = plans();
    return (Array.isArray(all[key]) && all[key].length > 0) || annualOf(key).length > 0;
  }

  function annual() {
    var d = YM.store.get();
    return (d && d.tide && d.tide.annual) || [];
  }

  // 生日 / 纪念日这种一年一次的：按「月-日」对上就算，年份不必相同
  function annualOf(key) {
    var md = String(key || '').slice(-5);
    return annual().filter(function (it) { return String(it.date || '').slice(-5) === md; });
  }

  function addPlan(key, item) {
    YM.store.update(function (d) {
      if (!d.tide) d.tide = { periods: [] };
      var one = {
        id: YM.util.uid(),
        text: item.text,
        date: key,
        tag: item.tag || '',
        at: Date.now()
      };
      if (item.tag) {
        if (!Array.isArray(d.tide.annual)) d.tide.annual = [];
        d.tide.annual.push(one);
        return;
      }
      if (!d.tide.plans) d.tide.plans = {};
      if (!Array.isArray(d.tide.plans[key])) d.tide.plans[key] = [];
      d.tide.plans[key].push(one);
    }, 'tide');
  }

  function dropPlan(key, id) {
    YM.store.update(function (d) {
      if (!d.tide) return;
      if (Array.isArray(d.tide.annual)) {
        d.tide.annual = d.tide.annual.filter(function (it) { return it.id !== id; });
      }
      if (Array.isArray(d.tide.plans && d.tide.plans[key])) {
        d.tide.plans[key] = d.tide.plans[key].filter(function (it) { return it.id !== id; });
        if (!d.tide.plans[key].length) delete d.tide.plans[key];
      }
    }, 'tide');
  }

  function settings() {
    var d = YM.store.get();
    var t = (d && d.tide && d.tide.settings) || {};
    return {
      cycleDays: +t.cycleDays || 28,
      periodDays: +t.periodDays || 5,
      sleepHours: +t.sleepHours || 8
    };
  }

  function saveSetting(key, val) {
    YM.store.update(function (d) {
      if (!d.tide) d.tide = { periods: [] };
      if (!d.tide.settings) d.tide.settings = {};
      d.tide.settings[key] = val;
    }, 'tide');
  }

  /* ---------- 睡眠 ---------- */
  var LATE_AT = 23 * 60 + 30;   // 23:30 之后算熬夜

  function sleepAll() {
    var d = YM.store.get();
    return (d && d.tide && d.tide.sleep) || {};
  }

  function sleepOf(key) {
    return sleepAll()[key] || null;
  }

  /* "23:40" → 分；凌晨那一截算作 24 点以后 */
  function toMin(hhmm) {
    var s = String(hhmm || '00:00');
    var h = +s.slice(0, 2) || 0;
    var m = +s.slice(3, 5) || 0;
    return h < 12 ? (24 + h) * 60 + m : h * 60 + m;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function minText(min) {
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (!h) return m + ' 分';
    return m ? h + ' 小时 ' + m + ' 分' : h + ' 小时';
  }

  /* 规律早睡 / 睡眠不足 / 熬夜 三档 */
  function sleepInfo(sl) {
    if (!sl) return null;
    var goal = settings().sleepHours * 60;
    var bedM = toMin(sl.bed);
    var wakeM = toMin(sl.wake);
    var dur = wakeM - bedM;
    if (dur <= 0) dur += 24 * 60;
    /* 只有夜里那一段才算熬夜；白天补觉不按熬夜算 */
    var rawH = +String(sl.bed || '0').slice(0, 2);
    var late = rawH >= 23 || rawH < 4;
    var short = dur < goal;
    return {
      bedM: bedM,
      dur: dur,
      late: late,
      short: short,
      status: late ? 'late' : (short ? 'short' : 'good')
    };
  }

  var SLEEP_NAME = { good: '规律早睡', short: '睡眠不足', late: '熬夜' };

  function saveSleep(key, rec) {
    YM.store.update(function (d) {
      if (!d.tide) d.tide = { periods: [] };
      if (!d.tide.sleep) d.tide.sleep = {};
      if (rec) d.tide.sleep[key] = rec;
      else delete d.tide.sleep[key];
    }, 'tide');
  }

  /* 按「周期长度」从最近一段推下一次；没记过就不推 */
  function expectRange() {
    var list = periods();
    if (!list.length) return null;
    var st = settings();
    var last = list[0].start;
    for (var i = 1; i < list.length; i++) { if (list[i].start > last) last = list[i].start; }
    var b = parseKey(last);
    var e = new Date(b.getFullYear(), b.getMonth(), b.getDate() + st.cycleDays);
    return { start: keyOf(e), span: st.periodDays };
  }

  function periodAt(key) {
    var list = periods();
    for (var i = 0; i < list.length; i++) {
      if (list[i].start <= key && key <= (list[i].end || list[i].start)) return i;
    }
    return -1;
  }

  // 这一天有没有带标签的计划（生日 / 纪念日），有就按它画图标
  function planMark(key) {
    var list = plansOf(key);
    for (var i = 0; i < list.length; i++) {
      if (list[i].tag) return list[i].tag;
    }
    return '';
  }

  function render() {
    var today = day0(new Date());
    elMonth.textContent = view.y + '年' + (view.m + 1) + '月';

    // 周一开头：先算出 1 号所在周要补几格
    var first = new Date(view.y, view.m, 1);
    var lead = (first.getDay() + 6) % 7;
    var start = new Date(view.y, view.m, 1 - lead);
    // 只排到装得下本月日期的最后一行，月末不再多铺一整行下月的灰字
    var days = new Date(view.y, view.m + 1, 0).getDate();
    var total = Math.ceil((lead + days) / 7) * 7;

    var html = '';
    var plist = mode === 'period' ? periods() : [];
    var exp = mode === 'period' ? expectRange() : null;
    for (var i = 0; i < total; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      if (d.getMonth() !== view.m && i >= lead + days) {
        // 本月最后一天之后不再铺下月的灰字，留空格子撑住网格
        html += '<span class="tide-cell is-blank" aria-hidden="true"></span>';
        continue;
      }
      var wk = d.getDay();
      var cls = 'tide-cell';
      if (d.getMonth() !== view.m) cls += ' is-outside';
      if (wk === 0 || wk === 6) cls += ' is-weekend';
      if (mode === 'period' && sameDay(d, today)) cls += ' is-today';
      if (mode === 'plan' && sameDay(d, pick)) cls += ' is-pick';
      if (mode === 'sleep' && sameDay(d, pick)) cls += ' is-pick';
      var k = keyOf(d);
      var mk = mode === 'plan' ? planMark(k) : '';
      var si = mode === 'sleep' ? sleepInfo(sleepOf(k)) : null;
      if (si) cls += ' has-sleep is-sleep-' + si.status;
      if (mode === 'plan' && (mk || hasPlan(k))) cls += ' has-plan';
      if (mk) cls += ' has-mark';
      if (mode === 'period' && periodStart === k) cls += ' is-pending';
      if (mode === 'period' && exp && k >= exp.start && k < keyOf(new Date(
        parseKey(exp.start).getFullYear(), parseKey(exp.start).getMonth(),
        parseKey(exp.start).getDate() + exp.span))) cls += ' is-expect';
      for (var q = 0; q < plist.length; q++) {
        var pr = plist[q];
        var pe = pr.end || pr.start;
        if (k >= pr.start && k <= pe) {
          cls += ' is-period';
          if (k === pr.start || k === pe) cls += ' is-start';
          break;
        }
      }
      html += '<button class="' + cls + '" type="button" data-y="' + d.getFullYear() +
        '" data-m="' + d.getMonth() + '" data-d="' + d.getDate() + '" aria-label="' +
        d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日">' +
        (mk
          ? '<span class="tide-mark">' + tagIcon(mk) + '</span>'
          : '<span class="tide-num">' + d.getDate() + '</span>') +
        (si ? '<span class="tide-sleep-dot is-' + si.status + '"></span>' : '') +
        '</button>';
    }
    elGrid.innerHTML = html;
    paintBelow();
  }

  /* 日历下方：日程看当天的计划，经期看往期 */
  function paintBelow() {
    var box = document.getElementById('tideBelow');
    if (!box) return;
    var html = '';

    if (mode === 'plan') {
      var day = pick || day0(new Date());
      var k = keyOf(day);
      var list = plansOf(k);
      html = '<div class="tide-below-head"><span class="tide-below-title">' +
        (day.getMonth() + 1) + '月' + day.getDate() + '日</span></div>';
      if (!list.length) {
        html += '<p class="tide-below-empty">这天还没有计划</p>';
      } else {
        list.forEach(function (it) {
          html += '<div class="tide-plan">' +
            '<span class="tide-plan-dot"></span>' +
            '<span class="tide-plan-text">' + YM.util.escapeHtml(it.text) + '</span>' +
            (it.tag ? '<span class="tide-plan-tag">' + tagIcon(it.tag) + tagLabel(it.tag) + '</span>' : '') +
            (it.tag ? '<span class="tide-plan-every">每年</span>' : '') +
            '<button class="tide-plan-del" type="button" data-drop="' + YM.util.escapeHtml(it.id) + '">删</button>' +
            '</div>';
        });
      }
    }

    if (mode === 'period') {
      var segs = periods().slice().sort(function (a, b) { return a.start < b.start ? 1 : -1; });
      html = '<div class="tide-below-head"><span class="tide-below-title">往期经期</span></div>';
      if (!segs.length) {
        html += '<p class="tide-below-empty">还没有记录</p>';
      } else {
        segs.forEach(function (sg) {
          var a = parseKey(sg.start), b = parseKey(sg.end || sg.start);
          var days = Math.round((b - a) / 86400000) + 1;
          html += '<button class="tide-past" type="button" data-go="' + sg.start + '">' +
            '<span class="tide-past-when">' + (a.getMonth() + 1) + '月' + a.getDate() + '日 – ' +
            (b.getMonth() + 1) + '月' + b.getDate() + '日</span>' +
            '<span class="tide-past-days">' + days + ' 天</span>' +
            '</button>';
        });
      }
    }

    if (mode === 'sleep') {
      var sday = pick || day0(new Date());
      var sk = keyOf(sday);
      var sl = sleepOf(sk);
      var si2 = sleepInfo(sl);
      html = '<div class="tide-below-head"><span class="tide-below-title">' +
        (sday.getMonth() + 1) + '月' + sday.getDate() + '日</span></div>';
      if (!si2) {
        html += '<p class="tide-below-empty">这天还没记。夜里没再碰手机的那段，会自己算进来。</p>';
      } else {
        html += '<div class="tide-sleep">' +
          '<span class="tide-sleep-state is-' + si2.status + '">' + SLEEP_NAME[si2.status] + '</span>' +
          '<span class="tide-sleep-time">' + sl.bed + ' 睡 · ' + sl.wake + ' 起' +
            (sl.auto ? '<i class="tide-sleep-auto">自动</i>' : '') + '</span>' +
          '<span class="tide-sleep-dur">' + minText(si2.dur) + '</span>' +
          '<button class="tide-plan-del" type="button" data-sleepdrop="' + sk + '">删</button>' +
          '</div>';
      }
      html += '<div class="tide-legend">' +
        '<span class="tide-legend-item"><i class="tide-sleep-dot is-good"></i>规律早睡</span>' +
        '<span class="tide-legend-item"><i class="tide-sleep-dot is-short"></i>睡眠不足</span>' +
        '<span class="tide-legend-item"><i class="tide-sleep-dot is-late"></i>熬夜</span>' +
        '</div>';
    }

    box.innerHTML = html;
  }

  function go(y, m) {
    view = { y: y, m: m };
    render();
  }

  function move(step) {
    var m = view.m + step;
    var y = view.y;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    go(y, m);
  }

  function openAddPlan(day) {
    var tag = '';
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h3 class="sheet-title">添加计划</h3>' +
        '<p class="tide-add-day">' + (day.getMonth() + 1) + '月' + day.getDate() + '日</p>' +
        '<div class="tide-add">' +
        '<label class="tide-add-row">' +
        '<span class="tide-add-name">内容</span>' +
        '<input class="tide-add-text" id="tapText" type="text" maxlength="60" placeholder="写一句要做什么">' +
        '</label>' +
        '<label class="tide-add-row" id="tapDateRow">' +
        '<span class="tide-add-name" id="tapDateName">日期</span>' +
        '<input class="tide-add-date" id="tapDate" type="date" value="' + keyOf(day) + '">' +
        '</label>' +
        '<div class="tide-add-row">' +
        '<span class="tide-add-name">标签</span>' +
        '<span class="tide-tags" id="tapTags">' +
        '<button class="tide-tag-btn" type="button" data-tag="birthday">' + tagIcon('birthday') + '生日</button>' +
        '<button class="tide-tag-btn" type="button" data-tag="anniversary">' + tagIcon('anniversary') + '纪念日</button>' +
        '</span>' +
        '</div>' +
        '</div>' +
        '<button class="btn btn-block mt-16" type="button" data-save="1">添加</button>';

      sheet.querySelector('#tapText').focus();

      sheet.addEventListener('click', function (e) {
        var tagBtn = e.target.closest ? e.target.closest('[data-tag]') : null;
        if (tagBtn) {
          tag = tag === tagBtn.getAttribute('data-tag') ? '' : tagBtn.getAttribute('data-tag');
          sheet.querySelectorAll('[data-tag]').forEach(function (b) {
            b.classList.toggle('is-on', b.getAttribute('data-tag') === tag);
          });
          paintDateRow(sheet, day, tag);
          return;
        }
        if (e.target.closest && e.target.closest('[data-save]')) {
          var txt = (sheet.querySelector('#tapText').value || '').trim();
          if (!txt) {
            YM.ui.toast('先写一句要做什么');
            return;
          }
          var dk, pd;
          if (tag) {
            var mm = +((sheet.querySelector('#tapMonth') || {}).value || 1);
            var dd = +((sheet.querySelector('#tapDay') || {}).value || 1);
            mm = Math.min(12, Math.max(1, mm || 1));
            dd = Math.min(31, Math.max(1, dd || 1));
            dk = YM.util.pad2(mm) + '-' + YM.util.pad2(dd);
            pd = new Date(new Date().getFullYear(), mm - 1, dd);
          } else {
            dk = (sheet.querySelector('#tapDate') || {}).value || keyOf(day);
            pd = parseKey(dk);
          }
          addPlan(dk, { text: txt, tag: tag });
          pick = pd;
          close();
          if (pick.getFullYear() !== view.y || pick.getMonth() !== view.m) {
            go(pick.getFullYear(), pick.getMonth());
          } else {
            render();
          }
        }
      });
    });
  }

  // 生日、纪念日一年一次，只留月、日；其它计划仍按年月日挑
  function paintDateRow(sheet, day, tagOn) {
    var row = sheet.querySelector('#tapDateRow');
    if (!row) return;
    var base = day || new Date();
    if (tagOn) {
      sheet.querySelector('#tapDateName').textContent = '日子';
      row.innerHTML = '<span class="tide-add-name">日子</span>' +
        '<span class="tide-add-md">' +
        '<input class="tide-add-num" id="tapMonth" type="number" inputmode="numeric" min="1" max="12" value="' + (base.getMonth() + 1) + '">' +
        '<span class="tide-add-unit">月</span>' +
        '<input class="tide-add-num" id="tapDay" type="number" inputmode="numeric" min="1" max="31" value="' + base.getDate() + '">' +
        '<span class="tide-add-unit">日</span>' +
        '</span>';
    } else {
      sheet.querySelector('#tapDateName').textContent = '日期';
      row.innerHTML = '<span class="tide-add-name">日期</span>' +
        '<input class="tide-add-date" id="tapDate" type="date" value="' + keyOf(base) + '">';
    }
  }

  function bind() {
    var tabs = document.getElementById('tideTabs');
    tabs.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.tide-tab') : null;
      if (!btn) return;
      var key = btn.getAttribute('data-tab') || 'plan';
      tabs.querySelectorAll('.tide-tab').forEach(function (t) {
        t.classList.toggle('is-on', t === btn);
      });
      mode = key;
      if (mode !== 'period') periodStart = null;
      app.setAttribute('data-tab', key);
      syncAction();
      render();
    });

    document.getElementById('tidePrev').addEventListener('click', function () { move(-1); });
    document.getElementById('tideNext').addEventListener('click', function () { move(1); });
    document.getElementById('tideAction').addEventListener('click', function () {
      if (mode === 'period') { openPeriodSettings(); return; }
      if (mode === 'sleep') { openSleepSettings(); return; }
      openAddPlan(pick || day0(new Date()));
    });
    document.getElementById('tideBelow').addEventListener('click', function (e) {
      var slDrop = e.target.closest ? e.target.closest('[data-sleepdrop]') : null;
      if (slDrop) {
        saveSleep(slDrop.getAttribute('data-sleepdrop'), null);
        render();
        YM.ui.toast('已删掉这天的记录');
        return;
      }
      var drop = e.target.closest ? e.target.closest('[data-drop]') : null;
      if (drop) {
        var day2 = pick || day0(new Date());
        dropPlan(keyOf(day2), drop.getAttribute('data-drop'));
        render();
        return;
      }
      var goBtn = e.target.closest ? e.target.closest('[data-go]') : null;
      if (goBtn) {
        var dd = parseKey(goBtn.getAttribute('data-go'));
        pick = dd;
        go(dd.getFullYear(), dd.getMonth());
      }
    });

    elGrid.addEventListener('click', function (e) {
      var cell = e.target.closest ? e.target.closest('.tide-cell') : null;
      if (!cell) return;
      var d = new Date(+cell.getAttribute('data-y'), +cell.getAttribute('data-m'), +cell.getAttribute('data-d'));
      if (mode === 'period') { tapPeriod(d); return; }
      pick = d;
      if (d.getMonth() !== view.m) go(d.getFullYear(), d.getMonth());
      else render();
      if (mode === 'sleep') openSleepLog(d);
    });
  }

  /* 经期：第一下记起日，第二下记讫日；点到已记的日子里则取消那一条 */
  function tapPeriod(d) {
    var key = keyOf(d);
    var hit = periodAt(key);

    if (hit >= 0 && !periodStart) {
      savePeriods(function (list) { list.splice(hit, 1); });
      render();
      YM.ui.toast('已取消这段经期');
      return;
    }

    if (!periodStart) {
      periodStart = key;
      if (d.getMonth() !== view.m) go(d.getFullYear(), d.getMonth());
      else render();
      YM.ui.toast('再点一天，圈出这段经期', 1800);
      return;
    }

    var a = periodStart <= key ? periodStart : key;
    var b = periodStart <= key ? key : periodStart;
    savePeriods(function (list) {
      list.push({ start: a, end: b, createdAt: Date.now() });
    });
    periodStart = null;
    render();
    var ad = parseKey(a), bd = parseKey(b);
    YM.ui.toast('经期已记下 ' + (ad.getMonth() + 1) + '月' + ad.getDate() + '日 – ' +
      (bd.getMonth() + 1) + '月' + bd.getDate() + '日');
  }

  function syncAction() {
    var btn = document.getElementById('tideAction');
    if (!btn) return;
    var isSet = mode === 'period' || mode === 'sleep';
    btn.classList.toggle('is-set', isSet);
    btn.setAttribute('aria-label', mode === 'period' ? '经期设置' : (mode === 'sleep' ? '睡眠设置' : '添加计划'));
  }

  function numberRow(name, key, val, unit, min, max, step) {
    return '<label class="tide-set-row"><span class="tide-set-name">' + name + '</span>' +
      '<span class="tide-set-val"><input class="tide-set-num" type="number" inputmode="numeric" ' +
      'min="' + min + '" max="' + max + '" step="' + (step || 1) + '" value="' + val + '" data-key="' + key + '">' +
      '<span class="tide-set-unit">' + unit + '</span></span></label>';
  }

  function bindNumbers(sheet, close) {
    var inputs = sheet.querySelectorAll('.tide-set-num');
    Array.prototype.forEach.call(inputs, function (inp) {
      inp.addEventListener('change', function () {
        var key = inp.getAttribute('data-key');
        var v = Math.round(+inp.value || 0);
        var lo = +inp.getAttribute('min'), hi = +inp.getAttribute('max');
        if (v < lo) v = lo;
        if (v > hi) v = hi;
        inp.value = v;
        saveSetting(key, v);
        render();
      });
    });
    sheet.querySelector('[data-close="1"]').addEventListener('click', close);
  }

  function openPeriodSettings() {
    var st = settings();
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML = '<h3 class="sheet-title">经期设置</h3>' +
        '<div class="tide-set">' +
        numberRow('周期长度', 'cycleDays', st.cycleDays, '天', 21, 45) +
        numberRow('经期长度', 'periodDays', st.periodDays, '天', 2, 10) +
        '</div>' +
        '<button class="btn btn-ghost btn-block mt-16" type="button" data-close="1">完成</button>';
      bindNumbers(sheet, close);
    });
  }

  /* 点某天：记入睡 / 起床，顺手看出这三档 */
  function openSleepLog(day) {
    var key = keyOf(day);
    var cur = sleepOf(key);
    var bed = cur ? cur.bed : '23:00';
    var wake = cur ? cur.wake : '07:00';
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML = '<h3 class="sheet-title">' + (day.getMonth() + 1) + '月' + day.getDate() + '日 · 睡眠' +
        (cur && cur.auto ? '<span class="sl-auto">自动记的，可改</span>' : '') + '</h3>' +
        '<div class="tide-set">' +
          '<label class="tide-set-row"><span class="tide-set-name">入睡</span><span class="tide-set-val">' +
            '<input class="tide-set-num" id="slBedH" type="number" inputmode="numeric" min="18" max="30" value="' + (+bed.slice(0, 2)) + '">' +
            '<span class="tide-set-unit">时</span>' +
            '<input class="tide-set-num" id="slBedM" type="number" inputmode="numeric" min="0" max="59" value="' + (+bed.slice(3, 5)) + '">' +
            '<span class="tide-set-unit">分</span>' +
          '</span></label>' +
          '<label class="tide-set-row"><span class="tide-set-name">起床</span><span class="tide-set-val">' +
            '<input class="tide-set-num" id="slWakeH" type="number" inputmode="numeric" min="0" max="23" value="' + (+wake.slice(0, 2)) + '">' +
            '<span class="tide-set-unit">时</span>' +
            '<input class="tide-set-num" id="slWakeM" type="number" inputmode="numeric" min="0" max="59" value="' + (+wake.slice(3, 5)) + '">' +
            '<span class="tide-set-unit">分</span>' +
          '</span></label>' +
        '</div>' +
        '<div class="sl-calc"><span class="sl-calc-label">这一觉</span>' +
          '<span class="tide-sleep-state is-good" id="slCalcState">规律早睡</span>' +
          '<span class="sl-calc-dur" id="slCalcDur">8 小时</span>' +
        '</div>' +
        '<div class="sheet-actions">' +
          '<button class="btn btn-ghost" type="button" data-close="1">取消</button>' +
          '<button class="btn" type="button" id="slSave">记下</button>' +
        '</div>';

      /* 两个时间点一动，时长与档位跟着算，不用自己算 */
      function calc() {
        var bh = Math.round(+sheet.querySelector('#slBedH').value || 0);
        var bm = Math.round(+sheet.querySelector('#slBedM').value || 0);
        var wh = Math.round(+sheet.querySelector('#slWakeH').value || 0);
        var wm = Math.round(+sheet.querySelector('#slWakeM').value || 0);
        var info = sleepInfo({
          bed: pad2(bh % 24) + ':' + pad2(bm > 59 ? 59 : bm),
          wake: pad2(wh % 24) + ':' + pad2(wm > 59 ? 59 : wm)
        });
        var si = sheet.querySelector('#slCalcState');
        var sd = sheet.querySelector('#slCalcDur');
        si.className = 'tide-sleep-state is-' + info.status;
        si.textContent = SLEEP_NAME[info.status];
        sd.textContent = minText(info.dur);
      }

      ['slBedH', 'slBedM', 'slWakeH', 'slWakeM'].forEach(function (id) {
        sheet.querySelector('#' + id).addEventListener('input', calc);
        sheet.querySelector('#' + id).addEventListener('change', calc);
      });
      calc();

      sheet.querySelector('[data-close="1"]').addEventListener('click', close);
      sheet.querySelector('#slSave').addEventListener('click', function () {
        var bh = Math.round(+sheet.querySelector('#slBedH').value || 0);
        var bm = Math.round(+sheet.querySelector('#slBedM').value || 0);
        var wh = Math.round(+sheet.querySelector('#slWakeH').value || 0);
        var wm = Math.round(+sheet.querySelector('#slWakeM').value || 0);
        if (bm > 59) bm = 59;
        if (wm > 59) wm = 59;
        if (bh > 29) bh = 29;
        var b = pad2(bh % 24) + ':' + pad2(bm);
        var w2 = pad2(wh % 24) + ':' + pad2(wm);
        if (toMin(w2) - toMin(b) === 0) { YM.ui.toast('睡了 0 分钟？再核对一下'); return; }
        saveSleep(key, { bed: b, wake: w2, createdAt: Date.now(), auto: false });
        close();
        render();
        var info = sleepInfo(sleepOf(key));
        YM.ui.toast(info.status === 'late' ? '记下了：这天睡得晚' :
          (info.status === 'short' ? '记下了：这天睡得少' : '记下了：规律早睡'));
      });
    });
  }

  function openSleepSettings() {
    var st = settings();
    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML = '<h3 class="sheet-title">睡眠设置</h3>' +
        '<div class="tide-set">' +
        numberRow('目标时长', 'sleepHours', st.sleepHours, '小时', 4, 12) +
        '</div>' +
        '<button class="btn btn-ghost btn-block mt-16" type="button" data-close="1">完成</button>';
      bindNumbers(sheet, close);
    });
  }

  function paint() {
    app.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light');
  }

  function boot() {
    var t = day0(new Date());
    pick = t;
    view = { y: t.getFullYear(), m: t.getMonth() };
    bind();
    syncAction();
    render();
    paint();
    YM.event.on('ym:sleep-auto', function (got) {
    render();
    YM.ui.toast('昨晚没再动手机，已记下 ' + got.rec.bed + ' 睡 · ' + got.rec.wake + ' 起');
  });

  YM.event.on('ym:data', function (detail) {
      var sc = detail ? detail.scope : 'all';
      paint();
      if (sc === 'all' || sc === 'tide') render();
    });
  }

  boot();
})();
