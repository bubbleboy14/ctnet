from model import db
import twilio
import cgi

try:
    # doing this the long way because FieldStorage is broken...
    qs = cgi.parse_qs(cgi.os.environ['QUERY_STRING'])
    uid = qs['u'][0]
    aid = qs['a'][0]

    user, attempt = db.get_multi([db.KeyWrapper(urlsafe=uid), db.KeyWrapper(urlsafe=aid)])
    r = twilio.Response()
    if not user or user.authentication.is_complete("phone") or not attempt or attempt.success or attempt.rejected:
        raise
    r.addSay("Hello %s"%(user.firstName,))
    r.addSay("Your secret code is %s"%(attempt.code,), loop=3)
    r.addSay("Goodbye")
except Exception:
    r.addSay("Error. Goodbye.")

print "Content-Type: text/xml"
print ""
print r