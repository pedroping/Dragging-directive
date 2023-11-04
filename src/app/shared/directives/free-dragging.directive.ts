import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
} from "@angular/core";
import { Observable, Subject, Subscription, fromEvent, timer } from "rxjs";
import { distinctUntilChanged, filter, take, takeUntil } from "rxjs/operators";
import {
  DEFAULT_DRAGGING_BOUNDARY_QUERY,
  ElementSizes,
  ElementSizesNum,
  GAP,
  OBSERVE_CONFIG,
} from "../models/models";
import { ElementsService } from "../services/elements.service";
import { LastZIndexService } from "../services/last-z-index.service";
import { FreeDraggingHandleDirective } from "./free-dragging-handle.directive";
import { FreeDraggingSetFullScreenDirective } from "./free-dragging-set-full-screen.directive";
import { DomElementAdpter } from "../adpters/dom-element-adpter";
@Directive({
  selector: "[appFreeDragging]",
  exportAs: "appFreeDragging",
  standalone: true,
})
export class FreeDraggingDirective implements AfterViewInit, OnDestroy {
  @ContentChild(FreeDraggingHandleDirective, { read: ElementRef })
  handle: ElementRef;
  @ContentChild(FreeDraggingSetFullScreenDirective, { read: ElementRef })
  setFullScreen: ElementRef;

  @Input() boundaryQuery = DEFAULT_DRAGGING_BOUNDARY_QUERY;
  @Input() heightDrecrease = 0;
  @Input() widthDrecrease = 0;
  @Input() baseSizes: ElementSizesNum;
  @Input() startOnMiddle = false;
  @Input() customX = 0;
  @Input() customY = 0;
  @Input() id: string | number;

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

  currentWidth: string | number = "auto";
  currentHeight: string | number = "auto";

  constructor(
    private elementRef: ElementRef,
    private lastZIndexService: LastZIndexService,
    private elementsService: ElementsService
  ) {}

  ngAfterViewInit(): void {
    this.draggingBoundaryElement = document.querySelector(this.boundaryQuery);

    if (!this.draggingBoundaryElement)
      throw new Error(
        "Couldn't find any element with query: " + this.boundaryQuery
      );

    this.startElementDomain();
  }

  startElementDomain() {
    this.element = this.elementRef.nativeElement as HTMLElement;
    this.handleElement = this.handle?.nativeElement || this.element;
    this.initDrag();
    this.setCustomStart();
    this.setElement();
    if (this.startOnMiddle) this.setToMiddle();
  }

  setElement() {
    const element = this.elementRef;
    const id = this.id;
    this.elementsService.pushElement(element, id);
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

    const dragStartSub = dragStart$.subscribe(this.dragStartCallBack(drag$));
    const dragEndSub = dragEnd$.subscribe(this.dragEndCallBack());
    const windowResizeSub = windowResize$.subscribe(this.winResizeCallBack());
    const resizeSub = resize$.subscribe(this.resizeCallBack());
    const clickSub = click$.subscribe(this.clickCallBack());
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
    ];
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
        this.element.style.width.replace("px", "") || this.baseSizes.width;
      this.currentHeight =
        this.element.style.height.replace("px", "") || this.baseSizes.height;
    }

    this.isSettingFullScreen = true;
    const transform = setFullScreen
      ? `translate3d(0px, 0px, 0)`
      : `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
    const width = setFullScreen ? window.innerWidth : this.currentWidth;
    const height = setFullScreen
      ? window.innerHeight - this.heightDrecrease
      : this.currentHeight;

    this.element.style.transition = "all .2s ease";
    timer(100)
      .pipe(take(1))
      .subscribe(() => {
        this.element.style.width = width + "px";
        this.element.style.height = height + "px";
        this.element.style.transform = transform;

        timer(100)
          .pipe(take(1))
          .subscribe(() => {
            this.isOnFullScreen = setFullScreen;
            this.element.style.transition = "none";

            timer(100)
              .pipe(take(1))
              .subscribe(() => {
                this.isSettingFullScreen = false;
                this.isOnFullScreen = setFullScreen;
              });
          });
      });
  }

  dragStartCallBack(drag$: Observable<MouseEvent>) {
    return (event: MouseEvent) => {
      this.stopTaking$.next();
      const maxBoundX =
        this.draggingBoundaryElement.offsetWidth - this.element.offsetWidth;
      const maxBoundY =
        this.draggingBoundaryElement.offsetHeight -
        this.heightDrecrease -
        this.element.offsetHeight +
        GAP;

      this.initialX = event.clientX - this.currentX;
      this.initialY = event.clientY - this.currentY;

      const newZIndex = this.lastZIndexService.createNewZIndex();
      this.element.classList.add("free-dragging");

      DomElementAdpter.setZIndex(this.element, newZIndex);

      this.dragSub = drag$.subscribe((event: MouseEvent) => {
        this.stopTaking$.next();
        event.preventDefault();

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
      this.element.style.zIndex = this.lastZIndexService.createNewZIndex();
    };
  }

  setFullScreenCallBack() {
    return () => {
      this.setFullSize();
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

      const { x, y } = DomElementAdpter.getTransformValues(
        this.element.style.transform
      );
      this.currentX = x;
      this.currentY = y;

      if (
        y + this.element.offsetHeight >
        window.innerHeight - this.heightDrecrease - GAP
      ) {
        const winHeight = window.innerHeight - this.heightDrecrease;
        const newY = winHeight - this.element.offsetHeight;

        this.currentY = newY;
      }

      if (x + this.element.offsetWidth > window.innerWidth - GAP * 2) {
        const newX = window.innerWidth - this.element.offsetWidth;
        this.currentX = newX;
      }

      const newZIndex = this.lastZIndexService.createNewZIndex();
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
        this.element.offsetHeight >
        window.innerHeight - this.heightDrecrease
      ) {
        this.element.style.height =
          window.innerHeight - this.heightDrecrease + "px";
      }

      const width = this.element.style.width
        ? +this.element.style.width.replace("px", "")
        : this.baseSizes.width;
      const height = this.element.style.height
        ? +this.element.style.height.replace("px", "")
        : this.baseSizes.height;
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - this.heightDrecrease - height;

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
      const width = +this.elementRef.nativeElement.style.width.replace(
        "px",
        ""
      );
      const height = +this.elementRef.nativeElement.style.height.replace(
        "px",
        ""
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
