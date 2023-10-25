from cantools.web import respond, cgi_get, succeed, redirect, metized
from cantools.util import token
from model import Dlink

def response():
	p = cgi_get("p", required=False)
	if p:
		dlink = Dlink.query(Dlink.path == p).get()
		if not dlink:
			dlink = Dlink()
			dlink.path = p
			dlink.token = token()
		succeed(dlink.data())
	dlink = Dlink.query(Dlink.token == cgi_get("t")).get()
	redirect(dlink.path, metas=metized(dlink.metas()))

respond(response)