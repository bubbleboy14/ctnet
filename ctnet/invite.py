from util import respond, fail, cgi_get
from model import db, send_invitation, email_in_use, Invitation, invitation_message

def response():
    userkey = db.KeyWrapper(urlsafe=cgi_get('uid'))
    mtype = cgi_get('mtype', choices=["conversation", "group", "event",
        "video", "article", "referendum", "case", "opinion", "paper",
        "question", "idea", "thought", "meme"])
    key = db.KeyWrapper(urlsafe=cgi_get('key'))
    invitee = cgi_get('invitee', required=False)
    email = cgi_get('email', required=False)

    user, media = db.get_multi([userkey, key])
    inv = None
    if email:
        inv = email_in_use(email, True, True)
        if inv:
            invitee = inv.id()
            email = None
    if invitee:
        inv = inv or db.KeyWrapper(urlsafe=invitee).get()
        if media.has_user(invitee):
            fail("%s is already part of this %s!"%(inv.fullName(), mtype))
        if mtype == "conversation":
            # auto-add for conversations
            media.add_user(inv)
        else:
            # invitation message for other mtypes
            # (group, event, video, article, referendum)
            invitation_message(user, inv, media)
    elif email:
        if Invitation.query(Invitation.inviter == userkey,
            Invitation.email == email,
            Invitation.mtype == mtype,
            Invitation.mkey == key).count() != 0:
            fail("You've already invited %s to this %s!"%(email, mtype))
        i = Invitation()
        i.inviter = userkey
        i.email = email
        i.mtype = media.modeltype() # NOT mtype!
        i.mkey = key
        i.put()
    send_invitation(media, user, inv, email)

respond(response)