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
import type { MagicLassoSettings, MagicWandSettings, Tool } from '@/lib/types';
import type { Dispatch, SetStateAction } from 'react';

interface RightSidebarProps {
  activeTool: Tool;
  wandSettings: MagicWandSettings;
  setWandSettings: Dispatch<SetStateAction<MagicWandSettings>>;
  lassoSettings: MagicLassoSettings;
  setLassoSettings: Dispatch<SetStateAction<MagicLassoSettings>>;
  autoDetectMode: boolean;
  setAutoDetectMode: Dispatch<SetStateAction<boolean>>;
}

export function RightSidebar({
  activeTool,
  wandSettings,
  setWandSettings,
  lassoSettings,
  setLassoSettings,
  autoDetectMode,
  setAutoDetectMode,
}: RightSidebarProps) {
  return (
    <SidebarContent>
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
        <MagicWandSettings
          settings={wandSettings}
          setSettings={setWandSettings}
          disabled={autoDetectMode}
        />
      )}
      {activeTool === 'lasso' && (
        <MagicLassoSettings
          settings={lassoSettings}
          setSettings={setLassoSettings}
          disabled={autoDetectMode}
        />
      )}
    </SidebarContent>
  );
}

function MagicWandSettings({
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
              max={100}
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
              setSettings((s) => ({ ...s, colorSpace: value }))
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
              <SelectItem value="quaternion">Quaternion</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label
            htmlFor="connectivity"
            className={disabled ? 'text-muted-foreground' : ''}
          >
            Connectivity
          </Label>
          <Select
            value={settings.connectivity}
            onValueChange={(value) =>
              setSettings((s) => ({ ...s, connectivity: value }))
            }
            disabled={disabled}
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
