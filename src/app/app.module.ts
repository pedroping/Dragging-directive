import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './main-component/app.component';
import { FreeDraggingHandleDirective } from './shared/directives/free-dragging-handle.directive';
import { SharedModule } from './shared/shared.module';
import { FreeDraggingDirective } from './shared/directives/free-dragging.directive';
import { FreeDraggingSetFullScreenDirective } from './shared/directives/free-dragging-set-full-screen.directive';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    SharedModule,
    FreeDraggingDirective,
    FreeDraggingHandleDirective,
    FreeDraggingSetFullScreenDirective
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

// ng g web-worker drag-calculator 