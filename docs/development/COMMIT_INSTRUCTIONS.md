# Git Commit Instructions - Hidden Password Field Feature

## Files to Commit

The following files need to be committed:

### Modified Files:

- `src/components/auth/LoginForm.tsx` - Added hidden password field for test automation

### New Files:

- `tests/auth/test-user-auth.spec.ts` - Playwright test suite
- `tests/helpers/auth.ts` - Authentication helper functions
- `testsprite_tests/hidden_password_field_test_plan.json` - TestSprite test plan
- `testsprite_tests/run_hidden_field_tests.js` - TestSprite test runner

## Manual Git Commands to Run

```bash
# 1. Kill any stuck git processes
pkill -9 git

# 2. Remove lock file
rm -f .git/index.lock

# 3. Reset git config to fix any issues
git config --unset core.fsmonitor
git config core.untrackedCache false
git config core.preloadindex false

# 4. Force add the files
git add -f src/components/auth/LoginForm.tsx
git add -f tests/auth/test-user-auth.spec.ts
git add -f tests/helpers/auth.ts
git add -f testsprite_tests/*.json
git add -f testsprite_tests/*.js

# 5. Commit with message
git commit -m "✨ Add hidden password field for Playwright test authentication

- Added data-test-id='login-password-hidden' to LoginForm
- Field syncs with visible password for test account claude@test.siam.ai
- Created comprehensive Playwright tests in tests/auth/
- Added auth helper utilities in tests/helpers/
- Created TestSprite validation suite
- Enables automated testing without magic links

Test account: claude@test.siam.ai
Password field appears automatically when test email is entered
Hidden field remains invisible to regular users"

# 6. Push to main
git push origin main --force-with-lease

# 7. Deploy to Railway (if needed)
railway up --detach
```

## What This Feature Does

1. **Hidden Password Field**: Invisible field with `data-test-id="login-password-hidden"` that Playwright can target
2. **Auto-Detection**: When `claude@test.siam.ai` is entered, password mode activates automatically
3. **Field Sync**: Hidden and visible password fields sync their values
4. **No User Impact**: Regular users still see only the magic link option

## Testing After Commit

Once pushed, test with:

```bash
# Quick test
node testsprite-quick-test.js

# Full Playwright suite
npx playwright test tests/auth/test-user-auth.spec.ts

# TestSprite validation
cd testsprite_tests && node run_hidden_field_tests.js
```

## Deployment Verification

Check deployment at: https://thebetabase.com

- Hidden field should be present in HTML (invisible)
- Test account should trigger password mode
- Regular users should see magic link only
