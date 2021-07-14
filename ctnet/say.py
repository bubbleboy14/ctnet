from util import respond, succeed, fail, cgi_get, DOMAIN, flipQ, clearmem
from model import db, send_invitation, chat_message, emailuser, getadmins, Conversation, Comment, Membership
from emailTemplates import comment_received, message_received, response_received, comment_alert

def emailCommentReceived(user, u, ctitle, storylink, content, body):
    if u and u.email_notifications:
        emailuser(u, "Comment Received",
            comment_received%(u.firstName, ctitle, body, storylink))
    chat_message(user, u, content)

def response():
    uid = db.KeyWrapper(urlsafe=cgi_get('uid'))
    cid = cgi_get('conversation')
    key = cgi_get("key", required=False)
    body = cgi_get('body', required=False)
    topic = cgi_get('topic', required=False)
    privlist = cgi_get('privlist', required=False)
    contentkey = cgi_get('contentkey', required=False)

    if key:
        comm = db.get(key)
        comm.body = body
        comm.put()
        succeed()
    if cid == "conversation":
        user = uid.get()
        privlist = [db.KeyWrapper(urlsafe=k) for k in privlist]
        if not user or uid not in privlist or len(privlist) < 2:
            fail() # bad uid or convo w/o you or w/o others
        conversation = Conversation()
        conversation.topic = topic
        conversation.privlist = privlist
        conversation.put()
        comment = Comment()
        comment.user = user.key
        comment.conversation = conversation.key
        comment.body = body
        comment.seenlist = [uid]
        comment.private = True
        comment.put()
        for invitee in db.get_multi(privlist):
            if invitee != user:
                send_invitation(conversation, user, invitee)
        succeed(conversation.id())
    user, conversation = db.get_multi([uid, db.KeyWrapper(urlsafe=cid)])
    commkey = user.comment(body, conversation)
    if contentkey:
        content = db.KeyWrapper(urlsafe=contentkey).get()
        if content:
            clearmem()
            titleanalog = content.title_analog()
            storylink = content.storylink()
            exemptuserkeys = [user.key]
            if content.modeltype() == "group":
                for u in db.get_multi([m.user for m in content.collection(Membership, "group") if m.user != user.key]):
                    emailCommentReceived(user, u, titleanalog, storylink, content, body)
                    exemptuserkeys.append(u.key)
            elif content.user and user.key != content.user:
                emailCommentReceived(user, content.user.get(), titleanalog, storylink, content, body)
                exemptuserkeys.append(content.user)
            for u in db.get_multi(list(set([c.user for c in conversation.collection(Comment, "conversation") if c.user not in exemptuserkeys]))):
                if u.email_notifications and u.key not in exemptuserkeys:
                    emailuser(u, "Response Received", response_received%(u.firstName, user.firstName, body, storylink))
                    exemptuserkeys.append(u.key)
            for u in getadmins():
                if u.email_notifications and u.key not in exemptuserkeys:
                    emailuser(u, "Comment Alert!",
                        comment_alert%(u.firstName,
                            titleanalog, storylink))
            content.setSearchWords()
            content.put()
    elif len(conversation.privlist) > 0:
        cid = flipQ(conversation.id())
        fn = user.fullName()
        for u in db.get_multi(conversation.privlist):
            if u != user and u.email_messages:
                emailuser(u, "Message from %s"%(user.firstName,),
                    message_received%(u.firstName, fn, body, DOMAIN, cid))
    succeed(commkey)

respond(response)