from util import fetch

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
    card = resp["card"] or resp
    if "type" in card and card["type"] == "video":
        return [resp["content"], card["html"].split('"')[1], url]
    else:
        title = card.get("title", resp["content"])
        if "image" not in card:
            mats = card.get("media_attachments", [])
            for mat in mats:
                if mat["type"] == "image":
                    card["image"] = mat["url"]
                    break
        if "image" not in card:
            return [title, card["url"]]
        return [title, card["image"], card["url"]]