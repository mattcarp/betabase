/**
 * MAC-SIAM Fusion Component
 * Professional elegance meets futuristic interface design
 * By Matthew Adam Carpenter
 */

import React, { useState } from "react";

interface MACFusionCardProps {
  title: string;
  description: string;
  variant?: "professional" | "futuristic" | "hybrid";
  children?: React.ReactNode;
}

export const MACFusionCard: React.FC<MACFusionCardProps> = ({
  title,
  description,
  variant = "hybrid",
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getVariantClasses = () => {
    switch (variant) {
      case "professional":
        return {
          container:
            "bg-mac-surface-elevated border-mac-border-elevated backdrop-blur-xl",
          title: "font-mac-display font-extralight text-mac-text-primary",
          description: "font-mac-body font-light text-mac-text-secondary",
          glow: "shadow-mac-purple-glow",
        };
      case "futuristic":
        return {
          container: "bg-matrix-dark/70 border-neon-cyan/30 backdrop-blur-lg",
          title: "font-futuristic font-semibold text-neon-cyan",
          description: "font-mono font-normal text-neon-blue/80",
          glow: "shadow-neon-glow animate-pulse-glow",
        };
      case "hybrid":
      default:
        return {
          container:
            "bg-mac-surface-elevated/90 border-mac-border-elevated backdrop-blur-2xl",
          title: "font-mac-display font-light text-mac-text-primary",
          description: "font-mac-body font-light text-mac-text-secondary",
          glow: isHovered ? "shadow-mac-purple-glow" : "shadow-mac-card",
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <div
      className={`
        relative p-6 rounded-xl border transition-all duration-300 cursor-pointer
        ${classes.container}
        ${classes.glow}
        ${isHovered ? "transform -translate-y-2 scale-105" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* MAC shimmer effect */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 overflow-hidden rounded-xl">
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-mac-shimmer" />
      </div>

      {/* Professional gradient top bar (MAC style) */}
      <div
        className={`
          absolute top-0 left-0 right-0 h-1 rounded-t-xl transform origin-left transition-transform duration-300
          bg-gradient-to-r from-mac-primary-blue-400 to-mac-accent-purple-400
          ${isHovered ? "scale-x-100" : "scale-x-0"}
        `}
      />

      {/* Content */}
      <div className="relative z-10">
        <h3 className={`text-xl mb-3 ${classes.title}`}>{title}</h3>

        <p className={`mb-4 leading-relaxed ${classes.description}`}>
          {description}
        </p>

        {children && <div className="mt-6">{children}</div>}

        {/* Floating orb indicator (MAC style) */}
        {variant === "hybrid" && (
          <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-mac-accent-purple-400/20 animate-mac-float opacity-60" />
        )}
      </div>
    </div>
  );
};

// Professional MAC button component
export const MACButton: React.FC<{
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  onClick?: () => void;
}> = ({ children, variant = "primary", onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getButtonClasses = () => {
    switch (variant) {
      case "primary":
        return `
          bg-mac-accent-purple-600 text-mac-text-primary border-mac-accent-purple-600
          hover:bg-mac-accent-purple-400 hover:shadow-mac-purple-glow
        `;
      case "secondary":
        return `
          bg-mac-surface-elevated text-mac-text-primary border-mac-border-elevated
          hover:bg-mac-state-hover hover:border-mac-primary-blue-400
        `;
      case "outline":
        return `
          bg-transparent text-mac-text-primary border-mac-border-elevated
          hover:bg-mac-state-hover hover:border-mac-primary-blue-400
        `;
      default:
        return "";
    }
  };

  return (
    <button
      className={`
        inline-flex items-center justify-center px-6 py-3 border rounded-lg
        font-mac-body font-normal text-sm transition-all duration-200
        ${getButtonClasses()}
        ${isHovered ? "transform -translate-y-1" : ""}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// Usage example component
export const MACShowcase: React.FC = () => {
  return (
    <div className="p-8 space-y-8 bg-mac-surface-bg min-h-screen">
      {/* Floating orbs background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-3/4 w-24 h-24 bg-mac-primary-blue-400/10 rounded-full animate-mac-float" />
        <div
          className="absolute top-3/4 left-1/4 w-16 h-16 bg-mac-accent-purple-400/10 rounded-full animate-mac-float"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-20 h-20 bg-mac-primary-blue-600/10 rounded-full animate-mac-float"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-mac-display font-thin text-mac-text-primary mb-4 animate-mac-glow">
            SIAM × MAC
          </h1>
          <p className="text-mac-text-secondary font-mac-body font-light text-lg">
            Professional elegance meets futuristic innovation
          </p>
        </div>

        {/* Cards showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MACFusionCard
            title="Professional Mode"
            description="Clean, elegant interface perfect for business meetings and professional presentations."
            variant="professional"
          >
            <MACButton variant="primary">Enter Professional Mode</MACButton>
          </MACFusionCard>

          <MACFusionCard
            title="Hybrid Experience"
            description="The perfect balance of professional elegance and futuristic innovation for modern workflows."
            variant="hybrid"
          >
            <div className="flex gap-3">
              <MACButton variant="primary">Start Meeting</MACButton>
              <MACButton variant="outline">Settings</MACButton>
            </div>
          </MACFusionCard>

          <MACFusionCard
            title="Futuristic HUD"
            description="Full cyberpunk experience with neon effects and matrix-style visualizations for power users."
            variant="futuristic"
          >
            <MACButton variant="secondary">Activate HUD</MACButton>
          </MACFusionCard>
        </div>
      </div>
    </div>
  );
};
