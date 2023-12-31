import {
  AfterViewInit,
  Directive,
  Input,
  ViewContainerRef,
} from "@angular/core";
import { CreateComponent } from "../models/models";
import { ElementsService } from "../services/elements.service";

@Directive({
  selector: "[appPageCreator]",
  exportAs: "appPageCreator",
  standalone: true,
})
export class PageCreatorDirective implements AfterViewInit {
  @Input("appPageCreatorId") id: number | string;

  constructor(
    private readonly elementsService: ElementsService,
    private readonly vcr: ViewContainerRef
  ) {}

  ngAfterViewInit(): void {
    this.setSubscriptions();
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
    const elements = this.elementsService.openedElements;
    const index = elements.findIndex((item) => item.id == id);
    const filteredOpenedElements = elements.filter((item) => item.id != id);
    this.elementsService.openedElements$.next(filteredOpenedElements);
    this.vcr.remove(index);
  };
}
