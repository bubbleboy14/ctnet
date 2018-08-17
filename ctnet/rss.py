import datetime
import PyRSS2Gen as RSS
from cantools import config
from util import respond, cgi_get, send_xml, fail, flipU, DOMAIN
from model import db, mediatypes, getsettings, ULog

RSSBUNDLE = """
<opml>
<head/>
<body>
<outline title="%s" text="%s">
    <outline title="%s News Feed" text="%s News Feed"
        type="rss" xmlUrl="%s/rss?rtype=news"
        htmlUrl="%s/news.html"/>
    <outline title="%s Quote Feed" text="%s Quote Feed"
        type="rss" xmlUrl="%s/rss?rtype=quote"
        htmlUrl="%s/recommendations.html#!Quotes"/>
    <outline title="%s Law Feed" text="%s Law Feed"
        type="rss" xmlUrl="%s/rss?rtype=referenda"
        htmlUrl="%s/referenda.html"/>
    <outline title="%s Thought Feed" text="%s Thought Feed"
        type="rss" xmlUrl="%s/rss?rtype=thought"
        htmlUrl="%s/community.html#!Stream"/>
    <outline title="%s Video Feed" text="%s Video Feed"
        type="rss" xmlUrl="%s/rss?rtype=video"
        htmlUrl="%s/video.html"/>
    <outline title="%s Sustainable Action Feed" text="%s Sustainable Action Feed"
        type="rss" xmlUrl="%s/rss?rtype=sustainableaction"
        htmlUrl="%s"/>
    <outline title="%s Event Feed" text="%s Event Feed"
        type="rss" xmlUrl="%s/rss?rtype=event"
        htmlUrl="%s/community.html#!Events"/>
    <outline title="%s Case Feed" text="%s Case Feed"
        type="rss" xmlUrl="%s/rss?rtype=case"
        htmlUrl="%s/cases.html"/>
    <outline title="%s Book Feed" text="%s Book Feed"
        type="rss" xmlUrl="%s/rss?rtype=book"
        htmlUrl="%s/recommendations.html#!Books"/>
    <outline title="%s Change Idea Feed" text="%s Change Idea Feed"
        type="rss" xmlUrl="%s/rss?rtype=changeidea"
        htmlUrl="%s/community.html#!Ideas"/>
    <outline title="%s Position Paper Feed" text="%s Position Paper Feed"
        type="rss" xmlUrl="%s/rss?rtype=paper"
        htmlUrl="%s/recommendations.html#!PositionPapers"/>
    <outline title="%s Opinion Feed" text="%s Opinion Feed"
        type="rss" xmlUrl="%s/rss?rtype=opinion"
        htmlUrl="%s/recommendations.html#!OpinionsAndIdeas"/>
</outline>
</body>
</opml>
"""%(config.rssname, config.rssname, config.shortname, config.shortname,
    DOMAIN, DOMAIN, config.shortname, config.shortname, DOMAIN, DOMAIN, config.shortname, config.shortname,
    DOMAIN, DOMAIN, config.shortname, config.shortname, DOMAIN, DOMAIN, config.shortname, config.shortname,
    DOMAIN, DOMAIN, config.shortname, config.shortname, DOMAIN, DOMAIN, config.shortname, config.shortname,
    DOMAIN, DOMAIN, config.shortname, config.shortname, DOMAIN, DOMAIN, config.shortname, config.shortname,
    DOMAIN, DOMAIN, config.shortname, config.shortname, DOMAIN, DOMAIN, config.shortname, config.shortname,
    DOMAIN, DOMAIN, config.shortname, config.shortname, DOMAIN, DOMAIN)
rdes = {
    "news": "Latest News Stories",
    "video": "Latest Videos",
    "referenda": "Latest Referenda",
    "event": "Latest Events",
    "user": "%s's Latest Activity",
    "book": "Latest Book Recommendations",
    "quote": "Latest Famous Quotes",
    "thought": "Latest Thought Stream",
    "sustainableaction": "Latest Sustainable Actions",
    "case": "Latest Cases",
    "changeidea": "Latest Ideas For Change",
    "paper": "Latest Position Papers",
    "opinion": "Latest Opinion Pieces"
}
rpage = {
    "event": "community",
    "book": "recommendations",
    "quote": "recommendations",
    "thought": "community",
    "sustainableaction": "home",
    "case": "cases",
    "changeidea": "community",
    "paper": "recommendations",
    "opinion": "recommendations"
}

def response():
    rtype = cgi_get("rtype", choices=["news", "video",
        "referenda", "event", "user", "book", "quote",
        "thought", "sustainableaction", "case",
        "changeidea", "paper", "opinion", "all"])
    if rtype == "all":
        send_xml(RSSBUNDLE)
    ukey = cgi_get("ukey", required=False)

    media = None
    rsslink = "%s/%s.html"%(DOMAIN, rpage.get(rtype, rtype))
    rssdesc = rdes[rtype]
    if rtype == "user":
        user = db.get(flipU(ukey[::-1]))
        if not user:
            fail("invalid user", html=True)
        prof_props = set(["email", "phone", "address", "dob",
            "blurb", "survey", "avatar", "survey_context"])
        badprops = set(["password", "email_newsletters",
            "email_messages", "email_notifications", "role",
            "show_contact_info", "gender", "zipcode",
            "searchable_profile"])
        if not user.show_contact_info or (user.dob and user.age() < 18):
            for p in ["email", "phone", "address"]:
                prof_props.remove(p)
                badprops.add(p)
        used_props = set()
        media = []
        for m in user.collection(ULog, "user", limit=15, order=-ULog.date):
            pn = m.propname
            if m.newval and pn not in badprops and not (pn in prof_props and pn in used_props):
                media.append(m)
                used_props.add(m.propname)
                if len(media) == 3:
                    break
        rssdesc = rssdesc%(user.fullName(),)
        rsslink = "%s/profile.html?u=%s"%(DOMAIN, ukey)
    elif rtype == "referenda":
        mt = mediatypes[rtype]
        media = mt.query().order(-mt.date).filter(mt.approved == True).fetch(15)
        s = getsettings()
        media = [m for m in media if m.id() in s.CAN_referenda or m.id() in s.user_referenda][:3]
    else:
        mt = mediatypes[rtype]
        media = mt.query().order(rtype == "event" and -mt.when or -mt.date)
        if rtype not in ['thought', 'case', 'changeidea', 'paper', 'opinion']:
            media = media.filter(mt.approved == True)
        media = media.fetch(3)
    ritems = []
    for m in media:
        mdata = m.rssitems()
        mdata['guid'] = RSS.Guid(mdata['link'])
        ritems.append(RSS.RSSItem(**mdata))
    if rtype == 'sustainableaction':
        rtype = 'sustainable action'
    elif rtype == 'changeidea':
        rtype = 'change idea'
    rss = RSS.RSS2(
        title = "CAN %s Feed"%(rtype.title(),),
        link = rsslink,
        description = rssdesc,
        lastBuildDate = datetime.datetime.now(),
        items = ritems)
    send_xml(rss.to_xml())

respond(response, failMsg="failed to generate RSS feed", failHtml=True)