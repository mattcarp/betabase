import React from "react";
import { Button, ButtonProps } from "../../ui/button";
import { cn } from "../../../../../lib/utils";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
}

export const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, cclassName, disabled, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={loading || disabled}
        cclassName={cn(
          "mac-button mac-button-primary",
          "relative overflow-hidden",
          "transition-all duration-300",
          loading && "animate-pulse-glow",
          cclassName
        )}
        {...props}
      >
        {loading && (
          <>
            <div cclassName="absolute inset-0 bg-primary/90 flex items-center justify-center">
              <div cclassName="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
            <div cclassName="" />
          </>
        )}
        <span
          cclassName={cn("transition-opacity duration-200", loading ? "opacity-0" : "opacity-100")}
        >
          {children}
        </span>
        {loading && (
          <div cclassName="ml-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export const AuthButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, children, cclassName, ...props }, ref) => {
    return (
      <LoadingButton
        ref={ref}
        loading={loading}
        cclassName={cn(
          "w-full",
          "bg-gradient-to-r from-neon-cyan to-neon-blue",
          "hover:from-neon-cyan/90 hover:to-neon-blue/90",
          "shadow-[0_0_20px_rgba(6,255,165,0.3)]",
          "hover:shadow-[0_0_30px_rgba(6,255,165,0.5)]",
          "transition-all duration-300",
          cclassName
        )}
        {...props}
      >
        {children}
      </LoadingButton>
    );
  }
);

AuthButton.displayName = "AuthButton";
