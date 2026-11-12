/* ============================================================
   忆梦 · me.js（我的资料页）
   依赖：window.YM（common.js）
   数据：d.me = { name, avatar, bio }
   ============================================================ */
(function () {
  'use strict';

  var avatarEl = document.getElementById('meAvatar');
  var nameEl = document.getElementById('meName');
  var bioEl = document.getElementById('meBio');
  var avatarNote = document.getElementById('meAvatarNote');
  var nameNote = document.getElementById('meNameNote');
  var bioNote = document.getElementById('meBioNote');

  function meOf() {
    var d = YM.store.get() || {};
    var me = d.me || {};
    return {
      name: me.name || '我',
      avatar: me.avatar || '',
      bio: me.bio || ''
    };
  }

  function save(patch) {
    YM.store.update(function (d) {
      if (!d.me) d.me = { name: '我', avatar: '', bio: '' };
      if ('name' in patch) d.me.name = patch.name;
      if ('avatar' in patch) d.me.avatar = patch.avatar;
      if ('bio' in patch) d.me.bio = patch.bio;
    }, 'all');
    render();
  }

  function render() {
    var me = meOf();
    avatarEl.style.backgroundImage = me.avatar ? 'url("' + me.avatar.replace(/"/g, '%22') + '")' : '';
    avatarEl.textContent = me.avatar ? '' : YM.avatarText(me.name);
    nameEl.textContent = me.name;
    bioEl.textContent = me.bio;
    bioEl.hidden = !me.bio;
    avatarNote.textContent = me.avatar ? '已设置' : '未设置';
    nameNote.textContent = me.name;
    bioNote.textContent = me.bio || '未填写';
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

  function changeAvatar() {
    YM.ui.actionSheet({
      title: '换一张头像',
      items: [
        { key: 'pick', label: '从相册选一张' },
        { key: 'reset', label: '用名字当头像' }
      ]
    }).then(function (item) {
      if (!item) return;
      if (item.key === 'reset') {
        save({ avatar: '' });
        YM.ui.toast('头像已恢复');
        return;
      }
      pickImage(300 * 1024).then(function (b64) {
        if (!b64) return;
        save({ avatar: b64 });
        YM.ui.toast('头像已更新');
      });
    });
  }

  document.getElementById('meBack').addEventListener('click', function () {
    if (history.length > 1) history.back();
    else location.href = 'sessions.html';
  });

  avatarEl.addEventListener('click', changeAvatar);

  document.querySelector('.me-card').addEventListener('click', function (e) {
    var item = e.target.closest('[data-act]');
    if (!item) return;
    var act = item.getAttribute('data-act');
    if (act === 'avatar') { changeAvatar(); return; }
    if (act === 'name') {
      YM.ui.input({
        title: '昵称',
        value: meOf().name,
        placeholder: '怎么称呼你',
        maxlength: 16,
        rows: 2,
        required: true
      }).then(function (val) {
        if (val === null) return;
        save({ name: val });
        YM.ui.toast('昵称已改');
      });
      return;
    }
    if (act === 'bio') {
      YM.ui.input({
        title: '签名',
        value: meOf().bio,
        placeholder: '写一句给自己的话',
        maxlength: 40,
        rows: 3
      }).then(function (val) {
        if (val === null) return;
        save({ bio: val });
        YM.ui.toast(val ? '签名已保存' : '签名已清空');
      });
    }
  });

  render();
  YM.event.on('ym:data', function (detail) {
    if (!detail || detail.scope === 'all' || detail.scope === 'me') render();
  });
})();
