import { Component } from "@angular/core";

@Component({
  selector: "app-root",
  template: `
    <div class="boundary">
      <div
        class="example-box"
        appFreeDragging
        [heightDrecrease]="50"
        [baseSizes]="baseSizes"
        #function="appFreeDragging"
      >
        I can only be dragged using the handle

        <div class="example-handle" appFreeDraggingHandle>
          <svg width="24px" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"
            ></path>
            <path d="M0 0h24v24H0z" fill="none"></path>
          </svg>
        </div>
        <svg
          width="24px"
          fill="currentColor"
          viewBox="0 0 24 24"
          (click)="function.setFullSize()"
        >
          <path
            d="M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z"
          ></path>
          <path d="M0 0h24v24H0z" fill="none"></path>
        </svg>
      </div>
    </div>
  `,
  styles: [
    `
      .example-box {
        width: 500px;
        height: 200px;
        min-width: 200px;
        min-height: 200px;
        resize: both;
        overflow: auto;
        padding: 10px;
        box-sizing: border-box;
        border: solid 1px #ccc;
        color: rgba(0, 0, 0, 0.87);
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        background: #fff;
        border-radius: 4px;
        position: relative;
        z-index: 1;
        max-width: 100%;
        max-height: calc(100vh - 50px);
        transition: box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
        box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
          0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
        background-color: whitesmoke;
      }

      .example-box.free-dragging {
        box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
          0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);
      }

      .example-handle {
        position: absolute;
        top: 10px;
        right: 10px;
        color: #ccc;
        cursor: move;
        width: 24px;
        height: 24px;
      }
    `,
  ],
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
      new URL("./drag-calculator.worker", import.meta.url)
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
