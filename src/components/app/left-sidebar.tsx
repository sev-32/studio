'use client';

import type { Dispatch, SetStateAction } from 'react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
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
    <>
      <SidebarHeader className="flex items-center justify-between p-2">
        <h1 className="font-headline text-2xl font-bold text-primary">
          S
        </h1>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleSetActiveTool('wand')}
              isActive={activeTool === 'wand'}
              tooltip="Magic Wand (W)"
            >
              <Wand2 />
              <span className="sr-only">Magic Wand</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleSetActiveTool('lasso')}
              isActive={activeTool === 'lasso'}
              tooltip="Magic Lasso (L)"
            >
              <Lasso />
              <span className="sr-only">Magic Lasso</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => handleSetActiveTool('layers')}
              isActive={activeTool === 'layers'}
              tooltip="Layers (C)"
            >
              <Layers />
              <span className="sr-only">Layers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onClearPoints}
              tooltip="Clear Points (Esc)"
            >
              <Undo2 />
              <span className="sr-only">Clear Points</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <Settings />
              <span className="sr-only">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Account">
              <UserCircle />
              <span className="sr-only">Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
