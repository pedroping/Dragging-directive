import { AfterViewInit, Component } from "@angular/core";
import { ExampleBoxComponent } from "../shared/components/example-box/example-box.component";
import { ElementsService } from "../shared/services/elements.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements AfterViewInit {
  title = "angular-free-dragging";

  constructor(private readonly elementsService: ElementsService) {}

  ngAfterViewInit(): void {
    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 0,
      args: {
        startOnMiddle: true,
        baseSizes: {
          width: window.innerWidth / 2 - 1,
          height: window.innerHeight / 2 - 30,
        },
      },
    });

    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 1,
      args: {
        baseSizes: {
          width: window.innerWidth / 2 - 1,
          height: window.innerHeight / 2 - 30,
        },
        customY: window.innerHeight * 0.05,
        customX: window.innerWidth * 0.06,
      },
    });

    this.elementsService.createElement$.next({
      component: ExampleBoxComponent,
      id: 2,
      args: { customX: 890, customY: 750 },
    });
  }
}
