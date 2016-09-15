import os
from util import redirect

redirect(os.environ.get("PATH_INFO").replace("%23", "#", 1), exit=False)