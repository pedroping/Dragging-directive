import {
  AfterViewInit,
  Directive,
  InjectionToken,
  Injector,
  Input,
  ViewContainerRef,
} from "@angular/core";
import { CreateComponent } from "../models/models";
import { ElementsService } from "../services/elements.service";
import { DomElementAdpter } from "../adpters/dom-element-adpter";
import { LastZIndexService } from "../services/last-z-index.service";

export const testToken = new InjectionToken<string>("testToken");

@Directive({
  selector: "[appPageCreator]",
  exportAs: "appPageCreator",
  standalone: true,
})
export class PageCreatorDirective implements AfterViewInit {
  @Input("appPageCreatorId") id: number | string;

  constructor(
    private readonly injector: Injector,
    private readonly vcr: ViewContainerRef,
    private readonly elementsService: ElementsService,
    private readonly lastZIndexService: LastZIndexService
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
    const injector = Injector.create({
      providers: [{ provide: testToken, useValue: "teste1" }],
      parent: this.injector,
    });
    const compRef = this.vcr.createComponent(item.component, {
      index: item.id,
      injector: injector,
    });
    const elementRef = compRef.location.nativeElement.firstChild;
    const element = this.elementsService.pushElement(elementRef, item.id);
    compRef.instance.elementReference = element;

    DomElementAdpter.setZIndex(
      elementRef,
      this.lastZIndexService.createNewZIndex(element.id)
    );

    if (!item.args) return;

    const args = item.args;
    const keys = Object.keys(args);

    keys.forEach((key) => {
      if (compRef.instance[key] == undefined)
        throw new Error(`Key ${key} dosen't exist on your component`);

      compRef.instance[key] = args[key];
    });
  };

  destroyElementCallBack = (id: number) => {
    const elements = this.elementsService.openedElements;
    const index = elements.findIndex((item) => item.id == id);
    const filteredOpenedElements = elements.filter((item) => item.id != id);
    this.elementsService.openedElements$.next(filteredOpenedElements);
    this.vcr.remove(index);
  };
}
