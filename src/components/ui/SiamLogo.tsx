import React from "react";

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
  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    "2xl": "w-32 h-32",
  };

  const fullSizeClasses = {
    xs: "w-24 h-6",
    sm: "w-32 h-8",
    md: "w-48 h-12",
    lg: "w-64 h-16",
    xl: "w-80 h-24",
    "2xl": "w-96 h-32",
  };

  const sizeClass = variant === "full" ? fullSizeClasses[size] : sizeClasses[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/betabase-logo.webp"
      alt="Betabase"
      className={`${sizeClass} ${className} object-contain`}
    />
  );
};
