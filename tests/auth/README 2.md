# Mailgun Email Testing for SIAM

This directory contains Mailgun integration for automated testing of the SIAM magic link authentication flow.

## 🚀 Quick Start

1. **Run the setup script:**

   ```bash
   ./scripts/setup-mailgun-testing.sh
   ```

2. **Configure Mailgun:**
   - Create a Mailgun account at https://mailgun.com
   - Add a test domain (e.g., `mg.siam-test.com`)
   - Set up a route to store all test emails
   - Add your credentials to `.env.test`

3. **Run tests:**
   ```bash
   npm run test:e2e tests/auth/magic-link-mailgun.spec.ts
   ```

## 📋 Setup Details

### 1. Mailgun Domain Configuration

Create a subdomain specifically for testing:

- Domain: `mg.your-domain.com`
- Purpose: Isolated testing environment
- DNS: Follow Mailgun's DNS setup guide

### 2. Route Configuration

Create a route in Mailgun to catch all test emails:

- **Priority:** 0
- **Expression:** `match_recipient(".*@mg.your-domain.com")`
- **Actions:**
  - ✅ Store (keeps email for 3 days)
  - ✅ Stop (prevents further processing)

### 3. Environment Variables

Add to `.env.test`:

```env
MAILGUN_API_KEY=your-private-api-key
MAILGUN_TEST_DOMAIN=mg.your-domain.com
MAILGUN_REGION=us  # or 'eu'
```

### 4. Update Allowed Emails

In `app/api/auth/magic-link/route.ts`, add your test domain:

```typescript
const ALLOWED_EMAILS = [
  // ... existing emails
  // Add pattern for Mailgun test emails
  ...getAllTestEmails(), // Helper function to include test domains
];

function getAllTestEmails(): string[] {
  const testDomain = process.env.MAILGUN_TEST_DOMAIN;
  return testDomain ? [`*@${testDomain}`] : [];
}
```

## 🧪 Test Structure

### MailgunTestHelper

Located in `tests/helpers/mailgun-helper.ts`, provides:

- `generateTestEmail()` - Creates unique test email addresses
- `waitForMagicLinkEmail()` - Polls Mailgun for incoming emails
- `extractMagicLinkCode()` - Extracts 6-digit codes from emails
- `extractMagicLinkUrl()` - Extracts magic link URLs (if using URL-based auth)

### Test Flow

1. **Generate unique test email** for each test run
2. **Request magic link** through the app
3. **Poll Mailgun API** to retrieve the email
4. **Extract verification code** from email content
5. **Complete authentication** with the code

### Example Test

```typescript
test("complete magic link flow", async ({ page }) => {
  const mailgun = new MailgunTestHelper();
  const testEmail = mailgun.generateTestEmail();

  // Request magic link
  await page.fill('input[type="email"]', testEmail);
  await page.click('button[type="submit"]');

  // Retrieve code from Mailgun
  const email = await mailgun.waitForMagicLinkEmail(testEmail);
  const code = mailgun.extractMagicLinkCode(email.bodyHtml);

  // Complete authentication
  await page.fill('input[type="text"]', code);
  await page.click('button[type="submit"]');

  // Verify login success
  await expect(page).toHaveURL(/.*dashboard.*/);
});
```

## 🔧 Troubleshooting

### Email Not Received

1. **Check route configuration** - Ensure the route is active and matches your domain
2. **Verify DNS** - Confirm DNS records are properly configured
3. **Check allowed emails** - Ensure test domain is in ALLOWED_EMAILS
4. **Review logs** - Check Mailgun logs at https://app.mailgun.com/app/logs

### API Connection Issues

1. **Verify API key** - Ensure you're using the private API key, not public
2. **Check region** - Confirm you're using the correct region (us/eu)
3. **Test connection:**
   ```bash
   curl -s --user 'api:YOUR_API_KEY' \
     https://api.mailgun.net/v3/YOUR_DOMAIN/events?limit=1
   ```

### Test Failures

1. **Increase timeout** - Email delivery can take a few seconds
2. **Check email content** - Verify the code extraction regex matches your email format
3. **Review Cognito/SES** - Ensure AWS services are configured to send to Mailgun domain

## 🎯 Best Practices

1. **Use unique emails** - Generate fresh email for each test to avoid conflicts
2. **Set appropriate timeouts** - Allow 15-30 seconds for email delivery
3. **Clean test data** - Mailgun auto-deletes after 3 days, but consider cleanup
4. **Parallel testing** - Each test should use its own unique email address
5. **Monitor usage** - Keep track of Mailgun API calls to stay within limits

## 📊 Advantages over Mailinator

| Feature         | Mailgun       | Mailinator        |
| --------------- | ------------- | ----------------- |
| **Privacy**     | Private inbox | Public inbox      |
| **API Access**  | Full API      | Limited free tier |
| **Reliability** | High          | Variable          |
| **Speed**       | Fast (1-2s)   | Can be slow       |
| **Control**     | Complete      | Limited           |
| **Security**    | API key auth  | Public access     |
| **Storage**     | 3 days        | Limited           |
| **Rate Limits** | Generous      | Restrictive       |

## 🔗 Resources

- [Mailgun Dashboard](https://app.mailgun.com)
- [Mailgun API Docs](https://documentation.mailgun.com)
- [Playwright Docs](https://playwright.dev)
- [SIAM Auth Flow](../app/api/auth/magic-link/route.ts)

## 📝 Notes

- Mailgun stores messages for 3 days automatically
- Test emails are isolated from production
- Each test run uses a unique email to prevent conflicts
- The helper includes retry logic for reliability
- Supports both code-based and URL-based magic links

## 🤝 Contributing

When adding new auth tests:

1. Use the MailgunTestHelper for email retrieval
2. Generate unique test emails for each test
3. Handle timeouts gracefully
4. Add appropriate error messages for debugging
