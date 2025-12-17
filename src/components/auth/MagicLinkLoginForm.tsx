"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from 'zod/v3';
// import { toast } from "sonner";
const toast = {
  success: (msg: string, _options?: any) => console.log("✅", msg),
  error: (msg: string, _options?: any) => console.error("❌", msg),
  info: (msg: string, _options?: any) => console.info("ℹ️", msg),
};
import { Button } from "../ui/button";
import { Input } from "../ui/input";
// import { Label } from "../ui/label"; // Unused - keeping for future use
import { /* Loader2, */ Mail, CheckCircle } from "lucide-react";
import { getBuildInfo, getFormattedBuildTime } from "../../utils/buildInfo";
import { BetabaseLogo as SiamLogo } from "../ui/BetabaseLogo";
import { Field, FieldLabel /* FieldDescription */ } from "../ui/field";
import { Spinner } from "../ui/spinner";

interface MagicLinkLoginFormProps {
  onLoginSuccess: () => void;
}

// FIONA P0 FIX: Magic Link Authentication Schema
const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  // No client-side validation of allowed emails - let the server handle it securely
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

export const MagicLinkLoginForm: React.FC<MagicLinkLoginFormProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [devCode, setDevCode] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
  }, []);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
    },
  });

  const codeForm = useForm<CodeFormData>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Build info for footer
  const buildInfo = getBuildInfo();

  const sendMagicLink = async (data: EmailFormData, retryCount = 0) => {
    setCurrentEmail(data.email);
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "send",
          email: data.email,
        }),
      });

      // Handle server errors (502, 503, etc) with retry
      if (response.status >= 500) {
        if (retryCount < 2) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `Server error ${response.status}, retrying... (attempt ${retryCount + 2}/3)`
            );
          }
          toast.info("Server temporarily unavailable, retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return sendMagicLink(data, retryCount + 1);
        }
        throw new Error("Server is temporarily unavailable. Please try again in a moment.");
      }

      // Try to parse JSON response
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        // Server returned non-JSON (likely an error page)
        console.error("Server returned non-JSON response:", response.status, response.statusText);
        if (response.status === 405) {
          throw new Error("Method not allowed. The server configuration may have an issue.");
        }
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(result.error || "Failed to send magic link");
      }

      // Only transition to code step if request was successful
      setCurrentEmail(data.email);
      setStep("code");

      // In dev mode, show the code for testing
      if (result.devCode) {
        setDevCode(result.devCode);
        toast.success(`Magic link sent! Dev code: ${result.devCode}`, {
          duration: 10000,
        });
      } else {
        toast.success("Magic link sent! Check your email for the verification code.", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Send magic link error:", error);
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast.error("Unable to connect to the server. Please check your internet connection.");
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to send magic link");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (data: CodeFormData, retryCount = 0) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          email: currentEmail,
          code: data.code,
        }),
      });

      // Handle server errors (502, 503, etc) with retry
      if (response.status >= 500) {
        if (retryCount < 2) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              `Server error ${response.status}, retrying... (attempt ${retryCount + 2}/3)`
            );
          }
          toast.info("Server temporarily unavailable, retrying...");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          return verifyCode(data, retryCount + 1);
        }
        throw new Error("Server is temporarily unavailable. Please try again in a moment.");
      }

      // Try to parse JSON response
      let result;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        // Server returned non-JSON (likely an error page)
        console.error("Server returned non-JSON response:", response.status, response.statusText);
        throw new Error(`Server error (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(result.error || "Invalid verification code");
      }

      // Set the Supabase session with the tokens returned from the server
      if (result.session) {
        const supabaseUrl =
          process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kfxetwuuzljhybfgmpuc.supabase.co";
        const supabaseAnonKey =
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtmeGV0d3V1emxqaHliZmdtcHVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyOTYzMzMsImV4cCI6MjA1MTg3MjMzM30.2doKvph3M-JltbRy-RpqmglECqqivqbakwzdTloQBxg";

        const { createBrowserClient } = await import("@supabase/ssr");
        const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (sessionError) {
          console.error("Failed to set Supabase session:", sessionError);
          throw new Error("Failed to establish session. Please try again.");
        }

        if (process.env.NODE_ENV === "development") {
          console.log("✅ Supabase session established successfully");
        }
      }

      toast.success("Login successful!");
      onLoginSuccess();
    } catch (error) {
      console.error("Verify code error:", error);
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        toast.error("Unable to connect to the server. Please check your internet connection.");
      } else {
        toast.error(error instanceof Error ? error.message : "Invalid code. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration issues
  if (!mounted) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Spinner className="mx-auto h-8 w-8 text-motiff-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8" suppressHydrationWarning>
      {/* Header Section */}
      <div className="text-center">
        {/* SIAM Logo/Brand */}
        <div className="mb-8">
          <div className="betabase-logo-wrapper mb-6">
            <SiamLogo size="3xl" variant="icon" className="drop-shadow-2xl" />
          </div>
          <h1 className="mac-heading mac-display-text mb-2">The Betabase</h1>
          <p className="mac-body text-gray-300">yup. it's back.</p>
        </div>
      </div>
      {/* Glass Morphism Card */}
      <div className="mac-glass p-8 shadow-2xl relative">
        {step === "email" ? (
          /* Email Input Step */
          (<form
            onSubmit={emailForm.handleSubmit((data) => sendMagicLink(data, 0))}
            className="space-y-6"
            suppressHydrationWarning
          >
            <Field>
              <FieldLabel htmlFor="email" className="block text-white text-sm font-medium mb-2">
                Email Address
              </FieldLabel>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors pointer-events-none" />
                <Input
                  {...emailForm.register("email")}
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-11 h-12 text-base border-2 border-gray-600 bg-gray-900/50 text-white placeholder:text-gray-500 focus:border-blue-500 focus:bg-gray-800 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 w-full rounded-lg focus:outline-none"
                  disabled={isLoading}
                  autoComplete="email"
                  aria-invalid={!!emailForm.formState.errors.email}
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </Field>
            <Button
              type="submit"
              disabled={isLoading}
              className="mac-button mac-button-primary w-full h-12 text-base font-normal shadow-xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-4 h-5 w-5" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-4 h-5 w-5" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>)
        ) : (
          /* Code Verification Step */
          (<div className="space-y-6">
            {/* Success Message */}
            <div className="text-center p-6 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl border border-green-500/20 backdrop-blur-sm">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
              <h3 className="mac-title text-lg font-normal text-white mb-2">Magic Link Sent!</h3>
              <p className="text-sm text-gray-300">We've sent a verification code to</p>
              <p className="text-sm font-medium text-white mt-2">{currentEmail}</p>
              <p className="text-xs text-gray-400 mt-2">
                Check your email for the 6-digit verification code
              </p>
            </div>
            {/* Dev Code Display */}
            {devCode && (
              <div className="text-center p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20 backdrop-blur-sm">
                <p className="text-sm text-orange-300 font-medium">
                  Development Code:{" "}
                  <span className="font-mono text-lg text-orange-200">{devCode}</span>
                </p>
              </div>
            )}
            {/* Verification Form */}
            <form
              onSubmit={codeForm.handleSubmit((data) => verifyCode(data, 0))}
              className="space-y-6"
              suppressHydrationWarning
            >
              <Field>
                <FieldLabel htmlFor="code" className="block text-white text-sm font-medium mb-2">
                  Verification Code
                </FieldLabel>
                <Input
                  {...codeForm.register("code")}
                  id="code"
                  type="text"
                  placeholder="000000"
                  className="mac-input h-12 text-center text-2xl tracking-[0.5em] font-mono border-2 border-gray-400 bg-gray-900 text-white placeholder:text-gray-500 focus:border-green-400 focus:bg-gray-800 transition-all duration-200"
                  disabled={isLoading}
                  maxLength={6}
                  autoComplete="one-time-code"
                  aria-invalid={!!codeForm.formState.errors.code}
                />
                {codeForm.formState.errors.code && (
                  <p className="text-red-400 text-sm mt-2 flex items-center">
                    <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                    {codeForm.formState.errors.code.message}
                  </p>
                )}
              </Field>

              <Button
                type="submit"
                disabled={isLoading}
                className="mac-button mac-button-primary w-full h-12 text-base font-normal shadow-xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-4 h-5 w-5" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-4 h-5 w-5" />
                    Verify & Sign In
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setStep("email");
                  setDevCode("");
                  codeForm.reset();
                }}
                className="mac-button mac-button-outline w-full h-10 text-sm font-medium"
              >
                Use a different email
              </Button>
            </form>
          </div>)
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-600/30">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400 font-mono">
              v{buildInfo.appVersion} • Built {getFormattedBuildTime(buildInfo.buildTime)}
            </p>
            <p className="text-xs text-gray-500">Eat • Me</p>
          </div>
        </div>
      </div>
    </div>
  );
};
