import { Directive, HostListener, OnDestroy, OnInit } from "@angular/core";
import { Subscription, fromEvent, merge } from "rxjs";

@Directive({
  selector: "[appFreeDraggingHandle]",
  standalone: true,
})
export class FreeDraggingHandleDirective implements OnInit, OnDestroy {
  private _body = document.querySelector("body");
  private mouseUpSub: Subscription;

  @HostListener("mousedown") onMouseDown() {
    this._body.style.cursor = "grabbing";
  }

  ngOnInit(): void {
    this.mouseUpSub = merge(
      fromEvent(this._body, "mouseup"),
      fromEvent(this._body, "mouseleave")
    ).subscribe(() => {
      this._body.style.cursor = "default";
    });
  }

  ngOnDestroy(): void {
    this.mouseUpSub?.unsubscribe();
  }
}
