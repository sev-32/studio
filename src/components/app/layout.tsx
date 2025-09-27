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
import type { MagicLassoSettings, MagicWandSettings, Tool } from '@/lib/types';
import { useState } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function AppLayout() {
  const [activeTool, setActiveTool] = useState<Tool>('wand');
  const [currentImage, setCurrentImage] = useState(PlaceHolderImages[0]);
  const [wandSettings, setWandSettings] = useState<MagicWandSettings>({
    tolerance: 30,
    contiguous: true,
    colorSpace: 'rgb',
    connectivity: '4',
  });
  const [lassoSettings, setLassoSettings] = useState<MagicLassoSettings>({
    nodeDropTime: 200,
    elasticity: 0.5,
    costFunction: 'sobel',
  });

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
            <RightSidebar
              activeTool={activeTool}
              wandSettings={wandSettings}
              setWandSettings={setWandSettings}
              lassoSettings={lassoSettings}
              setLassoSettings={setLassoSettings}
            />
          </Sidebar>
        </div>
      </div>
    </SidebarProvider>
  );
}
