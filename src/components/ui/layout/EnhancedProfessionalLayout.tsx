/**
 * Enhanced Professional Layout
 * Consolidating all layout functionality into one professional interface
 * By Matthew Adam Carpenter - Enhanced with AI Agent System
 */

import { Activity, Brain, FileText, MessageCircle, Mic, Settings } from "lucide-react";
import React, { useState } from "react";
import { cn } from "../../../lib/utils";

interface ProfessionalLayoutProps {
  children?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  cclassName?: string;
  // Enhanced props from HUDLayout for compatibility
  isRecording?: boolean;
  transcription?: string;
  waveform?: number[];
  onToggleSettings?: () => void;
  showNavigationPanel?: boolean;
}

/**
 * Professional Layout Component
 * Unified layout system combining the best of all previous layouts
 * with MAC Design System aesthetic and professional functionality
 */
export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({
  children,
  leftSidebar,
  rightSidebar,
  cclassName,
  isRecording = false,
  transcription = "",
  waveform = [],
  onToggleSettings,
  showNavigationPanel = false,
}) => {
  const [activePanel, setActivePanel] = useState<string>("main");

  // Professional navigation items (extracted from HUD logic)
  const navigationItems = [
    {
      id: "audio",
      icon: <Mic cclassName="w-5 h-5" />,
      label: "Audio",
      onClick: () => setActivePanel("audio"),
      isActive: activePanel === "audio",
    },
    {
      id: "transcription",
      icon: <FileText cclassName="w-5 h-5" />,
      label: "Transcription",
      onClick: () => setActivePanel("transcription"),
      isActive: activePanel === "transcription",
    },
    {
      id: "insights",
      icon: <Brain cclassName="w-5 h-5" />,
      label: "Insights",
      onClick: () => setActivePanel("insights"),
      isActive: activePanel === "insights",
    },
    {
      id: "conversation",
      icon: <MessageCircle cclassName="w-5 h-5" />,
      label: "AI Chat",
      onClick: () => setActivePanel("conversation"),
      isActive: activePanel === "conversation",
    },
    {
      id: "system",
      icon: <Activity cclassName="w-5 h-5" />,
      label: "System",
      onClick: () => setActivePanel("system"),
      isActive: activePanel === "system",
    },
  ];

  return (
    <div
      cclassName={cn(
        "h-screen bg-mac-surface-bg text-mac-text-primary overflow-hidden relative",
        "mac-background",
        cclassName
      )}
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      {/* MAC Floating Background Orbs */}
      <div cclassName="mac-floating-background"></div>

      {/* Professional Header */}
      <header cclassName="relative z-10 border-b border-mac-border bg-mac-surface-elevated/50 backdrop-blur-xl">
        <div cclassName="flex items-center justify-between px-6 py-4">
          {/* Logo/Title */}
          <div cclassName="flex items-center space-x-4">
            <div cclassName="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent opacity-90" />
            <div>
              <h1
                cclassName="mac-heading"
                cclassName="mac-heading text-lg font-extralight text-mac-text-primary tracking-wide"
              >
                SIAM
              </h1>
              <p cclassName="text-xs font-thin text-mac-text-muted tracking-wider uppercase">
                Professional Meeting Intelligence
              </p>
            </div>
          </div>

          {/* Professional Navigation Panel Toggle */}
          {showNavigationPanel && (
            <nav cclassName="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  cclassName={cn(
                    "mac-button mac-button-ghost px-4 py-2 flex items-center space-x-2",
                    item.isActive && "mac-button-primary"
                  )}
                >
                  {item.icon}
                  <span cclassName="text-sm font-thin">{item.label}</span>
                </button>
              ))}
            </nav>
          )}

          {/* Status & Settings */}
          <div cclassName="flex items-center space-x-4">
            <div cclassName="flex items-center space-x-2">
              <div
                cclassName={cn(
                  "w-2 h-2 rounded-full",
                  isRecording ? "bg-red-400 animate-mac-pulse" : "bg-green-400 animate-mac-pulse"
                )}
              />
              <span cclassName="text-sm font-thin text-mac-text-secondary">
                {isRecording ? "Recording" : "Ready"}
              </span>
            </div>

            {onToggleSettings && (
              <button onClick={onToggleSettings} cclassName="mac-button mac-button-ghost p-2">
                <Settings cclassName="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div cclassName="relative flex h-[calc(100vh-73px)]">
        {/* Left Sidebar */}
        {leftSidebar && (
          <aside cclassName="w-80 backdrop-blur-2xl bg-mac-surface-elevated/80 border-r border-mac-border">
            {leftSidebar}
          </aside>
        )}

        {/* Main Content Area */}
        <main cclassName="flex-1 relative overflow-hidden">{children}</main>

        {/* Right Sidebar */}
        {rightSidebar && (
          <aside cclassName="w-80 backdrop-blur-2xl bg-mac-surface-elevated/80 border-l border-mac-border">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
};

// Professional Card Component (from previous ProfessionalLayout)
export const ProfessionalCard: React.FC<{
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  cclassName?: string;
}> = ({ title, children, actions, cclassName = "" }) => {
  return (
    <div cclassName={cn("mac-card mac-shimmer", cclassName)}>
      <div cclassName="flex items-center justify-between mb-4">
        <h3 cclassName="mac-title">
          {title}
        </h3>
        {actions && <div cclassName="flex items-center space-x-2">{actions}</div>}
      </div>
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
      cclassName={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-light border",
        getStatusStyles()
      )}
    >
      {children}
    </span>
  );
};

// Dashboard Grid Component
export const DashboardGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div cclassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>;
};

// Button Group Component
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  cclassName?: string;
}> = ({ children, cclassName = "" }) => {
  return <div cclassName={cn("flex items-center space-x-3", cclassName)}>{children}</div>;
};
