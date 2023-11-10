import { Directive, HostListener, OnDestroy, OnInit } from "@angular/core";
import { Subscription, from, fromEvent } from "rxjs";

@Directive({
  selector: "[appFreeDraggingHandle]",
  standalone: true
})
export class FreeDraggingHandleDirective implements OnInit, OnDestroy {

  private _body = document.querySelector('body');
  private mouseUpSub: Subscription;

  @HostListener('mousedown') private onMouseDown() {
    this._body.style.cursor = 'grabbing';
  }

  ngOnInit(): void {
    this.mouseUpSub = fromEvent(this._body, 'mouseup')
      .subscribe(() => {
        this._body.style.cursor = 'default';
      })
  }

  ngOnDestroy(): void {
    this.mouseUpSub?.unsubscribe();
  }
}
