import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
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

  // Build info for footer
  const buildInfo = getBuildInfo();

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
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send magic link");
      console.error("Magic link send error:", error);
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

      // Store the user session data
      if (result.user) {
        localStorage.setItem("siam_user", JSON.stringify(result.user));
        toast.success(`Welcome back! Authenticated as ${currentEmail}`);
        onLoginSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
      console.error("Code verification error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep("email");
    setCurrentEmail("");
    setDevCode("");
    emailForm.reset();
    codeForm.reset();
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="w-full max-w-md space-y-8 p-8">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-motiff-primary/20 mb-4">
            <Shield className="h-6 w-6 text-motiff-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            SIAM Authentication
          </h2>
          <p className="text-motiff-text-muted">
            {step === "email"
              ? "Enter your email to receive a magic link"
              : "Enter the verification code from your email"}
          </p>
        </div>

        <div className="motiff-glass-panel p-6 space-y-6">
          {step === "email" ? (
            /* Email Step */
            <form
              onSubmit={emailForm.handleSubmit(sendMagicLink)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white text-sm font-medium"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-motiff-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="fiona@fionaburgess.com"
                    className="pl-10 bg-mac-surface/50 border-mac-border text-white placeholder-motiff-text-muted"
                    {...emailForm.register("email")}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-red-400">
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
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-white text-sm font-medium"
                  >
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-lg tracking-widest bg-mac-surface/50 border-mac-border text-white placeholder-motiff-text-muted"
                    {...codeForm.register("code")}
                  />
                  {codeForm.formState.errors.code && (
                    <p className="text-sm text-red-400">
                      {codeForm.formState.errors.code.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-motiff-primary hover:bg-motiff-primary/80 text-white font-medium py-2.5"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
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
                    onClick={resetForm}
                    className="w-full text-motiff-text-muted hover:text-white"
                  >
                    Use different email
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Access for Fiona */}
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs text-motiff-text-muted text-center mb-2">
              Quick access for authorized users
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  emailForm.setValue("email", "fiona@fionaburgess.com")
                }
                className="text-motiff-text-muted hover:text-white p-2 h-auto"
              >
                fiona@fionaburgess.com
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  emailForm.setValue("email", "fiona.burgess.ext@sonymusic.com")
                }
                className="text-motiff-text-muted hover:text-white p-2 h-auto text-[10px]"
              >
                fiona.burgess.ext@sonymusic.com
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-motiff-text-muted">
            SIAM {buildInfo.versionString} | Built:{" "}
            {getFormattedBuildTime(buildInfo.buildTime)}
          </p>
          <p className="text-xs text-motiff-text-muted mt-1">
            Secure passwordless authentication powered by magic links
          </p>
        </div>
      </div>
    </div>
  );
};
