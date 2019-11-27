import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GraphViewComponent } from './graph-view/graph-view.component';
import { ColoringControlsComponent } from './coloring-controls/coloring-controls.component';

import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';

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
    MatFormFieldModule
  ],
  exports: [
    GraphViewComponent,
    ColoringControlsComponent
  ]
})
export class GraphModule { }
