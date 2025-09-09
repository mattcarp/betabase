import React, { useState, useEffect } from "react";
import { Input } from "../../ui/input";
import { cn } from "../../../../lib/utils";
import { Check, X } from "lucide-react";

interface PasswordRequirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { key: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  {
    key: "uppercase",
    label: "One uppercase letter",
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: "lowercase",
    label: "One lowercase letter",
    test: (p) => /[a-z]/.test(p),
  },
  { key: "number", label: "One number", test: (p) => /\d/.test(p) },
  {
    key: "special",
    label: "One special character (@$!%*?&)",
    test: (p) => /[@$!%*?&]/.test(p),
  },
];

interface PasswordInputProps extends React.ComponentProps<"input"> {
  showRequirements?: boolean;
  onRequirementsChange?: (met: boolean) => void;
}

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(
  (
    { showRequirements = true, onRequirementsChange, className, ...props },
    ref,
  ) => {
    const [requirements, setRequirements] = useState<Record<string, boolean>>({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    });

    const password = (props.value as string) || "";

    useEffect(() => {
      const newRequirements: Record<string, boolean> = {};
      let allMet = true;

      passwordRequirements.forEach(({ key, test }) => {
        const met = test(password);
        newRequirements[key] = met;
        if (!met) allMet = false;
      });

      setRequirements(newRequirements);
      onRequirementsChange?.(allMet);
    }, [password, onRequirementsChange]);

    return (
      <div className="space-y-2">
        <Input
          ref={ref}
          type="password"
          className={cn(
            "transition-all duration-200",
            Object.values(requirements).every((r) => r) &&
              password.length > 0 &&
              "border-green-400/50 focus:border-green-400",
            className,
          )}
          {...props}
        />
        {showRequirements && password.length > 0 && (
          <div className="mt-3 space-y-1.5 p-3 bg-black/20 rounded-lg border border-gray-700/50">
            {passwordRequirements.map(({ key, label }) => {
              const met = requirements[key];
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center text-xs transition-all duration-200",
                    met ? "text-green-400" : "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full mr-2 flex items-center justify-center transition-all duration-200",
                      met
                        ? "bg-green-400/20 border border-green-400/50"
                        : "bg-muted/20 border border-muted/50",
                    )}
                  >
                    {met ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <X className="w-2.5 h-2.5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "transition-all duration-200",
                      met && "font-medium",
                    )}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
