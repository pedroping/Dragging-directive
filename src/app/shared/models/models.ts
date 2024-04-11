import { ElementRef, Type } from "@angular/core";
import { PageContentComponent } from "../components/page-content/page-content.component";

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
  id: number;
  args?: { [propName: string]: any };
}

export interface IBaseScreenComponent {
  customX: number;
  customY: number;
  startOnMiddle: boolean;
  baseSizes: {
    width: number;
    height: number;
  };
  elementReference: OpenedElement;
  pageContent: Type<unknown>;
}

export interface IComponentModel {
  id: number;
  args: Partial<IBaseScreenComponent>;
}

export const GAP = 10;
export const OBSERVE_CONFIG = {
  attributes: true,
  childList: true,
  subtree: true,
};
export const DEFAULT_DRAGGING_BOUNDARY_QUERY = "main-boundary";
export const FREE_DRAGGING_CLASS = "free-dragging";
export const HEIGHT_DECREASE = 60;

export const PAGE00: IComponentModel = {
  id: 0,
  args: {
    startOnMiddle: true,
    baseSizes: {
      width: window.innerWidth / 2 - 1,
      height: window.innerHeight / 2 - 30,
    },
    pageContent: PageContentComponent,
  },
};
export const PAGE01: IComponentModel = {
  id: 1,
  args: {
    baseSizes: {
      width: window.innerWidth / 2 - 1,
      height: window.innerHeight / 2 - 30,
    },
    customY: window.innerHeight * 0.05,
    customX: window.innerWidth * 0.06,
    pageContent: PageContentComponent,
  },
};

export const PAGE02: IComponentModel = {
  id: 2,
  args: { customX: 890, customY: 750, pageContent: PageContentComponent },
};
