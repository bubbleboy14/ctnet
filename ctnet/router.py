import os
from util import respond, redirect, send_text, send_file, readfile

def response():
    if "_escaped_fragment_" in os.environ.get("QUERY_STRING"):
        import gbot

    allowed = set(["404", "about", "beta", "browsers",
        "community", "home", "login", "newaccount", "news", "participate",
        "profile", "recommendations", "referenda", "search", "security",
        "video", "slider", "cases", "talk", "chat", "wiki", "stream", "map"])

    pi = os.environ.get("PATH_INFO")
    pname, ptype = pi[1:].split(".", 1) # shouldn't be necessary :-\

    from model import getsettings, getip
    s = getsettings()
    s.hit_count += 1
    s.put()
    getip()

    if pname == "favicon":
        send_file(readfile("favicon.ico"), "ico")

    if pname in allowed or "tiny_mce" in pname:
        send_text(readfile(pi), ptype)

    redirect("/404.html")

respond(response, noLoad=True)