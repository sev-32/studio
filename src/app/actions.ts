'use server';

import { generateSegmentationPreset } from '@/ai/flows/segmentation-presets';
import { z } from 'zod';

const formSchema = z.object({
  imageDescription: z.string().min(1, 'Image description is required.'),
  task: z.string(),
});

export async function generatePresetAction(
  prevState: any,
  formData: FormData
) {
  try {
    const parsed = formSchema.safeParse({
      imageDescription: formData.get('imageDescription'),
      task: formData.get('task'),
    });

    if (!parsed.success) {
      return { error: parsed.error.errors.map((e) => e.message).join(', ') };
    }

    const result = await generateSegmentationPreset(parsed.data);
    return result;
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'An unknown error occurred.';
    console.error(error);
    return { error };
  }
}
