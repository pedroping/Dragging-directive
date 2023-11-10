import { Directive, HostListener } from "@angular/core";

@Directive({
  selector: "[appFreeDraggingHandle]",
  standalone: true
})
export class FreeDraggingHandleDirective {

  private _body = document.querySelector('body')

  @HostListener('mousedown') private onMouseDown() {
    this._body.style.cursor = 'grabbing';
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  private onMouseUp() {
    this._body.style.cursor = 'default';
  }
}
