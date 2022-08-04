import os
from util import respond, redirect, send_text, send_file, readfile, getcached
from model import getsettings, getip

allowed = set(["404", "about", "beta", "browsers", "feed",
    "community", "home", "login", "newaccount", "news", "participate",
    "profile", "recommendations", "referenda", "search", "security",
    "video", "slider", "cases", "talk", "chat", "wiki", "stream", "map"])

def response():
    if "_escaped_fragment_" in os.environ.get("QUERY_STRING"):
        import gbot

    pi = os.environ.get("PATH_INFO")
    pname, ptype = pi[1:].split(".", 1) # shouldn't be necessary :-\

    s = getsettings()
    s.hit_count += 1
    s.put()
    getip()

    if pname == "favicon":
        send_file(readfile("favicon.ico"), "ico")

    if pname in allowed or "tiny_mce" in pname:
        data, headers = getcached(pi)
        send_text(data, ptype, headers=headers)

    redirect("/404.html")

respond(response, noLoad=True)