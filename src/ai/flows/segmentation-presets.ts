'use server';

/**
 * @fileOverview AI-powered segmentation presets flow.
 *
 * This file defines a Genkit flow that leverages AI to generate presets
 * for common image segmentation tasks like green screen removal and texture fusion.
 *
 * @remarks
 *   - `generateSegmentationPreset`: The main function to generate segmentation presets.
 *   - `SegmentationPresetInput`: The input type for the `generateSegmentationPreset` function.
 *   - `SegmentationPresetOutput`: The output type for the `generateSegmentationPreset` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the input schema
const SegmentationPresetInputSchema = z.object({
  imageDescription: z
    .string()
    .describe(
      'A description of the image for which segmentation presets are needed.'
    ),
  task: z
    .string()
    .describe(
      'The specific segmentation task, such as "green screen removal" or "texture fusion".'
    ),
});
export type SegmentationPresetInput = z.infer<typeof SegmentationPresetInputSchema>;

// Define the output schema
const SegmentationPresetOutputSchema = z.object({
  presetName: z.string().describe('The name of the generated segmentation preset.'),
  parameters: z
    .record(z.any())
    .describe(
      'A JSON object containing the recommended parameters for the specified segmentation task.'
    ),
  description:
    z.string().describe('A description of what the preset does and when to use it.'),
});
export type SegmentationPresetOutput = z.infer<typeof SegmentationPresetOutputSchema>;

// Exported function to call the flow
export async function generateSegmentationPreset(
  input: SegmentationPresetInput
): Promise<SegmentationPresetOutput> {
  return segmentationPresetFlow(input);
}

// Define the prompt
const segmentationPresetPrompt = ai.definePrompt({
  name: 'segmentationPresetPrompt',
  input: { schema: SegmentationPresetInputSchema },
  output: { schema: SegmentationPresetOutputSchema },
  prompt: `You are an expert image processing engineer specializing in image segmentation.
  Your task is to generate a segmentation preset for the given image and task.

  Image Description: {{{imageDescription}}}
  Segmentation Task: {{{task}}}

  Based on the image description and the segmentation task, provide a JSON object
  containing the optimal parameters for the segmentation. Also include a preset name and description.
  Ensure the output is a valid JSON object that conforms to the SegmentationPresetOutputSchema.

  For example, if the task is "green screen removal", a good starting point is:
  {
    "presetName": "Green Screen Removal",
        "description": "Optimized for removing green screens from images by setting a high saturation tolerance.",
    "parameters": {
      "Tolerance": 60,
      "Contiguous": false,
      "ColorSpace": "HSV"
    }
  }
  `,
});

// Define the flow
const segmentationPresetFlow = ai.defineFlow(
  {
    name: 'segmentationPresetFlow',
    inputSchema: SegmentationPresetInputSchema,
    outputSchema: SegmentationPresetOutputSchema,
  },
  async input => {
    const { output } = await segmentationPresetPrompt(input);
    return output!;
  }
);
