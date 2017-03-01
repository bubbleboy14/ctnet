import tweepy # imports ssl crap that (rarely) messes up gae dev unless you monkey patch it ;)
from cantools import config
from cantools.util import log
from model import db
from util import respond, redirect, cgi_get

ULEN = 25 # should actually get this from twitter api

def twit(sample):
    log("tweet [original] %s: %s"%(len(sample), sample), important=True)
    count = -1 # accounts for lack of initial space
    phrase = []
    for word in sample.split(" "):
        wlen = len(word)
        if wlen > ULEN and "http" in word:
            count += ULEN
            phrase.append(word)
            continue
        if count + wlen > 136:
            count += 4
            phrase.append("...")
            break
        count += 1 + wlen
        phrase.append(word)
    result = " ".join(phrase)
    log("tweet [compressed] %s: %s"%(count, result), important=True)
    return result

def response():
	ent = db.get(cgi_get("key").strip())
	if cgi_get("doit", default=False) and config.twitter:
		tweet = twit(ent.thought)
		if config.twitter.test:
			log(tweet, important=True)
		else:
			auth = tweepy.OAuthHandler(config.twitter.consumer.key, config.twitter.consumer.secret)
			auth.set_access_token(config.twitter.token.key, config.twitter.token.secret)
			api = tweepy.API(auth)
			api.update_status(tweet)
	ent.reviewed_for_tweet = True
	ent.put()
	redirect("/", "you did it! tweeted!")

respond(response)