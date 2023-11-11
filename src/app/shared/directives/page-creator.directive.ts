import { Directive, ElementRef, Input, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { OpenedElement } from '../models/models';
import { ElementsService } from '../services/elements.service';

@Directive({
  selector: '[appPageCreator]',
  exportAs: 'appPageCreator',
  standalone: true
})
export class PageCreatorDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly elementsService = inject(ElementsService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef);

  @Input('appPageCreatorId') id: number | string;
  @Input('appPageCreatorStartClosed') startClosed: boolean;

  elementReference: OpenedElement;

  ngOnInit(): void {
    this.vcr.clear();
    this.setElement();
    this.vcr.createEmbeddedView(this.templateRef, { $implicit: this.elementReference })
    if (this.startClosed) this.vcr.clear();
  }

  setElement() {
    const element = this.elementRef;
    const id = this.id;
    this.elementReference = this.elementsService.pushElement(element, id, this.startClosed);
    this.setSubscriptions();
  }

  setSubscriptions() {
    this.elementReference.hideElement$.subscribe(() => {
      this.elementReference.closed = true;
      this.vcr.clear();
    })
  }

}
