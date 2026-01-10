"use client";

import React from "react";

interface CrosshairsProps {
  x: number;
  y: number;
  size?: number;
  visible?: boolean;
}

/**
 * Scope-style crosshairs component
 * Renders at an absolute position on the screen
 * Orange to match the ladybug theme
 */
export const Crosshairs: React.FC<CrosshairsProps> = ({
  x,
  y,
  size = 60,
  visible = true,
}) => {
  if (!visible) return null;

  const strokeWidth = 2;
  const innerCircleRadius = size * 0.15;
  const outerCircleRadius = size * 0.4;
  const lineLength = size * 0.5;
  const gap = size * 0.2; // Gap between inner circle and lines

  return (
    <div
      className="fixed pointer-events-none z-[9998]"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="animate-in fade-in zoom-in-50 duration-200"
      >
        {/* Dark outline for contrast - renders behind orange */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerCircleRadius + 1}
          fill="none"
          stroke="#000000"
          strokeWidth={strokeWidth + 2}
          opacity={0.6}
        />

        {/* Outer circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={outerCircleRadius}
          fill="none"
          stroke="#f97316"
          strokeWidth={strokeWidth}
        />

        {/* Inner dot with dark outline */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerCircleRadius + 1}
          fill="#000000"
          opacity={0.6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={innerCircleRadius}
          fill="#f97316"
        />

        {/* Top line - dark outline */}
        <line
          x1={size / 2}
          y1={size / 2 - outerCircleRadius - gap}
          x2={size / 2}
          y2={size / 2 - outerCircleRadius - gap - lineLength}
          stroke="#000000"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          opacity={0.6}
        />
        {/* Top line - orange */}
        <line
          x1={size / 2}
          y1={size / 2 - outerCircleRadius - gap}
          x2={size / 2}
          y2={size / 2 - outerCircleRadius - gap - lineLength}
          stroke="#f97316"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Bottom line - dark outline */}
        <line
          x1={size / 2}
          y1={size / 2 + outerCircleRadius + gap}
          x2={size / 2}
          y2={size / 2 + outerCircleRadius + gap + lineLength}
          stroke="#000000"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          opacity={0.6}
        />
        {/* Bottom line - orange */}
        <line
          x1={size / 2}
          y1={size / 2 + outerCircleRadius + gap}
          x2={size / 2}
          y2={size / 2 + outerCircleRadius + gap + lineLength}
          stroke="#f97316"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Left line - dark outline */}
        <line
          x1={size / 2 - outerCircleRadius - gap}
          y1={size / 2}
          x2={size / 2 - outerCircleRadius - gap - lineLength}
          y2={size / 2}
          stroke="#000000"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          opacity={0.6}
        />
        {/* Left line - orange */}
        <line
          x1={size / 2 - outerCircleRadius - gap}
          y1={size / 2}
          x2={size / 2 - outerCircleRadius - gap - lineLength}
          y2={size / 2}
          stroke="#f97316"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Right line - dark outline */}
        <line
          x1={size / 2 + outerCircleRadius + gap}
          y1={size / 2}
          x2={size / 2 + outerCircleRadius + gap + lineLength}
          y2={size / 2}
          stroke="#000000"
          strokeWidth={strokeWidth + 2}
          strokeLinecap="round"
          opacity={0.6}
        />
        {/* Right line - orange */}
        <line
          x1={size / 2 + outerCircleRadius + gap}
          y1={size / 2}
          x2={size / 2 + outerCircleRadius + gap + lineLength}
          y2={size / 2}
          stroke="#f97316"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
