"use client";

import React, { useState } from "react";
import { useTheme, type ThemeName } from "../../contexts/ThemeContext";
import { Palette, Check, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { cn } from "../../lib/utils";

/**
 * Theme Switcher Component
 * Allows users to switch between available themes from the sidebar
 */
export function ThemeSwitcher() {
  const { currentTheme, setTheme, isTransitioning, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const handleThemeChange = (theme: ThemeName) => {
    if (theme !== currentTheme && !isTransitioning) {
      setTheme(theme);
      setIsOpen(false);
    }
  };

  // Get current theme info
  const currentThemeInfo = availableThemes.find((t) => t.id === currentTheme);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 text-sm font-normal",
            "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
            isTransitioning && "opacity-50 cursor-wait"
          )}
          disabled={isTransitioning}
        >
          <Palette className="h-4 w-4" />
          <span className="flex-1 text-left">
            {isTransitioning ? "Switching..." : currentThemeInfo?.name || "Theme"}
          </span>
          {isTransitioning && <Sparkles className="h-3 w-3 animate-pulse" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="right"
        className="w-64"
        sideOffset={8}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          Choose Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {availableThemes.map((theme) => {
          const isActive = theme.id === currentTheme;
          const themeIcon = getThemeIcon(theme.id);

          return (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              disabled={isTransitioning || isActive}
              className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{themeIcon}</span>
                  <span className="font-medium">{theme.name}</span>
                </div>
                {isActive && <Check className="h-4 w-4 text-green-500" />}
              </div>
              <span className="text-xs text-muted-foreground">
                {theme.description}
              </span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator />
        <div className="px-3 py-2 text-xs text-muted-foreground">
          💡 Tip: You can also switch themes using voice commands
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Theme icon helper
 */
function getThemeIcon(theme: ThemeName): string {
  switch (theme) {
    case "mac":
      return "💙";
    case "jarvis":
      return "🔷";
    case "aoma":
      return "🟠";
    default:
      return "🎨";
  }
}

/**
 * Compact Theme Switcher for mobile/small screens
 */
export function CompactThemeSwitcher() {
  const { currentTheme, setTheme, isTransitioning, availableThemes } = useTheme();

  const cycleTheme = () => {
    if (isTransitioning) return;

    const currentIndex = availableThemes.findIndex((t) => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const nextTheme = availableThemes[nextIndex];

    setTheme(nextTheme.id);
  };

  const currentThemeInfo = availableThemes.find((t) => t.id === currentTheme);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      disabled={isTransitioning}
      className={cn(
        "h-8 w-8",
        isTransitioning && "opacity-50 cursor-wait"
      )}
      title={`Current: ${currentThemeInfo?.name}. Click to switch.`}
    >
      {isTransitioning ? (
        <Sparkles className="h-4 w-4 animate-pulse" />
      ) : (
        <Palette className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Theme Preview Card (for settings page)
 */
interface ThemePreviewCardProps {
  theme: {
    id: ThemeName;
    name: string;
    description: string;
    preview?: string;
  };
  isActive: boolean;
  onSelect: (theme: ThemeName) => void;
}

export function ThemePreviewCard({ theme, isActive, onSelect }: ThemePreviewCardProps) {
  return (
    <button
      onClick={() => onSelect(theme.id)}
      className={cn(
        "relative flex flex-col gap-3 p-4 rounded-lg border-2 transition-all",
        "hover:scale-105 hover:shadow-lg",
        isActive
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/50"
      )}
    >
      {/* Preview Image */}
      <div className="aspect-video w-full bg-muted rounded-md overflow-hidden">
        {theme.preview ? (
          <img
            src={theme.preview}
            alt={`${theme.name} preview`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {getThemeIcon(theme.id)}
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div className="text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-normal">{theme.name}</h3>
          {isActive && <Check className="h-5 w-5 text-green-500" />}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
      </div>

      {/* Active Indicator */}
      {isActive && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
          Active
        </div>
      )}
    </button>
  );
}
