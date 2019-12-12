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

  private rebuildGraphIfNecessary(graph: any) {
    if (isNullOrUndefined(graph)) {
      console.error('graph could not be loaded');
    }

    const nodesCount = graph.nodes().length;
    let needRebuild = false;
    for (const node of graph.nodes()) {
      const id = parseInt(node.id, 10);
      needRebuild = isNaN(id) || id >= nodesCount;
      if (needRebuild) {
        break;
      }
    }

    if (!needRebuild) {
      return;
    }

    console.warn('Graph will be rebuilt with sequential node ids!');
    let nodeId = 0;
    const newIds = new Map<string, number>();

    for (const node of graph.nodes()) {
      newIds.set(node.id, nodeId++);
    }

    // update edges with new node id
    const oldEdges = graph.edges();

    for (const oldNode of graph.nodes()) {
      graph.dropNode(oldNode.id);
      const newId = newIds.get(oldNode.id);
      graph.addNode(
        {
          color: oldNode.color,
          id: newId.toString(),
          label: (newId + 1).toString(),
          size: oldNode.size,
          viz: oldNode.viz,
          x: oldNode.x,
          y: oldNode.y
      });
    }

    // TODO remove if not needed
    let newEdgeId = 0;
    for (const oldEdge of oldEdges) {
      graph.addEdge({
        color: oldEdge.color,
        direction: 'undirected',
        id: (newEdgeId++).toString(),
        label: oldEdge.label,
        size: oldEdge.size,
        source: newIds.get(oldEdge.source).toString(),
        target: newIds.get(oldEdge.target).toString(),
        viz: oldEdge.viz,
        weight: oldEdge.weight
      });
    }
  }

  private loadGraphFromFile(filePath: string) {
    sigma.parsers.gexf(
      filePath,
      this.sigmaInstance,
      () => {
        this.rebuildGraphIfNecessary(this.sigmaInstance.graph);
        this.sigmaInstance.refresh();
        // hack: refresh twice to ensure graph is displayed correctly
        this.sigmaInstance.refresh();
      }
    );
  }

  private colorGraph(strategy: string): void {
    if (strategy.toLowerCase() === 'none') {
      // TODO could use a 'Reset' coloring to set all labels to #0
      console.log('Hack: Ignore first color request message.');
      return;
    }

    console.log('Color graph!');
    if (this.isColored) {
      console.warn('Graph is already colored.');
    }
    console.log('Received color request with strategy: ' + strategy);

    const reset = (strategy.toLowerCase() === 'reset');
    if (reset && !this.isColored) {
      console.warn('Graph is not colored. Will not reset.');
      return;
    }

    const graph = this.sigmaInstance.graph;
    const solution = this.coloringService.applyColoringStrategy(graph, strategy);

    if (isNullOrUndefined(solution) || isNullOrUndefined(solution.coloring)) {
      console.warn('Solution or coloring does not exist!');
      return;
    }

    for (const node of graph.nodes()) {
      const nodeId = node.id;
      graph.colorNode(nodeId, solution.coloring.get(nodeId));
    }

    if (!reset) {
      console.log('Graph was colored with \'' + strategy + '\' numConfChecks: ' + solution.numConfChecks.toString());
      const validString = solution.isValid(graph) ? 'valid' : 'invalid';
      console.log('Coloring is ' + validString + '!');
    }

    this.sigmaInstance.refresh();
    this.isColored = !reset;
  }
}
