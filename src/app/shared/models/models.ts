import { ElementRef, Type } from "@angular/core";

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
  lastPosition: {
    x: number;
    y: number;
  };
  isFullScreen: boolean;
}

export interface CreateComponent {
  component: Type<IBaseScreenComponent>;
  id: number;
  args?: { [propName: string]: any };
}

export interface IBaseScreenComponent {
  elementReference: OpenedElement;
}

export const GAP = 10;
export const OBSERVE_CONFIG = {
  attributes: true,
  childList: true,
  subtree: true,
};
export const DEFAULT_DRAGGING_BOUNDARY_QUERY = "html";
