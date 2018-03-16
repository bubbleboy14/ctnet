from util import respond, succeed, fail, cgi_get, clearmem, DOMAIN, flipQ
from model import db, castvote, ratemedia, emailuser, vote_message, getMost, mediatypes
from emailTemplates import vote_received

def response():
    clearmem()
    uid = cgi_get('uid')
    key = cgi_get('key')
    opinion = cgi_get('opinion')
    cresponse = cgi_get('cresponse', required=False)
    squestion = cgi_get('squestion', required=False)
    sanswer = cgi_get('sanswer', required=False)
    returnMost = cgi_get('returnMost', required=False)

    if uid == "anonymous":
        user = uid
        target = db.KeyWrapper(urlsafe=key).get()
    else:
        user, target = db.get_multi([db.KeyWrapper(urlsafe=uid), db.KeyWrapper(urlsafe=key)])
    if not user:
        fail("invalid user!")
    if not target:
        fail("invalid target!")
    if target.modeltype() in ["referendum", "branch"]:
        castvote(target, user, opinion, cresponse, squestion, sanswer)
        u = target.user.get()
        if u.email_notifications:
            emailuser(u, "Vote Received",
                vote_received['body']%(u.firstName, target.title,
                    DOMAIN, flipQ(target.id())),
                vote_received['html']%(u.firstName, target.title,
                    DOMAIN, flipQ(target.id())))
        vote_message(target)
    elif uid != "anonymous":
        ratemedia(target, user, opinion)
    if returnMost:
        succeed(getMost(returnMost,
            mediatypes[target.modeltype()],
            user, target))

respond(response)