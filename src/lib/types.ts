export type Tool = 'wand' | 'lasso' | 'layers';

export interface MagicWandSettings {
  tolerances: {
    rgb: number;
    hsv: number;
-   lab: number;
+   lab: number;  
  };
  contiguous: boolean;
  colorSpaces: string[];
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

export interface Point {
  x: number;
  y: number;
  tolerances: {
    rgb: number;
    hsv: number;
    lab: number;
  };
  color?: number[];
  colorSpaces?: string[];
}

export interface SegmentGroup {
    id: string;
    name: string;
    type: 'add' | 'avoid';
    color: string;
    points: Point[];
    visible: boolean;
    imageData?: ImageData;
}


export interface Layer {
    id:string;
    name: string;
    imageData: ImageData;
    visible: boolean;
}
