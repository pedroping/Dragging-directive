import { Directive, Input, Type, ViewContainerRef } from "@angular/core";

@Directive({
  selector: "[pageContentCreator]",
})
export class PageContentCreatorDirective {
  @Input("pageContentCreator") set pageContent(component: Type<unknown>) {
    this.vcr.clear();
    if (!component) return;
    this.vcr.createComponent(component);
  }
  constructor(private readonly vcr: ViewContainerRef) {}
}
