import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
} from "@angular/core";
import { Observable, Subject, Subscription, fromEvent } from "rxjs";
import { distinctUntilChanged, filter, takeUntil } from "rxjs/operators";
import { DomElementAdpter } from "../adpters/dom-element-adpter";
import { UtlisFunctions } from "../adpters/ultlis-adpter";
import {
  DEFAULT_DRAGGING_BOUNDARY_QUERY,
  ElementSizes,
  ElementSizesNum,
  FREE_DRAGGING_CLASS,
  HEIGHT_DECREASE,
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
export class FreeDraggingDirective implements AfterViewInit, OnDestroy {
  @Input() customX = 0;
  @Input() customY = 0;
  @Input() startOnMiddle = false;
  @Input() baseSizes: ElementSizesNum;
  @Input() elementReference: OpenedElement;
  @Input() boundaryQuery = DEFAULT_DRAGGING_BOUNDARY_QUERY;

  @ContentChild(FreeDraggingHandleDirective, { read: ElementRef })
  handle: ElementRef;

  @ContentChild(FreeDraggingSetFullScreenDirective, { read: ElementRef })
  setFullScreen: ElementRef;

  @ContentChild(FreeDraggingMinimizeDirective, { read: ElementRef })
  minimizeScreen: ElementRef;

  @ContentChild(FreeDraggingCloseDirective, { read: ElementRef })
  closeScreen: ElementRef;

  private initialX = 0;
  private initialY = 0;
  private currentX = 0;
  private currentY = 0;
  private element: HTMLElement;
  private dragSub: Subscription;
  private isOnFullScreen = false;
  private handleElement: HTMLElement;
  private isSettingFullScreen = false;
  private stopTaking$ = new Subject<void>();
  private subscriptions: Subscription[] = [];
  private currentWidth: string | number = "auto";
  private currentHeight: string | number = "auto";
  private draggingBoundaryElement: HTMLElement | HTMLBodyElement;

  constructor(
    private readonly elementRef: ElementRef,
    private readonly lastZIndexService: LastZIndexService,
    private readonly elementsService: ElementsService
  ) {}

  ngAfterViewInit(): void {
    this.draggingBoundaryElement = document.getElementById(this.boundaryQuery);

    if (!this.draggingBoundaryElement)
      throw new Error(
        "Couldn't find any element with query: " + this.boundaryQuery
      );

    this.startElementDomain();
  }

  startElementDomain() {
    this.element = this.elementRef.nativeElement as HTMLElement;
    this.elementReference.element = this.elementRef;
    this.handleElement = this.handle?.nativeElement || this.element;
    this.element.classList.add("example-box");
    this.setSizes();
    this.setCustomStart();
    if (this.startOnMiddle) this.setToMiddle();
    this.initDrag();
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

  setZIndex() {
    const newZIndex = this.lastZIndexService.createNewZIndex(
      this.elementReference.id
    );
    DomElementAdpter.setZIndex(this.element, newZIndex);
  }

  setSizes() {
    this.element.style.width = this.baseSizes.width + "px";
    this.element.style.height = this.baseSizes.height + "px";
    this.element.style.minWidth = this.baseSizes.width + "px";
    this.element.style.minHeight = this.baseSizes.height + "px";
  }

  setCustomStart() {
    const x = this.customX;
    const y = this.customY;
    const mainBoundaryHeight = window.innerHeight - HEIGHT_DECREASE;
    const mainBoudndaryWidth = window.innerHeight;
    const maxBoundX = mainBoudndaryWidth - this.baseSizes.width;
    const maxBoundY = mainBoundaryHeight - this.baseSizes.height;
    this.customX = Math.max(0, Math.min(x, maxBoundX));
    this.customY = Math.max(0, Math.min(y, maxBoundY));
    this.setBasePositions(this.customX, this.customY);
    DomElementAdpter.setTransform(this.element, this.customX, this.customY);
  }

  setToMiddle() {
    const x = window.innerWidth / 2 - this.baseSizes.width / 2;
    const y = window.innerHeight / 2 - this.baseSizes.height / 2;
    this.setBasePositions(x, y);
    DomElementAdpter.setTransform(this.element, x, y);
  }

  setBasePositions(x: number, y: number) {
    this.initialX = x;
    this.initialY = y;
    this.currentX = x;
    this.currentY = y;
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

      if (!this.isOnFullScreen) this.element.classList.add(FREE_DRAGGING_CLASS);

      this.setZIndex();

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
      this.element.classList.remove(FREE_DRAGGING_CLASS);
      if (this.dragSub) {
        this.dragSub.unsubscribe();
      }
    };
  }

  resizeCallBack() {
    return () => {
      this.isOnFullScreen = false;
      this.elementReference.isFullScreen = this.isOnFullScreen;
      this.setZIndex();
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
