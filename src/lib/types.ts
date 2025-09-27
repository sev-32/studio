export type Tool = 'wand' | 'lasso' | 'layers';

export interface MagicWandSettings {
  tolerance: number;
  contiguous: boolean;
  colorSpace: string;
  connectivity: string;
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
    [key: string]: number[];
  };
  tolerance: number;
  glcm?: {
    [key: string]: number[];
  };
  radius?: number;
}
