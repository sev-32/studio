'use client';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Image as ImageIcon } from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { Dispatch, SetStateAction, MouseEvent } from 'react';
import { useRef, useEffect } from 'react';
import type { MagicWandSettings, Tool } from '@/lib/types';

interface CanvasAreaProps {
  currentImage: ImagePlaceholder;
  setCurrentImage: Dispatch<SetStateAction<ImagePlaceholder>>;
  activeTool: Tool;
  wandSettings: MagicWandSettings;
}

export function CanvasArea({
  currentImage,
  setCurrentImage,
  activeTool,
  wandSettings,
}: CanvasAreaProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    clearCanvas();
  }, [currentImage]);

  const handleCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand' || !canvasRef.current || !imageRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    // Draw the image to the canvas to get pixel data
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(imageRef.current!, 0, 0, canvas.width, canvas.height);

    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const clickedPixelData = tempCtx.getImageData(x, y, 1, 1).data;
    
    performMagicWand(imageData, x, y, clickedPixelData, wandSettings.tolerance);

    ctx.putImageData(imageData, 0, 0);
  };
  
  const performMagicWand = (imageData: ImageData, startX: number, startY: number, targetColor: Uint8ClampedArray, tolerance: number) => {
    const { width, height, data } = imageData;
    const visited = new Uint8Array(width * height);
    const stack = [[startX, startY]];
  
    const [tr, tg, tb] = targetColor;
  
    const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
      return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
    };

    // Clear data for new selection, but make it transparent
    for (let i = 3; i < data.length; i += 4) {
      data[i] = 0;
    }
  
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
  
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
  
      const index = (y * width + x);
      if (visited[index]) continue;
      
      visited[index] = 1; // Mark as visited
  
      const dataIndex = index * 4;
      const r = data[dataIndex];
      const g = data[dataIndex + 1];
      const b = data[dataIndex + 2];
  
      const distance = colorDistance(r, g, b, tr, tg, tb);
  
      if (distance <= tolerance) {
        data[dataIndex + 3] = 255; // Set alpha to full for selected pixels
  
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="font-headline">Canvas</CardTitle>
          <CardDescription>
            Select an image and use the tools to create segments.
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ImageIcon className="mr-2" />
              Change Image
              <ChevronDown className="ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {PlaceHolderImages.map((img) => (
              <DropdownMenuItem
                key={img.id}
                onSelect={() => setCurrentImage(img)}
              >
                {img.description}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div
          className="relative aspect-[3/2] w-full cursor-crosshair overflow-hidden rounded-lg border bg-secondary"
          onClick={handleCanvasClick}
        >
          <Image
            ref={imageRef}
            src={currentImage.imageUrl}
            alt={currentImage.description}
            fill
            className="object-cover"
            data-ai-hint={currentImage.imageHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            crossOrigin="anonymous"
            onLoadingComplete={(img) => {
              if (canvasRef.current) {
                canvasRef.current.width = img.naturalWidth;
                canvasRef.current.height = img.naturalHeight;
              }
            }}
          />
          <canvas
            ref={canvasRef}
            className="absolute left-0 top-0 h-full w-full object-cover"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
