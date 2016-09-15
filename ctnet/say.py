from util import respond, succeed, fail, cgi_get, DOMAIN, flipQ
from model import db, send_invitation, chat_message, emailuser, getfounder, Conversation, Comment, Membership
from emailTemplates import comment_received, message_received, response_received, comment_alert

def emailCommentReceived(user, u, ctitle, storylink, content):
    if u and u.email_notifications:
        emailuser(u, "Comment Received",
            comment_received['body']%(u.firstName,
                ctitle, storylink),
            comment_received['html']%(u.firstName,
                ctitle, storylink))
    chat_message(user, u, content)

def response():
    uid = db.KeyWrapper(urlsafe=cgi_get('uid'))
    cid = cgi_get('conversation')
    body = cgi_get('body', required=False)
    topic = cgi_get('topic', required=False)
    privlist = cgi_get('privlist', required=False)
    contentkey = cgi_get('contentkey', required=False)

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
        comment.put()
        for invitee in db.get_multi(privlist):
            if invitee != user:
                send_invitation(conversation, user, invitee)
        succeed(conversation.id())
    user, conversation = db.get_multi([uid, db.KeyWrapper(urlsafe=cid)])
    user.comment(body, conversation)
    if contentkey:
        content = db.KeyWrapper(urlsafe=contentkey).get()
        if content:
            titleanalog = content.title_analog()
            storylink = content.storylink()
            exemptuserkeys = [user.key]
            if content.modeltype() == "group":
                for u in db.get_multi([m.user for m in content.collection(Membership, "group") if m.user != user.key]):
                    emailCommentReceived(user, u, titleanalog, storylink, content)
                    exemptuserkeys.append(u.key)
            elif content.user and user.key != content.user:
                emailCommentReceived(user, content.user.get(), titleanalog, storylink, content)
                exemptuserkeys.append(content.user)
            for u in db.get_multi(list(set([c.user for c in conversation.collection(Comment, "conversation") if c.user not in exemptuserkeys]))):
                if u.email_notifications:
                    emailuser(u, "Response Received",
                        response_received['body']%(u.firstName,
                            user.firstName, storylink),
                        response_received['html']%(u.firstName,
                            user.firstName, storylink))
                    exemptuserkeys.append(u.key)
            for u in map(getfounder, ["greg", "paul", "mario"]):
                if u.email_notifications and u.key not in exemptuserkeys:
                    emailuser(u, "Comment Alert!",
                        comment_alert['body']%(u.firstName,
                            titleanalog, storylink),
                        comment_alert['html']%(u.firstName,
                            titleanalog, storylink))
            content.setSearchWords()
            content.put()
    elif len(conversation.privlist) > 0:
        cid = flipQ(conversation.id())
        fn = user.fullName()
        for u in db.get_multi(conversation.privlist):
            if u != user and u.email_messages:
                emailuser(u, "Message from %s"%(user.firstName,),
                    message_received['body']%(u.firstName,
                        fn, DOMAIN, cid),
                    message_received['html']%(u.firstName,
                        fn, DOMAIN, cid))

respond(response)