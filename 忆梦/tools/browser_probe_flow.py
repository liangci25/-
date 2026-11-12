# -*- coding: utf-8 -*-
"""忆梦 · 交互流程探针：点「说话」→ 等延迟 → 检查回复是否落库并渲染。"""
import io, os, re, subprocess, tempfile

ROOT = r"E:\360MoveData\Users\Aareon\Desktop\忆梦"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(tempfile.gettempdir(), "ym_browser_probe")

FLOW = (
    '<script>setTimeout(function(){'
    'var mb=document.getElementById("btnMore");'
    'if(!mb){document.title="ERR|no more btn";return;}'
    'mb.click();'
    'setTimeout(function(){'
    'var hit=null;'
    'Array.prototype.slice.call(document.querySelectorAll(".sheet button")).forEach(function(b){'
    'if(b.textContent.trim()==="让对方说话")hit=b;});'
    'if(!hit){document.title="ERR|no speak item";return;}'
    'hit.click();'
    'setTimeout(function(){'
    'var msgs=document.querySelectorAll(".msg").length;'
    'var bs=document.querySelectorAll(".msg-bubble");'
    'var txt=bs.length?bs[bs.length-1].textContent.replace(/\\s+/g," "):"-";'
    'var all=Array.prototype.slice.call(bs,-3).map(function(b){return b.textContent.replace(/\\s+/g," ")}).join(" / ");'
    'var quotes=document.querySelectorAll(".quote").length;'
    'var reads=document.querySelectorAll(".read-mark").length;'
    'var inp=document.getElementById("inputMsg");'
    'inp.value="自动测试发送";'
    'inp.dispatchEvent(new Event("input",{bubbles:true}));'
    'document.getElementById("btnSend").click();'
    'setTimeout(function(){'
    'var bs2=document.querySelectorAll(".msg-bubble");'
    'var sent=bs2[bs2.length-1]?bs2[bs2.length-1].textContent.replace(/\\s+/g," "):"-";'
    'document.title=(window.__ymErrs.length?"ERR|"+window.__ymErrs.join(" || "):"OK")'
    '+"|msgs="+msgs+"|tail="+all+"|quote="+quotes+"|read="+reads+"|sent="+sent;'
    '},800);'
    '},8000);'
    '},600);'
    '},1200);</script>'
)

CAPTURE = (
    '<script>window.__ymErrs=[];'
    'addEventListener("error",function(e){window.__ymErrs.push(e.message+" @"+(e.filename||"")+":"+e.lineno)});'
    'addEventListener("unhandledrejection",function(e){window.__ymErrs.push("reject:"+e.reason)});'
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
            "--disable-extensions", "--user-data-dir=" + PROFILE,
            "--virtual-time-budget=12000", "--dump-dom", url]
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=120)
    dom = r.stdout or ""
    m = re.search(r"<title>(.*?)</title>", dom, re.S)
    return (m.group(1) if m else "(no title)"), dom


def main():
    html = read(os.path.join(ROOT, "pages", "chat.html"))
    html = html.replace("</head>", CAPTURE + "</head>", 1)
    html = html.replace("</body>", FLOW + "</body>", 1)
    dst = os.path.join(ROOT, "pages", "_probe_flow.html")
    write(dst, html)
    url = "file:///" + dst.replace("\\", "/") + "?sid=s_probe"
    title, _ = run(url)
    print("flow ->", title)
    os.remove(dst)


if __name__ == "__main__":
    main()
