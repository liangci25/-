# -*- coding: utf-8 -*-
"""抽取 HTML 中的 id/class 与各 JS 文件中的顶层函数，供 NAMING.md 与自检使用。"""
import os, re, json, io

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTMLS = ["index.html", "sessions.html", "chat.html", "cards.html", "profile.html", "settings.html"]
JSS = ["index.js", "sessions.js", "chat.js", "cards.js", "profile.js", "settings.js", "js/common.js"]


def read(p):
    with io.open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return f.read()


def html_names(path):
    txt = read(path)
    ids = sorted(set(re.findall(r'\bid="([^"]+)"', txt)))
    classes = sorted(set(
        c.strip()
        for group in re.findall(r'class="([^"]+)"', txt)
        for c in group.split()
    ))
    return {"id": ids, "class": classes}


def js_funcs(path):
    txt = read(path)
    funcs = sorted(set(re.findall(r'function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(', txt)))
    ym = sorted(set(re.findall(r'(?:YM|util|store|event|ui|theme|style|sound|reply|task|notify)\.([A-Za-z_][A-Za-z0-9_]*)\s*=\s*function', txt)))
    return {"function": funcs, "ym": ym}


def main():
    out = {"html": {}, "js": {}}
    for h in HTMLS:
        out["html"][h] = html_names(h)
    for j in JSS:
        out["js"][j] = js_funcs(j)
    print(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
