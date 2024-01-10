import { AfterViewInit, Component } from "@angular/core";
import {
  CreateComponent,
  PAGE00,
  PAGE01,
  PAGE02,
} from "../shared/models/models";
import { ElementsService } from "../shared/services/elements.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements AfterViewInit {
  title = "angular-free-dragging";

  page00 = PAGE00;
  page01 = PAGE01;
  page02 = PAGE02;

  constructor(private readonly elementsService: ElementsService) {}

  ngAfterViewInit(): void {
    this.elementsService.createElement$.next(this.page00);
    this.elementsService.createElement$.next(this.page01);
    this.elementsService.createElement$.next(this.page02);
  }

  handleElementClick(element: CreateComponent) {
    this.elementsService.handlePageUrl(element);
  }
}
