import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppComponent } from "./main-component/app.component";
import { PageControlsComponent } from "./shared/components/page-controls/page-controls.component";
import { PageComponent } from "./shared/components/page/page.component";
import { FreeDraggingDirective } from "./shared/directives/free-dragging.directive";
import { PageCreatorDirective } from "./shared/directives/page-creator.directive";
import { FreeDraggingCloseDirective } from "./shared/directives/selectors/free-dragging-close.directive";
import { FreeDraggingHandleDirective } from "./shared/directives/selectors/free-dragging-handle.directive";
import { FreeDraggingMinimizeDirective } from "./shared/directives/selectors/free-dragging-minimize.directive";
import { FreeDraggingSetFullScreenDirective } from "./shared/directives/selectors/free-dragging-set-full-screen.directive";
import { PageContentCreatorDirective } from "./shared/directives/page-content-creator.directive";
import { PageContentComponent } from "./shared/components/page-content/page-content.component";
import { DefaultPageComponentComponent } from "./shared/components/default-page-component/default-page-component.component";

@NgModule({
  declarations: [
    AppComponent,
    PageComponent,
    PageContentCreatorDirective,
    PageContentComponent,
    DefaultPageComponentComponent,
  ],
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
export class AppModule {}
