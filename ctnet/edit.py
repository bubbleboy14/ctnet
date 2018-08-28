from util import respond, succeed, fail, cgi_get, send_mail, clearmem, DOMAIN, RAWDOMAIN
from model import db, approvables, emailadmins, getsettings, dict2date, newcred, modcred, process_newsletter, getzip, hashpass, email_in_use, Conversation, Task, Moderation, Flag, Critique, newevent, newphoto, newnews, newref, newVideo, castvote, mediatypes, rolemap, SearchRule, Featured, Application, get_newsletter, Rideshare, OpinionIdea, PositionPaper, newGroup, Membership, emailuser, approve_message, ULog, Thought, Case, ChangeIdea, Page, Question, Branch, User, SustainableAction, Book, newPlace, Skin
from emailTemplates import email_changed, submission_approved, submission_critiqued, evidence_submitted, branch_submitted, tweet

recruitergrants = ['reporter', 'writer', 'photographer', 'videographer']
#greggrants = ['moderator', 'lawyer', 'recruiter']
MM = "Your %s has been deleted by an admin per CAN's terms of use.<br><br>Original Content: \"%s\".<br><br>Reason: \"%s\".<br><br>If you feel this deletion was in error, please let us know by email and include an explanation: admin@%s."
MMNR = "Your %s has been deleted by an admin per CAN's terms of use.<br><br>Original Content: \"%s\".<br><br>If you feel this deletion was in error, please let us know by email and include an explanation: admin@%s."

def edit(element, key, val, editor, emtype):
    putthese = []
    if key == "category":
        val = [db.KeyWrapper(urlsafe=k) for k in val]
    elif emtype == "newsletter":
        if key == "body":
            element.setBodyAndHtml(val)
            return []
        if key in ["send", "test"]:
            return []
        if key == "title":
            get_newsletter(editor, element.group, val, element.template, failonfind=True)
    elif key == "docid":
        element.docid = val
        element.makethumb()
        return []
    elif key == "apply":
        if element != editor:
            fail("You can't apply for someone else!")
        if val['role'] == "other":
            emailadmins("'other' application from %s"%(editor.fullName(),), val['statement'])
            succeed()
        a = Application()
        a.role = val['role']
        a.statement = val['statement']
        a.user = editor.key
        a.put()
        # doesn't work for some reason?
#        val['user'] = editor
#        Application(**val).put()
        succeed()
    elif key == "approve":
        if "approver" not in editor.role:
            fail("you're not authorized!")
        if emtype == "news":
            for p in db.get_multi(element.photo + element.video):
                if not p.approved:
                    p.approved = True
                    putthese.append(p)
        elif emtype == "referendum":
            elus = element.user.get()
            if "lawyer" not in elus.role:
                elus.role.append("lawyer")
                putthese.append(elus)
            s = getsettings()
            s.user_referenda.append(element.key)
            putthese.append(s)
        if emtype in ["news", "video", "referendum", "event"]:
            elus = element.user.get()
            if elus.email_notifications:
                emailuser(elus, "Content Approval",
                    submission_approved%(elus.firstName,
                        element.title, element.storylink()))
            approve_message(element)
        ul = ULog()
        ul.user = element.user
        ul.propname = emtype
        ul.newval = element.logstring()
        putthese.append(ul)
        key = "approved"
    elif key == "deleteuser":
        element.deleteaccount()
        succeed()
    elif key == "delete":
        if emtype == "group":
            if not ("admin" in editor.role or editor.mygroups().get(element.id()) == "leader"):
                fail("You're not authorized!")
            db.delete_multi(element.collection(Membership, "group", keys_only=True) + element.collection(Newsletter, "group", keys_only=True))
        elif not ("admin" in editor.role or hasattr(element, "user") and element.user == editor.key):
            fail("You're not authorized!")
        if emtype == "featured":
            srhits = SearchRule.query(SearchRule.featured == element.key).fetch(1000)
            if len(srhits) != 0:
                fail("Can't delete featured website (\"%s\") because it is being used by the following Search Rules: %s."%(element.title, ", ".join([r.name for r in srhits])))
        elif emtype == "photo":
            d = getsettings().defaultphoto
            if element.key == d:
                fail("Sorry! You can't delete the default photo. We need it to stand in for deleted photos referenced by other media.")
            related = element.collection(SustainableAction, "photo") + element.collection(Book, "photo")
            for r in related:
                r.photo = d
                r.approved = False
            db.put_multi(related)
        element.rm()
        succeed()
    elif key == "modcredential":
        succeed(modcred(val).data())
    elif key == "addcredential":
        succeed(newcred(val, element).data())
    elif key == "joingroup":
        m = Membership.query(Membership.user == editor.key,
            Membership.group == element.key).get()
        if not m:
            Membership(user=editor.key, group=element.key).put()
            succeed()
        else:
            fail("you're already a member!")
    elif key == "leavegroup":
        m = Membership.query(Membership.user == editor.key,
            Membership.group == element.key).get()
        if m:
            m.key.delete()
            succeed()
        else:
            fail("you're not a member!")
    elif key == "promotemember":
        mem = db.KeyWrapper(urlsafe=val).get()
        m = Membership.query(Membership.user == mem.key,
            Membership.group == element.key).get()
        if m:
            if m.memtype == "leader":
                fail("%s is already a leader of %s"%(mem.fullName(), element.title))
            m.memtype = "leader"
            m.put()
            succeed()
        else:
            fail("%s does not belong to %s!"%(mem.fullName(), element.title))
    elif key == "addcritique":
        if "approver" not in editor.role:
            fail("You're not authorized!")
        elus = element.user.get()
        if elus.email_notifications:
            emailuser(elus, "Content Critiqued",
                submission_critiqued%(elus.firstName,
                    element.title, DOMAIN))
        element.critiqued = True
        return [Critique(subject=element.key, critic=editor.key, comment=val)]
    elif key == "addrideshare":
        try:
            val = int(val)
            if val < 1:
                raise Exception
        except:
            fail("Capacity must be a positive integer!")
        if emtype != "event":
            fail("That's no event!")
        r = Rideshare(event=element.key, driver=editor.key, capacity=val)
        putthese.append(r)
        if editor.key not in element.attendees:
            element.attendees.append(editor.key)
            putthese.append(element)
        db.put_multi(putthese)
        succeed(r.id())
    elif key == "removepassenger":
        val = db.KeyWrapper(urlsafe=val)
        if val != editor.key:
            fail("You can't cancel someone else's ride!")
        if emtype != "rideshare":
            fail("That's no rideshare!")
        if val not in element.passengers:
            fail("You don't belong to that rideshare!")
        element.passengers.remove(val)
        return []
    elif key == "addpassenger":
        val = db.KeyWrapper(urlsafe=val)
        if val != editor.key:
            fail("You can't add someone else!")
        if emtype != "rideshare":
            fail("That's no rideshare!")
        element.passengers.append(val)
        elev = element.event.get()
        if val not in elev.attendees:
            elev.attendees.append(val)
            return [elev]
        return []
    elif key == "addvolunteer":
        val = db.KeyWrapper(urlsafe=val)
        if val != editor.key:
            fail("You can't volunteer someone else!")
        if emtype != "task":
            fail("That's no task!")
        element.volunteers.append(val)
        elev = element.event.get()
        if val not in elev.attendees:
            elev.attendees.append(val)
            return [elev]
        return []
    elif key == "addattendee":
        val = db.KeyWrapper(urlsafe=val)
        if val != editor.key:
            fail("That isn't you!")
        if emtype != "event":
            fail("That's no event!")
        element.attendees.append(val)
        return []
    elif key == "flag":
        if Flag.query(Flag.flagger == editor.key,
            Flag.flagged == element.key,
            Flag.message == val).get(keys_only=True):
            fail("You already flagged that!");
        return [Flag(flagger=editor.key, flagged=element.key, message=val)]
    elif emtype == "moderation":
        if key != "userviewed":
            fail("you can't change that!")
        if not (element.moderated == editor.key):
            fail("you're not qualified!")
    elif emtype == "comment":
        if "moderator" not in editor.role:
            fail("you're no moderator!")
        if key == "unflag":
            f = db.KeyWrapper(urlsafe=val).get()
            f.modviewed = True
            putthese.append(f)
        elif key == "deleted":
            putthese.append(Moderation(moderator=editor.key,
                moderated=element.user,
                message=MM%("comment", val, getattr(element, key), RAWDOMAIN)))
            val = True
        else:
            fail("what else is there?")
    elif emtype == "referendum":
        if key == "title":
            convo = element.conversation.get()
            convo.topic = "REFERENDUM: %s"%(val,)
            putthese.append(convo)
    elif emtype == "user":
        if key == "role":
            if "recruiter" not in editor.role:
                fail("you're no recruiter!")
            if "admin" not in editor.role:
                for v in val:
                    if v not in recruitergrants and v not in element.role:
                        fail("you're not authorized!")
            ptypes = ["reporter", "photographer", "videographer"]
            for p in ptypes:
                if p in val and p not in element.role:
                    from datetime import datetime
                    element.is_active = False
                    element.provisional_date = datetime.now()
                    break
        elif element == editor:
            if key == "qas":
                from model import securityQuestion
                for v in val:
                    putthese.append(securityQuestion(element,
                        v['question'], v['answer']))
        elif "moderator" in editor.role:
            putthese.append(Moderation(moderator=editor.key, moderated=element.key,
                message=MMNR%(key, getattr(element, key), RAWDOMAIN)))
        else:
            fail("you're no moderator!")

        # TODO: add authentication stuff here
        uauth = element.authentication.get()
        if key == "email":
            val = val.lower()
            if email_in_use(val):
                fail("A different member is already using that email address. Please choose something else.")
            uauth.set_status("email", False)
            putthese.append(uauth)
            send_mail(
                to="%s %s <%s>"%(element.firstName, element.lastName, val),
                subject="Email Authentication",
                body=email_changed%(element.firstName,
                    DOMAIN, element.id()))
        elif key == "phone":
            uauth.set_status("phone", False)
            putthese.append(uauth)
        elif key == "firstName" or key == "lastName":
            uauth.set_status("name", False)
            putthese.append(uauth)
        elif key == "address":
            uauth.set_status("address", False)
            putthese.append(uauth)
        elif key == "zipcode":
            val = getzip(val).key
        elif key == "newpass":
            key = "password"
            val = hashpass(val, element.date)
        elif key == "dob":
            val = dict2date(val)
        if key not in ["newpass", "qas"]:
            putthese.append(ULog(user=element.key, propname=key, oldval=str(getattr(element, key)), newval=str(val)))
    elif emtype == "event":
        if key == "when":
            import datetime
            ehour, eminute = [int(t) for t in val.pop('time').split(":")]
            val = datetime.datetime(int(val.pop('year', element.when.year)),
                int(val.pop('month', element.when.month)),
                int(val.pop('day', element.when.day)), ehour, eminute)
        elif key == "where":
            where = element.where.get()
            where.name = val['name']
            where.address = val['address']
            wzip = where.zipcode.get()
            if wzip.code != val['zip']:
                where.zipcode = getzip(val['zip']).key
            return [where]
        elif key == "tasks":
            for t in val:
                tk = t['key']
                if tk == "task": # save
                    putthese.append(Task(event=element.key,
                        title=t['title'], description=t['description']))
                elif tk.startswith("delete"): # delete
                    db.KeyWrapper(urlsafe=tk[6:]).delete()
                else: # edit
                    task = db.KeyWrapper(urlsafe=tk).get()
                    if task.title != t['title'] or task.description != t['description']:
                        task.title = t['title']
                        task.description = t['description']
                        putthese.append(task)
            return putthese
    elif emtype in ["book", "sustainableaction"]:
        if key == "photo":
            val = db.KeyWrapper(urlsafe=val)
            if emtype == "book":
                photo = val.get()
                photo.is_book_cover = True
                putthese.append(photo)
    try:
        setattr(element, key, val)
    except Exception, e:
        fail("element: %s. key: %s. val: %s"%(element, key, val))
    return putthese

pubedits = ["addrideshare", "addvolunteer", "addattendee"]

def notpub(d):
    for p in pubedits:
        if p in d:
            return False
    return True

def notifyapprovers(isapproved):
    if not isapproved:
        for approver in User.query(User.role == "approver",
            User.email_notifications == True).fetch(1000):
            emailuser(approver, "Content Submission", "Hey %s! Check out the participate page -- there's something new to approve! Thanks for everything you do, %s. Have a great day."%(approver.firstName, approver.firstName))

def response():
    clearmem()
    eid = cgi_get('eid')
    data = cgi_get('data')

    elkey = data.pop('key')
    if elkey in rolemap:
        if elkey == "question":
            c = Question()
            c.question = data.pop('question')
            c.category = [db.KeyWrapper(urlsafe=k) for k in data.pop('category')]
            ul = ULog()
            if eid != "anonymous":
                editor = db.KeyWrapper(urlsafe=eid)
                c.user = editor
                ul.user = editor
            c.setSearchWords()
            con = Conversation(topic=c.convoTopic())
            con.put()
            c.conversation = con.key
            ul.propname = "question"
            ul.newval = c.question
            db.put_multi([c, ul])
            succeed(c.data())
        elif elkey == "changeidea":
            c = ChangeIdea()
            c.idea = data.pop('idea')
            c.category = [db.KeyWrapper(urlsafe=k) for k in data.pop('category')]
            ul = ULog()
            if eid != "anonymous":
                editor = db.KeyWrapper(urlsafe=eid)
                c.user = editor
                ul.user = editor
            c.setSearchWords()
            con = Conversation(topic=c.convoTopic())
            con.put()
            c.conversation = con.key
            ul.propname = "change idea"
            ul.newval = c.idea
            db.put_multi([c, ul])
            succeed(c.data())
        elif elkey == "thought":
            t = Thought()
            t.thought = data.pop('body')
            t.category = [db.KeyWrapper(urlsafe=k) for k in data.pop('category')]
            ul = ULog()
            if eid != "anonymous":
                editor = db.KeyWrapper(urlsafe=eid)
                t.user = editor
                ul.user = editor
            t.setSearchWords()
            con = Conversation(topic=t.convoTopic())
            con.put()
            t.conversation = con.key
            ul.propname = "thought stream"
            ul.newval = t.thought
            db.put_multi([t, ul])
            tlz = t.tweetlinks()
            emailadmins("Tweet This?",
                tweet%(t.thought, tlz["yes"], tlz["no"]))
            succeed(t.data())
        editor = db.KeyWrapper(urlsafe=eid).get()
        if elkey == "skin":
            s = Skin()
            s.title = data.pop('title')
            s.css = data.pop('css')
            s.user = data.pop('user')
            s.font = data.pop('font')
            s.chat = data.pop('chat')
            s.chatter = data.pop('chatter')
            s.color = data.pop('color')
            s.background = data.pop('background')
            s.put()
            succeed(s.id())
        elif elkey == "place":
            p = newPlace(data)
            p.user = editor.key
            ul = ULog()
            ul.user = editor.key
            ul.propname = "place"
            ul.newval = p.name
            db.put_multi([p, ul])
            succeed(p.data())
        elif elkey == "branch":
            p = Branch()
            p.user = editor.key
            p.referendum = db.KeyWrapper(urlsafe=data.pop('referendum'))
            p.title = data.pop('title')
            p.body = data.pop('body')
            p.rationale = data.pop('rationale')
            ul = ULog()
            ul.user = editor.key
            ul.propname = "referendum branch page"
            ul.newval = p.title
            db.put_multi([p, ul])
            ref = p.referendum
            refu = ref.user.get()
            if refu.email_notifications:
                emailuser(refu, "Referendum Branch Submission",
                    branch_submitted%(refu.firstName,
                        ref.title, ref.storylink()))
            succeed(p.id())
        elif elkey == "page":
            p = Page()
            p.user = editor.key
            p.wiki = db.KeyWrapper(urlsafe=data.pop('wiki'))
            p.title = data.pop('title')
            p.body = data.pop('body')
            ul = ULog()
            ul.user = editor.key
            ul.propname = "wiki page"
            ul.newval = p.title
            db.put_multi([p, ul])
            succeed(p.id())
        elif elkey == "case":
            c = Case()
            c.user = editor.key
            c.title = data.pop('title')
            c.blurb = data.pop('blurb')
            c.category = [db.KeyWrapper(urlsafe=k) for k in data.pop('category')]
            c.setSearchWords()
            con = Conversation(topic="CASE: %s"%(c.title,))
            con.put()
            c.conversation = con.key
            ul = ULog()
            ul.user = editor.key
            ul.propname = "case proposal"
            ul.newval = c.logstring()
            db.put_multi([c, ul])
            succeed(c.id())
        elif elkey == "newsletter":
            group = 'group' in data and db.KeyWrapper(urlsafe=data.pop('group')).get() or None
            succeed(process_newsletter(editor, group, data.pop('title'), data.pop('body'), data.pop('send'), data.pop('test'), data.pop('template')))
        elif elkey == "opinion":
            p = OpinionIdea()
            p.user = editor.key
            p.title = data.pop('title')
            p.body = data.pop('body')
            p.conversation_active = data.pop('conversation_active')
            p.category = [db.KeyWrapper(urlsafe=k) for k in data.pop('category')]
            p.setSearchWords()
            c = Conversation(topic="OPINION/IDEA: %s"%(p.title,))
            c.put()
            p.conversation = c.key
            ul = ULog()
            ul.user = editor.key
            ul.propname = "opinions and ideas"
            ul.newval = p.logstring()
            db.put_multi([p, ul])
            succeed(p.id())
        elif elkey == "paper":
            p = PositionPaper()
            p.user = editor.key
            p.title = data.pop('title')
            p.body = data.pop('body')
            p.category = [db.KeyWrapper(urlsafe=k) for k in data.pop('category')]
            p.setSearchWords()
            c = Conversation(topic="POSITION PAPER: %s"%(p.title,))
            c.put()
            p.conversation = c.key
            ul = ULog()
            ul.user = editor.key
            ul.propname = "position papers"
            ul.newval = p.logstring()
            db.put_multi([p, ul])
            succeed(p.id())
        elif elkey == "refnonlawyer":
            data['user'] = editor.key
            r = newref(True, **data)
            castvote(r, editor, True)
            succeed()
        elif elkey == "group":
            succeed(newGroup(editor, **data))
        #isapproved = "greg" in editor.role
        isapproved = editor.is_active or "admin" in editor.role
        if rolemap[elkey] not in editor.role:
            fail("You're not authorized!")
        if elkey == "event":
            notifyapprovers(isapproved)
            import datetime
            ewhen = data.pop('when')
            ehour, eminute = [int(t) for t in ewhen.pop('time').split(":")]
            succeed(newevent(approved=isapproved, user=editor.key,
                category=[db.KeyWrapper(urlsafe=k) for k in data.pop('category')],
                title=data.pop('title'), description=data.pop('description'),
                where=data.pop('where'),
                when=datetime.datetime(int(ewhen.pop('year')),
                int(ewhen.pop('month')), int(ewhen.pop('day')),
                ehour, eminute), tasks=data.pop('tasks', [])).data())
        if elkey == "photo":
            notifyapprovers(isapproved)
            succeed(newphoto(approved=isapproved, user=editor.key, html=data.pop('html', None),
                photo=data.pop('photo', None), title=data.pop('title', None),
                artist=data.pop('artist', None), link=data.pop('link', None),
                category=[db.KeyWrapper(urlsafe=k) for k in data.pop('category')],
                shared=data.pop('shared')).id())
        if elkey == "news":
            notifyapprovers(isapproved)
            n = newnews(approved=isapproved, title=data.pop('title'), body=data.pop('body'),
                user=editor.key, shared=data.pop('shared'),
                photo=[db.KeyWrapper(urlsafe=k) for k in data.pop('photo', [])],
                video=[db.KeyWrapper(urlsafe=k) for k in data.pop('video', [])],
                category=[db.KeyWrapper(urlsafe=k) for k in data.pop('category', [])])
            n.put()
            succeed(n.id())
        if elkey == "referenda":
            notifyapprovers(isapproved)
            data['user'] = editor.key
            r = newref(False, **data)
            castvote(r, editor, True)
            succeed(r.id())
        if elkey == "featured":
            f = Featured(**data)
            f.put()
            succeed(f.data())
        if elkey == "rules":
            r = SearchRule(**data)
            r.put()
            succeed(r.data())
        if elkey == "settings":
            element = getsettings()
        elif elkey == "video":
            notifyapprovers(isapproved)
            data.pop("uid") # shouldn't be here... hm.
            vid = newVideo(user=editor.key, approved=isapproved,
                category=[db.KeyWrapper(urlsafe=k) for k in data.pop('category', [])],
                    **data)
            vid.put()
            succeed(vid.id())
        else:
            element = mediatypes[elkey](user=editor.key)
    else:
        editor, element = db.get_multi([db.KeyWrapper(urlsafe=eid), db.KeyWrapper(urlsafe=elkey)])
        #isapproved = "greg" in editor.role
        isapproved = (editor.is_active or "admin" in editor.role) and 'addcritique' not in data
        if element == editor:
            if "deleteaccount" in data:
                if element.password != hashpass(data.pop('password'), element.date):
                    fail("invalid password!")
                element.deleteaccount()
                succeed()
            elif ('etype' in data and data.pop("etype")) == "application":
                pass
            elif not getsettings().password_to_edit_profile:
                pass
            elif 'password' in data:
                if element.password != hashpass(data.pop('password'), element.date):
                    fail("invalid password!")
            elif "recruiter" not in element.role and "moderator" not in element.role:
                fail("you're not authorized!")
    putthese = [element]
    emtype = element.modeltype()
    if emtype in approvables and notpub(data):
        element.approved = isapproved
        notifyapprovers(isapproved)
    if "deleteuser" in data and ("admin" not in editor.role or editor.password != hashpass(data.pop('password'), editor.date)):
        fail("You're not authorized!")
    if hasattr(element, "critiqued") and element.critiqued == True:
        if element.user != editor.key:
            fail("You're not authorized!")
        element.critiqued = False
    if emtype == "case" and "evidence" in data:
        ev = db.KeyWrapper(urlsafe=data.pop("evidence"))
        if "remove" in data and ev in element.evidence:
            element.evidence.remove(ev)
        elif ev not in element.evidence:
            element.evidence.append(ev)
            u = element.user.get()
            if u.email_notifications:
                emailuser(u, "Evidence Submission",
                    evidence_submitted%(u.firstName,
                        element.title, element.storylink()))
    if emtype == "page":
        if data.pop('wiki') != element.wiki.id():
            fail("Wrong wiki! What?")
        if data.pop('revision') != element.revision:
            fail("This wiki page has changed since your last refresh. Please save your work to a text editor, refresh the page, apply your changes, and resubmit. Thanks!")
        element.revision += 1
        element.user = editor.key
    for key, val in data.items():
        putthese += edit(element, key, val, editor, emtype)
    if emtype == "newsletter" and data.get("send"):
        element.send(data.get("test"))
    element.isSearchable() and element.setSearchWords()
    db.put_multi(putthese)
    if elkey in ["event", "featured", "rules"]:
        succeed(element.data())
    succeed(element.id())

respond(response)