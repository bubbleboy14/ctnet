from util import respond, redirect

def response():
	redirect("/home.html", noscript=True)

respond(response)