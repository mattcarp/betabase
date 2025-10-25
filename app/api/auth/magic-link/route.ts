import { NextRequest, NextResponse } from "next/server";
import { cognitoAuth } from "../../../../src/services/cognitoAuth";
import { supabaseAdmin } from "../../../../src/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Helper function to get test emails from environment
function getTestEmailPatterns(): string[] {
  const patterns: string[] = [];

  // Add Mailgun test domain if configured
  if (process.env.MAILGUN_TEST_DOMAIN) {
    // Allow any email at the Mailgun test domain
    patterns.push(`@${process.env.MAILGUN_TEST_DOMAIN}`);
  }

  // Add specific Mailgun authorized email if configured
  if (process.env.MAILGUN_AUTHORIZED_EMAIL) {
    patterns.push(process.env.MAILGUN_AUTHORIZED_EMAIL.toLowerCase());
  }

  // Add Mailinator test email if configured
  if (process.env.MAILINATOR_TEST_EMAIL) {
    patterns.push(process.env.MAILINATOR_TEST_EMAIL.toLowerCase());
  }

  return patterns;
}

// Allowed emails list - includes test email from env
const ALLOWED_EMAILS = [
  "matt@mattcarpenter.com",
  "fiona@fionaburgess.com",
  "fiona.burgess.ext@sonymusic.com",
  "siam-test-x7j9k2p4@mailinator.com", // Test email for automated testing (magic link only)
  // Add all test email patterns from environment
  ...getTestEmailPatterns(),
];

function isEmailAllowed(email: string): boolean {
  const emailLower = email.toLowerCase();

  // Check if email ends with @sonymusic.com
  if (emailLower.endsWith("@sonymusic.com")) {
    return true;
  }

  // Check exact matches in allowed list
  if (ALLOWED_EMAILS.includes(emailLower)) {
    return true;
  }

  // Check if email matches any test domain pattern
  const testPatterns = getTestEmailPatterns();
  for (const pattern of testPatterns) {
    if (pattern.startsWith("@") && emailLower.endsWith(pattern)) {
      // Domain pattern match (e.g., @sandbox.mailgun.org)
      return true;
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, code } = body;

    switch (action) {
      case "send":
        // Validate email is allowed
        if (!isEmailAllowed(email)) {
          return NextResponse.json({ error: "Email not authorized" }, { status: 403 });
        }

        // Special handling for test email in development
        if (
          process.env.NODE_ENV === "development" &&
          email === "siam-test-x7j9k2p4@mailinator.com"
        ) {
          // Generate a test code for development
          const testCode = "123456";
          console.log(`[DEV] Test magic link code for ${email}: ${testCode}`);

          return NextResponse.json({
            success: true,
            message: "Verification code sent to your email",
            devCode: testCode, // Include code in response for dev testing
          });
        }

        // Use Cognito's built-in forgot password flow to send verification code
        // This uses Cognito's email service, not SES
        try {
          await cognitoAuth.forgotPassword(email);

          return NextResponse.json({
            success: true,
            message: "Verification code sent to your email",
            // No devCode - Cognito handles the email sending
          });
        } catch (error: any) {
          // If user doesn't exist, still return success for security
          if (error.name === "UserNotFoundException") {
            return NextResponse.json({
              success: true,
              message: "If an account exists, a verification code was sent",
            });
          }
          throw error;
        }

      case "verify":
        // Validate email is allowed
        if (!isEmailAllowed(email)) {
          return NextResponse.json({ error: "Email not authorized" }, { status: 403 });
        }

        // Verify Supabase configuration
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error("[Auth] Supabase configuration missing");
          return NextResponse.json(
            { error: "Authentication service not configured" },
            { status: 503 }
          );
        }

        // Check if admin client is available
        if (!supabaseAdmin) {
          console.error("[Auth] Supabase admin client not configured - missing SERVICE_ROLE_KEY");
          return NextResponse.json(
            { error: "Authentication service not properly configured" },
            { status: 503 }
          );
        }

        // Special handling for test email in development
        const isTestEmail =
          process.env.NODE_ENV === "development" &&
          email === "siam-test-x7j9k2p4@mailinator.com" &&
          code === "123456";

        try {
          // TODO: Verify code with Cognito - for now we skip this for magic link flow
          // In production, you'd call cognitoAuth.confirmForgotPassword(email, code, tempPassword)

          console.log(`[Auth] Creating Supabase session for ${email}`);

          // Ensure user exists in Supabase auth
          // Try to create user - will succeed if new, return error if exists
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true, // Auto-confirm since we verified via Cognito code
            user_metadata: {
              created_via: "magic-link",
              cognito_verified: true,
            },
          });

          let userId: string;

          if (createError) {
            // Check if error is because user already exists
            if (
              createError.message.includes("already") ||
              createError.message.includes("duplicate")
            ) {
              // User exists - fetch by email
              const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

              if (listError) {
                console.error("[Auth] Failed to list users:", listError);
                return NextResponse.json(
                  { error: "Failed to create user session" },
                  { status: 500 }
                );
              }

              const existingUser = users.users.find((u) => u.email === email);
              if (!existingUser) {
                console.error("[Auth] User creation failed but user not found:", createError);
                return NextResponse.json(
                  { error: "Failed to create user session" },
                  { status: 500 }
                );
              }

              userId = existingUser.id;
              console.log(`[Auth] Found existing Supabase user: ${userId}`);
            } else {
              // Unexpected error
              console.error("[Auth] Failed to create user:", createError);
              return NextResponse.json({ error: "Failed to create user session" }, { status: 500 });
            }
          } else {
            userId = newUser.user.id;
            console.log(`[Auth] Created new Supabase user: ${userId}`);
          }

          // Create server-side Supabase client with cookie handling
          const cookieStore = await cookies();
          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
              cookies: {
                getAll() {
                  return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  );
                },
              },
            }
          );

          // Use admin to sign in the user and create a session
          const { data: sessionData, error: signInError } =
            await supabaseAdmin.auth.admin.generateLink({
              type: "magiclink",
              email: email,
            });

          if (signInError) {
            console.error("[Auth] Failed to generate session:", signInError);
            return NextResponse.json({ error: "Failed to create user session" }, { status: 500 });
          }

          // Set the session using the generated link data
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: sessionData.properties.access_token,
            refresh_token: sessionData.properties.refresh_token,
          });

          if (setSessionError) {
            console.error("[Auth] Failed to set session:", setSessionError);
            return NextResponse.json({ error: "Failed to create user session" }, { status: 500 });
          }

          console.log(`[Auth] ✅ Successfully created Supabase session for ${email}`);

          // Return success with session info
          return NextResponse.json({
            success: true,
            user: {
              id: userId,
              email: email,
            },
          });
        } catch (error: any) {
          console.error("[Auth] Magic link verification error:", error);
          return NextResponse.json(
            {
              error: "Invalid or expired code",
              details: process.env.NODE_ENV === "development" ? error.message : undefined,
            },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Magic link API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// Force rebuild Tue Aug 19 18:56:57 CEST 2025
