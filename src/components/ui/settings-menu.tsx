"use client";

import React from "react";
import { Settings, Bug, Code, Headset } from "lucide-react";
import { useTechSupportStore } from "../../lib/use-tech-support-store";
import { useTesterStore } from "../../lib/use-tester-store";
import { useProgrammerStore } from "../../lib/use-programmer-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./sidebar";
import { Switch } from "./switch";
import { Button } from "./button";

interface SettingsMenuProps {
  variant?: "sidebar" | "header";
}

export function SettingsMenu({ variant = "sidebar" }: SettingsMenuProps) {
  const { isTechSupportEnabled, setTechSupport } = useTechSupportStore();
  const { isTesterModeEnabled, setTesterMode } = useTesterStore();
  const { isProgrammerModeEnabled, setProgrammerMode } = useProgrammerStore();

  const dropdownContent = (
    <DropdownMenuContent
      className="min-w-56 rounded-lg mac-glass border-mac-border"
      side={variant === "header" ? "bottom" : "top"}
      align="end"
      sideOffset={4}
    >
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-mac-text-primary">App Settings</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator className="bg-mac-border" />
      <div className="p-2 space-y-1">
        {/* Tech Support Staff Toggle - Base role */}
        <div className="flex items-center justify-between space-x-2 rounded-md p-2 hover:bg-mac-surface-elevated/50">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isTechSupportEnabled ? 'bg-green-500/20 text-green-500' : 'bg-mac-surface-elevated text-mac-text-muted'}`}>
              <Headset className="h-4 w-4" />
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-sm font-medium text-mac-text-primary">Tech Support Staff</span>
              <span className="text-xs text-mac-text-secondary">Base chat access</span>
            </div>
          </div>
          <Switch
            checked={isTechSupportEnabled}
            onCheckedChange={setTechSupport}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
        {/* Tester Mode Toggle */}
        <div className="flex items-center justify-between space-x-2 rounded-md p-2 hover:bg-mac-surface-elevated/50">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isTesterModeEnabled ? 'bg-orange-500/20 text-orange-500' : 'bg-mac-surface-elevated text-mac-text-muted'}`}>
              <Bug className="h-4 w-4" />
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-sm font-medium text-mac-text-primary">Tester</span>
              <span className="text-xs text-mac-text-secondary">Testing tools</span>
            </div>
          </div>
          <Switch
            checked={isTesterModeEnabled}
            onCheckedChange={setTesterMode}
            className="data-[state=checked]:bg-orange-500"
          />
        </div>
        {/* Programmer Mode Toggle */}
        <div className="flex items-center justify-between space-x-2 rounded-md p-2 hover:bg-mac-surface-elevated/50">
          <div className="flex items-center space-x-2">
            <div className={`p-1 rounded ${isProgrammerModeEnabled ? 'bg-blue-500/20 text-blue-500' : 'bg-mac-surface-elevated text-mac-text-muted'}`}>
              <Code className="h-4 w-4" />
            </div>
            <div className="flex flex-col space-y-0.5">
              <span className="text-sm font-medium text-mac-text-primary">Programmer</span>
              <span className="text-xs text-mac-text-secondary">Developer tools</span>
            </div>
          </div>
          <Switch
            checked={isProgrammerModeEnabled}
            onCheckedChange={setProgrammerMode}
            className="data-[state=checked]:bg-blue-500"
          />
        </div>
      </div>
      <DropdownMenuSeparator className="bg-mac-border" />
      <DropdownMenuItem className="mac-dropdown-item text-xs text-mac-text-muted cursor-default">
        v0.24.101
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  // Header variant - compact icon-only button
  if (variant === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 mac-button mac-button-outline"
            title="Settings"
            aria-label="Open settings menu"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        {dropdownContent}
      </DropdownMenu>
    );
  }

  // Sidebar variant - original full-width button
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-mac-surface-elevated text-sidebar-primary-foreground border border-mac-border">
                <Settings className="size-4 text-mac-text-primary" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-mac-text-primary">Settings</span>
                <span className="truncate text-xs text-mac-text-secondary">Preferences</span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          {dropdownContent}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
