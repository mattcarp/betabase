"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Loader2, Mail, Shield, CheckCircle } from "lucide-react";
import { getBuildInfo, getFormattedBuildTime } from "../../utils/buildInfo";

interface MagicLinkLoginFormProps {
  onLoginSuccess: () => void;
}

// FIONA P0 FIX: Magic Link Authentication Schema
const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .refine((email) => {
      const emailLower = email.toLowerCase();
      return (
        emailLower.endsWith("@sonymusic.com") ||
        emailLower === "matt@mattcarpenter.com" ||
        emailLower === "claude@test.siam.ai" ||
        emailLower === "fiona.burgess.ext@sonymusic.com" ||
        emailLower === "fiona@fionaburgess.com"
      );
    }, "Only authorized emails allowed: @sonymusic.com, fiona@fionaburgess.com, and test accounts"),
});

const codeSchema = z.object({
  code: z
    .string()
    .min(6, "Verification code must be 6 digits")
    .max(6, "Verification code must be 6 digits"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type CodeFormData = z.infer<typeof codeSchema>;

export const MagicLinkLoginForm: React.FC<MagicLinkLoginFormProps> = ({
  onLoginSuccess,
}) => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [currentEmail, setCurrentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [devCode, setDevCode] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  // Build info for footer
  const buildInfo = getBuildInfo();

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

  const sendMagicLink = async (data: EmailFormData) => {
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send magic link");
      }

      setCurrentEmail(data.email);
      setStep("code");

      // In dev mode, show the code for testing
      if (result.devCode) {
        setDevCode(result.devCode);
        toast.success(`Magic link sent! Dev code: ${result.devCode}`, {
          duration: 10000,
        });
      } else {
        toast.success(
          "Magic link sent! Check your email for the verification code.",
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      console.error("Send magic link error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send magic link"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (data: CodeFormData) => {
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Invalid verification code");
      }

      // Store the auth token
      if (result.token) {
        localStorage.setItem("authToken", result.token);
      }

      toast.success("Login successful!");
      onLoginSuccess();
    } catch (error) {
      console.error("Verify code error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid code. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent hydration issues
  if (!mounted) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-motiff-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8" suppressHydrationWarning>
      <div className="text-center">
        <div className="inline-flex p-3 rounded-full bg-motiff-primary/10 mb-4">
          <Shield className="h-8 w-8 text-motiff-primary" />
        </div>
        <h2 className="text-2xl font-bold text-white">Welcome to SIAM</h2>
        <p className="mt-2 text-sm text-motiff-text-muted">
          Sony Interactive Artist Manager
        </p>
      </div>

      <div className="bg-motiff-dark/50 backdrop-blur-sm rounded-lg p-6 border border-motiff-dark-lighter">
        {step === "email" ? (
          /* Email Input Step */
          <form
            onSubmit={emailForm.handleSubmit(sendMagicLink)}
            className="space-y-4"
            suppressHydrationWarning
          >
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-white text-sm font-medium"
              >
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-motiff-text-muted" />
                <Input
                  {...emailForm.register("email")}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 bg-motiff-dark border-motiff-dark-lighter focus:border-motiff-primary text-white placeholder:text-motiff-text-muted"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {emailForm.formState.errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-motiff-primary hover:bg-motiff-primary/80 text-white font-medium py-2.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Magic Link...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Magic Link
                </>
              )}
            </Button>
          </form>
        ) : (
          /* Code Verification Step */
          <div className="space-y-4">
            <div className="text-center p-4 bg-motiff-primary/10 rounded-lg border border-motiff-primary/20">
              <CheckCircle className="mx-auto h-8 w-8 text-motiff-primary mb-2" />
              <p className="text-sm text-white">
                Magic link sent to <strong>{currentEmail}</strong>
              </p>
              <p className="text-xs text-motiff-text-muted mt-1">
                Check your email for the 6-digit verification code
              </p>
            </div>

            {devCode && (
              <div className="text-center p-3 bg-orange-400/10 rounded-lg border border-orange-400/20">
                <p className="text-sm text-orange-400">
                  <strong>Dev Code:</strong> {devCode}
                </p>
              </div>
            )}

            <form
              onSubmit={codeForm.handleSubmit(verifyCode)}
              className="space-y-4"
              suppressHydrationWarning
            >
              <div className="space-y-2">
                <Label
                  htmlFor="code"
                  className="text-white text-sm font-medium"
                >
                  Verification Code
                </Label>
                <Input
                  {...codeForm.register("code")}
                  id="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="bg-motiff-dark border-motiff-dark-lighter focus:border-motiff-primary text-white placeholder:text-motiff-text-muted text-center text-lg tracking-widest"
                  disabled={isLoading}
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                {codeForm.formState.errors.code && (
                  <p className="text-red-400 text-xs mt-1">
                    {codeForm.formState.errors.code.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-motiff-primary hover:bg-motiff-primary/80 text-white font-medium py-2.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
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
                className="w-full text-motiff-text-muted hover:text-white"
              >
                Use a different email
              </Button>
            </form>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-motiff-dark-lighter">
          <p className="text-xs text-center text-motiff-text-muted">
            Build: {buildInfo.hash || "dev"} | {getFormattedBuildTime()}
          </p>
        </div>
      </div>
    </div>
  );
};