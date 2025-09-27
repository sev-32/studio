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

    // Draw the image to a temporary canvas to get pixel data without affecting the visible image
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(imageRef.current!, 0, 0, canvas.width, canvas.height);
    
    // This is the imageData of the original image
    const originalImageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);

    // This will be the mask we draw on top
    const maskImageData = ctx.createImageData(canvas.width, canvas.height);

    performMagicWand(originalImageData, maskImageData, x, y, wandSettings.tolerance);

    // Clear previous selection and draw the new one
    clearCanvas();
    ctx.putImageData(maskImageData, 0, 0);
  };
  
  const performMagicWand = (
    image: ImageData,
    mask: ImageData,
    startX: number,
    startY: number,
    tolerance: number,
  ) => {
    const { width, height } = image;
    const imageData = image.data;
    const maskData = mask.data;

    const visited = new Uint8Array(width * height);
    const stack = [[startX, startY]];
    
    const startIdx = (startY * width + startX) * 4;
    const startR = imageData[startIdx];
    const startG = imageData[startIdx + 1];
    const startB = imageData[startIdx + 2];

    const colorDistance = (
      r1: number, g1: number, b1: number, 
      r2: number, g2: number, b2: number
    ) => {
      return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
    };
  
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
  
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
  
      const index = y * width + x;
      if (visited[index]) continue;
      
      const dataIndex = index * 4;
      const r = imageData[dataIndex];
      const g = imageData[dataIndex + 1];
      const b = imageData[dataIndex + 2];
  
      const distance = colorDistance(r, g, b, startR, startG, startB);
  
      if (distance <= tolerance) {
        visited[index] = 1; // Mark as visited
        // Set selection color (e.g., semi-transparent blue)
        maskData[dataIndex] = 50;     // R
        maskData[dataIndex + 1] = 150; // G
        maskData[dataIndex + 2] = 255; // B
        maskData[dataIndex + 3] = 128; // Alpha
  
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
                // Set canvas dimensions based on the aspect ratio of the container
                const container = canvasRef.current.parentElement;
                if(container) {
                    const { width, height } = container.getBoundingClientRect();
                    canvasRef.current.width = width;
                    canvasRef.current.height = height;

                    // also resize the image to fit the container
                    img.width = width;
                    img.height = height;
                }
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
