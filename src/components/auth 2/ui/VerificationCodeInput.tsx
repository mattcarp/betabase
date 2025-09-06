import React, { forwardRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VerificationCodeInputProps extends React.ComponentProps<"input"> {
  onAutoSubmit?: () => void;
}

export const VerificationCodeInput = forwardRef<
  HTMLInputElement,
  VerificationCodeInputProps
>(({ onAutoSubmit, className, ...props }, ref) => {
  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const value = target.value.replace(/\D/g, ""); // Only allow digits

    if (value !== target.value) {
      target.value = value;
    }

    // Auto-submit when 6 digits are entered
    if (value.length === 6 && onAutoSubmit) {
      onAutoSubmit();
    }

    // Call original onInput if provided
    props.onInput?.(e);
  };

  return (
    <Input
      ref={ref}
      placeholder="123456"
      autoComplete="one-time-code"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={6}
      className={cn(
        "text-center text-2xl tracking-[0.5em] font-mono",
        "bg-black/30 border-gray-600/50",
        "focus:border-neon-cyan focus:shadow-[0_0_20px_rgba(6,255,165,0.2)]",
        "transition-all duration-200",
        className,
      )}
      onInput={handleInput}
      {...props}
    />
  );
});

VerificationCodeInput.displayName = "VerificationCodeInput";
