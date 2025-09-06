# AWS Cognito Configuration for SIAM

## Current Configuration

- **User Pool ID**: `us-east-2_A0veaJRLo`
- **Client ID**: `5c6ll37299p351to549lkg3o0d`
- **Region**: `us-east-2`

## Required AWS Console Settings

### 1. Email Domain Restrictions (CRITICAL SECURITY)

⚠️ **IMPORTANT**: Do NOT allow entire @mailinator.com domain - it's a public service!

If you have a Lambda trigger for pre-signup validation, update it to allow ONLY the specific test email:

```javascript
// SECURE Lambda function - only specific emails allowed
exports.handler = async (event) => {
  const email = event.request.userAttributes.email.toLowerCase();

  // Allowed domain for Sony employees
  const allowedDomains = ["@sonymusic.com"];

  // Specific whitelisted emails (NO WILDCARDS!)
  const allowedEmails = [
    "matt@mattcarpenter.com",
    "claude@test.siam.ai",
    "fiona.burgess.ext@sonymusic.com",
    "fiona@fionaburgess.com",
    "siam-test-x7j9k2p4@mailinator.com", // ONLY this specific test email
  ];

  const isAllowed =
    allowedDomains.some((domain) => email.endsWith(domain)) ||
    allowedEmails.includes(email);

  if (!isAllowed) {
    throw new Error("Registration restricted to authorized domains");
  }

  return event;
};
```

### 2. Email Configuration Settings

Navigate to: **AWS Cognito Console > User Pools > us-east-2_A0veaJRLo > Messaging**

Ensure these settings:

- **Email provider**: Amazon SES (recommended) or Cognito default
- **FROM email address**: noreply@yourdomain.com
- **Reply-to address**: support@yourdomain.com

### 3. User Pool Policies

Navigate to: **AWS Cognito Console > User Pools > us-east-2_A0veaJRLo > Sign-in experience**

Recommended settings for testing:

- **User name requirements**: Email address
- **Case sensitivity**: Not case sensitive
- **Password policy**:
  - Minimum length: 8
  - Require lowercase: Yes
  - Require uppercase: Yes
  - Require numbers: Yes
  - Require symbols: Yes

### 4. App Client Settings

Navigate to: **AWS Cognito Console > User Pools > us-east-2_A0veaJRLo > App integration > App clients**

For client `5c6ll37299p351to549lkg3o0d`:

- **Authentication flows**:
  - ✅ ALLOW_USER_SRP_AUTH
  - ✅ ALLOW_REFRESH_TOKEN_AUTH
  - ✅ ALLOW_CUSTOM_AUTH (if using passwordless)
- **Prevent user existence errors**: Enabled (recommended)

### 5. Message Templates

Navigate to: **AWS Cognito Console > User Pools > us-east-2_A0veaJRLo > Messaging > Message templates**

Update the verification email template:

```
Subject: SIAM - Your verification code

Message:
Your SIAM verification code is: {####}

This code expires in 15 minutes.

If you didn't request this code, please ignore this email.
```

### 6. MFA and Verification

Navigate to: **AWS Cognito Console > User Pools > us-east-2_A0veaJRLo > Sign-in experience**

- **MFA enforcement**: Optional or Off (for testing)
- **Account recovery**: Email only
- **User account verification**:
  - ✅ Require email verification
  - Verification message: Send code
  - Allow users to sign in with unverified email: No

## Testing with Mailinator

### Why Mailinator?

- **No authentication required** - Public inboxes are fully accessible
- **Instant delivery** - Emails arrive immediately
- **API access** - Can fetch emails programmatically
- **Perfect for CI/CD** - Fully automated testing

### Test Flow

1. Generate unique email: `siam-test-{timestamp}@mailinator.com`
2. Request magic link/verification code
3. Fetch from Mailinator: `https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-{timestamp}`
4. Extract 6-digit code
5. Complete authentication

### Running Automated Tests

```bash
# Run the Mailinator test
node test-mailinator-auth.js

# The test will:
# 1. Generate a unique @mailinator.com email
# 2. Request verification code from SIAM
# 3. Poll Mailinator API for the email
# 4. Extract and enter the code
# 5. Complete authentication
```

## Security Considerations

⚠️ **IMPORTANT**: Mailinator emails are PUBLIC!

- Never use for production or sensitive data
- Only use for automated testing
- Consider removing @mailinator.com from allowed domains in production

## Troubleshooting

### Email not arriving at Mailinator

1. Check AWS SES is not in sandbox mode
2. Verify Cognito can send to any email address
3. Check CloudWatch logs for Lambda errors

### "Registration restricted" error

1. Update pre-signup Lambda trigger
2. Check allowed domains in Lambda function
3. Verify email format is correct

### Verification code not working

1. Check code expiration time (default 24 hours)
2. Verify message template format
3. Ensure code is 6 digits

## Environment Variables

Ensure these are set in Railway:

```env
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo
NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d
NEXT_PUBLIC_AWS_REGION=us-east-2
```

## Contact

For AWS Cognito access or configuration changes, contact your AWS administrator.
