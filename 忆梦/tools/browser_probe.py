# -*- coding: utf-8 -*-
"""忆梦 · 真实浏览器探针
用无头 Chrome 打开各页面，注入错误捕获，读取运行后的 <title> 与页面文本。
"""
import io, os, re, shutil, subprocess, sys, tempfile

ROOT = r"E:\360MoveData\Users\Aareon\Desktop\忆梦"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
PROFILE = os.path.join(tempfile.gettempdir(), "ym_browser_probe")

CAPTURE = (
    '<script>window.__ymErrs=[];'
    'addEventListener("error",function(e){window.__ymErrs.push(e.message+" @"+(e.filename||"")+":"+e.lineno)});'
    'addEventListener("unhandledrejection",function(e){window.__ymErrs.push("reject:"+e.reason)});'
    '</script>'
)

REPORT = (
    '<script>setTimeout(function(){'
    'var t=(window.__ymErrs&&window.__ymErrs.length)?"ERR|"+window.__ymErrs.join(" || "):"OK";'
    'document.title=t+"|"+document.body.innerText.replace(/\\s+/g," ").slice(0,220);'
    '},1500);</script>'
)

SEED = (
    '<script>'
    'window.__ymErrs=[];'
    'addEventListener("error",function(e){window.__ymErrs.push(e.message+" @"+(e.filename||"")+":"+e.lineno)});'
    'try{'
    'YM.store.update(function(d){'
    'var now=Date.now();'
    'var sid="s_probe";'
    'd.members=[{id:"m_probe",name:"阿凛",avatar:"",createdAt:now}];'
    'd.sessions=[{id:sid,name:"阿凛",avatar:"",memberId:"m_probe",createdAt:now,updatedAt:now,params:{'
    'delayMin:1,delayMax:3,replyMin:1,replyMax:3,skipChance:0,activeEnabled:false,'
    'activeMinMin:30,activeMaxMin:90,quoteEnabled:true,mergeEnabled:false,groupEnabled:false,'
    'memberIds:[],soundEnabled:null,notifyEnabled:null,typingText:null,'
    'background:{type:"inherit",value:"",dim:0.88}},messages:['
    '{id:"msg_seed1",role:"peer",text:"测试字卡一",createdAt:now-60000,readStatus:null,memberId:null,memberName:"阿凛",memberAvatar:"",quotedMessageId:null,mergedParts:null,triggerId:null},'
    '{id:"msg_seed2",role:"user",text:"你好",createdAt:now-30000,readStatus:"read",memberId:null,memberName:"",memberAvatar:"",quotedMessageId:null,mergedParts:null,triggerId:null}'
    ']},];'
    'if(!d.cardStore.general.groups.length){d.cardStore.general.groups.push({id:"g_default",name:"默认",order:0,hidden:false,cards:[]})}'
    'var g=d.cardStore.general.groups[0];'
    'g.cards=[{id:"c_p1",text:"今天有点想你。",hidden:false,order:0,createdAt:now},'
    '{id:"c_p2",text:"嗯，我在。",hidden:false,order:1,createdAt:now},'
    '{id:"c_p3",text:"你说吧，我听着。",hidden:false,order:2,createdAt:now}];'
    '}, "external");'
    'document.title="SEEDED";'
    '}catch(e){document.title="SEEDFAIL|"+e.message}'
    '</script>'
)


def read(p):
    with io.open(p, encoding="utf-8") as f:
        return f.read()


def write(p, s):
    with io.open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def make_probe(name, src, query=""):
    html = read(os.path.join(ROOT, src))
    html = html.replace("</head>", CAPTURE + "</head>", 1)
    html = html.replace("</body>", REPORT + "</body>", 1)
    dst = os.path.join(ROOT, os.path.dirname(src), "_probe_" + name + ".html")
    write(dst, html)
    return dst, query


def run(url):
    args = [CHROME, "--headless=new", "--disable-gpu", "--no-first-run",
            "--disable-extensions", "--user-data-dir=" + PROFILE,
            "--virtual-time-budget=4000", "--dump-dom", url]
    r = subprocess.run(args, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=90)
    dom = r.stdout or ""
    m = re.search(r"<title>(.*?)</title>", dom, re.S)
    return (m.group(1) if m else "(no title)"), dom


def main():
    os.makedirs(PROFILE, exist_ok=True)

    # 1) 播种数据
    seed_path = os.path.join(ROOT, "pages", "_probe_seed.html")
    seed_html = ('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">'
                 '<title>seed</title></head><body>'
                 '<script src="../js/common.js"></script>' + SEED + '</body></html>')
    write(seed_path, seed_html)
    title, _ = run("file:///" + seed_path.replace("\\", "/"))
    print("seed ->", title)

    # 2) 各页面
    pages = [
        ("index", "index.html", ""),
        ("sessions", "pages/sessions.html", ""),
        ("cards", "pages/cards.html", ""),
        ("settings", "pages/settings.html", ""),
        ("chat", "pages/chat.html", "?sid=s_probe"),
    ]
    results = []
    for name, src_page, q in pages:
        dst, _ = make_probe(name, src_page)
        url = "file:///" + dst.replace("\\", "/") + q
        title, dom = run(url)
        results.append((name, title, dom))

    print("\n===== 结果 =====")
    for name, title, dom in results:
        print("\n[" + name + "] " + title[:400])
        if "ERR|" in title:
            print("  DOM 片段:", dom[:0])

    for name, _, _ in results:
        p = os.path.join(ROOT, "pages", "_probe_" + name + ".html")
        if not os.path.exists(p):
            p = os.path.join(ROOT, "_probe_" + name + ".html")
        if os.path.exists(p):
            os.remove(p)
    if os.path.exists(seed_path):
        os.remove(seed_path)


if __name__ == "__main__":
    main()
