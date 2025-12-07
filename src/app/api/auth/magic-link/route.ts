import { NextRequest, NextResponse } from "next/server";
import { cognitoAuth } from "@/services/cognitoAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

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
          // Verify the code with Cognito first (unless it's the dev test email)
          if (!isTestEmail) {
            console.log(`[Auth] Verifying code with Cognito for ${email}`);
            try {
              // Generate temp password for Cognito verification
              const cognitoTempPassword = crypto.randomBytes(16).toString("hex") + "Aa1!";
              await cognitoAuth.confirmForgotPassword(email, code, cognitoTempPassword);
              console.log(`[Auth] Code verified successfully with Cognito`);
            } catch (cognitoError: any) {
              console.error("[Auth] ERROR: Cognito code verification failed:", cognitoError);
              return NextResponse.json(
                {
                  error: "Invalid or expired code",
                  details:
                    process.env.NODE_ENV === "development" ? cognitoError.message : undefined,
                },
                { status: 400 }
              );
            }
          }

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
            console.error("[Auth] Create user error:", createError);
            // Check if error is because user already exists
            if (
              createError.message.includes("already") ||
              createError.message.includes("duplicate")
            ) {
              // User exists - fetch by email
              console.log("[Auth] User already exists, fetching existing user...");
              const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

              if (listError) {
                console.error("[Auth] ERROR: Failed to list users:", listError);
                return NextResponse.json(
                  { error: "Failed to list users from Supabase" },
                  { status: 500 }
                );
              }

              const existingUser = users.users.find((u) => u.email === email);
              if (!existingUser) {
                console.error(
                  "[Auth] ERROR: User creation failed but user not found in list:",
                  createError
                );
                return NextResponse.json(
                  { error: "User not found after creation failure" },
                  { status: 500 }
                );
              }

              userId = existingUser.id;
              console.log(`[Auth] Found existing Supabase user: ${userId}`);
            } else {
              // Unexpected error
              console.error("[Auth] ERROR: Unexpected error creating user:", createError);
              console.error("[Auth] Error name:", createError.name);
              console.error("[Auth] Error message:", createError.message);
              return NextResponse.json(
                {
                  error: "Failed to create user in Supabase",
                  details: process.env.NODE_ENV === "development" ? createError.message : undefined,
                },
                { status: 500 }
              );
            }
          } else {
            userId = newUser.user.id;
            console.log(`[Auth] Created new Supabase user: ${userId}`);
          }

          // Create server-side Supabase client with cookie handling
          let cookieStore;
          try {
            cookieStore = await cookies();
          } catch (cookieError) {
            console.error("[Auth] Failed to get cookies:", cookieError);
            return NextResponse.json({ error: "Failed to initialize session" }, { status: 500 });
          }

          const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
              cookies: {
                getAll() {
                  return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                  try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                      cookieStore.set(name, value, options)
                    );
                  } catch (error) {
                    console.error("[Auth] Failed to set cookies:", error);
                  }
                },
              },
            }
          );

          // Create a temporary password and sign in to get real session tokens
          // This is the proper way to create an authenticated session programmatically
          const temporaryPassword = crypto.randomBytes(32).toString("hex");

          console.log("[Auth] Setting temporary password for user...");
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: temporaryPassword,
          });

          if (updateError) {
            console.error("[Auth] ERROR: Failed to set temporary password:", updateError);
            console.error("[Auth] ERROR details:", {
              message: updateError.message,
              name: updateError.name,
              status: (updateError as any).status,
              code: (updateError as any).code,
            });
            return NextResponse.json(
              {
                error: "Failed to prepare session",
                details:
                  process.env.NODE_ENV === "development"
                    ? `${updateError.message} (${updateError.name})`
                    : undefined,
              },
              { status: 500 }
            );
          }

          // Now sign in with the temporary password to get real session tokens
          console.log("[Auth] Signing in with temporary password...");
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: temporaryPassword,
          });

          if (signInError || !signInData.session) {
            console.error("[Auth] ERROR: Failed to sign in:", signInError);
            return NextResponse.json(
              {
                error: "Failed to create session",
                details: process.env.NODE_ENV === "development" ? signInError?.message : undefined,
              },
              { status: 500 }
            );
          }

          console.log("[Auth] Session created successfully");
          console.log(`[Auth] ✅ Returning valid session tokens to client for ${email}`);

          // Return the real session tokens to the client
          return NextResponse.json({
            success: true,
            user: {
              id: userId,
              email: email,
            },
            session: {
              access_token: signInData.session.access_token,
              refresh_token: signInData.session.refresh_token,
            },
          });
        } catch (error: any) {
          console.error("[Auth] Magic link verification error:", error);
          console.error("[Auth] Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack?.substring(0, 500),
          });
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
