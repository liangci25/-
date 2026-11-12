# -*- coding: utf-8 -*-
"""忆梦 · ＋ 面板与建群链路探针
1) 会话页 ＋ → 面板两项 → 点「创建群聊」，角色不足 2 个时提示并转到「加好友」
2) 建两个好友会话（各自角色）
3) 再点「创建群聊」，选两个角色 → 建群 → 落到聊天页
4) 回读 localStorage，确认群参数
"""
import io, os, re, subprocess, tempfile, shutil

ROOT = r"E:\360MoveData\Users\Aareon\Desktop\忆梦"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(tempfile.gettempdir(), "ym_probe_group")

CAPTURE = (
    '<script>window.__ymErrs=[];'
    'function __ymRec(m){window.__ymErrs.push(m);document.title="ERR|"+window.__ymErrs.join(" || ");}'
    'addEventListener("error",function(e){__ymRec(e.message+" @"+(e.filename||"")+":"+e.lineno)});'
    'addEventListener("unhandledrejection",function(e){__ymRec("reject:"+e.reason)});'
    '</script>'
)


def read(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def run(url):
    args = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
            "--disable-extensions", "--window-size=480,900",
            "--user-data-dir=" + PROFILE,
            "--virtual-time-budget=9000", "--dump-dom", url]
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=120)
    m = re.search(r"<title>(.*?)</title>", r.stdout or "", re.S)
    return m.group(1) if m else "(no title)"


def probe(name, src, script):
    html = read(os.path.join(ROOT, src))
    html = html.replace("</head>", CAPTURE + "</head>", 1)
    html = html.replace("</body>", script + "</body>", 1)
    dst = os.path.join(ROOT, os.path.dirname(src), "_probe_g_" + name + ".html")
    write(dst, html)
    try:
        return run("file:///" + dst.replace("\\", "/"))
    finally:
        os.remove(dst)


def open_panel(extra):
    """点 ＋ 打开面板；extra 在面板展开后执行。"""
    return (
        '<script>setTimeout(function(){'
        'var b=document.getElementById("btnNew");if(!b){document.title="ERR|no btnNew";return;}'
        'b.click();'
        'setTimeout(function(){'
        'var p=document.getElementById("newPanel");'
        'var open=p.className.indexOf("is-open")>=0;'
        'var n=p.querySelectorAll(".np-item").length;'
        'var h=p.getBoundingClientRect().height;'
        'if(!open||n!==2){document.title="ERR|panel open="+open+" items="+n;return;}'
        'window.__panel="ok|items="+n+"|h="+Math.round(h);'
        + extra +
        '},600);'
        '},800);</script>'
    )


# 点「创建群聊」，角色不足时应给出提示并弹出「加好友」弹窗
GROUP_SHORT = open_panel(
    'p.querySelector(".np-item[data-key=\\"group\\"]").click();'
    'setTimeout(function(){'
    'var t=document.querySelector(".toast");'
    'var toast=t?t.textContent:"";'
    'var gm=document.getElementById("groupMask");'
    'var cm=document.getElementById("createMask");'
    'var gShown=!!gm&&gm.className.indexOf("hide")<0;'
    'var cShown=!!cm&&cm.className.indexOf("hide")<0;'
    'var inp=document.querySelector("#createCard [data-act=\\"name\\"]");'
    'if(inp){inp.value="阿一";document.getElementById("btnCreate").click();}'
    'setTimeout(function(){document.title="PROBE|"+window.__panel+"|toast="+toast'
    '+"|group="+gShown+"|friend="+cShown},700);'
    '},700);'
)

ADD_FRIEND = open_panel(
    'p.querySelector(".np-item[data-key=\\"friend\\"]").click();'
    'setTimeout(function(){'
    'var inp=document.querySelector("#createCard [data-act=\\"name\\"]");'
    'if(!inp){document.title="ERR|no name row";return;}'
    'inp.value="__NAME__";document.getElementById("btnCreate").click();'
    '},700);'
)

# 建群：选两个角色 → 创建
GROUP_MAKE = open_panel(
    'p.querySelector(".np-item[data-key=\\"group\\"]").click();'
    'setTimeout(function(){'
    'var g=document.getElementById("pickGrid");'
    'if(!g){document.title="ERR|no pickGrid";return;}'
    'var chips=g.querySelectorAll(".pick-chip");'
    'chips[0].click();chips[1].click();'
    'document.getElementById("groupName").value="探针群";'
    'document.getElementById("btnGroupOk").click();'
    '},700);'
)

READER = (
    '<script>setTimeout(function(){'
    'var d=JSON.parse(localStorage.getItem("ym_data_v1"));'
    'var sn=d.sessions[d.sessions.length-1];'
    'var p=sn.params||{};'
    'document.title="PROBE|sessions="+d.sessions.length+"|members="+d.members.length'
    '+"|group="+(p.groupEnabled?"Y":"N")+"|ids="+(p.memberIds||[]).length'
    '+"|name="+sn.name;'
    '},300);</script>'
)
READ_DOC = "pages/_probe_g_read.html"


def main():
    if os.path.isdir(PROFILE):
        shutil.rmtree(PROFILE, ignore_errors=True)

    print("panel-short ->", probe("short", "pages/sessions.html", GROUP_SHORT))
    print("friend-1   ->", probe("f1", "pages/sessions.html",
                                  ADD_FRIEND.replace("__NAME__", "阿二")))
    print("reader-1   ->", probe("r1", READ_DOC, READER))
    print("group      ->", probe("make", "pages/sessions.html", GROUP_MAKE))
    print("reader-2   ->", probe("r2", READ_DOC, READER))

    reader = os.path.join(ROOT, "pages", "_probe_g_read.html")
    if os.path.exists(reader):
        os.remove(reader)


if __name__ == "__main__":
    write(os.path.join(ROOT, "pages", "_probe_g_read.html"),
          '<!DOCTYPE html><html><head><meta charset="utf-8"><title>r</title></head>'
          '<body><script src="../js/common.js"></script></body></html>')
    main()
