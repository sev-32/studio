'use client';

import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { LeftSidebar } from './left-sidebar';
import { RightSidebar } from './right-sidebar';
import { CanvasArea } from './canvas-area';
import type {
  MagicLassoSettings,
  MagicWandSettings,
  Tool,
  SegmentGroup,
  Layer,
} from '@/lib/types';
import { useState, useCallback } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function generateRandomColor() {
  const h = Math.floor(Math.random() * 360);
  return `hsla(${h}, 80%, 50%, 0.5)`;
}

export function AppLayout() {
  const [activeTool, setActiveTool] = useState<Tool>('wand');
  const [currentImage, setCurrentImage] = useState(PlaceHolderImages[0]);
  const [autoDetectMode, setAutoDetectMode] = useState(true);
  const [wandSettings, setWandSettings] = useState<MagicWandSettings>({
    tolerance: 30,
    contiguous: true,
    colorSpaces: ['rgb'],
  });
  const [lassoSettings, setLassoSettings] = useState<MagicLassoSettings>({
    nodeDropTime: 200,
    elasticity: 0.5,
    costFunction: 'sobel',
  });

  const [segmentGroups, setSegmentGroups] = useState<SegmentGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const [layers, setLayers] = useState<Layer[]>([]);
  const [hoveredPixelData, setHoveredPixelData] = useState(null);


  const handleClearPoints = useCallback(() => {
    setSegmentGroups([]);
    setActiveGroupId(null);
  }, []);

  const handleCopyToLayer = useCallback(
    (imageData: ImageData) => {
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: `Layer ${layers.length + 1}`,
        imageData,
        visible: true,
      };
      setLayers((prev) => [...prev, newLayer]);
    },
    [layers.length]
  );

  const addNewGroup = (type: 'add' | 'avoid') => {
    const newGroup: SegmentGroup = {
      id: `group-${Date.now()}`,
      name: `${
        type === 'add' ? 'Selection' : 'Avoidance'
      } ${segmentGroups.filter((g) => g.type === type).length + 1}`,
      type,
      color: type === 'add' ? generateRandomColor() : 'hsla(0, 100%, 50%, 0.5)',
      points: [],
      visible: true,
    };
    setSegmentGroups((prev) => [...prev, newGroup]);
    setActiveGroupId(newGroup.id);
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <SidebarProvider defaultOpen={false}>
          <LeftSidebar
            activeTool={activeTool}
            setActiveTool={setActiveTool}
            onClearPoints={handleClearPoints}
          />
          <main className="flex-1 overflow-hidden h-full">
            <CanvasArea
              currentImage={currentImage}
              setCurrentImage={setCurrentImage}
              activeTool={activeTool}
              wandSettings={wandSettings}
              setWandSettings={setWandSettings}
              autoDetectMode={autoDetectMode}
              segmentGroups={segmentGroups}
              setSegmentGroups={setSegmentGroups}
              activeGroupId={activeGroupId}
              setActiveGroupId={setActiveGroupId}
              addNewGroup={addNewGroup}
              layers={layers}
              onCopyToLayer={handleCopyToLayer}
              onClearPoints={handleClearPoints}
              onPixelHover={setHoveredPixelData}
            />
          </main>
        </SidebarProvider>

        <SidebarProvider>
          <Sidebar side="right">
            <RightSidebar
              activeTool={activeTool}
              wandSettings={wandSettings}
              setWandSettings={setWandSettings}
              lassoSettings={lassoSettings}
              setLassoSettings={setLassoSettings}
              autoDetectMode={autoDetectMode}
              setAutoDetectMode={setAutoDetectMode}
              segmentGroups={segmentGroups}
              setSegmentGroups={setSegmentGroups}
              addNewGroup={addNewGroup}
              layers={layers}
              setLayers={setLayers}
              onCopyToLayer={() => {
                // This will be properly implemented later
                console.log('Copy to layer clicked');
              }}
              hoveredPixelData={hoveredPixelData}
            />
          </Sidebar>
        </SidebarProvider>
      </div>
    </div>
  );
}
