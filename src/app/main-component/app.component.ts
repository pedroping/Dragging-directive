import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = "angular-free-dragging";

  baseSizes = {
    width: 500,
    height: 200,
  };
}
