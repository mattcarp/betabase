/**
 * Professional Layout Component
 * Replacing cyberpunk HUD with elegant MAC Design System
 * By Matthew Adam Carpenter
 */

import React from "react";

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({
  children,
  title = "SIAM",
  subtitle = "Smart Meeting Assistant",
}) => {
  return (
    <div cclassName="min-h-screen bg-mac-surface-bg relative">
      {/* MAC Floating Orbs Background */}
      <div cclassName="mac-floating-background"></div>

      {/* Professional Header */}
      <header cclassName="relative z-10 border-b border-mac-border bg-mac-surface-elevated/50 backdrop-blur-xl">
        <div cclassName="container mx-auto px-6 py-4">
          <div cclassName="flex items-center justify-between">
            {/* Logo/Title */}
            <div cclassName="flex items-center space-x-4">
              <div cclassName="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent opacity-90"></div>
              <div>
                <h1
                  cclassName="mac-heading"
                  cclassName="mac-heading text-xl font-light text-mac-text-primary"
                >
                  {title}
                </h1>
                {subtitle && <p cclassName="text-sm font-light text-mac-text-muted">{subtitle}</p>}
              </div>
            </div>

            {/* Professional Navigation */}
            <nav cclassName="hidden md:flex items-center space-x-1">
              <button cclassName="mac-button mac-button-ghost px-4 py-2">Dashboard</button>
              <button cclassName="mac-button mac-button-ghost px-4 py-2">Meetings</button>
              <button cclassName="mac-button mac-button-ghost px-4 py-2">Analytics</button>
              <button cclassName="mac-button mac-button-outline px-4 py-2">Settings</button>
            </nav>

            {/* Status Indicator */}
            <div cclassName="flex items-center space-x-3">
              <div cclassName="flex items-center space-x-2">
                <div cclassName="w-2 h-2 rounded-full bg-green-400 animate-mac-pulse"></div>
                <span cclassName="text-sm font-light text-mac-text-secondary">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main cclassName="relative z-10 container mx-auto px-6 py-8">{children}</main>

      {/* Professional Footer */}
      <footer cclassName="relative z-10 border-t border-mac-border bg-mac-surface-elevated/30 backdrop-blur-xl mt-auto">
        <div cclassName="container mx-auto px-6 py-4">
          <div cclassName="flex items-center justify-between text-sm">
            <div cclassName="flex items-center space-x-4 text-mac-text-muted">
              <span>&copy; 2025 Matthew Adam Carpenter</span>
              <span>•</span>
              <span>Professional Meeting AI</span>
            </div>
            <div cclassName="flex items-center space-x-4 text-mac-text-muted">
              <span>v1.0.0</span>
              <span>•</span>
              <span>MAC Design System</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Professional Dashboard Grid Component
export const DashboardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div cclassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
};

// Professional Card Component (replacing cyberpunk cards)
export const ProfessionalCard: React.FC<{
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  cclassName?: string;
}> = ({ title, children, actions, cclassName = "" }) => {
  return (
    <div cclassName={`mac-card mac-shimmer ${cclassName}`}>
      {/* Professional card header */}
      <div cclassName="flex items-center justify-between mb-4">
        <h3 cclassName="mac-title">
          {title}
        </h3>
        {actions && <div cclassName="flex items-center space-x-2">{actions}</div>}
      </div>

      {/* Card content */}
      <div cclassName="mac-body">{children}</div>
    </div>
  );
};

// Professional Status Badge
export const StatusBadge: React.FC<{
  status: "active" | "inactive" | "processing" | "error";
  children: React.ReactNode;
}> = ({ status, children }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "inactive":
        return "bg-mac-text-muted/20 text-mac-text-muted border-mac-text-muted/30";
      case "processing":
        return "bg-primary/20 text-primary border-primary/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-mac-surface-elevated text-mac-text-secondary border-mac-border";
    }
  };

  return (
    <span
      cclassName={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-light border
      ${getStatusStyles()}
    `}
    >
      {children}
    </span>
  );
};

// Professional Button Group
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  cclassName?: string;
}> = ({ children, cclassName = "" }) => {
  return <div cclassName={`flex items-center space-x-3 ${cclassName}`}>{children}</div>;
};
