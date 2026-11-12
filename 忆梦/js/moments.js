/* ============================================================
   忆梦 · moments.js（朋友圈：发文字 / 照片 / 视频 / 地点 / @ / 可见范围）
   ============================================================ */
(function () {
  'use strict';

  var app = document.querySelector('.moments-app');
  if (!app) return;

  var mainEl = document.querySelector('.moments-main');
  var listEl = document.getElementById('momentList');
  var maskEl = document.getElementById('composeMask');
  var taEl = document.getElementById('cpText');
  var countEl = document.getElementById('cpCount');
  var photosEl = document.getElementById('cpPhotos');
  var placeEl = document.getElementById('cpPlace');
  var mentionEl = document.getElementById('mentionValue');
  var scopeEl = document.getElementById('scopeValue');
  var fileEl = document.getElementById('cpFile');
  var videoEl = document.getElementById('cpVideo');
  var pickEl = document.getElementById('cpPick');
  var pickTitleEl = document.getElementById('pickTitle');
  var pickBodyEl = document.getElementById('pickBody');
  var postEl = document.getElementById('cpPost');

  var MAX_MEDIA = 9;
  var MAX_VIDEO_BYTES = 2.5 * 1024 * 1024;
  var MAX_IMAGE_BYTES = 12 * 1024 * 1024;

  var media = [];
  var mentions = [];
  var scope = { mode: 'all', ids: [] };
  var pickKind = '';
  var pickSel = [];
  var pickMode = 'all';
  var busy = false;

  /* ---------- 数据 ---------- */
  function load() {
    return YM.store.get() || {};
  }

  function members() {
    var d = load();
    return (d.members || []).filter(function (m) { return m && m.id; });
  }

  function memberById(id) {
    var ms = members();
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].id === id) return ms[i];
    }
    return null;
  }

  function scopeText(sc) {
    var mode = sc && sc.mode || 'all';
    var n = (sc && sc.ids || []).length;
    if (mode === 'include' && n) return '仅 ' + n + ' 人可见';
    if (mode === 'exclude' && n) return n + ' 人不可见';
    return '公开';
  }

  function mediaOf(m) {
    if (m && Array.isArray(m.media)) return m.media;
    if (m && Array.isArray(m.photos)) {
      return m.photos.map(function (src) { return { kind: 'image', src: src }; });
    }
    return [];
  }

  /* ---------- 列表 ---------- */
  function textHtml(text, ids) {
    var esc = YM.util.escapeHtml(text || '');
    (ids || []).forEach(function (id) {
      var m = memberById(id);
      if (!m) return;
      var tag = '@' + m.name;
      esc = esc.split(YM.util.escapeHtml(tag)).join(
        '<span class="mc-at">' + YM.util.escapeHtml(tag) + '</span>'
      );
    });
    return esc;
  }

  function srcAttr(src) {
    return String(src).replace(/"/g, '&quot;');
  }

  function mediaHtml(list) {
    if (!list || !list.length) return '';
    var one = list.length === 1 ? ' is-one' : '';
    return '<div class="mc-photos' + one + '">' +
      list.map(function (it, i) {
        if (it.kind === 'video') {
          return '<div class="mc-photo is-video"><video src="' + srcAttr(it.src) +
            '" controls playsinline preload="metadata"></video></div>';
        }
        return '<div class="mc-photo"><img src="' + srcAttr(it.src) +
          '" alt="第 ' + (i + 1) + ' 张"></div>';
      }).join('') +
      '</div>';
  }

  function footHtml(m) {
    var bits = [];
    if (m.place) {
      bits.push(
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 21s6.5-6.2 6.5-11a6.5 6.5 0 1 0-13 0c0 4.8 6.5 11 6.5 11z"/><circle cx="12" cy="10" r="2.2"/></svg>' +
        '<span>' + YM.util.escapeHtml(m.place) + '</span>'
      );
    }
    bits.push(
      '<span class="mc-scope" data-scope="' + YM.util.escapeHtml(m.id) + '" role="button" tabindex="0">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M2.8 12S6.2 5.6 12 5.6 21.2 12 21.2 12 18 18.4 12 18.4 2.8 12 2.8 12z"/><circle cx="12" cy="12" r="2.6"/></svg>' +
      '<span>' + YM.util.escapeHtml(scopeText(m.scope)) + '</span>' +
      '</span>'
    );
    return '<div class="mc-foot">' + bits.join('<span class="mc-foot-sep"></span>') + '</div>';
  }

  /* ---------- 点赞 / 评论 ---------- */
  var HEART_FILL = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">' +
    '<path d="M12 20.2s-7.2-4.4-7.2-9.6a4 4 0 0 1 7.2-2.4 4 4 0 0 1 7.2 2.4c0 5.2-7.2 9.6-7.2 9.6z"/></svg>';
  var HEART_LINE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 19.6s-6.8-4.2-6.8-9.1a3.8 3.8 0 0 1 6.8-2.3 3.8 3.8 0 0 1 6.8 2.3c0 4.9-6.8 9.1-6.8 9.1z"/></svg>';
  var CMT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M20 12.4c0 3.9-3.6 7-8 7-1 0-2-.2-2.9-.4L4.6 20l1.1-3.7A6.6 6.6 0 0 1 4 12.4c0-3.9 3.6-7 8-7s8 3.1 8 7z"/></svg>';

  function nameOf(id) {
    if (id === 'me') return '我';
    var m = memberById(id);
    return m ? m.name : '';
  }

  function inUse(id) {
    var ids = {};
    YM.membersInUse(load()).forEach(function (m) { ids[m.id] = 1; });
    return !!ids[id];
  }

  function likesOf(m) {
    if (!Array.isArray(m.likes)) return [];
    return m.likes.filter(function (id) { return id === 'me' || inUse(id); });
  }

  function cmtsOf(m) {
    var list = Array.isArray(m.comments) ? m.comments : [];
    return list.filter(function (c) { return c && (c.by === 'me' || inUse(c.by)); });
  }

  function visibleMembers(sc) {
    var ms = YM.membersInUse(load());
    var mode = sc && sc.mode || 'all';
    var ids = (sc && sc.ids) || [];
    if (mode === 'include') return ms.filter(function (m) { return ids.indexOf(m.id) >= 0; });
    if (mode === 'exclude') return ms.filter(function (m) { return ids.indexOf(m.id) < 0; });
    return ms;
  }

  function socialHtml(m) {
    var likes = likesOf(m);
    var cs = cmtsOf(m);
    var mine = likes.indexOf('me') >= 0;
    var html = '';
    if (likes.length) {
      html += '<div class="mc-likes"><span class="mc-heart">' + HEART_FILL + '</span>' +
        '<span class="mc-like-names">' + likes.map(function (id) {
          return YM.util.escapeHtml(nameOf(id));
        }).filter(Boolean).join('、') + ' 赞过</span></div>';
    }
    if (cs.length) {
      html += '<div class="mc-cmts">' + cs.map(function (c) {
        var who = YM.util.escapeHtml(nameOf(c.by) || '某人');
        var to = '';
        if (c.to) {
          cs.forEach(function (x) { if (x.id === c.to) to = nameOf(x.by); });
        }
        return '<div class="mc-cmt' + (c.to ? ' is-reply' : '') + '" data-cid="' +
          YM.util.escapeHtml(c.id) + '">' +
          '<span class="mc-cmt-name">' + who + '</span>' +
          (to ? '<span class="mc-cmt-to">回复 ' + YM.util.escapeHtml(to) + '：</span>'
              : '<span class="mc-cmt-colon">：</span>') +
          '<span class="mc-cmt-text">' + textHtml(c.text, []) + '</span></div>';
      }).join('') + '</div>';
    }
    html += '<div class="mc-acts">' +
      '<button class="mc-act' + (mine ? ' is-on' : '') + '" type="button" data-like="' +
      YM.util.escapeHtml(m.id) + '" aria-label="点赞">' + (mine ? HEART_FILL : HEART_LINE) +
      '<span>' + (likes.length ? likes.length : '赞') + '</span></button>' +
      '<button class="mc-act" type="button" data-cmt="' + YM.util.escapeHtml(m.id) +
      '" aria-label="评论">' + CMT_ICON + '<span>' + (cs.length ? cs.length : '评论') + '</span></button>' +
      '</div>';
    return html;
  }

  /* ---------- 角色反应（点赞 / 评论 / 回复） ---------- */
  var REACT_POOL = ['看到了。', '在的。', '嗯，记下了。', '我这边也刚想到这个。', '这条我留着。'];
  var REPLY_POOL = ['嗯。', '我也这么想。', '好，知道了。', '那就这样。'];
  var scheduled = {};
  var timers = [];

  function patchMoment(id, fn) {
    YM.store.update(function (d) {
      var ms = d.moments || [];
      for (var i = 0; i < ms.length; i++) {
        if (ms[i].id === id) fn(ms[i]);
      }
    }, 'moments');
  }

  function addLike(id, who) {
    if (!who) return;
    patchMoment(id, function (m) {
      if (!Array.isArray(m.likes)) m.likes = [];
      if (m.likes.indexOf(who.id) < 0) m.likes.push(who.id);
    });
    render();
  }

  function addComment(id, who) {
    if (!who) return;
    var c = {
      id: YM.util.uid('c'),
      by: who.id,
      text: pickOne(REACT_POOL),
      at: Date.now()
    };
    patchMoment(id, function (m) {
      if (!Array.isArray(m.comments)) m.comments = [];
      m.comments.push(c);
    });
    render();
  }

  function pickOne(list) {
    if (!list || !list.length) return null;
    return list[YM.util.randInt(0, list.length - 1)];
  }

  // 人数跟着「这条能给谁看」走：N 个角色里挑 1~N 个点赞，再挑 1~N 个来评论
  function scheduleMoment(m) {
    if (scheduled[m.id] || m.reactDone) return;
    var pool = visibleMembers(m.scope);
    if (!pool.length) return;
    var age = Date.now() - (m.createdAt || 0);
    if (age > 30 * 60 * 1000) return;
    scheduled[m.id] = true;

    var likers = YM.util.shuffle(pool).slice(0, YM.util.randInt(1, pool.length));
    likers.forEach(function (who, i) {
      var at = 5000 + i * 4000 + Math.random() * 6000;
      timers.push(setTimeout(function () { addLike(m.id, who); }, at));
    });

    var speakers = YM.util.shuffle(pool).slice(0, YM.util.randInt(1, pool.length));
    speakers.forEach(function (who, i) {
      var at = 9000 + i * 5000 + Math.random() * 7000;
      timers.push(setTimeout(function () { addComment(m.id, who); }, at));
    });

    var tail = Math.max(12000, 9000 + speakers.length * 5000) + 15000;
    timers.push(setTimeout(function () {
      patchMoment(m.id, function (mm) { mm.reactDone = true; });
    }, tail));
  }

  function scheduleReply(id, cid, pool) {
    var who = pickOne(pool);
    if (!who) return;
    var delay = 4000 + Math.random() * 10000;
    timers.push(setTimeout(function () {
      var c = { id: YM.util.uid('c'), by: who.id, text: pickOne(REPLY_POOL), at: Date.now(), to: cid };
      patchMoment(id, function (m) {
        if (!Array.isArray(m.comments)) m.comments = [];
        m.comments.push(c);
      });
      render();
    }, delay));
  }

  function toggleLike(id) {
    patchMoment(id, function (m) {
      if (!Array.isArray(m.likes)) m.likes = [];
      var at = m.likes.indexOf('me');
      if (at >= 0) m.likes.splice(at, 1);
      else m.likes.push('me');
    });
    render();
  }

  function findComment(mid, cid) {
    var m = null;
    (load().moments || []).forEach(function (x) { if (x.id === mid) m = x; });
    if (!m) return null;
    var cs = m.comments || [];
    for (var i = 0; i < cs.length; i++) if (cs[i].id === cid) return cs[i];
    return null;
  }

  function deleteComment(mid, cid) {
    patchMoment(mid, function (m) {
      m.comments = (m.comments || []).filter(function (c) {
        return c.id !== cid && c.to !== cid;
      });
    });
    render();
    YM.ui.toast('已删除');
  }

  function findMoment(mid) {
    var ms = load().moments || [];
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].id === mid) return ms[i];
    }
    return null;
  }

  // 点卡片底部的眼睛：把这条到底给谁看摊开——公开列全部，部分可见 / 不给谁看列选中的那几位
  function openScope(mid) {
    var m = findMoment(mid);
    if (!m) return;
    var mode = m.scope && m.scope.mode || 'all';
    var ids = (m.scope && m.scope.ids) || [];
    var all = YM.membersInUse(load());
    var picked = all.filter(function (x) { return ids.indexOf(x.id) >= 0; });
    var note = '所有人都能看见';
    var list = all;
    if (mode === 'include') {
      note = picked.length ? '只给下面这几位看' : '还没有选谁，这条目前谁都看不到';
      list = picked;
    } else if (mode === 'exclude') {
      note = picked.length ? '下面这几位看不到' : '还谁都能看见';
      list = picked;
    }
    var rows = list.map(function (x) {
      return '<div class="scope-row">' + YM.avatarHtml(x, 30) +
        '<span class="scope-name">' + YM.util.escapeHtml(x.name) + '</span></div>';
    }).join('');
    if (!rows) rows = '<p class="scope-note">这里还没有角色。</p>';

    YM.ui.sheet(function (sheet, close) {
      sheet.innerHTML =
        '<h2 class="sheet-title">谁可以看</h2>' +
        '<p class="scope-note">' + note + '</p>' +
        '<div class="scope-list">' + rows + '</div>' +
        '<div class="sheet-actions"><button type="button" class="btn btn-block" data-ok="1">知道了</button></div>';
      sheet.addEventListener('click', function (e) {
        if (e.target.closest('[data-ok]')) close();
      });
    });
  }

  function replyToComment(mid, cid) {
    var c = findComment(mid, cid);
    if (!c) return;
    YM.ui.input({
      title: '回复 ' + (nameOf(c.by) || '对方'),
      placeholder: '写一句…',
      maxlength: 200,
      rows: 2,
      okText: '发送'
    }).then(function (v) {
      if (!v) return;
      patchMoment(mid, function (m) {
        if (!Array.isArray(m.comments)) m.comments = [];
        m.comments.push({ id: YM.util.uid('c'), by: 'me', text: v, at: Date.now(), to: cid });
      });
      render();
    });
  }

  function openCommentMenu(mid, cid) {
    var c = findComment(mid, cid);
    if (!c) return;
    if (c.by === 'me') {
      YM.ui.actionSheet({ items: [{ label: '删除这条评论' }] }).then(function (item) {
        if (item && item.label === '删除这条评论') deleteComment(mid, cid);
      });
      return;
    }
    YM.ui.actionSheet({ items: [{ label: '回复' }] }).then(function (item) {
      if (item && item.label === '回复') replyToComment(mid, cid);
    });
  }

  function openComment(id) {
    YM.ui.input({
      title: '评论',
      placeholder: '写一句…',
      maxlength: 200,
      rows: 2,
      okText: '发送'
    }).then(function (v) {
      if (!v) return;
      var cid = YM.util.uid('c');
      patchMoment(id, function (m) {
        if (!Array.isArray(m.comments)) m.comments = [];
        m.comments.push({ id: cid, by: 'me', text: v, at: Date.now() });
      });
      render();
      var mm = null;
      (load().moments || []).forEach(function (x) { if (x.id === id) mm = x; });
      if (mm) scheduleReply(id, cid, visibleMembers(mm.scope));
    });
  }

  function cardHtml(m) {
    return '<li class="moment-card" data-id="' + YM.util.escapeHtml(m.id) + '">' +
      '<div class="mc-head">' +
        '<span class="mc-avatar">' + YM.avatarHtml({ name: '我' }, 34) + '</span>' +
        '<span class="mc-names"><span class="mc-name">我</span>' +
        '<span class="mc-time">' + YM.util.escapeHtml(YM.util.formatRelative(m.createdAt || Date.now())) + '</span></span>' +
        '<button class="mc-more" type="button" data-more="' + YM.util.escapeHtml(m.id) + '" aria-label="更多操作">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">' +
        '<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg></button>' +
      '</div>' +
      (m.text ? '<p class="mc-text">' + textHtml(m.text, m.mentions) + '</p>' : '') +
      mediaHtml(mediaOf(m)) +
      footHtml(m) +
      socialHtml(m) +
      '</li>';
  }

  function render() {
    var d = load();
    var ms = (d.moments || []).slice().sort(function (a, b) {
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
    listEl.innerHTML = ms.map(cardHtml).join('');
    mainEl.classList.toggle('is-empty', !ms.length);
    ms.forEach(scheduleMoment);
  }

  function deleteMoment(id) {
    YM.ui.confirm({
      title: '删除这条朋友圈？',
      body: '删掉之后，这条文字、照片和视频都不会再留着。',
      okText: '删除',
      danger: true
    }).then(function (yes) {
      if (!yes) return;
      YM.store.update(function (d) {
        d.moments = (d.moments || []).filter(function (m) { return m.id !== id; });
      }, 'moments');
      render();
      YM.ui.toast('已删除');
    });
  }

  function openMore(id) {
    YM.ui.actionSheet({
      items: [{ label: '删除这条' }]
    }).then(function (item) {
      if (item && item.label === '删除这条') deleteMoment(id);
    });
  }

  /* ---------- 发布页 ---------- */
  function setCount() {
    countEl.textContent = (taEl.value || '').length + '/600';
    postEl.disabled = busy || (!taEl.value.trim() && !media.length);
  }

  function videoGlyph() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">' +
      '<path d="M9.2 6.4l8.2 5.6-8.2 5.6z"/></svg>';
  }

  function renderMedia() {
    var html = media.map(function (it, i) {
      var inner = it.kind === 'video'
        ? '<span class="cp-video-holder">' + videoGlyph() + '<span class="cp-video-tag">视频</span></span>'
        : '<img src="' + srcAttr(it.src) + '" alt="第 ' + (i + 1) + ' 张">';
      return '<div class="cp-photo' + (it.kind === 'video' ? ' is-video' : '') + '" data-i="' + i + '">' + inner +
        '<button class="cp-photo-del" type="button" data-del="' + i + '" aria-label="删掉这一项">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
        '<path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
    }).join('');
    if (media.length < MAX_MEDIA) {
      html += '<button class="cp-add" type="button" id="cpAdd" aria-label="添加照片或视频">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">' +
        '<path d="M12 5v14M5 12h14"/></svg></button>';
    }
    photosEl.innerHTML = html;
    photosEl.classList.toggle('is-none', !media.length && false);
    var addBtn = document.getElementById('cpAdd');
    if (addBtn) addBtn.addEventListener('click', pickMedia);
    Array.prototype.forEach.call(photosEl.querySelectorAll('[data-del]'), function (btn) {
      btn.addEventListener('click', function () {
        var i = Number(btn.getAttribute('data-del'));
        media.splice(i, 1);
        renderMedia();
        setCount();
      });
    });
  }

  function pickMedia() {
    YM.ui.actionSheet({
      title: '添加',
      items: [
        { label: '照片' },
        { label: '视频' }
      ]
    }).then(function (i) {
      if (i === null) return;
      if (i === 0) fileEl.click();
      if (i === 1) videoEl.click();
    });
  }

  function resetCompose() {
    media = [];
    mentions = [];
    scope = { mode: 'all', ids: [] };
    taEl.value = '';
    placeEl.value = '';
    mentionEl.textContent = '不 @ 任何人';
    scopeEl.textContent = '公开';
    renderMedia();
    setCount();
  }

  function openCompose() {
    resetCompose();
    maskEl.classList.remove('hide');
    maskEl.setAttribute('aria-hidden', 'false');
    pickEl.classList.add('hide');
    setTimeout(function () { taEl.focus(); }, 60);
  }

  function closeCompose() {
    maskEl.classList.add('hide');
    maskEl.setAttribute('aria-hidden', 'true');
    pickEl.classList.add('hide');
  }

  function compress(file) {
    return new Promise(function (resolve, reject) {
      if (!file) { reject(new Error('no_file')); return; }
      if (file.size > MAX_IMAGE_BYTES) { reject(new Error('too_large')); return; }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        try {
          var w = img.naturalWidth, h = img.naturalHeight;
          var max = 1000;
          if (w > max || h > max) {
            var r = Math.min(max / w, max / h);
            w = Math.round(w * r);
            h = Math.round(h * r);
          }
          var cv = document.createElement('canvas');
          cv.width = w;
          cv.height = h;
          cv.getContext('2d').drawImage(img, 0, 0, w, h);
          var data = cv.toDataURL('image/jpeg', 0.72);
          URL.revokeObjectURL(url);
          if (!data || data.length < 20) { reject(new Error('encode_failed')); return; }
          resolve(data);
        } catch (e) {
          URL.revokeObjectURL(url);
          reject(e);
        }
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('decode_failed'));
      };
      img.src = url;
    });
  }

  function addImages(files) {
    var list = Array.prototype.slice.call(files || []);
    if (!list.length) return;
    var room = MAX_MEDIA - media.length;
    if (room <= 0) { YM.ui.toast('最多 ' + MAX_MEDIA + ' 项'); return; }
    if (list.length > room) { list = list.slice(0, room); YM.ui.toast('最多 ' + MAX_MEDIA + ' 项'); }
    busy = true;
    postEl.disabled = true;
    var remaining = list.length;
    list.forEach(function (file) {
      compress(file).then(function (src) {
        media.push({ kind: 'image', src: src });
      }).catch(function (err) {
        YM.ui.toast(err && err.message === 'too_large' ? '这张照片太大了' : '这张照片读不出来');
      }).then(function () {
        remaining--;
        if (remaining > 0) return;
        busy = false;
        renderMedia();
        setCount();
      });
    });
  }

  function addVideo(file) {
    if (!file) return;
    if (media.length >= MAX_MEDIA) { YM.ui.toast('最多 ' + MAX_MEDIA + ' 项'); return; }
    if (!/^video\//.test(file.type || '')) { YM.ui.toast('这不是视频文件'); return; }
    if (file.size > MAX_VIDEO_BYTES) {
      YM.ui.toast('视频请控制在 2.5MB 以内');
      return;
    }
    busy = true;
    postEl.disabled = true;
    YM.util.fileToBase64(file).then(function (src) {
      media.push({ kind: 'video', src: src });
      renderMedia();
    }).catch(function () {
      YM.ui.toast('这个视频读不出来');
    }).then(function () {
      busy = false;
      setCount();
    });
  }

  /* ---------- 提到谁 / 可见范围 ---------- */
  function pickRow(m, checked) {
    return '<label class="pick-item">' +
      '<span class="pick-face">' + YM.avatarHtml(m, 30) + '</span>' +
      '<span class="pick-name">' + YM.util.escapeHtml(m.name) + '</span>' +
      '<span class="pick-box' + (checked ? ' is-on' : '') + '" aria-hidden="true">' +
      (checked ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5.5 12.5l4.5 4.5L18.5 7.5"/></svg>' : '') +
      '</span>' +
      '<input type="checkbox" value="' + YM.util.escapeHtml(m.id) + '"' + (checked ? ' checked' : '') + ' hidden>' +
      '</label>';
  }

  function scopeOptionRow(key, label, note) {
    var on = pickMode === key;
    return '<label class="pick-item pick-option" data-mode="' + key + '">' +
      '<span class="pick-main"><span class="pick-name">' + label + '</span>' +
      (note ? '<span class="pick-note">' + note + '</span>' : '') + '</span>' +
      '<span class="pick-radio' + (on ? ' is-on' : '') + '" aria-hidden="true"></span>' +
      '</label>';
  }

  function renderPickBody() {
    var ms = YM.membersInUse(load());
    if (pickKind === 'mention') {
      pickTitleEl.textContent = '提到谁';
      if (!ms.length) {
        pickBodyEl.innerHTML = '<p class="pick-note">还没有角色，先去会话页加一位。</p>';
        return;
      }
      pickBodyEl.innerHTML = '<div class="pick-list">' +
        ms.map(function (m) { return pickRow(m, pickSel.indexOf(m.id) >= 0); }).join('') +
        '</div>';
    } else {
      pickTitleEl.textContent = '谁可以看';
      var html = '<div class="pick-list">' +
        scopeOptionRow('all', '公开', '所有人都能看见') +
        scopeOptionRow('include', '部分可见', '只给选中的角色看') +
        scopeOptionRow('exclude', '不给谁看', '选中的角色看不到') +
        '</div>';
      if (pickMode !== 'all') {
        if (!ms.length) {
          html += '<p class="pick-note">还没有角色，先去会话页加一位。</p>';
        } else {
          html += '<p class="pick-note">' + (pickMode === 'include' ? '选中的角色能看到这条' : '选中的角色看不到这条') + '</p>';
          html += '<div class="pick-list">' +
            ms.map(function (m) { return pickRow(m, pickSel.indexOf(m.id) >= 0); }).join('') +
            '</div>';
        }
      }
      pickBodyEl.innerHTML = html;
    }
    bindPickBody();
  }

  function bindPickBody() {
    Array.prototype.forEach.call(pickBodyEl.querySelectorAll('.pick-item'), function (row) {
      row.addEventListener('click', function (e) {
        e.preventDefault();
        var mode = row.getAttribute('data-mode');
        if (mode) {
          pickMode = mode;
          if (mode === 'all') pickSel = [];
          renderPickBody();
          return;
        }
        var input = row.querySelector('input');
        var id = input && input.value;
        if (!id) return;
        var at = pickSel.indexOf(id);
        if (at >= 0) pickSel.splice(at, 1);
        else pickSel.push(id);
        renderPickBody();
      });
    });
  }

  function openPick(kind) {
    pickKind = kind;
    if (kind === 'mention') {
      pickSel = mentions.slice();
    } else {
      pickMode = scope.mode === 'all' ? 'all' : scope.mode;
      pickSel = scope.ids.slice();
    }
    pickEl.classList.remove('hide');
    renderPickBody();
  }

  function closePick() {
    pickEl.classList.add('hide');
  }

  function commitPick() {
    if (pickKind === 'mention') {
      var ids = pickSel.slice();
      mentions = ids;
      mentionEl.textContent = ids.length
        ? '提到 ' + ids.map(function (id) {
            var m = memberById(id);
            return m ? m.name : '';
          }).filter(Boolean).join('、')
        : '不 @ 任何人';
      if (ids.length) {
        var ins = ids.map(function (id) {
          var m = memberById(id);
          return m ? '@' + m.name : '';
        }).filter(Boolean).join(' ');
        var pos = typeof taEl.selectionStart === 'number' ? taEl.selectionStart : taEl.value.length;
        var end = typeof taEl.selectionEnd === 'number' ? taEl.selectionEnd : pos;
        taEl.value = taEl.value.slice(0, pos) + ins + ' ' + taEl.value.slice(end);
        setCount();
      }
    } else {
      scope = { mode: pickMode, ids: pickMode === 'all' ? [] : pickSel.slice() };
      if (scope.mode !== 'all' && !scope.ids.length) {
        scope.mode = 'all';
        scope.ids = [];
        YM.ui.toast('没选人，这条按公开算');
      }
      scopeEl.textContent = scopeText(scope);
    }
    closePick();
  }

  function post() {
    if (busy) return;
    var text = (taEl.value || '').trim();
    if (!text && !media.length) { YM.ui.toast('写点什么再发'); return; }
    var payload = {
      id: YM.util.uid('mo'),
      text: text,
      media: media.slice(),
      place: (placeEl.value || '').trim(),
      mentions: mentions.slice(),
      scope: { mode: scope.mode, ids: scope.ids.slice() },
      createdAt: Date.now()
    };
    YM.store.update(function (d) {
      if (!Array.isArray(d.moments)) d.moments = [];
      d.moments.push(payload);
    }, 'moments');
    closeCompose();
    render();
    YM.ui.toast('已发布');
  }

  /* ---------- 绑定 ---------- */
  document.getElementById('btnCompose').addEventListener('click', openCompose);
  document.getElementById('cpCancel').addEventListener('click', closeCompose);
  postEl.addEventListener('click', post);
  taEl.addEventListener('input', setCount);
  fileEl.addEventListener('change', function () {
    addImages(fileEl.files);
    fileEl.value = '';
  });
  videoEl.addEventListener('change', function () {
    addVideo(videoEl.files && videoEl.files[0]);
    videoEl.value = '';
  });
  document.getElementById('rowMention').addEventListener('click', function () { openPick('mention'); });
  document.getElementById('rowScope').addEventListener('click', function () { openPick('scope'); });
  document.getElementById('pickCancel').addEventListener('click', closePick);
  document.getElementById('pickOk').addEventListener('click', commitPick);

  listEl.addEventListener('click', function (e) {
    var more = e.target.closest('[data-more]');
    if (more) {
      e.preventDefault();
      openMore(more.getAttribute('data-more'));
      return;
    }
    var cmtRow = e.target.closest('.mc-cmt');
    if (cmtRow) {
      var cardEl = e.target.closest('.moment-card');
      if (cardEl) {
        e.preventDefault();
        openCommentMenu(cardEl.getAttribute('data-id'), cmtRow.getAttribute('data-cid'));
        return;
      }
    }
    var scopeEl = e.target.closest('.mc-scope');
    if (scopeEl) {
      e.preventDefault();
      openScope(scopeEl.getAttribute('data-scope'));
      return;
    }
    var like = e.target.closest('[data-like]');
    if (like) {
      e.preventDefault();
      toggleLike(like.getAttribute('data-like'));
      return;
    }
    var cmt = e.target.closest('[data-cmt]');
    if (cmt) {
      e.preventDefault();
      openComment(cmt.getAttribute('data-cmt'));
    }
  });

  function paint() {
    app.setAttribute('data-theme', document.documentElement.getAttribute('data-theme') || 'light');
  }

  paint();
  render();
  YM.event.on('ym:data', function (detail) {
    if (!detail || detail.scope === 'settings' || detail.scope === 'all') paint();
    if (!detail || detail.scope !== 'settings') render();
  });
})();
