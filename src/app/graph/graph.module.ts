import { NgModule, FactoryProvider } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GraphViewComponent } from './graph-view/graph-view.component';
import { ColoringControlsComponent } from './coloring-controls/coloring-controls.component';
import { ColoringService } from './coloring.service';

import { StrategySelectService } from './coloring-controls/strategy-select.service';

import { ColoringStrategy } from './coloring-strategy/coloring-strategy';
import { SimpleGreedyStrategy } from './coloring-strategy/greedy-strategy';
import { DSaturStrategy } from './coloring-strategy/dsatur-strategy';
import { TabuColStrategy } from './coloring-strategy/tabu-col-strategy';
import { HEAStrategy } from './coloring-strategy/hea-strategy';

import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export function coloringServiceFactory(...strategies: Array<ColoringStrategy>): ColoringService {
  return new ColoringService(strategies);
}

const COLORING_PROVIDER: FactoryProvider = {
  provide: ColoringService,
  useFactory: coloringServiceFactory,
  deps: [
    SimpleGreedyStrategy,
    DSaturStrategy,
    TabuColStrategy,
    HEAStrategy
  ]
};

@NgModule({
  declarations: [
    GraphViewComponent,
    ColoringControlsComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule
  ],
  exports: [
    GraphViewComponent,
    ColoringControlsComponent
  ],
  providers: [
    StrategySelectService,
    COLORING_PROVIDER,
    SimpleGreedyStrategy,
    DSaturStrategy,
    TabuColStrategy,
    HEAStrategy
  ]
})
export class GraphModule { }
