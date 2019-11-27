import { Component, OnInit } from '@angular/core';

declare const sigma: any;
const colors = new Array<number>();

@Component({
  selector: 'app-graph-view',
  templateUrl: './graph-view.component.html',
  styleUrls: ['./graph-view.component.scss']
})
export class GraphViewComponent implements OnInit {

  private sigmaInstance: any;
  private isColored: boolean;
  private graphContainerId = 'graph-container';

  private K_NODE_COL_DEFAULT = 0x0;

  constructor() {
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
      const colorStr = '#' + color.toString(16);
      if (color === this.K_NODE_COL_DEFAULT) {
        node.label = node.label.match('[0-9]').toString();
      } else {
        node.label += ' ' + colorStr;
      }
      node.color = colorStr;
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
}
