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
import { PresetGenerator } from './preset-generator';
import type { Tool } from '@/lib/types';
import type { ImagePlaceholder } from '@/lib/placeholder-images';

interface RightSidebarProps {
  activeTool: Tool;
  currentImage: ImagePlaceholder;
}

export function RightSidebar({ activeTool, currentImage }: RightSidebarProps) {
  return (
    <SidebarContent>
      {activeTool === 'wand' && <MagicWandSettings />}
      {activeTool === 'lasso' && <MagicLassoSettings />}
      <PresetGenerator currentImage={currentImage} />
    </SidebarContent>
  );
}

function MagicWandSettings() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Wand Settings
      </SidebarGroupLabel>
      <div className="space-y-6 p-2">
        <div className="space-y-3">
          <Label htmlFor="tolerance">Tolerance</Label>
          <div className="flex items-center gap-4">
            <Slider id="tolerance" defaultValue={[30]} max={100} step={1} />
            <span className="w-12 text-right text-sm text-muted-foreground">
              30
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="contiguous">Contiguous</Label>
          <Switch id="contiguous" defaultChecked />
        </div>
        <div className="space-y-3">
          <Label htmlFor="color-space">Color Space</Label>
          <Select defaultValue="rgb">
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
          <Select defaultValue="4">
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

function MagicLassoSettings() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="font-headline">
        Magic Lasso Settings
      </SidebarGroupLabel>
      <div className="space-y-4 p-2">
        <div className="space-y-3">
          <Label htmlFor="node-drop-time">Node Drop Time (ms)</Label>
          <Input id="node-drop-time" type="number" defaultValue={200} />
        </div>
        <div className="space-y-3">
          <Label htmlFor="elasticity">Elasticity</Label>
          <div className="flex items-center gap-4">
            <Slider id="elasticity" defaultValue={[0.5]} max={1} step={0.1} />
            <span className="w-12 text-right text-sm text-muted-foreground">
              0.5
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <Label htmlFor="cost-fn">Cost Function</Label>
          <Select defaultValue="sobel">
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
