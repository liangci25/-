# 忆梦 · 命名清单（NAMING.md）

> 本文件是「忆梦」项目命名的**唯一权威**。代码里出现的每一个 id / class / 函数 / 常量 / 存储键 / 事件名，都必须先在本文登记；新增功能先在本文件加条目、编号，再写代码。
>
> - 项目版本：v1.0（PRD 对应 v1.0，P0 31 项）
> - 清单版本：N1（2026-11-08，随 v1.0 首次全量登记）
> - 覆盖范围：`index.html`（根）、`pages/*.html`、`css/*.css`、`js/*.js`、`docs/*.md`、`tools/*.py`

---

## 0. 命名规则

### 0.1 分级编号

四级编号，前缀是模块号，逐级用点分隔：

| 级别 | 形态 | 示例 | 含义 |
| --- | --- | --- | --- |
| 一级 | `NN` | `03` | 模块（一个页面 / 一个内核子系统 / 一套样式层） |
| 二级 | `NN.N` | `03.2` | 区块（页面内的一块区域） |
| 三级 | `NN.N.N` | `03.2.1` | 元素（具体控件、容器、函数） |
| 四级 | `NN.N.N.a` | `03.2.1.a` | 子元素 / 状态（元素内部的零件或状态变体） |

模块号分配：

| 编号 | 模块 | 文件 |
| --- | --- | --- |
| 01 | 桌面 | `index.html` / `css/index.css` / `js/index.js` |
| 02 | 会话列表 | `pages/sessions.html` / `css/sessions.css` / `js/sessions.js` |
| 03 | 聊天 | `pages/chat.html` / `css/chat.css` / `js/chat.js` |
| 04 | 字卡库 | `pages/cards.html` / `css/cards.css` / `js/cards.js` |
| 05 | 设置中心 | `pages/settings.html` / `css/settings.css` / `js/settings.js` |
| 06 | 内核 | `js/common.js`（`window.YM`） |
| 07 | 通用样式与令牌 | `css/common.css` |
| 08 | 工具与测试 | `tools/*.py`、`docs/TESTING.md` |
| 09 | 个人资料 | `pages/profile.html` / `css/profile.css` / `js/profile.js` |

### 0.2 词法规则

| 对象 | 规则 | 示例 |
| --- | --- | --- |
| HTML `id` | 小驼峰，语义 = 控件类型 + 对象 | `btnPlus`、`inputBgValue`、`rangeFontSize` |
| CSS `class` | 全小写连字符（kebab），不带语义前缀除非有模块归属 | `msg-bubble`、`group-caret`、`set-row` |
| 状态 class | `is-` 开头，只表达状态，不表达对象 | `is-open`、`is-hidden`、`is-on`、`is-off`、`is-empty`、`is-busy`、`is-ready` |
| 组件 / 构造器 | 大驼峰（本期只有一个全局命名空间对象 `YM`） | `YM` |
| 函数 | 动词开头，小驼峰 | `renderGroups`、`planTrigger`、`applyBackground` |
| 常量 | 全大写下划线 | `KEYS`、`DEFAULTS`、`BUILTINS`、`LIMITS` |
| 存储键 | 小写下划线，`ym_` 前缀 | `ym_data_v1`、`ym_runtime_v1` |
| 数据属性 | `data-` + 小写连字符 | `data-sid`、`data-mid`、`data-root`、`data-selected` |
| 运行时生成 id | 类型前缀 + `_` + 随机串 | `s_…`、`g_…`、`c_…`、`m_…`、`msg_…`、`task_…`、`trg_…`、`snd_…` |

### 0.3 硬性约束

1. 一个页面 = `x.html` + `x.js` + `x.css`，三件套同名，不得跨页复用同名文件里的**页面专属**命名。
2. 多页共用的一切放 `07`（样式）与 `06`（逻辑），不得写在某个页面的 css/js 里。
3. 同一语义只允许一个名字。已登记的名字不得改名，除非同步修改本文件并提升清单版本（N1 → N2）。
4. 新增页面 = 新模块号；新增区块 = 模块内递增，不复用被删除区块的编号。

---

## 1. 00 全局约定

### 1.1 存储键（`localStorage`）

| 编号 | 键 | 内容 | 写入方 |
| --- | --- | --- | --- |
| 00.1.1 | `ym_data_v1` | 全量业务数据（settings / members / sessions / cardStore / ui） | `YM.store.save` |
| 00.1.2 | `ym_runtime_v1` | 运行时任务 `{tasks:[]}`，不参与导入导出 | `YM.task.*` |
| 00.1.3 | `ym_data_backup_auto` | 导入 / 重置前的自动备份，仅保留最近 1 份 | `YM.store.backup` |
| 00.1.4 | `ym_data_corrupt_v1` | 解析失败时的原始串留存 | `YM.store.get` |
| 00.1.5 | `ym_probe` | 可用性探测键，写入后立即删除 | `YM.store.available` |
| 00.1.6 | `ym_intro_seen` | `sessionStorage`，开场动画已播标记（值 `'1'`），整个浏览器会话只播一次 | `index.js` 的 `startOpening()` |
| 00.1.7 | `ym_call_hour` | 当前时段的来电计划 `{slot, percent, hit, at, rang}`：`slot` 形如 `2026-11-10:17`，每个小时独立摇一次 5%~8%，`at` 是该小时内的分钟点 | `YM.ring.plan` / `YM.ring.mark` |

### 1.2 事件名

| 编号 | 事件 | detail | 触发方 |
| --- | --- | --- | --- |
| 00.2.1 | `ym:data` | `{scope, data}`，scope ∈ `all` / `settings` / `sessions` / `messages` / `cards` / `params` / `members` / `ui` / `external` | `YM.store.update` / `YM.store.save` |
| 00.2.2 | `ym:realtime` | `{sessionId}`，任务状态变化通知 | `YM.task` |

### 1.3 URL 参数与页面入口

| 编号 | 形态 | 说明 |
| --- | --- | --- |
| 00.3.1 | `index.html` | 桌面（根目录，双击入口），无参数 |
| 00.3.2 | `pages/sessions.html` | 会话列表 |
| 00.3.3 | `pages/chat.html?sid=<会话id>` | 聊天页，`sid` 缺失或不存在时提示并回退 |
| 00.3.4 | `pages/cards.html` | 字卡库 |
| 00.3.5 | `pages/settings.html#members` | 设置中心，锚点直达角色区 |
| 00.3.6 | `pages/chat.html?sid=<会话id>&focus=<消息id>` | 从资料页「查找聊天记录」跳回，滚到该条消息并短暂选中 |
| 00.3.7 | `pages/profile.html?sid=<会话id>` | 个人资料页（角色资料 + 聊天设置 / 置顶 / 背景 / 查找 / 清空） |
| 00.3.8 | `../index.html` | 任一子页返回桌面（不重播开场） |

### 1.4 全局运行时标记

| 编号 | 名称 | 位置 | 说明 |
| --- | --- | --- | --- |
| 00.4.1 | `window.YM` | `js/common.js` | 唯一全局命名空间 |
| 00.4.2 | `window.__sgSid` | 各页面 js 内 | 当前上下文会话 id，跨函数传递用 |
| 00.4.3 | `#ym-dynamic-style` | `<head>` 内由内核创建 | 用户字号 / 字体 / 气泡 / 自定义 CSS 的注入容器 |
| 00.4.4 | `#ym-banner` | `body` 顶部由内核创建 | 页内通知条 |
| 00.4.5 | `#ym-undo` | 由 `YM.ui` 创建 | 撤销浮条容器 |

### 1.5 固定上限（`LIMITS`，见 06.9）

用户消息 500 字 / 字卡 200 字 / 分组名 12 字 / 会话名 20 字 / 成员名 12 字 / 正在输入文案 20 字 / 头像 300KB / 背景图 500KB / 音效 200KB 且最多 10 条 / 单次导入 3000 条字卡 / 回复条数 1~3 / 延迟 1~120 秒。

### 1.6 目录结构

```
忆梦/
├─ index.html            桌面入口（唯一放根目录的页面）
├─ pages/                六个子页面：sessions / chat / cards / settings / profile / letters
├─ css/                  common + 六个页面样式
├─ js/                   common + 六个页面脚本
├─ docs/                 README / NAMING / TESTING / PRD
└─ tools/                自检与探针脚本
```

约定：`pages/*.html` 引用 `../css/*.css`、`../js/*.js`；页间互跳同级相对（`chat.html`、`settings.html`）；回桌面用 `../index.html`。

---

## 2. 01 桌面（index）

### 2.1 页面容器

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 01.1.1 | `.app` | class | `index.html` body 内 | 430px 居中限宽外壳（07.3.1） |
| 01.1.2 | `.home` | class | 同上 | 桌面主容器；`.is-ready` 时图标入场 |
| 01.1.3 | `.home.is-ready` | 状态 | `index.js` | 开场动画结束后挂上，触发图标淡入 |

### 2.2 顶部品牌区

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 01.2.1 | `.home-top` | class | `index.html` | 顶部一行 |
| 01.2.2 | `.brand` | class | 同上 | 品牌整体 |
| 01.2.3 | `.brand-word` | class | 同上 | 「忆梦」二字 |
| 01.2.4 | `.brand-mark` | class | 同上 | 品牌下的 SVG 短线 |
| 01.2.5 | `#btnTheme` | id | 同上 | 主题三态切换按钮 |
| 01.2.5.a | `.icon-btn.dim` | 状态 / class | 同上 | 弱化图标按钮样式 |

### 2.3 应用图标网格

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 01.3.1 | `#iconGrid` | id | `index.html` | 图标网格容器 |
| 01.3.2 | `.icon-grid` | class | 同上 | 横排：4 列等宽网格（`repeat(4,1fr)`、列间距 6、行间距 clamp(20,3.6vh,32)），八枚图标正好两行；`.desk` 左右内边距 18px |
| 01.3.3 | `.icon-cell` | class | 同上 | 单个格子（含入场延迟） |
| 01.3.4 | `.app-icon` | class | 同上 | `<a>` 图标链接（4 个：忆梦 / 信笺 / 字卡库 / 设置） |
| 01.3.5 | `.icon-tile` | class | 同上 | 图标方块：72×72、圆角 22、`--panel` 底 + 1px `--line` 边、极浅阴影，内 32px 细线图标 |
| 01.3.6 | `.icon-label` | class | 同上 | 图标下方标签 |

### 2.4 底部

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 01.4.1 | `.home-foot` | class | `index.html` | 底部留白区 |
| 01.4.2 | `.foot-line` | class | 同上 | 40px 短线装饰 |

### 2.5 开场动画

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 01.5.1 | `#opening` | id | `index.html` | 开场遮罩 |
| 01.5.2 | `.opening` | class | 同上 | 遮罩样式，径向光晕 |
| 01.5.3 | `.opening-inner` | class | 同上 | 内容列 |
| 01.5.4 | `#openingWord` | id | 同上 | 「忆梦」逐字展开容器 |
| 01.5.5 | `.opening-word` | class | 同上 | 单字块（clip-path 动画） |
| 01.5.6 | `.opening-rule` | class | 同上 | 生长下划线 |
| 01.5.7 | `.is-out` | 状态 | `index.js` | 收场中 |
| 01.5.8 | `.is-gone` | 状态 | `index.js` | 已移除（可点击跳过） |

### 2.6 函数（`index.js`）

| 编号 | 函数 | 说明 |
| --- | --- | --- |
| 01.6.1 | `startOpening()` | 起动画计时；`prefers-reduced-motion` 或关闭动画时直接结束 |
| 01.6.2 | `finishOpening()` | 收场并移除遮罩、挂 `.is-ready` |
| 01.6.3 | `revealDesk()` | 无动画时直接露出桌面 |
| 01.6.4 | `renderThemeBtn()` | 按当前模式设置主题按钮图标与 `aria-label` |
| 01.6.5 | `checkCapacity()` | 容量 > 4MB 且当天未警告时提示一次 |

---

## 3. 02 会话列表（sessions）

### 3.1 导航

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 02.1.1 | `.nav` / `.nav-title` | class | 通用导航（07.4.1） |
| 02.1.2 | `#btnNew` | id | 右上「＋」按钮：点开贴着按钮的侧弹窗（加好友 / 创建群聊，见 R-14 / R-15） |

### 3.2 列表区

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 02.2.8 | ~~`.s-st` / `.s-st-dot`~~（已撤销：R-142 按用户要求会话列表不再显示状态，聊天页保留）|（`.is-online` / `.is-away` / `.is-busy` / `.is-rest`） | class | 会话卡片姓名后面那枚状态：5px 圆点 + 10.5px 两个字；群聊不显示（`.is-none` 收起） |
| 02.2.1 | `.list-wrap` | class | 列表滚动包裹层 |
| 02.2.2 | `#sessionList` / `.session-list` | id + class | 会话卡片容器 |
| 02.2.3 | `.session-card` | class | 单张卡片，`data-sid` 存会话 id |
| 02.2.3.a | `.s-av` / `.s-dot` | class | 头像的定位壳与「有新消息」小圆点：角色在我上次看这条会话之后发来消息时，头像右上角亮一枚 8px 圆点 |
| 02.2.4 | `.s-main` | class | 卡片主信息区 |
| 02.2.5 | `.s-top` | class | 名称行 |
| 02.2.6 | `.s-name` / `.s-pin` | class | 会话名；置顶的会话名字前挂一枚 12px 图钉（`.s-pin`） |
| 02.2.7 | ~~`.s-badge`~~ | class | 已移除（见 R-20）：会话卡片不再显示「群 N」徽标 |
| 02.2.8 | `.s-time` | class | 相对时间 |
| 02.2.9 | `.s-sub` | class | 最后一条摘要；`.is-empty` 时为空态文案 |
| 02.2.10 | `.s-more` | class | 「⋯」操作按钮，`data-more` 存会话 id |
| 02.2.11 | `session.pinned` | 数据字段 | 布尔；`render()` 排序时置顶优先，其余按 `updatedAt` 倒序（见 R-30） |

### 3.3 空态

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 02.3.1 | `#emptyState` | id | 空态容器 |
| 02.3.2 | `#btnNewEmpty` | id | 空态里的新建按钮 |
| 02.3.3 | `.empty` | class | 通用空态样式（07.4.9） |

### 3.4 加好友卡片 / 建群弹层

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 02.4.1 | `#createMask` / `.create-mask` / `#createCard` / `.create-card` | id + class | 「加好友」面板：**全透明遮罩**（不压暗、背后列表可见）+ 实底卡片（`var(--panel)` 底、1px 线、投影；R-53 去掉了 `color-mix` 半透明与 `backdrop-filter`，那层模糊会把输入框的点击吞掉）；宽度 `min(100vw - 32px, 448px)`、水平居中，顶边距 = 导航高 + 12px |
| 02.4.2 | `.cc-av` / `.cc-av-badge` | class | 每行左侧头像按钮（46px 圆角方块 + 右下「+」角标），点击选本地图片（≤300KB → base64） |
| 02.4.2.a | `#ccRows` / `.cc-rows` | id + class | 好友行容器，默认一行，点「再添加一位」加一行（见 R-22） |
| 02.4.2.b | `.cc-friend` / `.cc-del` | class | 单个好友行与它的「去掉这一位」按钮（只剩一行时隐藏） |
| 02.4.2.c | `#btnAddRow` / `.cc-add` / `.cc-foot` | id + class | 「＋ 再添加一位」虚线圈按钮，与取消/创建按钮同一行靠左 |
| 02.4.3 | `.cc-av-text` | class | 头像占位首字：跟随该行名称实时变，有图时清空 |
| 02.4.4 | `.cc-name` | class | 右侧名称输入（≤20 字），与头像同一行；每行一个。输入框撑满整个胶囊高度（`width/height:100%`、`padding:0`），点胶囊任何位置都能落光标 |
| 02.4.5 | `.cc-url` / `.cc-url-line` / `.cc-url-ico` / `data-act="url"` | class + 属性 | 每位下方自己的一条头像直链输入行（内嵌链接图标，34px 高），只解析并回填本行头像 |
| 02.4.6 | `#urlHint` / `.cc-hint` | id + class | 直链状态提示：默认文案、解析中、已解析尺寸、失败原因；`.is-bad` 为错误态 |
| 02.4.7 | `#btnCancel` / `#btnCreate` / `.cc-actions` | id + class | 取消 / 创建按钮行 |
| 02.4.8 | ~~`#inputRole`~~ | id | 已移除（见 R-09）：新建会话只填一个名字，角色同名自动生成 |
| 02.4.9 | ~~`#btnNewRole`~~ | id | 已移除（见 R-08）：角色统一在设置里维护 |
| 02.4.10 | ~~`.inline-pick`~~ | class | 已移除（见 R-08） |
| 02.4.11 | `#groupName` | id | 建群弹窗的群名称输入框（≤20 字） |
| 02.4.12 | `#pickGrid` / `.pick-grid` | id + class | 建群弹窗的角色多选区 |
| 02.4.13 | `.pick-chip` / `.pick-av` / `.pick-name` / `aria-pressed` | class + 属性 | 单个角色胶囊：首字头像 + 名称，`aria-pressed="true"` 表示已选 |
| 02.4.14 | `#btnGroupOk` | id | 建群弹窗的「创建」按钮 |
| 02.4.15 | `#groupMask` / `#groupCard` / `.is-group` | id + class | 建群弹窗：与「加好友」同一套 `.mask.create-mask` + `.create-card`（`.is-group` 允许多一段群成员、内容超高时卡片内滚动） |
| 02.4.16 | `#gAv` / `#gAvText` | id | 群头像按钮（点一下上传本地图）与首字占位 |
| 02.4.17 | `#gUrl` / `#gUrlBox` / `#gHint` | id | 群头像直链输入行与状态提示（输入防抖 500ms、失焦即解析） |
| 02.4.18 | `.cc-label` | class | 建群弹窗里「群成员（至少两个）」的小标题 |

### 3.4a ＋ 侧弹窗

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 02.4a.1 | `#newPanel` / `.new-pop` / `.is-open` | id + class | 会话页右上 ＋ 下方的小弹窗，`absolute` 定位、右侧与 ＋ 对齐，收起时透明 + 不可点 |
| 02.4a.2 | `.np-item` / `data-key` | class + 属性 | 弹窗条目，上下排列：`friend` 加好友 / `group` 创建群聊 |
| 02.4a.3 | `.np-ico` / `.np-label` | class | 条目内的圆形图标与文字 |

### 3.5 操作菜单

菜单条目文案：`重命名` / `更换头像` / `复制会话` / `删除会话`，由 `YM.ui.actionSheet` 渲染，无独立 id。

### 3.6 函数（`sessions.js`）

| 编号 | 函数 | 说明 |
| --- | --- | --- |
| 02.6.1.a | ~~`statusName(sn)` / `statusCss(sn)`~~（已撤销：R-142 会话列表不再显示状态）| | 函数 | 会话卡片上那枚状态：取 `YM.roleStatus.get(memberId)` 的名字与颜色档（群聊返回空串与 `is-none`） |
| 02.6.1 | `render()` | 重绘列表与空态 |
| 02.6.2 | `lastSummary(sn)` | 生成卡片摘要：只取最后一条消息正文，不加任何前缀（见 R-13）；最后一条是通话记录（`kind==='call'`）时再剥掉「视频通话 · 」前缀，只留 `对方已拒绝` / `无人接听` / `00:04` 这类后段（见 R-73） |
| 02.6.2.a | `unreadOf(sn)` | 函数 | 未读数：`role:'peer'` 且 `createdAt` 晚于 `sn.lastReadAt` 的消息条数 |
| 02.6.3 | `openCreate()` | 「加好友」弹窗：逐行填名字 + 头像，一行也建一个；同名角色复用、否则新建角色，写 `session.memberId`；建 1 个时直接进聊天，建多个时留在列表 |
| 02.6.3.a | `addRow()` | 追加一行好友（头像 + 名字 + 去掉按钮），返回该行状态对象 |
| 02.6.3.b | `paintRow(row)` | 把某一行的头像画到 DOM 上（无图回落名称首字） |
| 02.6.3.c | `syncRemoveButtons()` | 只剩一行时隐藏所有「去掉这一位」，两行以上才显示 |
| 02.6.3.d | `rowTag(row)` | 多行时给提示加「第 N 位：」前缀，单行不加 |
| 02.6.3.e | `probeUrl(url)` / `looksLikeImageUrl(v)` / `normalizeUrl(v)` / `parseUrlField(row)` | 直链解析：后缀初筛 → 补协议 → 探图（6s 超时）→ 回填**该行**头像并报尺寸；输入防抖 500ms、失焦立即解析，每行互不影响 |
| 02.6.4 | `setPop(open)` | 函数 | 开关会话页 ＋ 侧弹窗：切 `.is-open`、同步 `aria-hidden` 与 ＋ 的 `aria-expanded` |
| 02.6.5 | `openCreateGroup()` | 建群弹窗：头像（本地图 / 直链）+ 群名 + 多选角色（≥2），落库时 `groupEnabled=true`、`memberIds=已选`、`memberId=null`；可选的成员来自 `groupRoles(d)`，不足 2 个时提示并转到「加好友」 |
| 02.6.5.0 | `groupRoles(d)` | 建群弹窗的可选成员：只取 `d.sessions` 里带 `memberId` 的会话（`id` / `name` / `avatar` 都来自会话），会话列表里删掉的角色不再出现在选择格子里 |
| 02.6.5.a | `gSetAvatar(src, fromUrl)` | 建群弹窗内：写群头像（有图填背景，无图回落名称首字）；`fromUrl` 标记来源是直链 |
| 02.6.5.b | `gHint(text, bad)` | 建群弹窗内：更新直链状态提示与输入行描边（`.is-bad` / `.is-good`） |
| 02.6.5.c | `gParse()` | 建群弹窗内：解析直链（后缀初筛 → 探图 → 回填头像与尺寸） |
| 02.6.5.d | `closeGroup()` | 收起建群弹窗（`#groupMask` 补 `.hide` + `aria-hidden="true"`） |
| 02.6.6 | `openMore(sid)` | 会话操作菜单 |
| 02.6.7 | `doRename(sid)` | 重命名 |
| 02.6.8 | `doAvatar(sid)` | 更换头像 |
| 02.6.9 | `doCopy(sid)` | 复制会话（新 id、空消息、时间全新） |
| 02.6.10 | `doDelete(sid)` | 二次确认后删除，并 `YM.task.cancel(sid)` |
| 02.6.11 | `pickImage(maxBytes)` | 选图并转 base64 |
| 02.6.12 | ~~`roleOptionsHtml(d, selId)`~~ | 已移除（见 R-09） |
| 02.6.13 | ~~`createRoleQuick(cb)`~~ | 已移除（见 R-08） |
| 02.6.14 | ~~`applyRole()`~~ | 已移除（见 R-09） |
| 02.6.15 | `setAvatar(src, fromUrl)` | 写头像：有图填背景并清空首字，无图回落名称首字；`fromUrl` 标记来源是直链 |
| 02.6.15a | `closeCreate()` | 收起加好友弹窗（`#createMask` 补 `.hide` + `aria-hidden="true"`），点遮罩空白处与「取消」都走它 |
| 02.6.16 | `hint(text, bad)` | 切 `#urlHint` 文案与 `.is-good`/`.is-bad` 描边 |
| 02.6.17 | `probeUrl(url)` | `new Image()` 预加载探测直链是否可用，6s 超时，返回 `{ok,w,h}` |
| 02.6.18 | `looksLikeImageUrl(v)` | 放行 `data:image/`、`//` 或 `http(s)`、以及带图片后缀的文件名 |
| 02.6.19 | `normalizeUrl(v)` | 缺协议时补 `https:` 或 `//` |
| 02.6.20 | `parseUrlField()` | 空值清掉直链头像、非图片链接直接报错、否则「解析中…」→ 成功 `setAvatar(url,true)` 并报尺寸 |

---

## 4. 03 聊天（chat）

### 4.1 容器与背景

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 03.1.1.b | `.nav-ecg` / `.ecg-line` / `.ecg-pulse` / `.ecg-heart` | class | 陪伴中的心电图：132×34、绝对居中（`left:50%` + `translate(-50%,-50%)`），**不再有底色块**（原来那块 `--bg` 白底在照片背景上像浮着一张卡片），两头用 `mask-image: linear-gradient(to right, transparent 0, #000 15%, #000 85%, transparent 100%)` 淡出，折线看起来是化进导航而不是被截断；长标题改成 132px 内省略（不再靠白底去盖），中间一枚 `--accent` 实心爱心（`.ecg-heart`，0.85s 双跳缩放），左右两段心电折线（`.ecg-line` 常态半淡），每条线上再叠一道 `--accent` 亮线（`.ecg-pulse`，`stroke-dasharray:9 340` 配 `@keyframes ecg-run`，1.15s 从外侧往心脏跑）；只在今天这一位角色的陪伴还在时出现 |
| 03.1.1.a0 | `#navEcg` | id | 聊天页导航右侧那枚陪伴心电图小框的容器（84×24），`is-on` 时显示 |
| 03.1.1.a | `.nav-pin` | class | 置顶会话在聊天页导航标题后挂的 12px 图钉（与会话列表的 `.s-pin` 同一造型） |
| 03.1.1 | `.chat-app` | class | 聊天页外壳（固定视口，禁止整页滚动） |
| 03.1.2 | `#chatBg` / `.chat-bg` | id + class | 背景层，`--bg-dim` 控制遮罩浓度 |

### 4.2 导航

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 03.2.1 | `.chat-nav` | class | 导航容器 |
| 03.2.2 | `#btnBack` | id | 返回会话列表 |
| 03.2.3 | `#chatTitle` / `.chat-title` | id + class | 会话名 |
| 03.2.3.a | `.nav-on` / `.nav-on-dot`（`.is-online` / `.is-away` / `.is-busy` / `.is-rest` / `.is-buddy`） | class | 名字下面一行的那枚状态（`margin-top: 4px`，不占名字行）：4.5px 圆点 + 10px 两个字、字距 0.06em（在线 / 忙碌 / 离开 / 休息 / 陪伴中），点颜色分档（绿 `#6C8462` / 红 `#B4483A` / 琥珀 `#C0873C` / 灰 `#9AA0AB` / 陪伴用 `--accent`）；群聊不显示 |
| 03.2.4 | `#chatStatus` / `.chat-status` | id + class | 输入 / 倒计时那行：无内容时 `height: 0` 收起（这样名字 + 状态两行在 52px 导航里上下对称居中），`.is-on` 时才撑到 13px |；`.is-on` 表示有计时 |
| 03.2.5 | ~~`#btnParams`~~ | — | 已撤销：参数入口并入个人资料页 |
| 03.2.6 | `#btnMore` | id | 唯一入口，三点图标，跳 `profile.html?sid=` |

### 4.3 消息区

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 03.3.1 | `#chatScroll` / `.chat-scroll` | id + class | 滚动容器 |
| 03.3.2 | `#msgList` / `.msg-list` | id + class | 消息列表，`flex-start` 顶部对齐 |
| 03.3.3 | `.day-sep` | class | 日期分隔条 |
| 03.3.4 | `.msg` | class | 单条消息；`data-id` 消息 id，`data-selected="1"` 为选中态 |
| 03.3.4.a | `.msg.user` / `.msg.peer` | 状态 class | 己方 / 对方 |
| 03.3.5 | `.avatar` | class | 头像（07.4.8） |
| 03.3.6 | `.msg-body` | class | 头像 + 内容列 |
| 03.3.7 | `.msg-name` | class | 对方 / 成员名称（受显示开关控制） |
| 03.3.8 | `.msg-stack` | class | 气泡纵向堆叠 |
| 03.3.9 | `.msg-bubble` | class | 文本气泡；`.user` / `.peer` 决定配色 |
| 03.3.10 | `.quote` / `.quote-line` / `.quote-text` | class | 引用块三层 |
| 03.3.11 | `.msg-meta` / `.has-meta` | class | 元信息行；`.has-meta` 表示有内容常显 |
| 03.3.12 | `.msg-time` | class | 气泡下方的消息时间戳（`formatMsgTime`：当天只给 `18:06`，昨天 / 前天带「昨天」「前天」前缀，更早带「11月8日」、跨年再补年份），只要设置里开着「显示时间戳」就每条都显示，不再只给选中的那条 |
| 03.3.13 | `.read-mark` | class | 已读标记容器 |
| 03.3.13.a | `.read-dot` / `.read-checks` | class | 圆点 / 双勾两种样式变体（文字样式无子元素） |
| 03.3.14 | `.typing-row` / `.typing-bubble` / `.typing-text` / `.dots` | class | 正在输入指示器 |
| 03.3.15.b | ~~`#callMusicChip` / `.call-chip` / `.cm-wave` / `#callMusicName`~~ | 已删（R-169） |
| 03.3.15.c | ~~`#callMusic` / `#callGear` / `.call-tools` / `.call-tool`~~ | 已删（R-169），通话页回到状态行 + 头像 + 静音/挂断 |
| 03.3.15.d | ~~`.call-view.is-mirror` / `.call-bg.is-warm` / `.is-cool` / `.is-soft`~~ | 已删（R-169） |
| 03.3.15.a | `.call-mask` / `.call-view` / `.call-back` / `.call-bg` / `.call-top` / `.call-status` / `.call-stage` / `.call-avatar` / `.call-actions` / `.call-btn` / `.is-hang` / `.is-off` / `.call-fab` / `.cf-avatar` / `.cf-time` | id + class | 视频通话全屏层（`#callMask`、`#callView`、`#callBack`、`#callBg`、`#callStatus`、`#callAvatar`、`#callMute` / `#callMuteText`、`#callHang` / `#callHangText`、`#callAnswer`）与最小化后的悬浮按钮（`#callFab` 内 `#cfAvatar` 头像 + `#cfTime` 时长）：深色底、头像做模糊背景、中央大头像、左上返回键（最小化）、底部静音 + 挂断两枚圆形按钮；顶部只有一行状态（「正在呼叫…」/「通话中 00:05」），**不再显示对方名字**（`.call-name` / `#callName` 已删）。`.call-view` 只是把背景与舞台包成一层，尺寸按常规固定值；`.call-fab` 是通话最小化后贴在聊天右下、盖在输入框上方的椭圆悬浮按钮，点它回到通话页。纯模拟，不调摄像头 |
| 03.3.15.b | `.call-card` / `.cc-ico` / `.cc-text` | class | 挂断后落进聊天的那条通话记录（摄像机图标 + 结尾那段：`00:12` / `已拒绝` / `无人接听` / `已取消` / `对方已拒绝`；`callCardHtml()` 会把存储里的「视频通话 · 」前缀剥掉，只留图标和后段） |
| 03.3.15.c | `.call-btn.is-answer` / `.call-mask.is-incoming` | class | 来电态：`.is-incoming` 挂在 `#callMask` 上（头像做 2.6s 呼吸缩放），`.is-answer` 是底部左侧那颗绿色（`#2E9B68`）摄像机圆形按钮，文案「接听」；来电时隐藏静音与左上返回，挂断键文案变「拒绝」 |
| 03.3.15 | `.money-card` / `.packet` / `.transfer` / `.is-claimed` | class | 红包 / 转账消息卡片：`.packet` 暖红底白字、`.transfer` 常规面板底，`.is-claimed` 领取后整体降到 55% 透明度 |
| 03.3.15.a | `.mc-ico` / `.mc-body` / `.mc-amount` / `.mc-note` / `.mc-state` | class | 卡片内部五层：圆形图标、内容列、金额、备注、右侧状态胶囊 |
| 03.3.15.b | `data-money` | 属性 | 卡片上挂的消息 id，点卡片凭它找到消息并标记已领取 |
| 03.3.16 | `.form-card` / `.is-pending` | class | 问卷消息卡片；`.is-pending` 为「待填写」态 |
| 03.3.16.a | `.fc-head` / `.fc-ico` / `.fc-name` / `.fc-state` | class | 卡片头：图标、标题「问卷」、右侧状态胶囊（待填写 / 已填写，已填写为绿描边） |
| 03.3.16.b | `.fc-body` / `.fc-item` / `.fc-no` / `.fc-text` | class | 题目区：题号 + 题干 |
| 03.3.16.c | `.fc-opts` / `.fc-opt` / `.fc-dot` / `.is-pick` | class | 选项列表；角色选中那项 `.is-pick` 圆点填实、文字转主色 |
| 03.3.16.d | `data-form` | 属性 | 问卷卡片上挂的消息 id，点卡片凭它 `openFormDetail()` 打开整份问卷 |
| 03.3.16.e | `.fd-list` / `.fd-item` | class | 整份问卷弹层：每题的题干（13.5px）与全部选项（12.5px），选中项同样点亮 |
| 03.3.17 | `#formEditor` / `.form-editor` | id + class | 出问卷弹层的题目编辑区 |
| 03.3.17.a | `.form-q` / `.form-q-head` / `.form-q-no` / `.form-q-input` | class | 单题：序号、题干输入（≤20 字）、删除键 |
| 03.3.17.b | `.form-opts` / `.form-opt` / `.form-q .fc-dot` | class | 选项行（2~4 个，各 ≤12 字），前面用同样的圆点占位 |
| 03.3.17.c | `.form-del` / `.form-add` / `.form-add-opt` / `.form-add-q` | class | 题 / 选项的删除键与「加选项」「再加一题」虚线胶囊 |
| 03.3.17.d | `#formAddQ` / `#formSend` / `#formCancel` | id | 加题、发送、取消 |
| 03.3.17.e | `.form-seg` | class | 问卷弹层顶部「发出 / 收到」分段（用 06 的 `.seg` / `.seg-item`） |
| 03.3.18 | `.msg-media` / `.is-image` / `.is-video` | class | 图片 / 视频消息气泡：尺寸按原图宽高比算（最长边 196 宽、最高 260），圆角 14px，图片 `object-fit:cover`，视频内嵌原生控件 |
| 03.3.18.a | `data-media` | 属性 | 图片气泡上挂的 dataURL，点一下全屏看大图 |
| 03.3.18.b | `.media-view` | class | 看大图的黑色浮层（`position:fixed; inset:0`、图片 `contain`），点任意处关掉 |
| 03.3.17.f | `.fi-list` / `.fi-item` / `.fi-head` / `.fi-title` / `.fi-state` / `.fi-body` / `.fi-line` / `.fi-q` / `.fi-dot` / `.fi-ans` / `.fi-empty` | class | 「收到」列表：每条一张卡，题干后接对方选中的答案；`.fi-state.is-done` 绿描边「已填写」，未填只有题干与「待填写」；`.fi-time` 是卡片底部「填写于 14:20」的时间行（只有已填的才出） |
| 03.3.19 | `.buddy-card` / `.is-pending` | class | 陪伴邀请卡（共鉴四类落到会话里那条 `kind:'buddy'` 的消息）；`.is-pending` 是还没应答的态 |
| 03.3.19.a | `.bc-head` / `.bc-ico` / `.bc-name` / `.bc-state` | class | 卡片头：两个人形图标、标题「陪伴」、右侧状态（等待回应 / 接受了 / 没答应） |
| 03.3.19.b | `.bc-line` | class | 卡片正文一句：「某某 想陪你学习」（角色邀我）或「你在请 TA 陪你学习」（我邀角色） |
| 03.3.19.c | `.bc-acts` / `.bc-btn`（`.is-mute`） | class | 角色邀我时才出现的「接受 / 拒绝」两枚胶囊键 |
| 03.3.19.d | `data-buddy` / `data-mid` / `data-buddy-card` / `data-me` | 属性 | 接受或拒绝的动作与消息 id；卡片本身挂的消息 id；我的头像挂 `data-me`，点它进个人资料页 |

### 4.4 消息长按工具条

长按（pointerdown 起 450ms、挪动超 8px 取消）消息，在气泡正下方紧贴处浮出一条横排工具条（引用 · 收藏 · 删除）；点一下只做选中高亮，不再出操作条。

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 03.4.1 | `#msgToolbar` / `.msg-toolbar` / `.mt-btn` / `.mt-sep` | id + class | 贴消息下方的横排工具条（绝对定位于滚动区内，随消息滚动）；`.mt-btn.is-danger` 为删除红字；`#mtFav` 是收藏那格，文案随状态在「收藏 / 取消收藏」之间切 |
| 03.4.1.a | ~~`#msgActions` / `.msg-actions` / `.ma-btn` / `.ma-sep`~~ | id + class | 旧浮动操作条（加入字卡 / 删除 / 收起），R-35 已整段移除 |
| 03.4.1.b | ~~`.msg-menu` / `.mm-item` / `.mm-cancel`~~ | class | 长按弹出的底部菜单（R-35 首版），R-36 改成贴消息的横排工具条后废弃 |
| 03.4.2 | `#quoteBar` / `.quote-bar` / `#quoteText` / `#quoteCancel` / `.qb-line` / `.qb-x` | id + class | 引用条：贴在输入区上方，显示被引用消息的摘要（`[hidden]` 时隐藏），右侧 × 取消引用 |

### 4.5 输入区

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 03.5.1 | `.composer` | class | 底部输入区（聊天框外只有「＋」1 个按钮，发送在输入框内） |
| 03.5.2 | `#btnPlus` / `.plus-btn` / `.is-on` | id + class | 输入区左侧「＋」按钮，点击让下方面板升起、图标转 45°（见 R-12） |
| 03.5.2.a | `.is-busy` | 状态 class | 有任务在跑时的样式 |
| 03.5.2.b | `#plusPanel` / `.action-panel` / `.is-open` | id + class | ＋ 上升面板（共用 `YM.ui.panel`，`max-height` 过渡升降，默认收起） |
| 03.5.2.c | `#panelTrack` / `.action-track` / `.action-page` | id + class | 横向分页容器（`scroll-snap`），每页 6 项、3 列 2 行 |
| 03.5.2.d | `.action-item` / `.action-ico` | class | 面板内的功能项：圆形图标 + 文字标签 |
| 03.5.2.e | `#panelDots` / `.action-dots` / `.is-multi` / `.is-active` | id + class | 页数大于 1 时显示的分页圆点 |
| 03.5.3 | `#inputMsg` | id | 输入框（自增高，≤500 字） |
| 03.5.4 | `.input-shell` | class | 输入框外壳 |
| 03.5.5 | `#btnSend` / `.send-btn` | id + class | 发送按钮 |
| 03.5.5.a | `.is-empty` | 状态 class | 输入为空时禁用态 |
| 03.5.6 | `openMoneySheet(kindInit)` | 函数 | ＋ 面板「红包」→ 弹层：`.money-seg` 分段切换红包 / 转账，金额 `#moneyAmount`、备注 `#moneyNote`、`#moneyCancel` / `#moneyOk`；金额上限 99999，备注上限 20 字 |
| 03.5.6.a | `syncKind()` | 函数 | 弹层内：切换红包 / 转账时同步分段选中态、标题、按钮文案、备注占位与默认值 |
| 03.5.6.b | `submit()` | 函数 | 弹层内：校验金额后落一条 `kind=packet\|transfer` 的消息（含 `amount` / `note` / `claimed=false` / 摘要用 `text`） |
| 03.5.7 | `claimMoney(id)` | 函数 | 点消息里的红包 / 转账卡片后把该条 `claimed` 置真、整卡降透明度，已经领过时只提示 |
| 03.5.8 | `moneyCardHtml(m)` | 函数 | 把带 `kind` 的消息渲染成卡片（图标 / 金额 / 备注 / 状态胶囊），普通消息仍走 `.msg-bubble` |
| 03.5.9 | `moneyKind(m)` / `moneyText(n)` | 函数 | 判别消息是不是红包 / 转账；金额统一格式化成 `¥整数` 或 `¥两位小数` |
| 03.5.10 | `.money-seg` / `.money-field` / `.money-sign` | class | 弹层内的分段控件外边距、金额输入行与「¥」前缀 |
| 03.5.11 | `MONEY_NOTE` / `MONEY_ICON` | 常量 | 红包 / 转账的默认备注与两个线性图标 |
| 03.5.12 | `openCall()` / `endCall()` / `toggleMute()` / `minimizeCall()` / `resumeCall()` | 函数 | ＋ 面板「视频通话」→ 全屏模拟通话：先「正在呼叫…」1.6 秒再接通、每秒走计时「通话中 00:12」；静音目标只切按钮态（`.is-off` + 文案「已静音」）；`minimizeCall()` 收起通话层但通话不断（计时继续），聊天页右侧露出悬浮按钮 `#callFab`，`resumeCall()` 点它回到通话页；`endCall()` 挂断并落一条 `kind:'call'` + `duration` 的记录（没接通就不落） |
| 03.5.15 | ~~`openBgSheet()`~~ | 已迁到 09 个人资料页（09.5.5）；`＋` 面板恢复「分享」，只保留未接入提示 |
| 03.5.15.a | ~~`compressImage(file, cb)`~~ | 已迁到 09 个人资料页（09.5.5.c `shrinkToData()`） |
| 03.5.15.b | ~~`currentBg()` / `writeBg(scope, payload)`~~ | 已迁到 09 个人资料页（09.5.5.a `bgState()/bgShown()/saveBg()`） |
| 03.5.16 | ~~`openMusicSheet()` / `musicPlay()` / `musicStop()` / `musicTrack()` / `musicChip()` / `CALL_TRACKS`~~ | 已删（R-169） |
| 03.5.17 | ~~`openCallSettings()` / `callLook()` / `applyCallLook()` / `saveCallLook()` / `CALL_FILTERS`~~ | 已删（R-169） |
| 03.5.13 | `durText(sec)` / `callCardHtml(m)` / `CALL_ICON` | 函数 + 常量 | 秒数格式化成 `00:12`；把 `kind:'call'` 的消息渲染成 `.call-card`（图标 + 文案） |
| 03.5.14 | ~~`applyScale(s)` / `ptrDist()`~~ | 函数 | R-39 加的整屏缩放（`.call-view` 的 `--cz`）已按用户要求删掉，通话页恢复常规尺寸，相关变量与手势监听一并移除 |

### 4.6 参数表单（从弹层搬到 06 个人资料页后原地复用同一套 id）

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 03.6.1 | `.param-group` / `.param-head` | class | 参数分组标题（样式已上移到 `common.css` 07.6） |
| 03.6.2 | `.param-item` | class | 单个参数行 |
| 03.6.3 | `.num-pair` / `.num-unit` | class | 数值 + 单位组合 |
| 03.6.4 | `#pDelayMin` / `#pDelayMax` | id | 回复延迟上下限（秒） |
| 03.6.5 | `#pReplyMin` / `#pReplyMax` | id | 回复条数上下限 |
| 03.6.6 | `#pSkip` / `#pSkipVal` | id | 已读不回概率滑块与数值 |
| 03.6.7 | `#pActive` / `#pActiveMin` / `#pActiveMax` | id | 主动消息开关与间隔（分） |
| 03.6.8 | `#pQuote` / `#pMerge` | id | 引用 / 连句开关（原 `#pGroup` 群聊开关已按用户要求删除，见 R-72） |
| 03.6.9 | `#pMembers` | id | 原群成员 chip 容器，已随群聊开关一起删除（见 R-72）；群资料页的「添加成员」仍用 `.member-chip` |
| 03.6.10 | `#pTyping` | id | 会话级正在输入文案（空 = 继承） |
| 03.6.11 | `#pBgType` / `#pBgValue` / `#pBgUpload` / `#pBgDim` / `#pBgClear` | id | 会话背景（`#pBgClear` 为新增的清空按钮） |
| 03.6.12 | `#pSound` | id | 会话音效继承三态 |

### 4.7 函数（`chat.js`）

| 编号 | 函数 | 说明 |
| --- | --- | --- |
| 03.7.1 | `session()` | 取当前会话对象（`window.__sgSid`） |
| 03.7.2 | `save(fn, scope)` | 写数据并重绘 |
| 03.7.3.a | `STATUS` / `statusOf(d, sn)` / `statusHtml(d, sn)` / `pickStatus()` | 常量 + 函数 | 角色状态：手动的 `params.status` 优先（online / busy / away / rest），没定就按当下时段推（0–6 休息、6–9 离开、9–23 在线、23 点后离开），正在陪着我时改说「陪伴中」；`pickStatus()` 弹 `YM.ui.actionSheet`（跟随时间 / 在线 / 忙碌 / 离开 / 休息），选完写回 `params.status` 并重绘 |
| 03.7.3 | `render()` | 全量重绘消息、日期分隔、状态行 |
| 03.7.4 | `msgHtml(m, prev)` | 单条消息 HTML |
| 03.7.5 | `quoteHtml(m)` | 引用块 HTML |
| 03.7.6 | `readMarkHtml(m)` | 已读标记（text / doublecheck / dot） |
| 03.7.7 | `typingHtml()` / `typingInfo()` | 正在输入气泡与状态行 |
| 03.7.8 | `daySep(ts)` | 日期分隔条 |
| 03.7.9 | `escape(s)` | 页内转义别名（内部转 `YM.util.escapeHtml`） |
| 03.7.10 | `nearBottom()` / `scrollBottom(smooth)` | 滚动位置判断与滚底 |
| 03.7.11 | `findMsg(id)` | 按 id 找消息 |
| 03.7.12 | `selectMsg(id)` / `hideActions()` / `updateActions()` | 选中、隐藏、更新操作条 |
| 03.7.13 | `markLastUserRead(sn)` | 刷新己方最后一条的已读标记 |
| 03.7.14 | ~~`speak()`~~ | 已迁到 09 个人资料页（09.5.4 `speakNow()`） |
| 03.7.14.a | `PANEL_ITEMS` / `PANEL_PAGE_SIZE` | 常量 | ＋ 面板功能清单（当前 6 项：相册/拍照/视频通话/红包/分享/问卷）与每页条数；相册、拍照、通话、红包、问卷已接入，只剩分享是占位 |
| 03.7.14.b | `togglePanel(force)` | 函数 | 转调公共组件 `YM.ui.panel` 的开关（面板本身由内核构建） |
| 03.7.15 | `send()` | 发送己方消息（≤500 字，连句可选） |
| 03.7.16 | `autoGrow()` / `updateSendState()` / `updateSpeakState()` / `updateStatus()` | 输入框自增高与四处状态刷新 |
| 03.7.15.a | `buddyKindOn(d, sn)` / `isBuddyOn(d, sn)` | 函数 | 今天 `d.mirror.pals[今天]` 里这位角色在陪哪一类（没有则 null）；`isBuddyOn` 只判有/无，有则显示导航心电图框 |
| 03.7.15.b | `BUDDY_KIND_NAME` / `endBuddy()` | 变量 / 函数 | 八类中文名；点导航心电图弹确认框「结束陪伴」，确认后删掉今天这一类的陪伴记录并重画（框随之收起） |
| 03.7.16.a | `markRead()` | 函数 | 进会话 / 回到前台时把最新的角色消息时间写进 `sn.lastReadAt`（`scope='sessions'`）；会话列表据此判断未读 |
| 03.7.17 | `BUDDY_ICON` / `isBuddy(m)` / `buddyStateText(st)` | 常量 / 函数 | 邀请卡的两个人形线描图标、判别 `kind:'buddy'`、状态文案 |
| 03.7.18 | `buddyCardHtml(m)` / `buddyPeerName(m)` / `markBuddy(d, m)` | 函数 | 把邀请渲染成卡片；答应之后把「这一类的陪伴」写进 `d.mirror.pals[YYYY-MM-DD][kind]` |
| 03.7.19 | `answerBuddy(mid, yes)` / `tickBuddy()` | 函数 | 我点「接受 / 拒绝」改卡片状态；我发出的邀请到 `buddy.dueAt` 后由 TA 给出答复（答应约 7 成） |
| 03.7.17 | `pickImage(maxBytes)` | 选图转 base64（头像 / 背景用，保留原实现，勿与 `pickImageFile()` 混用） |
| 03.7.18 | `groupsOf(memberId)` | 取专属根分组列表 |
| 03.7.19 | `memberOptions()` / `optionsHtml(list, sel)` | 成员 / 分组下拉 |
| 03.7.20 | `addToCard(m)` | 加入字卡库弹窗（可编辑、选根、选成员、选分组、同根去重） |
| 03.7.21 | ~~`openParams()`~~ | 已迁到 09 个人资料页（见 09.5.1 `initParams()`） |
| 03.7.22 | `applyBackground()` | 应用会话背景与遮罩 |
| 03.7.23 | `deleteSelected()` | 删除选中单条 |
| 03.7.24 | ~~`clearChat()`~~ | 已迁到 09 个人资料页（09.5.5） |
| 03.7.25 | ~~`numRow()` / `switchRow()` / `bindNum()` / `bindSwitch()`~~ | 已迁到 09 个人资料页 |
| 03.7.26 | ~~`selectedMembers()`~~ | 已迁到 09 个人资料页 |
| 03.7.27 | ~~`rescheduleActive()`~~ | 已迁到 09 个人资料页（`resizeActive()`） |
| 03.7.28 | `focusMessage()` | 带 `?focus=<消息 id>` 进聊天时滚到那条消息并短暂选中（资料页「查找聊天记录」跳转用） |
| 03.7.28.a | `focusMsgInChat(mid)` | 按消息 id 滚到该条并选中 1.4 秒；`focusMessage()`（`?focus=<消息 id>` 跳转）用它 |
| 03.7.29 | `boot()` | 页面启动：读会话、渲染、接任务钩子 |
| 03.7.30 | `once(el, type, handler)` | 绑定一次性事件 |
| 03.7.31 | `isForm(m)` / `answerForm(form)` | 判断问卷消息、按每题选项随机生成角色答案（发出去时就定下，存 `answers`） |
| 03.7.32 | `formCardHtml(m)` | 问卷卡片：题目编号 + 选项；未到 `answeredAt` 显示「待填写」，到点后命中的选项点亮为「已填写」 |
| 03.7.33 | `openFormSheet()` / `qBlock()` / `optRow()` / `syncNo()` | 问卷弹层：顶部「发出 / 收到」两段，发出段可出题（题目 ≤5、每题选项 2~4，各 ≤12 字） |
| 03.7.33.a | `renderHits()` / `syncTab()` | 「收到」段：列出本会话所有问卷（题干 + 对方选中的答案 / 待填写态），切换分段时刷新；点一条直接在列表层之上叠一层 `openFormDetail(mid)`（不先关列表，中间不会露出聊天页），关掉详情回到列表 |
| 03.7.33.b | `openFormDetail(mid)` | 点聊天里的问卷卡片、或「收到」列表里的一条，**在铺满屏幕的弹层里看整份问卷**（吸顶「问卷 · N 题」+ 关闭、正文每题题干与全部选项，对方选中的 `.fc-opt.is-pick` 点亮，未到点则不亮）；不跳回聊天 |
| 03.7.34 | `tickForms()` | 每秒检查一次到点的问卷，翻成「已填写」并重渲染（重开页面也按 `answeredAt` 补上） |
| 03.7.35 | `openMsgMenu(mid)` / `msgBrief(m)` / `placeToolbar(node)` / `hideToolbar()` | 长按后把横排工具条贴到该消息气泡正下方（用户侧右对齐、对方侧左对齐，横向夹在可视区内，下方放不下就翻到气泡上方）；`msgBrief()` 把红包、转账、问卷折叠成一行摘要 |
| 03.7.35.a | `setQuote(mid)` / `clearQuote()` | 设当前引用：显示引用条并聚焦输入框；发出或点 × 后清空 |
| 03.7.35.b | `toggleFav(mid)` | 收藏开关，写 `message.favorited`，toast「已收藏 / 已取消收藏」 |
| 03.7.36 | `makeFileInput(accept, multiple, capture)` | 建一个隐藏的 `<input type="file">`，`change` 时逐个交给 `handlePick()`；相册用 `image/*,video/*` 可多选，拍照用 `image/*` + `capture="environment"` 直接调系统相机 |
| 03.7.36.a | `openAlbum()` / `openCamera()` | ＋ 面板里「相册」「拍照」两项的入口：先收面板，再触发对应的隐藏 file 输入 |
| 03.7.37 | `handlePick(file)` | 按 MIME 分流：`video/*` 走 `pickVideo()`、`image/*` 走 `pickImageFile()`，其它 toast「只认图片和视频」 |
| 03.7.37.a | `pickImageFile(file)` | 相册 / 拍照选中的图：读成 dataURL → 等比缩到最长边 1080 → 转 JPEG，仍超 240KB 就降质量 / 再缩，最后落 `pushMedia('image')` |
| 03.7.37.b | `shrink(img, maxEdge, quality)` | 画到 canvas 上出 JPEG dataURL（先铺白底，避免透明图变黑） |
| 03.7.37.c | `pickVideo(file)` | 视频：≤2MB 才收，转 dataURL 后落 `pushMedia('video')`，超了 toast「视频太大了」 |
| 03.7.38 | `pushMedia(kind, src, w, h)` | 把图片 / 视频落成一条 `kind:'image'|'video'` 的消息（`text` 存 `[图片]` / `[视频]` 给列表预览用，`media:{src,w,h}` 存本体），存不下时 toast「存储放不下这个文件」 |
| 03.7.38.a | `mediaSrc(m)` / `mediaSize(m)` / `mediaBubbleHtml(m, isUser)` / `openMediaView(src)` | 取 `media.src`、按 `media.w/h` 算气泡像素尺寸、渲染图片按钮或视频框、点图片开 `.media-view` 大图层 |
| 03.7.39 | `incomingCall()` / `acceptCall()` / `maybeIncomingCall()` | 对方主动打来：按时段摇（每个小时 5%~8% 会来一通，时刻在该小时内随机，一天可来几通），到点由内核 `YM.ring` 回调 `maybeIncomingCall()`（前台、无通话、非群聊才弹），每个时段最多响一次 → `incomingCall()` 弹来电层、播提示音、22s 不理自动算无人接听；`acceptCall()` 接听转通话计时。不在聊天页时改由内核 `YM.ring` 顶部横幅承接（见 7.10）。`?callin=1` 可 1.2s 后立刻触发一次（测试用），`?call=1` 是横幅点「接听」跳过来的入口：进门即弹来电并 0.3s 后自动接通 |
| 03.7.39.a | `endCall(kind)` / `onHangClick()` | `endCall` 收 `hang`（通话中挂断）/ `cancel`（拨出后取消）/ `refused`（对方拒接我方拨出）/ `declined`（拒接来电）/ `missed`（无人接听）五种结局，落记录「视频通话 · 00:12 / 已取消 / 对方已拒绝 / 已拒绝 / 无人接听」，角色按发起方定为 `role:'user'`（我方拨出）或 `'peer'`（对方打来）；`onHangClick()` 按当前通话阶段分发上面几种 |
| 03.7.39.b | `prepareCall(sn, dir, text)` / `paintCallFace(sn)` / `setCallButtons(state)` / `startTalking()` / `stopCallTimers()` | 开一层通话的公共壳：复位 token / 计时、铺头像或单字、按 `ring-in` / `ring-out` / `talking` / `ending` 换按钮组（接听、静音、取消 / 拒绝 / 挂断的显隐与文案）、开始 1s 计时的 `通话中 00:00` |
| 03.7.46 | `callMember` / `callJoiners` / `pickCallJoiners(sn)` / `paintCallFace(sn)` / `paintCallFaces(sn)` / `#callFaces` | 群聊里打电话时，响铃阶段先只显示群自己（不冒充某位成员）；接通那一刻从 `sn.params.memberIds` 随机挑 2~3 位成员作为「已接听」（`callJoiners` 存 `[{id,name,avatar}]`，`callMember` 取第一位供记录卡与悬浮小窗用）：一律把 `#callFaces` 排成一排同样 96px 的圆头像（有图铺图、没图落名字首字），不再出现一颗大头像拖两枚小头像；通话记录落到 `callMember` 名下；单聊仍用会话本身的名字与头像；通话结束时清空 |
| 03.7.40 | `callDir` / `callNoTimer` | 本次通话方向（`in` / `out`）、响铃超时定时器（拨出等接的 2.4s 与来电 22s 共用） |
| 03.7.41 | `scheduleCallBack()` / `callBackTimer` | 我拨出去、对方没接上（`kind==='missed' && dir==='out'`）时排一次回拨：`20~45` 秒后若当前没在通话、来电层也收起了，就自己弹一层来电（对方打来，可接听 / 拒绝 / 不理）；页面卸载时清掉 |
| 03.7.42 | `isPoll(m)` / `pollSeats(sn)` / `pollCounts(m)` / `pollCardHtml(m, sn)` | 投票卡片（群聊里替掉问卷）：`kind:'poll'`，结构 `{q, options[]}` + `votes:{成员id或 me: 选项下标}`；卡片宽 252px，头部「投票」+ 右侧「N/M 票」，题干一行，选项逐行（左侧一枚 6px 空心圆点当投票入口、文字、右侧票数、底部 1px 比例细线），点圆点或整行就是自己那一票；投过之后该项圆点实心、文字转深、细线加深；还没投时卡片底部有一行「点一项，投出你这一票」 |
| 03.7.43 | `openPollSheet()` | ＋ 面板里群聊的「投票」：底部弹出的小面板（标题「投票」、一句说明、题干一栏、选项 2~4 条可增可删、取消 / 发起投票）；题干 ≤20 字、每个选项 ≤12 字；发出后落一条 `kind:'poll'` 的消息，`pollDueAt` 定在 2.5~7.5 秒后 |
| 03.7.44 | `votePoll(mid, idx)` | 点卡片里的某个选项就投它（可改投，写 `votes.me`），存进该会话消息里 |
| 03.7.45 | `tickPolls()` / `pollTimer` | 每秒一次：群聊里到 `pollDueAt` 的投票，把还没投的成员按随机选项补上票并标 `pollSettled`（重开页面也按时间戳补），随即重渲染 |
| 03.7.35.c | `deleteMsg(mid)` | 原来按 `selectedId` 删的 `deleteSelected()` 改为传 id，确认后删消息并取消它的定时任务 |

### 4.8 运行期接口（来自 06）

`YM.reply.planTrigger` / `YM.reply.getPool` / `YM.task.start` / `YM.task.resume` / `YM.task.stop` / `YM.task.cancel` / `YM.task.cancelMessage` / `YM.task.cancelActive` / `YM.task.isLocked` / `YM.task.nextActiveAt` / `YM.task.list` / `YM.sound.play` / `YM.notify.check` / `YM.style.applyAll`。

---

## 5. 04 字卡库（cards）

### 5.1 导航与工具条

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 04.1.1 | `.cards-app` | class | 页面外壳 |
| 04.1.2 | `#btnMenu` | id | 右上菜单（排序 / 去重 / 导入 / 导出 / 批量） |
| 04.1.3 | `.cards-toolbar` | class | 工具条容器 |
| 04.1.4 | `#segRoot` / `.seg` / `.seg-item` | id + class | 双根切换（通用 / 专属），`data-root="general\|exclusive"` |
| 04.1.5 | `.tools-row` | class | 搜索框与专属角色下拉并排的一行容器 |
| 04.1.6 | `.search-field` | class | 搜索框外壳（在该行内 `flex:1`） |
| 04.1.7 | `#searchInput` | id | 搜索输入（200ms 防抖）；placeholder 随当前二级 tab 变化 |
| 04.1.8 | `#kindTabs` / `.kind-tabs` / `.kind-tab` / `data-kind` | id + class + 属性 | 搜索框上方的二级 tab：字卡 / 表情包 / emoji，三等分铺满一行，`aria-selected` 表示当前；每个 tab 带该类的条数 |
| 04.1.9 | `#quickRow` / `.quick-row` / `.quick-btn` / `data-act` | id + class + 属性 | 搜索行**最左侧**的四个图标按钮（导入 / 导出 / 分组 / 管理），最早那版的样子：裸图标 2×2 直接落在页面上，不套底板和描边，与搜索框之间留 8px 空档、不连成一体；文字进 `aria-label` / `title`；`data-act` 取值 `import\|export\|group\|batch`，对应功能从右上 `⋯` 菜单移到这里 |

### 5.2 专属根角色下拉

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 04.2.1 | `#memberBar` / `.member-bar` | id + class | 专属根的角色下拉容器，放在 `.tools-row` 里与搜索框同行；`.is-on` 为显示态 |
| 04.2.2 | `#roleBtn` / `.role-btn` / `.role-name` / `.role-caret` | id + class | 角色选择按钮（替代原生 `#roleSelect`）：显示当前角色名 + 箭头，`aria-expanded` 表示菜单是否展开，展开时箭头转 180° |
| 04.2.2.a | `#roleMenu` / `.role-menu` | id + class | 自绘下拉菜单（`hidden` 控制显隐，展开时贴在按钮下方 8px、右对齐）；用自绘菜单是为了避开系统 select 的蓝色高亮框 |
| 04.2.2.b | `.role-opt` / `data-mid` / `.is-on` / `aria-selected` | class + 属性 | 菜单里的单个角色项；`.is-on` 是当前角色 |
| 04.2.3 | `#btnNoMember` | id | 无角色时的引导按钮，跳 `settings.html#members` |
| 04.2.4 | `.role-field` | class | 下拉外层（`cards.css`，`position: relative` 供菜单定位），替代原横向 chip 条 |
| 04.2.5.a | `closeMenu()`（cards.js 内建） | 函数（局部） | 收起角色菜单并复位 `aria-expanded`；点空白处、选中项之后都走它 |

### 5.3 分组与字卡

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 04.3.1 | `#groupList` / `.group-list` | id + class | 分组容器 |
| 04.3.2 | `.group` | class | 单个分组；`.is-open` 展开、`.is-hidden` 屏蔽 |
| 04.3.3 | `.group-head` | class | 分组头 |
| 04.3.4 | `.group-toggle` / `.group-caret` | class | 折叠按钮与箭头 |
| 04.3.5 | `.group-name` / `.group-count` | class | 分组名 / 条数 |
| 04.3.6 | `.group-more` | class | 分组「⋯」菜单 |
| 04.3.7 | `.group-body` | class | 分组内容区 |
| 04.3.8 | `.group-empty` | class | 分组内空提示 |
| 04.3.9 | `.card-row` | class | 单张字卡行；`.is-hidden` 为屏蔽 |
| 04.3.10 | `.card-text` | class | 字卡文本；`.is-emoji` 为 emoji 的大号排法 |
| 04.3.10.a | `.card-thumb` | class | 表情包行的缩略图（46px、圆角、`object-fit: cover`） |
| 04.3.11 | `.card-eye` | class | 屏蔽眼睛按钮；`.is-off` 为已屏蔽 |
| 04.3.12 | `.card-check` | class | 批量勾选框；`.is-on` 为已勾选 |

### 5.4 空态与批量条

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 04.4.1 | `#cardsEmpty` / `#emptyText` / `#btnEmptyAdd` | id | 空态容器、文案、添加按钮 |
| 04.4.2 | `#batchBar` / `.batch-bar` | id + class | 批量操作条 |
| 04.4.3 | `#batchCount` / `.batch-count` | id + class |「已选 N」 |
| 04.4.4 | `#btnBatchMove` / `#btnBatchDelete` / `#btnBatchExit` | id | 批量移动 / 删除 / 退出 |
| 04.4.5 | `#btnAdd` / `.fab` | id + class | 右下悬浮「+」 |

### 5.5 弹层构件

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 04.5.1 | `.batch-input` | class | 批量输入文本域 |
| 04.5.2 | `.preview-box` | class | 批量解析预览盒 |
| 04.5.3 | `#acText` / `#acGroup` / `#acCancel` / `#acSave` | id | 单条添加弹层 |
| 04.5.4 | `#batchText` / `#batchPreview` / `#batchCancel` / `#batchSave` | id | 批量添加弹层 |
| 04.5.5 | `#mvGroup` / `#mvCancel` / `#mvOk` | id | 移动字卡弹层 |
| 04.5.6 | `#impCancel` / `#impOk` | id | 字卡 JSON 导入预览弹层 |
| 04.5.7 | `#ym-undo` / `#undoBtn` | id | 删除后 5 秒撤销浮条（内核创建） |
| 04.5.8 | `#sortPicker` / `#dedupeBtn` 等菜单项 | 动态 | 由 `YM.ui.actionSheet` 生成，无静态 id |

### 5.6 函数（`cards.js`）

| 编号 | 函数 | 说明 |
| --- | --- | --- |
| 04.6.1 | `currentData()` / `refresh()` / `render()` | 取数、刷新、全量重绘 |
| 04.6.2 | `bucket()` | 当前根（通用 / 专属成员）数据桶 |
| 04.6.3 | `ensureExclusive(mid)` | 确保专属根存在 |
| 04.6.4 | `groupsOf(bucket)` / `groupKey(gid)` | 分组读取与折叠键 |
| 04.6.5 | `renderSegCounts()` / `renderMemberBar()` / `renderGroups()` | 三块渲染 |
| 04.6.5.a | `buildRoleBar(d)` | 专属根顶部角色下拉的整块渲染（无角色时给「去设置添加角色」） |
| 04.6.5.b | `roleList(d)` | 下拉选项来源：**只取会话列表里还在的角色**（`sn.name` + `sn.memberId`，名字与会话列表一致）；会话被删掉后，字卡库这里对应项也随之消失，不再从 `members` 补孤儿角色 |
| 04.6.5.c | `renderKindTabs(d)` | 按当前根统计三类内容条数、刷新三个 tab 的选中态与文字，并同步搜索框 placeholder 与空态按钮文案 |
| 04.6.5.d | `countKind(groups, k)` | 统计某个分组集合里某一类（字卡 / 表情包 / emoji）可见条数 |
| 04.6.6 | `sortCards(cards)` / `cycleSort()` | 4 种排序与循环切换 |
| 04.6.7 | `matches(card, kw)` | 查重 / 搜索匹配（`normalizeText`） |
| 04.6.8 | `addSingle()` / `addBatch()` / `addSingleIn(bucket)` | 两种添加入口 |
| 04.6.9 | `parseBatch(text)` / `analyze(parsed)` / `applyParsed(parsed)` | 批量语法解析、统计、落库 |
| 04.6.10 | `editCard(card)` / `deleteCard(...)` / `cardAction(...)` | 字卡操作与菜单 |
| 04.6.11 | `newGroup()` / `renameGroup(gid)` / `deleteGroup(gid)` / `reorderGroup(gid, dir)` / `groupAction(gid)` | 分组操作 |
| 04.6.12 | `toggleCard(...)` / `toggleBatch()` / `updateBatchBar()` | 勾选与批量条 |
| 04.6.13 | `moveCards(...)` | 移动字卡到别组 |
| 04.6.14 | `dedupeAll()` | 全库去重 |
| 04.6.15 | `importJson()` / `exportJson()` / `parseJsonCards(text)` / `roleNameOf(d, mid)` | 字卡库 JSON 导入导出：结构 `{app,type:'cards',version,root,role,exportedAt,groups:[{name,hidden,cards:[{text,hidden}]}]}`；导入兼容纯数组与 `{groups:[]}`，按当前根合并去重 |
| 04.6.16 | `showUndo(text, onUndo)` | 撤销浮条 |
| 04.6.17 | `countRoot(...)` / `countAllExclusive()` | 计数 |

---

## 6. 05 设置中心（settings）

### 6.1 结构与通用行

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 05.1.1 | `.settings-app` / `.settings-scroll` | class | 页面外壳与滚动区 |
| 05.1.2 | `.set-group` / `.set-title` | class | 分区与分区标题 |
| 05.1.3 | `.set-panel` | class | 分区面板 |
| 05.1.4 | `.set-row` / `.set-row.col` | class | 单行；`.col` 为竖向排布 |
| 05.1.5 | `.set-row-top` | class | 行内标题与数值两端对齐 |
| 05.1.6 | `.set-inline` | class | 行内按钮组 |
| 05.1.7 | `.divider` | class | 行分隔（07.4.6） |

### 6.2 外观

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 05.2.1 | `#secAppearance` | id | 外观分区锚点 |
| 05.2.2 | `#segTheme` / `.seg-mini` | id + class | 主题三态（`data-mode`） |
| 05.2.3 | `#rangeFontSize` / `#valFontSize` | id | 字号滑块与数值 |
| 05.2.4 | `#inputFontFamily` / `#inputFontUrl` | id | 系统字体族与字体文件地址 |
| 05.2.5 | `#selBubblePreset` | id | 气泡模板（rounded / capsule / square / outline） |
| 05.2.6 | `#inputBubbleUser` / `#inputBubblePeer` | id | 自定义气泡 CSS（白名单过滤） |
| 05.2.7 | `#selBgType` / `#inputBgValue` / `#btnBgUpload` / `#btnBgClear` | id | 聊天背景 |
| 05.2.8 | `#rangeBgDim` / `#valBgDim` | id | 背景遮罩浓度 |
| 05.2.9 | `#swShowName` / `#swShowAvatar` | id | 名称 / 头像显示开关 |
| 05.2.10 | `#swShowTimestamp` / `#swShowRead` | id | 时间戳 / 已读开关 |
| 05.2.11 | `#selReadStyle` / `.select-mini` | id + class | 已读样式（text / doublecheck / dot） |
| 05.2.12 | `#swOpening` | id | 开场动画开关 |

### 6.3 聊天体验

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 05.3.1 | `#secChat` | id | 分区锚点 |
| 05.3.2 | `#inputTyping` | id | 默认正在输入文案（≤20 字） |
| 05.3.3 | `#mergeChips` / `.symbol-chip` | id + class | 连句符号 chip 区 |
| 05.3.4 | `#inputMergeSymbol` / `#btnAddSymbol` | id | 新增符号 |
| 05.3.5 | `#swSound` | id | 消息音效总开关 |
| 05.3.6 | `#soundList` / `.sound-item` / `.sound-name` / `.sound-tag` / `.sound-del` | id + class | 音效列表与单条构件 |
| 05.3.7 | `#btnSoundUpload` / `#btnSoundTest` | id | 上传音效 / 试听 |
| 05.3.8 | `#swPeerRandom` | id | 对方随机音效 |
| 05.3.9 | `#selUserSound` | id | 自己发送音效 |

### 6.4 通知

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 05.4.1 | `#secNotify` | id | 分区锚点 |
| 05.4.2 | `#swNotify` | id | 页内提示开关 |
| 05.4.3 | `#swSystemNotify` | id | 系统通知（disabled，仅提示限制） |

### 6.5 角色

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 05.5.1 | `#members` | id | 分区锚点（`settings.html#members`） |
| 05.5.2 | `#memberList` / `.member-row` | id + class | 角色列表与单行 |
| 05.5.3 | `.member-ops` / `.member-op` | class | 行内编辑 / 删除按钮 |
| 05.5.4 | `#btnMemberAdd` | id | 添加角色（角色名 ≤12 字） |
| 05.5.5 | `#mvAvatar` / `#mvPick` / `#mvName` / `#mvCancel` / `#mvSave` | id | 成员弹层控件（与 04.5 的 `#mv*` 不同名域，见变更记录 R-01） |
| 05.5.6 | `.empty-line` | class | 空提示行 |

### 6.6 数据与关于

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 05.6.1 | `#secData` | id | 分区锚点 |
| 05.6.2 | `#dataSize` | id | 已用空间 |
| 05.6.3 | `#btnExport` / `#btnImport` / `#btnRestore` / `#btnReset` | id | 导出 / 导入 / 恢复备份 / 重置 |
| 05.6.4 | `#resetWord` / `#rsCancel` / `#rsOk` / `.reset-note` | id + class | 重置弹层（须手输「重置」） |

### 6.7 函数（`settings.js`）

| 编号 | 函数 | 说明 |
| --- | --- | --- |
| 05.7.1 | `data()` / `saveSettings(fn, scope)` | 取数 / 写设置 |
| 05.7.2 | `switchVal(el)` / `bindSwitch(id, getter, setter)` | 开关读写 |
| 05.7.3 | `pickFile(accept, maxBytes, asText)` | 通用选文件 |
| 05.7.4 | `initAppearance()` / `renderThemeSeg()` | 外观初始化与主题分段态 |
| 05.7.5 | `saveBubble(el, key)` | 气泡 CSS 白名单校验后保存 |
| 05.7.6 | `initChatExperience()` | 体验分区初始化 |
| 05.7.7 | `renderSymbols()` / `renderSounds()` / `renderUserSoundSelect()` | 三块动态渲染 |
| 05.7.8 | `initNotify()` | 通知分区 |
| 05.7.9 | `renderMembers()` / `addMember()` / `editMember(mid)` / `deleteMember(mid)` | 成员管理 |
| 05.7.10 | `renderData()` / `initData()` | 数据分区 |

---

## 7. 06 内核（js/common.js）

命名空间 `window.YM`，版本常量 `YM.VERSION = '1.0'`。

### 7.1 `YM.util`（工具）

| 编号 | 方法 | 说明 |
| --- | --- | --- |
| 06.1.1 | `uid(prefix)` | 生成 `prefix_随机` id |
| 06.1.2 | `escapeHtml(s)` | HTML 转义（全局唯一转义入口） |
| 06.1.3 | `randInt(a, b)` / `pickOne(arr)` / `shuffle(arr)` | 随机 |
| 06.1.4 | `clamp(v, a, b)` | 夹取值 |
| 06.1.5 | `normalizeText(s)` | 折叠空白 + 小写，用于查重与搜索 |
| 06.1.6 | `debounce(fn, ms)` | 防抖 |
| 06.1.7 | `pad2(n)` | 两位补零 |
| 06.1.8 | `formatStamp(ts)` / `formatRelative(ts)` / `formatClock(ts)` / `formatMsgTime(ts)` / `formatSince(ts)` / `formatDateLabel(ts)` / `dayKey(ts)` / `todayLabel()` | 时间格式化。`formatStamp`：一律「几月几日 几时:几分」，一个月内不带年份、超过一个月前面加两位年份（`26年11月8日 20:44`），消息时间与列表时间用它。`formatMsgTime`：气泡下的消息时间——当天只「18:06」，昨天 / 前天「昨天 18:06」「前天 18:06」，更早「11月8日 18:06」，跨年补两位年份。`formatSince`：**一个点离现在多久**——1 分钟内「刚刚」，1 小时内「N分钟前」，24 小时内「N小时前」，1 天「一天前」，2~6 天「N天前」，7~13 天「一个星期前」，14~20 天「两个星期前」，21~29 天「三个星期前」，满 30 天起落到绝对时间「26年11月8日20时44分」，问卷「填写于」用它 |
| 06.1.9 | `fileToBase64(file, maxBytes)` | 转 base64，超限 reject `too_large` |
| 06.1.10 | `download(filename, text, mime)` | 触发下载 |
| 06.1.11 | `bytes(obj)` / `formatBytes(n)` | 体积计算与可读化 |
| 06.1.12 | `stamp()` | 时间戳串 |
| 06.1.13 | `cssSafe(css)` | 自定义 CSS 白名单校验 |
| 06.1.14 | `qs(name)` | 读 URL 查询参数 |

### 7.2 `YM.store`（存储）

| 编号 | 方法 | 说明 |
| --- | --- | --- |
| 06.2.1 | `available` | 存储可用性布尔 |
| 06.2.2 | `get()` | 读全量数据（损坏时留存原文并重建默认） |
| 06.2.3 | `save(data, silent)` | 整体写入，返回 `{ok,size,error?}` |
| 06.2.4 | `update(mutator, scope, silent)` | 读-改-写，成功后 emit `ym:data` |
| 06.2.5 | `size()` | 当前占用字节 |
| 06.2.6 | `backup()` / `hasBackup()` / `restoreBackup()` | 自动备份三件套 |
| 06.2.7 | `exportObject()` / `exportAll()` | 导出对象 / 触发下载 |
| 06.2.8 | `importAll(json)` | 校验并覆盖导入，返回 `{ok, summary\|error}` |
| 06.2.9 | `reset()` | 重置为默认数据（先备份） |

### 7.3 `YM.event`（事件）

`on(type, fn)` / `off(type, fn)` / `emit(type, detail, broadcast)`。事件名见 00.2。

### 7.4 `YM.ui`（界面）

| 编号 | 方法 | 说明 |
| --- | --- | --- |
| 06.4.1 | `toast(text, duration)` | 底部提示 |
| 06.4.2 | `confirm({title, body, okText, cancelText, danger})` | 二次确认，返回 Promise<bool> |
| 06.4.3 | `input({title, body, value, rows, maxlength, required, okText})` | 输入弹窗，返回 Promise<string\|null> |
| 06.4.4 | `sheet(build)` | 底部抽屉，build(sheet, close) |
| 06.4.5 | `actionSheet({title, items})` | 操作菜单，返回 Promise<item\|null> |
| 06.4.6 | `setSwitch(el, on)` | 写开关状态与 `aria-checked` |
| 06.4.7 | `panel({root, btn, items, pageSize, cols, onPick})` | 上升面板组件：按 `pageSize` 切页、按 `cols` 排布、算高度、翻页同步圆点、点项回调；返回 `{toggle, close, pages}` |
| 06.4.7 | `closeMask()` | 关闭当前遮罩 |

### 7.5 `YM.theme` / `YM.style`

`resolve()` / `apply()` / `setMode(mode)` / `cycle()` / `iconFor(mode)`；`YM.style.applyAll()` 把字号、字体族、`@font-face`、强调色、气泡与自定义 CSS 写入 `#ym-dynamic-style`。

### 7.6 `YM.sound`

`unlock()`（首次手势解锁 AudioContext）/ `play('user'|'peer')`。内置音效 id：`builtin:ding1`、`builtin:wood`、`builtin:pop`。

### 7.7 `YM.reply`（回复引擎）

| 编号 | 方法 | 说明 |
| --- | --- | --- |
| 06.7.1 | `getPool(sessionId, memberId)` | 取可用字卡池（屏蔽组 / 屏蔽卡剔除） |
| 06.7.2 | `rollSkip(chance)` | 掷已读不回（每次点「说话」一次） |
| 06.7.3 | `pickCount(min, max, total)` | 掷条数，夹在池大小内 |
| 06.7.4 | `pickQuote(sessionId)` | 近十条内挑一条引用 |
| 06.7.5 | `mergeTexts(parts, symbols)` | 连句合并（随机符号分隔） |
| 06.7.6 | `buildDelays(n, minSec, maxSec)` | 每条独立延迟 |
| 06.7.7 | `planTrigger({sessionId, source})` | 生成计划，返回 `{ok, skipped, reason, triggerId, memberId, messages[]}`；reason ∈ `locked` / `empty_pool` / `read_skip` / `no_session`。`memberId` 先取会话绑定的 `sn.memberId`（单聊也走专属池），群聊开启且成员 ≥2 时覆盖为随机成员 |

### 7.8 `YM.task`（任务调度）

| 编号 | 方法 | 说明 |
| --- | --- | --- |
| 06.8.1 | `list(sessionId)` | 该会话全部待投递任务 |
| 06.8.2 | `isLocked(sessionId)` | 是否有未投递任务（说话按钮加锁） |
| 06.8.3 | `schedule(sessionId, plan)` | 写入任务 |
| 06.8.4 | `scheduleActive(sessionId)` | 排主动消息任务 |
| 06.8.5 | `nextActiveAt(sessionId)` | 下一次主动消息时间 |
| 06.8.6 | `cancel(sessionId)` / `cancelActive(sessionId)` / `cancelMessage(messageId)` / `cancelAll()` | 取消任务 |
| 06.8.7 | `start(sessionId, hooks)` / `resume(sessionId, hooks)` / `tick(sessionId, hooks)` / `stop()` | 启动、接管、轮询、停止 |
| 06.8.8 | `markLastRead`（内部） | 投递后补已读状态 |

轮询间隔 400ms；过期 reply 每次最多补 3 条。

### 7.9 `YM.notify` 与内部函数

`YM.notify.check(kind, {sessionId, text})`：`document.hidden` 或失焦时显示 `#ym-banner` 3.2 秒并改标题；恢复焦点后复原。

### 7.10 `YM.ring` 角色来电横幅（不在聊天页时的形态）

| 编号 | 名称 | 说明 |
| --- | --- | --- |
| 06.9.1 | `#ym-ring` / `.ring-bar` | 顶部悬浮来电条（贴 `12px` 边、`z-index:120`），由 `common.js` 现建现挂，任何页面都能用 |
| 06.9.2 | `.rb-face` / `.rb-body` / `.rb-name` / `.rb-sub` | 左侧 38px 圆头像（有图铺图、无图落首字）、名字与「邀请你视频通话」两行 |
| 06.9.3 | `.rb-btn` / `.is-yes` | 右侧「拒绝」（描边胶囊）与「接听」（强调色实底胶囊） |
| 06.9.4 | `ringShow(sn)` / `ringHide()` | 弹 / 收横幅；弹时解锁音频播一声提示音，并起 22 秒无人接听计时 |
| 06.9.5 | `ring.drop(text)` | 收起横幅，同时往该会话落一条 `kind:'call'`、`role:'peer'` 的通话记录（「视频通话 · 已拒绝」/「视频通话 · 无人接听」） |
| 06.9.6 | `ring.go()` | 收起横幅，跳到 `chat.html?sid=…&call=1`（按当前页在不在 `pages/` 里决定相对路径） |
| 06.9.7 | `ring.boot()` / `ring.onDue` / `ring.busy` | 进页面先备好当天计划，再每 20 秒只查「到点没有」：若当前页挂了自己的整屏来电（聊天页把 `ring.onDue` 设成 `incomingCall`）就交回该页弹，否则在内核从单聊池里随机挑一个会话弹顶部横幅；`ring.busy()` 是页面给的「现在正忙」判断（通话中或来电层未收），忙时这次不响也不算用掉 |
| 06.9.8 | `ring.plan()` / `ring.due()` / `ring.mark()` / `ringSlot()` | 按时段的概率：`ringSlot()` 每进一个小时就摇一次「这个小时会不会来」（概率随机落在 5%~8%），中了就在本小时剩余时间里随机定一个分钟点，写进 `ym_call_hour`（`ring.plan()` 是它的别名）；`ring.due()` 在「本小时中了、还没响过、本小时当前分钟已过该点」时返回真；`ring.mark()` 记下本小时已响，换小时就自动重摇，因此一天可以来几通、不设上限；`ym_call_day` 这个旧键会在同一次调用里被清掉 |

### 7.11.a 群主与禁言（`params.owner` / `params.muted`）

| 编号 | 名称 | 说明 |
| --- | --- | --- |
| 06.10.4 | `params.owner` / `params.muted` | 会话参数里新增两位：`owner` 固定 `'user'`（群主是我），`muted` 是 `{ memberId: { at } }` 的禁言表；`migrate()` 给老会话补 `muted = {}` |
| 06.10.5 | `reply.planTrigger` 挑人 | 群聊挑成员时先滤掉 `muted` 里的人；一个都没剩就返回 `reason: 'all_muted'`，不再往群里投消息 |

### 7.11 `YM.sleepWatch`（作息感应 · 息屏推断睡眠）

| 编号 | 方法 | 说明 |
| --- | --- | --- |
| 06.10.3.a | `YM.roleStatus`（`MAP` / `get(mid, now)` / 内部 `hash(str)` / `keyOf(mid, now)` / 常量 `BAG` / `SLOT=4h`） | 对象 + 函数 | 角色随机状态：每个 `memberId` 各自按「角色名 + 4 小时时段」哈希落到在线 / 忙碌 / 离开 / 休息之一（权重 4:2:2:1），同一时段恒定、跨页一致、不写库，所以同一刻有人在线有人忙碌；`get(mid)` 只读 |
| 06.10.4 | `YM.invite`（`plan()` / `due(now)` / `fire(sn, rec)` / `boot()` / `claim` / 内部 `read()` `write()` `isSingle(sn)` `findSn(d,id)`，常量 `KINDS` `BUDDY`（八类：`study` / `work` / `novel` / `video` / `music` / `rest` / `game` / `exercise`）`BUDDY_NAME` `AMOUNT`，键 `ym_invite_v1`（键 `会话id|类型`，`rollDay` 记当天）、`readPersona()` / `writePersona(v)` / `trait(mid)` / `moodOf(mid,day)` / `pickAt(now)`、常量 `HOUR_W` / `W_EARLY` / `W_OWL`、新函数 `sleepOf(mid)`、键 `ym_persona_v1`（每人 `call` / `packet` / `buddy` 系数、`sleep{v, since, span}` 作息状态、`mood` 当天心情）） | 对象 + 函数 | 角色主动找你：每天给每个单聊会话、每一类各摇一次（三类互不影响、也没有角色间错开）：来电 10–15%、红包 11–18%、陪伴 7–20%，先落一个区间内的具体百分比，再乘这个角色自己的性格系数（0.25~2.1，少数人极黏或极不主动）与当天心情（0.45~1.8）；命中后按这个角色「当下的作息」挑时间：约三成早睡（22 点后基本不来）、五成正常（夜里零星）、两成夜猫子（越晚越活跃）；作息不是终身标签——每 3~12 天到期时，七成概率挪到相邻一档、三成维持不变，所以可能前半段早睡、过阵子变正常，也可能一直不变——所以有人天天来、有人很久不吭声，有人专挑半夜找你，到点后红包 / 陪伴邀请写进会话消息（`role:'peer'`、`kind:'packet'` 带 `amount/note/claimed`，或 `kind:'buddy'` 带 `buddy{kind,name,dir:'in',memberId}` 与 `state:'pending'`），来电则先问 `YM.invite.claim(sid)`（聊天页正开着该会话就弹整屏来电），没人接就落 `YM.ring.showSid()` 全局横幅；`boot()` 每 45 秒查一次、页面隐藏时不触发 |
| 06.10.1 | `watch.stamp()` / `watch.last()` | 心跳：前台时每 60 秒、`pointerdown` 时、切到后台时各留一次时间戳，存 `ym_awake`（`store` 之外的独立键，不进业务数据）；`last()` 读上次心跳 |
| 06.10.2 | `watch.guess(now)` | 从「上次心跳」到「现在」这段超过 2 小时、不超过 16 小时，且醒来那天还没有手记，就写 `d.tide.sleep[醒来那天] = {bed, wake, createdAt, auto:true}`（`bed` 取上次心跳的时分、`wake` 取现在），随后 `emit('ym:sleep-auto')` |
| 06.10.3 | `watch.boot()` / `startBeat()` / `stopBeat()` | 进页面先补一次心跳并挂上 `visibilitychange`（回到前台先 `guess()` 再重新起搏，切走时补一次心跳并停搏）、`focus` 与 `pointerdown` |

内部（不对外）函数：`ls` / `makeMask` / `close` / `done` / `migrate` / `defaultData` / `defaultSettings` / `defaultParams` / `defaultGroup` / `findSession` / `countCards` / `readRuntime` / `writeRuntime` / `deliver` / `systemDark` / `hexToRgba` / `tone` / `ringMake` / `startBeat` / `stopBeat` / `boot`；对外别名 `YM.countCards` / `YM.findSession` / `YM.sessionName` / `YM.avatarText` / `YM.avatarHtml` / `YM.membersInUse` / `YM.hexToRgba` / `YM.ring`。

---

## 8. 07 通用样式与令牌（css/common.css）

### 8.1 设计令牌

| 编号 | 令牌 | 用途 |
| --- | --- | --- |
| 07.1.1 | `--bg` / `--panel` / `--panel-2` | 底色 / 面板 / 次级面板 |
| 07.1.2 | `--text` / `--text-2` | 主文字 / 次文字 |
| 07.1.3 | `--line` / `--line-strong` | 细线 / 强线 |
| 07.1.4 | `--accent` / `--accent-weak` / `--accent-text` | 强调色三件套 |
| 07.1.5 | `--shadow` | 阴影 |
| 07.1.6 | `--bubble-user` / `--bubble-user-text` / `--bubble-peer` / `--bubble-peer-text` | 气泡配色 |
| 07.1.7 | `--radius` / `--radius-sm` | 圆角 |
| 07.1.8 | `--font-size` / `--font-family` | 字号 / 字体族（用户可调） |
| 07.1.9 | `--nav-h` | 导航高度 |

日夜两套值定义在 `:root[data-theme="light"]` 与 `:root[data-theme="dark"]`。

### 8.2 基础与布局

`.app`（07.3.1 限宽 430px 居中）/ `.grow` / `.hide` / `.mt-8` / `.mt-16` / `.text-2` / `.small` / `.mono-num`。

### 8.3 导航与按钮

`.nav` / `.nav-title` / `.icon-btn` / `.icon-btn.dim` / `.btn` / `.btn-primary` / `.btn-ghost` / `.btn-sm` / `.btn-danger` / `.btn-block`。

### 8.4 表单与控件

`.field` / `.label` / `.seg` / `.seg-item` / `.switch` / `.range` / `.row` / `.row-main` / `.row-title` / `.row-desc` / `.divider` / `.avatar` / `.empty`。

### 8.5 遮罩与弹层

`.mask` / `.mask.center` / `.sheet` / `.sheet-handle` / `.sheet-title` / `.sheet-sub` / `.dialog` / `.dialog-title` / `.dialog-body` / `.dialog-actions` / `.toast` / `.toast.show` / `.banner` / `.banner.show` / `.banner-dot`。

### 8.6 组合控件（跨页共用）

| 编号 | 名称 | 说明 |
| --- | --- | --- |
| 07.5.1 | `.form-stack` | 表单纵向堆叠 |
| 07.5.2 | `.avatar-pick` | 头像选择行 |
| 07.5.3 | `.avatar-pick-btn` | 「选择头像」按钮 |
| 07.5.4 | `.av-preview` | 头像预览方块 |
| 07.5.5 | `.sheet-actions` | 弹层底部按钮行 |
| 07.5.6 | `.chip-list` | chip 容器 |
| 07.5.7 | `.member-chip` | 成员 chip（`aria-pressed="true"` 为选中） |
| 07.5.8 | `.action-panel` / `.action-track` / `.action-page` / `.action-item` / `.action-ico` / `.action-dots` | 聊天页 ＋ 上升面板公共组件（`--panel-h` 控高、`--cols` 控列数） |

---

## 9. 09 个人资料（profile）

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 09.1.1 | `.profile-app` / `#profileScroll` / `.profile-scroll` | class + id | 页面容器与滚动区（与 `.app` 的 430px 限宽对齐） |
| 09.2.1 | `.pf-hero` / `.pf-meta` | class | 角色资料卡：头像 + 名字竖排居中 |
| 09.2.2 | `#pfAvatar` / `.pf-avatar` | id + class | 圆形头像，点击换图（300KB，回写会话与 `member.avatar`） |
| 09.2.3 | `#pfName` / `.pf-name` | id + class | 名字（只读展示，改名入口已按用户要求删除）；群聊时这里是群名 |
| 09.2.4 | `#pfNavTitle` / `#pfSub` / `.pf-sub` | id + class | 导航标题与名字下的小字：单聊「个人资料」，群聊改「群聊资料」+ 名字下标「群主 · 我」（群是我发起的，群主默认是我） |
| 09.2.12 | `#pfGroup` / `.pf-group-info` / `#pfGroupNameVal` / `#pfGroupNoticeVal` | id + class | 群信息卡（只有群聊显示，排在 hero 和群成员之间）：两行「群名称 / 群公告」，右侧各一句当前值（公告超过 16 字自动省略），点开分别改名与改公告 |
| 09.2.5 | `#pfMembers` / `.pf-members` / `#pfMemberGrid` / `.pf-members-head` / `.pf-sec-title` / `#pfMemberCount` | id + class | 群成员卡（**只有群聊显示**）：标题「群成员」+ 右侧「N 位」，下面一排成员头像 |
| 09.2.10 | `.pm-item.is-me` / `.pm-owner-mark` | class | 群成员第一位是「我」：头像右下角叠一枚 16px 圆、里面一个「主」字，标出群主身份；名字显示 `d.me.name`（默认「我」） |
| 09.2.11 | `.pf-manage-row.is-me` / `.pf-manage-role` | class | 群管理里最上面一行也是「我」：不给禁言开关，右侧换成「群主」小胶囊；名字转淡以区别可管理的成员 |
| 09.2.6 | `.pm-item` / `.pm-av` / `.pm-name` / `.pm-add` | class | 成员头像格（46px 圆头像 + 名字）；末尾 `pm-add` 是虚线「＋ 添加」格，点开拉人进群 |
| 09.2.7 | `#pfManage` / `.pf-manage` / `#pfManageList` / `#pfOwnerNote` | id + class | 群管理卡（只有群聊显示，排在群成员卡和行列表之间）：右上角显示「已禁言 N 位 / 还没有禁言谁」，下面是成员逐行 |
| 09.2.8 | `.pf-manage-row` / `.pf-manage-name` / `.pf-manage-state` / `.pm-av.is-sm` | class | 群管理里的一行：34px 小头像 + 名字（被禁言时后面挂「已禁言」小字）+ 右侧禁言开关（近黑滑块，见 `09.4.7`） |
| 09.2.9 | `.pm-item.is-muted` / `.pm-muted-mark` | class | 群成员格里被禁言的人：头像压到 55% 透明、名字转淡，头像右下角叠一枚 15px 小圆加一道斜杠 |
| 09.4.7 | `.pf-manage-row .switch[aria-checked="true"]` | 状态样式 | 禁言开关打开时用 `--text` 近黑，不用强调色——它是「限制」而不是「开启功能」 |
| 09.3.1 | `#pfRows` / `.pf-item[data-act]` | id + class | 五行标签页式列表：`settings` 聊天设置、`pin` 置顶聊天、`background` 聊天背景、`search` 查找聊天记录、`clear` 清空聊天记录 |
| 09.3.2 | `.pf-item-note` / `#pfBgNote` | class + id | 行尾备注（背景当前状态：已设置 / 跟随全局 / 无） |
| 09.3.3 | `.pf-item.is-danger` | 状态 class | 危险态（清空聊天记录，红字） |
| 09.3.4 | `.pf-hair` / `.pf-arrow` | class | 行间发丝线与右箭头 |
| 09.3.5 | `#pfPinSwitch` | id | 置顶开关，改用 `common.css` 的 `.switch` 圆形滑块（`aria-checked` 表示是否置顶）；原 `.pf-pill` / `#pfPinPill` 胶囊已删（见 R-72） |
| 09.4.1 | `.pf-card` | class | 通用卡片底板（行列表用 `.pf-list` 去掉内边距） |
| 09.4.2 | `.pf-select` | class | 弹层内的无边框下拉（背景来源、音效） |
| 09.4.4 | `.pf-sheet-actions` / `.sheet-gap` | class | 聊天设置弹层顶部的动作按钮行（让对方说话 / 去字卡库）与底部留白 |
| 09.4.5 | `.pf-hits` / `.pf-hit` / `.pf-hit-tag` / `.pf-hit-text` / `.pf-hit-time` / `.pf-hit-empty` | class | 查找聊天记录的结果列表、命中词 `<mark>` 高亮、发送人与时间、空态 |
| 09.4.6 | `.sheet.is-full` / `.fs-head` / `.fs-close` / `.fs-body` / `.fs-foot` / `#pfClose` | class + id | 铺满屏幕的弹层（样式统一放在 `common.css`，聊天设置与问卷共用）：`.sheet.is-full` 覆盖 common.css 的 430 / 86vh 约束，改成整屏 `height:100%`、直角、无内边距；`.fs-head` 是吸顶标题栏（标题 + 「关闭」按钮 `#pfClose` / `#formClose`），`.fs-body` 是滚动区（左右 16px、最宽 460 居中），`.fs-foot` 是吸底动作条（够不到滚动区，`.sheet-actions` 最宽 428 居中） |
| 09.5.1 | `renderHero()` / `bgText(p)` / `current()` | 函数 | 顶部资料与行尾状态的渲染；群聊时切「群聊资料」并挂出成员卡 |
| 09.5.1.a | `isGroup(sn)` / `groupMembers(d, sn)` / `renderMembers(sn)` | 函数 | 群聊判定（`params.groupEnabled && memberIds.length >= 2`）、成员名单（`memberIds` → `d.members`，名字头像优先取同 `memberId` 的会话）、成员卡渲染 |
| 09.5.1.b | `openAddMembers(sn)` | 函数 | 「＋ 添加」拉人弹层：列出还没进群的 `d.members`，点选多个 → 「添进去」写回 `params.memberIds`（并保证 `groupEnabled=true`），完成后重新渲染成员卡 |
| 09.5.1.d | `renderGroupInfo(sn)` / `openGroupName()` / `openGroupNotice()` | 函数 | 群信息两行的渲染与编辑：群名称走 `YM.ui.input`（两行文本、限 20 字、必填）写回 `sn.name`；群公告同款弹层（五行、限 200 字、可空）写回 `params.notice`；写完整页重画并 toast |
| 09.5.1.c | `mutedOf(sn)` / `renderManage(sn, list)` | 函数 | 读 `params.muted`、画群管理那一列成员行；点开关写 `{ at: 时间戳 }` 或删掉该键（scope `params`），随后整页重画并 toast「已禁言 X，群里暂时听不到 TA」/「已解除 X 的禁言」 |
| 09.5.2 | `pickImage(maxBytes)` | 函数 | 图片选择（头像 300KB / 背景 500KB） |
| 09.5.3 | `save(fn)` / `bindNum()` / `bindSwitch()` / `selectedMembers(root)` / `roleList(d)` / `resizeActive()` | 函数 | 参数回写（`scope='params'`）与群成员 chip、主动消息计时器重排 |
| 09.5.4 | `openSettings()` / `speakNow(close)` | 函数 | 聊天设置铺满屏幕（`.sheet.is-full` + 吸顶标题栏 + `.fs-body` 滚动区），内容分回复节奏 / 主动消息 / 对话形式 / 正在输入 / 声音，顶部两个动作按钮「让对方说话」「去字卡库」 |
| 09.5.5 | `openBackground()` | 函数 | 「聊天背景」这一行 → 自绘面板：`#bgsPrev` 预览（`.bgs-veil` 按当前压暗值 + 两条示例气泡）、`#bgsPick` 从相册上传（隐藏 `#bgsFile`）、`#bgsReset` 恢复默认、`#bgsDim` 压暗滑杆（0~80，默认 0 = 不盖）、`[data-scope]` 这个会话 / 全部会话 |
| 09.5.5.a | `bgState()` / `bgShown(state, scope)` / `saveBg(scope, payload)` | 函数 | 读出本会话与全局两份背景、按范围取当前生效的一份；`saveBg` 写回 `sn.params.background`（本会话）或 `d.settings.chatBackground`（全部会话，scope `'settings'`），顺手刷新行尾 `#pfBgNote` |
| 09.5.5.b | `.bgs-preview` / `.is-empty` / `.bgs-veil` / `.bgs-sample` / `.bgs-acts` / `.bgs-act` / `.is-plain` / `.bgs-row` / `.bgs-label` / `.bgs-range` / `.bgs-chips` / `.bgs-chip` / `.is-on` | class | 背景面板样式（已从 `css/chat.css` 搬到 `css/profile.css`）：预览框、压暗遮罩、两条示例气泡、上传 / 恢复按钮、滑杆（2px 轨 + 16px 圆点）、范围胶囊 |
| 09.5.5.c | `shrinkToData(file, cb)` | 函数 | 把选中的图读成 Image，按长边 1280 缩到 canvas，导出 JPEG 0.82 的 dataURL（失败回退原 dataURL） |
| 09.5.5.d | `#bgsUrl` / `#bgsUrlNote` / `.bgs-url` / `.bgs-url-note` / `.is-bad` | id + class | 链接直链输入行：粘上就 420ms 防抖试着读一次（只放行 `http(s)` / `file` / `data:image`），读得出来直接当背景并写库、预览同帧换图，读不出来把边框与提示染成赭红（`.is-bad`）；换范围 / 上传 / 恢复默认时同步清空或回填 |
| 09.5.5.e | `tryUrl()` / `note(text, bad)` / `prefill()` | 函数 | 链接解析的三只小工具：`tryUrl` 是 `YM.util.debounce` 包住的试读（`new Image()` 预载，序号自增避免旧请求覆盖新输入）、`note` 管那行提示的显隐与染红、`prefill` 在打开面板时把已存的非 dataURL 链接回填进输入框 |
| 09.5.6 | `openSearch()` / `mark(text, q)` | 函数 | 查找聊天记录弹层，点结果带 `?focus=<消息 id>` 跳回聊天页 |
| 09.5.7 | `togglePin()` / `clearChat()` | 函数 | 置顶开关（写 `session.pinned`）与清空记录（`task.cancel` + 清 `messages`） |

---

## 10. 08 工具与测试

| 编号 | 名称 | 位置 | 说明 |
| --- | --- | --- | --- |
| 08.1.1 | `extract_names.py` | `tools/` | 抽取 id / class / 函数，供本清单核对 |
| 08.1.2 | `selfcheck.py` | `tools/` | 自动检查：JS 语法、HTML 标签配对、JS 引用的 id 是否存在、清单↔代码双向对照 |
| 08.1.3 | `TESTING.md` | `docs/` | 测试用例与实测记录 |

---

## 11. 10 信笺（letters）

### 11.1 页面与导航

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 10.1.1 | `pages/letters.html` | 页面 | `pages/` | 信笺整页（返回桌面 / 标题 / 写一封） |
| 10.1.2 | `.letter-app` | class | `letters.html` | 页面外壳（flex 列，撑满一屏） |
| 10.1.3 | `#btnWrite` | id | 同上 | 右上笔形按钮，打开写信托盘 |

### 11.2 信袋列表

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 10.2.1 | `#letterList` | id | `letters.html` | 信件列表容器 |
| 10.2.1.a | `#letterSeg` / `.letter-seg` | id / class | 同上 | 「发出 / 收到 / 时空来信」三段分段控件（272px 居中、字 12.5px，样式复用 07 的 `.seg` / `.seg-item[data-seg]`） |
| 10.2.2 | `.letter-card` | class | `letters.js` `cardHtml()` | 信卡片（`data-id` + `data-kind`：`out` / `in` / `drift`）；`in` 是多带一封回信的一来一回，点开出两张信纸 |
| 10.2.3 | `.lc-top` / `.lc-title` / `.lc-time` | class | 同上 | 标题 + 时间（时间走 `formatMsgTime`） |
| 10.2.4 | `.lc-excerpt` | class | 同上 | 正文摘要两行截断（宋体 12px） |
| 10.2.5 | `.lc-foot` / `.lc-dot` | class | 同上 | 「写给 X」/「X 寄来」/「X · 回信」；未读红点，`is-read` 时隐藏 |
| 10.2.6 | `#letterEmpty` / `.letter-empty` | id / class | `letters.html` | 空态容器 |
| 10.2.6.a | `#emptyTitle` / `#emptySub` | id | 同上 | 空态两行文案，随「收到 / 发出」切换 |
| 10.2.7 | `.letter-foot` | class | 同上 | 底部 40px 短线 |

### 11.3 信纸（读信）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 10.3.1 | `.letter-paper` | class | `letters.js` `openLetter()` | 读信纸容器（铺满屏幕弹层的 `.fs-body` 内；米白纸底 + 外描边 + `::after` 内细线框 + 柔和投影） |
| 10.3.1.a | `.lp-bloom` | class | 同上 | 信纸角落的栀子线描（`letters.js` 里的 `BLOOM` 常量内联 SVG，五瓣 + 一叶），读信时居中贴纸底、写信时缩在右下角淡显 |
| 10.3.2 | `.lp-head` / `.lp-to` / `.lp-date` | class | 同上 | 抬头：写给谁 / 寄来 + 时间（时间写全年月日时分） |
| 10.3.3 | `.lp-title` | class | 同上 | 信标题（16.5px 宋体、居中、字距 0.1em） |
| 10.3.4 | `.lp-body` | class | 同上 | 正文（14px 宋体、行高 2.2、首行缩进 2em） |
| 10.3.5 | `.lp-sign` | class | 同上 | 落款（右对齐，署名 + 全年月日时分的时间） |
| 10.3.6 | `.letter-thread` | class | `letters.js` `openThread()` | 「收到」里我的信与回信上下排（两条 `.letter-paper`，间隔 14px） |
| 10.3.7 | `#ltClose` / `#ltDel` / `.lt-head-acts` | id + class | 同上 | 读信层右上「删除 / 关闭」一组（删除走二次确认，删完自动收起弹层） |

### 11.4 写信

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 10.4.0 | `.lw-paper` | class | `letters.js` `openWrite()` | 写信用同一张 `.letter-paper`（`lw-paper` 只改内边距，栀子淡显在右下） |
| 10.4.0.a | `.lt-head` / `.lt-to` / `#ltToName` / `.lt-caret` | class / id | 同上 | 吸顶栏「写给」+ 角色下拉按钮（名字 + 下折小箭头，按钮稳在 `.fs-head` 里） |
| 10.4.0.b | `.lt-menu` / `.lt-opt` | class | 同上 | 自绘下拉菜单（不用原生 `select`，避开 R-19 的系统焦点描边）；`.lt-opt` 行，当前角色右侧带叶绿圆点 `is-on` |
| 10.4.1 | `.lw-field` / `.lw-label` | class | 同上 | 标题字段行 |
| 10.4.2 | `.lw-input`（`#ltTitle`） | class / id | 同上 | 标题输入（≤24 字） |
| 10.4.3 | `.lw-body`（`#ltBody`） | class / id | 同上 | 正文 `textarea`（≤1200 字，无边框，`min-height:46vh`） |
| 10.4.4 | `.lw-foot-hint` | class | 同上 | 正文下方一行提示 |
| 10.4.5 | `#ltCancel` / `#ltSave` / `#ltSend` | id | 同上 | 关闭 / 取消 / 封好寄出 |

### 11.5 数据与函数（`letters.js`）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 10.5.1 | `d.letters` | 数据 | `YM.store` 顶层 | 信件数组：`{id, role:'user'\|'peer', peerName, title, body, createdAt, read, replyAt, replied, replyTo}`；回信的 `replyTo` 指向被回的那封信，没有 `replyTo` 的角色来信算「时空来信」 |
| 10.5.1.a | `d.letterDrift` | 数据 | 同上 | `{day:'YYYY-MM-DD'}`：时空来信一天最多落一封的记账（首次进页面必落一封） |
| 10.5.2 | `peerName()` | function | `letters.js` | 写信对象默认值：`dmSessions()` 里最近更新的那个角色，没有时用「远方的人」 |
| 10.5.2.a0 | `dmSessions(d)` | function | 同上 | 一对一会话：过滤掉 `params.groupEnabled && memberIds.length >= 2` 的群聊，再按最近更新排序；下拉候选与默认对象都用它 |
| 10.5.2.a | `roleNames()` | function | 同上 | 下拉候选：按会话列表同一套排序（最近更新在前）取 `sessions` 的名字 |
| 10.5.2.b | `CARET` | 常量 | 同上 | 下拉按钮上的小折线箭头（内联 SVG 字符串） |
| 10.5.3 | `letters(d)` | function | 同上 | 保证 `d.letters` 为数组并返回 |
| 10.5.4 | `pushLetter(item)` | function | 同上 | 落一封信（`store.update`） |
| 10.5.5 | `saveAll(fn)` | function | 同上 | 标已读等批量改写的统一入口 |
| 10.5.6 | `tick()` | function | 同上 | 每 1.5 秒检查 `replyAt` 到点且未回的，补一封 `role:'peer'` 回信 |
| 10.5.7 | `makeBody()` | function | 同上 | 回信正文：从 `LINES` 随机拼 3~4 句 |
| 10.5.8 | `render()` / `excerpt(text)` / `cardHtml(it)` / `dot(on)` | function | 同上 | 列表渲染：`out` 列我寄出的、`in` 列「我寄出且已回信」的一来一回（按回信时间倒序）、`drift` 列无 `replyTo` 的角色来信；空态文案随分段换 |
| 10.5.8.b | `replyOf(d, uid)` | function | 同上 | 按 `replyTo` 找回信 |
| 10.5.8.a | `setSeg(next)` | function | 同上 | 切换「发出 / 收到 / 时空来信」：改 `aria-selected` 再重渲染；寄出成功后自动切到「发出」 |
| 10.5.9 | `openLetter(id)` / `openThread(uid)` / `openSheet(...)` / `paperHtml(l)` / `fullStamp(ts)` / `bodyHtml(text)` | function | 同上 | 铺满屏幕的信纸：`openLetter` 单张（发出 / 时空来信），`openThread` 我的信 + 回信两张（吸顶栏标题「一来一回」）；打开即标已读 |
| 10.5.9.a | `deleteLetter(id, after)` / `letterMenu(id)` | function | 同上 | 删信：`letterMenu` 是长按弹出的 `YM.ui.actionSheet`（一项「删除这封信」），`deleteLetter` 走 `YM.ui.confirm` 二次确认后从 `d.letters` 摘掉并重渲染 |
| 10.5.9.b | 长按 450ms 事件 | 事件 | 同上 | 信袋卡片长按出菜单：`touchstart/touchmove/touchend` + `pointerdown/pointermove/pointerup` 两套（鼠标与触摸都能用），位移 >8px 取消；长按成功置 `suppressClick` 吞掉随后的 click；右键 `contextmenu` 同样出菜单 |
| 10.5.10 | `openWrite()` | function | 同上 | 写信托盘：落信 + `replyAt = 现在 + 4~12 秒` |
| 10.5.11 | `LINES` / `TITLES` | 常量 | 同上 | 回信句子池 12 句 / 回信标题 5 条 |
| 10.5.11.a | `DRIFT_LINES` / `DRIFT_TITLES` | 常量 | 同上 | 时空来信的句子池 8 句 / 标题 5 条（角色主动写，不接话头） |
| 10.5.11.b | `rollDrift()` / `linkOld(d)` | function | 同上 | `rollDrift` 一天一次、约四成概率落一封时空来信（当天第一封必落）；`linkOld` 把早先没记 `replyTo` 的回信按「同一位、时间在后」补挂一次 |

### 11.6 样式变量

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 10.6.1 | `--paper` / `--paper-2` / `--paper-line` | 变量 | `css/letters.css` | 纸色 `#FCFBF3` / 纸底渐变尾色 `#F6F5E8` / 纸线 `#E3E0D1`；dark 下 `#1D1F1B` / `#212319` / `#2E3129` |
| 10.6.2 | `--leaf` / `--wax` | 变量 | 同上 | 叶绿（栀子线描、落款上方细线、下拉选中点）`#7E9673` / 未读蜡红 `#A8462F`；dark 下 `#93A98C` / `#C9715A` |

---

## 13. 11 潮汐（tide）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 11.1.1 | `pages/tide.html` / `css/tide.css` / `js/tide.js` | 文件 | 同名一套 | 桌面第五个入口「潮汐」——**内置日历**（只做月视图，纯前端算，不落数据） |
| 11.2.1 | `.tide-app` / `.tide-main` | class | `pages/tide.html` / `css/tide.css` | 页面容器与内容列（不再限宽、横向铺满内容区，上内边距 8px；返回键与标题走 `common.css` 的 `.nav`） |
| 11.2.2 | `.tide-bar` / `.tide-arrow` / `.tide-month` | class | 同上 | 月份条：左右翻月圆钮（30px、无底、图标 18px）+ 中间「2026年11月」（15px、字距 0.1em） |
| 11.2.3 | `.tide-week` | class | 同上 | 星期行，周一开头：一 二 三 四 五 六 日 |
| 11.2.4 | `.tide-grid` / `.tide-cell` | class | 同上 | 7 列 × 6 行的日格（每格高 `clamp(25px, 6.4vw, 40px)`（440 宽下约 28px）、间距 2px、圆角 8px、12.5px 等宽数字） |
| 11.2.19 | `.is-blank` | class | 同上 | 日历里本月最后一天之后的占位空格子（不带日期、不可点），用来把最后一行补齐，不再显示下月的灰字 |
| 11.2.5 | `.is-outside` / `.is-weekend` / `.is-today` / `.is-pick` | class | 同上 | 非本月日期淡化到 `--line-strong`；周末略降透明；今天一圈 1px 细方框（`::after`，**只在经期分段画**）；选中一圈 25px 细圆环（`::before`，底色透明，**只在日程分段画**） |
| 11.2.5.a | `.is-period` / `.is-start` / `.is-pending` | class | 同上 | 经期日：整格铺一层 12% 的 `--text` 浅底；一段的起讫两端再深到 22%（`is-start` 起讫共用）；落在外月时淡到 45%；`is-pending` 是经期点了第一下、还没点讫日时的起日（20% 底 + 1px 内描边）。三者**只在 `data-tab=period` 下绘制**，日程 / 睡眠看到的是干净日历 |
| 11.2.6 | `.tide-tabs` / `.tide-tab` / `.is-on` | class | 同上 | 三格等宽分段「日程 / 经期 / 睡眠」（左右各留 18px、每格高 34px、12.5px 字）；选中态文字转 `--text`，下方一枚 16×1 短细线（`::after`，透明度 0.45），不描边、不加胶囊底 |
| 11.2.7 | `.tide-app[data-tab]` | 属性 | 同上 | 当前分段标记：`plan` / `period` / `sleep`，由切换时写入；三个分段**共用同一份日历**，日历不收起，切换只改这条属性（后续按分段换标记口径用） |
| 11.2.8 | `.tide-act` / `.ta-when` / `.ta-set` / `.is-set` | class | 同上 | 导航右上那枚按钮：日程下画「回到今天」的日历图标（`.ta-when`：圆角矩形 + 两根上齿 + 一条横线 + 中间一实心点），经期 / 睡眠下换成设置滑杆图标（`.ta-set`：两长线 + 两圆点），由 `.is-set` 切换 |
| 11.2.9 | `.tide-below` / `.tide-below-head` / `.tide-below-title` / `.tide-below-empty` | class | 同上 | 日历下方那块分段专属内容：标题行（只有日期，加计划的入口已挪到右上图标）、空态一行字（12.5px、`--text-2`） |
| 11.2.10 | `.tide-plan` / `.tide-plan-dot` / `.tide-plan-text` / `.tide-plan-del` | class | 同上 | 日程里的计划行：4px 圆点 + 13px 正文（自动换行）+ 右侧「删」小字钮，行间一条 `--line` 细线 |
| 11.2.13 | `.tide-add-day` / `.tide-add` / `.tide-add-row` / `.tide-add-name` / `.tide-add-text` / `.tide-add-date` | class | 同上 | 添加计划面板：副题、内容一行（右对齐输入框）、日期一行（普通计划用 `type="date"` 选年月日，默认当前选中那天） |
| 11.2.14 | `.tide-tags` / `.tide-tag-btn` / `.tide-tag-btn.is-on` | class | 同上 | 标签两枚胶囊「生日 / 纪念日」，点第二下取消，`is-on` 转实底 |
| 11.2.15 | `.tide-plan-tag` / `.tide-plan-every` | class | 同上 | 计划行里的标签小胶囊，以及生日 / 纪念日那种重复项的「每年」小字 |
| 11.2.16 | `.tide-add-md` / `.tide-add-num` / `.tide-add-unit` | class | 同上 | 生日 / 纪念日只要月、日：两个 34px 数字输入框加「月 / 日」小字 |
| 11.2.17 | `.tide-plan-tag svg` / `.tide-tag-btn svg` | class | 同上 | 标签上那一枚 14px 线描小图标（生日是插着蜡烛的实心蛋糕，纪念日是一颗心），`fill:none`、1.6px 描边、`currentColor` |
| 11.2.23 | `.sl-calc` / `.sl-calc-label` / `.sl-calc-dur` | class | 同上 | 「记一笔」面板里自动算出来的那一行：灰底圆角条，左「这一觉」、中间三档胶囊（复用 `.tide-sleep-state`）、右「6 小时 45 分」，随四个时间输入实时刷新 |
| 11.2.19 | `.tide-sleep-dot`（`.is-good` / `.is-short` / `.is-late`） | class | 同上 | 睡眠段日期下方的 5px 小圆点：规律早睡 `#7E9673` 绿、睡眠不足 `#C0873C` 琥珀、熬夜 `#B4483A` 红；同一枚点也用在下方图例里 |
| 11.2.20 | `.tide-cell.has-sleep` / `.is-sleep-good` / `.is-sleep-short` / `.is-sleep-late` | class | 同上 | 睡眠段记过的那天：格子改成竖排（数字在上、圆点在下），并按三档挂状态后缀；外月日期淡到 0.4 |
| 11.2.21 | `.tide-sleep` / `.tide-sleep-state` / `.tide-sleep-time` / `.tide-sleep-dur` | class | 同上 | 睡眠段下方那一笔的记录行：左「规律早睡 / 睡眠不足 / 熬夜」小胶囊、中间「23:40 睡 · 07:10 起」、右「8 小时 30 分」，尾上「删」 |
| 11.2.22 | `.tide-legend` / `.tide-legend-item` | class | 同上 | 记录行下面一行三色图例（点 + 10.5px 字），说明三档分别是什么颜色 |
| 11.2.18 | `.has-mark` / `.tide-num` / `.tide-mark` | class | 同上 | 日程分段里有生日 / 纪念日的那一天：格子直接显示 15px 标签图标、不再写日期数字（日期只留在 `aria-label` 里）；图标跟着文字色，选中反白时换成 `--bg` |
| 11.2.11 | `.tide-past` / `.tide-past-when` / `.tide-past-days` | class | 同上 | 经期里的往期条目：左侧「11月10日 – 11月14日」（13px、等宽数字），右侧「5 天」（12px、`--text-2`），整行可点 |
| 11.2.12 | `.tide-cell.has-plan` / `.tide-cell.is-expect` | class | 同上 | `has-plan`：日程下该日有点（数字下方 3px 小圆点，选中时转 `--bg`）；`is-expect`：经期下按周期长度推算的下一段，只描 24% 细线不填底 |
| 11.2.13 | `.tide-set` / `.tide-set-row` / `.tide-set-name` / `.tide-set-val` / `.tide-set-num` / `.tide-set-unit` | class | 同上 | 经期 / 睡眠设置面板里的参数行：左侧 13px 名称，右侧无边框数字输入（15px、右对齐、等宽）+ 12px 单位，行间一条细线 |
| 11.3.1 | `#tideGrid` / `#tideMonth` | id | `pages/tide.html` | 日格容器、月份文案 |
| 11.3.2 | `#tidePrev` / `#tideNext` | id | 同上 | 上一月 / 下一月（都属于日历本身，三个分段共用） |
| 11.3.4 | `#tideAction` | id | 同上 | 导航右上那枚按钮，**随分段换功能**：日程=回到今天（翻回本月并把今天设为选中日）、经期=打开「经期设置」、睡眠=打开「睡眠设置」；`aria-label` 跟着换 |
| 11.3.5 | `#tideBelow` | id | 同上 | 日历下方那块分段专属内容的容器，由 `paintBelow()` 按分段填充（日程=当天计划、经期=往期经期、睡眠=当天那一笔 + 三档图例） |
| 11.3.6 | `#tideAddPlan` | id | 同上 | 日程下方标题行右侧的「添加计划」钮（由 `paintBelow()` 动态生成） |
| 11.3.3 | `#tideTabs` | id | 同上 | 分段条容器，内含三枚 `.tide-tab[data-tab=plan\|period\|sleep]`；不再有独立视图片段 |
| 11.5.1 | `render()` / `go(y, m)` / `move(step)` | 函数 | `js/tide.js` | 重排当月 42 格（周一开头，含上下月补位）、切到指定月、按月加减（跨年自动进位） |
| 11.5.1.a | 分段切换（`bind()` 内联） | 函数 | 同上 | 点 `.tide-tab` 时把 `is-on` 在三枚 tab 之间移动，并把键写进 `.tide-app[data-tab]`，随后 `render()` 重绘同一份日历；只在前端切，不写存储 |
| 11.5.3 | `day0(d)` / `sameDay(a, b)` / `keyOf(d)` / `parseKey(k)` | 函数 | 同上 | 归零到当天 00:00、同一天判断（任一为空返回 false）、日期转 `YYYY-MM-DD`、`YYYY-MM-DD` 转 Date |
| 11.5.5 | `periods()` / `savePeriods(fn)` / `periodAt(key)` / `tapPeriod(d)` | 函数 | 同上 | 读 `data.tide.periods`、写回（走 `store.update`，scope `tide`）、判断某天落在哪一段、经期分段里的两下点选 |
| 11.5.6 | `plans()` / `plansOf(key)` / `hasPlan(key)` / `annual()` / `annualOf(key)` / `addPlan(key, item)` / `dropPlan(key, id)` | 函数 | 同上 | `data.tide.plans` 按 `YYYY-MM-DD` 存一次性计划，`data.tide.annual` 存生日 / 纪念日这类一年一次的计划（`date` 只记 `MM-DD`，比对只看月日，哪一年都算同一天）；`plansOf(key)` 把两者合并，`hasPlan(key)` 决定日历上的小点 |
| 11.5.7 | `settings()` / `saveSetting(key, val)` / `expectRange()` | 函数 | 同上 | 读 `data.tide.settings`（缺省 周期 28 天 / 经期 5 天 / 目标睡 8 小时）、写单个值、按周期长度从最近一段推下一段（没记录就不推） |
| 11.5.8 | `syncAction()` / `paintBelow()` / `openAddPlan()` / `paintDateRow()` | 函数 | 同上 | 按当前分段换右上按钮的图标与 `aria-label`（日程段是「添加计划」）；重画日历下方那块内容；`openAddPlan(day)` 弹底部面板写内容 / 日期 / 标签后落库，日期换了就把日历翻到那个月；`paintDateRow()` 在打上生日 / 纪念日后把「日期」那行换成月、日两个输入框 |
| 11.5.9 | `openPeriodSettings()` / `openSleepSettings()` / `numberRow(...)` / `bindNumbers(sheet, close)` | 函数 | 同上 | 两个设置面板（底部 `YM.ui.sheet`）：周期长度 21–45 天、经期长度 2–10 天、目标时长 4–12 小时；输入框 `change` 时夹到区间、写存储、重绘日历 |
| 11.5.12 | `sleepAll()` / `sleepOf(key)` / `saveSleep(key, rec)` | 函数 | 同上 | 读 `data.tide.sleep`（按 `YYYY-MM-DD` 存 `{bed, wake, createdAt}`）、取某天那一笔、写或删（`rec` 传 `null` 即删，scope `tide`） |
| 11.5.13 | `sleepInfo(sl)` / `toMin(hhmm)` / `minText(min)` / `SLEEP_NAME` | 函数 / 常量 | 同上 | 三档判定：入睡落在 23 点以后或凌晨 4 点以前先判「熬夜」（白天补觉不按熬夜算）；否则睡够（≥ 目标时长）是「规律早睡」，不够是「睡眠不足」；`toMin` 把 `HH:MM` 转分钟并处理跨夜，`minText` 转「8 小时 30 分」 |
| 11.5.14 | `openSleepLog(day)` / `calc()` | 函数 | 同上 | 睡眠段点某天弹出的「记一笔」面板：入睡 / 起床各一组「时 · 分」数字输入，`calc()` 在每次输入后即时算出时长与档位（写进 `.sl-calc`），记下即写库并按三档回一句 toast；`data-sleepdrop` 的「删」直接清掉那天的记录 |
| 11.5.10 | `tagIcon(tag)` / `tagLabel(tag)` | 函数 | 同上 | 标签对应的那一枚内联 SVG（`TAG_ICONS`）与中文名，计划行和添加面板共用 |
| 11.5.11 | `planMark(key)` | 函数 | 同上 | 这一天第一条带标签的计划（生日 / 纪念日），用来决定日历格子里画哪枚图标；没有标签返回空串 |
| 11.5.4 | `bind()` / `boot()` / `paint()` | 函数 | 同上 | 接翻月 / 回今天 / 点日格的点击（点非本月格会跳到那个月）；启动时定位到今天；`paint()` 把 `<html data-theme>` 同步到容器 |

---

## 14. 12 共鉴（mirror）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 12.1.1 | `pages/mirror.html` / `css/mirror.css` / `js/mirror.js` | 文件 | 同名一套 | 桌面第六个入口「共鉴」：学习 / 工作 / 娱乐 / 休息 四格，点开是「陪伴」 |
| 12.2.1 | `.mirror-app` / `.mirror-main` | class | `pages/mirror.html` / `css/mirror.css` | 页面容器与正文区 |
| 12.2.2 | `.mirror-kinds` / `.mirror-kind` | class | 同上 | 八格排成四列两行（`grid-template-columns:repeat(4,1fr)`、行距 20、列距 4；格子 62px、圆角 21px）；每格是一列「图标格 + 类名 + 今天谁陪着」 |
| 12.2.3 | `.mirror-kind-tile` | class | 同上 | 跟首页同款格子：66px 白圆角方块（半角 21、1px `--line` 边、极浅阴影）里一枚 30px 细线图标，点一下开「邀请」面板 |
| 12.2.4 | `.mirror-kind-label` | class | 同上 | 格子底下的类名小字（12px、字距 0.1em、`--text-2`） |
| 12.2.5 | `.mirror-kind-note`（`.is-empty` / `.is-call`） | class | 同上 | 类名底下一行 11px 小字：谁在陪你；没人陪时是灰字「没人陪」；角色主动邀请时换成「某某 想陪你」并带下划线，点开是应答面板 |
| 12.5.1 | `render()` | 函数 | `js/mirror.js` | 画六格与每格的陪伴状态 |
| 12.5.2 | `KIND_ICONS` / `kindIcon(key)` / `kindName(key)` | 变量 / 函数 | 同上 | 八类各一枚细线图标：学习 = 一支笔、办公 = 公文包、小说 = 一本书、视频 = 播放键、音乐 = 音符、休息 = 月牙、游戏 = 带十字键与两枚按键的手柄、锻炼 = 四片配重的哑铃（key 为 `study` / `work` / `novel` / `video` / `music` / `rest` / `game` / `exercise`） |
| 12.5.3 | `keyOf(date)` / `memberOf(id)` / `pals()` / `palOf(kind)` / `setPal(kind, id)` | 函数 | 同上 | 当天每格的陪伴，存在 `d.mirror.pals[YYYY-MM-DD][kind]`；查人走角色总表 |
| 12.5.4 | `pendingFor(kind)` / `rollCard()` | 函数 | 同上 | 角色主动邀请：一天只掷一次（`d.mirror.rollDay` 记账），往 TA 的会话里落一张「陪伴邀请」卡（`dir:'in'`）；页面按会话里的待应卡片反查 |
| 12.5.5 | `openInvite(kind)` / `goAnswer(kind)` / `bind()` / `paint()` | 函数 | 同上 | 我邀请角色（候选只列会话里露面过的）、点「某某 想陪你」跳到那个会话去应答、点击委托、主题同步 |
| 12.5.6 | `sendInvite(kind, memberId)` / `sessionOfMember(id)` | 函数 | 同上 | 邀请变成 TA 会话里的一张卡（`dir:'out'`，`buddy.dueAt` 约 2.4 秒后由聊天页判定接受 / 拒绝）；答应后由聊天页把陪伴写回 `d.mirror.pals` |

---

## 15. 13 共时（sync）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 13.1.1 | `pages/sync.html` / `css/sync.css` / `js/sync.js` | 文件 | 同名一套 | 桌面第七个入口「共时」，空态占位页 |
| 13.2.1 | `.sync-app` / `.sync-main` | class | `pages/sync.html` / `css/sync.css` | 页面容器与居中空态区 |
| 13.2.2 | `.sync-mark` / `.sync-title` / `.sync-sub` / `.sync-rule` | class | 同上 | 一枚表盘 + 底下一道细线的线描、主文案「还没有同一刻」、副文案、底部细线 |
| 13.5.1 | `paint()` | 函数 | `js/sync.js` | 同 11.5.1，主题同步 |

---

## 16. 14 共振（resonance）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 14.1.1 | `pages/resonance.html` / `css/resonance.css` / `js/resonance.js` | 文件 | 同名一套 | 桌面第八个入口「共振」，空态占位页 |
| 14.2.1 | `.resonance-app` / `.resonance-main` | class | `pages/resonance.html` / `css/resonance.css` | 页面容器与居中空态区 |
| 14.2.2 | `.resonance-mark` / `.resonance-title` / `.resonance-sub` / `.resonance-rule` | class | 同上 | 中心一点 + 两侧对称扩散的弧线线描、主文案「还没有回声」、副文案、底部细线 |
| 14.5.1 | `paint()` | 函数 | `js/resonance.js` | 同 11.5.1，主题同步 |

---

---

## 17. 15 朋友圈（moments）

| 编号 | 名称 | 类型 | 位置 | 说明 |
| --- | --- | --- | --- | --- |
| 15.1.1 | `pages/moments.html` / `css/moments.css` / `js/moments.js` | 文件 | 同名一套 | 与会话列表并列的第二个分页：可发文字 / 照片 / 视频 / 地点 / @ / 可见范围；导航返回键回会话列表（不是桌面） |
| 15.2.1 | `.moments-app` / `.moments-main` / `.moments-main.is-empty` | class | 同上 | 页面容器；`is-empty` 时正文居中放空态 |
| 15.2.2 | `.moment-list` / `.moment-card` | class | `css/moments.css` | 动态列表与卡片 |
| 15.2.3 | `.mc-head` / `.mc-avatar` / `.mc-names` / `.mc-name` / `.mc-time` | class | 同上 | 卡片头部：34px 头像、作者、相对时间 |
| 15.2.4 | `.mc-text` / `.mc-at` | class | 同上 | 正文（保留换行）；@ 到的名字单独着色 |
| 15.2.5 | `.mc-photos` / `.mc-photos.is-one` / `.mc-photo` | class | 同上 | 单张铺满 4:3，多张走三列方格 |
| 15.2.6 | `.mc-foot` / `.mc-foot-sep` | class | 同上 | 卡片底部：地点、可见范围（公开 / 仅 N 人可见 / N 人不可见） |
| 15.2.11 | `.mc-scope` | class | 同上 | 底部那行可见范围整块可点（`data-scope` 带这条的 id），点开列出这条到底给谁看；`:active` 变 `--panel-2` |
| 15.2.12 | `.scope-list` / `.scope-row` / `.scope-name` / `.scope-note` | class | 同上 | 「谁可以看」面板：一行一位角色（30px 头像 + 名字），上方一句说明 |
| 15.2.7 | `.mc-more` | class | 同上 | 卡片右上角的三点按钮，点开「删除这条」；确认后从 `d.moments` 里摘掉并重渲 |
| 15.2.8 | `.mc-likes` / `.mc-heart` / `.mc-like-names` | class | 同上 | 点赞行：实心小心 +「沈星回、祁煜 赞过」 |
| 15.2.9 | `.mc-cmts` / `.mc-cmt` / `.mc-cmt.is-reply` / `.mc-cmt-name` / `.mc-cmt-to` / `.mc-cmt-colon` / `.mc-cmt-text` | class | 同上 | 评论列表；`is-reply` 的往右缩进一格，行首是「回复 我：」；整行可点，带 `data-cid` 用来定位这条评论 |
| 15.2.10 | `.mc-acts` / `.mc-act` / `.mc-act.is-on` | class | 同上 | 卡片右下两颗胶囊：赞（心形 + 数）/ 评论（气泡 + 数）；我自己赞过时 `is-on` 转深 |
| 15.3.1 | `.moments-empty` / `.moments-mark` / `.moments-title` / `.moments-sub` / `.moments-rule` | class | 同上 | 空态线描、主文案「还没有人发过」、副文案、底部细线 |
| 15.4.1 | `.cp-mask` / `.cp-sheet` / `.cp-head` / `.cp-head-btn` / `.cp-head-btn.is-post` / `.cp-head-title` | class | 同上 | 整屏发布页：取消 / 发布朋友圈 / 发布 |
| 15.4.2 | `.cp-body` / `.cp-text-wrap` / `.cp-count` | class | 同上 | 可滚正文、文字卡与字数（0/600）；照片格（含「＋」）已并进同一张文字卡里，字数改成卡内右对齐的一行（不再是绝对定位的角标） |
| 15.4.3 | `.cp-photos` / `.cp-photo` / `.cp-photo-del` / `.cp-add` / `.cp-photo.is-video` / `.cp-video-holder` / `.cp-video-tag` | class | 同上 | 三列媒体格（照片与视频混排）、右上删除角标、虚线「＋」添加（点了先问照片还是视频）；视频格是深底播放三角 + 左下「视频」字样 |
| 15.4.4 | `.cp-rows` / `.cp-row` / `.cp-ico` / `.cp-row-label` / `.cp-row-value` / `.cp-arrow` | class | 同上 | 三行设置：地点（直接输入）、提到谁、谁可以看 |
| 15.4.5 | `#cpFile` / `#cpVideo` | input | `pages/moments.html` | 隐藏的图片选择框（可多选）与视频选择框（单条）；视频走 `data:video/*` 直存，单条上限 2.5MB |
| 15.5.1 | `.cp-pick` / `.cp-pick-head` / `.cp-pick-title` / `.cp-pick-body` | class | `css/moments.css` | 发布页内的子面板（提到谁 / 谁可以看），覆盖整屏 |
| 15.5.2 | `.pick-list` / `.pick-item` / `.pick-face` / `.pick-main` / `.pick-name` / `.pick-note` / `.pick-box` / `.pick-radio` | class | 同上 | 角色选择行：勾选圆点、可见范围三选一单选点 |
| 15.6.1 | `render()` / `cardHtml()` / `textHtml()` / `photosHtml()` / `footHtml()` / `scopeText()` | 函数 | `js/moments.js` | 列表渲染：按时间倒排，@ 名字高亮，单张/多张照片，地点与可见范围 |
| 15.6.2 | `openCompose()` / `closeCompose()` / `resetCompose()` / `renderPhotos()` / `setCount()` | 函数 | 同上 | 发布页开关与状态重置、照片格重绘、字数与发布按钮可用态 |
| 15.6.3 | `compress()` / `addImages()` / `addVideo()` / `pickMedia()` | 函数 | 同上 | 图片先按长边 1000px 缩、JPEG 0.72 压成 dataURL；单张上限 12MB、媒体合计最多 9 项；`pickMedia()` 用动作面板先选「照片 / 视频」再触发对应选择框 |
| 15.6.4 | `openPick()` / `closePick()` / `renderPickBody()` / `bindPickBody()` / `commitPick()` | 函数 | 同上 | 提到谁 / 谁可以看两个子面板；@ 会把「@名字」插到光标处，可见范围按公开 / 部分可见 / 不给谁看落库 |
| 15.6.5 | `post()` | 函数 | 同上 | 落库到 `d.moments`，空内容拦下 |
| 15.6.6 | `openMore()` / `deleteMoment()` | 函数 | 同上 | 三点 → 动作面板「删除这条」→ 确认弹窗（标题「删除这条朋友圈？」、按钮「删除」）→ 从列表摘掉 |
| 15.6.7 | `likesOf()` / `cmtsOf()` / `visibleMembers()` | 函数 | 同上 | 取点赞名单、评论列表，以及按可见范围算出「这一条谁能看见」的人 |
| 15.6.8 | `socialHtml()` / `nameOf()` | 函数 | 同上 | 拼出点赞行、评论块与底部两颗按钮 |
| 15.6.9 | `toggleLike()` / `openComment()` | 函数 | 同上 | 我点「赞」写 `me` 进 `m.likes`；点「评论」走 `YM.ui.input`，落进 `m.comments` 并约一位角色过几秒来回复 |
| 15.6.10 | `scheduleMoment()` / `addLike()` / `addComment()` / `scheduleReply()` | 函数 | 同上 | 角色反应：按这条的可见人数 N（`visibleMembers`），从中挑 1~N 个点赞、再挑 1~N 个评论，错峰排在 5~40 秒内；我评论后 4~14 秒有角色回一句，回完写 `reactDone` 防重跑 |
| 15.6.11 | `openCommentMenu()` / `replyToComment()` / `deleteComment()` / `findComment()` | 函数 | 同上 | 点评论行：角色的出「回复」，我的出「删除这条评论」；回复挂 `to` 指向被回的那条，删除时连同挂在它下面的回复一起摘掉 |
| 15.6.12 | `openScope()` / `findMoment()` | 函数 | 同上 | 点卡片底部的眼睛，按 `scope.mode` 摊开名单：公开列全部在册角色，部分可见列被选中的，不给谁看列被排除的；`findMoment()` 按 id 取那条 |
| 15.7.1 | `data.moments` | 数据结构 | `js/common.js` | `[{id, text, media:[{kind:'image'|'video', src}], place, mentions:[成员 id], scope:{mode:'all'|'include'|'exclude', ids:[]}, createdAt}]`；旧数据里的 `photos:[dataURL]` 由 `mediaOf()` 兼容成图片项；`defaultData()` 给空数组，`migrate()` 兜底 |
| 07.4.7 | `.two-tabs` / `.two-tab` | class | `css/common.css` | 会话 / 朋友圈两页共用的底部双 tab：两列 `1fr 1fr` 等分整条、中间一道竖线，选中字色转深 + 14px 细线 |

## 18. 16 我的资料（me）

| 编号 | 名称 | 类型 | 说明 |
| --- | --- | --- | --- |
| 16.1.1 | `.me-app` / `.me-scroll` | class | 页面容器与滚动区（与 `.app` 的 430px 限宽对齐，上下留出导航高度） |
| 16.2.1 | `.me-hero` / `.me-meta` | class | 顶部：圆形头像 + 名字 + 签名竖向居中 |
| 16.2.2 | `#meAvatar` / `.me-avatar` | id + class | 72px 圆形头像，点它开「换一张头像」；有图时走 `background-image`，无图时用名字首字 |
| 16.2.3 | `#meName` / `#meBio` / `.me-name` / `.me-bio` | id + class | 名字与签名；签名为空时整行 `hidden` |
| 16.2.4 | `#meBack` | id | 返回：有历史就 `history.back()`，直接进来则回会话列表 |
| 16.3.1 | `.me-card` / `.me-item[data-act]` | class | 三行标签页式列表：`avatar` 头像、`name` 昵称、`bio` 签名 |
| 16.3.2 | `.me-label` / `.me-note` / `#meAvatarNote` / `#meNameNote` / `#meBioNote` | class + id | 行首名目与行尾当前值 |
| 16.3.3 | `.me-hair` / `.me-arrow` | class | 行间发丝线与右箭头 |
| 16.5.1 | `meOf()` / `save(patch)` / `render()` | 函数 | 读 `d.me`（缺省 `{name:'我', avatar:'', bio:''}`）、按字段回写（`scope='all'`）、重画头像与三行 |
| 16.5.2 | `pickImage(maxBytes)` / `changeAvatar()` | 函数 | 选图（300KB）与「换一张头像」面板（从相册选 / 用名字当头像） |

---

## 12. 变更登记

| 编号 | 日期 | 变更 | 影响 |
| --- | --- | --- | --- |
| N1 | 2026-11-08 | v1.0 首次全量登记（01~07） | 基线 |
| R-01 | 2026-11-08 | `#mv*` 在 `04`（移动字卡）与 `05`（成员编辑）同名不同义，但分属两页、同时不同屏 | 保留；若未来同页出现，改名为 `#mm*`（成员）与 `#mv*`（移动） |
| R-02 | 2026-11-08 | `.form-stack` / `.av-preview` / `.avatar-pick*` / `.sheet-actions` / `.chip-list` / `.member-chip` 由页面 css 上收至 `07.5` | 各页 CSS 中删除重复定义 |
| R-03 | 2026-11-08 | `YM.task.cancelAll()` 新增 | 重置数据时清空全部运行期任务 |
| R-04 | 2026-11-08 | 专属字卡由「成员横向 chip 条」改为「角色下拉」：`#memberBar` 内改为 `#roleSelect` + `.role-field`，新增 `#btnNoMember`；`.member-chip` 保留给聊天参数弹层 | 上传 / 编辑 / 导出 / 分组都作用于下拉当前角色 |
| R-05 | 2026-11-08 | 会话新增 `memberId` 字段，与角色（`data.members`）绑定；`planTrigger` 单聊也按 `sn.memberId` 取专属池 | 修复单聊读不到专属字卡；老数据按「会话名 = 角色名」回填 |
| R-06 | 2026-11-08 | 开场动画加 `sessionStorage` 标记 `ym_intro_seen`，整个浏览器会话只播一次 | 从会话列表 / 字卡 / 设置返回桌面直接见主界面 |
| R-07 | 2026-11-08 | 目录重组：根只留 `index.html`，页面进 `pages/`，样式进 `css/`，逻辑进 `js/`，文档进 `docs/`，脚本留 `tools/` | 所有引用改为 `../css/*`、`../js/*`、`../index.html`；`selfcheck.py` 与探针同步改路径 |
| R-08 | 2026-11-08 | 移除新建会话弹层里的「新建角色」按钮（`#btnNewRole`）与 `.inline-pick` 容器、`createRoleQuick()` 函数；角色统一在设置「角色」区维护 | 无角色时点新建会话直接跳 `settings.html#members` |
| R-09 | 2026-11-08 | 新建会话只留「会话名 + 头像」，去掉角色下拉（`#inputRole`）、`roleOptionsHtml()`、`applyRole()`；**会话名即角色名**：创建时同名角色复用、没有则新建并写 `memberId` | 会话与角色一一对应；专属字卡库的角色下拉始终覆盖所有会话角色 |
| R-10 | 2026-11-08 | 字卡库导入导出由 txt 改为 JSON：`importTxt()`/`exportTxt()` → `importJson()`/`exportJson()`，新增 `parseJsonCards()`；菜单文案改「导入 JSON / 导出 JSON」 | 分组结构、屏蔽态一并保全；导入仍按当前根合并去重 |
| R-11 | 2026-11-08 | 聊天输入区改为「＋ / 输入框 / 纸飞机」三件：删 `#btnSpeak`+`.speak-btn`（带 `is-idle` 呼吸提示），新增 `#btnPlus`+`.plus-btn` | 底部聊天框外按钮仍是 1 个（＋），发送键在输入框内 |
| R-12 | 2026-11-08 | 「＋」从菜单改为**上升面板**（`#plusPanel`）：每页 6 项、3 列 2 行，超过 6 项自动分页并横向滑动（`scroll-snap`）+ 圆点指示；面板项当前 6 个占位（相册/拍照/视频通话/红包/分享/问卷），点击提示未接入；「让对方说话」「清空聊天记录」移到顶部 ⋯ 菜单 | 新增功能只要往 `PANEL_ITEMS` 追加一项，分页与圆点自动更新 |
| R-13 | 2026-11-08 | 会话卡片摘要去掉「你：」「成员名：」前缀，只显示消息正文 | 摘要更长可用，首行不再被前缀挤占 |
| R-14 | 2026-11-08 | 会话列表「＋」从直开弹层改为**侧弹窗**（`#newPanel`）：紧贴右上 ＋ 号下方，上下排列两个图标条目 `friend` 加好友（原新建会话流程）、`group` 创建群聊（群名 + 多选角色 ≥2，`groupEnabled=true` 落库）；点空白处收起。聊天页 ＋ 同步抽成公共组件 `YM.ui.panel`（`.plus-panel/.panel-*` → `.action-*`，删掉 chat.js 内 `panelPages/buildPanel/panelIndex/syncDots`） | 会话页弹窗贴按钮弹出，聊天页底部面板仍按 6 项分页（群标记原为「群 N」徽标，已于 R-20 移除） |
| R-15 | 2026-11-08 | 会话页 ＋ 弹窗由底部的上升面板改回**贴着 ＋ 的侧弹窗**（`.new-pop` + `.np-item`，上下两行）；删 `NEW_ITEMS` 常量与页内的分页容器 `#newTrack`/`#newDots` | 桌面端不再从底部升起一整条；空态按钮「新建会话」直接进加好友弹层 |
| R-16 | 2026-11-08 | 字卡库顶部把「搜索字卡」与专属角色下拉并到一行（新增 `.tools-row`，`#memberBar` 从独立条移进工具栏），通用根时只剩搜索框铺满；角色下拉补了下拉箭头与胶囊圆角 | 专属根少占一行高度，搜索与「管谁的字卡」在同一视线内 |
| R-17 | 2026-11-08 | 「加好友」从底部的 sheet 改成**贴在主界面上的一层半透明面板**（`#createMask` + `.create-card`，遮罩全透明、卡片 62% 面板色 + 20px 背景模糊）：宽度按主界面算 —— `min(100vw - 32px, 448px)`、左右各留 16px 并**水平居中**，顶边落在导航下 12px；左头像 42px（点它上传本地图）、右名称，名称行下方一行头像直链 `#inputAvatarUrl`，粘贴即预览（500ms 防抖 + 失焦即时解析），成功写回 `session.avatar` 与角色头像 | 主界面仍在底下当背景，面板不铺暗、不像系统弹窗；宽度、留白一律由主界面反推，换屏宽不用改数值；头像既支持 base64 也支持远程 URL |

| R-18 | 2026-11-08 | 角色名与头像统一以会话为准：字卡库专属根的 `#roleSelect` 选项改由 `roleList(d)` 生成（先取会话名，再补无会话的角色）；`migrate()` 末尾按会话回写 `member.name` / `member.avatar`（群聊会话除外）；`doRename()` / `doAvatar()` 改名换头像时同步写角色 | 字卡库下拉、设置里的角色区、会话列表三处显示同一个名字，不再出现「会话叫阿凛、下拉叫 0」 |

| R-19 | 2026-11-08 | 字卡库专属根的角色下拉由原生 `<select id="roleSelect">` 换成自绘菜单：`#roleBtn`（名字 + 箭头）+ `#roleMenu`（`.role-opt` 列表，`hidden` 控制）；`.member-bar` 的 `overflow: hidden` 改为 `visible` 以便菜单弹出；`.role-btn:focus-visible` 清掉全局 `:focus-visible` 的 2px 强调色描边 | 选中时不再出现系统 select 的蓝色高亮框与左右两条蓝线；菜单展开期间重渲染不再顶掉列表 |

| R-20 | 2026-11-08 | 删掉会话卡片上的「群 N」蓝色徽标：`sessions.js` 去掉 `groupBadge` 拼装、`css/sessions.css` 删 `.s-badge` | 卡片顶部只剩名称与时间，不再出现强调色的色块 |

| R-21 | 2026-11-08 | 「创建群聊」从底部 `YM.ui.sheet` 改成与「加好友」同一套弹窗：新增 `#groupMask` + `#groupCard`（`.create-card.is-group`），内容为左头像 `#gAv`、右群名 `#groupName`、群头像直链 `#gUrl`（500ms 防抖 + 失焦解析）、`#gHint`、`.cc-label` + `#pickGrid` 多选成员、取消/创建；`openCreateGroup()` 重写并新增 `gSetAvatar/gHint/gParse/closeGroup`；头像为空时跟随首个选中成员的图 | 建群弹窗与加好友同款、同位置、同材质；群头像可上传也可贴直链，创建后会话带上头像 |

| R-22 | 2026-11-08 | 「加好友」支持一次建多位：卡片内改为行列表（`#ccRows` / `.cc-friend`），**每一位自带一条 `.cc-url-line` 直链**（头像 / 名称 / 直链一一对应，解析只回填本行）；底部「＋ 再添加一位」加行、每行右侧「×」去掉；提交时逐行建会话与同名角色，1 个直接进聊天、多个留在列表并提示已建数量；`#createCard` 改为空壳由 JS 渲染 | 既能单建也能批量建、多位的头像互不串；`#btnPickAvatar` / `#avPreview` / `#inputName` / `#inputAvatarUrl` 四个旧 id 一并移除 |

| R-23 | 2026-11-08 | 修「头像只在弹窗里能看见、列表/聊天气泡上是空白」：`background-image:url("…")` 写在双引号的 `style` 属性里，内层双引号把属性提前闭合，整条样式失效。四处拼接（`YM.avatarHtml`、聊天页 `msgAvatar`/成员气泡、`settings` 成员预览）统一改成 `url('…')` 单引号并转义 `'`；`avatarHtml` 有图时同时保留名字首字作底衬，图未加载完不会出现空白方块 | 列表、聊天气泡、设置里的头像都能正常显示；直链和 base64 都一样 |

| R-24 | 2026-11-09 | 字卡库加二级 tab：`#kindTabs` + `.kind-tab[data-kind]`（字卡 / 表情包 / emoji，三等分铺满），`YM.util.cardKind()` 按内容判类（图片直链→表情包、纯 emoji→emoji、其余→字卡），`KIND_META` / `countKind()` / `renderKindTabs()` 管文案与条数，切类清空选中与批量态；表情包不进文字回复池（`reply.getPool` 两处过滤）；`addSingle()` 按类校验粘贴内容 | 三类各自搜索、各自空态；表情包不会混进随机回复 |

| R-25 | 2026-11-09 | 字卡库快捷动作搬到搜索行：右上 `⋯` 只留「排序方式 / 全库去重」，导入 / 导出 / 分组 / 管理 改为搜索行**最左侧**的四个图标（`#quickRow`，`data-act=import\|export\|group\|batch`）。版式定为与最早那版一致：裸图标 2×2 直接落在页面上、不套底板也不与搜索框连成同一个胶囊，与搜索胶囊之间留 8px | 四个高频动作一眼可达；搜索框仍占余下整行宽度；专属根时搜索与角色胶囊并列 |

| R-26 | 2026-11-09 | 字卡库专属根的角色下拉与会话列表对齐：`roleList(d)` 只取 `d.sessions` 里还在的角色，删掉「再从 `d.members` 补还没建会话的角色」那段；当前选中角色不在列表时自动落到第一个，一个都没有时显示 `#btnNoMember`「去设置添加角色」 | 会话列表里删掉的角色，字卡库下拉里同步消失，两处名单一致 |

| R-27 | 2026-11-09 | 「创建群聊」的可选成员同样与会话列表对齐：新增 `groupRoles(d)`，`openCreateGroup()` 的 `#pickGrid` 改为按会话生成卡片（不再遍历 `d.members`），头像跟随首个选中成员时也从这份名单取 | 会话列表里删掉的角色不再出现在建群的成员格子里；两处名单（会话列表 / 字卡库下拉 / 建群成员）完全一致 |

| R-28 | 2026-11-09 | ＋ 面板「红包」接入真正的发钱消息：`openMoneySheet()` 弹出红包 / 转账二选一（金额 ≤99999、备注 ≤20 字，备注留空用默认话术），落成带 `kind`（`packet` / `transfer`）、`amount`、`note`、`claimed` 的消息；`moneyCardHtml()` 渲染成卡片（红包暖红底白字、转账常规底），点卡片由 `claimMoney()` 把 `claimed` 置真并降透明度、文案变「已领取 / 已收款」；摘要与引用仍用 `text`（如「红包 ¥12 给你买奶茶」） | 聊天里能发红包和转账并点击领取；普通文字消息渲染路径不变 |

| R-29 | 2026-11-09 | 聊天页顶部两个图标合并成一个三点：删 `#btnParams`（滑块）与它的监听，`#btnMore` 改成唯一入口并跳 `profile.html?sid=`；同时把「会话参数 / 让对方说话 / 清空聊天记录」三个旧 ⋯ 菜单项迁到新页面。新增模块 09：`pages/profile.html` + `css/profile.css` + `js/profile.js`——顶部是当前会话角色（头像可换、名字可改、小字标「角色 / 群聊 N 位成员」），下面是「让对方说话 / 去字卡库 / 清空聊天记录」三行和参数表单（回复节奏、主动消息、对话形式、正在输入）、聊天背景、声音；`.param-*` 与 `.num-pair` 样式由 `chat.css` 上收到 `common.css` 07.6 供两页共用；背景卡片新增 `#pBgClear` | 聊天页导航只剩返回 + 标题 + ⋯；点 ⋯ 进角色资料页，改名字/换头像同步回会话与 `member`；参数改动即时写 `params` |

| R-30 | 2026-11-09 | 个人资料页改为参考图的标签页式行列表：`#pfRows` 只剩五行（聊天设置 / 置顶聊天 / 聊天背景 / 查找聊天记录 / 清空聊天记录），**不做「一起听」**；「让对方说话」「去字卡库」并进「聊天设置」弹层顶部（`.pf-sheet-actions`），参数表单、声音全部收进该弹层，聊天背景独立弹层；置顶聊天（`.pf-pill` 绿胶囊「已置顶」，写 `session.pinned`，会话列表 `render()` 改置顶优先再按最近消息倒序）、查找聊天记录（`#pfSearch` + `.pf-hits`，命中词 `<mark>` 高亮，点结果带 `?focus=<消息 id>` 回聊天页，`chat.js` 新增 `focusMessage()` 滚到该条并短暂选中）；顶部头像 + 名字居中，按用户要求删掉「改名」胶囊与「角色」小字（`#pfRename` / `#pfTag` 及 `.pf-rename` / `.pf-tag` 一并移除） | 资料页从「一屏堆表单」变成「五行入口 + 弹层」；会话列表出现置顶排序；聊天记录可搜可跳；改名入口不再存在（角色名仍在设置「角色」区改） |

| R-31 | 2026-11-09 | 会话卡片整体收紧一档：头像 50 → 44px（`sessions.js` 调 `YM.avatarHtml(sn, 44)`）、卡片内边距 14/14 → 11/11、圆角 18 → 15、卡片间距 10 → 8、名字 15 → 14.5px、时间 11 → 10.5px、摘要 12.5 → 12px 且上边距 5 → 3、`⋯` 热区 34 → 30px | 一屏能多看约一行；版式与配色不变，只是尺寸收小 |

| R-32 | 2026-11-09 | ＋ 面板「问卷」接入：`openFormSheet()` 里出题（题目 ≤5、每题选项 2~4，题干 ≤20 字、选项 ≤12 字，可增删），发送时把题目存进消息 `kind='form'` + `form:[{text, options}]`，并用 `answerForm()` 先按每题选项随机定下 `answers`、`answeredAt = 现在 + 4~12 秒`；`formCardHtml()` 渲染成问卷卡片（`.form-card`，未到点在 `.is-pending` 里显示「待填写」且不亮选项，到点后 `.fc-opt.is-pick` 点亮为「已填写」）；`tickForms()` 每秒检查一次到点翻状态，重开页面按时间戳补齐；`.form-editor` / `.form-q` / `.form-add` 一套编辑样式随 `chat.css` | 聊天里能发自填的问卷并让角色按时作答；聊天页不加载 `sessions.css`，`.cc-add` 换成本页自有的 `.form-add`，避免内联 SVG 被撑到 40px |

| R-33 | 2026-11-09 | 问卷弹层拆成「发出 / 收到」两段（`.seg`）：标题由「出个问卷」改为「问卷」，副标题随分段切换。发出段仍是原来的出题编辑器与发送；收到段由 `renderHits()` 列出本会话里所有 `kind='form'` 的问卷，按 `createdAt` 倒序，每条显示题数、「待填写 / 已填写」胶囊与每题题干 + 对方选中的答案（未到点的不显答案）；点某条先 `close()` 再 `focusMsgInChat(mid)` 回到聊天里那条并短暂选中（`focusMessage()` 也改用这个公共函数）；列表为空时给空态文案 | 问卷有来有回：发出的和填好的都能在同一处看到，还能一键跳回那条消息 |

| R-34 | 2026-11-09 | 聊天里的问卷卡片可点开看整份：卡片加 `data-form="<消息 id>"`，`msgList` 的点击先判 `.form-card`，命中就 `openFormDetail(mid)` 弹出整份问卷（题数标题 + 每题 13.5px 题干与全部 12.5px 选项，选中项 `.fc-opt.is-pick` 点亮，未到点只显题不亮答案），底部只有一个「关闭」；卡片加按下缩放的反馈 | 卡片受 252px 宽限制、题多时会挤，点开就能看完整内容 |

| R-35 | 2026-11-09 | 消息改成长按菜单：`pointerdown` 起 450ms、挪动超 8px 取消，弹出 `.msg-menu`（引用 / 收藏 / 删除 + 取消）；旧的浮动操作条 `#msgActions`（加入字卡 / 删除 / 收起）连同 `.msg-actions` / `.ma-btn` / `.ma-sep` 整段删除，点一下消息只留选中高亮。引用走 `setQuote()` + `#quoteBar`（输入框上方一条摘要 + ×），`send()` 把 `quotedMessageId` 写进消息；收藏写 `message.favorited` 并 toast，菜单第二次打开显示「取消收藏」；删除由 `deleteSelected()` 改为 `deleteMsg(mid)`，仍二次确认并取消该消息的定时任务。`.msg` 关掉长按选字 | 长按才是操作入口，不再误触浮条；引用真正落到 `quotedMessageId`，以前发送永远是 `null` |

| R-36 | 2026-11-09 | 长按菜单由底部弹层改成贴消息的横排工具条：`#msgToolbar` 绝对定位在 `#chatScroll` 里、气泡下方 6px，用户消息右对齐气泡右缘、对方消息左对齐气泡左缘，横向夹在 8px 边距内，下方放不下就翻到气泡上方；引用 / 收藏 / 删除横排、`.mt-sep` 细分隔，删除红字；点任一格执行后收起，滚动、点消息、点空白处也收起，`render()` 时一并收起。`#mtFav` 文案随 `favorited` 在「收藏 / 取消收藏」间切。底部 `.msg-menu` / `.mm-item` / `.mm-cancel` 整段废弃 | 工具条紧挨着被长按的那条消息，不用再低头看底部菜单、也不必记住自己选的是哪条 |

| R-38 | 2026-11-09 | ＋ 面板「视频通话」接成模拟通话：`openCall()` 打开全屏深色层（`.call-mask`，头像做模糊背景 `.call-bg`、中央 132px 头像、底部静音 + 挂断），先「正在呼叫…」1.6 秒后转「通话中 00:00」并每秒走计时；`toggleMute()` 只切按钮态与文案；`endCall()` 关层并把一条 `kind:'call'`（含 `duration`）的记录落进会话，`callCardHtml()` 渲染成 `.call-card`。**不调用摄像头、不申请任何权限**，纯静态模拟 | 面板里的「视频通话」不再是「还没接入」；挂断后聊天里留下通话时长 |
| R-39 | 2026-11-09 | 通话页原来只能挂断退出、界面也不能缩放。缩放做成**整屏等比放大**：`applyScale()` 把倍数写进 `.call-view` 的 `--cz`，名字、状态、头像、静音 / 挂断按钮与间距都按 `calc(* var(--cz))` 一起变大（1~2 倍，双指捏合 / 滚轮 / 双击切换，放大时轻点复原）；左上角新增圆形返回键 `.call-back`（`#callBack`）；`endCall()` 改成只在已接通时落记录，呼叫中途返回不留 `00:00` 空记录。**缩放部分已在 R-41 整体删掉** | 通话界面随时能回聊天 |
| R-40 | 2026-11-09 | 左上返回键从「直接挂断」改成**最小化**：`minimizeCall()` 收起通话层但不打断通话（计时继续），聊天页右下浮出椭圆按钮 `.call-fab`（`#callFab`：`#cfAvatar` 头像 + `#cfTime` 实时时长），点它由 `resumeCall()` 回到通话页；`endCall()` 才真正结束并落记录、顺手收起悬浮按钮；新增 `callActive` 标记，最小化后「正在呼叫 → 接通」的计时仍然生效 | 通话可以挂着继续聊天，随时点悬浮按钮回到通话页 |
| R-41 | 2026-11-09 | 按用户要求**删掉通话页的放大缩小**：清掉 `applyScale()` / `ptrDist()`、`--cz` 与捏合 / 滚轮 / 双击 / 轻点复原的手势监听，`.call-name` / `.call-status` / `.call-avatar` / `.call-actions` / `.call-btn` 的 `calc(* var(--cz))` 全部还原成固定值；`.call-view` 只保留“包一层”的结构（背景 + 舞台），不再承载缩放 | 通话页回到常规尺寸，只剩返回（最小化）与挂断两个操作 |
| R-42 | 2026-11-09 | 问卷弹层改成和聊天设置同一套**铺满屏幕**版式：`openFormSheet()` 给 `.sheet` 加 `.is-full`，拆成吸顶栏 `.fs-head`（「问卷」+ `#formClose`「关闭」）与滚动区 `.fs-body`，「取消 / 发送」挪到吸底条 `.fs-foot`（切到「收到」tab 时自动隐藏）；`.sheet.is-full` / `.fs-*` 从 `profile.css` 移到 `common.css`，两个页面共用一份，`profile.css` 只留注释 | 问卷不再挤在 86vh 小抽屉里，题多时正文滚动、发送按钮一直贴底 |
| R-43 | 2026-11-09 | 「收到」列表里点一条问卷不再跳回聊天里选中那条消息（`focusMsgInChat`），改成 `openFormDetail(mid)` 打开详情——详情层铺满屏幕（`.sheet.is-full` + `.fs-head`「问卷 · N 题 / 关闭」+ `.fs-body`），聊天里的问卷卡片点开也是这个层；详情是**叠在列表层之上**（不先 `close()`），点开的一瞬间两层都在，中间不会露出聊天页；关掉详情回到「收到」列表 | 问卷的「看详情」统一在新界面里，切换不闪、不用离开弹层回聊天找消息 |
| R-44 | 2026-11-09 | 问卷补上回复时间，且**按距离现在多久**来说：`renderHits()` 里已填的卡片底部加一行 `.fi-time`「填写于 …」，详情层副标题改成「对方填好的答案 · …」；文案走新加的 `YM.util.formatSince()`——一个月内说相对（刚刚 / 5分钟前 / 3小时前 / 一天前 / 3天前 / 一个星期前 / 两个星期前 / 三个星期前），满一个月起落到绝对时间「26年11月8日20时44分」；未填的卡片不出这行 | 一眼看出对方是什么时候填的，近的说「几天前」，久的直接给年月日时分 |
| R-45 | 2026-11-09 | 每条消息的 `msgHtml()` 本来就会生成 `.msg-time`，但 CSS 里写死了 `.msg-meta .msg-time { display: none; }`，只有 `data-selected="1"`（查找定位）那条才露，平时一条时间戳都看不见。改成常显（删掉隐藏规则、默认 `inline`），文案交给新加的 `YM.util.formatMsgTime()`：**同一天只给「18:06」不加日期前缀**，昨天 / 前天给「昨天 18:06」「前天 18:06」，更早给「11月8日 18:06」，跨年补两位年份 | 每条消息下面都有时间，同一天不再重复日期，稍远的用「昨天 / 前天」最省字 |
| R-46 | 2026-11-09 | 全站时间改成绝对写法：新增 `YM.util.formatStamp(ts)`（一个月内「11月9日 20:44」、超过一个月「26年11月8日 20:44」），替换掉 `formatRelative` 那句「20 分钟前 / 昨天」——会话列表 `.s-time`、聊天里消息下方 `.msg-time`、个人页查找结果 `.pf-hit-time`、问卷「填写于」与详情副标题统一用它 | 时间一眼能读到年月日时分，不再靠猜「多久以前」 |
| R-47 | 2026-11-09 | 按用户要求把通话页顶部的**对方名字删掉**：`chat.html` 去掉 `<div class="call-name" id="callName">`，`chat.js` 去掉 `callName` 的取元素与 `callName.textContent = sn.name`，`chat.css` 删掉 `.call-name` 并把 `.call-status` 的 `margin-top` 归零，顶部只留「正在呼叫… / 通话中 00:05」这一行状态 | 通话页更干净，名字在聊天页和悬浮按钮上已经够用 |
| R-48 | 2026-11-09 | 桌面加第四个应用「信笺」：`index.html` 第四格 `style="--i:3"`、信封线条 SVG、`href="pages/letters.html"`，与前三格凑成 2×2。新增模块 10：`pages/letters.html` + `css/letters.css` + `js/letters.js`——信袋列表（`#letterList`，按 `createdAt` 倒序，`.lc-excerpt` 两行、`.lc-dot` 未读红点）、点开铺满屏幕的信纸（`openLetter()`，`YM.ui.sheet` + `.sheet.is-full` + `.fs-head`/`.fs-body`，打开即标已读）、右上 `#btnWrite` 写信托盘（`openWrite()`，标题 ≤24 字 / 正文 ≤1200 字，底部「取消 / 封好寄出」）；寄出的信落 `d.letters` 并定 `replyAt = 现在 + 4~12 秒`，`tick()` 每 1.5 秒检查到点补一封 `role:'peer'` 的回信（正文从 12 句 `LINES` 随机拼 3~4 句、标题从 `TITLES` 取），对象名取最近会话的角色（`peerName()`）；`defaultData()` 与 `migrate()` 补 `letters: []` | 桌面四种功能各一格；写出去的信几秒后会收到回信，未读在列表上看得见 |
| R-49 | 2026-11-09 | 信笺按问卷那套分段拆成两段：`#letterSeg`（`.letter-seg` + 07 的 `.seg` / `.seg-item[data-seg]`，168px 居中）——「收到」只列 `role:'peer'` 的信，「发出」只列 `role:'user'` 的信，各按 `createdAt` 倒序；空态两行文案随分段切换（`#emptyTitle` / `#emptySub`：收到「还没有收到信 / 写一封寄出去，对方会回你。」，发出「还没有寄出过信 / 右上角写一封，交给时间送出去。」）；新增 `setSeg(next)`，寄出成功自动落到「发出」，回信到点时 toast「收到一封回信」 | 来信和自己寄出的信不再混在一列，各自一眼看完 |
| R-50 | 2026-11-09 | 信纸改「栀子花」小清新：`.letter-paper` 从一张光纸变成一张真信纸——米白渐变底（`--paper` → `--paper-2`）、外 1px 纸线描边 + `::after` 内嵌细线框、很轻的投影，圆角 3px；右上/纸底加栀子线描 `BLOOM`（`letters.js` 内联 SVG：五瓣 + 一叶 + 枝，`.lp-bloom` 读信时居中贴纸底、写信时 `lw-paper` 缩到右下角淡显）；标题居中、字距 0.1em，正文行高 2.2 / 字距 0.04em，落款上方加一条 34px 叶绿细线（`.lp-sign::before`）；写信层内容也裹进同一张信纸（`lw-paper`）；新增变量 `--paper-2`、`--leaf`，`--paper` 由 `#FAF7EF` 提亮到 `#FCFBF3` | 信纸有纸的厚度、花的气味，和聊天页的灰白界面区分开 |
| R-51 | 2026-11-09 | 写信吸顶栏的「写给 黎深」改成**下拉选角色**：`.sheet-title` 里换 `.lt-head`（「写给」小字 + `.lt-to` 按钮：`#ltToName` 名字 + `.lt-caret` 小箭头），点开后自绘 `.lt-menu`（`.lt-opt` 行、当前角色带叶绿圆点、`max-height:262px` 可滚、点空白收起）；候选来自 `roleNames()`——按会话列表同一套排序取 `d.sessions` 的名字，原来固定的 `peerName()` 只留作默认值；选中后 `who` 变化，寄出的信 `peerName` 随之落成选中的人；`.fs-head` 在 `common.css` 加 `position: relative` 给下拉做定位基准（不影响其它页布局）；不用原生 `select` | 一封信写给谁可以自己挑，不再只能写给最近说过话的那个 |
| R-52 | 2026-11-09 | 写信下拉排除群聊：新增 `dmSessions(d)`（`params.groupEnabled && memberIds.length >= 2` 的会话视为群聊并剔除，其余按最近更新排序），`roleNames()` 与默认的 `peerName()` 都改用它——群聊不再出现在「写给」候选里，默认对象也落到最近的一对一会话；一条一对一会话都没有时仍回落「远方的人」 | 信只写给一个人，名单里不再混进群名 |
| R-53 | 2026-11-09 | 「加好友」卡片打不了字：卡片原来是半透明 + `backdrop-filter: blur(20px)`，那层模糊合成把输入框的点击吃掉了；改成实底 `var(--panel)` + 1px 线 + 投影（视觉几乎不变，不再透出背后的列表）；同时 `.cc-name input` 从 29px 的细条撑成整颗胶囊高（`width/height:100%`、`padding:0`），并给卡片挂 `mousedown` 兜底：点在 `.cc-name` / `.cc-url` / `.field` 的空白（比如胶囊上下边缘）也把焦点交给里面的输入框 | 点哪儿都能打字，不再出现「看着是个框、点进去没光标」 |
| R-54 | 2026-11-09 | 群聊资料页去掉单人形态：`isGroup()` 判群后，导航标题改「群聊资料」、名字下挂小字「群聊」，并在资料卡下新增 `.pf-members` 群成员卡——一排 46px 成员头像 + 名字，末尾一个虚线「＋ 添加」格；点「＋ 添加」开弹层（`.member-chip` 多选，候选 = 还没进群的 `d.members`），「添进去」把 id 追加进 `params.memberIds` 并回到成员卡；单聊页面完全不受影响（成员卡 `hidden`） | 群里按「成员」看人，而不是假装成一个人的名片 |
| R-55 | 2026-11-09 | 信笺补上删除：信袋卡片**长按 450ms**（位移 >8px 取消，右键也行）弹出动作层「删除这封信」；读信弹层吸顶栏右侧加「删除」按钮（与「关闭」并排，`.lt-head-acts`）；两条路径都走 `deleteLetter()`——先 `YM.ui.confirm` 二次确认（文案里带上信名），确认后从 `d.letters` 摘掉再重渲染，删完如果是在读信层里就顺手收起 | 信能寄出去，也能扔掉 |
| R-56 | 2026-11-10 | ＋ 面板里的「相册」「拍照」真接上了：**相册**开隐藏的 `input[accept="image/*,video/*" multiple]`，图片读进来等比缩到最长边 1080 转 JPEG（>240KB 自动降质再缩）、视频限 2MB，落成 `kind:'image'|'video'` 的媒体消息；**拍照**用 `input[accept="image/*" capture="environment"]` 直接调系统相机，回来同样走压缩入库。消息气泡按原图宽高比渲染（最长边 196），点图片全屏看大图，视频内嵌原生播放控件；顺手修掉一个同名函数坑：新写的 `pickImage(file)` 与已有的 `pickImage(maxBytes)`（头像 / 背景用）撞名，已改名 `pickImageFile()` | 面板里点相册能真发图了 |
| R-57 | 2026-11-10 | 桌面从四格加到六格：`index.html` 新增 `--i:4` 潮汐（弯月 + 两道潮线）、`--i:5` 共鉴（两面相照的镜面），仍是 2 列栅格（变成 3 行）；两个新入口各配一套同名三件——`pages/tide.html` + `css/tide.css` + `js/tide.js`、`pages/mirror.html` + `css/mirror.css` + `js/mirror.js`，现在都是**空态占位页**（中央线描 + 一句「还没有涨潮 / 还照不出东西」+ 一条细线），`paint()` 把 `<html data-theme>` 同步到容器 | 桌上多两个位置，内容等想清楚再填 |
| R-58 | 2026-11-10 | 「潮汐」从空态页换成**内置日历**：月视图（周一开头、7×6 共 42 格，上下月补位淡化）、`‹ 2026年11月 ›` 翻月（跨年进位）、右上圆点「回到今天」、今天一圈细方框、选中日实底反白；底部用衬线大数字显示选中日的日号，下面一行「星期X · 月相」（月相按 29.53 天朔望周期推算，锚点 2000-01-06 18:14 UTC 朔）；点日格即选，点到非本月的日期会直接翻到那个月；数据不落库，纯前端算 | 潮汐这一格终于有内容了，看完日历一眼知道今天和月相 |
| R-59 | 2026-11-10 | 潮汐日历整体收进**上半屏**：日格高从 46px 收到 42px、.tide-main 上内边距 14→12；选中日那一行（大数字 + 星期X · 月相）从 lex:1 居中改为 lex:none 紧贴日格下方，数字 44px→34px，整体在 440×680 下收在约 55% 高度，下半屏留白 | 日历不再被拉到屏幕中间，视线一次扫完 |
| R-60 | 2026-11-10 | 潮汐日历下方那块「大数字 + 星期X · 月相 + 细线」整块删掉（`#tideNum` / `#tideSub` / `.tide-date` / `.tide-num` / `.tide-sub` / `.tide-rule` 与 `moonName()` 一并清掉）；月初的头一条「日历占上半屏」仍保留——月条 + 星期 + 6 行日格结束后不再有下文，下半屏安静留白 | 日历干净收口，不再和下面的数字打架 |
| R-166 | 2026-11-12 | 聊天背景自己换：＋面板里原来没接线的「分享」换成「背景」，点开是自绘面板——预览框（带压暗遮罩与两条示例气泡）、「从相册上传」（canvas 压到 1280 长边、JPEG 0.82 后存 dataURL）、「恢复默认」、「压暗」滑杆（30%~96%）、「这个会话 / 全部会话」范围切换；写入 `sn.params.background`（本会话）或 `d.settings.chatBackground`（全部） | 用户「聊天背景上传」 |
| R-167 | 2026-11-12 | 通话页加两枚工具：**音乐**（三首纯前端合成的小曲：静夜 / 潮汐 / 旧信，WebAudio 逐音符铺开，通话页顶部出现带三根跳动竖条的曲名胶囊，可换曲或选「不放音乐」，挂断自动收掉）与**设置**（镜像开关 + 原色/暖调/冷调/柔光 四档色调，存 `d.settings.callVideo`，每次开画面自动套上） | 用户「视频通话，可接音乐。设置。」 |
| R-168 | 2026-11-12 | 聊天背景面板从 `＋` 面板搬到资料页「聊天背景」一行：`＋` 面板恢复「分享」占位（未接入），`chat.js` 里的 `openBgSheet` / `compressImage` / `currentBg` / `writeBg` 全部删除；`profile.js` 换上同一套面板（预览框、从相册上传、恢复默认、压暗滑杆、这个会话 / 全部会话），`.bgs-*` 样式整块从 `css/chat.css` 移到 `css/profile.css`；默认压暗由 88% 调到 62%（图看得见、气泡里的字照样清楚）；行尾 `#pfBgNote` 随保存刷新（无 / 已设置 / 跟随全局） | 用户「聊天背景在这儿」「不在分享」 |
| R-169 | 2026-11-12 | 撤掉通话页的「音乐」「设置」两枚工具及其全部相关实现：`js/chat.js` 里 `CALL_TRACKS` / `musicPlay` / `musicStop` / `musicTrack` / `musicChip` / `openMusicSheet` 与 `CALL_FILTERS` / `callLook` / `applyCallLook` / `saveCallLook` / `openCallSettings` 整段删除（`prepareCall()` 与 `endCall()` 里的调用一并去掉）；`pages/chat.html` 删掉曲名胶囊 `#callMusicChip` 与 `.call-tools` 两枚按钮；`css/chat.css` 删掉对应的工具行、胶囊、跳动竖条、镜像/色调、选曲行与设置面板样式；通话页恢复成状态行 + 大头像 + 静音/挂断 | 用户圈出「音乐 / 设置」两枚图标「删掉，这跟相关的功能也是」 |
| R-170 | 2026-11-12 | 背景面板加「链接直链」：输入框粘上图片地址就实时解析——420ms 防抖后先校验协议（`http(s)` / `file` / `data:image`），再用 `new Image()` 预载，加载成功立刻写库（本会话 / 全部会话照旧）并同帧刷新预览，失败把输入框与提示染成赭红写「这个链接打不开」；打开面板时已存的链接自动回填；上传、恢复默认、换范围时同步清空 / 回填 | 用户「+URL直链实时解析、预览」 |
| R-171 | 2026-11-12 | 背景不再蒙白雾：`.chat-bg` 的 `--bg-dim` 默认与 JS 里的默认压暗值都改成 0（原来 88% / 62% 的白层会把照片糊成灰雾），面板滑杆范围改成 0~80 并落在 0；存量数据一次性清零（`d.settings.bgDimV2` 标记，只跑一次，本会话与全局的 `background.dim` 都抹平）；照片清楚后日期与时间落在图上会发飘，给 `.day-sep` 与 `.msg-meta .msg-time / .msg-stamp` 加了一层很淡的白晕 | 用户「背景蒙了一层雾嘛」 |
| R-172 | 2026-11-12 | 陪伴心电图去掉边界感：`.nav-ecg` 的 `--bg` 实心底色删除（换了照片背景后那块白底在导航上像一张浮起来的小卡片，四边一道硬边），改为全透明 + 两端 15% 的 `mask-image` 渐隐，折线自然化进导航；名字过长原本靠这块白底压住尾巴，现在改成 `.chat-title .nav-title` 限 132px、过长省略 | 用户「不要明显的边界感，限制」 |
| R-165 | 2026-11-12 | 金额卡按红框收窄、状态胶囊下移：宽 276→246、内边距 32/17→22/16、圆角 18，图标盘 58→52、白山茶 34→32；`mc-state` 从卡右侧移进 `mc-body`，落在寄语下面、靠左；实测 246×126，三张卡等高、寄语不省略 | 用户「按红框框的尺寸」+ 确认「卡宽缩到红框、高度略增、状态移到寄语下面」 |
| R-164 | 2026-11-12 | 红包图标回到简约：去掉白山茶插画，改为一枚五瓣细线花（花瓣与花心留白、笔画 1px、34px），寄语恢复单行省略以免折出孤字；卡尺寸维持 276×124 | 用户「白山茶，简单优雅，简约」 |
| R-163 | 2026-11-12 | 金额卡落定为「窄高」比例（对齐用户红框）：宽 286→276、上下内边距 22→32、圆角 18→19、图标盘 54→58、白山茶 42→46px、金额与寄语间距 5→7；寄语压到 12.5px 以免「已领取」卡上出现省略号。实测 276×124，三张卡寄语均不截断 | 用户「按红框框的尺寸」 |
| R-162 | 2026-11-12 | 金额卡由「扁长条」改回正常的方块比例：宽 300→286、上下内边距 15→22、圆角 16→18，图标盘 46→54、金额 20→22、寄语 12.5→13.5、金额与寄语间距 2→5，白山茶图 34→42px；实测 286×100（原 300×78） | 用户「现在这个又长又细」 |
| R-160 | 2026-11-12 | 金额卡再放大一档：`.money-card` 宽 268→300、内边距 15/16、圆角 16，图标盘 40→46、金额 18→20、寄语 12→12.5，转账箭头 25px | 用户发图（红框圈住红包卡）+「按红框框的尺寸」 |
| R-161 | 2026-11-12 | 红包图标换成一张白山茶插画：新增 `assets/packet-camellia-small.png`（320×320，约 117KB，透明底，重瓣白花带浅灰绿阴影与淡黄花心），`MONEY_ICON.packet` 由线描 SVG 改为 `<img class="mc-flower">`，34px、`object-fit:contain`，加 `drop-shadow` 让白花在浅底上立住 | 用户发图（白山茶实物）+「白山茶按第二张的来」 |
| R-158 | 2026-11-12 | 金额卡放大：`.money-card` 宽 226→268、内边距 9/11→12/14、圆角 12→14，图标盘 34→40、金额 16→18、寄语 11→12，图标 svg 22/24 | 用户「卡片布局大一点，现在太小了」 |
| R-159 | 2026-11-12 | 红包图标改成一朵白山茶：外圈五片阔瓣、内圈三片小叶瓣错开再加一点花心，纯细线（1.25）不带叶，24px 下不糊成一团；转账的箭头同步到 22px | 用户发图（白山茶实物）+「白山茶样式，红包」 |
| R-157 | 2026-11-12 | 转账和红包统一成同一张卡：`.money-card.transfer` 并入 `.money-card.packet` 的藕粉→雾蓝渐变、半透白描边、白字与柔光图标底（转账箭头放大到 19px），两类的金额 / 寄语 / 状态胶囊同一套白字规则，深色主题也一起改 | 用户发图（栀子实物照）+「转账和红包格式一致」 |
| R-156 | 2026-11-12 | 红包左侧那枚圆盘去掉边界：`.money-card.packet .mc-ico` 的 `border-radius:50%` 底色换成径向渐隐的柔光（0.22 → 0.1 → 0），四周看不出圆边；同一枚栀子放大到 20px | 用户放大截图（图标像嵌在一枚浅圆盘上）+「不需要明显隔绝」 |
| R-155 | 2026-11-12 | 红包换成一枚水彩气质的卡：底由正红改藕粉转雾蓝的斜向渐变（`#D1B6C2` → `#C3BACF` → `#B0C0D6` → `#A9BDD5`），描边用半透白、白字，图标由信封线描换成五瓣栀子（`ellipse` 绕心旋转 72° 递增 + 中心小圆 + 两片斜叶），默认寄语改「我的思念那么深」；深色主题另给一档偏深的同色渐变 | 用户发图（藕粉／雾蓝红包卡 + 栀子花）+「红包样式，栀子花」 |
| R-154 | 2026-11-12 | 红包有了「对方收下 / 退回来」：我发出的 `packet` / `transfer` 在存的时候就带上 `moneyDueAt`（2–3.6 秒后）与 `moneyAnswer`（82% 收下、18% 退回），`tickMoney` 每秒结算，收下记 `claimed`、退回记 `refunded`；卡片状态改按发送方分：我发的显示「待领取 / 已领取 / 已退还」，TA 发的我才能点「领取」，点自己发的只提示等 TA | 用户发图（¥1314 红包卡）+「角色可接受、退还」 |
| R-154.a | 2026-11-12 | 谁发的都一样：红包放着 `24` 小时没人领就原路退回（`MONEY_EXPIRE`），`tickMoney` 里先判超期再判 TA 的态度；退回后的卡片对双方都显示「已退还」，再点只提示已退回 | 用户「长时间不收，24小时后自动退还」 |
| R-153 | 2026-11-12 | 群公告在聊天页顶部露出：`pages/chat.html` 导航下新增 `.chat-notice`（`#chatNotice` / `#chatNoticeText`），只有群聊且 `params.notice` 有内容时显示成一条（左边「群公告」、右边单行省略正文，默认 `display:none`，命中才加 `.is-on` 避免 `hidden` 被 flex 压掉）；点它跳 `profile.html?sid=` 去改 | 用户发图（群资料卡「群公告 测试」）+「公告会话里没有」 |
| R-152 | 2026-11-12 | 共鉴一格可请一位也可一次请几位：`openInvite(kind)` 由 `YM.ui.actionSheet` 单选改成自绘多选面板（`.mk-row` 一行一人、右端 `.mk-tick` 打勾，底栏「邀请（N）」，已有人陪时多一行「取消今天的陪伴」）；`d.mirror.pals[day][kind]` 放宽成字符串或数组，`palIds()` / `setPal()` 统一处理，格子小字按「、」罗列；chat.js 的 `markBuddy` 追加去重、`buddyKindOn` 兼容数组、`endBuddy` 从数组里摘人 | 用户发图（共鉴邀请面板）+「可单独，也可批量一起点击」 |
| R-151 | 2026-11-12 | 信纸换成一张压在深蓝水彩桌面上的静物：新增 `assets/paper-gardenia.jpg`（米白信纸居中、四角绕白色栀子花与深绿叶、薄翅蝴蝶、金箔碎屑、蓝缎带），`.letter-paper` 用它做底图（`cover`），正文改由内层 `.lp-sheet` 承载（半透明米白 + 内边距 56 / 46 / 80，抬头去掉横线），字色统一成纸上墨色（`#2E2C25` / `#5E5747`）；写信页同一张纸（`lw-sheet`）；`.lp-bloom` 收起 | 用户发图（深蓝水彩 + 白花 + 蝴蝶 + 金箔的信纸样张）+「信纸按照这个样式，+栀子花」 |
| R-151.e | 2026-11-12 | 信纸上的白面板改成没有边的薄雾：`.lp-sheet` / `.lw-sheet` 自身不画底，改由 `::before` 铺 `rgba(255,253,245,.78)`，再用 `mask-image: radial-gradient(closest-side …)` 把四周化开，看不出是块矩形面板；读信内边距 46 / 38 / 66、写信 72 / 72 / 54、正文框 28vh | 用户「按第一张那版来：要叠白面板。半透明。不要明显隔绝格式」 |
| R-151.d | 2026-11-12 | 信纸回到「画当底 + 叠一层半透明纸面板」：撤掉 `.letter-paper::before` 那层奶油滤镜，底图直接挂回 `.letter-paper`，纸内边距 26 / 22；`.lp-sheet` 34 / 32 / 46、径向米白 0.72 / 0.56 / 0.18，写信 `.lw-sheet` 54 / 44 / 40（0.78 / 0.6 / 0.2） | 用户发图 +「按第一张那版来：要叠白面板」（此前一度要求完全去掉面板，本次为新近选择） |
| R-151.c | 2026-11-12 | 信纸整体柔化成一层很淡的纸：底图改挂到 `.letter-paper::before`（`saturate(.55)` `brightness(1.12)` `contrast(.94)`，再叠 0.62 / 0.70 的米白纱），正文依旧是画上的纸、不再有面板边；写信页那枚线描栀子（`.lw-paper .lp-bloom`）收起 | 用户发图（整张很淡很雾的信纸）+「信纸样式不变，但整体跟这一样」 |
| R-151.b | 2026-11-12 | 信纸不再压白面板：`.lp-sheet` 去掉底色与圆角，正文直接写在画上（内边距 46 / 38 / 66）；写信页 `.lw-sheet` 收到 72 / 72 / 54、正文框高度 28vh，标题与提示都落在纸面里，落款不再碰缎带 | 用户发图（红框圈住左下角线圈本）+「红框框的不要，整体要和谐」+「按照这版，后面是背景。第二张不行」 |
| R-151.a | 2026-11-12 | 去掉底图左下角那截线圈笔记本，并把正文从「直接写在画上」改成落在一块干净的纸面（`.lp-sheet`）里，四角的花只当托底；抬头横线撤掉，落款往里收，避免字压到花与缎带 | 用户发图（红框圈住左下角线圈本）+「红框框的不要，整体要和谐」 |
| R-150 | 2026-11-12 | 信纸上的时间写全：新增 `fullStamp(ts)`（`2026年11月12日 17:20`），抬头的 `.lp-date` 与落款的 `.lp-sign` 都从 `formatMsgTime` 换成它，不再只给「17:20」 | 用户发图（落款只有「我 / 17:20」）+「年月日时间」 |
| R-149 | 2026-11-12 | 共鉴的陪伴类别由六类改为八类：新增 `game`（游戏）、`exercise`（锻炼）与两枚细线图标；网格「3 列 × 2 行」改「4 列 × 2 行」（格子 62px、图标 25px、类名 12px、列距 4），八格正好两行；`BUDDY_KIND_NAME` 与内核 `BUDDY` / `BUDDY_NAME` 同步补两类 | 用户发图（陪伴六格）+「+游戏、锻炼」 |
| R-148 | 2026-11-12 | 作息由「一次性生成、终身固定」改为会流动的状态：`ym_persona_v1` 的 `sleep` 改存 `{v, since, span}`，每 3~12 天到期时按相邻优先的转移以 70% 概率挪档、30% 原地续期；新增 `sleepOf(mid)` | 用户「不确定性，有何能前面是早睡型，后面就变成正常型。也有可能不变。模仿真人」 |
| R-147 | 2026-11-12 | 给每个角色配作息：`ym_persona_v1` 每人新增 `sleep`（early / normal / owl），时间抽样改按三张 24 小时权重表 `W_EARLY` / `HOUR_W` / `W_OWL` 各走各的曲线 | 用户「有的人就是夜猫子，晚上的概率才高呢」 |
| R-131~146 | 2026-11-12 | 补登：这一批细调原表漏记（群成员上限与成员管理、群名称与群公告、角色状态、角色主动三类与概率、作息分配等），逐条明细见 `docs/TESTING.md` 同名行 | 变更登记表此前有一段落空，先补齐索引 |
| R-130 | 2026-11-12 | 陪伴被接受后，聊天页导航右侧（置顶那一格）出现一枚心电图小框：中间实心爱心两段式跳动，左右两段心电折线持续流动；今天这位角色的陪伴还在就一直动，结束即收起 | 用户「接受陪伴，置顶框框里面心电图❤，动态。中间爱心，爱心左右是心电图折线」 |
| R-129 | 2026-11-12 | 角色发来的新消息在会话列表里有提醒：头像右上角亮一枚 8px 小圆点（`--accent`），进会话（或回到前台）即把最新角色消息时间写进 `sn.lastReadAt`，圆点随之消失 | 用户「角色发的新消息，未观看会有提醒」 |
| R-128 | 2026-11-12 | 置顶不再是「开了没变化」：会话列表里置顶的会话排到最前（原有排序保留），名字前加一枚 12px 小图钉；聊天页导航标题后也挂同一枚图钉 | 用户「这个置顶跟占位一样，打开了也没变化」 |
| R-127 | 2026-11-12 | 首页图标改横排：2 列 4 行 → **4 列 2 行**（`repeat(4,1fr)` 等宽），格子 76 → 72px、圆角 22、图标 32px，`.desk` 左右内边距 30 → 18px | 用户「图标按横排放」 |
| R-126 | 2026-11-11 | 发布朋友圈的正文与加图合到同一张卡里：`.cp-photos`（含「＋」）移进 `.cp-text-wrap`，照片格改四列一行，字数从右下角浮字改成卡内右对齐的一行 | 用户「文字和下面＋合一起」 |
| R-125 | 2026-11-11 | 共鉴六格不再挤一行：改成**三列两行**，格子回到 66px / 圆角 21 / 图标 30px，类名 12.5px、陪伴小字 11px | 用户「不用挤在一行」 |
| R-124 | 2026-11-11 | 共鉴的类别由四类改为六类：学习 / 办公 / 小说 / 视频 / 音乐 / 休息；`fun` 拆成 `novel`、`video`、`music`，`work` 名改为「办公」（key 不变，旧数据仍可用）；格子收到 58px、列宽均分，六格正好一行 | 用户「学习、办公、小说、视频、休息」+「再加一个音乐」 |
| R-123 | 2026-11-11 | 新增「我的资料」页（`pages/me.html` + `js/me.js` + `css/me.css`）：聊天里点我自己的头像进这一页，可换头像、改昵称、写签名，数据存 `d.me`；我的头像与名字随后在所有我的消息上生效 | 用户「点击我的头像，我的个人资料页」 |
| R-122 | 2026-11-11 | 陪伴邀请改成会话里的卡片：角色邀我时卡上带「接受 / 拒绝」两枚键，点完即落定；我邀角色时卡上先显「等待回应」，约 2.4 秒后由 TA 判定接受或拒绝；答应才把该格记成陪伴 | 用户「邀请卡片。接受、拒绝」 |
| R-121 | 2026-11-11 | 共鉴里点角色不再是本地直接绑定：邀请会写进 TA 的会话（一条我的邀请 + 一条 TA 的答复，答应率约 7 成），答应才把该格记成陪伴，拒绝只留一条会话记录 | 用户「点击，邀请消息发送到角色会话页面。角色可以接受、拒绝」 |
| R-120 | 2026-11-11 | 共鉴去掉日期行，四格保留「图标 + 类名」，格子功能定为模拟陪伴：点格子可邀请一位角色陪做这件事，角色也会一天一次主动发来「某某 想陪你」，应答后那一行显示陪伴者 | 用户「时间删掉。页面：图标+文字。图标功能：模拟陪伴。用户可以邀请角色进行陪伴。角色也可以主动邀请用户」 |
| R-119 | 2026-11-11 | 共鉴只留四枚图标格：删掉类名小字、当天合计、陪伴行、记一笔与块间细线，四枚格子按首页同款并列一行，页面只剩一行日期 + 四格 | 用户「除了图标，其余全删」并选定「只留图标格，其余全删」 |
| R-118 | 2026-11-11 | 共鉴四类块头从「小图标 + 类名一行」改成首页同款类目格：46px 白圆角方块里一枚 22px 图标，底下 12px 小字类名；块头右侧的该类合计与类名底边对齐 | 用户「删掉，只要图标。跟首页一样」并选定「图标方块 + 下方小字类名」 |
| R-117 | 2026-11-11 | 四类块头前各加一枚细线图标（学习 = 笔、工作 = 公文包、娱乐 = 音符、休息 = 月牙），「记一笔」面板标题同步带同一枚，颜色取 `--text-2` | 用户「学习、工作、娱乐、休息。按图标分」 |
| R-116 | 2026-11-11 | 共鉴四类各加「陪伴」：角色会一天一次主动发来陪做某件事的邀请（可「好」可「不必」），我也可以从每块右下角「邀请」里挑一位角色；陪上之后那一行显示头像与名字，可「换一位」 | 用户「几个板块儿，角色可以主动邀请陪伴。我也可以主动邀请」 |
| R-115 | 2026-11-11 | 共鉴页从空态占位改成「学习 / 工作 / 娱乐 / 休息」四块当天记录：每块可记内容 + 时长（分钟或小时），块头显示该类合计、顶上显示当天总计，记录可删；数据存在 `d.mirror.logs[YYYY-MM-DD]` | 用户「学习、工作、娱乐、休息」 |
| R-114 | 2026-11-11 | 日程分段选中的日子从「整格实底」改成透明底 + 25px 细圆环（`::before`），圆圈里放日期或标签图标，跟全局细线、黑灰的风格一致 | 用户「变成圆圆的框，透明，与全局协调」 |
| R-113 | 2026-11-11 | 日历格子的标签图标改成直接占用整个格子、代替日期数字（15px、居中），日历只保留「哪天有生日 / 纪念日」这一种读法；普通计划仍按小点标 | 用户「图标直接占格子」 |
| R-112 | 2026-11-11 | 日历只排到装得下本月日期的最后一行（`ceil((lead+天数)/7)` 行），月末不再多铺一行下月的灰字；本月最后一天之后用 `.is-blank` 空格子占位 | 用户「后面两行灰的」 |
| R-111 | 2026-11-11 | 日程分段的日历缩小：格子高 `clamp(28px,7.4vw,44px)` → `clamp(25px,6.4vw,40px)`，圆角 9 → 8、字号 13 → 12.5，月份条下间距 6 → 4；整块日历变矮，仍与「经期 / 睡眠」共用同一份 | 用户「日历偏大，要缩小」 |
| R-110 | 2026-11-11 | 日历格子的标签图标改成右上角小角标（9px、不透明度 0.55），日期回到正中——上一版图标跟日期并排又偏大偏深，看着像「只有图标没有日期」 | 用户「图标大了 / 6号没有6」 |
| R-109 | 2026-11-11 | 潮汐页的 `tide.css` / `tide.js` 引用后面加 `?v=108`，改完刷新就能拿到新样式，不用再手动清缓存；日历上的标签图标放大到 10px、不透明度提到 0.78 | 用户「6号日期没有6，只用图标」 |
| R-108 | 2026-11-11 | 日历格子里的标签图标改成跟日期并排（`日期 + 9px 图标`），R-107 那种「日期在上、图标在下」的竖排撤掉，免得格子矮的时候像只剩图标没有日期 | 用户「没有日期，只有图标」 |
| R-107 | 2026-11-11 | 日程分段的日历格子直接显示标签图标：那天有生日就画小蛋糕、有纪念日就画一颗心，日期在上、图标在下；R-106 收窄成胶囊的选中态一并收回，仍是整格实底 | 用户「图标在日历上显示」 |
| R-106 | 2026-11-11 | 日程分段选中的那一天不再整格铺黑底，改成数字底下压一枚 28px 实底小胶囊，日程的小点落在胶囊下方、不再被黑框框进去 | 用户「图标在框框」 |
| R-105 | 2026-11-11 | 生日 / 纪念日标签前面加一枚小图标（生日 = 插着蜡烛的实心蛋糕，纪念日 = 一颗心），添加面板的胶囊和计划行的小胶囊都用同一枚，14px、线描 1.6px、颜色跟文字 | 用户「加图标，比如生日图标」 |
| R-104 | 2026-11-11 | 生日 / 纪念日只填月、日（`MM-DD`，不带年），面板里打上标签后日期行就换成「月 / 日」两个数字框；日历上凡是当天有计划（含每年重复的）都画一颗 4px 实心点标注 | 用户「生日，只需要用月、日。日程在日历里要标注」 |
| R-103 | 2026-11-11 | 计划的时间改成「年月日」：面板里换成日期选择（默认当前选中那天），写别的日期保存后日历自动翻过去；打上生日 / 纪念日标签的按一年一次存（`data.tide.annual`），每年到这个月日都会在日历上亮起小点、列表里标「每年」 | 用户「年月日，生日、纪念日。一年一次」 |
| R-102 | 2026-11-11 | 潮汐计划补齐内容 / 时间 / 标签三件套：右上图标点开的底部面板改成「内容 + 时间（默认 09:00）+ 标签（生日 / 纪念日）」，计划行按时刻排序并显示时刻与标签胶囊 | 用户「计划：内容、时间、标签（生日、纪念日）」 |
| R-101 | 2026-11-11 | 潮汐日程分段把「添加计划」从日历下方的文字按钮挪到右上角图标：图标点开直接给当前选中的那天写计划；原来图标上的「回到今天」让位 | 用户「添加计划移到图标里」 |
| R-100 | 2026-11-11 | 朋友圈卡片底部的可见范围整行改成可点，点眼睛弹出「谁可以看」：公开列全部角色，部分可见列被选中的几位，不给谁看列被排除的几位 | 用户「点击眼睛，可以看分组」 |
| R-99 | 2026-11-11 | 朋友圈点赞与评论的人数改成跟着可见角色数量走：N 个在册角色里挑 1~N 个点赞、1~N 个评论（此前固定 1 个赞 + 六成概率 1 条评论）；`不给谁看 / 部分可见` 时先按范围筛人，被明确排除的角色不会来 | 用户「点赞和评论按角色会话数量来，总列表 4，点赞在 1-4 里，评论也是」 |
| R-98 | 2026-11-11 | 朋友圈「提到谁 / 谁可以看」与群资料页「添加成员」的角色候选改成只认还挂在会话上的角色（`YM.membersInUse`）；卡片上的「某某 赞过」与评论也按同一口径过滤，角色反应池同样只从在册角色里挑；此前直接读 `d.members`，会话删掉后角色仍留在总表里，会继续在面板和点赞行上露面 | 用户「这是哪里来的角色 / 会话列表没有」 |
| R-97 | 2026-11-11 | 消息两侧都带头像：我自己发的消息右侧补一个「我」的 30px 圆角头像（原先只有对方一侧、且受「显示头像」开关控制），开关仍统一管两侧 | 用户「消息旁边加头像」 |
| R-96 | 2026-11-11 | 评论行可点：角色评论弹出「回复」、我自己的评论弹出「删除这条评论」；回复写成缩进的「我 回复 某某：…」，删除会连带清掉挂在这条下面的回复 | 用户「角色评论后，我也可以回复；我的评论也可以删除」 |
| R-95 | 2026-11-11 | 朋友圈加角色互动：卡片右下「赞 / 评论」两颗胶囊，角色会在发布后自行点赞、评论，我评论后角色会回一句（回复行缩进一格、行首「回复 我：」）；`m.likes` / `m.comments` / `m.reactDone` 落库 | 用户「角色可以点赞，评论。回复」 |
| R-94 | 2026-11-11 | 朋友圈卡片加删除：右上角 `.mc-more` 三点 → 动作面板「删除这条」→ 确认弹窗，确认后把该条从 `d.moments` 里过滤掉并重渲（删空自动回空态） | 用户「朋友圈删除功能」 |
| R-93 | 2026-11-11 | 朋友圈导航的返回键从 `../index.html` 改指 `sessions.html`（回第二个页面会话列表，不再回桌面） | 用户「返回，回到第二个页面」 |
| R-92 | 2026-11-11 | 修发布页「只能发文字」：`.cp-photos` 原本在没内容时被 `is-none` 整块收掉，连「＋」一起消失 → 去掉这条规则；照片 / 视频入口改成先弹「照片 / 视频」两项动作面板再触发各自隐藏选择框；新增 `#cpVideo` 与 `addVideo()`、`pickMedia()`，媒体统一成 `media:[{kind,src}]`（视频直存 dataURL、单条 2.5MB 上限，混排时与照片同走三列方格、单条时才铺 16:9），旧 `photos` 由 `mediaOf()` 兼容 | 用户「这只能发文字，图片和视频不行」 |
| R-91 | 2026-11-11 | 朋友圈从空态升级成可发布：导航右上笔形按钮 → 整屏发布页（文字 0/600、最多 9 张照片先压成 dataURL、地点直接输入、@ 角色插到光标处、可见范围「公开 / 部分可见 / 不给谁看」）；列表按时间倒排，卡片带头像 / 相对时间 / 正文（@ 名字着色）/ 照片（单张 4:3、多张三列）/ 地点与可见范围；`data.moments` 入默认数据与 `migrate()` | 用户「加功能，可以发朋友圈，文字，照片。可以添加地点。可以@，可以让谁看，谁不能看。」 |
| R-90 | 2026-11-11 | 底部双 tab 由「两枚居中标签 + 46px 间距」改成**等宽两段**：`.two-tabs` 换 `display: grid; grid-template-columns: 1fr 1fr`、去掉左右内边距，会话 / 朋友圈各占半条（实测 36–251 / 251–466，合起来正好是整条内容列）；中间加一道 18px 高的 1px 竖线，顶上补 1px 横线与 14px 模糊，选中仍是字色转深 + 14px 细线 | 用户「分两段，不留白」 |
| R-89 | 2026-11-11 | 会话列表底部加「会话 / 朋友圈」双 tab（`nav.two-tabs`，两页共用，样式落在 `common.css` 07.4.7）：选中项字色转深、底下一道 14px 细线，`margin-top: auto` + `sticky bottom` 让它钉在容器底部、聊天列表再长也不会把 tab 顶走；新增 `pages/moments.html` + `css/moments.css` + `js/moments.js` 作为第二个分页（空态：「还没有人发过 / 等谁先想起要发第一条」），两页的 tab 互相跳转、各自标 `is-on` | 用户「下面两个可切换 tab，一个是会话，一个是朋友圈」 |
| R-88 | 2026-11-11 | 桌面从六格加到八格：`index.html` 新增 `--i:6` 共时（表盘 + 四面四根短刻度）、`--i:7` 共振（中心一点 + 两侧对称弧线），仍是 2 列栅格（变成 4 行），行距与顶部留白改成随视高收缩（`clamp(22px, 4vh, 34px)` / `clamp(26px, 9vh, 110px)`）；两个新入口各配一套同名三件——`pages/sync.html` + `css/sync.css` + `js/sync.js`、`pages/resonance.html` + `css/resonance.css` + `js/resonance.js`，现在都是空态占位页（中央线描 + 一句「还没有同一刻 / 还没有回声」+ 一条细线），`paint()` 把 `<html data-theme>` 同步到容器 | 用户「加共时、共振」 |
| R-87 | 2026-11-11 | 群聊通话里接听成员的头像统一尺寸：都用 96px 圆头像横排（2~3 枚等距），大圆头像彻底收起，单聊仍是那颗 132px 大圆 | 用户「这个头像啊要一样」 |
| R-86 | 2026-11-11 | 群聊通话接通那一刻才亮出接听的成员：响铃时画面仍是群自己，接通后随机 2~3 位成员接起来，一位就一颗大圆头像、两三位就在中间排成一排 96px 头像（头像 / 首字都跟着各自的成员走） | 用户「显示群内已接听的成员头像」 |
| R-85 | 2026-11-11 | 群聊的视频通话改成「群成员接听」：从群成员里随机挑一位接这通电话，通话页的大头像与最小化小窗都换成这位成员的（没头像就落它的首字），结束后的记录卡挂在该成员名下（群里气泡上方显示是谁），接不上时文案不再说「对方暂时无人接听」 | 用户「群聊的视频通话，群成员接听」 |
| R-84 | 2026-11-11 | 投票卡补上「我」这一票的入口：每个选项前加一枚 6px 空心圆点（点圆点或整行即投票，投完变实心、该项文字转深），还没投时卡片底部留一行「点一项，投出你这一票」，右上角仍是「已投/总人数」，自己那票计入总数 | 用户问「如果是五票，那『我』投票的渠道呢」 |
| R-83 | 2026-11-11 | 潮汐日程分段右上按钮的图标由「圆环 + 深色小点」换成日历（带齿 + 一道横线 + 一个实心小点），20px 下不再像占位符；经期 / 睡眠分段仍用滑杆图标 | 用户截图指出「第一张右上角就是占位符」 |
| R-82 | 2026-11-11 | 群聊的「问卷」换成「投票」：＋ 面板按会话类型换项（单聊仍是问卷，群聊换成投票，图标换成三根竖线）；点开是底部小面板，写一句题干 + 2~4 个选项，发出去落一张投票卡（题干、选项逐行、右侧票数、底部比例细线）；点某一项就是自己那一票（可改投），群里其余成员在几秒后陆续补上票，卡片右上角显示「已投/总人数」 | 用户「群聊的问卷改成投票」 |
| R-81 | 2026-11-10 | 日历下方补上分段专属内容：日程里显示选中那天的计划（「添加计划」开 `YM.ui.input` 记一句，逐条可删，有计划的日子在日历数字下点一个小点）；经期里显示「往期经期」列表（第一条 `11月10日 – 11月14日` + `5 天`，新的在前，点一条跳到那个月）；睡眠里一行「还没有记录，目标每晚 N 小时」；数据存 `data.tide.plans` | 用户「日程可以添加计划，经期可以看往期经期时间」 |
| R-80 | 2026-11-10 | 潮汐导航右上那枚按钮改成**随分段换功能**：日程下是「回到今天」（翻回本月并选中今天），经期下换成滑杆图标、点开「经期设置」（周期长度 21–45 天、经期长度 2–10 天），睡眠下点开「睡眠设置」（目标时长 4–12 小时）；设置写 `data.tide.settings`，改了立即生效；经期还会按「周期长度」从最近一段推下一段、在日历上描一圈 24% 细线（`is-expect`）| 用户「让这个位置随 tab 换功能」 |
| R-79 | 2026-11-10 | 右上角那枚「回到今天」明确归日历：三个分段都保留、都能用，点它只翻回本月；`pick`（选中日）只在日程分段被写入，经期 / 睡眠点它不会留下任何选中痕迹，也不动 `tide.periods` | 用户指着右上角问「这个属于哪个 tab 的设置」 |
| R-78 | 2026-11-10 | 分段各画各的：今天的细方框只在经期分段出现（`mode==='period'`），单日选中实底只在日程分段出现（`mode==='plan'`），睡眠分段一格不留；经期起日改用独立的 `.is-pending`（20% 底 + 1px 内描边），不再借日程的 `pick` 上色 | 用户圈出睡眠 / 日程里 10 号那圈，说「不该在别的分段出现」 |
| R-77 | 2026-11-10 | 经期的选段与经期日标记收回到经期分段内：`render()` 只在 `mode==='period'` 时才取 `periods()` 上色，切到日程 / 睡眠时日历不显示任何经期印记（今天细圈、单日选中照旧）；数据仍存 `data.tide.periods` 不动 | 用户「经期选段只作用于经期模块儿，与日程和睡眠无关」 |
| R-76 | 2026-11-10 | 经期分段里可以点日期圈出经期：点第一下记起日（该日实底反白提示已起步），点第二下记讫日，按先后自动排正，两段日期连同中间每天铺浅底、两端再深一档；写入 `data.tide.periods = [{ start:'YYYY-MM-DD', end, createdAt }]`，存 `ym_data_v1`，一个月可记多段；点到已记的日子里则取消那一段（toast「已取消这段经期」）；切走分段时清掉未完成的起日；日程分段仍是单日点选 | 用户「经期板块，点击 10-15，选定经期」 |
| R-75 | 2026-11-10 | 三个分段改成**共用同一份日历**：删掉 `#tideViewPeriod` / `#tideViewSleep` 两个独立视图片段和 `.tide-view` / `.tide-empty` 样式，日历回到 `main` 直下、任何分段下都照常显示；切换时只移动 `is-on` 并把键写进 `.tide-app[data-tab]`（`plan` / `period` / `sleep`）再重绘 | 用户要「三个 tab 共用」 |
| R-74 | 2026-11-10 | 潮汐页顶部加「日程 / 经期 / 睡眠」三格等宽分段：日历整块收进 `#tideViewPlan`，新增 `#tideViewPeriod`、`#tideViewSleep` 两个视图片段（目前只有一行「还没有记录」空态）；新增 `.tide-tabs` / `.tide-tab` / `.tide-view` / `.tide-empty` 样式，选中态用短细线不用胶囊底；切换只在前端改 `is-on`，不落存储，回「日程」时日历状态（月份、选中日）原样保留 | 用户要求「上面加三个 tab 可切换：日程、经期、睡眠」 |
| R-73 | 2026-11-10 | 会话列表的摘要也去掉「视频通话」四个字，与聊天里的通话卡片保持一致：`js/sessions.js` 的 `lastSummary(sn)` 在 `m.kind === 'call'` 时先 `replace(/^视频通话\s*·\s*/, '')` 再输出，列表预览从「视频通话 · 对方已拒绝」变成「对方已拒绝」；存储里的 `text` 前缀不动 | 用户同时贴出列表预览与聊天卡片两处截图 |
| R-72 | 2026-11-10 | 两处改动：①聊天设置里删掉「群聊」开关 `#pGroup` 与成员 chip 容器 `#pMembers`（连同 `pGroup` 的「至少 2 名成员」拦截、chip 点击写 `memberIds` 的逻辑、`selectedMembers()` / `roleList()` 两个函数）；②个人资料页「置顶聊天」右侧的 `.pf-pill` 文字胶囊（未置顶/已置顶）换成 `common.css` 的 `.switch` 圆形滑块 `#pfPinSwitch`，`renderHero()` 改写成拨 `aria-checked`，点行内任意位置仍走 `togglePin()`；`.pf-pill` 样式删掉 | 用户对截图说「群聊也删掉，置顶按钮按照第一页，那个圆形的切换」 |
| R-71 | 2026-11-10 | 设置页「角色」整块移除：`pages/settings.html` 删掉 `section#members`（分区标题 + 「角色列表」行 + 名单 + 「添加角色」按钮），`js/settings.js` 删掉 `renderMembers()` / `addMember()` / `editMember()` / `deleteMember()` 与启动里的挂载、`ym:data` 的 `members` 分支、`#members` 滚动定位，`css/settings.css` 删掉 `.member-row` / `.member-ops` / `.member-op` / `.empty-line` 一组；顺带把字卡库空态按钮从 `settings.html#members` 改为 `sessions.html`（原文案「去会话页新建角色」） | 用户要求「整个删掉，不留角色这一块」 |
| R-70 | 2026-11-10 | 设置页「角色」卡里删掉「角色列表」下面那行小字（原「新建会话时从这里选；专属字卡挂在角色名下」），只留标题 `角色列表` + 名单 + `添加角色` 按钮；DOM 里那行 `.row-desc` 整段移除，样式文件无改动 | 用户对截图说「删掉」 |
| R-69 | 2026-11-10 | 日历整块按用户给的参照框（575×341，高宽比 0.593）收高度：`.tide-main` 去掉 `max-width` 改为横向铺满、上内边距 10→8，`.tide-bar` 下内边距 10→6，`.tide-week` 字号 11→10.5、下内边距 4→2，`.tide-cell` 高 40→`clamp(28px, 7.4vw, 44px)`、圆角 10→9、字号 13.5→13；实测 500 宽下 `blockH=287 / ratio=0.574`，440 宽下约 263 / 0.598 | 用户说「红框里是日历的尺寸」，并选定「缩到红框高度」 |
| R-68 | 2026-11-10 | 通话记录卡片去掉中间的「视频通话」四个字：`callCardHtml()` 渲染时剥掉 `视频通话 · ` 前缀，卡片只剩前面的摄像机图标和后面的时长 / 状态；存储里的 `text` 仍带前缀，会话列表预览不受影响 | 用户要求「只留前面的图标和后面的」 |
| R-67 | 2026-11-10 | 拨出结局比例改成 65:15:20：`Math.random() < 0.65` 接听、`< 0.8` 对方已拒绝、其余（20%）无人接听；无人接听仍会触发 20~45 秒后的回拨 | 用户指定六成半接、一成半拒、两成不接 |
| R-66 | 2026-11-10 | 拨出结局比例改成 5:3:2（50% 接听 / 30% 对方已拒绝 / 20% 无人接听），并新增「回拨」：我拨出去对方没接上时，20~45 秒后对方会自己打回来一层来电（`scheduleCallBack()`，页内 `callBackTimer`），可接听、可拒绝、可只让它响到 22 秒算无人接听 | 用户要求「主动拨出、对方未接 20%，会回拨」 |
| R-65 | 2026-11-10 | 来电判定从「一天一次」改成「按小时时段」：`ym_call_hour` 记录 `{slot, percent, hit, at, rang}`，每进入一个新的小时就摇一次 5%~8% 的概率，中了就在这一小时剩余时间里随机挑一分钟响，20 秒轮询只查「到点没有」；不设一天几通的上限，跨小时自动重摇；旧的 `ym_call_day` 键在首次调用时清掉 | 用户要求不限制一天只来一通 |
| R-64 | 2026-11-10 | 来电判定改成按天：新增 `ym_call_day`（`{day,percent,hit,at,rang}`），当天首次进入页面时摇一次概率（5%~8% 之间随机取值）并随机定一个分钟点，20 秒的轮询只负责「到点没有」，命中后立刻标记 `rang` 当天不再重复；聊天页与别的页面的横幅共用同一份计划 | 不再每 20 秒掷一次骰子，命中就是一天一次的「今天他打来了」 |
| R-63 | 2026-11-10 | 来电概率降到 5%、且不管在不在聊天页：内核新增 `YM.ring`（`common.js` + `common.css`），非聊天页来电话时在顶部浮一条横幅（头像 + 名字 + 「邀请你视频通话」+ 拒绝 / 接听），接听跳 `chat.html?sid=…&call=1` 进门即接通，拒绝或 22 秒不理就在该会话落一条「视频通话 · 已拒绝 / 无人接听」；我方拨出改按 5:2:3 出结局（50% 接听、20% 对方已拒绝、30% 无人接听） | 来电不再只在聊天页发生，三种状态都有确定概率 |
| R-62 | 2026-11-10 | 视频通话改成双向：角色会主动打来（`maybeIncomingCall()` 每 20s 判一次、10% 概率，仅单聊、仅前台、无通话时），来电层显示「邀请你视频通话」+ 绿色「接听」/ 红色「拒绝」两颗圆钮、头像呼吸；接听转 1s 计时的通话中，拒接落「视频通话 · 已拒绝」、响铃 22s 不理落「视频通话 · 无人接听」；我方拨出响铃 2.4s 后 72% 接通、否则落「视频通话 · 无人接听」，拨出后点「取消」落「视频通话 · 已取消」；记录角色按发起方给 `user` / `peer` | 通话从单向假接通变成有来有回的真分支 |
| R-61 | 2026-11-10 | 潮汐日历整体收小一档：内容列 max-width 从 460 收到 420（去掉左右 18px 内边距）、日格 42→40px、圆角 12→10px、数字 14→13.5px、翻月钮 36→30px（图标 22→18px）、月份 16→15px、星期行 11.5→11px；网格底部落在 584 视口的约 374px 处 | 尺寸不再占满整幅，留白更松 |
| R-37 | 2026-11-09 | 聊天设置从底部弹层改成铺满屏幕：`openSettings()` 给 `.sheet` 加 `.is-full`，结构拆成吸顶标题栏 `.fs-head`（标题 + `#pfClose`「关闭」）与滚动区 `.fs-body`；`profile.css` 新增 `.sheet.is-full`（整屏高、直角、去内边距、flex 列）与 `.fs-*`，内容列左右 16px、最宽 460 居中。其他弹层（背景 / 查找 / 分组等）仍是原来的底部弹层 | 长表单不再挤在 86vh 的小抽屉里滚，标题一直留在顶上，关掉有明确的按钮 |

> 新增功能流程：① 在本文件找到归属模块 → ② 分配下一个可用编号 → ③ 写代码 → ④ 在 §10 追加一行变更登记 → ⑤ 跑 `tools/selfcheck.py`。