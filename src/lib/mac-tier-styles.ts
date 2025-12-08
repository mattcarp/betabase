/**
 * MAC Design System - Tier Style Utilities
 * Centralized color definitions for Self-Healing and other tiered features
 * Uses CSS variables from mac-design-system.css
 */

export type HealingTier = 1 | 2 | 3;
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

/**
 * Get tier-based styles using MAC CSS variables
 */
export const getTierStyles = (tier: HealingTier) => {
  const styles = {
    1: "text-[var(--mac-tier1)] bg-[var(--mac-tier1-bg)] border-[var(--mac-tier1-border)]",
    2: "text-[var(--mac-tier2)] bg-[var(--mac-tier2-bg)] border-[var(--mac-tier2-border)]",
    3: "text-[var(--mac-tier3)] bg-[var(--mac-tier3-bg)] border-[var(--mac-tier3-border)]",
  };
  return styles[tier];
};

/**
 * Get tier text color only
 */
export const getTierTextColor = (tier: HealingTier) => {
  const colors = {
    1: "text-[var(--mac-tier1)]",
    2: "text-[var(--mac-tier2)]",
    3: "text-[var(--mac-tier3)]",
  };
  return colors[tier];
};

/**
 * Get tier gradient for progress bars and meters
 */
export const getTierGradient = (tier: HealingTier) => {
  const gradients = {
    1: "bg-gradient-to-r from-[var(--mac-tier1)] to-[#22c55e]",
    2: "bg-gradient-to-r from-[var(--mac-tier2)] to-[#f59e0b]",
    3: "bg-gradient-to-r from-[var(--mac-tier3)] to-[#ef4444]",
  };
  return gradients[tier];
};

/**
 * Get risk level styles using MAC CSS variables
 */
export const getRiskStyles = (level: RiskLevel) => {
  const styles = {
    LOW: "text-[var(--mac-tier1)] bg-[var(--mac-tier1-bg)] border-[var(--mac-tier1-border)]",
    MEDIUM: "text-[var(--mac-tier2)] bg-[var(--mac-tier2-bg)] border-[var(--mac-tier2-border)]",
    HIGH: "text-[var(--mac-tier3)] bg-[var(--mac-tier3-bg)] border-[var(--mac-tier3-border)]",
  };
  return styles[level];
};

/**
 * Get tier label with icon and color
 */
export const getTierLabel = (tier: HealingTier) => {
  const labels = {
    1: {
      label: "Tier 1",
      description: "Auto-Approve",
      styles: getTierStyles(1),
    },
    2: {
      label: "Tier 2",
      description: "Needs Review",
      styles: getTierStyles(2),
    },
    3: {
      label: "Tier 3",
      description: "Architect Review",
      styles: getTierStyles(3),
    },
  };
  return labels[tier];
};

/**
 * Semantic status styles
 */
export const getStatusStyles = {
  success: "text-[var(--mac-tier1)] bg-[var(--mac-tier1-bg)] border-[var(--mac-tier1-border)]",
  warning: "text-[var(--mac-tier2)] bg-[var(--mac-tier2-bg)] border-[var(--mac-tier2-border)]",
  error: "text-[var(--mac-tier3)] bg-[var(--mac-tier3-bg)] border-[var(--mac-tier3-border)]",
  info: "text-[var(--mac-info)] bg-[var(--mac-info-bg)] border-[var(--mac-info-border)]",
  purple: "text-[var(--mac-purple)] bg-[var(--mac-purple-bg)] border-[var(--mac-purple-border)]",
};

/**
 * Badge variant styles for consistent badging
 */
export const badgeVariants = {
  tier1: "bg-[var(--mac-tier1-bg)] text-[var(--mac-tier1)] border-[var(--mac-tier1-border)]",
  tier2: "bg-[var(--mac-tier2-bg)] text-[var(--mac-tier2)] border-[var(--mac-tier2-border)]",
  tier3: "bg-[var(--mac-tier3-bg)] text-[var(--mac-tier3)] border-[var(--mac-tier3-border)]",
  info: "bg-[var(--mac-info-bg)] text-[var(--mac-info)] border-[var(--mac-info-border)]",
  purple: "bg-[var(--mac-purple-bg)] text-[var(--mac-purple)] border-[var(--mac-purple-border)]",
};
