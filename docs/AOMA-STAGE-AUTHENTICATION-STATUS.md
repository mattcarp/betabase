# AOMA Stage Authentication Status

**Last Updated**: January 2025
**Status**: 🚫 **BLOCKED** - Awaiting admin resolution
**Blocker**: Microsoft Conditional Access + Certificate Authentication Failure

---

## 🚨 Current Blocker

**Microsoft Certificate Authentication Failure**

After successful username/password + 2FA authentication, Microsoft requires client certificate authentication which is failing with:

```
Access to device.login.microsoftonline.com was denied
There was a problem using your login certificate.
ERR_SSL_CLIENT_AUTH_SIGNATURE_FAILED
```

This appears to be related to:
1. **Jamf MDM Enrollment Requirement** - Device must be enrolled in Sony's Jamf Pro MDM system
2. **Certificate-based Authentication** - Browser-level certificate selection that cannot be automated
3. **Microsoft Conditional Access** - Azure AD policy enforcing device compliance

---

## 📋 Authentication Flow

### Successful Steps ✅

1. ✅ Connect to GlobalProtect VPN
2. ✅ Navigate to `https://aoma-stage.smcdp-de.net`
3. ✅ Click "Employee Login" button
4. ✅ Redirect to Microsoft Azure AD OAuth
5. ✅ Fill username: `matt.carpenter.ext@sonymusic.com`
6. ✅ Fill password: `Dalkey1_Lisbon2`
7. ✅ Click "Sign in"
8. ✅ User approves 2FA on Microsoft Authenticator app

### Failure Point ❌

9. ❌ **Certificate Selection Modal** appears asking "What certificate do you want to use?"
   - **Clicking "OK"**: Asks for password that doesn't work
   - **Clicking "Cancel"**: Redirects to `device.login.microsoftonline.com` with certificate auth error

10. ❌ **Certificate Authentication Fails**: `ERR_SSL_CLIENT_AUTH_SIGNATURE_FAILED`

11. ❌ **Multiple Redirect Loop**:
    - May redirect to Jamf Pro device enrollment: `jss.sonymusic.com:8443`
    - May redirect to certificate reprocessing: `/common/DeviceAuthTls/reprocess`
    - May redirect back to employee login page: `?chain=Login`

---

## 🔍 Technical Details

### Environment
- **AOMA Stage URL**: `https://aoma-stage.smcdp-de.net`
- **OAuth App ID**: `72e97d60-6868-4706-9caa-6781093d61ca`
- **VPN Required**: GlobalProtect VPN must be connected
- **Test Account**: `matt.carpenter.ext@sonymusic.com`

### Redirect Chain (Captured from Logs)

```
1. https://aoma-stage.smcdp-de.net
2. https://login.microsoftonline.com/... (username page)
3. https://login.microsoftonline.com/... (password page)
4. [User approves 2FA on phone]
5. https://login.microsoftonline.com/... (certificate modal)
6. https://device.login.microsoftonline.com/... (certificate auth - FAILS)
7. https://jss.sonymusic.com:8443/... (Jamf device enrollment)
   OR
   https://aoma-stage.smcdp-de.net/common/DeviceAuthTls/reprocess
   OR
   https://aoma-stage.smcdp-de.net/servlet/...?chain=Login
```

### Cookie Domains Captured

When authentication "succeeds" but lands on enrollment page:
- `portal.manage.microsoft.com` - Microsoft Intune portal
- `device.login.microsoftonline.com` - Device authentication
- `jss.sonymusic.com` - Jamf Pro MDM server
- `aoma-stage.smcdp-de.net` - AOMA stage (but cookies invalid without device enrollment)

---

## 📖 What Worked Before

**Previous Success**: User confirmed Playwright automation worked previously: "id did, before" [sic]

This suggests:
- Device WAS enrolled in Jamf MDM at some point
- Certificate authentication WAS working
- The enforcement of certificate/device requirements is **new** or **recently re-enabled**

---

## 🛠️ Scripts Status

### `scripts/aoma-stage-login.js` ✅
**Status**: Fully functional automation up to certificate modal
**Handles**:
- VPN detection
- Employee login button click
- Username/password filling
- 2FA waiting (HITL - Human-in-the-Loop)
- Jamf redirect detection and recovery
- Certificate page detection and navigation
- Login chain detection and home navigation
- Comprehensive logging with screenshots every 10 seconds

**Cannot Handle**:
- Certificate modal interaction (browser-level security)
- Device enrollment requirement bypass

### `scripts/aoma-manual-login-save.js` ✅
**Status**: Working for manual certificate handling
**Purpose**: Opens browser, lets user manually handle certificate modal and 2FA, saves cookies
**Timeout**: 10 minutes for manual authentication
**Usage**:
```bash
node scripts/aoma-manual-login-save.js
```

### `scripts/aoma-playwright-crawler.js` ✅
**Status**: Ready to crawl once authentication succeeds
**Purpose**: Uses saved cookies to crawl AOMA pages and store in vector database
**Blocked by**: Cannot get valid authentication cookies due to enrollment requirement

---

## 🔧 Admin Resolution Required

### For Stage Environment Admin

**Issue**: User cannot access AOMA stage due to certificate authentication failure.

**Error Message**:
```
Access to device.login.microsoftonline.com was denied
ERR_SSL_CLIENT_AUTH_SIGNATURE_FAILED
```

**Account**: `matt.carpenter.ext@sonymusic.com`

**Environment**: AOMA Stage (`https://aoma-stage.smcdp-de.net`)

**Request**: Please either:

1. **Option A - Exempt from Device Compliance** (Preferred for stage/test):
   - Exempt this account from Jamf MDM enrollment requirement for AOMA stage access
   - Or create test account that bypasses device compliance checks

2. **Option B - Provide Enrollment Instructions**:
   - Provide instructions to enroll Mac in Jamf Pro MDM
   - Ensure certificate authentication works after enrollment

**Additional Context**:
- VPN (GlobalProtect) is connected
- Username/password authentication works
- 2FA approval works
- Issue occurs at certificate authentication step
- This worked previously, suggesting recent policy change

---

## 📁 Related Files

### Authentication Scripts
- `scripts/aoma-stage-login.js` - Main automated login (Chromium + HITL 2FA)
- `scripts/aoma-manual-login-save.js` - Manual login with cookie saving
- `scripts/aoma-playwright-crawler.js` - Crawler using saved cookies
- `scripts/aoma-login-playwright.js` - Original working login script

### Services
- `src/services/aomaStageAuthenticator.ts` - Authentication service wrapper
- `src/services/aomaFirecrawlService.ts` - Firecrawl-based crawler service

### Configuration
- `.env.local` - Credentials (not in git)
- `tmp/aoma-stage-storage.json` - Saved Playwright storage state
- `tmp/aoma-cookie.txt` - Saved cookie header

### Documentation
- `context/firecrawl-v2-migration.md` - Firecrawl v2 API migration guide
- `docs/AOMA-STAGE-AUTHENTICATION-STATUS.md` - This file

### Debug Artifacts
- `tmp/auth-flow-end.png` - Screenshot after auth flow
- `tmp/check-*s.png` - Screenshots every 10 seconds during auth
- `tmp/jamf-redirect.png` - Screenshot of Jamf redirect
- `tmp/cert-redirect.png` - Screenshot of certificate page
- `tmp/reached-aoma.png` - Screenshot when reaching AOMA (but on login page)
- `tmp/final-authenticated.png` - Screenshot of "final" state

---

## 🎯 Path Forward

### Immediate Actions

1. ✅ **Documentation Complete** - This file captures all technical details
2. ⏳ **Admin Contact** - Escalate enrollment issue to AOMA stage admin
3. ⏳ **Wait for Resolution** - Cannot proceed until certificate auth works

### Once Admin Resolves

1. **Test Manual Login**:
   ```bash
   node scripts/aoma-manual-login-save.js
   ```
   - Verify certificate modal works or is bypassed
   - Verify cookies are saved at AOMA app page (not login servlet)

2. **Test Automated Login**:
   ```bash
   AAD_USERNAME=matt.carpenter.ext@sonymusic.com AAD_PASSWORD=Dalkey1_Lisbon2 \
   node scripts/aoma-stage-login.js
   ```
   - Verify 2FA flow works end-to-end
   - Verify session cookies are valid

3. **Test Crawler**:
   ```bash
   node scripts/aoma-playwright-crawler.js
   ```
   - Verify saved cookies work for crawling
   - Verify pages are scraped and stored in vector database

4. **Integrate with SIAM**:
   - Enable AOMA knowledge base crawling
   - Test AOMA chat intelligence with fresh data
   - Update documentation with successful authentication flow

---

## 📝 Notes

### What We Learned

1. **Certificate Authentication Cannot Be Automated** - Browser-level certificate selection is security feature that blocks automation
2. **Conditional Access Policies Changed** - Device compliance requirements appear to be newly enforced or re-enabled
3. **Multiple Redirect Scenarios** - Auth flow has many failure modes (Jamf, certificate reprocessing, login loop)
4. **Cookie Scope Matters** - Cookies saved at login servlet URL are invalid for app pages
5. **VPN is Mandatory** - GlobalProtect VPN must be connected or all requests fail

### Debugging Tips for Future Issues

1. Always capture screenshots every 10 seconds during auth flow
2. Log current URL at each step to trace redirect chain
3. Check cookie domains to identify where authentication ended
4. Look for `chain=Login` in URL as indicator of failed auth
5. Check for redirect to `DeviceAuthTls/reprocess` as certificate failure
6. Monitor for Jamf `jss.sonymusic.com` redirects

### Known Working Configuration

**From when it worked before**:
- Browser: Chromium (Playwright)
- VPN: GlobalProtect connected
- Account: `matt.carpenter.ext@sonymusic.com`
- 2FA: Microsoft Authenticator app approval
- Certificate: Device was enrolled in Jamf MDM (presumably)

---

## 🔗 Related Context

- **MAC Design System**: `src/styles/mac-design-system.css`
- **Testing Documentation**: `docs/TESTING_FUNDAMENTALS.md`
- **Production Testing**: `docs/PRODUCTION_TESTING.md`
- **Task Master**: `.taskmaster/tasks/tasks.json`

---

**Status Summary**: Authentication is blocked at certificate authentication step due to Microsoft Conditional Access policy requiring Jamf MDM enrollment. All automation scripts are ready and waiting for admin to resolve enrollment requirement. Once resolved, full AOMA knowledge base crawling can resume.
