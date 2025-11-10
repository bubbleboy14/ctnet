from urllib.parse import quote
from base64 import b64encode, b64decode
from dez.http.static import StaticStore
from cantools.web.util import strip_html, strip_punctuation, setcachedefault, text2image, text2parts
from cantools.web import *
from cantools import config

LOGALL = False
RAWDOMAIN = config.web.domain
#DOMAIN = "%s://%s"%(config.web.protocol, config.web.fulldomain or "www.%s"%(RAWDOMAIN,))
DOMAIN = "https://%s"%(config.web.fulldomain or "www.%s"%(RAWDOMAIN,),)
RCK = config.recaptcha
_c = config.scrambler
_cl = len(_c)
_chl = _cl / 2

filestore = StaticStore()

def truncate(s):
    slen = len(s)
    cutoff = s.find("<br><br>", 100)
    if cutoff == -1:
        cutoff = s.find("<br>", 100)
    if cutoff == -1 or cutoff > 400: # meh...
        cutoff = 400
        s = strip_html(s)
    s = s[:cutoff]
    if slen > cutoff:
        s += " ..."
    return s

def randomString(slength):
    import random
    return ''.join([random.choice(_c[:62]) for i in range(slength)])

# TODO: probs get rid of the following crap -- it's been replaced by prod enc stuff built into ct
def flipC(c):
    i = _c.find(c)
    if i == -1:
        return c
    return _c[int((i + _chl) % _cl)]

def flipU(s):
    return "".join([flipC(c) for c in s])

def flipR(s):
    return flipU(s)[::-1]

def flipRStripStroke(s):
    return "".join(flipR(s).split("\\"))

def flipQ(s):
    return quote(flipR(s))

htmlDir = config.mode == "dynamic" and "html" or "html-%s"%(config.mode,)

def mapfile(pname):
    if pname == "favicon.ico":
        return os.path.join("img", pname)
    elif "tiny_mce" in pname and config.mode != "production":
        return pname[1:]
    else:
        return "%s%s"%(htmlDir, pname)

def getcached(pname, req=None):
    return filestore.read(mapfile(pname),
        req or local("response").request)

def readfile(pname):
    f = open(mapfile(pname), "rb")
    d = f.read()
    f.close()
    return d

"""
def log(message, type="info", shouldEmail=True):
    import os
    from model import getip, send_email, Log
    Log(
        message=message,
        type=type,
        ip=getip().key,
        post=cgi_dump(),
        qs=os.environ.get("QUERY_STRING"),
        path=os.environ.get("PATH_INFO")
    ).put()
    shouldEmail and send_email(config.adminemail,
        "Oops! CAN Error!", message)
"""

def decode(d):
    d =  flipU(d)
    try: # will fail if someone has old version cached...
        d = b64decode(d)
    except Exception as e:
        log("incorrect padding (probably): '%s'; '%s'"%(repr(e), d),
            "handled error")
    return d

#setlog(log)
#setenc(lambda d : flipU(b64encode(d)))
#setdec(decode)
