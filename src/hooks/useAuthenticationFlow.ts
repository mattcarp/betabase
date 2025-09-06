import { useState, useCallback, useMemo } from "react";
import { cognitoAuth } from "../services/cognitoAuth";
// import { toast } from "sonner";
const toast = { 
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  info: (msg: string) => console.info('ℹ️', msg)
};

export interface EmailFormData {
  email: string;
}

export interface VerificationFormData {
  verificationCode: string;
}

export const useAuthenticationFlow = (onLoginSuccess: () => void) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // Calculate current step and total steps for progress indicator
  const currentStep = useMemo(() => {
    if (needsVerification) return 1;
    return 0;
  }, [needsVerification]);

  const totalSteps = useMemo(() => {
    return magicLinkSent ? 2 : 2;
  }, [magicLinkSent]);

  const handleSignIn = useCallback(async (data: EmailFormData) => {
    setEmail(data.email);
    setLoading(true);
    setStatusMessage("Sending magic link to your email...");
    try {
      await cognitoAuth.sendMagicLink(data.email);
      toast.success(
        "Magic link sent! Check your email for the verification code.",
        { id: "magic-link-sent" },
      );
      setMagicLinkSent(true);
      setNeedsVerification(true);
      setStatusMessage(
        "Magic link sent successfully. Please check your email.",
      );
    } catch (error: any) {
      const errorMessage = error.message || "Failed to send magic link";
      toast.error(errorMessage, { id: "magic-link-error" });
      setStatusMessage(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerification = useCallback(
    async (data: VerificationFormData) => {
      setLoading(true);
      setStatusMessage("Verifying your code...");
      try {
        if (magicLinkSent) {
          await cognitoAuth.verifyMagicLink(email, data.verificationCode);
          toast.success("Successfully signed in with magic link!", {
            id: "signin-success",
          });
          setStatusMessage("Sign in successful!");
          onLoginSuccess();
        }
      } catch (error: any) {
        const errorMessage = error.message || "Verification failed";
        toast.error(errorMessage, { id: "verify-error" });
        setStatusMessage(`Error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    },
    [email, magicLinkSent, onLoginSuccess],
  );

  const handleBackFromVerification = useCallback(() => {
    setNeedsVerification(false);
    setMagicLinkSent(false);
    setStatusMessage("Returned to previous form");
  }, []);

  return {
    email,
    loading,
    needsVerification,
    magicLinkSent,
    handleSignIn,
    handleVerification,
    handleBackFromVerification,
    currentStep,
    totalSteps,
    statusMessage,
  };
};
