from util import respond, succeed, fail, cgi_get
from model import db, getsettings

s2k = ["CAN_referenda", "user_referenda", "prime_categories", "slider_rotation"]
keyprops = ["defaultavatar", "defaultgraphic", "defaultphoto", "slider_rotation"]
keyrepeats = ["CAN_referenda", "user_referenda", "prime_categories"]

def response():
    uid = cgi_get("uid", required=False)
    key = cgi_get("key", required=False)
    val = cgi_get("val", required=False)

    settings = getsettings()
    if uid:
        if "admin" not in db.KeyWrapper(urlsafe=uid).get().role:
            fail("you're not qualified!")
        if key in keyprops:
            val = db.KeyWrapper(urlsafe=val)
        if key in keyrepeats:
            val = [db.KeyWrapper(urlsafe=v) for v in val]
        if key == "slider_rotation":
            if val in settings.slider_rotation:
                settings.slider_rotation.remove(val)
            settings.slider_rotation = ([val] + settings.slider_rotation)[:9]
        else:
            setattr(settings, key, val)
        settings.put()
    elif key:
        val = getattr(settings, key)
        if key in s2k:
            val = [k.urlsafe() for k in val]
        succeed(val)
    else:
        succeed(settings.data())

respond(response)