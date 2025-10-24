import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility for generating neon colors
export const neonColors = {
  blue: "#3B82F6",
  green: "#10B981",
  purple: "#8b5cf6",
  pink: "#ff006e",
  cyan: "#06ffa5",
  matrix: "#00ff41",
} as const;

// Animation utilities
export const animations = {
  glow: "animate-glow",
  pulse: "animate-pulse-neon",
  matrix: "animate-matrix-rain",
} as const;

// Generate random matrix characters
export function generateMatrixChar(): string {
  const chars =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return chars[Math.floor(Math.random() * chars.length)] || "A";
}

// Format time for display
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
