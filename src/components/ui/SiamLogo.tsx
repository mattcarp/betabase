import React from "react";
import Image from "next/image";

interface SiamLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
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
  };

  const fullSizeMap = {
    xs: { w: 96, h: 24 },
    sm: { w: 128, h: 32 },
    md: { w: 192, h: 48 },
    lg: { w: 256, h: 64 },
    xl: { w: 320, h: 80 },
    "2xl": { w: 384, h: 96 },
  };

  const dimensions = variant === "full" ? fullSizeMap[size] : sizeMap[size];

  return (
    <Image
      src="/betabase-logo.webp"
      alt="Betabase logo"
      width={dimensions.w}
      height={dimensions.h}
      className={`${className} object-contain`}
    />
  );
};
