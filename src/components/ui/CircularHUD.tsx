import React, { Suspense, useState, useEffect } from "react";
import { LoadingSpinner } from "../LoadingStates";

interface CircularHUDProps {
  children: React.ReactNode;
  size?: number;
  isActive?: boolean;
  pulseEffect?: boolean;
  className?: string;
}

export function CircularHUD({
  children,
  size: initialSize = 400,
  isActive = false,
  pulseEffect = true,
  className = "",
}: CircularHUDProps) {
  const [size, setSize] = useState(initialSize);

  useEffect(() => {
    const handleResize = () => {
      const newSize = Math.min(window.innerWidth * 0.4, window.innerHeight * 0.4, initialSize);
      setSize(newSize);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [initialSize]);
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Background Glow */}
      <div
        className={`absolute inset-0 rounded-full bg-blue-500/10 blur-2xl transition-opacity duration-500 ${isActive ? "opacity-50" : "opacity-20"}`}
      />

      {/* Outer static ring */}
      <div className="absolute inset-0 rounded-full border border-blue-600/10" />

      {/* Rotating rings */}
      <div className="absolute inset-1 rounded-full border-2 border-blue-600/20 animate-spin-slow" />
      <div className="absolute inset-2 rounded-full border-t-2 border-t-blue-600/50 border-r-2 border-r-blue-600/50 animate-spin-medium" />
      <div className="absolute inset-3 rounded-full border-b-2 border-b-blue-600/50 animate-spin-fast" />

      {/* Active pulse ring */}
      {isActive && <div className="" />}

      {/* Main HUD container with glassmorphism */}
      <div
        className={`absolute inset-8 rounded-full glass-panel-dark ${
          isActive ? "glass-panel-active" : ""
        } ${pulseEffect ? "animate-pulse-border" : ""} flex items-center justify-center`}
      >
        <Suspense fallback={<LoadingSpinner size="md" color="cyan" />}>{children}</Suspense>
      </div>

      {/* Scan line effect */}
      <div className="absolute inset-8 rounded-full overflow-hidden">
        <div className="scan-line" />
      </div>

      {/* Corner accent elements */}
      <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-blue-600/60 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-blue-600/60 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-blue-600/60 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-blue-600/60 rounded-br-lg" />
    </div>
  );
}

interface CircularNavigationProps {
  items: Array<{
    id: string;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive?: boolean;
  }>;
  radius?: number;
  size?: number;
  className?: string;
}

export function CircularNavigation({
  items,
  radius = 180,
  size = 48,
  className = "",
}: CircularNavigationProps) {
  return (
    <div className={`relative ${className}`}>
      {items.map((item, index) => {
        const angle = (index * 360) / items.length;
        const cx = radius;
        const cy = radius;
        const x = cx + (radius - 20) * Math.cos(angle);
        const y = cy + (radius - 20) * Math.sin(angle);

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`absolute hud-button ${item.isActive ? "glass-panel-active" : "glass-panel"} 
              flex items-center justify-center transition-all duration-300 hover:scale-110 group`}
            style={{
              width: size,
              height: size,
              left: `calc(50% + ${x}px - ${size / 2}px)`,
              top: `calc(50% + ${y}px - ${size / 2}px)`,
              borderRadius: "50%",
            }}
            title={item.label}
          >
            <div className="relative z-10 text-blue-600 group-hover:text-blue-300 transition-colors">
              {item.icon}
            </div>

            {/* Active indicator */}
            {item.isActive && (
              <div className="absolute inset-0 rounded-full border-2 border-blue-600 animate-pulse" />
            )}

            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-full bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      })}

      {/* Central connection lines */}
      {items.map((_, index) => {
        const angle = (index * 360) / items.length;
        const startRadius = 60;
        const endRadius = radius - 30;

        return (
          <div
            key={`line-${index}`}
            className="absolute w-px bg-gradient-to-r from-blue-600/20 via-blue-600/40 to-transparent"
            style={{
              height: endRadius - startRadius,
              left: "50%",
              top: `calc(50% - ${startRadius}px)`,
              transformOrigin: "0 bottom",
              transform: `rotate(${angle}deg) translateY(-${startRadius}px)`,
            }}
          />
        );
      })}
    </div>
  );
}

// Default export for React.lazy compatibility
export default CircularHUD;
