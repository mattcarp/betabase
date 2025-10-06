import React from "react";

interface BetabaseLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
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
    "2xl": "w-36 h-36", // 1.5x the xl size (144px)
  };

  const fullSizeClasses = {
    sm: "w-32 h-8",
    md: "w-48 h-12",
    lg: "w-64 h-16",
    xl: "w-80 h-24",
    "2xl": "w-120 h-36", // 1.5x the xl size
  };

  const sizeClass = variant === "full" ? fullSizeClasses[size] : sizeClasses[size];

  const dimensionMap = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
    "2xl": { width: 144, height: 144 },
  };

  const dimensions = dimensionMap[size];

  return (
    <img
      src="/betabase-logo.webp"
      alt="Betabase"
      width={dimensions.width}
      height={dimensions.height}
      className={`${sizeClass} ${className} object-contain`}
    />
  );
};

// For backward compatibility, also export as SiamLogo
export const SiamLogo = BetabaseLogo;