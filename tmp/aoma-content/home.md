AOMA LoginAOMA: Asset Offering & Management Application if (window != window.top) { window.top.postMessage( { messageType: 'Logout', redirectUrl: window.location.href }, '\*' ); }  // <!\[CDATA\[ function setUserDataCookie(){ var nextyear = new Date(); nextyear.setFullYear(nextyear.getFullYear() + 1); setCookie("user", document.loginForm.user.value, nextyear); } function focuspasswd(){ if (document.loginForm.user.value == "") document.loginForm.user.focus(); else document.loginForm.pass.focus(); } function submitChain(chain) { document.loginForm.chain.value = chain; document.loginForm.submit(); } if (/\*@cc\_on!@\*/false) { document.documentElement.className += ' ie10'; } function getUrlParam(paramname) { var results = new RegExp('\[\\?&\]' + paramname + '=(\[^&#\]\*)').exec(window.location.search); return (results !== null) ? results\[1\] || 0 : false; } document.addEventListener("DOMContentLoaded", function(){ var ssoVsAadElement = document.getElementById("ssoVsAad"); var legacyLoginElement = document.getElementById("legacyLogin"); if (ssoVsAadElement === undefined || ssoVsAadElement === null) { legacyLoginElement.style.display = "block"; } else { if (ssoVsAadElement.length === 0) { ssoVsAadElement.style.display = "none"; legacyLoginElement.style.display = "block"; } else { ssoVsAadElement.style.display = "block"; legacyLoginElement.style.display = "none"; } } if (document.getElementById("aomaLoginBtn")) { document.getElementById("aomaLoginBtn").addEventListener("click", function () { if (document.getElementById("loginMessage")) document.getElementById("loginMessage").remove(); if (document.getElementById("embedLoginMessageRow")) document.getElementById("embedLoginMessageRow").remove(); if (document.getElementById("ssoLoginMessageRow")) document.getElementById("ssoLoginMessageRow").remove(); if (document.getElementById("ssoVsAad")) { document.getElementById("ssoVsAad").style.display = "none"; } document.getElementById("legacyLogin").style.display = "block"; }); } }); // \]\]>

![](/teams/web/images/aoma/login/aoma-title.png)

![](/teams/web/images/aoma/login/aoma-login-logo.gif)

 

Warning! Caps Lock is on.

Username:

Password:

Additional Password:

 

 

[Forget password?](javascript:submitChain\('LoginResetPasswordDisplayChain'\))

[New Account](#)

var passwordField = document.getElementById("pass"); var loginMessageElement = document.getElementById("loginMessageSpan"); var usernameField = document.getElementById("embedUserNameInputText"); usernameField.addEventListener("focusout", function(event) { usernameField.value = usernameField.value.trim(); }); usernameField.addEventListener('keypress', function (e) { if (e.key === 'Enter') { usernameField.value = usernameField.value.trim(); } }); passwordField.addEventListener("keyup", function(event) { if (event.getModifierState("CapsLock")) { loginMessageElement.textContent="Warning! Caps Lock is on."; loginMessageElement.style.display = "block"; } else { loginMessageElement.textContent=""; loginMessageElement.style.display = "none" } });

[Employee Login](https://login.microsoftonline.com/f0aff3b7-91a5-4aae-af71-c63e1dda2049/oauth2/authorize?response_type=code&response_mode=form_post&redirect_uri=https%3A%2F%2Faoma-stage.smcdp-de.net%2Fservlet%2Fcom.sonymusic.aoma.AOMADispatcherServlet&client_id=72e97d60-6868-4706-9caa-6781093d61ca&scope=openid user.read&state=984b5617-1f74-46c3-a616-adcc8d084e9d&nonce=f844f56d-15ea-484b-abac-ef015d20512d&resource=https://graph.microsoft.com)

Non-Employee Login