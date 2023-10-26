from cantools.web import respond, cgi_get, succeed, redirect, metized
from cantools.util import token
from model import Dlink

def response():
	p = cgi_get("p", required=False, decode=True)
	if p:
		dlink = Dlink.query(Dlink.path == p).get()
		if not dlink:
			dlink = Dlink()
			dlink.path = p
			dlink.token = token()
		succeed(dlink.token)
	dlink = Dlink.query(Dlink.token == cgi_get("t")).get()
	if cgi_get("noredirect", required=False):
		succeed(dlink.path)
	redirect(dlink.path, metas=metized(dlink.metas()))

respond(response)