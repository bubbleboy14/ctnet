from cantools import db

class ModelBase(db.ModelBase): # CAN version...
    def modeltype_multiword(self):
        return self.modeltype()

    def modeltype_singular(self):
        return self.modeltype()

    def verb(self):
        return "participate in"

    def signature(self):
        return "%s(%s)"%(self.modeltype(), self.id())

class Category(ModelBase):
    name = db.String()

    def data(self):
        return { "key": self.id(), "name": self.name }

def getcategories():
    return [c.data() for c in Category.query().fetch(1000)]

def getcategory(catname):
    cat = Category.query().filter(Category.name == catname).get()
    if not cat:
        from util import fail
        fail("no such category: %s"%(catname,))
    return cat

class IP(ModelBase):
    address = db.String()
    userCount = db.Integer(default=0)
    voteCount = db.Integer(default=0)
    authCount = db.Integer(default=0)
    # collections (checked): users, votes, auths
    label = "address"

    def data(self):
        return {"key": self.id(),
                "address": self.address,
                "users": self.userCount,
                "votes": self.voteCount,
                "authentications": self.authCount}

class Log(ModelBase):
    ip = db.ForeignKey(kind=IP)
    date = db.DateTime(auto_now_add=True)
    message = db.Text()
    post = db.Text()
    qs = db.String()
    path = db.String()
    type = db.String()

class ZipCode(ModelBase):
    code = db.String()
    city = db.String()
    state = db.String()
    county = db.String()
    # collections (checked): users, events
    label = "code"

    def __str__(self):
        return self.code

    def allParts(self): # includes county
        return "%s %s %s %s"%(self.code, self.city, self.county, self.state)

    def fullString(self):
        return "%s, %s, %s"%(self.city, self.state, self.code)

    def data(self):
        return { "code": self.code, "city": self.city,
                 "state": self.state, "county": self.county }

class UserBase(ModelBase):
    firstName = db.String()
    lastName = db.String()
    email = db.String()
    password = db.String()
    zipcode = db.ForeignKey(kind=ZipCode)
    ip = db.ForeignKey(kind=IP)
    date = db.DateTime()
    label = "firstName"

    def fullName(self):
        return self.firstName + (self.lastName and (" " + self.lastName) or "")

    def data(self):
        return { "key": self.id(), "firstName": self.firstName, "lastName": self.lastName }

    def comment(self, body, conversation):
        comment = Comment(user=self.key, conversation=conversation.key, body=body)
        if len(conversation.privlist):
            comment.seenlist = [self.key]
            comment.private = True
        # we put conversation to update the date
        db.put_multi([comment, conversation])

class AnonymousUser(UserBase):
    pass # only has firstName

class Conversation(ModelBase):
    topic = db.String()
    # DONE: STRING2KEY conversion!
    privlist = db.ForeignKey(kind="user", repeated=True) # user ids ([] = public)
    date = db.DateTime(auto_now=True)
    # collections (checked): comments
    label = "topic"

    def media(self):
        mod = db.get_model(self.topic.split(": ")[0].lower().replace(" ", "").replace("/", ""))
        return mod.query(mod.conversation == self.key).get()

    def search_string(self):
        return " ".join([c.body for c in self.collection(Comment, "conversation")])

    def has_user(self, uid):
        return db.KeyWrapper(urlsafe=uid) in self.privlist

    def add_user(self, user):
        if not self.has_user(user.id()):
            self.privlist.append(user.key)
            self.put()

    def title_analog(self):
        return self.topic

    def view_page(self):
        return "profile"

    def storylink(self, aslist=False):
        from util import flipQ, DOMAIN
        if aslist:
            return ["profile.html#", self.id()]
#            return "/profile.html#%s"%(flipQ(self.id()),)
        return "%s/profile.html#%s"%(DOMAIN, flipQ(self.id()))

    def data(self, nocomments=False, allcomments=False, unseencount=None, viewer=None):
        d = { "key": self.id(),
              "topic": self.topic }
        if not nocomments:
            q = self.collection(Comment, "conversation", False).order(Comment.date)
            if not allcomments:
                q = q.filter(Comment.deleted == False)
            if unseencount:
                d['unseencount'] = q.count() - q.copy(Comment.seenlist.contains(unseencount)).count()
                d['privlist'] = [k.urlsafe() for k in self.privlist]
            else:
                comments = q.fetch(1000)
                if viewer:
                    puts = []
                    for c in comments:
                        if viewer not in c.seenlist:
                            c.seenlist.append(viewer)
                            puts.append(c)
                    if len(puts):
                        db.put_multi(puts)
                d['comments'] = [c.data() for c in comments];
        return d

class Comment(ModelBase):
    user = db.ForeignKey(kind="user") # User
    conversation = db.ForeignKey(kind=Conversation)
    body = db.Text()
    date = db.DateTime(auto_now_add=True)
    deleted = db.Boolean(default=False)
    private = db.Boolean(default=False)
    # DONE: STRING2KEY conversion!
    seenlist = db.ForeignKey(kind="user", repeated=True) # user ids ([] = public)
    # collections (checked): flags

    def isSearchable(self):
        return False

    def title_analog(self):
        return "%s's comment"%(self.user.get().firstName,)

    def data(self, withseenlist=False):
        d = { "key": self.id(),
              "conversation": self.conversation.urlsafe(),
              "user": self.user.urlsafe(),
              "body": self.body,
              "deleted": self.deleted }
        if withseenlist:
            d['seenlist'] = self.seenlist
        return d

ZIPDOMAIN = None
def setzipdomain(zipdomain):
    global ZIPDOMAIN
    ZIPDOMAIN = zipdomain

def getip():
    import os
    addr = os.environ.get('REMOTE_ADDR', 'none')
    ip = IP.query(
        IP.address == addr
    ).get()
    if not ip:
        ip = IP()
        ip.address = addr
        ip.put()
    return ip

def hashpass(password, date):
    import hashlib
    return hashlib.md5(password + str(date.date()).replace('-','')).hexdigest()

def getzip(code):
    if len(code) < 5:
        from util import fail
        fail("invalid zip code")
    try:
        code = str(int(code.strip()[:5]))
        while len(code) < 5: # preceding 0's
            code = '0'+code
    except:
        from util import fail
        fail("invalid zip code")
    zipcode = ZipCode.query().filter(ZipCode.code == code).get()
    if not zipcode:
        from cantools.web import fetch
        city, state, county = fetch(ZIPDOMAIN, path="/%s"%(code,), asjson=True)
        zipcode = ZipCode(code=code, city=city, state=state, county=county)
        zipcode.put()
    return zipcode

def getzips(kwargs):
    zips = ZipCode.query()
    for key, val in list(kwargs.items()):
        zips = zips.filter(db.GenericProperty(key) == val)
    return zips.fetch(1000)

def send_email(recipient, subject, body, html=None):
    from util import send_mail
    html = html or body
    send_mail(to=recipient, subject=subject, body=body or html)
#    send_mail(to=recipient, subject=subject, body=body, html=html)
