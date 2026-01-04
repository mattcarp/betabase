import React from "react";
import Image from "next/image";

interface SiamLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  variant?: "icon" | "full";
}

export const SiamLogo: React.FC<SiamLogoProps> = ({
  className = "",
  size = "md",
  variant = "full",
}) => {
  const sizeMap = {
    xs: { w: 24, h: 16 },
    sm: { w: 32, h: 21 },
    md: { w: 48, h: 32 },
    lg: { w: 64, h: 43 },
    xl: { w: 80, h: 53 },
    "2xl": { w: 96, h: 64 },
    "3xl": { w: 128, h: 85 },
    "4xl": { w: 160, h: 107 },
  };

  const fullSizeMap = {
    xs: { w: 96, h: 24 },
    sm: { w: 128, h: 32 },
    md: { w: 192, h: 48 },
    lg: { w: 256, h: 64 },
    xl: { w: 320, h: 80 },
    "2xl": { w: 384, h: 96 },
    "3xl": { w: 480, h: 120 },
    "4xl": { w: 576, h: 144 },
  };

  const dimensions = variant === "full" ? fullSizeMap[size] : sizeMap[size];

  // Light mode filter is applied via CSS in globals.css targeting .betabase-logo-img
  return (
    <Image
      src="/betabase-logo.webp"
      alt="SIAM Intelligence Platform by The Betabase"
      width={dimensions.w}
      height={dimensions.h}
      className={`betabase-logo-img ${className} object-contain`}
    />
  );
};
