from util import respond, cgi_get, succeed, fail, clearmem, read_file
from model import db, newphoto, Graphic

def response():
    def basicchecks(user):
        if not user:
            fail("no user", html=True, noenc=True)
        if not data_field:
            fail("no data field submitted", html=True, noenc=True)

    clearmem()

    uid = cgi_get("uid")
    key = cgi_get("key")
    data_field = cgi_get("data")

    if key == "avatar": # user avatar
        user = db.get(uid)
        basicchecks(user)
        user.setImg(read_file(data_field))
        from model import ULog
        ul = ULog()
        ul.user = user.key
        ul.propname = "avatar"
        ul.newval = user.avatar.urlsafe()
        ul.put()
    elif key == "photograph":
        user = db.get(uid)
        basicchecks(user)
        if "photographer" not in user.role and "writer" not in user.role and "reporter" not in user.role:
            fail("you're not authorized!", html=True, noenc=True)
        g = Graphic()
        g.setBlob(read_file(data_field))
        g.note = "Photograph submitted by %s %s"%(user.firstName, user.lastName)
        g.put()
#        if key.endswith("auto"):
#            succeed(newphoto(approved="greg" in user.role, user=user,
#            html="<img src='/get?gtype=graphic&key=%s'>"%(g.key(),)).data(),
#            html=True, noenc=True)
        succeed(g.id(), html=True, noenc=True)
    elif key.startswith("auth"): # authname or authaddress
        user = db.get(uid)
        basicchecks(user)
        g = Graphic()
        g.setBlob(read_file(data_field))
        g.put()
        atype = key[4:]
        a = user.authentication.new_attempt("graphic", "%s %s %s"%(atype, user.id(), g.id()))
        g.note = a.code
        g.put()
    else: # pdfs: referenda and cases
        # let "ref" stand for "referencer" ;)
        user, ref = db.get_multi([db.KeyWrapper(urlsafe=uid), db.KeyWrapper(urlsafe=key)])
        basicchecks(user)
        if not ref:
            fail("no ref", html=True, noenc=True)
        if ref.user != user.key:
            fail("invalid credentials!", html=True, noenc=True)
        ref.setBlob(read_file(data_field))
        ref.put()
    succeed(html=True)

respond(response, failHtml=True, failNoEnc=True)