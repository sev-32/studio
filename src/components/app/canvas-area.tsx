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
import type {
  MagicWandSettings,
  Tool,
  SeedPoint,
  AvoidancePoint,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { colorConverters } from '@/lib/color-converters';

interface CanvasAreaProps {
  currentImage: ImagePlaceholder;
  setCurrentImage: Dispatch<SetStateAction<ImagePlaceholder>>;
  activeTool: Tool;
  wandSettings: MagicWandSettings;
  setWandSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  autoDetectMode: boolean;
  seedPoints: SeedPoint[];
  setSeedPoints: Dispatch<SetStateAction<SeedPoint[]>>;
  avoidancePoints: AvoidancePoint[];
  setAvoidancePoints: Dispatch<SetStateAction<AvoidancePoint[]>>;
}

export function CanvasArea({
  currentImage,
  setCurrentImage,
  activeTool,
  wandSettings,
  setWandSettings,
  seedPoints,
  setSeedPoints,
  avoidancePoints,
  setAvoidancePoints,
}: CanvasAreaProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const selectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();
  const [lastMousePosition, setLastMousePosition] = useState<SeedPoint | null>(
    null
  );

  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    clearCanvas(selectionCanvasRef.current);
    clearCanvas(previewCanvasRef.current);
    setSeedPoints([]);
    setAvoidancePoints([]);
  }, [currentImage, setSeedPoints, setAvoidancePoints]);

  const performMagicWand = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      points: SeedPoint[],
      settings: MagicWandSettings,
      avoid: AvoidancePoint[]
    ) => {
      const image = imageRef.current;
      if (!image || !image.complete || image.naturalWidth === 0 || points.length === 0) {
          clearCanvas(targetCanvas);
          return;
      };

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) return;

      const { naturalWidth, naturalHeight } = image;
      tempCanvas.width = naturalWidth;
      tempCanvas.height = naturalHeight;
      
      const targetCtx = targetCanvas.getContext('2d');
      if (!targetCtx) return;

      try {
        tempCtx.drawImage(image, 0, 0, naturalWidth, naturalHeight);
        const originalImageData = tempCtx.getImageData(
          0,
          0,
          naturalWidth,
          naturalHeight
        );

        const { tolerance, contiguous, colorSpace } = settings;
        const imageData = originalImageData.data;
        const maskImageData = targetCtx.createImageData(targetCanvas.width, targetCanvas.height);
        const maskData = maskImageData.data;
        const visited = new Uint8Array(naturalWidth * naturalHeight);
        
        const convertColor = (r: number, g: number, b: number) => {
            switch(colorSpace) {
                case 'hsv': return colorConverters.rgbToHsv(r, g, b);
                case 'lab': return colorConverters.rgbToLab(r, g, b);
                case 'rgb':
                default:
                    return [r, g, b];
            }
        };

        const getDistance = (c1: number[], c2: number[], space: string) => {
            if (space === 'hsv') {
                const dh = Math.min(Math.abs(c1[0] - c2[0]), 360 - Math.abs(c1[0] - c2[0])) / 180.0 * 100;
                const ds = Math.abs(c1[1] - c2[1]);
                const dv = Math.abs(c1[2] - c2[2]);
                return Math.sqrt(dh*dh + ds*ds + dv*dv);
            }
            return Math.sqrt(
                Math.pow(c1[0] - c2[0], 2) +
                Math.pow(c1[1] - c2[1], 2) +
                Math.pow(c1[2] - c2[2], 2)
            );
        };
        
        const queue: [number, number][] = [];
        const startColors: number[][] = [];

        points.forEach(point => {
          const { x: startX, y: startY } = point;
          const startIdx = (startY * naturalWidth + startX) * 4;
          const r = imageData[startIdx];
          const g = imageData[startIdx + 1];
          const b = imageData[startIdx + 2];
          startColors.push(convertColor(r, g, b));

          if (visited[startY * naturalWidth + startX] === 0) {
              queue.push([startX, startY]);
              visited[startY * naturalWidth + startX] = 1;
          }
        });

        let head = 0;
        while (head < queue.length) {
            const [x, y] = queue[head++]!;
             
            const renderX = Math.floor(x * (targetCanvas.width / naturalWidth));
            const renderY = Math.floor(y * (targetCanvas.height / naturalHeight));
            const maskDataIndex = (renderY * targetCanvas.width + renderX) * 4;

            maskData[maskDataIndex] = 50;
            maskData[maskDataIndex + 1] = 150;
            maskData[maskDataIndex + 2] = 255;
            maskData[maskDataIndex + 3] = 128;

            const neighbors = [ [x, y - 1], [x, y + 1], [x - 1, y], [x + 1, y] ];

            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < naturalWidth && ny >= 0 && ny < naturalHeight) {
                    const neighborIndex = ny * naturalWidth + nx;
                    if (visited[neighborIndex]) continue;
                    
                    const dataIndex = neighborIndex * 4;
                    const r = imageData[dataIndex];
                    const g = imageData[dataIndex + 1];
                    const b = imageData[dataIndex + 2];
                    const neighborColor = convertColor(r, g, b);

                    // Check against avoidance points
                    let isAvoided = false;
                    for (const avoidPoint of avoid) {
                        const dist = getDistance(neighborColor, avoidPoint.color, settings.colorSpace);
                        if (dist <= avoidPoint.tolerance) {
                            isAvoided = true;
                            break;
                        }
                    }
                    if (isAvoided) continue;

                    let isSimilar = false;
                    for (const startColor of startColors) {
                      const distance = getDistance(startColor, neighborColor, colorSpace);
                      if (distance <= tolerance) {
                          isSimilar = true;
                          break;
                      }
                    }

                    if (isSimilar) {
                      visited[neighborIndex] = 1;
                      if (contiguous) {
                        queue.push([nx, ny]);
                      }
                    }
                }
            }
            if (!contiguous) {
              for(let i=0; i<naturalWidth*naturalHeight; i++){
                if (!visited[i]) {
                  const r = imageData[i*4];
                  const g = imageData[i*4+1];
                  const b = imageData[i*4+2];
                  const pixelColor = convertColor(r, g, b);
                  
                  let isSimilar = false;
                  for (const startColor of startColors) {
                    const distance = getDistance(startColor, pixelColor, colorSpace);
                    if (distance <= tolerance) {
                        isSimilar = true;
                        break;
                    }
                  }

                  if (isSimilar) {
                    visited[i] = 1;
                    const x = i % naturalWidth;
                    const y = Math.floor(i/naturalWidth);
                    queue.push([x,y])
                  }
                }
              }
            }
        }
        
        clearCanvas(targetCanvas);
        targetCtx.putImageData(maskImageData, 0, 0);

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
  
  const getScaledCoords = (event: MouseEvent<HTMLDivElement>): SeedPoint | null => {
    const image = imageRef.current;
    const container = event.currentTarget;
    if (!image || !container || !image.complete || image.naturalWidth === 0) return null;
    
    const containerRect = container.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = image;
    const imageAspect = naturalWidth / naturalHeight;
    
    const { width: containerWidth, height: containerHeight } = containerRect;
    const containerAspect = containerWidth / containerHeight;

    let renderedWidth, renderedHeight, offsetX, offsetY;

    if (containerAspect > imageAspect) {
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageAspect;
      offsetY = 0;
      offsetX = (containerWidth - renderedWidth) / 2;
    } else { 
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    }

    const clientX = event.clientX - containerRect.left - offsetX;
    const clientY = event.clientY - containerRect.top - offsetY;

    if (clientX < 0 || clientX >= renderedWidth || clientY < 0 || clientY >= renderedHeight) {
        return null;
    }

    const naturalX = Math.floor(clientX * (naturalWidth / renderedWidth));
    const naturalY = Math.floor(clientY * (naturalHeight / renderedHeight));
    
    return { x: naturalX, y: naturalY };
  }

  useEffect(() => {
    if (activeTool !== 'wand' || !previewCanvasRef.current || !lastMousePosition) return;

    const pointsToUse = seedPoints.length > 0 ? [...seedPoints, lastMousePosition] : [lastMousePosition];
    performMagicWand(
      previewCanvasRef.current,
      pointsToUse,
      wandSettings,
      avoidancePoints
    );
  }, [wandSettings, activeTool, lastMousePosition, performMagicWand, seedPoints, avoidancePoints]);


  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand') return;
    const coords = getScaledCoords(event);
    if(coords) {
      setLastMousePosition(coords);
    }
  };
  
  const handleMouseLeave = () => {
    clearCanvas(previewCanvasRef.current);
    setLastMousePosition(null);
  };

  const handleCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand' || !selectionCanvasRef.current || !previewCanvasRef.current) return;
    
    const coords = getScaledCoords(event);
    if (!coords) return;
    
    if (event.ctrlKey) {
      // Add to avoidance points
      const image = imageRef.current;
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!image || !tempCtx) return;
      tempCanvas.width = image.naturalWidth;
      tempCanvas.height = image.naturalHeight;
      tempCtx.drawImage(image, 0, 0);
      const pixel = tempCtx.getImageData(coords.x, coords.y, 1, 1).data;
      const color = colorConverters.rgbToHsv(pixel[0], pixel[1], pixel[2]);

      setAvoidancePoints(prev => [...prev, { ...coords, color, tolerance: wandSettings.tolerance }]);
      toast({ title: 'Avoidance point added.' });
      return;
    }

    if (event.shiftKey) {
      // Add to seed points
      setSeedPoints(prev => [...prev, coords]);
      toast({ title: 'Seed point added.' });
    } else {
      // Regular click, clear previous seeds
      setSeedPoints([]);
    }

    const pointsToUse = event.shiftKey ? [...seedPoints, coords] : [coords];
    
    performMagicWand(selectionCanvasRef.current!, pointsToUse, wandSettings, avoidancePoints);
  };
  
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand') return;
    event.preventDefault(); 

    const change = event.deltaY < 0 ? 1 : -1;
    setWandSettings(prevSettings => {
        const newTolerance = Math.max(0, Math.min(255, prevSettings.tolerance + change));
        if (newTolerance === prevSettings.tolerance) return prevSettings;
        return { ...prevSettings, tolerance: newTolerance };
    });
  };

  const setCanvasSize = useCallback(() => {
    const image = imageRef.current;
    const container = image?.parentElement;
    const selectionCanvas = selectionCanvasRef.current;
    const previewCanvas = previewCanvasRef.current;
    
    if (image && container && selectionCanvas && previewCanvas && image.complete && image.naturalWidth > 0) {
      const { naturalWidth, naturalHeight } = image;
      const containerRect = container.getBoundingClientRect();
      const { width: containerWidth, height: containerHeight } = containerRect;
      const containerAspect = containerWidth / containerHeight;
      const imageAspect = naturalWidth / naturalHeight;

      let renderedWidth, renderedHeight;

      if (containerAspect > imageAspect) {
        renderedHeight = containerHeight;
        renderedWidth = renderedHeight * imageAspect;
      } else {
        renderedWidth = containerWidth;
        renderedHeight = renderedWidth / imageAspect;
      }

      selectionCanvas.width = renderedWidth;
      selectionCanvas.height = renderedHeight;
      previewCanvas.width = renderedWidth;
      previewCanvas.height = renderedHeight;

       if (lastMousePosition) {
           performMagicWand(previewCanvas, [lastMousePosition], wandSettings, avoidancePoints);
       }
    }
  }, [lastMousePosition, wandSettings, performMagicWand, avoidancePoints]);


  useEffect(() => {
    const imageEl = imageRef.current;
    if (!imageEl) return;
    
    const resizeObserver = new ResizeObserver(() => setCanvasSize());
    if (imageEl.parentElement) {
      resizeObserver.observe(imageEl.parentElement);
    }
    
    if (imageEl.complete) setCanvasSize();
    
    return () => resizeObserver.disconnect();
  }, [setCanvasSize]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="font-headline">Canvas</CardTitle>
          <CardDescription>
            Use tools to create segments. Ctrl+Click to avoid, Shift+Click to add points.
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
      <CardContent className="flex-1 flex items-center justify-center p-0 m-2">
        <div
          className="relative w-full h-full cursor-crosshair overflow-hidden rounded-lg border bg-secondary flex justify-center items-center"
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
            className="absolute object-contain pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
          />
          <canvas
            ref={previewCanvasRef}
            className="absolute object-contain opacity-75 pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
