import { ElementRef, Injectable } from "@angular/core";
import { BehaviorSubject, Subject, take, timer } from "rxjs";
import { OpenedElement } from "../models/models";
import { DomElementAdpter } from "../adpters/dom-element-adpter";
import { LastZIndexService } from "./last-z-index.service";
import { UtlisFunctions } from "../adpters/ultlis-adpter";

@Injectable({
  providedIn: "root",
})
export class ElementsService {
  openedElements$ = new BehaviorSubject<OpenedElement[]>([]);

  constructor(private readonly lastZIndexService: LastZIndexService) { }

  pushElement(element: ElementRef, id: number | string) {
    const otherElements = this.openedElements$.value;
    const newElement: OpenedElement = {
      element: element,
      id: id,
      opened: true,
      lastPosition: { x: 0, y: 0 },
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

    DomElementAdpter.setOnlyTransformTransition(domElement, 2);
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

    const { x, y } = DomElementAdpter.getTransformValues(domElement.style.transform);
 
    const boundingRect = domElement.getBoundingClientRect();
    const left = boundingRect.left + 1
    const right = boundingRect.right - 1
    const top = boundingRect.top + 1
    const bottom = boundingRect.bottom - 1

    const elementPoints = [
      document.elementFromPoint(left, top),
      document.elementFromPoint(right, top),
      document.elementFromPoint(left, bottom),
      document.elementFromPoint(right, bottom)
    ].filter(element => !!element.id)

    const isBehindAnotherElement = elementPoints.find(elementItem => elementItem.id != element.id)

    if (isBehindAnotherElement) {
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
      window.innerHeight
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
}
