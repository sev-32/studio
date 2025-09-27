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
import { useToast } from '@/hooks/use-toast';

interface CanvasAreaProps {
  currentImage: ImagePlaceholder;
  setCurrentImage: Dispatch<SetStateAction<ImagePlaceholder>>;
  activeTool: Tool;
  wandSettings: MagicWandSettings;
  setWandSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  autoDetectMode: boolean;
}

export function CanvasArea({
  currentImage,
  setCurrentImage,
  activeTool,
  wandSettings,
  setWandSettings,
  autoDetectMode,
}: CanvasAreaProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

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

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!autoDetectMode || !canvasRef.current || !imageRef.current) return;

    // Placeholder for auto-detection logic on hover
  };

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

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;

    const { width, height } = canvas;
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.drawImage(imageRef.current, 0, 0, width, height);

    try {
      const originalImageData = tempCtx.getImageData(0, 0, width, height);
      const maskImageData = ctx.createImageData(width, height);

      performMagicWand(originalImageData, maskImageData, x, y, wandSettings);

      clearCanvas();
      ctx.putImageData(maskImageData, 0, 0);
    } catch (e: any) {
      console.error('Error during magic wand operation:', e);
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description:
          e.message || 'Could not perform the magic wand selection.',
      });
    }
  };

  const performMagicWand = (
    image: ImageData,
    mask: ImageData,
    startX: number,
    startY: number,
    settings: MagicWandSettings
  ) => {
    const { width, height } = image;
    const imageData = image.data;
    const maskData = mask.data;
    const { tolerance, contiguous, connectivity } = settings;

    const visited = new Uint8Array(width * height);
    const stack = [[startX, startY]];

    const startIdx = (startY * width + startX) * 4;
    const startR = imageData[startIdx];
    const startG = imageData[startIdx + 1];
    const startB = imageData[startIdx + 2];

    const colorDistance = (
      r1: number,
      g1: number,
      b1: number,
      r2: number,
      g2: number,
      b2: number
    ) => {
      return Math.sqrt(
        Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
      );
    };

    const neighbors =
      connectivity === '8'
        ? [
            [0, -1], [1, -1], [1, 0], [1, 1],
            [0, 1], [-1, 1], [-1, 0], [-1, -1],
          ]
        : [
            [0, -1], [1, 0], [0, 1], [-1, 0],
          ];

    if (contiguous) {
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
          visited[index] = 1;
          maskData[dataIndex] = 50;
          maskData[dataIndex + 1] = 150;
          maskData[dataIndex + 2] = 255;
          maskData[dataIndex + 3] = 128;

          for (const [dx, dy] of neighbors) {
            stack.push([x + dx, y + dy]);
          }
        }
      }
    } else {
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const distance = colorDistance(r, g, b, startR, startG, startB);

        if (distance <= tolerance) {
          maskData[i] = 50;
          maskData[i + 1] = 150;
          maskData[i + 2] = 255;
          maskData[i + 3] = 128;
        }
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
          onMouseMove={handleMouseMove}
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
                const container = canvasRef.current.parentElement;
                if (container) {
                  const { width, height } = container.getBoundingClientRect();
                  canvasRef.current.width = width;
                  canvasRef.current.height = height;
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
