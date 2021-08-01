CT.require("CT.all");
CT.require("CAN.all");

onload = function() {
    CT.dom.setContent("feedback", core.config.ctnet.feedback);
    CAN.cookie.set();
    var tabBox = CT.dom.id("tabBox");
    var boxes = [];
    var setTab = function(name, isVisible) {
        var box = CT.dom.id(name + "Box");
        var tab = CT.dom.id(name + "Tab");
        if (isVisible) {
            box.style.display = "block";
            tab.className = "red";
        }
        else {
            box.style.display = "none";
            tab.className = "";
        }
    };
    var switchTo = function(tname) {
        if (boxes.indexOf(tname) != -1)
            for (var i = 0; i < boxes.length; i++)
                setTab(boxes[i], boxes[i] == tname);
    };

//    isLoggedIn(function() {
 //       if (settings.closed_beta)
  //          switchTo("NewUser");
   // });
    CAN.session.isLoggedIn();

    CT.dom.id("NewUserLink").onclick = function() {
        switchTo("NewUser");
    };

    var swapFoci = {};
    var swapBox = function() {
        var boxName = this.id.replace("Tab", "");
        switchTo(boxName);
        CT.mobile.mobileSnap(function() { // dumb we have to wrap this...
            swapFoci[boxName].focus();
        });
    };
    var buildBox = function(sectionName, isVisible) {
        var section = sectionName.replace(" ", "");
        var tabName = section + "Tab";
        boxes.push(section);
        tabBox.appendChild(CT.dom.node(CT.dom.link(sectionName, null,
            null, "", tabName)));
        setTimeout(function() { // hack :(
            CT.dom.id(tabName).onclick = swapBox;
        }, 0);
        setTab(section, isVisible);
        return section;
    };
    var NUsubmit; // compilation
    var buildTable = function(sectionName, fields, buttonText, isVisible, hasCaptcha) {
        var section = buildBox(sectionName, isVisible);
        var table = CT.dom.buildForm(section, fields);
        var lastRow = table.insertRow(-1);
        var tablebutton = CT.dom.button(buttonText,
            null, "", section + "Button");
        lastRow.insertCell(0).appendChild(tablebutton);
        hasCaptcha && setTimeout(function() {
            CT.recaptcha.build(CAN.config.RECAPTCHA_KEY,
                lastRow.insertCell(1), function() {
                    var sorrynode = CT.dom.node("", "div", "red bold bottompadded");
                    sorrynode.appendChild(CT.dom.node("Sorry! Our captcha service has failed to load! If you would like to make a new account, please refresh the page or click ", "span"));
                    sorrynode.appendChild(CT.dom.link("here", function() {
                        document.location = document.location; }));
                    sorrynode.appendChild(CT.dom.node(" to try again. Otherwise log in as usual. Thanks!", "span"));
                    table.parentNode.insertBefore(sorrynode, table);
                    tablebutton.disabled = true;
                }, NUsubmit
            );
        });
    };
    buildTable("Existing User", ["Email", "Password"], "Log In!", true);
    CT.dom.id("ExistingUserEmail").focus();
    buildTable("New User", ["First Name", "Last Name", "Email", "Zip Code", "Password", "Reenter Password"], "Create User!", false, true);
    buildTable("Forgot Password", ["Email"], "Remind Me!");
    var EUemail = swapFoci['ExistingUser'] = CT.dom.id("ExistingUserEmail");
    var attemptLogin = CT.dom.id("ExistingUserButton").onclick = function() {
        var password = CT.dom.id("ExistingUserPassword");
        if (password.value == "")
            return; // prevents re-popup on enter after login failure
        if (! CT.parse.validEmail(EUemail.value)) {
            password.value = "";
            return alert("invalid email!");
        }
        if (! CT.parse.validPassword(password.value)) {
            password.value = "";
            return alert("invalid password!");
        }
        CT.net.post("/login", {"email": EUemail.value, "password": password.value}, "login error", function(udata) {
            CAN.cookie.set(udata.key, udata.firstName, udata.lastName, udata.site_wide_chat);
            if (udata.issecure)
                document.location = "/community.html#!Stream";
            else
                document.location = "/security.html";
        }, function() { alert("login failed! are you sure that's your password?"); });
        EUemail.value = '';
        password.value = '';
    };
    CT.dom.inputEnterCallback(CT.dom.id("ExistingUserPassword"), attemptLogin);
    var NUfirstName = swapFoci['NewUser'] = CT.dom.id("NewUserFirstName");
    var NUlastName = CT.dom.id("NewUserLastName");
    var NUemail = CT.dom.id("NewUserEmail");
    var NUzipcode = CT.dom.id("NewUserZipCode");
    var NUpassword = CT.dom.id("NewUserPassword");
    var NUpassword2 = CT.dom.id("NewUserReenterPassword");
    NUfirstName.onfocus = function() {
        CT.dom.showHide(CT.dom.id("firstname"), true);
    };
    NUfirstName.onblur = function() {
        CT.dom.showHide(CT.dom.id("firstname"), false, true);
    };
    NUlastName.onfocus = function() {
        CT.dom.showHide(CT.dom.id("lastname"), true);
    };
    NUlastName.onblur = function() {
        CT.dom.showHide(CT.dom.id("lastname"), false, true);
    };
    NUemail.onfocus = function() {
        CT.dom.showHide(CT.dom.id("email"), true);
    };
    NUemail.onblur = function() {
        CT.dom.showHide(CT.dom.id("email"), false, true);
    };
    NUzipcode.onfocus = function() {
        CT.dom.showHide(CT.dom.id("zipcode"), true);
    };
    NUzipcode.onblur = function() {
        CT.dom.showHide(CT.dom.id("zipcode"), false, true);
    };
    NUpassword.onfocus = NUpassword2.onfocus = function() {
        CT.dom.showHide(CT.dom.id("password"), true);
    };
    NUpassword.onblur = NUpassword2.onblur = function() {
        CT.dom.showHide(CT.dom.id("password"), false, true);
    };
    NUsubmit = CT.dom.id("NewUserButton").onclick = function() {
        if (! CT.parse.validEmail(NUemail.value))
            return alert("invalid email!");
        if (! CT.parse.validPassword(NUpassword.value))
            return alert("invalid password!");
        if (NUpassword.value != NUpassword2.value)
            return alert("passwords don't match!");
        var zcode = CT.parse.stripToZip(NUzipcode.value);
        if (! zcode)
            return alert("invalid zip code!");
        CT.recaptcha.submit(function() {
                document.location = "/newaccount.html";
            }, function() {
                NUfirstName.value = "";
                NUlastName.value = "";
                NUemail.value = "";
                NUzipcode.value = "";
                NUpassword.value = "";
                NUpassword2.value = "";
            }, "/newUser", {"email": NUemail.value,
            "password": NUpassword.value, "firstName": NUfirstName.value,
            "lastName": NUlastName.value, "zipcode": zcode});
    };
    CT.dom.inputEnterCallback(CT.dom.id("NewUserReenterPassword"), NUsubmit);
    var FPemail = swapFoci['ForgotPassword'] = CT.dom.id("ForgotPasswordEmail");
    var fpcb = CT.dom.id("ForgotPasswordButton").onclick = function() {
        if (! CT.parse.validEmail(FPemail.value))
            return alert("invalid email!");
        CT.net.post("/remind", {"email": FPemail.value}, "password retrieval error", function() {
            alert("We've emailed you your new password (a random, temporary value). Don't forget to change it!");
        });
        FPemail.value = "";
    };
    CT.dom.inputEnterCallback(FPemail, fpcb);
    switchTo(document.location.hash.slice(1));
};