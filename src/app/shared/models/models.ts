import { ElementRef } from "@angular/core";

export interface ElementSizes {
  width: string;
  height: string;
}

export interface ElementSizesNum {
  width: number;
  height: number;
}

export interface OpenedElement {
  id: number | string;
  element: ElementRef;
  opened: boolean;
}

export const GAP = 10;
export const INITIAL_Z_INDEX = "1";
export const MAX_Z_INDEX = "100";