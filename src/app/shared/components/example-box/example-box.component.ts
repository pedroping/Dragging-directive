import { Component, Inject } from "@angular/core";
import { IBaseScreenComponent, OpenedElement } from "../../models/models";
import { testToken } from "../../directives/page-creator.directive";

@Component({
  selector: "app-example-box",
  templateUrl: "./example-box.component.html",
  styleUrls: ["./example-box.component.scss"],
})
export class ExampleBoxComponent implements IBaseScreenComponent {
  baseSizes = {
    width: 500,
    height: 200,
  };
  customX = 0;
  customY = 0;
  startOnMiddle = false;
  elementReference: OpenedElement;

  constructor(@Inject(testToken) private teste: string) {
    console.log(this.teste);
  }
}
