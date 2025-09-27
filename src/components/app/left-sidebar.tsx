'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  Wand2,
  Lasso,
  Layers,
  Undo2,
  Settings,
  UserCircle,
} from 'lucide-react';
import type { Tool } from '@/lib/types';
import React from 'react';

interface LeftSidebarProps {
  activeTool: Tool;
  setActiveTool: Dispatch<SetStateAction<Tool>>;
  onClearPoints: () => void;
}

export function LeftSidebar({ activeTool, setActiveTool, onClearPoints }: LeftSidebarProps) {
  const handleSetActiveTool = React.useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, [setActiveTool]);

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader className="flex items-center justify-center p-2">
        <h1 className="font-headline text-2xl font-bold text-primary group-data-[state=expanded]:block hidden">
          S
        </h1>
        <h1 className="font-headline text-2xl font-bold text-primary group-data-[state=collapsed]:block hidden">
          S
        </h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleSetActiveTool('wand')}
              isActive={activeTool === 'wand'}
              tooltip="Magic Wand (W)"
            >
              <Wand2 />
              <span>Magic Wand</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleSetActiveTool('lasso')}
              isActive={activeTool === 'lasso'}
              tooltip="Magic Lasso (L)"
            >
              <Lasso />
              <span>Magic Lasso</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleSetActiveTool('layers')}
              isActive={activeTool === 'layers'}
              tooltip="Layers (C)"
            >
              <Layers />
              <span>Layers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onClearPoints}
              tooltip="Clear Points (Esc)"
            >
              <Undo2 />
              <span>Clear Points</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Account">
              <UserCircle />
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
