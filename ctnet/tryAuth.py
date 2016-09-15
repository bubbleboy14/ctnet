from util import respond, fail, cgi_get
from model import db

def response():
    uid = cgi_get('uid')
    code = cgi_get('code')

    user = db.KeyWrapper(urlsafe=uid).get()
    if not user:
        fail("invalid user")
    user.authentication.try_code(code)

respond(response)