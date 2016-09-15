from util import respond, succeed, fail, cgi_get, log
from model import hashpass, User, SecurityQuestion

def response():
    email = cgi_get('email').lower()
    password = cgi_get('password')

    user = User.query().filter(User.email == email).get()
    if not user or user.password != hashpass(password, user.date):
        if user:
            log('login failure - wrong password. email: "%s". submitted password: "%s"'%(email, password), shouldEmail=False)
        else:
            log('login failure - no such user. email: "%s". submitted password: "%s"'%(email, password), shouldEmail=False)
        fail()
    succeed({"key": user.id(), "isadmin": user.isadmin(),
        "firstName": user.firstName, "lastName": user.lastName,
        "issecure": bool(user.collection(SecurityQuestion, "user", False).count()),
        "site_wide_chat": user.site_wide_chat})

respond(response)