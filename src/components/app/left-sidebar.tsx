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

interface LeftSidebarProps {
  activeTool: Tool;
  setActiveTool: Dispatch<SetStateAction<Tool>>;
}

export function LeftSidebar({ activeTool, setActiveTool }: LeftSidebarProps) {
  return (
    <>
      <SidebarHeader className="flex items-center justify-between p-2">
        <h1 className="font-headline text-2xl font-bold text-primary">
          Segmentify
        </h1>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent className="flex-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTool('wand')}
              isActive={activeTool === 'wand'}
              tooltip="Magic Wand (W)"
            >
              <Wand2 />
              <span>Magic Wand</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTool('lasso')}
              isActive={activeTool === 'lasso'}
              tooltip="Magic Lasso (L)"
            >
              <Lasso />
              <span>Magic Lasso</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setActiveTool('layers')}
              isActive={activeTool === 'layers'}
              tooltip="Layers (C)"
            >
              <Layers />
              <span>Layers</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {}} // Placeholder for undo
              tooltip="Undo (Ctrl+Z)"
            >
              <Undo2 />
              <span>Undo</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <UserCircle />
              <span>Account</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}
