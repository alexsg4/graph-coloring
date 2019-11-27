import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphViewComponent } from './graph-view/graph-view.component';

@NgModule({
  declarations: [
    GraphViewComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    GraphViewComponent
  ]
})
export class GraphModule { }
