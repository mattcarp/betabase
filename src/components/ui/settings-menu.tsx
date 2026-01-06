"use client";

import React from "react";
import { Settings, Bug } from "lucide-react";
import { useTesterStore } from "../../lib/use-tester-store";
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

export function SettingsMenu() {
  const { isTesterModeEnabled, setTesterMode } = useTesterStore();

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
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg mac-glass border-mac-border"
            side="top"
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
            <div className="p-2">
              <div className="flex items-center justify-between space-x-2 rounded-md p-2 hover:bg-mac-surface-elevated/50">
                <div className="flex items-center space-x-2">
                  <div className={`p-1 rounded ${isTesterModeEnabled ? 'bg-orange-500/20 text-orange-500' : 'bg-mac-surface-elevated text-mac-text-muted'}`}>
                    <Bug className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <span className="text-sm font-medium text-mac-text-primary">Tester Mode</span>
                    <span className="text-xs text-mac-text-secondary">Enable feedback tool</span>
                  </div>
                </div>
                 <Switch
                  checked={isTesterModeEnabled}
                  onCheckedChange={setTesterMode}
                  className="data-[state=checked]:bg-orange-500"
                />
              </div>
            </div>
            <DropdownMenuSeparator className="bg-mac-border" />
             <DropdownMenuItem className="mac-dropdown-item text-xs text-mac-text-muted cursor-default">
              v0.24.83
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
