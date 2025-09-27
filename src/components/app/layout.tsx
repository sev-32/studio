'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { CanvasArea } from './canvas-area';
import { AnalyticsPanel } from './analytics-panel';
import type { Tool } from '@/lib/types';
import { useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AppLayout() {
  const [activeTool, setActiveTool] = useState<Tool>('wand');
  const [currentImage, setCurrentImage] = useState(PlaceHolderImages[0]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full flex-col">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar side="left">
            <LeftSidebar activeTool={activeTool} setActiveTool={setActiveTool} />
          </Sidebar>

          <SidebarInset className="flex flex-col">
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <CanvasArea
                currentImage={currentImage}
                setCurrentImage={setCurrentImage}
              />
              <AnalyticsPanel />
            </main>
          </SidebarInset>

          <Sidebar side="right">
            <RightSidebar activeTool={activeTool} currentImage={currentImage} />
          </Sidebar>
        </div>
      </div>
    </SidebarProvider>
  );
}
