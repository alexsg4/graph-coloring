import { Component, OnInit } from '@angular/core';
import { StrategySelectService } from '../coloring-controls/strategy-select.service';
import { ColoringService } from '../coloring.service';
import { isNullOrUndefined } from 'util';

declare const sigma: any;

@Component({
  selector: 'app-graph-view',
  templateUrl: './graph-view.component.html',
  styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit {

  private sigmaInstance: any;
  private isColored: boolean;
  private graphContainerId = 'graph-container';
  private NODE_COLOR_DEFAULT = 0x0;

  constructor(private strategySelect: StrategySelectService, private coloringService: ColoringService) {
    this.isColored = false;
    this.addGraphMethods();
   }

  ngOnInit() {
    this.sigmaInstance = new sigma({
      container: document.getElementById(this.graphContainerId),
      settings: {
        nodeColor: 'default',
        edgeColor: 'default'
      }
    });
    const testGraphFilePath = 'assets/graphs/testGraph.gexf';
    this.loadGraphFromFile(testGraphFilePath);

    this.strategySelect.currentMessage.subscribe(
      message => {
         console.log('Received message ' + message + ' of type:', typeof(message));
         this.colorGraph(message);
      },
      error => console.warn(error)
    );
  }

  private addGraphMethods() {
    sigma.classes.graph.addMethod('hasEdgeBetween', function(nodeID1: string, nodeID2: string): boolean {
      if (!this.nodesIndex[nodeID1] || !this.nodesIndex[nodeID2]) {
        console.error('Checking adj. for non-existent nodes!');
        return false;
      }
      for (const edge of this.edgesArray) {
        if ((edge.source === nodeID1 && edge.target === nodeID2) ||
        (edge.source === nodeID2 && edge.target === nodeID1)) {
          return true;
        }
      }
      return false;
    });

    sigma.classes.graph.addMethod('colorNode', function(nodeID: string, color: number): void {
      if (!this.nodesIndex[nodeID]) {
        console.error('Color node: Error node does not exist!');
        return;
      }
      const node = this.nodesIndex[nodeID];
      const colorStr = ' #' + color.toString(16);
      node.label = node.label.match('[0-9]').toString() + colorStr;
      node.color = colorStr.trim();
    });

    sigma.classes.graph.addMethod('getNodesCount', function() {
      return this.nodesCount;
    });

    sigma.classes.graph.addMethod('getAdjList', function(nodeID: string): Array<string> {
      if (!this.nodesIndex[nodeID]) {
        console.error('Get neighbours: node does not exist!');
        return;
      }

      const neighbours = new Array<string>();
      for (const edge of this.edgesArray) {
        if (edge.target === nodeID) {
          neighbours.push(edge.source);
        } else if (edge.source === nodeID) {
          neighbours.push(edge.target);
        }
      }
      return neighbours;
    });
  }

  private loadGraphFromFile(filePath: string) {
    sigma.parsers.gexf(
      filePath,
      this.sigmaInstance,
      () => {
        this.sigmaInstance.refresh();
        this.sigmaInstance.refresh();
      }
    );
  }

  private colorGraph(strategy: string): void {
    console.log('Color graph!');
    if (this.isColored) {
      console.warn('Graph is already colored. ');
    }
    console.log('Received color request with strategy: ' + strategy);

    const reset = (strategy === 'reset');
    if (reset && !this.isColored) {
      console.warn('Graph is not colored. Will not reset.');
      return;
    }

    const solution = this.coloringService.applyColoringStrategy(this.sigmaInstance.graph, strategy);

    if (isNullOrUndefined(solution) || isNullOrUndefined(solution.coloring)) {
      console.warn('Solution or coloring does not exist!');
      return;
    }

    for (const node of this.sigmaInstance.graph.nodes()) {
      const nodeId = node.id;
      this.sigmaInstance.graph.colorNode(nodeId, solution.coloring.get(nodeId));
    }

    console.log('Graph was colored with \'' + strategy + '\' numConfChecks: ' + solution.numConfChecks.toString());

    this.sigmaInstance.refresh();
    this.isColored = !reset;
  }

}
