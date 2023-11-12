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
  ngAfterViewInit(): void {
    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 0,
      args: {
        startOnMiddle: true,
        baseSizes: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2 - 30,
        },
      },
    });

    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 1,
      args: {
        baseSizes: {
          width: window.innerWidth / 2,
          height: window.innerHeight / 2 - 30,
        },
      },
    });

    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 2,
      args: { customX: 890, customY: 750 },
    });
  }
}
