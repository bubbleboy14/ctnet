try:
    import html # py3
except:
    from HTMLParser import HTMLParser # py2
    html = HTMLParser()
from cantools.util.admin import ushort
from util import fetch, strip_html

def ogpart(data, flag, pref="og"):
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

def clean(parts):
    return html.unescape(strip_html(" ".join(parts)))

def ship(d, vid=False):
    o = clean([d["title"], d["img"], d["url"]])
    if not vid:
        if len(o) > 500:
            d["img"] = "%s.jpg"%(ushort(d["img"]),)
        o = clean([d["title"], d["img"], d["url"]])
    if len(o) > 500:
        o = clean([d["img"], d["url"]])
    return o

def og(url):
    data = fetch(url, timeout=5, fakeua=True).decode()
    resp = {}
    titog = ogpart(data, "title")
    if titog:
        resp["title"] = titog
    imgog = ogpart(data, "image")
    imgtw = ogpart(data, "image", "twitter")
    if imgog and imgtw:
        resp["img"] = len(imgog) < len(imgtw) and imgog or imgtw
    elif imgog or imgtw:
        resp["img"] = imgog or imgtw
    resp["url"] = ogpart(data, "url") or url
    return ship(resp)

def ts(url):
    resp = fetch("https://truthsocial.com/api/v1/statuses/%s"%(url.split("/").pop(),), asjson=True)
    card = resp["card"] or resp
    if "type" in card and card["type"] == "video":
        return ship({ "title": resp["content"], "img": card["html"].split('"')[1], "url": url }, True)
    else:
        d = { "title": card.get("title", resp["content"]), "url": card["url"] }
        if "image" not in card:
            mats = card.get("media_attachments", [])
            for mat in mats:
                if mat["type"] == "image":
                    card["image"] = mat["url"]
                    break
        if "image" in card:
            d["img"] = card["image"]
        return ship(d)