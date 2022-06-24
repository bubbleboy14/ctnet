try:
    import html # py3
except:
    from HTMLParser import HTMLParser # py2
    html = HTMLParser()
import requests
from util import respond, succeed, fail, cgi_get, trysavedresponse, setcachedefault, fetch, strip_html
from model import db

def isRandom():
    return cgi_get('random', default=False) or not cgi_get('number', default=False)

def og(data, flag, pref="og"):
    qchar = '"'
    fullflag = '%s%s:%s%s'%(qchar, pref, flag, qchar)
    if fullflag not in data:
        qchar = "'"
        fullflag = '%s%s:%s%s'%(qchar, pref, flag, qchar)
    if fullflag in data:
        before, after = data.split(fullflag, 1)
        if after.startswith(">") or after.startswith(" />"):
            sub = before.rsplit('content=%s'%(qchar,), 1)
        else:
            sub = after.split('content=%s'%(qchar,))
        metad = sub[1].split(qchar)[0]
        if flag == "image":
            metad = metad.replace(" ", "%20")
        return metad

def ts(url):
    resp = fetch("https://truthsocial.com/api/v1/statuses/%s"%(url.split("/").pop(),), asjson=True)
    card = resp["card"]
    if card["type"] == "video":
        return [resp["content"], card["html"].split('"')[1], url]
    else:
        return [card["title"], card["image"], card["url"]]

def response():
    gtype = cgi_get('gtype')
    uid = cgi_get('uid', required=False)
    uids = cgi_get('uids', required=False)

    if gtype == "skinfo":
        from model import Skin, CategoriedVotingModel as CVM
        skin = uid and Skin.query(Skin.user == uid).get()
        if cgi_get("nodata", required=False):
            succeed(skin and skin.mindata())
        chunk = cgi_get("chunk", default=15)
        offset = cgi_get("offset", default=0)
        contentq = CVM.query()
        if uid:
            contentq.filter(CVM.user == uid)
        succeed({
            "skin": skin and skin.mindata(),
            "data": [d.data() for d in contentq.order(-CVM.date).fetch(chunk, offset)]
        })

    if gtype == "og":
        url = cgi_get("url")
        if "truthsocial" in url:
            resp = ts(url)
        else:
            data = requests.get(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0'
            }).content.decode("utf-8")
            resp = []
            titog = og(data, "title")
            if titog:
                resp.append(titog)
            imgog = og(data, "image")
            imgtw = og(data, "image", "twitter")
            if imgog and imgtw:
                resp.append(len(imgog) < len(imgtw) and imgog or imgtw)
            elif imgog or imgtw:
                resp.append(imgog or imgtw)
            resp.append(og(data, "url") or url)
        resp = html.unescape(strip_html(" ".join(resp)))
        if len(resp) > 500:
            succeed(url)
        succeed(resp)

    if gtype == "fstats":
        user = db.get(uid)
        if set(["admin", "greg", "paul", "mario"]).intersection(user.role):
            from model import getstats
            succeed(getstats())
        fail("You're no founder!")

    if not isRandom() or gtype == "user":
        trysavedresponse()
        setcachedefault()

    if gtype == "wdata":
        from model import widgetData
        group = db.get(cgi_get("group"))
        succeed({
            "style": group.style,
            "data": widgetData(cgi_get("widget"), group)
        })
    elif gtype == "topIdeas":
        from model import ChangeIdea, getMost
        user = uid and uid != "anonymous" and db.get(uid)
        succeed({
            "recent": getMost("recent",
                ChangeIdea, user),
            "popular": getMost("popular",
                ChangeIdea, user)
        })
    elif gtype == "cases":
        from model import Case
        succeed([c.data() for c in Case.query().order(-Case.date).fetch(10)])
    elif gtype == "zip":
        succeed(db.get(uid).zipcode.get().code)
    elif gtype == "user":
        chat = cgi_get("chat", default=False)
        if uids:
            succeed([user.data(chat=chat) for user in db.get_multi([db.KeyWrapper(urlsafe=u) for u in uids if not u.endswith("[guest]")])])
        user = db.get(uid)
        if cgi_get("all", required=False):
#            if "moderator" not in user.role and "recruiter" not in user.role:
#                fail("you're not qualified!")
            from model import User
            q = User.query(User.deleted == False).order(User.lastName)
            if cgi_get("searchable", required=False):
                q = q.filter(User.searchable_profile == True)
            succeed([u.data() for u in q.fetch(1000)])
        if cgi_get("role_only", required=False):
            succeed(user.data(role=True))
        succeed(user.data(judgments=cgi_get("judgments", default=False),
            contributions=cgi_get("contributions", default=False),
            comments=cgi_get("comments", default=False),
            role=cgi_get("role", default=False),
            extended=cgi_get("extended", default=True),
            credentials=cgi_get("credentials", default=False),
            authentication=cgi_get("authentication", default=False),
            messages=cgi_get("messages", default=False),
            thoughts=cgi_get("thoughts", default=False),
            changes=cgi_get("changes", default=False),
            non_user_view=cgi_get("non_user_view", default=False),
            chat=chat))
    elif gtype == "ref":
        key = cgi_get('key', required=False)
        if uid == "nouid":
            user, ref = None, db.get(key)
        else:
            user, ref = db.get_multi([db.KeyWrapper(urlsafe=uid), db.KeyWrapper(urlsafe=key)])
        succeed(ref.data(user=user, is_user=cgi_get("is_user", default=False)))
    elif gtype == "categories":
        from model import getcategories
        succeed(getcategories())
    elif gtype == "conversations":
        k = cgi_get("key", required=False)
        if k:
            succeed(db.get(k).data())
        from model import Conversation
        succeed([c.data(nocomments=True) for c in Conversation.query().fetch(1000)])
    elif gtype == "convolink":
        convo = db.get(cgi_get("key"))
        mod = db.get_model(convo.topic.split(": ")[0].lower().replace(" ", "").replace("/", ""))
        succeed(mod.query(mod.conversation == convo.key).get().storylink())
    elif gtype == "convodata":
        succeed([db.get(ckey).media().data() for ckey in cgi_get("keys")])
    elif gtype == "comcount":
        from model import Comment
        succeed([Comment.query(Comment.conversation == c).count() for c in cgi_get("keys")])
    elif gtype == "media":
        from model import nextmedia, getcategory, randomindexed
        category = cgi_get('category', required=False)
        mtype = cgi_get('mtype', choices=["text", "quote", "titled", "video", "photo", "book", "referenda", "sustainableaction", "news", "event", "newsletter", "paper", "opinion", "group", "conversation", "thought", "case", "page", "changeidea", "question", "branch", "place", "comment", "meme"])
        number = cgi_get('number', default="none")
        offset = cgi_get('offset', default=0)
        recommendations = cgi_get('recommendations', default=False)
        israndom = cgi_get('random', default=False)
        approved = cgi_get('approved', default=True)
        critiqued = cgi_get('critiqued', default=False)
        authid = cgi_get("authid", required=False)
        if israndom:
            succeed(randomindexed(mtype).data())
        elif cgi_get("list_only", default=False):
            succeed(nextmedia(mtype, category, uid, number,
                offset, False, recommendations, approved,
                critiqued, authid=authid, mindata=True,
                listonly=True, nlgroup=cgi_get("nlgroup", required=False),
                wiki=cgi_get("wiki", required=False),
                referendum=cgi_get("referendum", required=False)))
        elif mtype == "referenda":
            u = uid != "nouid" and db.get(uid) or None
            noblurb = cgi_get("noblurb", default=False)
            allrefs = cgi_get("allrefs", default=False)
            ordered = cgi_get("ordered", default=False)
            withsummary = cgi_get("withsummary", default=False)
            succeed([r.data(bare=True, noblurb=noblurb, user=u, ordered=ordered, withsummary=withsummary) for r in nextmedia(mtype, user=u, number=number, offset=offset, nodata=True, allrefs=allrefs, authid=authid, critiqued=critiqued, approved=approved)])
        else:
            succeed(nextmedia(mtype, category, uid, number, offset, False,
                recommendations, approved, critiqued, authid=authid,
                esort=cgi_get("esort", default=False),
                filter_voted=cgi_get("filter_voted", default=False),
                shared=cgi_get("shared", default=False)))
    elif gtype == "avatar":
        from model import getsettings
        from util import send_image, flipU
        size = cgi_get("size", choices=["profile", "chat"], default="chat")
        flippedKey = flipU(uid[::-1])
        user = "guest" not in flippedKey and db.get(flippedKey) or None
        send_image(getattr(user and user.avatar and user.avatar.get() or getsettings().defaultavatar.get(), size).get().img.get())
    elif gtype == "graphic":
        from util import send_image
        send_image(db.get(cgi_get("key")).getBlob())
    elif gtype == "authattempt":
        user = db.get(uid)
        if not user or user.modeltype() != "user" or "authenticator" not in user.role:
            fail("You're not qualified!")
        review = cgi_get("review", required=False)
        if review:
            ruser, rgraphic = db.get_multi([db.KeyWrapper(urlsafe=review['uid']), db.KeyWrapper(urlsafe=review['gid'])])
            ruser.authentication.try_code(rgraphic.note, review['decision'])
        from random import choice
        from model import AuthAttempt
        aa = AuthAttempt.query(AuthAttempt.success == False,
            AuthAttempt.rejected == False,
            AuthAttempt.type == "graphic").fetch(10)
        if len(aa) == 0:
            succeed("none")
        if len(aa) == 1:
            r = aa[0].datadict()
            r['lastone'] = True;
            succeed(r)
        a = choice(aa)
        succeed(a.datadict())
    elif gtype == "application":
        user = db.get(uid)
        if not user or user.modeltype() != "user" or "recruiter" not in user.role:
            fail("You're not qualified!")
        review = cgi_get("review", required=False)
        if review:
            app = db.get(review['key'])
            if review['decision']:
                u = app.user.get()
                if app.role not in u.role:
                    u.role.append(app.role)
            app.reviewed = True
            db.put_multi([app, u])
        from model import Application
        apps = Application.query(Application.reviewed == False).fetch(10)
        if len(apps) == 0:
            succeed("none")
        if len(apps) == 1:
            d = apps[0].data()
            d['lastone'] = True;
            succeed(d)
        import random
        succeed(random.choice(apps).data())
    elif gtype == "search":
        from model import cansearch
        succeed(cansearch(cgi_get('stype', default='rules'),
            cgi_get('string', required=False),
            cgi_get('sd', required=False),
            cgi_get('ed', required=False)))
    elif gtype == "securityquestions":
        from model import security_questions, SecurityQuestion
        if SecurityQuestion.query(
            SecurityQuestion.user == db.KeyWrapper(urlsafe=uid)).count():
            fail("You've already answered security questions!");
        succeed(security_questions)
    elif gtype == "flags":
        user = db.get(uid)
        if "moderator" not in user.role:
            fail("You're no moderator!")
        from model import Flag
        succeed([f.data() for f in Flag.query(
            Flag.modviewed == False).fetch(1000)])
    elif gtype == "data":
        keys = cgi_get("keys", required=False)
        if keys:
            succeed([r.data() for r in db.get_multi(keys)])
        element = db.get(cgi_get("key"))
        if element.modeltype() == "conversation":
            succeed(element.data(viewer=db.KeyWrapper(urlsafe=cgi_get("uid"))))
        critiques = cgi_get("critiques", default=False)
        exempt = ["newsletter", "positionpaper",
            "group", "opinionidea", "case", "page", "branch"]
        if critiques and element.modeltype() not in exempt:
            succeed(element.dataWithCritiques())
        succeed(element.data())
    elif gtype == "slider":
        from model import getsettings
        sliders = db.get_multi(getsettings().slider_rotation)
        extra = []
        for item in sliders:
            if item.modeltype() == 'news':
                extra.append(item.photo[0])
        succeed({"rotation": [r.data() for r in sliders],
            "extra": [r.data() for r in db.get_multi(extra)]})
    elif gtype == "critiques":
        from model import rolemap
        user, element = db.get_multi([db.KeyWrapper(urlsafe=uid), db.KeyWrapper(urlsafe=cgi_get('key'))])
        if rolemap[element.modeltype()] not in user.role and "approver" not in user.role:
            fail("You're not authorized!")
        succeed([])
    else:
        fail('unknown get type: "%s"'%(gtype,))

respond(response)