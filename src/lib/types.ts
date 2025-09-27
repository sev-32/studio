export type Tool = 'wand' | 'lasso' | 'layers';

export interface MagicWandSettings {
  tolerance: number;
  contiguous: boolean;
  colorSpace: string;
}

export interface MagicLassoSettings {
  nodeDropTime: number;
  elasticity: number;
  costFunction: string;
}

export interface Preset {
  category: string;
  space: string;
  ranges: {
    [key:string]: number[];
  };
  tolerance: number;
  glcm?: {
    [key:string]: number[];
  };
  radius?: number;
}

export interface SeedPoint {
  x: number;
  y: number;
  tolerance: number;
}

export interface AvoidancePoint {
  x: number;
  y: number;
  color: number[];
  tolerance: number;
  colorSpace: string;
}

export interface Layer {
    id: string;
    name: string;
    imageData: ImageData;
    visible: boolean;
}
