email_changed = {}
email_changed['body'] = """
Dear %s:

You have changed the email address associated with your account.

To confirm this change, please go here:

%s/activate?u=%s

Enjoy!

The CAN Team
"""
email_changed['html'] = """
Dear %s:<br>
<br>
You have changed the email address associated with your account.<br>
<br>
To confirm this change, click <a href="%s/activate?u=%s">here</a>.<br>
<br>
Enjoy!<br>
<br>
The CAN Team
"""

submission_approved = {}
submission_approved['body'] = """
Dear %s:

Your submission, "%s", has been approved!

To view your content live, please go here:

%s

Have a great day!

The CAN Team
"""
submission_approved['html'] = """
Dear %s:<br>
<br>
Your submission, "%s", has been approved!<br>
<br>
To view your content live, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

submission_critiqued = {}
submission_critiqued['body'] = """
Dear %s:

Your submission, "%s", has been critiqued!

You can view the critique and resubmit your content on the participate page, here:

%s/participate.html

Have a great day!

The CAN Team
"""
submission_critiqued['html'] = """
Dear %s:<br>
<br>
Your submission, "%s", has been critiqued!<br>
<br>
You can view the critique and resubmit your content on the participate page, <a href="%s/participate.html">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

account_activated = {}
account_activated['body'] = """
Dear %s:

Congratulations! Your Civil Action Network account is now activated -- welcome to the network!

To log in, go here:

%s/login.html

Thank you for joining us! Have a great day.

The CAN Team
"""
account_activated['html'] = """
Dear %s:<br>
<br>
Congratulations! Your Civil Action Network account is now activated -- welcome to the network!<br>
<br>
To log in, click <a href="%s/login.html">here</a><br>
<br>
Thank you for joining us! Have a great day.<br>
<br>
The CAN Team
"""

activate = {}
activate['body'] = """
Dear %s:

Your Civil Action Network account has been approved.

To activate your account, go here:

%s/activate?u=%s

Please note that we will delete your account if you fail to activate within 7 days.

Enjoy!

The CAN Team
"""
activate['html'] = """
Dear %s:<br>
<br>
Your Civil Action Network account has been approved.<br>
<br>
To activate your account, click <a href="%s/activate?u=%s">here</a>.<br>
<br>
Please note that we will delete your account if you fail to activate within 7 days.<br>
<br>
Enjoy!<br>
<br>
The CAN Team
"""

reset_password = {}
reset_password['body'] = """
Dear %s:

As requested, we've reset your password.

New password: "%s".

Don't forget to change it, and have a great day!

The CAN Team
"""
reset_password['html'] = """
Dear %s:<br>
<br>
As requested, we've reset your password.<br>
<br>
New password: "%s".<br>
<br>
Don't forget to change it, and have a great day!<br>
<br>
The CAN Team
"""

comment_received = {}
comment_received['body'] = """
Dear %s:

Your submission entitled "%s" has received a comment.

To check it out, please go here:

%s

Have a great day!

The CAN Team
"""
comment_received['html'] = """
Dear %s:<br>
<br>
Your submission entitled "%s" has received a comment.<br>
<br>
To check it out, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

comment_alert = {}
comment_alert['body'] = """
Dear %s:

A submission entitled "%s" has received a comment.

To check it out, please go here:

%s

Have a great day!

The CAN Team
"""
comment_alert['html'] = """
Dear %s:<br>
<br>
A submission entitled "%s" has received a comment.<br>
<br>
To check it out, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

message_received = {}
message_received['body'] = """
Dear %s:

%s has sent you a message!

To check it out, please go here:

%s/profile.html#%s

Have a great day!

The CAN Team
"""
message_received['html'] = """
Dear %s:<br>
<br>
%s has sent you a message!<br>
<br>
To check it out, click <a href="%s/profile.html#%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

invitation = {}
invitation['body'] = """
Dear %s:

%s has invited you to %s %s called "%s".

To check it out, please go here:

%s

Have a great day!

The CAN Team
"""
invitation['html'] = """
Dear %s:<br>
<br>
%s has invited you to %s %s called "%s".<br>
<br>
To check it out, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

invite_email = {}
invite_email['body'] = """
%s has invited you to participate in %s called "%s".

To check it out, please make a free, secure account here:

%s/login.html

Then, view the %s here:

%s

Have a great day!

The CAN Team
"""
invite_email['html'] = """
%s has invited you to participate in %s called "%s".<br>
<br>
To check it out, please make a free, secure account <a href="%s/login.html">here</a>.<br>
<br>
Then, view the %s <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

invite_email_no_account = {}
invite_email_no_account['body'] = """
%s has invited you to %s %s called "%s".

Check it out here:

%s

Have a great day!

The CAN Team
"""
invite_email_no_account['html'] = """
%s has invited you to %s %s called "%s".<br>
<br>
Check it out <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

vote_received = {}
vote_received['body'] = """
Dear %s:

Your referendum entitled "%s" has received a vote!

To check it out, please go here:

%s/referenda#!%s

Have a great day!

The CAN Team
"""
vote_received['html'] = """
Dear %s:<br>
<br>
Your referendum entitled "%s" has received a vote!<br>
<br>
To check it out, click <a href="%s/referenda#!%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

evidence_submitted = {}
evidence_submitted['body'] = """
Dear %s:

Evidence has been submitted in support of your case, "%s"!

To view your case, please go here:

%s

Have a great day!

The CAN Team
"""
evidence_submitted['html'] = """
Dear %s:<br>
<br>
Evidence has been submitted in support of your case, "%s"!<br>
<br>
To view your case, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

branch_submitted = {}
branch_submitted['body'] = """
Dear %s:

A new branch has been submitted diverging from your referendum, "%s"!

To view your referendum, please go here:

%s

Have a great day!

The CAN Team
"""
branch_submitted['html'] = """
Dear %s:<br>
<br>
A new branch has been submitted diverging from your referendum, "%s"!<br>
<br>
To view your referendum, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""

response_received = {}
response_received['body'] = """
Dear %s:

%s has responded to your comment.

To view the conversation, please go here:

%s

Have a great day!

The CAN Team
"""
response_received['html'] = """
Dear %s:<br>
<br>
%s has responded to your comment.<br>
<br>
To view the conversation, click <a href="%s">here</a>.<br>
<br>
Have a great day!<br>
<br>
The CAN Team
"""
