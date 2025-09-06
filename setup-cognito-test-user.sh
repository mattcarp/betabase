#!/bin/bash

# Setup script for creating and confirming a test user in AWS Cognito
# This ensures the user can receive magic link emails

set -e

echo "🔐 Setting up Cognito test user for automated testing"
echo "================================================="

# Configuration
USER_POOL_ID="us-east-2_A0veaJRLo"
TEST_EMAIL="siam-test-x7j9k2p4@mailinator.com"
TEST_USERNAME="siam-test-x7j9k2p4"
REGION="us-east-2"

echo ""
echo "📋 Configuration:"
echo "  User Pool: $USER_POOL_ID"
echo "  Test Email: $TEST_EMAIL"
echo "  Username: $TEST_USERNAME"
echo "  Region: $REGION"
echo ""

# Function to check if user exists
check_user_exists() {
    aws cognito-idp admin-get-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_USERNAME" \
        --region "$REGION" \
        2>/dev/null || echo "NOT_FOUND"
}

# Function to create user
create_user() {
    echo "✨ Creating new user..."
    
    # Create user with temporary password
    aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_USERNAME" \
        --user-attributes \
            Name=email,Value="$TEST_EMAIL" \
            Name=email_verified,Value=true \
        --message-action SUPPRESS \
        --region "$REGION" \
        --temporary-password "TempPass123!" \
        2>/dev/null || {
            echo "⚠️  User might already exist, checking status..."
        }
}

# Function to confirm user
confirm_user() {
    echo "✅ Setting user status to CONFIRMED..."
    
    # Set permanent password to bypass FORCE_CHANGE_PASSWORD state
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_USERNAME" \
        --password "TestPass123!" \
        --permanent \
        --region "$REGION" \
        2>/dev/null || {
            echo "⚠️  Could not set password"
        }
    
    # Update user attributes to ensure email is verified
    aws cognito-idp admin-update-user-attributes \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_USERNAME" \
        --user-attributes \
            Name=email_verified,Value=true \
        --region "$REGION" \
        2>/dev/null || {
            echo "⚠️  Could not update attributes"
        }
}

# Function to enable user
enable_user() {
    echo "🔓 Enabling user..."
    
    aws cognito-idp admin-enable-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_USERNAME" \
        --region "$REGION" \
        2>/dev/null || {
            echo "⚠️  User might already be enabled"
        }
}

# Main execution
echo "🔍 Checking if user exists..."
USER_STATUS=$(check_user_exists)

if [[ "$USER_STATUS" == "NOT_FOUND" ]]; then
    echo "❌ User does not exist"
    create_user
    confirm_user
    enable_user
else
    echo "✅ User exists, checking status..."
    
    # Get user details
    USER_DETAILS=$(aws cognito-idp admin-get-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$TEST_USERNAME" \
        --region "$REGION" \
        2>/dev/null)
    
    # Extract user status
    USER_STATE=$(echo "$USER_DETAILS" | grep -o '"UserStatus": "[^"]*"' | cut -d'"' -f4)
    EMAIL_VERIFIED=$(echo "$USER_DETAILS" | grep -o '"email_verified", "Value": "[^"]*"' | cut -d'"' -f6)
    
    echo "  Current Status: $USER_STATE"
    echo "  Email Verified: $EMAIL_VERIFIED"
    
    # Update user if needed
    if [[ "$USER_STATE" != "CONFIRMED" ]] || [[ "$EMAIL_VERIFIED" != "true" ]]; then
        echo "⚠️  User needs configuration updates"
        confirm_user
        enable_user
    else
        echo "✅ User is already properly configured"
    fi
fi

# Final verification
echo ""
echo "🔍 Final verification..."
FINAL_STATUS=$(aws cognito-idp admin-get-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "$TEST_USERNAME" \
    --region "$REGION" \
    --query 'UserStatus' \
    --output text \
    2>/dev/null || echo "ERROR")

if [[ "$FINAL_STATUS" == "CONFIRMED" ]]; then
    echo "✅ SUCCESS! Test user is ready for automated testing"
    echo ""
    echo "📧 Test Email: $TEST_EMAIL"
    echo "🔗 Mailinator Inbox: https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4"
    echo ""
    echo "Next steps:"
    echo "1. Run: npm test tests/auth/mailinator-browser-test.spec.ts"
    echo "2. The test will automatically retrieve the magic link code from Mailinator"
else
    echo "❌ ERROR: User status is $FINAL_STATUS (expected: CONFIRMED)"
    echo ""
    echo "Manual fix required:"
    echo "1. Go to AWS Cognito Console"
    echo "2. Navigate to User Pool: $USER_POOL_ID"
    echo "3. Find user: $TEST_USERNAME"
    echo "4. Set status to CONFIRMED"
    echo "5. Set email_verified to true"
fi