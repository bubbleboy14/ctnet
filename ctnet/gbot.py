import os
from util import send_text, readfile, flipQ
from model import db, getsettings, p2i, News, Video, Book, Case, Question, ChangeIdea, Thought, Meme, Event, OpinionIdea, PositionPaper, Quote, Skin, CategoriedVotingModel
try:
    from urllib.parse import quote, unquote # py3
except:
    from urllib import quote, unquote       # py2

pi = os.environ.get("PATH_INFO")
# unquote twice for escaped %'s
rawqs = os.environ.get("QUERY_STRING")[19:]
qs = unquote(unquote(rawqs))

info = p2i(pi, qs)
m = info["item"]
title = info["title"]
qtype = info["section"]
desc = pdescription = p2i["description"]

ta = None
img = "/img/header/can-logo.jpg"
content = """<center>
This page is not for humans.
Unless you are a bot, please click <a href="%s#!%s">here</a>.
</center>"""%(pi, rawqs)
if qtype and not m and title == "Community":
    if qtype == "Events":
        from datetime import datetime, timedelta
        for e in Event.query().order(Event.when).filter(Event.when >= datetime.now() - timedelta(1)).fetch(1000):
            content += "<div>%s</div>"%(e.title,)
            content += "<div>%s</div>"%(e.blurb(),)
    elif qtype == "Questions":
        for q in Question.query().order(-Question.date).fetch(40):
            content += "<div>%s</div>"%(q.question,)
    elif qtype == "Ideas":
        for i in ChangeIdea.query().order(-ChangeIdea.date).fetch(40):
            content += "<div>%s</div>"%(i.idea,)
    elif qtype == "Stream":
        for t in Thought.query().order(-Thought.date).fetch(40):
            content += "<div>%s</div>"%(t.thought,)
    elif qtype == "Memes":
        for m in Meme.query().order(-Meme.date).fetch(40):
            content += "<div>%s</div>"%(m.title,)

if title == "Home":
    for n in News.query().order(-News.date).filter(News.approved == True).fetch(4):
        content += "<div><a href='/news.html#!%s'>%s</a></div>"%(flipQ(n.id()), n.title)
    for v in Video.query().order(-Video.date).filter(Video.approved == True).fetch(4):
        content += "<div><a href='/video.html#!%s'>%s</a></div>"%(flipQ(v.id()), v.title)
    for r in db.get_multi(getsettings().CAN_referenda[:3]):
        content += "<div><a href='/referenda.html#!%s'>%s</a></div>"%(flipQ(r.id()), r.title)
        content += "<div>%s</div>"%(r.blurb,)
    for b in Book.query().order(-Book.date).filter(Book.approved == True).fetch(3):
        content += "<div>%s by %s</div>"%(b.title, b.author)
        content += "<div>%s</div>"%(b.content,)
    content += """<div>Welcome to the free marketplace of ideas. We invite you to participate in CAN by adding original content to our website -- quality research, news, referenda, position papers, videos, and photos. The public votes on your content democratically. Beginning September 28, 2011, positive votes are rewarded with an election to the role of 'Active CAN Contributor', while negative votes allow the public to oust you from the position of 'Provisional CAN Contributor'. Not even the CAN Founders are above the system. The results could be interesting...</div>"""
elif title == "Recommendations" and not m:
    for b in Book.query().order(-Book.date).filter(Book.approved == True).fetch(5):
        content += "<div>%s by %s</div>"%(b.title, b.author)
        content += "<div>%s</div>"%(b.content,)
    for n in News.query().order(-News.date).filter(News.approved == True).fetch(4):
        content += "<div><a href='/news.html#!%s'>%s</a></div>"%(flipQ(n.id()), n.title)
        content += "<div>%s...</div>"%(n.body[:800],)
    for v in Video.query().order(-Video.date).filter(Video.approved == True).fetch(4):
        content += "<div><a href='/video.html#!%s'>%s</a></div>"%(flipQ(v.id()), v.title)
        content += "<div>%s</div>"%(v.description,)
    for o in OpinionIdea.query().order(-OpinionIdea.date).fetch(4):
        content += "<div>%s</div>"%(o.title,)
        content += "<div>%s</div>"%(o.body,)
    for p in PositionPaper.query().order(-PositionPaper.date).fetch(4):
        content += "<div>%s</div>"%(p.title,)
        content += "<div>%s</div>"%(p.body,)
    for q in Quote.query().order(-Quote.date).filter(Quote.approved == True).fetch(6):
        content += "<div>%s</div>"%(q.author,)
        content += "<div>%s</div>"%(q.content,)

if title == "Feed":
    s = Skin.query(Skin.user == m.key).get()
    title = s and s.title or "%s - %s"%(title, m.fullName())
    for d in CategoriedVotingModel.query(CategoriedVotingModel.user == m.key).order(-CategoriedVotingModel.date).fetch(10):
        content += "<div>%s</div>"%(d.title_analog(),)
elif m:
    if m.polytype == "comment":
        desc = m.body
        content += "<div class='big'><b>%s says:</b> %s</div><div>in thread:</div>"%(m.user.get().firstName, desc)
        m = m.conversation.get().media()
    ta = m.title_analog()
    if "http" in ta:
        ta, img = ta.split("http", 1)
        img = "http%s"%(img.split(" ")[0],)
    elif hasattr(m, "image"):
        img = m.image.urlsafe()
    elif hasattr(m, "description") and "http" in m.description:
        img = "http%s"%(m.description.split("http")[1].split(" ")[0],)
    content += "<div class='big'>%s</div>"%(ta,)
    if title == "Video":
        img = m.thumbnail
        content += "<img src='%s'>"%(m.thumbnail,)
        desc = m.description
#        content += "<div>%s</div>"%(m.description,)
    elif title == "News":
        toppic = m.photo[0].get()
        img = toppic.pic_link()
        content += toppic.pic_html()
        desc = m.body
#        content += "<div>%s</div>"%(m.body,)
    elif title == "Referenda":
        desc = m.voteText()
#        content += "<div>%s</div>"%(m.voteText(),)
    elif title == "Community" and hasattr(m, "blurb"):
        desc = m.blurb()
#        content += "<div>%s</div>"%(m.blurb(),)
    elif title == "Cases":
        desc = m.blurb
#        content += "<div>%s</div>"%(m.blurb,)
    elif title == "Recommendations":
        desc = m.body
#        content += "<div>%s</div>"%(m.body,)
    content += "<div>%s</div>"%(desc,)
    title = "%s - %s"%(ta, title)

content += "<div>%s</div>"%(pdescription,)

if not img.startswith("http"):
    from cantools import config
    img = "https://%s%s"%(config.web.domain, img)

tati = ta or title
send_text((readfile("/basic.html").decode())%(tati,
    tati, img, img, desc, desc, desc, title, content))