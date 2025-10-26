import React from "react";
import Image from "next/image";

interface BetabaseLogoProps {
  cclassName?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "icon" | "full";
  priority?: boolean;
}

export const BetabaseLogo: React.FC<BetabaseLogoProps> = ({
  cclassName = "",
  size = "md",
  variant = "full",
  priority = true,
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

  // Using Next.js Image component for optimized loading
  // Image is 400x266 = 1.5037:1 aspect ratio
  return (
    <div cclassName={`betabase-logo-wrapper ${sizeClass} ${cclassName}`}>
      <Image
        src="/betabase-logo.webp"
        alt="Betabase"
        width={400}
        height={266}
        priority={priority}
        cclassName="w-full h-full object-contain"
      />
    </div>
  );
};

// For backward compatibility, also export as SiamLogo
export const SiamLogo = BetabaseLogo;
