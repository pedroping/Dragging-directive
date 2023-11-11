import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
} from "@angular/core";
import { OpenedElement } from "../models/models";
import { ElementsService } from "../services/elements.service";
import { ExampleBoxComponent } from "../components/example-box/example-box.component";

@Directive({
  selector: "[appPageCreator]",
  exportAs: "appPageCreator",
  standalone: true,
})
export class PageCreatorDirective implements OnInit {
  private readonly elementRef = inject(ElementRef);
  private readonly elementsService = inject(ElementsService);
  private readonly vcr = inject(ViewContainerRef);

  @Input("appPageCreatorId") id: number | string;

  ngOnInit(): void {
    this.vcr.clear();
    this.setSubscriptions();
  }

  setSubscriptions() {
    this.elementsService.createElement$.subscribe((item) => {
      const compRef = this.vcr.createComponent(item.component, {
        index: item.id,
      });
      const element = this.elementsService.pushElement(
        compRef.location.nativeElement.firstChild,
        item.id
      );
      compRef.instance.elementReference = element;
    });

    this.elementsService.destroyElement$.subscribe((id) => {
      const openedElements = this.elementsService.openedElements;
      const index = openedElements.findIndex((item) => item.id == id);
      openedElements.splice(index, 1);
      this.vcr.remove(id);
    });
  }
}
