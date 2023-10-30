import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private _worker: Worker;
  title = "angular-free-dragging";

  baseSizes = {
    width: 500,
    height: 200,
  };

  ngOnInit(): void {
    this.setServiceWorker();
  }

  setServiceWorker() {
    this._worker = new Worker(
      new URL("../drag-calculator.worker", import.meta.url)
    );
    this._worker.postMessage("Hello World!!");
    this._worker.onmessage = ({ data }) => {
      if (this.istanceofString(data)) console.log(data);
    };
  }

  istanceofString(data: unknown): data is string {
    return !!data["substring"];
  }

  ngOnDestroy(): void {
    this._worker.terminate();
  }
}
