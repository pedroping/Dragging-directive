import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
} from "@angular/core";
import { Observable, Subject, Subscription, fromEvent, timer } from "rxjs";
import { distinctUntilChanged, take, takeUntil } from "rxjs/operators";
import { FreeDraggingHandleDirective } from "./free-dragging-handle.directive";

export interface ElementSizes {
  width: string;
  height: string;
}

export interface ElementSizesNum {
  width: number;
  height: number;
}

export const GAP = 10;
@Directive({
  selector: "[appFreeDragging]",
  exportAs: "appFreeDragging",
})
export class FreeDraggingDirective implements AfterViewInit, OnDestroy {
  private readonly DEFAULT_DRAGGING_BOUNDARY_QUERY = "html";
  private element: HTMLElement;
  private subscriptions: Subscription[] = [];

  @ContentChild(FreeDraggingHandleDirective, { read: ElementRef })
  handle: ElementRef;
  @Input() boundaryQuery = this.DEFAULT_DRAGGING_BOUNDARY_QUERY;
  @Input() heightDrecrease = 0;
  @Input() widthDrecrease = 0;
  @Input() baseSizes: ElementSizesNum;

  handleElement: HTMLElement;
  draggingBoundaryElement: HTMLElement | HTMLBodyElement;
  stopTaking$ = new Subject<void>();
  isOnFullScreen = false;

  initialX: number;
  initialY: number;
  currentX = 0;
  currentY = 0;
  dragSub: Subscription;

  observeConfig = { attributes: true, childList: true, subtree: true };

  constructor(private elementRef: ElementRef) { }

  ngAfterViewInit(): void {
    this.draggingBoundaryElement = document.querySelector(this.boundaryQuery);

    if (!this.draggingBoundaryElement) {
      throw new Error(
        "Couldn't find any element with query: " + this.boundaryQuery
      );
    } else {
      this.element = this.elementRef.nativeElement as HTMLElement;
      this.handleElement = this.handle?.nativeElement || this.element;
      this.initDrag();
    }
  }

  initDrag(): void {
    const resizeSubject$ = new Subject<{ height: string; width: string }>();
    const windowResize$ = fromEvent(window, "resize");
    const dragStart$ = fromEvent<MouseEvent>(this.handleElement, "mousedown");
    const dragEnd$ = fromEvent<MouseEvent>(document, "mouseup");
    const drag$ = fromEvent<MouseEvent>(document, "mousemove").pipe(
      takeUntil(dragEnd$)
    );
    const resize$ = resizeSubject$
      .asObservable()
      .pipe(
        distinctUntilChanged(
          (prev: ElementSizes, curr: ElementSizes) =>
            prev.height === curr.height && prev.width === curr.width
        )
      );

    const dragStartSub = dragStart$.subscribe(this.dragStartCallBack(drag$));
    const dragEndSub = dragEnd$.subscribe(this.dragEndCallBack());
    const windowResizeSub = windowResize$.subscribe(this.winResizeCallBack());
    const resizeSub = resize$.subscribe(this.resizeCallBack());
    new MutationObserver(this.mutationObserveCallBack(resizeSubject$)).observe(
      this.elementRef.nativeElement,
      this.observeConfig
    );

    this.subscriptions.push.apply(this.subscriptions, [
      dragStartSub,
      this.dragSub,
      dragEndSub,
      resizeSub,
      windowResizeSub,
    ]);
  }

  isSmallestThan(value: string, baseSize: number) {
    const number = +value.replace("px", "");
    return number < baseSize;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  getTransformValues(transform: string) {
    if (!transform) return { x: -1, y: -1 };
    const splitedLabel = transform.split("(")[1].replace(")", "");
    const splitedValues = splitedLabel
      .replace(",", "")
      .split(" ")
      .map((value) => +value.replace(",", "").replace("px", ""));

    return { x: splitedValues[0], y: splitedValues[1] };
  }

  setFullSize() {
    this.element.style.transition = "all .5s ease";

    timer(100)
      .pipe(take(1))
      .subscribe(() => {
        this.element.style.transform = `translate3d(0px, 0px, 0)`;
        this.element.style.width = window.innerWidth + "px";
        this.element.style.height =
          window.innerHeight - this.heightDrecrease + "px";

        timer(1000)
          .pipe(take(1))
          .subscribe(() => {
            this.isOnFullScreen = true;
            this.element.style.transition = "none";
          });
      });
  }

  dragStartCallBack(drag$: Observable<MouseEvent>) {
    return (event: MouseEvent) => {
      const minBoundX = this.draggingBoundaryElement.offsetLeft;
      const minBoundY = this.draggingBoundaryElement.offsetTop;

      const maxBoundX =
        minBoundX +
        this.draggingBoundaryElement.offsetWidth -
        this.element.offsetWidth;
      const maxBoundY =
        minBoundY +
        this.draggingBoundaryElement.offsetHeight -
        this.heightDrecrease -
        this.element.offsetHeight;

      this.stopTaking$.next();
      this.initialX = event.clientX - this.currentX;
      this.initialY = event.clientY - this.currentY;
      this.element.classList.add("free-dragging");

      this.dragSub = drag$.subscribe((event: MouseEvent) => {
        this.stopTaking$.next();
        event.preventDefault();

        const x = event.clientX - this.initialX;
        const y = event.clientY - this.initialY;

        this.currentX = Math.max(minBoundX, Math.min(x, maxBoundX));
        this.currentY = Math.max(minBoundY, Math.min(y, maxBoundY));

        this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
      });
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
      const { x, y } = this.getTransformValues(this.element.style.transform);
      this.currentX = x;
      this.currentY = y;

      if (
        y + this.element.offsetHeight >
        window.innerHeight - this.heightDrecrease - GAP
      ) {
        const newY =
          window.innerHeight -
          this.heightDrecrease -
          GAP -
          this.element.offsetHeight +
          GAP;
        this.currentY = newY;
      }

      if (x + this.element.offsetWidth > window.innerWidth - GAP * 2) {
        const newX = window.innerWidth - this.element.offsetWidth;
        this.currentX = newX;
      }

      this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
    };
  }

  winResizeCallBack() {
    return () => {

      if (this.isOnFullScreen) {
        this.setFullSize();
        return;
      }

      if (this.element.offsetWidth > window.innerWidth) {
        this.element.style.width = window.innerWidth + "px";
      }

      if (
        this.element.offsetHeight >
        window.innerHeight - this.heightDrecrease
      ) {
        this.element.style.height =
          window.innerHeight - this.heightDrecrease + "px";
      }
    };
  }

  mutationObserveCallBack(
    resizeSubject$: Subject<{
      height: string;
      width: string;
    }>
  ) {
    return () => {
      const width = this.elementRef.nativeElement.style.width;
      const height = this.elementRef.nativeElement.style.height;

      if (this.isOnFullScreen) {
        if (
          this.element.offsetWidth != window.innerWidth ||
          this.element.offsetHeight != window.innerHeight - this.heightDrecrease
        ) {
          this.isOnFullScreen = false;
        }

      }

      resizeSubject$.next({
        width: this.isSmallestThan(width, this.baseSizes.width)
          ? `${this.baseSizes.width}px`
          : width,
        height: this.isSmallestThan(height, this.baseSizes.height)
          ? `${this.baseSizes.height}px`
          : height,
      });
    };
  }
}
