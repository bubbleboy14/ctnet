from util import respond, fail, cgi_get, randomString
from model import User, hashpass, emailuser
from emailTemplates import reset_password

def response():
    email = cgi_get('email').lower()

    user = User.query(User.email == email).get()
    if not user:
        fail()
    pw = randomString(10)
    user.password = hashpass(pw, user.date)
    user.put()
    emailuser(user, "Password Reset",
        reset_password['body']%(user.firstName, pw),
        reset_password['html']%(user.firstName, pw))

respond(response)