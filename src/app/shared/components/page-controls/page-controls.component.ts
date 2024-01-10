import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Observable, map } from "rxjs";
import { OpenedElement } from "../../models/models";
import { ElementsService } from "../../services/elements.service";

@Component({
  selector: "app-page-controls",
  templateUrl: "./page-controls.component.html",
  styleUrls: ["./page-controls.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class PageControlsComponent implements OnInit {
  openedElements$: Observable<OpenedElement[]>;

  constructor(private readonly elementsService: ElementsService) {}

  ngOnInit() {
    this.openedElements$ = this.elementsService.openedElements$
      .asObservable()
      .pipe(
        map((elements) => {
          return elements.sort((a, b) => (a.id < b.id ? -1 : 1));
        })
      );
  }

  handleElementClick(id: string | number) {
    this.elementsService.handleElementClick(id);
  }
}
