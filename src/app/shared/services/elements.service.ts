import { ElementRef, Injectable, inject } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { DomElementAdpter } from "../adpters/dom-element-adpter";
import { UtlisFunctions } from "../adpters/ultlis-adpter";
import { CreateComponent, OpenedElement } from "../models/models";
import { LastZIndexService } from "./last-z-index.service";

@Injectable({
  providedIn: "root",
})
export class ElementsService {
  private readonly lastZIndexService = inject(LastZIndexService);
  openedElements$ = new BehaviorSubject<OpenedElement[]>([]);
  createElement$ = new Subject<CreateComponent>();
  destroyElement$ = new Subject<number>();

  pushElement(element: ElementRef, id: number | string) {
    const otherElements = this.openedElements$.value;
    const newElement: OpenedElement = {
      element: element,
      id: id,
      opened: true,
      lastPosition: { x: 0, y: 0 },
      isFullScreen: false,
    };

    this.openedElements$.next([...otherElements, newElement]);
    return newElement;
  }

  handleElementClick(id: number | string) {
    const element = this.findElement(id);
    if (!element) return;

    element.opened ? this.hideElement(element) : this.showElement(element);
  }

  showElement(element: OpenedElement) {
    element.opened = !element.opened;
    const domElement = element.element.nativeElement;

    DomElementAdpter.setOnlyTransformTransition(domElement, 1);
    DomElementAdpter.setZIndex(
      domElement,
      this.lastZIndexService.createNewZIndex(element.id)
    );
    domElement.style.display = "flex";

    UtlisFunctions.timerSubscription(50).subscribe(() => {
      DomElementAdpter.setTransform(
        domElement,
        element.lastPosition.x,
        element.lastPosition.y
      );

      UtlisFunctions.timerSubscription(1000).subscribe(() => {
        domElement.style.display = "flex";
        DomElementAdpter.removeTransition(domElement);
      });
    });
  }

  hideElement(element: OpenedElement) {
    const domElement = element.element.nativeElement;

    const { x, y } = DomElementAdpter.getTransformValues(
      domElement.style.transform
    );
    const isHiggerElement = element.id == this.higgestElementId();

    const isOnlyElement = this.openedElements
      .filter((item) => item != element)
      .filter((item) => !!item.opened);

    const isBehindAnotherElement = this.openedElements
      .filter((item) => item.id != element.id)
      .filter((item) => !!item.opened)
      .map(
        (item) =>
          this.elementAboveOther(item.element.nativeElement, domElement) &&
          this.validateFullScreen(item, element)
      )
      .find((result) => !!result);

    const onFullScreenAndNotBigger = element.isFullScreen && !isHiggerElement;
    const hasNoOtherElement = isOnlyElement.length <= 0;

    if (
      ((isBehindAnotherElement && !isHiggerElement) ||
        onFullScreenAndNotBigger) &&
      !hasNoOtherElement
    ) {
      DomElementAdpter.setZIndex(
        domElement,
        this.lastZIndexService.createNewZIndex(element.id)
      );
      return;
    }

    const index = this.findIndexElement(element.id);
    element.lastPosition = { x, y };
    element.opened = !element.opened;

    DomElementAdpter.setOnlyTransformTransition(domElement, 5);
    DomElementAdpter.setTransform(
      domElement,
      (index + 1) * 20,
      window.innerHeight * 2.5
    );

    UtlisFunctions.timerSubscription(100).subscribe(() => {
      DomElementAdpter.removeTransition(domElement);
      domElement.style.display = "none";
    });
  }

  findElement(id: number | string) {
    return this.openedElements.find((item) => item.id == id);
  }

  findIndexElement(id: number | string) {
    return this.openedElements.findIndex((item) => item.id == id);
  }

  get openedElements() {
    return this.openedElements$.value;
  }

  higgestElementId() {
    const idsAndZIndez = this.openedElements
      .filter((item) => !!item.opened)
      .map((item) => ({
        id: item.id,
        zIndez: item.element.nativeElement.style.zIndex || 0,
      }));

    const maxZindex = Math.max(...idsAndZIndez.map((item) => item.zIndez));

    const element = idsAndZIndez.find((item) => item.zIndez == maxZindex);

    return element.id;
  }

  validateFullScreen(element1: OpenedElement, element2: OpenedElement) {
    const zIndex1 = element1.element.nativeElement.style.zIndex || 0;
    const zIndex2 = element2.element.nativeElement.style.zIndex || 0;
    return zIndex1 > zIndex2;
  }

  elementAboveOther(element1: HTMLElement, element2: HTMLElement) {
    const domRect1 = element1.getBoundingClientRect();
    const domRect2 = element2.getBoundingClientRect();

    return !(
      domRect1.top > domRect2.bottom ||
      domRect1.right < domRect2.left ||
      domRect1.bottom < domRect2.top ||
      domRect1.left > domRect2.right
    );
  }
}
