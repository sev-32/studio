'use client';

import { useState } from 'react';
import { useFormState } from 'react-dom';
import { generatePresetAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import type { ImagePlaceholder } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import type { SegmentationPresetOutput } from '@/ai/flows/segmentation-presets';

interface PresetGeneratorProps {
  currentImage: ImagePlaceholder;
}

export function PresetGenerator({ currentImage }: PresetGeneratorProps) {
  const [state, formAction] = useFormState(generatePresetAction, null);
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await generatePresetAction(state, formData);
    setPending(false);

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: 'Preset Generation Failed',
        description: result.error,
      });
    }
  };

  return (
    <>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel className="font-headline">
          AI-Powered Presets
        </SidebarGroupLabel>
        <form onSubmit={handleSubmit} className="p-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="task">Segmentation Task</Label>
              <Select name="task" defaultValue="green-screen-removal">
                <SelectTrigger id="task">
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green-screen-removal">
                    Green Screen Removal
                  </SelectItem>
                  <SelectItem value="texture-fusion">Texture Fusion</SelectItem>
                  <SelectItem value="background-blur">
                    Background Blur
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageDescription">Image Context</Label>
              <Textarea
                id="imageDescription"
                name="imageDescription"
                placeholder="Describe the image and what you want to select..."
                defaultValue={currentImage.description}
                rows={3}
              />
            </div>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={pending}>
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate Preset
          </Button>
        </form>

        {state && !state.error && (
          <div className="p-2">
            <PresetCard preset={state} />
          </div>
        )}
      </SidebarGroup>
    </>
  );
}

function PresetCard({ preset }: { preset: SegmentationPresetOutput }) {
  return (
    <Card className="mt-4 bg-secondary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-headline">
          <Sparkles className="h-4 w-4 text-primary" />
          {preset.presetName}
        </CardTitle>
        <CardDescription>{preset.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">
        <p className="font-medium">Recommended Parameters:</p>
        <pre className="mt-2 rounded-md bg-background p-2 font-code text-xs">
          {JSON.stringify(preset.parameters, null, 2)}
        </pre>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Apply Preset</Button>
      </CardFooter>
    </Card>
  );
}
