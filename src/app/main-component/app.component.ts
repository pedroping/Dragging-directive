import { AfterViewInit, Component, inject } from "@angular/core";
import { ElementsService } from "../shared/services/elements.service";
import { ExampleBoxComponent } from "../shared/components/example-box/example-box.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements AfterViewInit {
  private readonly elementsService = inject(ElementsService);
  title = "angular-free-dragging";

  baseSizes = {
    width: 500,
    height: 200,
  };

  ngAfterViewInit(): void {
    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 0,
    });
    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 1,
    });
  }
}
