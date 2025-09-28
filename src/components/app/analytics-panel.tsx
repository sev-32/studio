'use client';
import { SidebarGroup, SidebarGroupLabel } from '../ui/sidebar';

export function AnalyticsPanel({ pixelData }: { pixelData: any }) {
  const gridSize = 9;
  const cellSize = 12;

  const renderPixelGrid = () => {
    if (!pixelData?.pixelGrid) {
      return (
        <div
          className="flex items-center justify-center bg-secondary"
          style={{
            width: `${gridSize * cellSize}px`,
            height: `${gridSize * cellSize}px`,
          }}
        >
          <p className="text-xs text-muted-foreground text-center">
            Hover over image
          </p>
        </div>
      );
    }

    const { data, width, height } = pixelData.pixelGrid;
    const grid = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const isCenter =
          x === Math.floor(width / 2) && y === Math.floor(height / 2);

        grid.push(
          <div
            key={`${y}-${x}`}
            className={`flex items-center justify-center ${
              isCenter ? 'ring-2 ring-inset ring-white' : ''
            }`}
            style={{
              backgroundColor: `rgb(${r}, ${g}, ${b})`,
              width: `${cellSize}px`,
              height: `${cellSize}px`,
            }}
          />
        );
      }
    }
    return (
      <div
        className="grid overflow-hidden rounded-md border"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          width: `${width * cellSize}px`,
          height: `${height * cellSize}px`,
        }}
      >
        {grid}
      </div>
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">Inspector</SidebarGroupLabel>
      <div className="p-2 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-sm">Pixel Grid</h3>
            <p className="text-xs text-muted-foreground">
              Zoomed view of pixels around the cursor.
            </p>
          </div>
          {renderPixelGrid()}
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coords:</span>
            <span className="font-mono">
              {pixelData ? `${pixelData.coords.x}, ${pixelData.coords.y}` : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">RGB:</span>
            <span className="font-mono">
              {pixelData?.color?.rgb.join(', ') || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">HSV:</span>
            <span className="font-mono">
              {pixelData?.color?.hsv.join(', ') || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">LAB:</span>
            <span className="font-mono">
              {pixelData?.color?.lab.join(', ') || 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </SidebarGroup>
  );
}
