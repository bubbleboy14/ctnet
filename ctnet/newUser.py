import datetime
from util import respond, fail, cgi_get, send_mail, verify_recaptcha, RCK, DOMAIN
from model import db, UserBase, getzip, hashpass, email_in_use, getip
from emailTemplates import activate

def response():
    firstName = cgi_get('firstName')
    lastName = cgi_get('lastName')
    email = cgi_get('email').lower()
    password = cgi_get('password')
    zipcode = cgi_get('zipcode')
    cresponse = cgi_get('cresponse')

    verify_recaptcha(cresponse, RCK)

    if email_in_use(email):
        fail("Email address already registered. If you've already made an account, click 'Existing User' (on the left) to log in!")
    user = UserBase()
    user.firstName = firstName
    user.lastName = lastName
    user.email = email
    user.zipcode = getzip(zipcode).key
    ip = getip()
    ip.userCount += 1
    user.ip = ip.key
    date = datetime.datetime.now()
    user.password = hashpass(password, date)
    user.date = date
    db.put_multi([user, ip])
    send_mail(
        to=email,
        subject="New Account!",
        body=activate['body']%(firstName, DOMAIN, user.id()),
        html=activate['html']%(firstName, DOMAIN, user.id()))

respond(response)