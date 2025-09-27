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
  Point,
  SegmentGroup,
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
  segmentGroups: SegmentGroup[];
  setSegmentGroups: Dispatch<SetStateAction<SegmentGroup[]>>;
  activeGroupId: string | null;
  setActiveGroupId: Dispatch<SetStateAction<string | null>>;
  addNewGroup: (type: 'add' | 'avoid') => void;
  layers: Layer[];
  onCopyToLayer: (imageData: ImageData) => void;
  onClearPoints: () => void;
}

export function CanvasArea({
  currentImage,
  setCurrentImage,
  activeTool,
  wandSettings,
  setWandSettings,
  segmentGroups,
  setSegmentGroups,
  activeGroupId,
  setActiveGroupId,
  addNewGroup,
  layers,
  onCopyToLayer,
  onClearPoints,
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
    setSegmentGroups([]);
  }, [currentImage, setSegmentGroups]);

  const performMagicWand = useCallback(
    (
      targetCanvas: HTMLCanvasElement,
      allGroups: SegmentGroup[],
      settings: MagicWandSettings,
      isPreview: boolean = false
    ) => {
      const image = imageRef.current;
      if (!image || !image.complete || image.naturalWidth === 0) {
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
        const originalImageData = tempCtx.getImageData(0,0,naturalWidth,naturalHeight);

        const { contiguous, colorSpace } = settings;
        const imageData = originalImageData.data;
        
        clearCanvas(targetCanvas);

        const convertColor = (r: number, g: number, b: number) => {
            switch(colorSpace) {
                case 'hsv': return colorConverters.rgbToHsv(r, g, b);
                case 'lab': return colorConverters.rgbToLab(r, g, b);
                case 'rgb': default: return [r, g, b];
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
                return Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2));
            }
            return Math.sqrt(Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2));
        };
        
        const allVisibleGroups = [...allGroups];
        const activeGroup = allVisibleGroups.find(g => g.id === activeGroupId);

        if (isPreview && lastMousePosition && activeTool === 'wand' && activeGroup) {
            const previewGroup = JSON.parse(JSON.stringify(activeGroup)); // Deep copy
            previewGroup.points.push({ ...lastMousePosition, tolerance: settings.tolerance });
            const groupIndex = allVisibleGroups.findIndex(g => g.id === activeGroupId);
            if(groupIndex > -1) allVisibleGroups[groupIndex] = previewGroup;
        }

        const avoidanceMask = new Uint8Array(naturalWidth * naturalHeight);
        const avoidGroups = allVisibleGroups.filter(g => g.type === 'avoid' && g.visible && g.points.length > 0);

        if (avoidGroups.length > 0) {
            for(let y=0; y < naturalHeight; y++) {
                for (let x=0; x < naturalWidth; x++) {
                    const index = y * naturalWidth + x;
                    const dataIndex = index * 4;
                    const r = imageData[dataIndex];
                    const g = imageData[dataIndex + 1];
                    const b = imageData[dataIndex + 2];
                    const pixelColor = convertColor(r, g, b);

                    for (const group of avoidGroups) {
                        for (const avoidPoint of group.points) {
                           const pointColor = convertColor(avoidPoint.color![0], avoidPoint.color![1], avoidPoint.color![2]);
                           const dist = getDistance(pixelColor, pointColor, avoidPoint.colorSpace || colorSpace);
                           if (dist <= avoidPoint.tolerance) {
                               avoidanceMask[index] = 1;
                               break;
                           }
                        }
                        if(avoidanceMask[index] === 1) break;
                    }
                }
            }
        }
        
        allVisibleGroups.filter(g => g.visible && g.points.length > 0).forEach(group => {
            const maskImageData = targetCtx.createImageData(targetCanvas.width, targetCanvas.height);
            const maskData = maskImageData.data;
            const visited = new Uint8Array(naturalWidth * naturalHeight);
            const queue: [number, number][] = [];
            const startColors: {color: number[], tolerance: number}[] = [];

            group.points.forEach(point => {
                const { x: startX, y: startY } = point;
                const startIdx = (startY * naturalWidth + startX) * 4;
                const r = imageData[startIdx];
                const g = imageData[startIdx + 1];
                const b = imageData[startIdx + 2];
                
                startColors.push({
                    color: convertColor(r,g,b), 
                    tolerance: point.tolerance
                });

                const startIndex = startY * naturalWidth + startX;
                if (visited[startIndex] === 0 && avoidanceMask[startIndex] === 0) {
                    queue.push([startX, startY]);
                    visited[startIndex] = 1;
                }
            });
            
            const processPixel = (x: number, y: number) => {
                const index = y * naturalWidth + x;
                if (visited[index] || (group.type === 'add' && avoidanceMask[index])) return;

                const dataIndex = index * 4;
                const r = imageData[dataIndex];
                const g = imageData[dataIndex + 1];
                const b = imageData[dataIndex + 2];
                const pixelColor = convertColor(r, g, b);
                
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

                    const hsla = group.color.match(/hsla\((\d+),\s*(\d+)%,\s*(\d+)%,\s*([\d.]+)\)/);
                    if (hsla) {
                        const [, h, s, l, a] = hsla;
                        const [r, g, b] = hslToRgb(parseInt(h), parseInt(s), parseInt(l));
                        maskData[maskDataIndex] = r;
                        maskData[maskDataIndex + 1] = g;
                        maskData[maskDataIndex + 2] = b;
                        maskData[maskDataIndex + 3] = parseFloat(a) * 255;
                    }
                }
            };

            if (contiguous) {
                let head = 0;
                while (head < queue.length) {
                    const [x, y] = queue[head++]!;
                    
                    const index = y * naturalWidth + x;
                    if(group.type === 'add' && avoidanceMask[index]) continue;

                     const renderX = Math.floor(x * (targetCanvas.width / naturalWidth));
                    const renderY = Math.floor(y * (targetCanvas.height / naturalHeight));
                    const maskDataIndex = (renderY * targetCanvas.width + renderX) * 4;

                    const hsla = group.color.match(/hsla\((\d+),\s*(\d+)%,\s*(\d+)%,\s*([\d.]+)\)/);
                    if (hsla) {
                        const [, h, s, l, a] = hsla;
                        const [r, g, b] = hslToRgb(parseInt(h), parseInt(s), parseInt(l));
                        maskData[maskDataIndex] = r;
                        maskData[maskDataIndex + 1] = g;
                        maskData[maskDataIndex + 2] = b;
                        maskData[maskDataIndex + 3] = parseFloat(a) * 255;
                    }

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
        });

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
    [toast, lastMousePosition, activeTool, activeGroupId]
  );

  function hslToRgb(h: number, s: number, l: number){
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  }
  
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
    if (activeTool !== 'wand' || !previewCanvasRef.current) {
      clearCanvas(previewCanvasRef.current);
      return;
    }
  
    performMagicWand(
      previewCanvasRef.current,
      segmentGroups,
      wandSettings,
      true
    );
  }, [
    activeTool,
    wandSettings,
    segmentGroups,
    performMagicWand,
  ]);

  useEffect(() => {
    runPreview();
  }, [lastMousePosition, runPreview]);


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

    let currentActiveGroupId = activeGroupId;
    let pointType: 'add' | 'avoid' = 'add';

    if (event.ctrlKey) pointType = 'avoid';
    
    if (event.shiftKey) {
        if (!currentActiveGroupId) {
             addNewGroup(pointType);
             // This is async, so we can't use activeGroupId immediately.
             // For now, we'll let the next render handle adding the point.
             return;
        }
    } else {
        addNewGroup(pointType);
        return; // Let next render handle adding points.
    }


    setSegmentGroups(prev => {
        const newGroups = [...prev];
        const activeGroupIndex = newGroups.findIndex(g => g.id === currentActiveGroupId);
        
        if (activeGroupIndex > -1) {
            const newPoint: Point = {
                ...coords,
                tolerance: wandSettings.tolerance,
            };
            if(pointType === 'avoid') {
                newPoint.color = color;
                newPoint.colorSpace = wandSettings.colorSpace;
            }

            const updatedGroup = { ...newGroups[activeGroupIndex] };
            updatedGroup.points = [...updatedGroup.points, newPoint];
            newGroups[activeGroupIndex] = updatedGroup;
        }

        return newGroups;
    });
  };
  
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (activeTool !== 'wand' || !lastMousePosition) return;
    event.preventDefault(); 
    
    const change = event.deltaY < 0 ? 1 : -1;
    const HOVER_RADIUS = 5; // Natural pixels

    let pointFound = false;

    setSegmentGroups(prevGroups => {
        const newGroups = prevGroups.map(group => {
            const newPoints = group.points.map(p => {
                const distance = Math.sqrt(Math.pow(p.x - lastMousePosition.x, 2) + Math.pow(p.y - lastMousePosition.y, 2));
                if (distance < HOVER_RADIUS) {
                    pointFound = true;
                    return { ...p, tolerance: Math.max(0, Math.min(255, p.tolerance + change)) };
                }
                return p;
            });
            return { ...group, points: newPoints };
        });
        return newGroups;
    });

    if (pointFound) return;
    
    // If no point was hovered, adjust global tolerance
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
      if(selectionCanvasRef.current && segmentGroups.some(g => g.points.length > 0)) {
        performMagicWand(selectionCanvasRef.current, segmentGroups, wandSettings, false);
      }
    }
  }, [runPreview, segmentGroups, wandSettings, performMagicWand]);


  useEffect(() => {
    const imageEl = imageRef.current;
    if (!imageEl) return;
    
    const handleLoad = () => setCanvasSize();
    imageEl.addEventListener('load', handleLoad);

    const resizeObserver = new ResizeObserver(() => setCanvasSize());
    if (imageEl.parentElement) {
      resizeObserver.observe(imageEl.parentElement);
    }

    if (imageEl.complete) {
        setCanvasSize();
    }
    
    return () => {
        imageEl.removeEventListener('load', handleLoad);
        resizeObserver.disconnect();
    }
  }, [setCanvasSize]);

  useEffect(() => {
    if (selectionCanvasRef.current) {
      performMagicWand(
        selectionCanvasRef.current,
        segmentGroups,
        wandSettings,
        false
      );
    }
  }, [segmentGroups, wandSettings, performMagicWand]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1.5">
          <CardTitle className="font-headline">Canvas</CardTitle>
          <CardDescription>
            Click to start new selection. Shift+Click to add points. Ctrl+Click to avoid.
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
