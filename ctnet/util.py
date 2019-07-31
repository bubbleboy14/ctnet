from base64 import b64encode, b64decode
from cantools import config
from cantools.web import *

LOGALL = False
RAWDOMAIN = config.web.domain
#DOMAIN = "%s://%s"%(config.web.protocol, config.web.fulldomain or "www.%s"%(RAWDOMAIN,))
DOMAIN = "https://%s"%(config.web.fulldomain or "www.%s"%(RAWDOMAIN,),)
RCK = config.recaptcha
_c = config.scrambler
_cl = len(_c)
_chl = _cl / 2

def truncate(s):
    cutoff = s.find("<br><br>", 100)
    if cutoff == -1:
        cutoff = s.find("<br>", 100)
    if cutoff == -1 or cutoff > 400:
        return strip_html(s)[:400] + " ..."
    return s[:cutoff]

def randomString(slength):
    import random
    return ''.join([random.choice(_c[:62]) for i in range(slength)])

# TODO: probs get rid of the following crap -- it's been replaced by prod enc stuff built into ct
def flipC(c):
    i = _c.find(c)
    if i == -1:
        return c
    return _c[(i + _chl) % _cl]

def flipU(s):
    return "".join([flipC(c) for c in s])

def flipR(s):
    return flipU(s)[::-1]

def flipRStripStroke(s):
    return "".join(flipR(s).split("\\"))

def flipQ(s):
    from urllib.parse import quote
    return quote(flipR(s))

def readfile(pname):
    if pname == "favicon.ico":
        pname = os.path.join("img", pname)
    elif "tiny_mce" in pname and config.mode != "production":
        pname = pname[1:]
    else:
        pname = "%s%s"%(config.mode == "dynamic" and "html" or "html-%s"%(config.mode,), pname)
    f = open(pname, "rb")
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

setlog(log)
#setenc(lambda d : flipU(b64encode(d)))
#setdec(decode)