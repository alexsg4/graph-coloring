import { Component, OnInit } from '@angular/core';
import { StrategySelectService } from './strategy-select.service';

@Component({
  selector: 'app-coloring-controls',
  templateUrl: './coloring-controls.component.html',
  styleUrls: ['./coloring-controls.component.scss']
})
export class ColoringControlsComponent implements OnInit {
  selected: string;

  constructor(private strategySelect: StrategySelectService) {
  }

  ngOnInit() {
    this.selected = 'none';
    // this.strategySelect.currentMessage.subscribe(message => console.log(message));
  }

  sendColoring(reset = false) {
    if (reset) {
      this.selected = 'reset';
    }
    console.log('Sending coloring message with strategy: ' + this.selected);
    this.strategySelect.changeMessage(this.selected);
  }
}
