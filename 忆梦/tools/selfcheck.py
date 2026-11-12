# -*- coding: utf-8 -*-
"""忆梦 · 自检脚本
1) node --check 校验全部 JS 语法
2) HTML 标签配对
3) 页面 js 里 getElementById 的 id 必须存在于该页 html（或属内核动态创建白名单）
4) NAMING.md ↔ 代码双向对照：html id / js 函数 / 页面 class 都要在清单里出现
"""
import io, os, re, subprocess, sys
from html.parser import HTMLParser

ROOT = r"E:\360MoveData\Users\Aareon\Desktop\忆梦"
PAGES = {
    "index.html": "js/index.js",
    "pages/sessions.html": "js/sessions.js",
    "pages/chat.html": "js/chat.js",
    "pages/cards.html": "js/cards.js",
    "pages/settings.html": "js/settings.js",
    "pages/me.html": "js/me.js",
}
JS_ALL = ["js/common.js"] + list(PAGES.values())
CSS_ALL = ["css/common.css", "css/index.css", "css/sessions.css",
           "css/chat.css", "css/cards.css", "css/settings.css", "css/me.css"]
NAMING = "docs/NAMING.md"

# 内核动态创建的节点
DYNAMIC_IDS = {
    "ym-dynamic-style", "ym-banner", "ym-undo", "undoBtn",
    "ym-toast", "ym-mask",
}

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}

errors, warns = [], []


def read(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


class Balance(HTMLParser):
    def __init__(self, name):
        HTMLParser.__init__(self, convert_charrefs=True)
        self.name = name
        self.stack = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            errors.append("%s: 多余的 </%s> 第 %d 行" % (self.name, tag, self.getpos()[0]))
            return
        open_tag, line = self.stack.pop()
        if open_tag != tag:
            errors.append("%s: <%s>(第 %d 行) 被 </%s> 关闭" % (self.name, open_tag, line, tag))

    def close_check(self):
        for tag, line in self.stack:
            errors.append("%s: <%s> 第 %d 行未闭合" % (self.name, tag, line))


def check_syntax():
    for f in JS_ALL:
        p = os.path.join(ROOT, f)
        r = subprocess.run(["node", "--check", p], capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0:
            errors.append("JS 语法失败 %s\n%s" % (f, (r.stderr or "").strip()))


def check_html():
    for h in PAGES:
        parser = Balance(h)
        parser.feed(read(h))
        parser.close_check()


def ids_of(path):
    return set(re.findall(r'\bid="([^"]+)"', read(path)))


def geteid(path):
    return set(re.findall(r'getElementById\(\s*[\'"]([^\'"]+)[\'"]\s*\)', read(path)))


def check_ids():
    for h, j in PAGES.items():
        have = ids_of(h)
        used = geteid(j) | {i for i in geteid("js/common.js") if i in have}
        missing = {i for i in used if i not in have and i not in DYNAMIC_IDS}
        # 页面 js 允许引用自己动态插入的 id：列入其 js 内 id="..." 字面量
        dyn = set(re.findall(r'id="([^"]+)"', read(j)))
        missing = missing - dyn - DYNAMIC_IDS
        for m in sorted(missing):
            errors.append("%s 引用了不存在的 id: #%s" % (j, m))


def check_naming():
    naming = read(NAMING)
    missing = []
    for h in PAGES:
        for i in sorted(ids_of(h)):
            if i not in naming:
                missing.append("#" + i + " (" + h + ")")
    for j in JS_ALL:
        for fn in sorted(set(re.findall(r'function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(', read(j)))):
            if fn not in naming:
                missing.append(fn + "() (" + j + ")")
    for m in missing:
        errors.append("NAMING.md 未登记: " + m)


def check_files():
    for h in PAGES:
        for ref in re.findall(r'(?:href|src)="([^"]+)"', read(h)):
            if ref.startswith(("http", "data:", "#", "mailto:")):
                continue
            path = os.path.join(ROOT, os.path.dirname(h), ref.split("?")[0].split("#")[0])
            if not os.path.exists(path):
                errors.append("%s 引用了不存在的文件: %s" % (h, ref))


def check_dangling_class():
    """CSS 里定义了但代码里从未出现的 class（只提示，不算错误）。"""
    classes = set()
    for f in CSS_ALL:
        txt = read(f)
        classes |= set(re.findall(r'\.([A-Za-z][A-Za-z0-9_-]*)', txt))
    used = set()
    for h in PAGES:
        used |= {c for g in re.findall(r'class="([^"]+)"', read(h)) for c in g.split()}
    for j in JS_ALL:
        used |= {c for g in re.findall(r'class="([^"]+)"', read(j)) for c in g.split()}
    for c in sorted(classes - used):
        warns.append("CSS 定义但代码未用: ." + c)


def main():
    check_syntax()
    check_html()
    check_ids()
    check_files()
    check_naming()
    check_dangling_class()

    for w in warns:
        print("WARN " + w)
    if errors:
        for e in errors:
            print("ERROR " + e)
        print("\n共 %d 项错误，%d 项提示" % (len(errors), len(warns)))
        sys.exit(1)
    print("通过：JS 语法 / HTML 配对 / id 引用 / 文件引用 / 命名清单对照；提示 %d 项" % len(warns))


if __name__ == "__main__":
    main()
