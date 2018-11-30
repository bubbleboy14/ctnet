import os
from util import respond, redirect

def response():
	redirect(os.environ.get("PATH_INFO").replace("%23", "#", 1))

respond(response)