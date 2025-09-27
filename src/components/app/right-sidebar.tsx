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
  SegmentGroup,
} from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Eye, EyeOff, Plus, Trash2, MinusCircle } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { AnalyticsPanel } from './analytics-panel';

interface RightSidebarProps {
  activeTool: Tool;
  wandSettings: MagicWandSettings;
  setWandSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  lassoSettings: MagicLassoSettings;
  setLassoSettings: Dispatch<SetStateAction<MagicLassoSettings>>;
  autoDetectMode: boolean;
  setAutoDetectMode: Dispatch<SetStateAction<boolean>>;
  segmentGroups: SegmentGroup[];
  setSegmentGroups: Dispatch<SetStateAction<SegmentGroup[]>>;
  addNewGroup: (type: 'add' | 'avoid') => void;
  layers: Layer[];
  setLayers: Dispatch<SetStateAction<Layer[]>>;
  onCopyToLayer: () => void;
  hoveredPixelData: any;
}

export function RightSidebar({
  activeTool,
  wandSettings,
  setWandSettings,
  lassoSettings,
  setLassoSettings,
  autoDetectMode,
  setAutoDetectMode,
  segmentGroups,
  setSegmentGroups,
  addNewGroup,
  layers,
  setLayers,
  onCopyToLayer,
  hoveredPixelData,
}: RightSidebarProps) {
  return (
    <SidebarContent>
      <LayersPanel
        segmentGroups={segmentGroups}
        setSegmentGroups={setSegmentGroups}
        addNewGroup={addNewGroup}
      />
      <SidebarSeparator />
      <AnalyticsPanel pixelData={hoveredPixelData} />
      <SidebarSeparator />

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
  segmentGroups,
  setSegmentGroups,
  addNewGroup,
}: {
  segmentGroups: SegmentGroup[];
  setSegmentGroups: Dispatch<SetStateAction<SegmentGroup[]>>;
  addNewGroup: (type: 'add' | 'avoid') => void;
}) {
  const toggleVisibility = (id: string) => {
    setSegmentGroups(
      segmentGroups.map((g) =>
        g.id === id ? { ...g, visible: !g.visible } : g
      )
    );
  };

  const deleteGroup = (id: string) => {
    setSegmentGroups(segmentGroups.filter((g) => g.id !== id));
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Layers & Segments
      </SidebarGroupLabel>
      <div className="p-2 space-y-2">
        <div className="flex gap-2">
          <Button
            className="w-full"
            size="sm"
            onClick={() => addNewGroup('add')}
          >
            <Plus className="mr-2" /> New Add Group
          </Button>
          <Button
            className="w-full"
            size="sm"
            variant="destructive"
            onClick={() => addNewGroup('avoid')}
          >
            <MinusCircle className="mr-2" /> New Avoid Group
          </Button>
        </div>
        <ScrollArea className="h-48">
          <div className="space-y-2">
            {segmentGroups.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No segment groups yet.
              </p>
            )}
            {segmentGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-2 rounded-md bg-secondary"
              >
                <div
                  className="w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-sm flex-1">{group.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => toggleVisibility(group.id)}
                >
                  {group.visible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => deleteGroup(group.id)}
                >
                  <Trash2 className="h-4 w-4" />
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
  const isColorSpaceActive = (space: string) =>
    settings.colorSpaces.includes(space);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Wand Settings
      </SidebarGroupLabel>
      <div className="space-y-6 p-2">
        <div className="space-y-3">
          <Label className={disabled ? 'text-muted-foreground' : ''}>
            Color Space
          </Label>
          <ToggleGroup
            type="multiple"
            value={settings.colorSpaces}
            onValueChange={(value) => {
              if (value.length > 0) {
                // Must have at least one selected
                setSettings((s) => ({ ...s, colorSpaces: value }));
              }
            }}
            disabled={disabled}
            className="grid grid-cols-3 gap-2"
          >
            <ToggleGroupItem value="rgb" aria-label="Toggle RGB">
              RGB
            </ToggleGroupItem>
            <ToggleGroupItem value="hsv" aria-label="Toggle HSV">
              HSV
            </ToggleGroupItem>
            <ToggleGroupItem value="lab" aria-label="Toggle LAB">
              LAB
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="tolerance-rgb"
            className={
              disabled || !isColorSpaceActive('rgb')
                ? 'text-muted-foreground'
                : ''
            }
          >
            RGB Tolerance
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="tolerance-rgb"
              value={[settings.tolerances.rgb]}
              onValueChange={(value) =>
                setSettings((s) => ({
                  ...s,
                  tolerances: { ...s.tolerances, rgb: value[0] },
                }))
              }
              max={255}
              step={1}
              disabled={disabled || !isColorSpaceActive('rgb')}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.tolerances.rgb}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="tolerance-hsv"
            className={
              disabled || !isColorSpaceActive('hsv')
                ? 'text-muted-foreground'
                : ''
            }
          >
            HSV Tolerance
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="tolerance-hsv"
              value={[settings.tolerances.hsv]}
              onValueChange={(value) =>
                setSettings((s) => ({
                  ...s,
                  tolerances: { ...s.tolerances, hsv: value[0] },
                }))
              }
              max={255}
              step={1}
              disabled={disabled || !isColorSpaceActive('hsv')}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.tolerances.hsv}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Label
            htmlFor="tolerance-lab"
            className={
              disabled || !isColorSpaceActive('lab')
                ? 'text-muted-foreground'
                : ''
            }
          >
            LAB Tolerance
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              id="tolerance-lab"
              value={[settings.tolerances.lab]}
              onValueChange={(value) =>
                setSettings((s) => ({
                  ...s,
                  tolerances: { ...s.tolerances, lab: value[0] },
                }))
              }
              max={255}
              step={1}
              disabled={disabled || !isColorSpaceActive('lab')}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.tolerances.lab}
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
