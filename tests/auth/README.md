# Email Testing for SIAM

This directory contains email integration tests for the SIAM magic link authentication flow using Mailinator.

## 🚀 Quick Start

1. **Test Email Configuration:**
   - Test email: `siam-test-x7j9k2p4@mailinator.com`
   - This email is whitelisted in Cognito and the application

2. **Run tests:**
   ```bash
   npm run test:e2e tests/auth/magic-link-auth.spec.ts
   ```

## 📋 How It Works

### 1. Mailinator Integration

Mailinator provides a public inbox for testing:

- No API key required for basic testing
- Public inbox accessible at: https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4
- Verification codes can be retrieved from the inbox

### 2. Test Flow

1. User enters test email address
2. System sends magic link with 6-digit code
3. Test retrieves code from Mailinator inbox
4. Test enters code to complete authentication

### 3. Allowed Email Patterns

The following emails are whitelisted:

- `matt@mattcarpenter.com`
- `fiona.burgess.ext@sonymusic.com`
- `fiona@fionaburgess.com`
- `claude@test.siam.ai`
- `*@sonymusic.com`
- `siam-test-x7j9k2p4@mailinator.com` (primary test email)

## 🔒 Security Notes

- Mailinator inboxes are PUBLIC - never use for sensitive data
- Only use for automated testing
- The test email is specifically configured for testing only
- Production uses proper email providers with security

## 🧪 Available Test Files

- `magic-link-auth.spec.ts` - Main authentication flow test
- `test-user-auth.spec.ts` - Test user authentication
- Additional test files for various auth scenarios
