#!/bin/bash

# Fix script to properly create a test user that works with forgotPassword flow

set -e

echo "🔧 Fixing Cognito test user for magic link flow"
echo "=============================================="

# Configuration
USER_POOL_ID="us-east-2_A0veaJRLo"
TEST_EMAIL="siam-test-x7j9k2p4@mailinator.com"
REGION="us-east-2"

# First, delete the existing user if it exists
echo "🗑️  Removing existing user (if any)..."
aws cognito-idp admin-delete-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$TEST_EMAIL" \
    --region "$REGION" 2>/dev/null || echo "  User doesn't exist or already deleted"

# Wait a moment for deletion to complete
sleep 2

# Create user using sign-up flow (more compatible with forgotPassword)
echo "✨ Creating user via admin API..."
aws cognito-idp admin-create-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$TEST_EMAIL" \
    --user-attributes \
        Name=email,Value="$TEST_EMAIL" \
        Name=email_verified,Value=true \
    --message-action SUPPRESS \
    --region "$REGION"

# Get the actual username (might be different from email)
USERNAME=$(aws cognito-idp list-users \
    --user-pool-id "$USER_POOL_ID" \
    --filter "email = \"$TEST_EMAIL\"" \
    --region "$REGION" \
    --query 'Users[0].Username' \
    --output text)

echo "  Created with username: $USERNAME"

# Set a permanent password to move to CONFIRMED state
echo "🔐 Setting permanent password..."
aws cognito-idp admin-set-user-password \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --password "MagicTest2024!Pass" \
    --permanent \
    --region "$REGION"

# Verify the user is confirmed
echo "✅ Verifying user status..."
STATUS=$(aws cognito-idp admin-get-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$USERNAME" \
    --region "$REGION" \
    --query 'UserStatus' \
    --output text)

if [[ "$STATUS" == "CONFIRMED" ]]; then
    echo "✅ SUCCESS! User is CONFIRMED and ready for testing"
    echo ""
    echo "📧 Test Email: $TEST_EMAIL"
    echo "🆔 Username: $USERNAME"
    echo "🔗 Mailinator: https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4"
else
    echo "⚠️  User status is: $STATUS (expected CONFIRMED)"
fi

# Test that forgotPassword works
echo ""
echo "🧪 Testing forgotPassword flow..."
aws cognito-idp forgot-password \
    --client-id "5c6ll37299p351to549lkg3o0d" \
    --username "$TEST_EMAIL" \
    --region "$REGION" 2>&1 | head -5 || {
    echo "⚠️  forgotPassword test failed - this might be why magic link isn't working"
    echo "  The user might need to log in successfully once before forgotPassword works"
}

echo ""
echo "✅ Setup complete! The test user should now work with magic links."