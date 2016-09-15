from util import respond, send_pdf
from model import db
import cgi

def response():
    form = cgi.FieldStorage()
    key = form.getvalue('key')

    r = db.get(key.strip())
    send_pdf(r.getBlob(), r.title)

respond(response)