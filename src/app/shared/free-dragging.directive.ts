import { DOCUMENT } from "@angular/common";
import {
  AfterViewInit,
  ContentChild,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
} from "@angular/core";
import { fromEvent, Subject, Subscription, timer } from "rxjs";
import { distinctUntilChanged, takeUntil } from "rxjs/operators";
import { FreeDraggingHandleDirective } from "./free-dragging-handle.directive";

@Directive({
  selector: "[appFreeDragging]",
})
export class FreeDraggingDirective implements AfterViewInit, OnDestroy {
  private element: HTMLElement;

  private subscriptions: Subscription[] = [];

  @ContentChild(FreeDraggingHandleDirective)
  handle: FreeDraggingHandleDirective;

  handleElement: HTMLElement;

  private readonly DEFAULT_DRAGGING_BOUNDARY_QUERY = "html";
  @Input() boundaryQuery = this.DEFAULT_DRAGGING_BOUNDARY_QUERY;
  draggingBoundaryElement: HTMLElement | HTMLBodyElement;

  stopTaking$ = new Subject<void>()

  constructor(
    private elementRef: ElementRef,
    @Inject(DOCUMENT) private document: any
  ) { }

  ngAfterViewInit(): void {
    this.draggingBoundaryElement = (this.document as Document).querySelector(
      this.boundaryQuery
    );
    if (!this.draggingBoundaryElement) {
      throw new Error(
        "Couldn't find any element with query: " + this.boundaryQuery
      );
    } else {
      this.element = this.elementRef.nativeElement as HTMLElement;
      this.handleElement =
        this.handle?.elementRef?.nativeElement || this.element;
      this.initDrag();
    }
  }

  initDrag(): void {
    const dragStart$ = fromEvent<MouseEvent>(this.handleElement, "mousedown");
    const dragEnd$ = fromEvent<MouseEvent>(this.document, "mouseup");
    const drag$ = fromEvent<MouseEvent>(this.document, "mousemove").pipe(
      takeUntil(dragEnd$)
    );

    const resizeSubject$ = new Subject<{ height: string, width: string }>()
    const resize$ = resizeSubject$.asObservable().pipe(distinctUntilChanged((prev, curr) => prev === curr))

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
        this.draggingBoundaryElement.offsetHeight - 60 -
        this.element.offsetHeight;

      this.stopTaking$.next()
      initialX = event.clientX - currentX;
      initialY = event.clientY - currentY;
      this.element.classList.add("free-dragging");

      dragSub = drag$.subscribe((event: MouseEvent) => {
        this.stopTaking$.next()
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
      this.stopTaking$.next()
      this.element.classList.remove("free-dragging");
      if (dragSub) {
        dragSub.unsubscribe();
      }
    });

    const resizeSub = resize$.pipe(distinctUntilChanged((prev, curr) => prev.height === curr.height && prev.width === curr.width)).subscribe((values) => {

      const { x, y } = this.getTransformValues(this.element.style.transform)

      const yMultiplier = y > 0 ? 1 : -1;

      console.log('Y', y, 'Height', this.element.offsetHeight, 'yMultiplier', yMultiplier, this.element.style.transform);

      if (y + this.element.offsetHeight > window.innerHeight - 60) {
        const newY = ((window.innerHeight - 60) - this.element.offsetHeight) + 10
        currentX = x
        currentY = newY
        this.element.style.transform =
          "translate3d(" + currentX + "px, " + currentY + "px, 0)";
      }

    })

    const config = { attributes: true, childList: true, subtree: true };

    new MutationObserver((mutationList) => {
      const width = this.elementRef.nativeElement.style.width
      const height = this.elementRef.nativeElement.style.height
      resizeSubject$.next({
        width: this.isSmallestThan200(width) ? '200px' : width,
        height: this.isSmallestThan200(height) ? '200px' : height
      })
    }).observe(this.elementRef.nativeElement, config)

    this.subscriptions.push.apply(this.subscriptions, [
      dragStartSub,
      dragSub,
      dragEndSub,
      resizeSub
    ]);
  }

  isSmallestThan200(value: string) {
    const number = +value.replace('px', '')
    return number < 200
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  getTransformValues(transform: string) {
    if (!transform) return { x: -1, y: -1 }
    const splitedLabel = transform.split('(')[1].replace(')', '');
    const splitedValues = splitedLabel
      .replace(',', '')
      .split(' ')
      .map((value) => +value.replace(',', '').replace('px', ''));

    return { x: splitedValues[0], y: splitedValues[1] };
  }
}
