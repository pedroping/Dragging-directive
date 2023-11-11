import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./main-component/app.component";
import { PageControlsComponent } from "./shared/components/page-controls/page-controls.component";
import { FreeDraggingDirective } from "./shared/directives/free-dragging.directive";
import { PageCreatorDirective } from "./shared/directives/page-creator.directive";
import { FreeDraggingCloseDirective } from "./shared/directives/selectors/free-dragging-close.directive";
import { FreeDraggingHandleDirective } from "./shared/directives/selectors/free-dragging-handle.directive";
import { FreeDraggingMinimizeDirective } from "./shared/directives/selectors/free-dragging-minimize.directive";
import { FreeDraggingSetFullScreenDirective } from "./shared/directives/selectors/free-dragging-set-full-screen.directive";
import { ExampleBoxComponent } from "./shared/components/example-box/example-box.component";

@NgModule({
  declarations: [AppComponent, ExampleBoxComponent],
  imports: [
    BrowserModule,
    FreeDraggingDirective,
    FreeDraggingCloseDirective,
    FreeDraggingHandleDirective,
    FreeDraggingMinimizeDirective,
    FreeDraggingSetFullScreenDirective,
    PageCreatorDirective,
    PageControlsComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
