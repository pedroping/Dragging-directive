import { Component } from "@angular/core";
import { IBaseScreenComponent, OpenedElement } from "../../models/models";

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
  heightDrecrease = 60;

  elementReference: OpenedElement;
}
