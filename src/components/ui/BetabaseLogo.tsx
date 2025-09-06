import React from "react";

interface BetabaseLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "icon" | "full";
}

export const BetabaseLogo: React.FC<BetabaseLogoProps> = ({
  className = "",
  size = "md",
  variant = "full",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const fullSizeClasses = {
    sm: "w-32 h-8",
    md: "w-48 h-12",
    lg: "w-64 h-16",
    xl: "w-80 h-24",
  };

  const sizeClass = variant === "full" ? fullSizeClasses[size] : sizeClasses[size];

  return (
    <img
      src="/betabase-logo.webp"
      alt="Betabase"
      className={`${sizeClass} ${className} object-contain`}
    />
  );
};

// For backward compatibility, also export as SiamLogo
export const SiamLogo = BetabaseLogo;