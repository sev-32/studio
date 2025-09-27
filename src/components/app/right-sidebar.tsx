'use client';

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
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
import type { MagicLassoSettings, MagicWandSettings, Tool } from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';

interface RightSidebarProps {
  activeTool: Tool;
  wandSettings: MagicWandSettings;
  setWandSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  lassoSettings: MagicLassoSettings;
  setLassoSettings: Dispatch<SetStateAction<MagicLassoSettings>>;
}

export function RightSidebar({
  activeTool,
  wandSettings,
  setWandSettings,
  lassoSettings,
  setLassoSettings,
}: RightSidebarProps) {
  return (
    <SidebarContent>
      {activeTool === 'wand' && (
        <MagicWandSettings
          settings={wandSettings}
          setSettings={setWandSettings}
        />
      )}
      {activeTool === 'lasso' && (
        <MagicLassoSettings
          settings={lassoSettings}
          setSettings={setLassoSettings}
        />
      )}
    </SidebarContent>
  );
}

function MagicWandSettings({
  settings,
  setSettings,
}: {
  settings: MagicWandSettings;
  setSettings: Dispatch<SetStateAction<MagicWandSettings>>;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Wand Settings
      </SidebarGroupLabel>
      <div className="space-y-6 p-2">
        <div className="space-y-3">
          <Label htmlFor="tolerance">Tolerance</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="tolerance"
              value={[settings.tolerance]}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, tolerance: value[0] }))
              }
              max={100}
              step={1}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.tolerance}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="contiguous">Contiguous</Label>
          <Switch
            id="contiguous"
            checked={settings.contiguous}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, contiguous: checked }))
            }
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="color-space">Color Space</Label>
          <Select
            value={settings.colorSpace}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, colorSpace: value }))
            }
          >
            <SelectTrigger id="color-space">
              <SelectValue placeholder="Select color space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rgb">RGB</SelectItem>
              <SelectItem value="hsv">HSV</SelectItem>
              <SelectItem value="lab">LAB</SelectItem>
              <SelectItem value="quaternion">Quaternion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label htmlFor="connectivity">Connectivity</Label>
          <Select
            value={settings.connectivity}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, connectivity: value }))
            }
          >
            <SelectTrigger id="connectivity">
              <SelectValue placeholder="Select connectivity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4-way</SelectItem>
              <SelectItem value="8">8-way</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SidebarGroup>
  );
}

function MagicLassoSettings({
  settings,
  setSettings,
}: {
  settings: MagicLassoSettings;
  setSettings: Dispatch<SetStateAction<MagicLassoSettings>>;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Lasso Settings
      </SidebarGroupLabel>
      <div className="space-y-4 p-2">
        <div className="space-y-3">
          <Label htmlFor="node-drop-time">Node Drop Time (ms)</Label>
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
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="elasticity">Elasticity</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="elasticity"
              value={[settings.elasticity]}
              onValueChange={(value) =>
                setSettings((s) => ({ ...s, elasticity: value[0] }))
              }
              max={1}
              step={0.1}
            />
            <span className="w-12 text-right text-sm text-muted-foreground">
              {settings.elasticity.toFixed(1)}
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <Label htmlFor="cost-fn">Cost Function</Label>
          <Select
            value={settings.costFunction}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, costFunction: value }))
            }
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
