# -*- coding: utf-8 -*-
"""忆梦 · 按钮绑定抽查：点开弹层、切换开关后数据是否真的变了。"""
import io, os, re, subprocess, tempfile

ROOT = r"E:\360MoveData\Users\Aareon\Desktop\忆梦"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(tempfile.gettempdir(), "ym_browser_probe")

CAPTURE = (
    '<script>window.__ymErrs=[];'
    'function __ymRec(m){window.__ymErrs.push(m);document.title="ERR|"+window.__ymErrs.join(" || ");}'
    'addEventListener("error",function(e){__ymRec(e.message+" @"+(e.filename||"")+":"+e.lineno)});'
    'addEventListener("unhandledrejection",function(e){__ymRec("reject:"+e.reason)});'
    '</script>'
)

CARDS_ACTIONS = (
    '<script>setTimeout(function(){'
    'var r=[];'
    'document.getElementById("btnAdd").click();'
    'r.push("menu="+(document.querySelectorAll(".sheet").length>0?"Y":"N"));'
    'setTimeout(function(){'
    'var first=document.querySelector(".sheet [data-idx=\\"0\\"]");'
    'if(!first){document.title="ERR|no menu item";return;}'
    'first.click();'
    'setTimeout(function(){'
    'var ac=document.getElementById("acText");'
    'r.push("acText="+(ac?"Y":"N"));'
    'if(!ac){document.title="ERR|"+r.join(",");return;}'
    'ac.value="探针字卡";'
    'document.getElementById("acGroup");'
    'var sv=document.getElementById("acSave");'
    'if(sv)sv.click();'
    'setTimeout(function(){'
    'var rows=document.querySelectorAll(".card-row").length;'
    'r.push("rows="+rows);'
    'var seg=document.getElementById("segRoot");'
    'var items=seg.querySelectorAll(".seg-item");'
    'if(items[1])items[1].click();'
    'r.push("exclOn="+(document.getElementById("memberBar").className.indexOf("is-on")>=0?"Y":"N"));'
    'document.title=(window.__ymErrs.length?"ERR|"+window.__ymErrs.join(" || "):"OK")+"|"+r.join(",");'
    '},900);'
    '},900);'
    '},900);'
    '},1000);</script>'
)

SETTINGS_ACTIONS = (
    '<script>setTimeout(function(){'
    'var sw=document.getElementById("swShowName");'
    'var before=sw.getAttribute("aria-checked");'
    'sw.click();'
    'var after=sw.getAttribute("aria-checked");'
    'var saved=JSON.parse(localStorage.getItem("ym_data_v1")).settings.showName;'
    'var r=document.getElementById("rangeFontSize");'
    'r.value="18";r.dispatchEvent(new Event("input",{bubbles:true}));r.dispatchEvent(new Event("change",{bubbles:true}));'
    'var fs=JSON.parse(localStorage.getItem("ym_data_v1")).settings.fontSize;'
    'var fsVar=document.documentElement.style.getPropertyValue("--font-size");'
    'document.title=(window.__ymErrs.length?"ERR|"+window.__ymErrs.join(" || "):"OK")'
    '+"|sw="+before+"->"+after+"|saved="+saved+"|font="+fs+"|var="+fsVar;'
    '},1200);</script>'
)

SESSIONS_ACTIONS = (
    '<script>setTimeout(function(){'
    'var b=document.getElementById("btnNew");b.click();'
    'setTimeout(function(){'
    'var p=document.getElementById("newPanel");'
    'var open=p.className.indexOf("is-open")>=0;'
    'var items=p.querySelectorAll(".np-item").length;'
    'var fr=p.querySelector(".np-item[data-key=\\"friend\\"]");'
    'if(!fr){document.title="ERR|no friend item";return;}'
    'fr.click();'
    'setTimeout(function(){'
    'var mask=document.getElementById("createMask");'
    'var shown=!!mask&&mask.className.indexOf("hide")<0;'
    'var s=document.querySelectorAll(".sheet").length;'
    'var inp=document.querySelector("#createCard [data-act=\\"name\\"]");'
    'if(inp){inp.value="探针会话";}'
    'var cancel=document.getElementById("btnCancel");'
    'if(cancel)cancel.click();'
    'setTimeout(function(){'
    'var closed=!!mask&&mask.className.indexOf("hide")>=0;'
    'document.title="PROBE|panel="+(open?"Y":"N")+"|items="+items'
    '+"|card="+(shown?"Y":"N")+"|closed="+(closed?"Y":"N")+"|sheet="+s+"|inp="+(inp?"Y":"N")'
    '+"|cards="+document.querySelectorAll(".session-card").length;'
    '},600);'
    '},600);'
    '},600);'
    '},800);</script>'
)

CASES = [
    ("cards", "pages/cards.html", CARDS_ACTIONS, ""),
    ("settings", "pages/settings.html", SETTINGS_ACTIONS, ""),
    ("sessions", "pages/sessions.html", SESSIONS_ACTIONS, ""),
]


def read(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def run(url):
    args = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
            "--disable-extensions", "--user-data-dir=" + PROFILE,
            "--virtual-time-budget=9000", "--dump-dom", url]
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=120)
    dom = r.stdout or ""
    m = re.search(r"<title>(.*?)</title>", dom, re.S)
    return m.group(1) if m else "(no title)"


def main():
    for name, src, actions, q in CASES:
        html = read(os.path.join(ROOT, src))
        html = html.replace("</head>", CAPTURE + "</head>", 1)
        html = html.replace("</body>", actions + "</body>", 1)
        dst = os.path.join(ROOT, os.path.dirname(src), "_probe_ui_" + name + ".html")
        write(dst, html)
        print(name, "->", run("file:///" + dst.replace("\\", "/") + q))
        os.remove(dst)


if __name__ == "__main__":
    main()
