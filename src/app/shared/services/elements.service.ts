import { ElementRef, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OpenedElement } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ElementsService {

  openedElements$ = new BehaviorSubject<OpenedElement[]>([]);

  constructor() { }



  pushElement(element: ElementRef, id: number | string) {
    const otherElements = this.openedElements$.value;
    const newElement: OpenedElement = {
      element: element,
      id: id,
      opened: true
    }

    this.openedElements$.next([...otherElements, newElement])
  }

}
