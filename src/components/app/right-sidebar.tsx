'use client';

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  MagicLassoSettings,
  MagicWandSettings,
  Tool,
  Layer,
} from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';
import { AnalyticsPanel } from './analytics-panel';
import { ScrollArea } from '../ui/scroll-area';
import { Eye, EyeOff } from 'lucide-react';

interface RightSidebarProps {
  activeTool: Tool;
  wandSettings: MagicWandSettings;
  setWandSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  lassoSettings: MagicLassoSettings;
  setLassoSettings: Dispatch<SetStateAction<MagicLassoSettings>>;
  autoDetectMode: boolean;
  setAutoDetectMode: Dispatch<SetStateAction<boolean>>;
  layers: Layer[];
  setLayers: Dispatch<SetStateAction<Layer[]>>;
}

export function RightSidebar({
  activeTool,
  wandSettings,
  setWandSettings,
  lassoSettings,
  setLassoSettings,
  autoDetectMode,
  setAutoDetectMode,
  layers,
  setLayers,
}: RightSidebarProps) {
  return (
    <SidebarContent>
      <AnalyticsPanel />
      <SidebarSeparator />
      {activeTool === 'layers' && (
        <LayersPanel layers={layers} setLayers={setLayers} />
      )}
      {activeTool !== 'layers' && (
        <>
          <SidebarGroup>
            <SidebarGroupLabel className="font-headline">
              Detection Mode
            </SidebarGroupLabel>
            <div className="flex items-center justify-between p-2">
              <Label htmlFor="auto-detect-mode">Auto-Detect Mode</Label>
              <Switch
                id="auto-detect-mode"
                checked={autoDetectMode}
                onCheckedChange={setAutoDetectMode}
              />
            </div>
          </SidebarGroup>
          <SidebarSeparator />
          {activeTool === 'wand' && (
            <MagicWandSettingsComponent
              settings={wandSettings}
              setSettings={setWandSettings}
              disabled={autoDetectMode}
            />
          )}
          {activeTool === 'lasso' && (
            <MagicLassoSettingsComponent
              settings={lassoSettings}
              setSettings={setLassoSettings}
              disabled={autoDetectMode}
            />
          )}
        </>
      )}
    </SidebarContent>
  );
}

function LayersPanel({
  layers,
  setLayers,
}: {
  layers: Layer[];
  setLayers: Dispatch<SetStateAction<Layer[]>>;
}) {
  const toggleVisibility = (id: string) => {
    setLayers(
      layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">Layers</SidebarGroupLabel>
      <div className="p-2 space-y-2">
        <Button className="w-full">Copy Selection to Layer</Button>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {layers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No layers yet.</p>
            )}
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center justify-between p-2 rounded-md bg-secondary"
              >
                <span className="text-sm">{layer.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleVisibility(layer.id)}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </SidebarGroup>
  );
}

function MagicWandSettingsComponent({
  settings,
  setSettings,
  disabled,
}: {
  settings: MagicWandSettings;
  setSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  disabled: boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Wand Settings
      </SidebarGroupLabel>
      <div className="space-y-6 p-2">
        <div className="space-y-3">
          <Label
            htmlFor="tolerance"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Tolerance
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="tolerance"
              value={[settings.tolerance]}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, tolerance: value[0] }))
              }
              max={255}
              step={1}
              disabled={disabled}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.tolerance}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label
            htmlFor="contiguous"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Contiguous
          </Label>
          <Switch
            id="contiguous"
            checked={settings.contiguous}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, contiguous: checked }))
            }
            disabled={disabled}
          />
        </div>
        <div className="space-y-3">
          <Label
            htmlFor="color-space"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Color Space
          </Label>
          <Select
            value={settings.colorSpace}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, colorSpace: value as 'rgb' | 'hsv' | 'lab' }))
            }
            disabled={disabled}
          >
            <SelectTrigger id="color-space">
              <SelectValue placeholder="Select color space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="hsv">HSV</SelectItem>
              <SelectItem value="lab">LAB</SelectItem>
              <SelectItem value="quaternion">Quaternion (experimental)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SidebarGroup>
  );
}

function MagicLassoSettingsComponent({
  settings,
  setSettings,
  disabled,
}: {
  settings: MagicLassoSettings;
  setSettings: Dispatch<SetStateAction<MagicLassoSettings>>;
  disabled: boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Lasso Settings
      </SidebarGroupLabel>
      <div className="space-y-4 p-2">
        <div className="space-y-3">
          <Label
            htmlFor="node-drop-time"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Node Drop Time (ms)
          </Label>
          <Input
            id="node-drop-time"
            type="number"
            value={settings.nodeDropTime}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                nodeDropTime: parseInt(e.target.value, 10),
              }))
            }
            disabled={disabled}
          />
        </div>
        <div className="space-y-3">
          <Label
            htmlFor="elasticity"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Elasticity
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="elasticity"
              value={[settings.elasticity]}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, elasticity: value[0] }))
              }
              max={1}
              step={0.1}
              disabled={disabled}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.elasticity.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <Label
            htmlFor="cost-fn"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Cost Function
          </Label>
          <Select
            value={settings.costFunction}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, costFunction: value }))
            }
            disabled={disabled}
          >
            <SelectTrigger id="cost-fn">
              <SelectValue placeholder="Select cost function" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sobel">Sobel-based</SelectItem>
              <SelectItem value="gabor">Gabor Filter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SidebarGroup>
  );
}
