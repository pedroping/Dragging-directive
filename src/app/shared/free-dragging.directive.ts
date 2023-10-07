import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { Subject, Subscription, fromEvent, timer } from "rxjs";
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
export class FreeDraggingDirective implements OnInit, AfterViewInit, OnDestroy {
  private readonly DEFAULT_DRAGGING_BOUNDARY_QUERY = "html";
  private _worker!: Worker;
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

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    this.setServiceWorker();
  }

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
      .pipe(distinctUntilChanged((prev, curr) => prev === curr));

    let initialX: number,
      initialY: number,
      currentX = 0,
      currentY = 0;

    let dragSub: Subscription;

    const dragStartSub = dragStart$.subscribe((event: MouseEvent) => {
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
      initialX = event.clientX - currentX;
      initialY = event.clientY - currentY;
      this.element.classList.add("free-dragging");

      dragSub = drag$.subscribe((event: MouseEvent) => {
        this.stopTaking$.next();
        event.preventDefault();

        const x = event.clientX - initialX;
        const y = event.clientY - initialY;

        currentX = Math.max(minBoundX, Math.min(x, maxBoundX));
        currentY = Math.max(minBoundY, Math.min(y, maxBoundY));

        this.element.style.transform =
          "translate3d(" + currentX + "px, " + currentY + "px, 0)";
      });
    });

    const dragEndSub = dragEnd$.subscribe(() => {
      initialX = currentX;
      initialY = currentY;
      this.stopTaking$.next();
      this.element.classList.remove("free-dragging");
      if (dragSub) {
        dragSub.unsubscribe();
      }
    });

    const resizeSub = resize$
      .pipe(
        distinctUntilChanged(
          (prev: ElementSizes, curr: ElementSizes) =>
            prev.height === curr.height && prev.width === curr.width
        )
      )
      .subscribe(() => {
        const { x, y } = this.getTransformValues(this.element.style.transform);
        currentX = x;
        currentY = y;

        if (
          this.element.offsetWidth != window.innerWidth ||
          this.element.offsetHeight != window.innerHeight - this.heightDrecrease
        )
          this.isOnFullScreen = false;

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
          currentY = newY;
        }

        if (x + this.element.offsetWidth > window.innerWidth - GAP * 2) {
          const newX = window.innerWidth - this.element.offsetWidth;
          currentX = newX;
        }

        this.element.style.transform =
          "translate3d(" + currentX + "px, " + currentY + "px, 0)";
      });

    const windowResizeSub = windowResize$.subscribe(() => {
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
    });

    const config = { attributes: true, childList: true, subtree: true };

    new MutationObserver(() => {
      const width = this.elementRef.nativeElement.style.width;
      const height = this.elementRef.nativeElement.style.height;
      resizeSubject$.next({
        width: this.isSmallestThan(width, this.baseSizes.width)
          ? "200px"
          : width,
        height: this.isSmallestThan(height, this.baseSizes.height)
          ? "200px"
          : height,
      });
    }).observe(this.elementRef.nativeElement, config);

    this.subscriptions.push.apply(this.subscriptions, [
      dragStartSub,
      dragSub,
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
    this._worker.terminate();
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
    this.isOnFullScreen = true;
    this.element.style.transition = "all .5s ease";

    timer(100)
      .pipe(take(1))
      .subscribe(() => {
        this.element.style.transform =
          "translate3d(" + 0 + "px, " + 0 + "px, 0)";
        this.element.style.width = window.innerWidth + "px";
        this.element.style.height =
          window.innerHeight - this.heightDrecrease + "px";

        timer(1000)
          .pipe(take(1))
          .subscribe(() => {
            this.element.style.transition = "none";
          });
      });
  }

  setServiceWorker() {
    this._worker = new Worker(
      new URL("../drag-calculator.worker", import.meta.url)
    );
    this._worker.postMessage("Hello World!!");
    this._worker.onmessage = ({ data }) => {
      if (this.istanceofString(data)) console.log(data);
    };
  }

  istanceofString(data: unknown): data is string {
    return !!data["substring"];
  }
}
