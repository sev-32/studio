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
import type { Dispatch, SetStateAction, MouseEvent, WheelEvent } from 'react';
import { useRef, useEffect, useCallback } from 'react';
import type { MagicWandSettings, Tool } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Presets } from '@/lib/presets';

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
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    clearCanvas(selectionCanvasRef.current);
    clearCanvas(previewCanvasRef.current);
  }, [currentImage]);

  const performMagicWand = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      startX: number,
      startY: number,
      settings: MagicWandSettings
    ) => {
      const image = imageRef.current;
      if (!image) return;

      const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) return;

      const { width, height } = targetCanvas;
      tempCanvas.width = width;
      tempCanvas.height = height;

      try {
        tempCtx.drawImage(image, 0, 0, width, height);
        const originalImageData = tempCtx.getImageData(0, 0, width, height);
        const maskImageData = ctx.createImageData(width, height);

        const { tolerance, contiguous } = settings;
        const imageData = originalImageData.data;
        const maskData = maskImageData.data;

        const visited = new Uint8Array(width * height);
        const stack = [[startX, startY]];

        const startIdx = (startY * width + startX) * 4;
        const startR = imageData[startIdx];
        const startG = imageData[startIdx + 1];
        const startB = imageData[startIdx + 2];

        const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
          return Math.sqrt(
            Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
          );
        };

        if (contiguous) {
          while (stack.length > 0) {
            const [x, y] = stack.pop()!;
            if (x < 0 || x >= width || y < 0 || y >= height) continue;

            const index = y * width + x;
            if (visited[index]) continue;
            visited[index] = 1;

            const dataIndex = index * 4;
            const r = imageData[dataIndex];
            const g = imageData[dataIndex + 1];
            const b = imageData[dataIndex + 2];

            const distance = colorDistance(r, g, b, startR, startG, startB);

            if (distance <= tolerance) {
              maskData[dataIndex] = 50;
              maskData[dataIndex + 1] = 150;
              maskData[dataIndex + 2] = 255;
              maskData[dataIndex + 3] = 128;
              stack.push([x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]);
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
        
        clearCanvas(targetCanvas);
        ctx.putImageData(maskImageData, 0, 0);

      } catch (e: any) {
        if (e.message.includes('cross-origin')) {
             toast({
                variant: 'destructive',
                title: 'Cross-origin Image Error',
                description: "Cannot process image from another domain. Please select another image.",
            });
        } else {
            console.error('Error during magic wand operation:', e);
            toast({
                variant: 'destructive',
                title: 'An error occurred',
                description: e.message || 'Could not perform the magic wand selection.',
            });
        }
      }
    },
    [toast]
  );

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand' || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    performMagicWand(canvas, x, y, wandSettings);
  };
  
  const handleMouseLeave = () => {
    clearCanvas(previewCanvasRef.current);
  };

  const handleCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand' || !selectionCanvasRef.current || !previewCanvasRef.current) return;
    
    const selectionCtx = selectionCanvasRef.current.getContext('2d');
    if (!selectionCtx) return;

    // "Commit" the preview canvas to the main selection canvas
    selectionCtx.drawImage(previewCanvasRef.current, 0, 0);
  };
  
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand') return;
    event.preventDefault();

    setWandSettings(prevSettings => {
        const newTolerance = Math.max(0, Math.min(255, prevSettings.tolerance - Math.sign(event.deltaY)));
        return { ...prevSettings, tolerance: newTolerance };
    });
  };

  const setCanvasSize = useCallback(() => {
    const container = imageRef.current?.parentElement;
    if (container && selectionCanvasRef.current && previewCanvasRef.current) {
      const { width, height } = container.getBoundingClientRect();
      selectionCanvasRef.current.width = width;
      selectionCanvasRef.current.height = height;
      previewCanvasRef.current.width = width;
      previewCanvasRef.current.height = height;
    }
  }, []);

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
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
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
            onLoad={setCanvasSize}
          />
          <canvas
            ref={selectionCanvasRef}
            className="absolute left-0 top-0 h-full w-full object-cover"
            style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
          />
          <canvas
            ref={previewCanvasRef}
            className="absolute left-0 top-0 h-full w-full object-cover opacity-75"
            style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
