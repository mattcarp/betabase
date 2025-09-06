import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cognitoAuth } from "../../services/cognitoAuth";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { getBuildInfo, getFormattedBuildTime } from "../../utils/buildInfo";

interface LoginFormProps {
  onLoginSuccess: () => void;
}

// Form validation schemas
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
    }, "Only @sonymusic.com emails, matt@mattcarpenter.com, claude@test.siam.ai, and fiona@fionaburgess.com are allowed"),
});

// Password schema for test account
const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface VerificationFormProps {
  email: string;
  onSubmit: (data: { verificationCode: string }) => void;
  loading: boolean;
  magicLinkSent: boolean;
  onBack: () => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  email,
  onSubmit,
  loading,
  magicLinkSent,
  onBack,
}) => {
  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode) {
      onSubmit({ verificationCode });
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
        <p className="text-gray-400">
          We've sent a verification code to{" "}
          <span className="text-cyan-400 font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="verificationCode" className="text-gray-200">
            Verification Code
          </Label>
          <Input
            id="verificationCode"
            type="text"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="Enter 6-digit code"
            className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20"
            disabled={loading}
            autoComplete="off"
            maxLength={6}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          disabled={loading || !verificationCode}
        >
          {loading ? "Verifying..." : "Verify & Sign In"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          {magicLinkSent ? "Back to Login" : "Back"}
        </button>
      </div>
    </>
  );
};

interface SignInFormProps {
  onSubmit: (data: EmailFormData) => void;
  onPasswordSubmit: (data: { email: string; password: string }) => void;
  loading: boolean;
}

const SignInForm: React.FC<SignInFormProps> = ({
  onSubmit,
  onPasswordSubmit,
  loading,
}) => {
  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const [showPasswordField, setShowPasswordField] = useState(false);
  const [password, setPassword] = useState("");

  const watchEmail = form.watch("email");

  React.useEffect(() => {
    // Show password field for test account
    if (watchEmail?.toLowerCase() === "claude@test.siam.ai") {
      setShowPasswordField(true);
    } else {
      setShowPasswordField(false);
      setPassword("");
    }
  }, [watchEmail]);

  const handleSubmit = async (data: EmailFormData) => {
    if (showPasswordField && password) {
      // Password authentication for test account
      await onPasswordSubmit({ email: data.email, password });
    } else {
      // Magic link authentication
      await onSubmit(data);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-200">Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="your.name@sonymusic.com or matt@mattcarpenter.com"
                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                    disabled={loading}
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {showPasswordField && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-400 focus:ring-cyan-400/20"
                disabled={loading}
                autoComplete="current-password"
              />
              <p className="text-xs text-gray-500 mt-1">
                Test account: Use password 4@9XMPfE9B$
              </p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={loading}
          >
            {loading
              ? showPasswordField
                ? "Signing In..."
                : "Sending Magic Link..."
              : showPasswordField
                ? "Sign In"
                : "Send Magic Link"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Build-time version info (same as main app)
  const buildInfo = getBuildInfo();

  const handleSignIn = async (data: EmailFormData) => {
    setEmail(data.email);
    setLoading(true);
    try {
      await cognitoAuth.sendMagicLink(data.email);
      toast.success(
        "Verification code sent! Check your email.",
      );
      setMagicLinkSent(true);
      setNeedsVerification(true);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send verification code";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSignIn = async (data: {
    email: string;
    password: string;
  }) => {
    // Test account password authentication
    const TEST_EMAIL = "claude@test.siam.ai";
    const TEST_PASSWORD = "4@9XMPfE9B$";

    if (
      data.email.toLowerCase() === TEST_EMAIL &&
      data.password === TEST_PASSWORD
    ) {
      // Store test user session
      localStorage.setItem(
        "siam_user",
        JSON.stringify({
          email: TEST_EMAIL,
          name: "Claude Test User",
          authenticated: true,
          authMethod: "password",
        }),
      );
      toast.success("Successfully signed in!");
      onLoginSuccess();
    } else {
      toast.error("Invalid email or password");
    }
  };

  const handleVerification = async (data: { verificationCode: string }) => {
    setLoading(true);
    try {
      if (!email) {
        throw new Error("Email not found");
      }
      await cognitoAuth.verifyMagicLink(email, data.verificationCode);
      toast.success("Successfully signed in!");
      onLoginSuccess();
      setNeedsVerification(false);
      setMagicLinkSent(false);
    } catch (error: any) {
      toast.error(error.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleBackFromVerification = () => {
    setNeedsVerification(false);
    setMagicLinkSent(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-md">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl shadow-2xl p-8">
          {/* Logo/Title */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              SIAM
            </h1>
            <p className="text-gray-400 mt-2">
              {needsVerification ? "Verify Your Email" : "Welcome Back"}
            </p>
            {!needsVerification && (
              <p className="text-xs text-gray-500 mt-1">
                Sign in with your authorized email
              </p>
            )}
            {!needsVerification && (
              <p className="text-xs text-gray-600 mt-2">
                Only @sonymusic.com emails and matt@mattcarpenter.com are
                allowed
              </p>
            )}
          </div>

          {/* Forms */}
          {needsVerification ? (
            <VerificationForm
              email={email}
              onSubmit={handleVerification}
              loading={loading}
              magicLinkSent={magicLinkSent}
              onBack={handleBackFromVerification}
            />
          ) : (
            <SignInForm
              onSubmit={handleSignIn}
              onPasswordSubmit={handlePasswordSignIn}
              loading={loading}
            />
          )}
        </div>
      </main>

      {/* Footer with version - same as main app */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 z-10">
        <div className="flex justify-center">
          <span className="text-xs text-gray-500">
            {buildInfo.versionString} | Built:{" "}
            {getFormattedBuildTime(buildInfo.buildTime)}
          </span>
        </div>
      </footer>
    </div>
  );
};
