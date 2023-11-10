import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./main-component/app.component";
import { PageControlsComponent } from "./shared/components/page-controls/page-controls.component";
import { FreeDraggingHandleDirective } from "./shared/directives/selectors/free-dragging-handle.directive";
import { FreeDraggingSetFullScreenDirective } from "./shared/directives/selectors/free-dragging-set-full-screen.directive";
import { FreeDraggingDirective } from "./shared/directives/free-dragging.directive";
import { FreeDraggingMinimizeDirective } from "./shared/directives/selectors/free-dragging-minimize.directive";
import { PageCreatorDirective } from "./shared/directives/page-creator.directive";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    FreeDraggingDirective,
    FreeDraggingHandleDirective,
    FreeDraggingMinimizeDirective,
    FreeDraggingSetFullScreenDirective,
    PageCreatorDirective,
    PageControlsComponent,
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
