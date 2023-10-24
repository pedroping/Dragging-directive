import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { FreeDraggingHandleDirective } from './shared/free-dragging-handle.directive';
import { FreeDraggingDirective } from './shared/free-dragging.directive';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule, SharedModule, FreeDraggingDirective, FreeDraggingHandleDirective
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

// ng g web-worker drag-calculator 