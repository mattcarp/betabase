import React from "react";
import { cn } from "../../../lib/utils";

interface SiamLayoutProps {
  children?: React.ReactNode;
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  className?: string;
}

export const SiamLayout: React.FC<SiamLayoutProps> = ({
  children,
  leftSidebar,
  rightSidebar,
  className,
}) => {
  return (
    <div
      className={cn(
        "h-screen bg-mac-surface-bg text-mac-text-primary font-sans overflow-hidden relative mac-background",
        className,
      )}
    >
      {/* MAC Floating Background Orbs */}
      <div className="mac-floating-background">
        <div className="mac-floating-orb"></div>
        <div className="mac-floating-orb"></div>
        <div className="mac-floating-orb"></div>
      </div>

      {/* Main Layout */}
      <div className="relative flex h-screen">
        {/* Left Sidebar - Conversation History */}
        {leftSidebar && (
          <aside className="w-80 backdrop-blur-2xl bg-mac-surface-elevated/80 border-r border-mac-border">
            {leftSidebar}
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 backdrop-blur-2xl bg-mac-surface-bg/90 relative pb-8">
          {children}
        </main>

        {/* Right Sidebar - Tools & Navigation */}
        {rightSidebar && (
          <aside className="w-80 backdrop-blur-2xl bg-mac-surface-elevated/80 border-l border-mac-border">
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
};
