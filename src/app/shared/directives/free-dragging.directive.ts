import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
} from "@angular/core";
import { Observable, Subject, Subscription, fromEvent } from "rxjs";
import { distinctUntilChanged, filter, takeUntil } from "rxjs/operators";
import { DomElementAdpter } from "../adpters/dom-element-adpter";
import { UtlisFunctions } from "../adpters/ultlis-adpter";
import {
  DEFAULT_DRAGGING_BOUNDARY_QUERY,
  ElementSizes,
  ElementSizesNum,
  GAP,
  OBSERVE_CONFIG,
  OpenedElement,
} from "../models/models";
import { ElementsService } from "../services/elements.service";
import { LastZIndexService } from "../services/last-z-index.service";
import { FreeDraggingCloseDirective } from "./selectors/free-dragging-close.directive";
import { FreeDraggingHandleDirective } from "./selectors/free-dragging-handle.directive";
import { FreeDraggingMinimizeDirective } from "./selectors/free-dragging-minimize.directive";
import { FreeDraggingSetFullScreenDirective } from "./selectors/free-dragging-set-full-screen.directive";
@Directive({
  selector: "[appFreeDragging]",
  standalone: true,
})
export class FreeDraggingDirective
  implements AfterViewInit, OnDestroy, OnChanges
{
  private readonly elementRef = inject(ElementRef);
  private readonly lastZIndexService = inject(LastZIndexService);
  private readonly elementsService = inject(ElementsService);

  @Input() boundaryQuery = DEFAULT_DRAGGING_BOUNDARY_QUERY;
  @Input() widthDrecrease = 0;
  @Input() baseSizes: ElementSizesNum;
  @Input() startOnMiddle = false;
  @Input() customX;
  @Input() customY;
  @Input() elementReference: OpenedElement;

  @ContentChild(FreeDraggingHandleDirective, { read: ElementRef })
  handle: ElementRef;

  @ContentChild(FreeDraggingSetFullScreenDirective, { read: ElementRef })
  setFullScreen: ElementRef;

  @ContentChild(FreeDraggingMinimizeDirective, { read: ElementRef })
  minimizeScreen: ElementRef;

  @ContentChild(FreeDraggingCloseDirective, { read: ElementRef })
  closeScreen: ElementRef;

  private draggingBoundaryElement: HTMLElement | HTMLBodyElement;
  private subscriptions: Subscription[] = [];
  private stopTaking$ = new Subject<void>();
  private handleElement: HTMLElement;
  private isSettingFullScreen = false;
  private isOnFullScreen = false;
  private dragSub: Subscription;
  private element: HTMLElement;
  private initialX = 0;
  private initialY = 0;
  private currentX = 0;
  private currentY = 0;
  private currentWidth: string | number = "auto";
  private currentHeight: string | number = "auto";

  ngAfterViewInit(): void {
    this.draggingBoundaryElement = document.getElementById(this.boundaryQuery);

    if (!this.draggingBoundaryElement)
      throw new Error(
        "Couldn't find any element with query: " + this.boundaryQuery
      );

    this.startElementDomain();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes["customX"] || changes["customY"]) && this.element) {
      this.setCustomStart();
    }
  }

  startElementDomain() {
    this.element = this.elementRef.nativeElement as HTMLElement;
    this.elementReference.element = this.elementRef;
    this.handleElement = this.handle?.nativeElement || this.element;
    this.element.classList.add("example-box");
    this.initDrag();
    this.setCustomStart();
    this.setSizes();
    if (this.startOnMiddle) this.setToMiddle();
  }

  initDrag(): void {
    const resizeSubject$ = new Subject<{ height: string; width: string }>();
    const windowResize$ = fromEvent(window, "resize");
    const dragStart$ = fromEvent<MouseEvent>(this.handleElement, "mousedown");
    const dragEnd$ = fromEvent<MouseEvent>(document, "mouseup");
    const drag$ = fromEvent<MouseEvent>(document, "mousemove").pipe(
      takeUntil(dragEnd$)
    );
    const fullScreenClick$ = fromEvent(
      this.setFullScreen?.nativeElement,
      "click"
    );
    const minimuzeClick$ = fromEvent(
      this.minimizeScreen?.nativeElement,
      "click"
    );
    const closeClick$ = fromEvent(this.closeScreen?.nativeElement, "click");
    const click$ = fromEvent<MouseEvent>(
      this.elementRef.nativeElement,
      "click"
    );
    const resize$ = resizeSubject$.asObservable().pipe(
      distinctUntilChanged(
        (prev: ElementSizes, curr: ElementSizes) =>
          prev.height === curr.height && prev.width === curr.width
      ),
      filter(() => !this.isSettingFullScreen)
    );

    const minimizeClick = minimuzeClick$.subscribe(
      this.minimizeScreenCallBack()
    );
    const windowResizeSub = windowResize$.subscribe(this.winResizeCallBack());
    const dragStartSub = dragStart$.subscribe(this.dragStartCallBack(drag$));
    const dragEndSub = dragEnd$.subscribe(this.dragEndCallBack());
    const resizeSub = resize$.subscribe(this.resizeCallBack());
    const clickSub = click$.subscribe(this.clickCallBack());
    const closeSub = closeClick$.subscribe(this.closeScreenCallBack());
    const fullScreenClick = fullScreenClick$.subscribe(
      this.setFullScreenCallBack()
    );
    new MutationObserver(this.mutationObserveCallBack(resizeSubject$)).observe(
      this.elementRef.nativeElement,
      OBSERVE_CONFIG
    );

    this.subscriptions = [
      dragStartSub,
      this.dragSub,
      dragEndSub,
      resizeSub,
      clickSub,
      windowResizeSub,
      fullScreenClick,
      minimizeClick,
      closeSub,
    ];
  }

  setSizes() {
    this.element.style.width = this.baseSizes.width + "px";
    this.element.style.height = this.baseSizes.height + "px";
    this.element.style.minWidth = this.baseSizes.width + "px";
    this.element.style.minHeight = this.baseSizes.height + "px";
  }

  setCustomStart() {
    const x = this.customX || this.currentX;
    const y = this.customY || this.currentY;
    DomElementAdpter.setTransform(this.element, x, y);
  }

  setToMiddle() {
    const x = window.innerWidth / 2 - this.baseSizes.width / 2;
    const y = window.innerHeight / 2 - this.baseSizes.height / 2;
    DomElementAdpter.setTransform(this.element, x, y);
  }

  setFullSize(setFullScreen = !this.isOnFullScreen) {
    if (this.isSettingFullScreen) return;

    if (!this.isOnFullScreen) {
      this.currentWidth =
        DomElementAdpter.getNumberFromSize(this.element.style.width) ||
        this.baseSizes.width;
      this.currentHeight =
        DomElementAdpter.getNumberFromSize(this.element.style.height) ||
        this.baseSizes.height;
    }

    this.isSettingFullScreen = true;
    const transform = setFullScreen
      ? `translate3d(0px, 0px, 0)`
      : `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
    const width = setFullScreen ? window.innerWidth : this.currentWidth;
    const height = setFullScreen
      ? this.draggingBoundaryElement.offsetHeight
      : this.currentHeight;

    DomElementAdpter.setTransition(this.element);

    UtlisFunctions.timerSubscription(100).subscribe(() => {
      this.element.style.width = width + "px";
      this.element.style.height = height + "px";
      this.element.style.transform = transform;
    });

    UtlisFunctions.timerSubscription(200).subscribe(() => {
      this.isOnFullScreen = setFullScreen;
      this.elementReference.isFullScreen = this.isOnFullScreen;
      DomElementAdpter.removeTransition(this.element);
    });

    UtlisFunctions.timerSubscription(300).subscribe(() => {
      this.isSettingFullScreen = false;
      this.isOnFullScreen = setFullScreen;
      this.elementReference.isFullScreen = this.isOnFullScreen;
    });
  }

  resetPositionsCallback() {
    return () => {
      const { x, y } = DomElementAdpter.getTransformValues(
        this.element.style.transform
      );
      this.currentX = x;
      this.currentY = y;
    };
  }

  dragStartCallBack(drag$: Observable<MouseEvent>) {
    return (event: MouseEvent) => {
      this.stopTaking$.next();
      const maxBoundX =
        this.draggingBoundaryElement.offsetWidth - this.element.offsetWidth;
      const maxBoundY =
        this.draggingBoundaryElement.offsetHeight - this.element.offsetHeight;

      this.initialX = event.clientX - this.currentX;
      this.initialY = event.clientY - this.currentY;

      const newZIndex = this.lastZIndexService.createNewZIndex(
        this.elementReference.id
      );

      if (!this.isOnFullScreen) this.element.classList.add("free-dragging");

      DomElementAdpter.setZIndex(this.element, newZIndex);

      this.dragSub = drag$.subscribe((event: MouseEvent) => {
        this.stopTaking$.next();
        event.preventDefault();

        if (this.isOnFullScreen) return;

        const x = event.clientX - this.initialX;
        const y = event.clientY - this.initialY;

        this.currentX = Math.max(0, Math.min(x, maxBoundX));
        this.currentY = Math.max(0, Math.min(y, maxBoundY));

        DomElementAdpter.setTransform(
          this.element,
          this.currentX,
          this.currentY
        );
      });
    };
  }

  clickCallBack() {
    return () => {
      this.element.style.zIndex = this.lastZIndexService.createNewZIndex(
        this.elementReference.id
      );
    };
  }

  closeScreenCallBack() {
    return () => {
      this.elementsService.destroyElement$.next(+this.elementReference.id);
    };
  }

  setFullScreenCallBack() {
    return () => {
      this.setFullSize();
    };
  }

  minimizeScreenCallBack() {
    return () => {
      this.elementsService.hideElement(this.elementReference);
    };
  }

  dragEndCallBack() {
    return () => {
      this.initialX = this.currentX;
      this.initialY = this.currentY;
      this.stopTaking$.next();
      this.element.classList.remove("free-dragging");
      if (this.dragSub) {
        this.dragSub.unsubscribe();
      }
    };
  }

  resizeCallBack() {
    return () => {
      this.isOnFullScreen = false;
      this.elementReference.isFullScreen = this.isOnFullScreen;

      const { x, y } = DomElementAdpter.getTransformValues(
        this.element.style.transform
      );
      this.currentX = x;
      this.currentY = y;

      if (
        y + this.element.offsetHeight >
        this.draggingBoundaryElement.offsetHeight - GAP
      ) {
        const winHeight = this.draggingBoundaryElement.offsetHeight;
        const newY = winHeight - this.element.offsetHeight;

        this.currentY = newY;
      }

      if (x + this.element.offsetWidth > window.innerWidth - GAP * 2) {
        const newX = window.innerWidth - this.element.offsetWidth;
        this.currentX = newX;
      }

      const newZIndex = this.lastZIndexService.createNewZIndex(
        this.elementReference.id
      );
      DomElementAdpter.setZIndex(this.element, newZIndex);
      DomElementAdpter.setTransform(this.element, this.currentX, this.currentY);
    };
  }

  winResizeCallBack() {
    return () => {
      if (this.isOnFullScreen) {
        this.setFullSize(true);
        return;
      }

      if (this.element.offsetWidth > window.innerWidth) {
        this.element.style.width = window.innerWidth + "px";
      }

      if (
        this.element.offsetHeight > this.draggingBoundaryElement.offsetHeight
      ) {
        this.element.style.height =
          this.draggingBoundaryElement.offsetHeight + "px";
      }

      const width = this.element.style.width
        ? DomElementAdpter.getNumberFromSize(this.element.style.width)
        : this.baseSizes.width;
      const height = this.element.style.height
        ? DomElementAdpter.getNumberFromSize(this.element.style.height)
        : this.baseSizes.height;
      const maxX = window.innerWidth - width;
      const maxY = this.draggingBoundaryElement.offsetHeight - height;

      this.currentX = Math.max(0, Math.min(this.currentX, maxX));
      this.currentY = Math.max(0, Math.min(this.currentY, maxY));
      DomElementAdpter.setTransform(this.element, this.currentX, this.currentY);
    };
  }

  mutationObserveCallBack(
    resizeSubject$: Subject<{
      height: string;
      width: string;
    }>
  ) {
    return () => {
      const width = DomElementAdpter.getNumberFromSize(
        this.elementRef.nativeElement.style.width
      );
      const height = DomElementAdpter.getNumberFromSize(
        this.elementRef.nativeElement.style.height
      );

      resizeSubject$.next({
        width: Math.max(width, this.baseSizes.height) + "px",
        height: Math.max(height, this.baseSizes.height) + "px",
      });
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
}
