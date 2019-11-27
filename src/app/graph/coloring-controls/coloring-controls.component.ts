import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-coloring-controls',
  templateUrl: './coloring-controls.component.html',
  styleUrls: ['./coloring-controls.component.scss']
})
export class ColoringControlsComponent implements OnInit {
  private selected: string;

  ngOnInit() {
    this.selected = 'None';
  }

}
