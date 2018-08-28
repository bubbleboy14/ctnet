from cantools import config
from ctmodel import *

setzipdomain(config.zipdomain)

def _lensort(a, b):
    return len(b) - len(a)

class Searchable(object):
    def string2words(self, searchstring):
        from util import strip_html, strip_punctuation
        if hasattr(self, "conversation") and self.conversation:
            searchstring += " " + self.conversation.get().search_string()
        words = [w for w in set(strip_punctuation(strip_html(searchstring)).lower().split(" ")) if len(w) > 2 and len(w) < 20]
        words.sort(cmp=_lensort)
        return words[:500]

    def setSearchWords(self):
        self.searchwords = self.string2words(self.title)

    def dateProp(self):
        return self.date

approvables = ["video", "photo", "event", "news",
    "referenda", "quote", "book", "sustainableaction"]

class Approvable(object):
    # collections (checked): critiques

    def dataWithCritiques(self):
        d = self.data()
        if self.critiqued:
            d['critiques'] = self.collection(Critique, "subject", data=True)
            d['critiques'].reverse()
        else:
            d['critiques'] = []
        return d

class CANModel(ModelBase):
    created = db.DateTime(auto_now_add=True)
    modified = db.DateTime(auto_now=True)

    def convoTopic(self):
        return self.title

    def isSearchable(self):
        return hasattr(self, 'searchwords')

    def has_user(self, some_user_key):
        return False

    def title_analog(self):
        return self.title

    def modelpage(self):
        return self.modeltype()

    def mindata(self, user=None):
        d = {"key": self.id()}
        if hasattr(self, "title"):
            d['title'] = self.title
        return d

class CategoriedModelBase(CANModel):
    # DONE: STRING2KEY conversion!
    category = db.ForeignKey(kind="category", repeated=True) # cat ids
    date = db.DateTime(auto_now_add=True)

    def addcategory(self, category):
        if category.key not in self.category:
            self.category.append(category.key)

    def removecategory(self, category):
        if category.key in self.category:
            self.category.remove(category.key)

    def data(self):
        datadict = {
            "key": self.id(),
            "category": [k.urlsafe() for k in self.category if k]
        }
        c = self.__class__
        fz = []
        while c != CategoriedModelBase:
            hasattr(c, 'mydata') and fz.append(c.mydata)
            c = c.__base__
        fz.reverse()
        for f in fz:
            datadict.update(f(self))
        return datadict

class Featured(CANModel):
    title = db.String()
    blurb = db.String()
    link = db.String()

    def data(self):
        return { "key": self.id(),
                 "title": self.title,
                 "blurb": self.blurb,
                 "link": self.link }

class SearchRule(CANModel):
    name = db.String()
    type = db.String() # eco or liberty
    keyword = db.String(repeated=True)
    insert = db.String(repeated=True)
    # DONE: STRING2KEY conversion!
    featured = db.ForeignKey(repeated=True) # list of featured keys

    def data(self):
        return { "key": self.id(),
                 "name": self.name,
                 "type": self.type,
                 "keyword": self.keyword,
                 "insert": self.insert,
                 "featured": [k.urlsafe() for k in self.featured] }

class Graphic(CANModel):
    img = db.Binary()
    # DONE: STRING2KEY conversion!
    note = db.String()

    def getBlob(self):
        return self.img and self.img.get()

    def setBlob(self, data=None):
        self.img = data

    def setImg(self, data, size=[100, 100]):
        from io import BytesIO
        from PIL import Image
        out = BytesIO()
        img = Image.open(BytesIO(data))
        img.thumbnail(size)
        img.save(out, "png")
        self.setBlob(out.getvalue())
        self.put()

SIZEMAP = {
    "profile": [100, 100],
    "chat":    [50, 50]
}

class Avatar(CANModel):
    profile = db.ForeignKey(kind=Graphic)
    chat = db.ForeignKey(kind=Graphic)

    def rm(self):
        if self._has_complete_key():
            if self.profile:
                self.profile.delete()
            if self.chat:
                self.chat.delete()
            ModelBase.rm(self)

    def setSize(self, data, size, force=False):
        if force and getattr(self, size):
            getattr(self, size).delete()
            setattr(self, size, None)
        if not getattr(self, size):
            graphic = Graphic()
            graphic.setImg(data, SIZEMAP[size])
            setattr(self, size, graphic.key)

    def setImg(self, data=None, force=False):
        if not data:
            data = (self.profile and self.profile.get().img) or (self.chat and self.chat.get().img) or None
        if not data:
            from util import fail
            fail("no image data existing or submitted")
        self.setSize(data, "profile", force=force)
        self.setSize(data, "chat", force=force)
        self.put()

AUTH_ATTEMPT_LIMIT = 10
AUTH_CODES = {
    "phone": 1,
    "email": 2,
    "name": 4,
    "address": 8
#    "postcard": 16,
#    "yellowpages": 32,
#    ...
}

class Authentication(ModelBase):
    status = db.Integer(default=0)
    # collections (checked): attempts

    def fail(self, msg):
        from util import fail
        fail(msg)

    def full_status(self, aslist=True):
        if hasattr(self, "myfullstatus"):
            return self.myfullstatus
        if aslist:
            self.myfullstatus = [k for k, v in AUTH_CODES.items() if v & self.status]
            return self.myfullstatus
        d = {}
        for key, val in AUTH_CODES:
            d[key] = val & self.status
        self.myfullstatus = d
        return d

    def attempt_status(self):
        fs, r, nor = self.full_status(), [], []
        attempts = self.collection(AuthAttempt, "auth",
            False).order(-AuthAttempt.date).fetch(1000)

        def trythis(word, a):
            if word not in fs and word not in r and word not in nor:
                if a.success or a.rejected: # confirm link
                    nor.append(word)
                else: # "attempting"
                    r.append(word)

        for a in attempts:
            if a.type == "phone":
                trythis("phone", a)
            elif a.data.startswith("name"):
                trythis("name", a)
            elif a.data.startswith("address"):
                trythis("address", a)
            else:
                from util import fail
                fail("unknown AuthAttempt. type: %s. data: %s"%(a.type, a.data))
        return r

    def is_complete(self, atype=None):
        if atype:
            return AUTH_CODES[atype] & self.status
        return self.status != 0

    def init_codes(self):
        if not hasattr(self, "codes"):
            self.codes = {}
            self.attemptcount = 0
            for attempt in self.collection(AuthAttempt, "auth"):
                self.codes[attempt.code] = attempt
                self.attemptcount += 1

    def new_attempt(self, authtype, data):
        self.init_codes()
        if self.attemptcount > AUTH_ATTEMPT_LIMIT:
            self.fail("too many auth attempts")
        import random
        code = ''.join([str(random.randint(0,9)) for i in range(5)])
        while code in self.codes:
            code = ''.join([str(random.randint(0,9)) for i in range(5)])
        ip = getip()
        ip.authCount += 1
        a = AuthAttempt()
        a.ip = ip.key
        a.code = code
        a.type = authtype
        a.data = data
        a.auth = self
        db.put_multi([a, ip])
        self.codes[code] = a
        self.attemptcount += 1
        return a

    def set_status(self, atype, settrue=True):
        c = AUTH_CODES[atype]
        if settrue:
            self.status = self.status | c
        elif self.status & c:
            self.status -= c

    def try_code(self, code, accept=True):
        self.init_codes()
        attempt = self.codes.get(code)
        if not attempt:
            self.fail("invalid authentication code")
        atype = attempt.type != "graphic" and attempt.type or attempt.data.split(" ")[0]
        self.set_status(atype, accept)
        attempt.success = accept
        if not accept:
            attempt.rejected = True
        db.put_multi([self, attempt])

class AuthAttempt(ModelBase):
    auth = db.ForeignKey(kind=Authentication)
    ip = db.ForeignKey(kind=IP)
    code = db.String()
    type = db.String()
    data = db.String()
    success = db.Boolean(default=False)
    rejected = db.Boolean(default=False)
    date = db.DateTime(auto_now_add=True)

    def datadict(self):
        if self.type != "graphic":
            from util import fail
            fail("AuthAttempt.datadict() failed. type: %s. data: %s."%(self.type, self.data))
        p, u, g = self.data.split(" ")
        return {"property": p, "user": u, "graphic": g}

role2media = {
    "lawyer": "referenda",
    "reporter": "articles",
    "writer": "writing",
    "photographer": "photographs",
    "videographer": "videos",
    "coordinator": "events"
}

class User(UserBase, Searchable):
    searchwords = db.String(repeated=True)
    authentication = db.ForeignKey(kind=Authentication)
    avatar = db.ForeignKey(kind=Avatar)
    dob = db.DateTime()
    phone = db.String(default=None)
    address = db.String(default=None)
    # DONE: STRING2KEY conversion!
    ips = db.ForeignKey(kind=IP, repeated=True)
    role = db.String(repeated=True)
    # admin, authenticator, approver, coordinator, moderator, lawyer, recruiter, reporter, writer, photographer, videographer
    email_newsletters = db.Boolean(default=True)
    email_messages = db.Boolean(default=True)
    email_notifications = db.Boolean(default=True)
    show_contact_info = db.Boolean(default=False)
    searchable_profile = db.Boolean(default=False)
    non_user_view = db.Boolean(default=False)
    site_wide_chat = db.Boolean(default=True)
    gender = db.String(default="decline")
    blurb = db.Text()
    # DONE: STRING2KEY conversion!
    websites = db.ForeignKey(kind="website", repeated=True)
    # DONE: STRING2KEY conversion!
    affiliations = db.ForeignKey(kind="affiliate", repeated=True)
    # DONE: STRING2KEY conversion!
    projects = db.ForeignKey(kind="project", repeated=True)
    # NOTE: this is a quick implementation of greg's
    # survey idea. we'll need to come up with something
    # better if greg wants to add in more questions.
    survey = db.String(repeated=True)
    survey_context = db.Text()
    is_active = db.Boolean(default=False)
    impeach_date = db.DateTime(default=None)
    provisional_date = db.DateTime(default=None)
    deleted = db.Boolean(default=False)
    # collections (checked): comments, votes, catscores, mediavotes, applications, referenda (lawyers only), articles (reporters only), writing (writers only), photographs (photographer only), videos (videographer only), events (coordinator only), critiques (approver only), security_questions, judgments, rulings (both for moderation), flaggings, flags (both for flagging), rideshares, qualifications, jobs, education, volunteering, position_papers, opinions_and_ideas, ratings, logs, groups, newsletters (admins and leaders only), invitees, msgs_sent, msgs_received, thoughts, cases, changes, questions, branches
    label = "firstName"

    def isSearchable(self):
        return True

    def mylink(self):
        from util import flipQ, DOMAIN
        return "%s/profile.html?u=%s"%(DOMAIN, flipQ(self.id()))

    def mygroups(self):
        if not hasattr(self, "_mg"):
            self._mg = {}
            for g in self.collection(Membership, "user"):
                self._mg[g.group.urlsafe()] = g.memtype
        return self._mg

    def deleteaccount(self):
        # don't set authentication to None, because that would leave the auth data floating in the db
        self.zipcode = self.dob = self.impeach_date = self.provisional_date = self.password = None
        self.email_newsletters = self.email_messages = self.email_notifications = self.is_active = self.show_contact_info = self.searchable_profile = self.non_user_view = False
        self.phone = self.address = self.blurb = self.survey_context = ""
        if self.avatar:
            self.avatar.delete()
        self.gender = "decline"
        self.survey = ["none", "none", "none", "none"]
        # websites, affiliations, projects _will be_ keys
        db.delete_multi(self.collection(Qualification, "holder",
            keys_only=True) + self.collection(Job, "employee",
            keys_only=True) + self.collection(Education, "student",
            keys_only=True) + self.collection(Volunteering, "volunteer",
            keys_only=True) + self.websites + self.affiliations + self.projects)
        self.role = self.websites = self.affiliations = self.projects = []
        self.deleted = True
        self.firstName = "Deleted"
        self.lastName = "User"
        self.put()

    def title_analog(self):
        return self.fullName()

    def age(self):
        from datetime import datetime
        n = datetime.now()
        a = n.year - self.dob.year
        if n.month < self.dob.month:
            a -= 1
        elif n.month == self.dob.month and n.day < self.dob.day:
            a -= 1
        return a

    def setImg(self, data):
        if self.avatar:
            self.avatar.delete()
        a = Avatar()
        a.setImg(data, True)
        self.avatar = a.key
        self.put()

    def isadmin(self):
        return len(self.role) and 1 or 0

    def data(self, comments=False, extended=False, role=False, judgments=False, contributions=False, credentials=False, authentication=False, messages=False, thoughts=False, changes=False, non_user_view=False, chat=False):
        d = { "key": self.id(), "firstName": self.firstName, "lastName": self.lastName }
        if chat:
            d['zipcode'] = self.zipcode and self.zipcode.get().data() or None
            d['blurb'] = self.blurb
        if extended:
            d['is_active'] = self.is_active
            d['dob'] = self.dob and {"year": self.dob.year,
                        "month": self.dob.strftime("%m"),
                        "day": self.dob.strftime("%d")} or {"year": "Year",
                        "month": "Month", "day": "Day"}
            d['age'] = self.dob and self.age() or None
            d['email'] = self.email
            d['phone'] = self.phone
            d['address'] = self.address
            d['zipcode'] = self.zipcode and self.zipcode.get().data() or None
            d['email_newsletters'] = self.email_newsletters
            d['email_messages'] = self.email_messages
            d['email_notifications'] = self.email_notifications
            d['show_contact_info'] = self.show_contact_info
            d['searchable_profile'] = self.searchable_profile
            d['non_user_view'] = self.non_user_view
            d['site_wide_chat'] = self.site_wide_chat
            d['gender'] = self.gender
            d['blurb'] = self.blurb
            d['survey'] = self.survey or ["none", "none", "none", "none"]
            d['survey_context'] = self.survey_context
            d['deleted'] = self.deleted
        if authentication and self.authentication:
            auth = self.authentication.get()
            d['authentication'] = auth.full_status()
            d['auth_attempts'] = auth.attempt_status()
        if role:
            d['role'] = self.role
        if non_user_view:
            d['non_user_view'] = self.non_user_view
        if comments:
            d['comments'] = self.collection(Comment, "user", data=True)
        if contributions:
            d['contributions'] = []
            if self.collection(Membership, "user", fetch=False).count():
                d['contributions'].append("action_groups")
            if self.collection(OpinionIdea, "user", fetch=False).count():
                d['contributions'].append("opinions_and_ideas")
            if self.collection(PositionPaper, "user", fetch=False).count():
                d['contributions'].append("position_papers")
            if self.collection(Case, "user", fetch=False).count():
                d['contributions'].append("cases")
            for role in self.role:
                mname = role2media.get(role)
                if mname:
                    if mname == "referenda":
                        if len([r for r in Referendum.query(Referendum.user == self.key, Referendum.approved == True).fetch(1000) if r.id() in acceptedRefKeys()]) > 0:
                            d['contributions'].append(mname)
                    elif mname == "writing":
                        for wmodel in [Quote, Book, SustainableAction]:
                            if wmodel.query(wmodel.approved == True, wmodel.user == self.key).count():
                                d['contributions'].append(mname)
                                break
                    elif self.collection(media2entity[mname], "user", fetch=False).filter(media2entity[mname].approved == True).count() > 0:
                        d['contributions'].append(mname)
        if judgments:
            d['judgments'] = [j.data() for j in self.collection(Moderation,
                "moderated", False).filter(Moderation.userviewed == False).fetch(1000)]
        if messages:
            d['messages'] = [m.data() for m in self.collection(Message, "recipient",
                fetch=False).order(-Message.date).filter(Message.userviewed == False).fetch(1000)]
        if thoughts:
            d['thoughts'] = [t.data() for t in self.collection(Thought,
                "user", fetch=False).order(Thought.date).fetch(1000)]
        if changes:
            d['changes'] = [c.data() for c in self.collection(ChangeIdea,
                "user", fetch=False).order(ChangeIdea.date).fetch(1000)]
        if credentials:
            d['websites'] = [c.data() for c in db.get_multi(self.websites)]
            d['affiliations'] = [c.data() for c in db.get_multi(self.affiliations)]
            d['projects'] = [c.data() for c in db.get_multi(self.projects)]
            d['qualifications'] = self.collection(Qualification, "holder", data=True)
            d['jobs'] = self.collection(Job, "employee", data=True)
            d['education'] = self.collection(Education, "student", data=True)
            d['volunteering'] = self.collection(Volunteering, "volunteer", data=True)
        return d

    def defaults(self):
        self.role = ["coordinator", "reporter", "writer", "videographer", "photographer"]
        auth = Authentication()
        auth.put()
        self.authentication = auth.key

    def setSearchWords(self, unsaved=False):
        if unsaved:
            self.searchwords = [self.firstName.lower(), self.lastName.lower()]
            return
        parts = ["%s %s %s"%(self.fullName(), self.blurb, self.survey_context)]
        parts += ["%s %s"%(w.name, w.description) for w in db.get_multi(self.websites)]
        parts += ["%s %s"%(q.license.get().name, q.license.get().issuing_authority_name) for q in self.collection(Qualification, "holder")]
        parts += ["%s %s %s"%(j.title, j.employer.get().name, j.employer.get().location) for j in self.collection(Job, "employee")]
        parts += ["%s %s"%(e.school.get().name, e.school.get().location) for e in self.collection(Education, "student")]
        parts += ["%s %s"%(v.beneficiary.get().name, v.beneficiary.get().location) for v in self.collection(Volunteering, "volunteer")]
        parts += ["%s %s"%(a.name, a.description) for a in db.get_multi(self.affiliations)]
        parts += ["%s %s"%(p.name, p.description) for p in db.get_multi(self.projects)]
        self.searchwords = self.string2words(" ".join(parts))

    def migrate_userdata(self, old):
        self.firstName = old.firstName
        self.lastName = old.lastName
        self.email = old.email
        self.password = old.password
        self.zipcode = old.zipcode
        self.ip = old.ip
        self.ips = [self.ip]
        self.date = old.date
        self.setSearchWords(True)

def getfounder(fname): # depped, leaving for posterity
    g = User.query(User.role.contains(fname)).fetch(2)
    if len(g) != 1:
        from util import fail
        fail("can't find unique %s!"%(fname,))
    return g[0]

def getgreg(): # depped, leaving for posterity
    return getfounder("greg")

def getadmins():
    return User.query(User.role.contains("admin")).fetch()

def popularityContest(item):
    psum = sum([v.opinion for v in item.votes()])
    item.psum = psum
    return sum

def getMost(mostWhat, mostClass, user, lastMost=None):
    q = mostClass.query()
    if mostWhat == "recent":
        q = q.order(-mostClass.date)
        if lastMost:
            q = q.filter(mostClass.date < lastMost.date)
    result = q.fetch(100)
    if user and user != "anonymous":
        result = filterVoted(user, result)
    if mostWhat == "popular":
        result = sorted(result, key=popularityContest, reverse=True)
        if lastMost:
            popularityContest(lastMost)
            result = [r for r in result if r.psum < lastMost.psum]
    return len(result) and result[0].data() or None

class Skin(db.TimeStampedBase):
    user = db.ForeignKey(kind=User)
    title = db.String()
    color = db.String()
    background = db.String()
    font = db.String()
    img = db.Binary()
    css = db.Text()
    chat = db.Boolean(default=False)
    chatter = db.Boolean(default=False)

    def isSearchable(self):
        return False

    def mindata(self, nothing=None):
        return {
            "css": self.css,
            "key": self.id(),
            "chat": self.chat,
            "font": self.font,
            "title": self.title,
            "color": self.color,
            "img": self.img.path,
            "chatter": self.chatter,
            "user": self.user.urlsafe(),
            "background": self.background
        }

class Invitation(CANModel):
    inviter = db.ForeignKey(kind=User)
    email = db.String()
    mtype = db.String() # conversation only so far...
    # DONE: STRING2KEY conversion!
    mkey = db.ForeignKey()

def emailuser(user, subject, body, html=None):
    send_email(user.email,#"%s <%s>"%(user.fullName(), user.email),
        subject, body, html)

def prepend_article(word):
    if word[0] in 'aeiou':
        return "an %s"%(word,)
    return "a %s"%(word,)

def send_invitation(media, user, invitee=None, email=None):
    # media can be:
    # conversation, action group, event, video, news, referendum
    subject = "Invitation from %s"%(user.firstName,)
    fn = user.fullName()
    mtype = media.modeltype()
    verb = media.verb()
    asomething = prepend_article(media.modeltype_singular())
    mtitle = media.title_analog()
    mlink = media.storylink()
    if email:
        if mtype in ["conversation", "group"]:
            from util import DOMAIN
            from emailTemplates import invite_email
            send_email(email, subject,
                invite_email%(fn, asomething,
                    mtitle, DOMAIN, mtype, mlink))
        else: # event, video, news, referendum
            from emailTemplates import invite_email_no_account
            send_email(email, subject,
                invite_email_no_account%(fn,
                    verb, asomething, mtitle, mlink))
    elif invitee:
        if invitee.email_messages:
            from emailTemplates import invitation
            emailuser(invitee, subject,
                invitation%(invitee.firstName,
                    fn, verb, asomething, mtitle, mlink))
    else:
        from util import fail
        fail("no invitee or email")

def emailadmins(subject, body, html=None):
    for admin in getadmins():
        emailuser(admin, subject, body, html)

survey_questions = [
    "Buy Organic, Local, and Humane Products and Services",
    "Manage Home In An Eco-Friendly and Economically Sustainable Manner",
    "Produce Eco-Friendly and Economically Sustainable Products/Services at Work",
    "Treat Others As You Like To Be Treated"
]
class ULog(ModelBase):
    user = db.ForeignKey(kind=User)
    propname = db.String()
    oldval = db.Text()
    newval = db.Text()
    date = db.DateTime(auto_now_add=True)

    def userlink(self):
        return self.user.get().mylink()

    def logtext(self):
        if self.propname == "survey":
            sa = self.newval[3:-2].split("', u'")
            slist = []
            for i in range(4):
                if sa[i] != "none":
                    slist.append("<b>%s</b>: %s"%(sa[i], survey_questions[i]))
            return "<br>".join(slist)
        if self.propname == "avatar":
            from util import flipQ
            return '<img src="/get?gtype=avatar&size=profile&uid=%s">'%(flipQ(self.user.id()),)
        if self.propname == "dob":
            return self.newval.split(" ")[0]
        if len(self.newval) > 300:
            return "%s..."%(self.newval[:300],)
        return self.newval

    def rsspropname(self):
        if self.propname == "firstName":
            return "first name"
        if self.propname == "lastName":
            return "last name"
        if self.propname == "dob":
            return "date of birth"
        if self.propname == "survey_context":
            return "survey context"
        return self.propname

    def rssitems(self):
        return {"title": self.rsspropname(),
            "link": self.userlink(),
            "description": self.logtext(),
            "pubDate": self.date}

# most category stuff moved into ctmodel
# Category collections: userscores, globalscores
class CategoriedVotingModel(CategoriedModelBase):
    user = db.ForeignKey(kind=User)
    # collections (checked): votes

    def votes(self):
        return self.collection(MediaVote, "media")

    def vdata(self, vuser):
        datadict = self.data()
        if vuser:
            v = MediaVote.query(MediaVote.user == vuser.key,
                MediaVote.media == self.key).get()
            if v:
                datadict['vote'] = v.opinion
        return datadict

class Thought(CategoriedVotingModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    thought = db.Text()
    reviewed_for_tweet = db.Boolean(default=False)

    def convoTopic(self):
        return ("THOUGHT: %s"%(self.thought.replace('\n', ' '),))[:500]

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def title_analog(self):
        return self.thought

    def tweetlinks(self):
        from util import DOMAIN
        lnk = "%s/tweet?key=%s"%(DOMAIN, self.key.urlsafe())
        return {
            "yes": lnk + "?doit=1",
            "no": lnk
        }

    def storylink(self, aslist=False):
        from util import DOMAIN, flipQ
        if aslist:
            return ["community"]
        return "%s/community.html#!Stream|%s"%(DOMAIN, flipQ(self.key.urlsafe()))
        # forget profile
#        if self.user:
#            if aslist:
#                return ["profile", "thoughtstream"]
#            return "%s/profile.html?u=%s#thoughtstream"%(DOMAIN, flipQ(self.user.id()))
#        if aslist:
#            return ["home"]
#        return DOMAIN

    def setSearchWords(self):
        self.searchwords = self.string2words(self.thought)

    def rssitems(self):
        return {"title": self.user and self.user.get().firstName or "anonymous user",
            "description": self.thought,
            "link": self.storylink(),
            "pubDate": self.date.strftime("%A %B %d, %Y at %I:%M%p")}

    def mydata(self):
        return {"uid": self.user and self.user.urlsafe() or None,
                "user": self.user and self.user.get().firstName or "Anonymous",
                "conversation": self.conversation and self.conversation.urlsafe() or None,
                "thought": self.thought, "reviewed_for_tweet": self.reviewed_for_tweet,
                "date": self.date.date().strftime("%a %b %d")}

class ChangeIdea(CategoriedVotingModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    idea = db.String()

    def convoTopic(self):
        return ("CHANGE: %s"%(self.idea.replace('\n', ' '),))[:500]

    def setSearchWords(self):
        self.searchwords = self.string2words(self.idea)

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def title_analog(self):
        return self.idea

    def modeltype_singular(self):
        return "change idea"

    def storylink(self, aslist=False):
        from util import DOMAIN, flipQ
        if aslist:
            return ["community"]
        return "%s/community.html#!Ideas|%s"%(DOMAIN, flipQ(self.key.urlsafe()))
        # don't mess around with profile
#        if self.user:
#            if aslist:
#                return ["profile", "changes"]
#            return "%s/profile.html?u=%s#changes"%(DOMAIN, flipQ(self.user.id()))
#        if aslist:
#            return ["home"]
#        return DOMAIN

    def rssitems(self):
        return {"title": self.idea, "link": self.storylink(),
            "description": self.idea, "pubDate": self.date}

    def data(self):
        from datetime import datetime
        d = self.date.strftime("%x")
        if d == datetime.now().strftime("%x"):
            d = self.date.strftime("%I:%M%p")
        return {
            "key": self.id(),
            "uid": self.user and self.user.urlsafe() or None,
            "user": self.user and self.user.get().firstName or "Anonymous",
            "conversation": self.conversation and self.conversation.urlsafe() or None,
            "idea": self.idea,
            "date": d
        }

class Question(CategoriedVotingModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    question = db.String()

    def title_analog(self):
        return self.question

    def convoTopic(self):
        return ("QUESTION: %s"%(self.question.replace('\n', ' '),))[:500]

    def setSearchWords(self):
        self.searchwords = self.string2words(self.question)

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def storylink(self, aslist=False):
        from util import DOMAIN
        if aslist:
            return ["community"]
        return "%s/community.html#!Questions|%s"%(DOMAIN, flipQ(self.key.urlsafe()))

    def rssitems(self):
        return {"title": self.question, "link": self.storylink(),
            "description": self.question, "pubDate": self.date}

    def data(self):
        from datetime import datetime
        d = self.date.strftime("%x")
        if d == datetime.now().strftime("%x"):
            d = self.date.strftime("%I:%M%p")
        return {
            "key": self.id(),
            "uid": self.user and self.user.urlsafe() or None,
            "user": self.user and self.user.get().firstName or "Anonymous",
            "conversation": self.conversation and self.conversation.urlsafe() or None,
            "question": self.question,
            "date": d
        }

class Case(CategoriedVotingModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    title = db.String()
    blurb = db.Text()
    document = db.Binary()
    # DONE: STRING2KEY conversion!
    evidence = db.ForeignKey(repeated=True)

    def getBlob(self):
        return self.document and self.document.get()

    def setBlob(self, data=None):
        self.document = data

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s"%(self.title, self.blurb))

    def logstring(self):
        return "<b>%s</b><br>%s"%(self.title, self.blurb)

    def storylink(self, aslist=False):
        from util import DOMAIN, flipQ
        if aslist:
            return ["cases"]
        return "%s/cases.html#!%s"%(DOMAIN, flipQ(self.id()))
        # don't link to profile
#        if aslist:
#            return ["profile", "Cases"]
#        return "%s/profile.html?u=%s#Cases"%(DOMAIN, flipQ(self.user.id()))

    def rssitems(self):
        from util import truncate
        return {"title": self.title, "link": self.storylink(),
            "description": truncate(self.blurb), "pubDate": self.date}

    def mydata(self):
        return { "mtype": "case",
                 "uid": self.user.urlsafe(),
                 "title": self.title,
                 "blurb": self.blurb,
                 "doc": self.document.path,
                 "evidence": [k.urlsafe() for k in self.evidence],
                 "conversation": self.conversation.urlsafe() }

class Wiki(CANModel):
    title = db.String()
    date = db.DateTime(auto_now=True)
    # collections (checked): pages

    def data(self):
        return {
            "key": self.id(),
            "title": self.title,
            "pages": self.collection(Page, "wiki", data=True)
        }

class Page(CANModel):
    wiki = db.ForeignKey(kind=Wiki)
    user = db.ForeignKey(kind=User)
    title = db.String()
    body = db.Text()
    private = db.Boolean(default=False)
    revision = db.Integer(default=1)

    def mindata(self, nothing):
        return {
            "key": self.id(),
            "title": self.title
        }

    def data(self):
        return {
            "key": self.id(),
            "user": self.user.get().data(),
            "title": self.title,
            "body": self.body,
            "revision": self.revision
        }

DEFAULT_WIDGET_STYLE = """/* chat widget style */

#peopleButton {

}
#placesButton {

}
.allchat {

}
.chatname {

}
.chatarea {
    
}
.people {

}
.places {

}
.userlist {

}
.userinfo {

}

/* wiki widget style */

.allwiki {

}
.tabbox {

}
.tabbox a {

}
.tabbox div:hover {

}
.tabbox div:hover a {

}
.activetab {

}
.titlebox {

}
.bodybox {

}

/* map widget style */
#map {

}
#mapplaces {

}
"""

class Group(CANModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    wiki = db.ForeignKey(kind=Wiki)
    title = db.String()
    blurb = db.Text() # set max-length in JS!
    description = db.Text()
    website = db.String()
    date = db.DateTime(auto_now_add=True)
    style = db.Text(default=DEFAULT_WIDGET_STYLE)
    # collections (checked): members, newsletters

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s %s"%(self.title,
            self.blurb, self.description))

    def logstring(self):
        return "<b>%s</b><br>%s"%(self.title, self.blurb)

    def has_user(self, uid):
        return uid in self.mymembers()

    def add_user(self, user):
        Membership(user=user.key, group=self.key).put()

    def storylink(self, aslist=False):
        from util import flipQ, DOMAIN
        if aslist:
            return ["participate.html#ActionGroups|", self.id()]
#            return "/participate.html#ActionGroups|%s"%(flipQ(self.id()),)
        return "%s/participate.html#ActionGroups|%s"%(DOMAIN, flipQ(self.id()))

    def view_page(self):
        return "participate"

    def mindata(self, user=None):
        d = {"key": self.id(), "title": self.title}
        if user:
            d["memtype"] = user.mygroups().get(self.id(), False)
        return d

    def mymembers(self):
        if not hasattr(self, "_mm"):
            self._mm = {}
            for m in self.collection(Membership, "group"):
                self._mm[m.user.urlsafe()] = m.memtype
        return self._mm

    def data(self, user=None):
        d = self.mindata(user)
        d.update({"blurb": self.blurb,
                "description": self.description or "",
                "website": self.website or "",
                "members": self.mymembers(),
                "conversation": self.conversation.urlsafe(),
                "wiki": self.wiki.urlsafe(),
                "style": self.style})
        return d

class Membership(CANModel):
    group = db.ForeignKey(kind=Group)
    user = db.ForeignKey(kind=User)
    memtype = db.String(default="member") # also: leader

def newGroup(user, **kwargs):
    g = Group(**kwargs)
    c = Conversation(topic="GROUP: %s"%(g.title,))
    w = Wiki(title=g.title)
    db.put_multi([g, c, w])
    g.conversation = c.key
    g.wiki = w.key;
    m = Membership()
    m.group = g.key
    m.user = user.key
    m.memtype = "leader"
    ul = ULog()
    ul.user = user.key
    ul.propname = "action groups"
    ul.newval = '%s has founded a group called "%s"'%(user.firstName, g.title)
    g.setSearchWords()
    db.put_multi([g, m, ul])
    return g.data(user)

def widgetData(widget, group):
    d = {}
    if widget == "wiki":
        d['wiki'] = group.wiki.get().data()
    elif widget == "stream":
        d['stream'] = group.conversation.get().data()
    return d

class Newsletter(CANModel):
    user = db.ForeignKey(kind=User)
    group = db.ForeignKey(kind=Group)
    title = db.String()
    body = db.Text()
    html = db.Text()
    date = db.DateTime(auto_now=True)
    test_sent = db.Boolean(default=False)
    sent = db.Boolean(default=False)
    template = db.Boolean(default=False)

    def setBodyAndHtml(self, s):
        from util import strip_html
        self.html = s
        self.body = strip_html(s)

    def send(self, istest=False):
        # TODO: for now, send mail here. at some point, we'll
        # have too many users to handle this in-request
        users = None
        if istest:
#            users = User.all().filter("role = ", "greg").fetch(1000)
            users = [self.user.get()]
        elif self.group:
            all_users = db.get_multi([m.user for m in self.group.get().collection(Membership, "group")])
            users = [u for u in all_users if u.email_newsletters == True]
        else:
            users = User.query(User.email_newsletters == True).fetch(1000)
        for u in users:
            emailuser(u, self.title,
                self.body.replace("{firstname}", u.firstName),
                self.html.replace("{firstname}", u.firstName))
        if istest:
            self.test_sent = True
        else:
            self.sent = True
            ul = ULog()
            ul.user = self.user.key
            ul.propname = "newsletter"
            sbody = self.body
            if len(sbody) > 300:
                sbody = sbody[:300] + "..."
            ul.newval = "<b>%s</b><br>%s"%(self.title, sbody)
            ul.put()

    def mindata(self, user=None):
        return {"key": self.id(),
                "title": self.title,
                "sent": self.sent,
                "template": self.template}

    def data(self):
        return { "key": self.id(),
                 "title": self.title,
                 "body": self.html, # we hide the html/body distinction
                 "date": self.date.date().strftime("%A %B %d, %Y"),
                 "sent": self.sent,
                 "template": self.template }

def get_newsletter(user, group, title, istemplate, failonfind=False):
    n = Newsletter.query().filter(Newsletter.title == title).filter(Newsletter.template == istemplate).filter(Newsletter.user == user.key).filter(Newsletter.group == group.key).get()
    if n:
        if failonfind:
            from util import fail
            fail("Sorry, you already have a %s called %s!"%(istemplate and "template" or "newsletter", title))
        return n
    return None

def process_newsletter(user, group, title, text, shouldsend, istest, istemplate):
    get_newsletter(user, group, title, istemplate, failonfind=True)
    n = Newsletter(title=title)
    n.user = user.key
    n.group = group.key
    n.setBodyAndHtml(text)
    if istemplate:
        n.template = True
    elif shouldsend:
        n.send(istest)
    n.put()
    return n.id()

class DatedCredential(CANModel):
    def data(self):
        d = {"key": self.id(),
             "date_started": self.date_started.date().strftime("%B %Y")}
        if hasattr(self, "date_stopped") and self.date_stopped:
            d["date_stopped"] = self.date_stopped.date().strftime("%B %Y")
        d.update(self.mydata())
        return d

class Website(CANModel):
    name = db.String()
    url = db.String()
    description = db.Text()

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "url": self.url,
                "description": self.description}

class License(CANModel):
    name = db.String()
    issuing_authority_name = db.String()
    website_url = db.String()
    issuing_authority_primary_address = db.String()
    # collections (checked): holders

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "issuing_authority_name": self.issuing_authority_name,
                "website_url": self.website_url,
                "issuing_authority_primary_address": self.issuing_authority_primary_address}

class Qualification(DatedCredential):
    license = db.ForeignKey(kind=License)
    holder = db.ForeignKey(kind=User)
    date_started = db.DateTime()

    def mydata(self):
        return {"license": self.license.get().data(),
                "holder": self.holder.urlsafe()}

class Employer(CANModel):
    name = db.String()
    location = db.String()
    # collections (checked): employees

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "location": self.location}

class Job(DatedCredential):
    employer = db.ForeignKey(kind=Employer)
    employee = db.ForeignKey(kind=User)
    title = db.String()
    date_started = db.DateTime()
    date_stopped = db.DateTime()

    def mydata(self):
        return {"employer": self.employer.get().data(),
                "employee": self.employee.urlsafe(),
                "title": self.title}

class School(CANModel):
    name = db.String()
    location = db.String()
    # collections (checked): students

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "location": self.location}

class Education(DatedCredential):
    student = db.ForeignKey(kind=User)
    school = db.ForeignKey(kind=School)
    date_started = db.DateTime()
    date_stopped = db.DateTime()

    def mydata(self):
        return {"school": self.school.get().data(),
                "student": self.student.urlsafe()}

class Beneficiary(CANModel):
    name = db.String()
    location = db.String()
    # collections (checked): volunteers

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "location": self.location}

class Volunteering(DatedCredential):
    volunteer = db.ForeignKey(kind=User)
    beneficiary = db.ForeignKey(kind=Beneficiary)
    date_started = db.DateTime()
    date_stopped = db.DateTime()

    def mydata(self):
        return {"beneficiary": self.beneficiary.get().data(),
                "volunteer": self.volunteer.urlsafe()}

class Affiliate(CANModel):
    name = db.String()
    url = db.String()
    description = db.String()

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "url": self.url,
                "description": self.description}

class Project(CANModel):
    name = db.String()
    url = db.String()
    description = db.String()

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "url": self.url,
                "description": self.description}

credmap = {
    "websites": Website,
    "qualifications": Qualification,
    "jobs": Job,
    "education": Education,
    "volunteering": Volunteering,
    "affiliations": Affiliate,
    "projects": Project,
    "license": License,
    "employer": Employer,
    "school": School,
    "beneficiary": Beneficiary
}

keycreds = ["websites", "affiliations", "projects"]
credsubs = {
    "qualifications": "license",
    "jobs": "employer",
    "education": "school",
    "volunteering": "beneficiary"
}
credunames = {
    "qualifications": "holder",
    "jobs": "employee",
    "education": "student",
    "volunteering": "volunteer"
}

def dict2date(d):
    import datetime
    return datetime.datetime(int(d.get("year")),
        int(d.get("month")), int(d.get("day", 15)))

def modcred(cdata):
    cname = cdata.pop("cname")
    c = db.get(cdata.pop("key"))
    puts = [c]
    if cname in keycreds:
        for k, v in cdata.items():
            setattr(c, k, v)
    else:
        subname = credsubs[cname]
        csub = getattr(c, subname)
        csubdata = cdata.pop(subname)
        dstar = dict2date(cdata.pop('date_started'))
        dstop = 'date_stopped' in cdata and dict2date(cdata.pop('date_stopped')) or None
        c.date_started = dstar
        if dstop:
            c.date_stopped = dstop
        elif hasattr(c, "date_stopped") and c.date_stopped:
            c.date_stopped = None
        for k, v in cdata.items():
            setattr(c, k, v)
        for k, v in csubdata.items():
            setattr(csub, k, v)
        puts.append(csub)
    db.put_multi(puts)
    return c

def newcred(cdata, user):
    cname = cdata.pop("cname")
    if cname in keycreds:
        c = credmap[cname]()
        for k, v in cdata.items():
            setattr(c, k, v)
        c.put()
        curlist = getattr(user, cname)
        curlist.append(c.id())
        setattr(user, cname, curlist)
        ul = ULog()
        ul.user = user
        ul.propname = cname
        ul.newval = '<b>%s</b>: <a href="%s">%s</a><br><br>%s'%(c.name,
            c.url, c.url, c.description)
        db.put_multi([user, ul])
    else:
        subname = credsubs[cname]
        csub = credmap[subname](**cdata.pop(subname))
        csub.put()
        cdata[subname] = csub
        dstar = dict2date(cdata.pop('date_started'))
        dstop = 'date_stopped' in cdata and dict2date(cdata.pop('date_stopped')) or None
        c = credmap[cname](**cdata)
        setattr(c, credunames[cname], user)
        c.date_started = dstar
        if dstop:
            c.date_stopped = dstop
        ul = ULog()
        ul.user = user
        ul.propname = cname
        ul.newval = "new %s: <b>%s</b>"%(subname, csub.name)
        db.put_multi([c, ul])
    return c

class Application(CANModel):
    user = db.ForeignKey(kind=User)
    role = db.String() # oneof: reporter, writer, photographer, videographer
    statement = db.Text()
    reviewed = db.Boolean(default=False)

    def data(self):
        return {"key": self.id(),
                "user": self.user.urlsafe(),
                "role": self.role,
                "statement": self.statement}

security_questions = [
    "What is your mother's maiden name?",
    "In what city or town did you attend high school?",
    "In what city or town were you born?",
    "How many siblings are in your father's family?",
    "In what city or town was your first job?",
    "What is the last name of your third grade teacher?",
    "What was your childhood nickname?",
    "At what school did you attend sixth grade?",
    "In what city or town did your parents meet?"
]

class SecurityQuestion(CANModel):
    user = db.ForeignKey(kind=User)
    question = db.String()
    answer = db.String()

    def data(self):
        return {"key": self.id(),
                "user": self.user,
                "question": self.question,
                "answer": self.answer}

def securityQuestion(user, question, answer):
    return SecurityQuestion(user=user.key,
        question=question, answer=processanswer(user, answer))

class Critique(CANModel):
    subject = db.ForeignKey() # Approvable subclass
    critic = db.ForeignKey(kind=User)
    comment = db.String()

    def data(self):
        return {"key": self.id(),
                "subject": self.subject.urlsafe(),
                "critic": self.critic.urlsafe(),
                "comment": self.comment}

class OpinionIdea(CategoriedVotingModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    title = db.String()
    body = db.Text()
    conversation_active = db.Boolean(default=True)

    def verb(self):
        return "consider"

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s"%(self.title,
            self.body))

    def storylink(self, aslist=False):
        from util import DOMAIN, flipQ
        if aslist:
            return ["recommendations.html#!OpinionsAndIdeas", self.id()]
        return "%s/recommendations.html#!OpinionsAndIdeas|%s"%(DOMAIN, flipQ(self.id()))

    def modeltype_multiword(self):
        return "opinions and ideas"

    def modeltype_singular(self):
        return "opinion"

    def logstring(self):
        sbody = self.body
        if len(sbody) > 300:
            sbody = sbody[:300] + "..."
        return "<b>%s</b><br>%s"%(self.title, sbody)

    def rssitems(self):
        from util import truncate
        return {"title": self.title, "link": self.storylink(),
            "description": truncate(self.body), "pubDate": self.date}

    def mydata(self):
        return { "key": self.id(),
                 "mtype": "opinion",
                 "title": self.title,
                 "body": self.body,
                 "uid": self.user.urlsafe(),
                 "conversation": self.conversation.urlsafe(),
                 "conversation_active": self.conversation_active }

class PositionPaper(CategoriedVotingModel, Searchable):
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    title = db.String()
    body = db.Text()

    def verb(self):
        return "consider"

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s"%(self.title,
            self.body))

    def storylink(self, aslist=False):
        from util import DOMAIN, flipQ
        if aslist:
            return ["recommendations#!PositionPapers", self.id()]
        return "%s/recommendations.html#!PositionPapers|%s"%(DOMAIN, flipQ(self.id()))

    def modeltype_multiword(self):
        return "position papers"

    def modeltype_singular(self):
        return "paper"

    def logstring(self):
        sbody = self.body
        if len(sbody) > 300:
            sbody = sbody[:300] + "..."
        return "<b>%s</b><br>%s"%(self.title, sbody)

    def rssitems(self):
        from util import truncate
        return {"title": self.title, "link": self.storylink(),
            "description": truncate(self.body), "pubDate": self.date}

    def mydata(self):
        return { "key": self.id(),
                 "mtype": "paper",
                 "user": self.user.urlsafe(),
                 "title": self.title,
                 "body": self.body,
                 "conversation": self.conversation.urlsafe() }

class Video(CategoriedVotingModel, Searchable, Approvable):
    approved = db.Boolean(default=False)
    critiqued = db.Boolean(default=False)
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    title = db.String()
    description = db.Text()
    docid = db.String()
    thumbnail = db.String()
    player = db.String(default="google")

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setSearchWords(self):
        if self.description:
            searchstring = "%s %s"%(self.title, self.description)
        else:
            searchstring = self.title
        self.searchwords = self.string2words(searchstring)

    def verb(self):
        return "watch"

    def logstring(self):
        return "<b>%s</b>"%(self.title,)

    def storylink(self, aslist=False):
        from util import flipQ, DOMAIN
        if aslist:
            return ["video.html#!", self.id()]
#            return "/video.html#!%s"%(flipQ(self.id()),)
        return "%s/video.html#!%s"%(DOMAIN, flipQ(self.id()))

    def rssdesc(self):
        import unicodedata
        d = unicodedata.normalize("NFKD", self.description).encode("ascii", "ignore")
        return '<img src="' + self.thumbnail + '"> ' + d

    def rssitems(self):
        return {"title": self.title, "link": self.storylink(),
            "description": self.rssdesc(), "pubDate": self.date}

    def mydata(self):
        return { "mtype": "video",
                 "title": self.title,
                 "description": self.description,
                 "docid": self.docid,
                 "thumbnail": self.thumbnail,
                 "conversation": self.conversation.urlsafe(),
                 "player": self.player,
                 "user": self.user.get().firstName,
                 "uid": self.user.urlsafe(),
                 "date": self.date.date().strftime("%A %B %d, %Y") }

    def makethumb(self):
        self.docid = self.docid.strip()
        if self.player == "dtube":
            from cantools.web import fetch
            self.thumbnail = fetch("api.d.tube", path="/oembed", asjson=True, protocol="https", qsp={
                "url": "https://d.tube/v/%s"%(self.docid,)
            })["thumbnail_url"]
        elif self.player == "youtube":
            self.thumbnail = "http://img.youtube.com/vi/%s/0.jpg"%(self.docid,)
        elif self.player == "google":
            from cantools.web import fetch
            data = fetch("video.google.com", "/videofeed?docid=%s"%(self.docid,))
            s1 = '<media:thumbnail url="'
            i = data.index(s1) + len(s1)
            j = data.index('"', i)
            self.thumbnail = data[i:j]
        elif self.player == "vimeo":
            from cantools.web import fetch
            self.thumbnail = fetch("vimeo.com", "/api/v2/video/%s.json"%(self.docid,), asjson=True)[0]['thumbnail_small']
        else:
            from util import fail
            fail("invalid video player: '%s'"%(self.player,))

def newVideo(**kwargs):
    v = Video(**kwargs)
    c = Conversation(topic="VIDEO: %s"%(v.title,))
    db.put_multi([v, c])
    v.conversation = c.key
    v.setSearchWords()
    v.makethumb()
    return v

class Text(CategoriedVotingModel, Approvable):
    approved = db.Boolean(default=False)
    critiqued = db.Boolean(default=False)
    content = db.Text()

    def logstring(self):
        return self.content

    def mydata(self):
        return { "content": self.content }

class Quote(Text, Searchable):
    shared = db.Boolean(default=False)
    searchwords = db.String(repeated=True)
    author = db.String()

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s"%(self.author,
            self.content))

    def rssitems(self):
        from util import DOMAIN
        return {"title": self.author, "description": self.content,
            "link": "%s/recommendations.html#!Quotes"%(DOMAIN,),
            "pubDate": self.date.strftime("%A %B %d, %Y at %I:%M%p")}

    def logstring(self):
        return "<b>%s</b><br>%s"%(self.author, self.content)

    def mindata(self, user=None):
        return {"key": self.id(), "author": self.author}

    def mydata(self):
        return { "author": self.author, "shared": self.shared }

class Titled(Quote): # title, author, content, category, date
    title = db.String()

    def mindata(self, user=None):
        return {"key": self.id(), "title": self.title}

    def mydata(self):
        return { "title": self.title }

class Photo(CategoriedVotingModel, Approvable):
    shared = db.Boolean(default=False)
    approved = db.Boolean(default=False)
    critiqued = db.Boolean(default=False)
    # html OR ((photo OR graphic), title, artist, link)
    graphic = db.ForeignKey(kind=Graphic)
    html = db.String()
    photo = db.String()
    title = db.String()
    artist = db.String()
    link = db.String()
    is_book_cover = db.Boolean(default=False)
    # collections (checked): sustainableactions, books

    def title_analog(self):
        return self.title

    def logstring(self):
        return self.pic_html()

    def getBlob(self):
        return self.graphic.get().getBlob()

    def pic_link(self, absolute=False):
        if self.photo:
            return self.photo
        p = "/get?gtype=graphic&key=%s"%(self.graphic.urlsafe(),)
        if absolute:
            from util import DOMAIN
            return "%s%s"%(DOMAIN, p)
        return p

    def pic_html(self, absolute=False):
        if self.html:
            return self.html
        return '<img src="%s">'%(self.pic_link(absolute),)

    def mydata(self):
        if self.html:
            return { "html": self.html, "shared": self.shared }
        return { "photo": self.pic_link(), "title": self.title,
                 "artist": self.artist, "link": self.link,
                 "shared": self.shared }

def newphoto(**kwargs):
    if 'photo' in kwargs and not kwargs['photo'].startswith("http"):
        kwargs['graphic'] = db.KeyWrapper(urlsafe=kwargs.pop('photo').split("key=")[1])
    s = getsettings()
    p = Photo(**kwargs)
    s.photo_count += 1
    p.index = s.photo_count
    db.put_multi([s, p])
    return p

class Settings(CANModel):
    defaultavatar = db.ForeignKey(kind=Avatar)
    defaultgraphic = db.ForeignKey(kind=Graphic)
    defaultphoto = db.ForeignKey(kind=Photo)
    hit_count = db.Integer(default=0)
    video_player = db.String(default="Google Embedded")
    sustainable_action_count = db.Integer(default=0)
    photo_count = db.Integer(default=0)
    # DONE: STRING2KEY conversion!
    CAN_referenda = db.ForeignKey(kind="referendum", repeated=True)
    # DONE: STRING2KEY conversion!
    user_referenda = db.ForeignKey(kind="referendum", repeated=True)
    # DONE: STRING2KEY conversion!
    prime_categories = db.ForeignKey(kind="category", repeated=True)
    authenticate_phone = db.Boolean(default=False)
    password_to_edit_profile = db.Boolean(default=True)
    closed_beta = db.Boolean(default=False)
    beta_message = db.String(default="Admin can change this text on the participate page.")
    beta_password = db.String(default="thoughtful")
    # DONE: STRING2KEY conversion!
    slider_rotation = db.ForeignKey(repeated=True)
    email_founders_on_comment = db.Boolean(default=True)

    def data(self):
        return { "key": self.id(),
                 "CAN_referenda": [k.urlsafe() for k in self.CAN_referenda],
                 "user_referenda": [k.urlsafe() for k in self.user_referenda],
                 "prime_categories": [k.urlsafe() for k in self.prime_categories],
                 "authenticate_phone": self.authenticate_phone,
                 "password_to_edit_profile": self.password_to_edit_profile,
                 "closed_beta": self.closed_beta,
                 "beta_message": self.beta_message,
                 "beta_password": self.beta_password,
                 "email_founders_on_comment": self.email_founders_on_comment }

def getsettings():
    settingss = Settings.query().fetch(2)
    if len(settingss) != 1:
        from util import fail
        fail("inconsistent settings records!")
    return settingss[0]

class Book(Titled):
    # title, author, content, category, date, searchwords, approved
    photo = db.ForeignKey(kind=Photo)
    readlink = db.String()
    buylink = db.String()

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s %s"%(self.title,
            self.author, self.content))

    def rssitems(self):
        from util import DOMAIN
        return {"title": "%s by %s"%(self.title, self.author),
            "description": self.content,
            "link": "%s/recommendations.html#!Books"%(DOMAIN,),
            "pubDate": self.date.strftime("%A %B %d, %Y at %I:%M%p")}

    def logstring(self):
        return "<b>%s</b> by %s<br>%s"%(self.title, self.author, self.content)

    def mydata(self):
        return { "readlink": self.readlink,
                 "buylink": self.buylink,
                 "photo": self.photo.get().data(),
                 "shared": self.shared }

def newbook(**kwargs):
    b = Book(**kwargs)
    b.setSearchWords()
    return b

class SustainableAction(Titled):
    photo = db.ForeignKey(kind=Photo)
    link = db.String()

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s"%(self.title,
            self.content))

    def rssitems(self):
        from util import DOMAIN
        return {"title": self.title, "description": self.content,
            "link": DOMAIN,
            "pubDate": self.date.strftime("%A %B %d, %Y at %I:%M%p")}

    def modeltype_multiword(self):
        return "sustainable action"

    def logstring(self):
        return "<b>%s</b><br>%s"%(self.title, self.content)

    def mydata(self):
        return { "photo": self.photo.get().data(),
                 "link": self.link,
                 "shared": self.shared }

SETTING_COUNTS = { Photo: "photo", SustainableAction: "sustainable_action" }

randomclasses = {"photo": Photo, "sustainableaction": SustainableAction}

def randomindexed(modelname):
    modeltype = randomclasses[modelname]
    if not modeltype:
        from util import fail
        fail("%s is not indexed for randomization!"%(modelname,))
    q = modeltype.query(modeltype.shared == True, modeltype.approved == True)
    if modelname == "photo":
        q.filter(modeltype.is_book_cover == False)
    c = q.count()
    if c == 0:
        from util import fail
        fail("no %s randomization candidates!"%(modelname,))
    import random
    return q.fetch(1, offset=random.randint(0, c - 1))[0]

def newsustainableaction(**kwargs):
    s = getsettings()
    sa = SustainableAction(**kwargs)
    s.sustainable_action_count += 1
    sa.index = s.sustainable_action_count
    db.put_multi([s, sa])
    return sa

class Where(CANModel):
    zipcode = db.ForeignKey(kind=ZipCode)
    name = db.String()
    address = db.String()
    # collections (checked): events

    def stringify(self):
        return "%s, %s"%(self.name, self.address)

    def data(self):
        return { "key": self.id(),
                 "name": self.name,
                 "address": self.address,
                 "zipcode": self.zipcode.get().data() }

class Event(CategoriedVotingModel, Searchable, Approvable):
    approved = db.Boolean(default=False)
    critiqued = db.Boolean(default=False)
    searchwords = db.String(repeated=True)
    where = db.ForeignKey(kind=Where)
    conversation = db.ForeignKey(kind=Conversation)
    title = db.String()
    description = db.Text()
    when = db.DateTime() # year, month, day, hour, minute
    # DONE: STRING2KEY conversion!
    attendees = db.ForeignKey(kind=User, repeated=True) # user keys
    # collections (checked): tasks, rideshares

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def logstring(self):
        return "<b>%s</b><br>%s"%(self.title, self.blurb())

    def dateProp(self):
        return self.when

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s %s"%(self.title,
            self.where.get().stringify(), self.description))

    def has_user(self, uid):
        return uid in self.attendees

    def add_user(self, user):
        self.attendees.append(user.key)
        self.put()

    def view_page(self):
        return "community"

    def blurb(self):
        return "%s<br><br>%s<br>%s"%(self.description, self.where.get().stringify(), self.whendata()['full'])

    def storylink(self, aslist=False):
        from util import DOMAIN, flipQ
        if aslist:
            return ["community.html#!Events|", self.id()]
#            return "/community.html#!Events|%s"%(flipQ(self.id()),)
        return "%s/community.html#!Events|%s"%(DOMAIN, flipQ(self.id()))

    def rssitems(self):
        return {"title": self.title, "description": self.blurb(),
            "link": self.storylink(),
            "pubDate": self.date.strftime("%A %B %d, %Y at %I:%M%p")}

    def whendata(self):
        w = self.when
        if w.minute < 10:
            etime = "%s:0%s"%(w.hour, w.minute)
        else:
            etime = "%s:%s"%(w.hour, w.minute)
        return {"year": w.year,
                "month": w.month,
                "day": w.day,
                "time": etime,
                "full": w.strftime("%A %B %d, %Y at %I:%M%p")}

    def mydata(self):
        return {"mtype": "event",
                "approved": self.approved,
                "user": self.user.urlsafe(),
                "title": self.title,
                "description": self.description,
                "where": self.where.get().data(),
                "when": self.whendata(),
                "attendees": [k.urlsafe() for k in self.attendees],
                "conversation": self.conversation.urlsafe(),
                "tasks": self.collection(Task, "event", data=True),
                "rideshares": self.collection(Rideshare, "event", data=True)}

class Rideshare(CANModel):
    event = db.ForeignKey(kind=Event)
    driver = db.ForeignKey(kind=User)
    capacity = db.Integer()
    # DONE: STRING2KEY conversion!
    passengers = db.ForeignKey(kind=User, repeated=True) # user keys

    def data(self):
        return {"key": self.id(),
                "event": self.event.urlsafe(),
                "driver": self.driver.urlsafe(),
                "capacity": self.capacity,
                "passengers": [k.urlsafe() for k in self.passengers]}

class Task(CANModel):
    event = db.ForeignKey(kind=Event)
    title = db.String()
    description = db.Text()
    # DONE: STRING2KEY conversion!
    volunteers = db.ForeignKey(kind=User, repeated=True) # user keys

    def data(self):
        return {"key": self.id(),
                "event": self.event.urlsafe(),
                "title": self.title,
                "description": self.description,
                "volunteers": [k.urlsafe() for k in self.volunteers]}

def newevent(**kwargs):
    tasks = kwargs.pop('tasks')
    wdata = kwargs.pop("where")
    wdataz = wdata.pop("zip")
    w = Where(**wdata)
    w.zipcode = getzip(wdataz).key
    e = Event(**kwargs)
    c = Conversation(topic="EVENT: %s"%(e.title,))
    db.put_multi([e, c, w])
    e.conversation = c.key
    e.where = w.key
    e.setSearchWords()
    putthese = [e]
    for t in tasks:
        putthese.append(Task(event=e.key, title=t['title'],
            description=t['description']))
    db.put_multi(putthese)
    return e

class Place(CANModel, Searchable):
    searchwords = db.String(repeated=True)
    user = db.ForeignKey(kind=User)
    name = db.String()
    address = db.String()
    description = db.Text()
    zipcode = db.ForeignKey(kind=ZipCode)
    lat = db.Float()
    lng = db.Float()

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s %s"%(self.address,
            self.description, self.zipcode.get().allParts()))

    def genLatLng(self):
        self.lat, self.lng = address2latlng("%s %s"%(self.address, self.zipcode.get().code))

    def data(self):
        return {"key": self.id(),
                "name": self.name,
                "address": self.address,
                "description": self.description,
                "zipcode": self.zipcode.get().data(),
                "lat": self.lat,
                "lng": self.lng}

def newPlace(data):
    p = Place()
    p.name = data.pop('name')
    p.description = data.pop('description')
    p.address = data.pop('address')
    p.zipcode = getzip(data.pop('zipcode')).key
    p.genLatLng()
    return p

def address2latlng(address):
    import urllib
    from cantools.web import fetch
    results = fetch("maps.googleapis.com",
        "/maps/api/geocode/json?sensor=false&address=%s"%(urllib.quote(address.replace(" ", "+")),),
        asjson=True)['results']
    loc = results[0]['geometry']['location']
    return [loc['lat'], loc['lng']]

class Flag(CANModel):
    flagger = db.ForeignKey(kind=User)
    flagged = db.ForeignKey()
    message = db.String()
    modviewed = db.Boolean(default=False)

    def data(self):
        return {"key": self.id(),
                "flagger": self.flagger.urlsafe(),
                "flagged": self.flagged.urlsafe(),
                "message": self.message}

class Message(CANModel):
    sender = db.ForeignKey(kind=User)
    recipient = db.ForeignKey(kind=User)
    message = db.Text()
    check_link = db.String(repeated=True)
    userviewed = db.Boolean(default=False)
    date = db.DateTime(auto_now_add=True)

    def data(self):
        return {"key": self.id(),
                "sender": self.sender and self.sender.urlsafe() or None,
                "check_link": self.check_link,
                "recipient": self.recipient.urlsafe(),
                "message": self.message}

IMSG = '%s wants you to check out %s called "%s".'

def invitation_message(sender, recipient, media):
    m = Message()
    m.sender = sender.key
    m.recipient = recipient.key
    m.check_link = media.storylink(True)
    m.message = IMSG%(sender.fullName(),
        prepend_article(media.modeltype_singular()), media.title)
    m.put()

CMSG = '%s has commented on your %s called "%s".'

def chat_message(sender, recipient, media):
    m = Message()
    m.sender = sender.key
    m.recipient = recipient.key
    m.check_link = media.storylink(True)
    m.message = CMSG%(sender.fullName(),
        media.modeltype_singular(), media.title_analog())
    m.put()

AMSG = 'Your %s called "%s" has been approved!'

def approve_message(media):
    m = Message()
    m.recipient = media.user
    m.check_link = media.storylink(True)
    m.message = AMSG%(media.modeltype(), media.title)
    m.put()

VMSG = 'Your %s called "%s" has received a vote!'

def vote_message(media):
    m = Message()
    m.recipient = media.user
    m.check_link = media.storylink(True)
    m.message = VMSG%(media.modeltype(), media.title)
    m.put()

class Moderation(CANModel):
    moderator = db.ForeignKey(kind=User)
    moderated = db.ForeignKey(kind=User)
    message = db.Text()
    userviewed = db.Boolean(default=False)

    def data(self):
        return {"key": self.id(),
                "moderator": self.moderator.urlsafe(),
                "moderated": self.moderated.urlsafe(),
                "message": self.message}

class News(CategoriedVotingModel, Searchable, Approvable):
    """
    news body templating:
      - {a b} or {b} for links
      - -> into &nbsp;&nbsp;&rArr;&nbsp;&nbsp; for tab
      - allow regular <b> and <i> tags
      - turn \n into <br>
    """
    shared = db.Boolean(default=False)
    approved = db.Boolean(default=False)
    critiqued = db.Boolean(default=False)
    searchwords = db.String(repeated=True)
    conversation = db.ForeignKey(kind=Conversation)
    title = db.String()
    body = db.Text()
    # DONE: STRING2KEY conversion!
    photo = db.ForeignKey(kind=Photo, repeated=True)
    # DONE: STRING2KEY conversion!
    video = db.ForeignKey(kind=Video, repeated=True)

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s"%(self.title, self.body))

    def verb(self):
        return "read"

    def modeltype_singular(self):
        return "article"

    def logstring(self):
        from util import truncate
        return "<b>%s</b><br>%s"%(self.title, truncate(self.body))

    def storylink(self, aslist=False):
        from util import flipQ, DOMAIN
        if aslist:
            return ["news.html#!", self.id()]
#            return "/news.html#!%s"%(flipQ(self.id()),)
        return "%s/news.html#!%s"%(DOMAIN, flipQ(self.id()))

    def rssdesc(self):
        from util import truncate
        tbod = truncate(self.body)
        if len(self.photo):
            return '%s %s'%(self.photo[0].get().pic_html(True), tbod)
        return tbod

    def rssitems(self):
        return {"title": self.title, "link": self.storylink(),
            "description": self.rssdesc(), "pubDate": self.date}

    def mydata(self):
        return {"mtype": "news",
                "shared": self.shared,
                "approved": self.approved,
                "title": self.title,
                "body": self.body,
                "user": self.user.urlsafe(),
                "photo": [k.urlsafe() for k in self.photo],
                "video": [k.urlsafe() for k in self.video],
                "conversation": self.conversation.urlsafe(),
                "date": self.date.date().strftime("%A %B %d, %Y") }

def newnews(**kwargs):
    n = News(**kwargs)
    n.setSearchWords()
    c = Conversation(topic="NEWS: %s"%(n.title,))
    db.put_multi([n, c])
    n.conversation = c.key
    return n

media2entity = {
    "articles": News,
    "photographs": Photo,
    "videos": Video,
    "events": Event
}

class MediaVote(CANModel):
    submitter = db.ForeignKey(kind=User)
    media = db.ForeignKey() # CategoriedVotingModel subclass
    user = db.ForeignKey(kind=User)
    opinion = db.Integer()
    date = db.DateTime(auto_now_add=True)

class _ScoredModelBase(CANModel):
    score = db.Integer(default=0)

    def __cmp__(self, other):
        return self.score > other.score

    def preferred(self):
        # come up with something more sophisticated?
        return self.score > 0

class GlobalCategoryScore(_ScoredModelBase):
    category = db.ForeignKey(kind=Category)

class CategoryScore(_ScoredModelBase):
    category = db.ForeignKey(kind=Category)
    user = db.ForeignKey(kind=User)

def getcategoryscores(cat, user=None):
    score = user and (CategoryScore.query(CategoryScore.category == cat.key, CategoryScore.user == user.key).get() or CategoryScore(category=cat.key, user=user.key))
    gscore = GlobalCategoryScore.query(GlobalCategoryScore.category == cat.key).get() or GlobalCategoryScore(category=cat.key)
    return score, gscore

def ratemedia(media, user, opinion):
    submitter = media.user and media.user.get()
    mvote = MediaVote(media=media.key, user=user.key,
        opinion=opinion, submitter=media.user)
    puts = [mvote]
    #categories
    for cat in db.get_multi(media.category):
        score, gscore = getcategoryscores(cat, user)
        score.score += opinion
        gscore.score += opinion
        puts.append(score)
        puts.append(gscore)
    #submitter
    if submitter and submitter.is_active:
        rs = submitter.collection(MediaVote, "submitter") + [mvote]
        rtotal = 0
        for r in rs:
            rtotal += r.opinion
        rave = rtotal / float(len(rs))
        if rave < 2:
            if not submitter.impeach_date:
                from datetime import datetime, timedelta
                submitter.impeach_date = datetime.now()+timedelta(90)
                puts.append(submitter)
        elif submitter.impeach_date:
            submitter.impeach_date = None
            puts.append(submitter)
    db.put_multi(puts)

class Votable(CANModel):
    title = db.String()
    ye = db.Integer(default=0)
    nay = db.Integer(default=0)

    def votes(self):
        return self.collection(Vote, "referendum")

    def storylink(self, aslist=False):
        from util import flipQ, DOMAIN
        if aslist:
            return ["referenda.html#!", self.id()]
#            return "/referenda.html#!%s"%(flipQ(self.id()),)
        return "%s/referenda.html#!%s"%(DOMAIN, flipQ(self.id()))

    def getvote(self, user, d):
        if user:
            vote = Vote.query(Vote.referendum == self.key,
                Vote.user == user.key).get()
            if vote:
                d['vote'] = vote.opinion and "yes" or "no"

class Referendum(Votable, Approvable, Searchable):
    approved = db.Boolean(default=False)
    critiqued = db.Boolean(default=False)
    searchwords = db.String(repeated=True)
    user = db.ForeignKey(kind=User)
    conversation = db.ForeignKey(kind=Conversation)
    blurb = db.Text()
    summary = db.Text()
    document = db.Binary()
    # DONE: STRING2KEY conversion!
    date = db.DateTime(auto_now_add=True)
    is_ready = db.Boolean(default=False)
    jurisdiction = db.String(default="United States")
    # collections (checked): votes, branches

    def getBlob(self):
        return self.document and self.document.get()

    def setBlob(self, data=None):
        self.document = data

    def setSearchWords(self):
        self.searchwords = self.string2words("%s %s %s"%(self.title, self.blurb, self.summary))

    def verb(self):
        return "consider"

    def logstring(self):
        return "<b>%s</b><br>%s"%(self.title, self.blurb)

    def modelpage(self):
        return "referenda"

    def rssitems(self):
        return {"title": self.title, "link": self.storylink(),
            "description": self.blurb, "pubDate": self.date}

    def rm(self):
        if self.conversation:
            self.conversation.delete()
        ModelBase.rm(self)

    def setTitle(self, t, noput=False):
        self.title = t
        self.conversation.topic = "REFERENDUM: %s"%(t,)
        if not noput:
            db.put_multi([self, self.conversation])

    def voteText(self):
        return self.summary

    def data(self, user=None, bare=False, noblurb=False, ordered=False, withsummary=False, is_user=False):
        d = {"mtype": "referendum",
             "key": self.id(),
             "title": self.title,
             "jurisdiction": self.jurisdiction}
        if withsummary:
            d['summary'] = self.summary
        if ordered:
            from time import mktime # seconds since epoch
            d['sse'] = mktime(self.date.timetuple())
            d['ye'] = self.ye
        if not noblurb:
            d['blurb'] = self.blurb
        if not bare:
            d.update({"summary": self.summary, "ye": self.ye, "nay": self.nay, "doc": self.document.path, "conversation": self.conversation.urlsafe(), "is_ready": self.is_ready, "approved": self.approved})
        user and self.getvote(user, d)
        if is_user:
            d['user'] = self.user.get().data()
        return d

def makeblurb(summary):
    from util import strip_html
    blurb = ""
    summary = strip_html(summary, True)
    sentences = summary.split('.')
    while sentences and len(blurb) < 16:
        blurb += sentences.pop(0) + '.'
    if len(blurb) < 16:
        blurb = summary
    return blurb[:496] + ' ...'

def newref(shouldmakeblurb=False, **kwargs):
    if shouldmakeblurb:
        kwargs['blurb'] = makeblurb(kwargs['summary'])
    ref = Referendum(**kwargs)
    ref.setSearchWords()
    if "admin" in ref.user.get().role:
        ref.approved = True
    c = Conversation(topic="REFERENDUM: %s"%(ref.title,))
    db.put_multi([ref, c])
    ref.conversation = c.key
    return ref

class Branch(Votable):
    user = db.ForeignKey(kind=User)
    referendum = db.ForeignKey(kind=Referendum)
    rationale = db.Text()
    body = db.Text()

    def voteText(self):
        return self.body

    def data(self):
        return { "key": self.id(), "user": self.user.get().data(),
            "referendum": self.referendum.urlsafe(), "title": self.title,
            "rationale": self.rationale, "body": self.body,
            "ye": self.ye, "nay": self.nay }

    def mindata(self, user):
        d = self.data()
        self.getvote(user, d)
        return d

CANSEARCHES = {
    "user": User,
    "news": News,
    "video": Video,
    "book": Book,
    "law": Referendum,
    "event": Event,
    "group": Group,
    "idea": OpinionIdea,
    "paper": PositionPaper,
    "quote": Quote,
    "action": SustainableAction,
    "thought": Thought,
    "question": Question,
    "change": ChangeIdea,
    "case": Case,
    "place": Place
}

def _filter(q, qm, word):
    if config.web.server == "dez":
        return q.filter(qm.searchwords.contains(word))
    return q.filter(qm.searchwords == word)

def cansearch(stype, string, startdate, enddate):
    if stype == "rules":
        return [r.data() for r in SearchRule.query().fetch(1000)]
    if stype == "featured":
        return [r.data() for r in Featured.query().fetch(1000)]
    dstart, dend, dprop = None, None, None
    qm = CANSEARCHES[stype]
    f = qm.query()
    if stype == "user":
        f = f.filter(qm.deleted == False).filter(qm.searchable_profile == True)
    else:
        sdyear = startdate[:4]
        sdmonth = startdate[4:]
        edyear = enddate[:4]
        edmonth = enddate[4:]
        from datetime import datetime
        if sdyear and sdmonth and sdyear != "Year" and sdmonth != "Month":
            dstart = datetime(int(sdyear), int(sdmonth), 1)
        if edyear and edmonth and edyear != "Year" and edmonth != "Month":
            dend = datetime(int(edyear), int(edmonth), 1)
        dprop = stype == "event" and "when" or "date"
    from util import strip_punctuation
    searchwords = [w for w in strip_punctuation(string).lower().split(" ")]
    if dstart and dend: # filter and manually prune
        return [d.data() for d in list(set(reduce(list.__add__, [_filter(f.filter(db.GenericProperty(dprop) > dstart), qm, word).all() for word in searchwords]))) if d.dateProp() < dend]
    elif dstart: # filter only
        return [d.data() for d in list(set(reduce(list.__add__, [_filter(f.filter(db.GenericProperty(dprop) > dstart), qm, word).all() for word in searchwords])))]
    elif dend: # filter only
        return [d.data() for d in list(set(reduce(list.__add__, [_filter(f.filter(db.GenericProperty(dprop) < dend), qm, word).all() for word in searchwords])))]
    else: # no date filter
        return [d.data() for d in list(set(reduce(list.__add__, [_filter(f, qm, word).all() for word in searchwords])))]

CONVOTYPES = {
    "CASE": Case,
    "NEWS": News,
    "REFERENDUM": Referendum,
    "GROUP": Group,
    "VIDEO": Video,
    "CHANGE": ChangeIdea,
    "EVENT": Event,
    "OPINION/IDEA": OpinionIdea,
    "POSITION PAPER": PositionPaper,
    "QUESTION": Question,
    "THOUGHT": Thought
}
CONVOTITLES = {
    "CHANGE": "change",
    "QUESTION": "question",
    "THOUGHT": "thought"
}
def contentForConvo(convo):
    if ": " not in convo.topic:
        return None
    ctype, ctitle = convo.topic.split(": ", 1)
    ct = CONVOTYPES[ctype]
    return ct.query().filter(db.GenericProperty(CONVOTITLES.get(ctype, 'title')) == ctitle).get()

mediatypes = {
    "text": Text,
    "quote": Quote,
    "titled": Titled,
    "video": Video,
    "book": Book,
    "referenda": Referendum,
    "photo": Photo,
    "news": News,
    "sustainableaction": SustainableAction,
    "event": Event,
    "newsletter": Newsletter,
    "paper": PositionPaper,
    "opinion": OpinionIdea,
    "group": Group,
    "conversation": Conversation,
    "thought": Thought,
    "case": Case,
    "changeidea": ChangeIdea,
    "page": Page,
    "question": Question,
    "branch": Branch,
    "place": Place,
    "comment": Comment
}

def recommendsomething(user, q, number=1):
    cs = user and CategoryScore or GlobalCategoryScore
    topcats = user and cs.query(cs.user == user.key) or cs.query()
    for cat in [c for c in topcats.order(-cs.score).fetch(1000) if c.preferred()]:
        newq = q.copy(q.mod.category.contains(cat.category.urlsafe()))
        if newq.count() < number:
            break
        q = newq
    return q

rolemap = { "quote": "writer", "book": "writer",
    "video": "videographer", "photo": "photographer",
    "news": "reporter", "sustainableaction": "writer",
    "event": "coordinator", "referenda": "lawyer",
    "featured": "admin", "rules": "admin", "newsletter": "",
    "settings": "admin", "refnonlawyer": "", "paper": "",
    "group": "", "opinion": "", "thought": "", "case": "", "skin": "",
    "changeidea": "", "page": "", "question": "", "branch": "", "place": ""}

def acceptedRefKeys():
    s = getsettings()
    return set(s.user_referenda + s.CAN_referenda)

def filterVoted(user, results):
    return [r for r in results if r.key not in
        set([v.media for v in user.collection(MediaVote, "user")])]

MINI_QUERY_SIZE = 20

def postFilters(q, approved, critiqued, mtype, user, filter_voted, authid, number, offset, results=[], depth=0):
    # fetch result
    qdata = q.fetch(MINI_QUERY_SIZE, offset = offset + MINI_QUERY_SIZE * depth)
    results = results + qdata

    # we must manually prune out these hits
    # because of datastore query rules.
    if approved == False:
        if critiqued:
            if mtype == "referenda" and "admin" not in user.role:
                results = [r for r in results if r.id() not in acceptedRefKeys()]
        else:
            results = [r for r in results if r.user != user.key]
    if mtype == "paper":
        pass
    elif mtype != "referenda":
        if filter_voted:
            results = filterVoted(user, results)
    elif authid:
        results = [r for r in results if r.id() in acceptedRefKeys()]
    results = results[:number]

    # we haven't collected enough results
    # and the last query returned a full load
    # so we should try getting some more results
    if len(results) != number and len(qdata) == MINI_QUERY_SIZE:
        return postFilters(q, approved, critiqued, mtype, user, filter_voted, authid, number, offset, results, depth + 1)
    return results

def nextmedia(mtype, category=None, uid=None, number=1000, offset=0, nodata=False, recommendations=False, approved=True, critiqued=False, user=None, allrefs=False, authid=None, esort=False, filter_voted=False, shared=False, mindata=False, listonly=False, nlgroup=None, wiki=None, referendum=None):
    if authid and mtype == "group" and not listonly:
        author = db.get(authid)
        return [g.group.get().data(author) for g in author.collection(Membership,
            "user", fetch=False).fetch(number, offset=offset)]
    if not user and mtype != "newsletter": # why?
        user = uid and uid != "nouid" and db.get(uid)
    # shrink_post_filter is necessary whenever post-query filtering takes place
    shrink_post_filter = bool(user)
    justone = False
    results = None
    critnoapp = approved == False and critiqued
    if number == "none":
        number = 1000
        justone = True
    mt = mediatypes[mtype]
    q = mt.query()
    if shared:
        q = q.filter(mt.shared == True)
    if listonly:
        if wiki:
            q = q.filter(mt.wiki == db.KeyWrapper(urlsafe=wiki))
            q = q.order(mt.title)
        elif referendum:
            q = q.filter(mt.referendum == db.KeyWrapper(urlsafe=referendum))
    if mtype == "event":
        if esort:
            q = q.order(mt.when)
            from datetime import datetime, timedelta
            q = q.filter(mt.when >= datetime.now() - timedelta(1))
        else:
            q = q.order(-mt.when)
    elif mtype != "branch" and mtype != "page" and mtype != "place":
        q = q.order(-mt.date)
    if mtype == "conversation":
        r = q.filter(mt.privlist.contains(authid)).fetch(1000)
        if len(r) == 0:
            from util import fail
            fail("no convo results")
        return [c.data(unseencount=authid) for c in r]
#    if mtype == "newsletter":
#        if shrink_post_filter:
#            results = q.fetch(1000, offset)
#        else:
#            results = q.fetch(number, offset)
#    elif mtype == "referenda" and not allrefs and approved and not authid:
    if mtype == "comment":
        if user:
            q = q.filter(mt.user == user.key)
        results = q.filter(mt.private == False).fetch(number, offset=offset)
    elif mtype == "referenda" and not allrefs and approved and not authid:
        results = db.get_multi(getsettings().CAN_referenda[offset:offset+number])
    else:
        if authid and mtype not in ["group", "page", "branch"]:
            q = q.filter(mt.user == db.KeyWrapper(urlsafe=authid))
#        elif mtype == "paper" and user:
#            q.filter("user = ", user)
        if mtype == "newsletter":
            q = q.filter(mt.group == (nlgroup and db.KeyWrapper(urlsafe=nlgroup) or None))
        if mtype not in  ["paper", "opinion", "thought", "case", "page", "changeidea", "question", "place", "comment"]:
            if approved != "both":
                q = q.filter(mt.approved == approved)
            if approved == False and critiqued != "both":
                q = q.filter(mt.critiqued == critiqued)
            if critnoapp:
                if rolemap[mtype] not in user.role:
                    from util import fail
                    fail("You're not authorized!")
                q = q.filter(mt.user == user.key)
        if category:
            q = q.filter(mt.category.contains(getcategory(category).key.urlsafe()))
        if recommendations:
            q = recommendsomething(user, q, MINI_QUERY_SIZE + offset)
        if shrink_post_filter:
            results = postFilters(q, approved, critiqued, mtype, user, filter_voted, authid, number, offset)
        else:
            results = q.fetch(number, offset=offset)
    if len(results) == 0:
        from util import fail
        fail("zero count: %s.%s. (you may have already voted on all matches. we need: tons of media to make sure this doesn't happen; reasonable fallback behavior when it does; and, whenever possible, code smart enough to avoid the request altogether.)"%(mtype, category or ""))
    if justone:
        import random
        r = random.choice(results)
        if nodata:
            return r
        return r.data()
    if nodata:
        return results
    if mindata:
        if authid and mtype in ["group", "branch"]:
            user = db.get(authid)
        return [r.mindata(user) for r in results]
    try:
        if filter_voted and user and approved and mtype not in ["newsletter", "paper", "referenda", "event", "group"]:
            return [r.vdata(user) for r in results]
        return [r.data() for r in results]
    except:
        for res in results:
            try:
                res.data()
            except Exception, e:
                from util import fail
                fail("problem with: %s"%(res.signature(),), err=e)

class Vote(CANModel):
    referendum = db.ForeignKey(kinds=["referendum", "branch"])
    user = db.ForeignKey(kind=User)
    ip = db.ForeignKey(kind=IP)
    opinion = db.Boolean()

def castvote(ref, user, opinion, cresponse=None, squestion=None, sanswer=None):
    if opinion == True:
        ref.ye += 1
    elif opinion == False:
        ref.nay += 1
    else:
        from util import fail
        fail("invalid opinion!")
    ip = getip()
    if cresponse:
        from util import fail, verify_recaptcha, RCK
        if ip.key not in user.ips:
            if squestion == None and sanswer == None:
                import random
                sqs = user.collection(SecurityQuestion, "user")
                if sqs:
                    fail("SQ: %s"%(random.choice(sqs).question,))
                else:
                    fail("Unrecognized IP and no security questions!")
            elif SecurityQuestion.query(
                SecurityQuestion.user == user.key,
                SecurityQuestion.question == squestion.strip(),
                SecurityQuestion.answer == processanswer(user, sanswer)
            ).get():
                user.ips.append(ip.key)
            else:
                fail("You're an imposter!")
        verify_recaptcha(cresponse, RCK)
    ip.voteCount += 1
    vote = Vote()
    vote.ip = ip.key
    vote.referendum = ref.key
    vote.user = user.key
    vote.opinion = opinion
    db.put_multi([vote, ref, ip, user])

def email_in_use(email, return_user=False, no_userbase=False):
    user = User.query(User.email == email).get()
    if not user and not no_userbase:
        user = UserBase.query(UserBase.email == email).get()
    if return_user:
        return user
    return bool(user)

def processanswer(user, answer):
    return hashpass(''.join([c for c in answer.strip().lower() if c.isalnum()]), user.date)

def getstats():
    s = {}
    s['page_hits_since_september_6th_2011'] = getsettings().hit_count
    s['total_users'] = User.query().count()
    # active contributors system currently disabled
    #s['active_contributors'] = User.all().filter("is_active = ", True).count()
    s['ips'] = [i.data() for i in db.getall(IP)]
    s['events'] = Event.query().count()
    s['news'] = News.query().count()
    s['videos'] = Video.query().count()
    s['referenda'] = Referendum.query().count()
    return s
