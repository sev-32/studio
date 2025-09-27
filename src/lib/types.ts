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
