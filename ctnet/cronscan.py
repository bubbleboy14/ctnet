from datetime import datetime, timedelta
from util import respond, succeed, log
from model import db, User, UserBase, MediaVote

def response():
    return # disable for now!
    n = datetime.now()
    if n < datetime(2011, 10, 28):
        ltxt = "aborting cronscan: provisional/active rules suspended until 2011.09.28."
        log(ltxt, "cronscan")
        succeed(ltxt)

    # old preusers
    ub = UserBase.query(UserBase.date < n - timedelta(7)).fetch(1000)

    # start provisional period
    ups = User.query(User.is_active == True,
        User.provisional_date < n).fetch(1000)
    for u in ups:
        u.impeach_date = None
        u.is_active = False
        u.provisional_date = n

    # 40 days
    u40 = User.query(User.is_active == False,
        User.provisional_date <  n - timedelta(40)).fetch(1000)
    ptypes = ["reporter", "photographer", "videographer"]
    u40good = 0
    u40bad = 0
    for u in u40:
        gq = u.collection(MediaVote, "submitter", fetch=False)
        goods = gq.filter(MediaVote.opinion > 5).count()
        if goods < 5 or goods < 0.5 * gq.count():
            for p in ptypes:
                if p in u.role:
                    u.role.remove(p)
            u40bad += 1
        else:
            u.is_active = True
            u.provisional_date = n+timedelta(365)
            u40good += 1

    # 90 days
    u90 = User.query(User.impeach_date <  n).fetch(1000)
    for u in u90:
        u.impeach_date = None
        u.is_active = False

    db.delete_multi(ub)
    db.put_multi(ups+u40+u90)

    ltxt = "deleted %s expired preusers. found %s active users ready for provisional election. found %s provisional contributors, ready for count: %s failed; %s succeeded. impeached %s active contributors."%(len(ub), len(ups), len(u40), u40bad, u40good, len(u90))
    log(ltxt, "cronscan")
    succeed(ltxt)

respond(response, failMsg="cronscan failed")