from util import respond, fail, cgi_get, DOMAIN
from model import db
import twilio

API_VERSION = "2008-08-01"
ACCOUNT_SID = "ACa8a834bde745113620f6e85322e0e8eb"
AUTH_TOKEN = "7fd304532b4b4778cacc267f6d0eaa3b"
CALLER_ID = "9258202562" # taken from truecan.com

def response():
    uid = cgi_get('uid')
    num = cgi_get('num')

    user = db.KeyWrapper(urlsafe=uid).get()
    if not user:
        fail("invalid user")
    if user.authentication.is_complete("phone"):
        fail("already authenticated")
    attempt = user.authentication.new_attempt("phone", num)
    if num != user.phone:
        user.phone = num
        user.put()
    account = twilio.Account(ACCOUNT_SID, AUTH_TOKEN)
    account.request('/%s/Accounts/%s/Calls'%(API_VERSION, ACCOUNT_SID),
        'POST', {
            'Caller': CALLER_ID,
            'Called': num,
            'Url': '%s/_pa?u=%s&a=%s'%(DOMAIN, uid, str(attempt.key())),
    })

respond(response)