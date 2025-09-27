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
import { useRef, useEffect, useCallback, useState }from 'react';
import type {
  MagicWandSettings,
  Tool,
  SeedPoint,
  AvoidancePoint,
  Layer,
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
  layers: Layer[];
  onCopyToLayer: (imageData: ImageData) => void;
  onClearPoints: () => void;
}

type LastPoint = { type: 'seed'; index: number } | { type: 'avoid'; index: number } | null;

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
  const [lastMousePosition, setLastMousePosition] = useState<{x: number, y: number} | null>(null);
  const [lastClickedPoint, setLastClickedPoint] = useState<LastPoint>(null);

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
    setLastClickedPoint(null);
  }, [currentImage, setSeedPoints, setAvoidancePoints]);

  const performMagicWand = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      points: SeedPoint[],
      settings: MagicWandSettings,
      avoid: AvoidancePoint[],
      previewingAvoid?: boolean
    ) => {
      const image = imageRef.current;
      if (!image || !image.complete || image.naturalWidth === 0) {
          clearCanvas(targetCanvas);
          return;
      };

      if (points.length === 0 && avoid.length === 0 && !lastMousePosition) {
        clearCanvas(targetCanvas);
        return;
      }
      
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

        const { contiguous, colorSpace } = settings;
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
             if (space === 'lab') {
                return Math.sqrt(
                    Math.pow(c1[0] - c2[0], 2) +
                    Math.pow(c1[1] - c2[1], 2) +
                    Math.pow(c1[2] - c2[2], 2)
                );
            }
            // RGB
            return Math.sqrt(
                Math.pow(c1[0] - c2[0], 2) +
                Math.pow(c1[1] - c2[1], 2) +
                Math.pow(c1[2] - c2[2], 2)
            );
        };
        
        const queue: [number, number][] = [];
        const startColors: {color: number[], tolerance: number}[] = [];

        points.forEach(point => {
          const { x: startX, y: startY } = point;
          const startIdx = (startY * naturalWidth + startX) * 4;
          const r = imageData[startIdx];
          const g = imageData[startIdx + 1];
          const b = imageData[startIdx + 2];
          
          startColors.push({
            color: convertColor(r,g,b), 
            tolerance: point.tolerance
          });


          if (visited[startY * naturalWidth + startX] === 0) {
              queue.push([startX, startY]);
              visited[startY * naturalWidth + startX] = 1;
          }
        });

        clearCanvas(targetCanvas);
        
        const processPixel = (x: number, y: number) => {
            const index = y * naturalWidth + x;
            if (visited[index]) return;

            const dataIndex = index * 4;
            const r = imageData[dataIndex];
            const g = imageData[dataIndex + 1];
            const b = imageData[dataIndex + 2];
            const pixelColor = convertColor(r, g, b);

            let isAvoided = false;
            for (const avoidPoint of avoid) {
                const avoidColor = colorConverters.rgbToLab(avoidPoint.color[0], avoidPoint.color[1], avoidPoint.color[2]);
                const dist = getDistance(pixelColor, avoidColor, avoidPoint.colorSpace);
                if (dist <= avoidPoint.tolerance) {
                    isAvoided = true;
                     const renderX = Math.floor(x * (targetCanvas.width / naturalWidth));
                     const renderY = Math.floor(y * (targetCanvas.height / naturalHeight));
                     const maskDataIndex = (renderY * targetCanvas.width + renderX) * 4;
                     maskData[maskDataIndex] = 255;
                     maskData[maskDataIndex + 1] = 0;
                     maskData[maskDataIndex + 2] = 0;
                     maskData[maskDataIndex + 3] = 128;
                    break;
                }
            }
            if (isAvoided) return;


            let isSimilar = false;
            for (const startColor of startColors) {
                const distance = getDistance(startColor.color, pixelColor, colorSpace);
                if (distance <= startColor.tolerance) {
                    isSimilar = true;
                    break;
                }
            }

            if (isSimilar) {
                visited[index] = 1;
                if (contiguous) {
                    queue.push([x, y]);
                }
                const renderX = Math.floor(x * (targetCanvas.width / naturalWidth));
                const renderY = Math.floor(y * (targetCanvas.height / naturalHeight));
                const maskDataIndex = (renderY * targetCanvas.width + renderX) * 4;

                maskData[maskDataIndex] = 50;
                maskData[maskDataIndex + 1] = 150;
                maskData[maskDataIndex + 2] = 255;
                maskData[maskDataIndex + 3] = 128;
            }
        };

        if (contiguous && points.length > 0) {
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
                         processPixel(nx, ny);
                    }
                }
            }
        } else {
            for(let y=0; y < naturalHeight; y++) {
                for (let x=0; x < naturalWidth; x++) {
                    processPixel(x, y);
                }
            }
        }

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
    [toast, lastMousePosition]
  );
  
  const getScaledCoords = (event: MouseEvent<HTMLDivElement>): {x: number, y: number} | null => {
    const image = imageRef.current;
    const container = event.currentTarget;
    if (!image || !container || !image.complete || image.naturalWidth === 0) return null;
    
    const containerRect = container.getBoundingClientRect();
    const { naturalWidth, naturalHeight } = image;
    const imageAspect = naturalWidth / naturalHeight;
    
    const { width: containerWidth, height: containerHeight } = containerRect;
    const containerAspect = containerWidth / containerHeight;

    let renderedWidth, renderedHeight, offsetX, offsetY;

    if (imageAspect > containerAspect) {
      renderedWidth = containerWidth;
      renderedHeight = renderedWidth / imageAspect;
      offsetX = 0;
      offsetY = (containerHeight - renderedHeight) / 2;
    } else { 
      renderedHeight = containerHeight;
      renderedWidth = renderedHeight * imageAspect;
      offsetY = 0;
      offsetX = (containerWidth - renderedWidth) / 2;
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

  const runPreview = useCallback(() => {
    if (activeTool !== 'wand' || !previewCanvasRef.current || !lastMousePosition) {
      clearCanvas(previewCanvasRef.current);
      return;
    }
  
    const hoverPoint: SeedPoint = {
      ...lastMousePosition,
      tolerance: wandSettings.tolerance,
    };
  
    // Always include the hover point for the preview.
    const pointsToUse = [...seedPoints, hoverPoint];
  
    performMagicWand(
      previewCanvasRef.current,
      pointsToUse,
      wandSettings,
      avoidancePoints
    );
  }, [
    activeTool,
    wandSettings,
    avoidancePoints,
    seedPoints,
    lastMousePosition,
    performMagicWand,
  ]);

  useEffect(() => {
    runPreview();
  }, [wandSettings, avoidancePoints, seedPoints, lastMousePosition, runPreview]);


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
    if (activeTool !== 'wand' || !previewCanvasRef.current) return;
    
    const coords = getScaledCoords(event);
    if (!coords) return;
    
    const image = imageRef.current;
    if (!image) return;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tempCtx) return;
    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    tempCtx.drawImage(image, 0, 0);
    const pixel = tempCtx.getImageData(coords.x, coords.y, 1, 1).data;
    const color = [pixel[0], pixel[1], pixel[2]];

    if (event.ctrlKey) {
      const newAvoidancePoint: AvoidancePoint = {
          ...coords,
          color: color,
          colorSpace: wandSettings.colorSpace,
          tolerance: wandSettings.tolerance,
      };
      setAvoidancePoints(prev => {
        const newPoints = [...prev, newAvoidancePoint];
        setLastClickedPoint({ type: 'avoid', index: newPoints.length - 1 });
        return newPoints;
      });
      toast({ title: 'Avoidance point added.' });
    } else if (event.shiftKey) {
      setSeedPoints(prev => {
        const newPoints = [...prev, { ...coords, tolerance: wandSettings.tolerance }];
        setLastClickedPoint({ type: 'seed', index: newPoints.length - 1 });
        return newPoints;
      });
      toast({ title: 'Seed point added.' });
    } else {
      setSeedPoints(() => {
          const newPoints = [{ ...coords, tolerance: wandSettings.tolerance }];
          setLastClickedPoint({ type: 'seed', index: 0 });
          return newPoints;
      });
      setAvoidancePoints([]);
    }
    
    if (selectionCanvasRef.current) {
        performMagicWand(selectionCanvasRef.current, seedPoints, wandSettings, avoidancePoints);
    }
  };
  
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand') return;
    event.preventDefault(); 

    const change = event.deltaY < 0 ? 1 : -1;
    
    if (lastClickedPoint) {
       if (lastClickedPoint.type === 'seed') {
           setSeedPoints(prev => {
               const newPoints = [...prev];
               const pointToUpdate = newPoints[lastClickedPoint.index];
               if (pointToUpdate) {
                   pointToUpdate.tolerance = Math.max(0, Math.min(255, pointToUpdate.tolerance + change));
               }
               return newPoints;
           });
       } else if (lastClickedPoint.type === 'avoid') {
           setAvoidancePoints(prev => {
               const newPoints = [...prev];
               const pointToUpdate = newPoints[lastClickedPoint.index];
               if (pointToUpdate) {
                   pointToUpdate.tolerance = Math.max(0, Math.min(255, pointToUpdate.tolerance + change));
               }
               return newPoints;
           });
       }
    } else {
        setWandSettings(prevSettings => {
            const newTolerance = Math.max(0, Math.min(255, prevSettings.tolerance + change));
            if (newTolerance === prevSettings.tolerance) return prevSettings;
            return { ...prevSettings, tolerance: newTolerance };
        });
    }
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

      if (imageAspect > containerAspect) {
          renderedWidth = containerWidth;
          renderedHeight = renderedWidth / imageAspect;
      } else {
          renderedHeight = containerHeight;
          renderedWidth = renderedHeight * imageAspect;
      }

      selectionCanvas.width = renderedWidth;
      selectionCanvas.height = renderedHeight;
      previewCanvas.width = renderedWidth;
      previewCanvas.height = renderedHeight;

      runPreview();
      if(selectionCanvasRef.current && (seedPoints.length > 0 || avoidancePoints.length > 0)) {
        performMagicWand(selectionCanvasRef.current, seedPoints, wandSettings, avoidancePoints);
      }
    }
  }, [runPreview, seedPoints, wandSettings, avoidancePoints, performMagicWand]);


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

  useEffect(() => {
    if (selectionCanvasRef.current) {
      performMagicWand(
        selectionCanvasRef.current,
        seedPoints,
        wandSettings,
        avoidancePoints
      );
    }
  }, [seedPoints, avoidancePoints, wandSettings, performMagicWand]);

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

    