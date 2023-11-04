import { ElementRef, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { OpenedElement } from "../models/models";

@Injectable({
  providedIn: "root",
})
export class ElementsService {
  openedElements$ = new BehaviorSubject<OpenedElement[]>([]);

  constructor() {}

  pushElement(element: ElementRef, id: number | string) {
    const otherElements = this.openedElements$.value;
    const newElement: OpenedElement = {
      element: element,
      id: id,
      opened: true,
    };

    this.openedElements$.next([...otherElements, newElement]);
    return newElement;
  }

  handleElementClick(id: number | string) {
    const element = this.findElement(id);
    if (!element) return;

    const fn = element.opened ? this.hideElement : this.showElement;
    element.opened = !element.opened;
    fn(element);
  }

  showElement(element: OpenedElement) {
    const domElement = element.element.nativeElement;
    domElement.style.display = "flex";
  }

  hideElement(element: OpenedElement) {
    const domElement = element.element.nativeElement;
    console.log(domElement);

    domElement.style.display = "none";
  }

  findElement(id: number | string) {
    return this.openedElements.find((item) => item.id == id);
  }

  get openedElements() {
    return this.openedElements$.value;
  }
}
