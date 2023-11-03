import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Input,
  OnDestroy,
} from "@angular/core";
import { Observable, Subject, Subscription, from, fromEvent, timer } from "rxjs";
import { distinctUntilChanged, filter, take, takeUntil } from "rxjs/operators";
import { FreeDraggingHandleDirective } from "./free-dragging-handle.directive";
import { LastZIndexService } from '../services/last-z-index.service'
import { ElementSizesNum, ElementSizes, GAP } from "../models/models";
import { FreeDraggingSetFullScreenDirective } from "./free-dragging-set-full-screen.directive";
@Directive({
  selector: "[appFreeDragging]",
  exportAs: "appFreeDragging",
  standalone: true,
})
export class FreeDraggingDirective implements AfterViewInit, OnDestroy {
  private readonly DEFAULT_DRAGGING_BOUNDARY_QUERY = "html";
  private element: HTMLElement;
  private subscriptions: Subscription[] = [];

  @ContentChild(FreeDraggingHandleDirective, { read: ElementRef }) handle: ElementRef;
  @ContentChild(FreeDraggingSetFullScreenDirective, { read: ElementRef }) setFullScreen: ElementRef

  @Input() boundaryQuery = this.DEFAULT_DRAGGING_BOUNDARY_QUERY;
  @Input() heightDrecrease = 0;
  @Input() widthDrecrease = 0;
  @Input() baseSizes: ElementSizesNum;
  @Input() startOnMiddle = false;
  @Input() customX = 0;
  @Input() customY = 0;
  @Input() id: string | number;

  handleElement: HTMLElement;
  draggingBoundaryElement: HTMLElement | HTMLBodyElement;
  stopTaking$ = new Subject<void>();
  isOnFullScreen = false;
  isSettingFullScreen = false;
  initialX: number;
  initialY: number;
  currentX = 0;
  currentY = 0;
  dragSub: Subscription;

  currentWidth: string | number = "auto";
  currentHeight: string | number = "auto";

  observeConfig = { attributes: true, childList: true, subtree: true };

  constructor(
    private elementRef: ElementRef,
    private lastZIndexService: LastZIndexService
  ) { }

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
    const fullScreenClick$ = fromEvent(this.setFullScreen?.nativeElement, 'click');
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
    const fullScreenClick = fullScreenClick$.subscribe(this.setFullScreenCallBack());
    new MutationObserver(this.mutationObserveCallBack(resizeSubject$)).observe(
      this.elementRef.nativeElement,
      this.observeConfig
    );

    this.subscriptions = [
      dragStartSub,
      this.dragSub,
      dragEndSub,
      resizeSub,
      clickSub,
      windowResizeSub,
      fullScreenClick
    ];
  }

  setCustomStart() {
    const x = this.customX || this.currentX;
    const y = this.customY || this.currentY;
    this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  setToMiddle() {
    const x = window.innerWidth / 2 - this.baseSizes.width / 2;
    const y = window.innerHeight / 2 - this.baseSizes.height / 2;
    this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
      const maxBoundX =
        this.draggingBoundaryElement.offsetWidth - this.element.offsetWidth;
      const maxBoundY =
        this.draggingBoundaryElement.offsetHeight -
        this.heightDrecrease -
        this.element.offsetHeight;

      this.stopTaking$.next();
      this.initialX = event.clientX - this.currentX;
      this.initialY = event.clientY - this.currentY;

      this.element.classList.add("free-dragging");
      this.element.style.zIndex = this.lastZIndexService.createNewZIndex();

      this.dragSub = drag$.subscribe((event: MouseEvent) => {
        this.stopTaking$.next();
        event.preventDefault();

        const x = event.clientX - this.initialX;
        const y = event.clientY - this.initialY;

        this.currentX = Math.max(0, Math.min(x, maxBoundX));
        this.currentY = Math.max(0, Math.min(y, maxBoundY));

        this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
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
      this.setFullSize()
    }
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

      const { x, y } = this.getTransformValues(this.element.style.transform);
      this.currentX = x;
      this.currentY = y;

      if (
        y + this.element.offsetHeight >
        window.innerHeight - this.heightDrecrease - GAP
      ) {
        const winHeight = window.innerHeight -
          this.heightDrecrease
        const newY =
          winHeight -
          GAP -
          this.element.offsetHeight +
          GAP;
        this.currentY = newY;
      }

      if (x + this.element.offsetWidth > window.innerWidth - GAP * 2) {
        const newX = window.innerWidth - this.element.offsetWidth;
        this.currentX = newX;
      }

      this.element.style.zIndex = this.lastZIndexService.createNewZIndex();
      this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
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

      const width = this.element.style.width ? +this.element.style.width.replace('px', '') : this.baseSizes.width;
      const height = this.element.style.height ? +this.element.style.height.replace('px', '') : this.baseSizes.height;
      const maxX = window.innerWidth - width;
      const maxY = window.innerHeight - this.heightDrecrease - height;

      this.currentX = Math.max(0, Math.min(this.currentX, maxX));
      this.currentY = Math.max(0, Math.min(this.currentY, maxY));
      this.element.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
    };
  }

  mutationObserveCallBack(
    resizeSubject$: Subject<{
      height: string;
      width: string;
    }>
  ) {
    return () => {
      const width = +this.elementRef.nativeElement.style.width.replace('px', '');
      const height = +this.elementRef.nativeElement.style.height.replace('px', '');

      resizeSubject$.next({
        width: Math.max(width, this.baseSizes.height) + 'px',
        height: Math.max(height, this.baseSizes.height) + 'px',
      });
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }
}