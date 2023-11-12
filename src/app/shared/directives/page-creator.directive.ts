import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject
} from "@angular/core";
import { CreateComponent } from "../models/models";
import { ElementsService } from "../services/elements.service";

@Directive({
  selector: "[appPageCreator]",
  exportAs: "appPageCreator",
  standalone: true,
})
export class PageCreatorDirective implements OnInit {
  private readonly elementsService = inject(ElementsService);
  private readonly vcr = inject(ViewContainerRef);
  private readonly templateRef = inject(TemplateRef);

  @Input("appPageCreatorId") id: number | string;

  ngOnInit(): void {
    this.createBoundary();
    this.setSubscriptions();
  }

  createBoundary() {
    this.vcr.createEmbeddedView(this.templateRef);

    const element = this.templateRef.elementRef.nativeElement.previousSibling;
    element.id = "main-boundary";
    element.classList.add('main-boundary')
  }

  setSubscriptions() {
    this.elementsService.createElement$.subscribe(
      this.createElementCallBack.bind(this)
    );

    this.elementsService.destroyElement$.subscribe(
      this.destroyElementCallBack.bind(this)
    );
  }

  createElementCallBack = (item: CreateComponent) => {
    const compRef = this.vcr.createComponent(item.component, {
      index: item.id,
    });
    const element = this.elementsService.pushElement(
      compRef.location.nativeElement.firstChild,
      item.id
    );
    compRef.instance.elementReference = element;

    if (item.args) {
      const args = item.args;
      const keys = Object.keys(args);

      keys.forEach((key) => {
        if (compRef.instance[key] == undefined)
          throw new Error(`Key ${key} dosen't exist on your component`);

        compRef.instance[key] = args[key];
      });
    }
  };

  destroyElementCallBack = (id: number) => {
    const openedElements = this.elementsService.openedElements;
    const index = openedElements.findIndex((item) => item.id == id);
    openedElements.splice(index, 1);
    this.vcr.remove(id);
  };
}
