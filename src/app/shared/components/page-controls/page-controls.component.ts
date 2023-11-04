import { Component, OnInit } from "@angular/core";
import { ElementsService } from "../../services/elements.service";
import { BehaviorSubject } from "rxjs";
import { OpenedElement } from "../../models/models";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-page-controls",
  templateUrl: "./page-controls.component.html",
  styleUrls: ["./page-controls.component.scss"],
  standalone: true,
  imports: [CommonModule],
})
export class PageControlsComponent implements OnInit {
  openedElements$: BehaviorSubject<OpenedElement[]>;

  constructor(private readonly elementsService: ElementsService) {}

  ngOnInit() {
    this.openedElements$ = this.elementsService.openedElements$;
  }

  handleElementClick(id: string | number) {
    this.elementsService.handleElementClick(id);
  }
}
