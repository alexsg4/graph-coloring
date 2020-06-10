import { Component, OnInit } from '@angular/core';
import { StrategySelectService } from '../coloring-controls/strategy-select.service';
import { ColoringService } from '../coloring.service';
import { ColorGeneratorService } from '../color-generator.service';
import { GraphSelectService } from '../../services/graph-select.service';
import { FilesService } from '../../services/files.service';
import { ConsoleWriterService } from '../../console/console-writer.service';

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
  private fallbackGraphPath = 'assets/graphs/testGraph-2.gexf';

  private prevColoring;

  constructor(private strategySelect: StrategySelectService,
              private coloringService: ColoringService,
              private colorGenerator: ColorGeneratorService,
              private graphSelect: GraphSelectService,
              private fserv: FilesService,
              private writer: ConsoleWriterService) {


    this.isColored = false;
    this.prevColoring = {
      nodes: new Set<string>(),
      color: '',
      origin: ''
    };

    this.addGraphMethods();
   }

  ngOnInit() {

    // Init sigma
    this.sigmaInstance = new sigma({
      container: document.getElementById(this.graphContainerId),
      settings: {
        nodeColor: '#000000',
        edgeColor: '#000000'
      }
    });

    this.bindSigmaEvents();

    // Listen for graph choice
    this.graphSelect.chosenGraphUrl$.subscribe(async url => {
      if (!url || !url.length) {
        return;
      }

      this.loadGraphFromFile(url);
    });

    // Listen for coloring strategy
    this.strategySelect.currentMessage.subscribe(
      message => {
         console.log('Received message ' + message + ' of type:', typeof(message));
         this.colorGraph(message);
      },
      error => console.error(error)
    );

    // Load the default graph
    this.loadGraphFromFile(this.fallbackGraphPath);
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

    sigma.classes.graph.addMethod('resetColoring', function(): void {
      for (let i = 0; i < this.nodesArray.length; i++) {
        const node = this.nodesIndex[i];
        node.color = '#000000';
        node.label = node.label.match('[0-9]+').join('');
      }
    });

    sigma.classes.graph.addMethod('colorNodeHex', function(nodeID: string, color: number): void {
      if (!this.nodesIndex[nodeID]) {
        console.error('Color node: Error node does not exist!');
        return;
      }
      const node = this.nodesIndex[nodeID];
      const colorStr = ' #' + color.toString(16);
      node.label = node.label.match('[0-9]').toString() + colorStr;
      node.color = colorStr.trim();
    });

    sigma.classes.graph.addMethod('colorNode', function(nodeID: string, color: string, relabel = false): void {
      if (!this.nodesIndex[nodeID]) {
        console.error('Color node: Error node does not exist!');
        return;
      }
      if (!color) {
        console.error('Color node: invalid color!');
        return;
      }
      const node = this.nodesIndex[nodeID];
      if (relabel) {
        const newLabel = node.id + ' ' + color;
        node.label = newLabel;
      }
      node.color = color.trim();
    });

    sigma.classes.graph.addMethod('getNodesCount', function() {
      return this.nodesArray.length;
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

  // TESTING
  private bindSigmaEvents() {

    this.sigmaInstance.bind('overNode', e => {

      console.warn('Color adj list');
      console.log(e.type, e.data.node.label, e.data.captor);

      const node = e.data.node;
      if (node.id === this.prevColoring.origin) {
        return;
      }

      const graph = this.sigmaInstance.graph;

      const HLCOLOR = '#FFFEFE';

      this.prevColoring.color = node.color;
      for (const other of graph.nodes()) {
        if (other.color === node.color) {
          this.prevColoring.nodes.add(other.id);
        }
      }
      if (this.prevColoring.nodes.size) {
        this.prevColoring.origin = node.id;
        for (const nodeID of this.prevColoring.nodes) {
          graph.colorNode(nodeID, HLCOLOR);
        }
        this.sigmaInstance.refresh();
      }
    });

    this.sigmaInstance.bind('outNode', e => {
      console.warn('RESET COLOR adj list');
      console.log(e.type, e.data.node.label, e.data.captor);

      if (e.data.node.id !== this.prevColoring.origin) {
        return;
      }
      const graph = this.sigmaInstance.graph;

      for (const node of this.prevColoring.nodes) {
        graph.colorNode(node, this.prevColoring.color);
      }
      // reset the prev coloring info
      this.prevColoring.origin = '';
      this.prevColoring.color = '';
      this.prevColoring.nodes.clear();

      this.sigmaInstance.refresh();
    });
  }

  private rebuildGraphIfNecessary(graph: any) {
    if (!graph) {
      console.error('graph could not be loaded');
    }

    const nodesCount = graph.nodes().length;
    let needRebuild = false;
    for (const node of graph.nodes()) {
      // NOTE this is sneaky but we also LABEL all nodes here and color them black
      node.label = node.id;
      node.color = '#000000';

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
          color: '#000000',
          id: newId.toString(),
          label: newId.toString(),
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

  private loadGraphFromFile(file: string|Blob) {
    if (!file || file === '') {
      console.warn('Invalid file.');
      return;
    }
    sigma.parsers.gexf(
      file,
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
      console.log('Hack: Ignore first color request message.');
      return;
    }

    console.log('Color graph!');
    if (this.isColored) {
      console.warn('Graph is already colored.');
    }
    console.log('Received color request with strategy: ' + strategy);

    const graph = this.sigmaInstance.graph;

    const reset = (strategy.toLowerCase() === 'reset');
    if (reset) {
      let msg = '';
      if (!this.isColored) {
        msg = 'Graph is not colored. Will not reset.';
      } else {
        graph.resetColoring();
        this.isColored = false;
        this.sigmaInstance.refresh();
        msg = 'Graph coloring was reset.';

        // write a special message for console output reset
        this.writer.writeMessage('#reset');
      }
      this.writer.writeMessage(msg, 'warn');
      return;
    }
    const solution = this.coloringService.applyColoringStrategy(graph, strategy);

    if (!solution || !solution.coloring) {
      console.warn('Solution or coloring does not exist!');
      return;
    }

    for (const node of graph.nodes()) {
      const nodeId = node.id;
      const nodeColor = this.colorGenerator.getColorByIndex(solution.coloring.get(nodeId));

      if (!node) {
        console.error('ColorGraph: invalid color');
      }
      graph.colorNode(nodeId, nodeColor, true);
    }

    // compose the coloring status message
    let message = 'Graph was colored with \'' + strategy +
    '\' conflict checks: ' + solution.numConfChecks.toString() +
    ' colors: ' + solution.numColors;
    const validString = solution.isValid(graph) ? 'valid' : 'invalid';
    message += '\nColoring is ' + validString + '!';

    // write it to the app console
    this.writer.writeMessage(message, 'log');

    this.isColored = true;
    this.sigmaInstance.refresh();
  }
}
