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
import { useRef, useEffect, useCallback, useState } from 'react';
import type { MagicWandSettings, Tool } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { colorConverters } from '@/lib/color-converters';

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
  const [lastMousePosition, setLastMousePosition] = useState<{x: number, y: number} | null>(null);

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
      
      const { naturalWidth, naturalHeight } = image;
      const { width, height } = targetCanvas;

      // Adjust start coordinates based on rendered image size vs natural size
      const scaledX = Math.floor(startX * (naturalWidth / width));
      const scaledY = Math.floor(startY * (naturalHeight / height));

      tempCanvas.width = naturalWidth;
      tempCanvas.height = naturalHeight;
      

      try {
        tempCtx.drawImage(image, 0, 0, naturalWidth, naturalHeight);
        const originalImageData = tempCtx.getImageData(0, 0, naturalWidth, naturalHeight);
        const maskImageData = ctx.createImageData(width, height);

        const { tolerance, contiguous, colorSpace } = settings;
        const imageData = originalImageData.data;
        const maskData = maskImageData.data;
        const maskVisited = new Uint8Array(width * height);


        const getDistance = (c1: number[], c2: number[]) => {
            if (colorSpace === 'hsv') {
                const dh = Math.min(Math.abs(c1[0] - c2[0]), 360 - Math.abs(c1[0] - c2[0]));
                const ds = Math.abs(c1[1] - c2[1]);
                const dv = Math.abs(c1[2] - c2[2]);
                // A weighted distance, hue is perceptually more significant
                return Math.sqrt(dh * dh * 2 + ds * ds + dv * dv);
            }
             // For LAB and RGB, Euclidean distance works well
            return Math.sqrt(
                Math.pow(c1[0] - c2[0], 2) +
                Math.pow(c1[1] - c2[1], 2) +
                Math.pow(c1[2] - c2[2], 2)
            );
        };
        
        const convertColor = (r: number, g: number, b: number) => {
            switch(colorSpace) {
                case 'hsv': return colorConverters.rgbToHsv(r, g, b);
                case 'lab': return colorConverters.rgbToLab(r, g, b);
                case 'quaternion': // Placeholder
                    return [r,g,b];
                case 'rgb':
                default:
                    return [r, g, b];
            }
        };


        const startIdx = (scaledY * naturalWidth + scaledX) * 4;
        const startR = imageData[startIdx];
        const startG = imageData[startIdx + 1];
        const startB = imageData[startIdx + 2];
        const startColor = convertColor(startR, startG, startB);

        const queue: [number, number][] = [[scaledX, scaledY]];
        const visited = new Uint8Array(naturalWidth * naturalHeight);
        visited[scaledY * naturalWidth + scaledX] = 1;


        while (queue.length > 0) {
            const [x, y] = queue.shift()!;
             
            const renderX = Math.floor(x * (width / naturalWidth));
            const renderY = Math.floor(y * (height / naturalHeight));
            const maskIndex = (renderY * width + renderX);

            if (maskVisited[maskIndex]) {
              continue;
            }
            maskVisited[maskIndex] = 1;

            const maskDataIndex = maskIndex * 4;
            maskData[maskDataIndex] = 50;
            maskData[maskDataIndex + 1] = 150;
            maskData[maskDataIndex + 2] = 255;
            maskData[maskDataIndex + 3] = 128;

            const neighbors = [
                [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y]
            ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < naturalWidth && ny >= 0 && ny < naturalHeight) {
                    const neighborIndex = ny * naturalWidth + nx;
                    if (visited[neighborIndex]) {
                        continue;
                    }
                    visited[neighborIndex] = 1;
                    
                    const dataIndex = neighborIndex * 4;
                    const r = imageData[dataIndex];
                    const g = imageData[dataIndex + 1];
                    const b = imageData[dataIndex + 2];

                    const neighborColor = convertColor(r, g, b);
                    const distance = getDistance(startColor, neighborColor);

                    if (distance <= tolerance) {
                        queue.push([nx, ny]);
                    }
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
  
  // Rerun wand selection when settings change
  useEffect(() => {
    if (activeTool !== 'wand' || !previewCanvasRef.current || !lastMousePosition) return;
    performMagicWand(previewCanvasRef.current, lastMousePosition.x, lastMousePosition.y, wandSettings);
  }, [wandSettings, activeTool, lastMousePosition, performMagicWand]);


  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand') return;
    const canvas = previewCanvasRef.current;
     if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    setLastMousePosition({x, y});

    // The useEffect will handle calling performMagicWand
  };
  
  const handleMouseLeave = () => {
    clearCanvas(previewCanvasRef.current);
    setLastMousePosition(null);
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
    event.preventDefault(); // Prevent page scrolling

    setWandSettings(prevSettings => {
        const newTolerance = Math.max(0, Math.min(255, prevSettings.tolerance - Math.sign(event.deltaY) * 5));
        return { ...prevSettings, tolerance: newTolerance };
    });
  };

  const setCanvasSize = useCallback(() => {
    const container = imageRef.current?.parentElement;
    if (container && selectionCanvasRef.current && previewCanvasRef.current && imageRef.current) {
      const { width, height } = container.getBoundingClientRect();
      selectionCanvasRef.current.width = width;
      selectionCanvasRef.current.height = height;
      previewCanvasRef.current.width = width;
      previewCanvasRef.current.height = height;

      // When the image loads or changes, ensure we re-run any existing preview
       if (lastMousePosition) {
           performMagicWand(previewCanvasRef.current, lastMousePosition.x, lastMousePosition.y, wandSettings);
       }
    }
  }, [lastMousePosition, wandSettings, performMagicWand]);


  useEffect(() => {
    const imageEl = imageRef.current;
    if (!imageEl) return;
    
    // Add event listener for resize to adjust canvas
    const resizeObserver = new ResizeObserver(() => {
        setCanvasSize();
    });
    resizeObserver.observe(imageEl.parentElement!);

    return () => {
        resizeObserver.disconnect();
    }
  }, [setCanvasSize]);

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
          className="relative aspect-video w-full cursor-crosshair overflow-hidden rounded-lg border bg-secondary"
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
            className="object-contain"
            data-ai-hint={currentImage.imageHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            crossOrigin="anonymous"
            onLoad={setCanvasSize}
          />
          <canvas
            ref={selectionCanvasRef}
            className="absolute left-0 top-0 h-full w-full object-contain"
            style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
          />
          <canvas
            ref={previewCanvasRef}
            className="absolute left-0 top-0 h-full w-full object-contain opacity-75"
            style={{ imageRendering: 'pixelated', pointerEvents: 'none' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
