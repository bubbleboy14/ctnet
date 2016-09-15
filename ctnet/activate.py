import cgi
from cantools import config
from util import respond, redirect
from model import db, User, Invitation, invitation_message

def response():
    form = cgi.FieldStorage()
    key = form.getvalue('u').strip()

    txt, user = None, None
    preuser = db.KeyWrapper(urlsafe=key).get()
    isnew = False
    if preuser:
        if preuser.modeltype() == "userbase":
            user = User()
            user.migrate_userdata(preuser)
            user.defaults()
            preuser.key.delete()
            txt = "your account is activated"
            isnew = True
        elif preuser.modeltype() == "user":
            user = preuser
            txt = "your email address is confirmed"
    if not user:
        redirect("/login.html", "You've already activated your account! If you're having trouble logging in, please contact the administrator at %s."%(config.contact,))
    user.authentication.get().set_status("email")
    user.put()
    if isnew:
        for invitation in Invitation.query(Invitation.email == user.email).fetch(1000):
            media = invitation.mkey.get()
            if invitation.mtype == "conversation":
                media.add_user(user)
            else:
                invitation_message(invitation.inviter.get(), user, media)
        from util import DOMAIN
        from model import emailuser
        from emailTemplates import account_activated
        emailuser(user, "Account Activated",
            account_activated['body']%(user.firstName, DOMAIN),
            account_activated['html']%(user.firstName, DOMAIN))
    redirect("/login.html", "success! %s! now login!"%(txt,))

respond(response, failMsg="account activation failed", failHtml=True, noLoad=True)