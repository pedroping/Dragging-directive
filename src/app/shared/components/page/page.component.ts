import { Component, Inject, Type } from "@angular/core";
import { testToken } from "../../directives/page-creator.directive";
import { IBaseScreenComponent, OpenedElement } from "../../models/models";
import { DefaultPageComponentComponent } from "../default-page-component/default-page-component.component";

@Component({
  selector: "page",
  templateUrl: "./page.component.html",
  styleUrls: ["./page.component.scss"],
})
export class PageComponent implements IBaseScreenComponent {
  baseSizes = {
    width: 500,
    height: 200,
  };
  customX = 0;
  customY = 0;
  startOnMiddle = false;
  elementReference: OpenedElement;
  pageContent: Type<unknown> = DefaultPageComponentComponent;

  constructor(@Inject(testToken) private teste: string) {
    console.log(this.teste);
  }
}
