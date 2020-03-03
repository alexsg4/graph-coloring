import { ColoringStrategy } from './coloring-strategy';
import { DSaturStrategy } from './dsatur-strategy';
import { ColoringSolution } from './coloring-solution';
import { isUndefined, isNullOrUndefined } from 'util';

export class TabuConfig {
  maxChecks = 10000000;
  colorTarget = 2;
  tenure = 1;
  frequency = 15000;
  increment = 1;

  constructor(maxChecks: number, colors: number, tenure: number, freq: number, inc: number) {
    this.Build(maxChecks, colors, tenure, freq, inc);
  }

  Build(maxChecks: number, colors: number, tenure: number, freq: number, inc: number) {
    this.maxChecks = maxChecks !== 0 ? Math.abs(Math.floor(maxChecks)) : 10000000;
    this.colorTarget = colors !== 0 ? Math.abs(Math.floor(colors)) : 2;
    this.tenure = tenure !== 0 ? Math.abs(Math.floor(tenure)) : 1;
    this.frequency = freq !== 0 ? Math.abs(Math.floor(freq)) : 15000;
    this.increment = inc !== 0 ? Math.abs(Math.floor(inc)) : 1;
  }
}

export class TabuColStrategy extends ColoringStrategy {

  // TODO make user-configurable
  private config: TabuConfig;

  private InitializeColoringForTabu(
    graph: any,
    coloring: Map<string, number>,
    numColors: number
  ) {

    if (isNullOrUndefined(graph)) {
      console.error('No graph defined');
      return;
    }

    // init and shuffle array of node indices
    const nodeIds = new Array<string>(graph.getNodesCount());
    let k = 0;
    for (const node of graph.nodes()) {
      nodeIds[k++] = node.id;
    }

    this.shuffleArray(nodeIds);
    this.colorGenerator.fill(numColors);

    const usedColors = new Array<boolean>(numColors).fill(false);

    for (const nodeId of nodeIds) {
      usedColors.forEach(entry => entry = false);
      for (const node of graph.nodes()) {
        this.numChecks++;
        const otherNodeId = node.id;
        if (nodeId !== otherNodeId && graph.hasEdgeBetween(nodeId, otherNodeId)) {
          const color = coloring.get(nodeId);
          if (isUndefined(color)) {
            console.error('color not found!');
          }
          usedColors[color] = true;
        }
      }
      if (usedColors[coloring.get(nodeId)]) {
        let foundColor = false;
        for (let col = 0; col < numColors; col++) {
          if (!usedColors[col]) {
            coloring.set(nodeId, col);
            foundColor = true;
            break;
          }
        }
        if (!foundColor) {
          const randColor = Math.floor(Math.random() * (numColors - 1));
          coloring.set(nodeId, randColor);
        }
      }
    }
  }

  InitializeArrays(
    nodesByColor: any,
    conflicts: any,
    tabuStatus: any,
    graph: any,
    coloring: Map<string, number>,
    numColors: number
  ) {

    nodesByColor = new Map<number, Array<string>>();
    for (const pair of coloring) {
      const coloredNodes = nodesByColor.get(pair[1]);
      if (isUndefined(coloredNodes)) {
        nodesByColor.set(pair[0], new Array<string>(pair[1]));
      } else {
        coloredNodes.push(pair[1]);
      }

      conflicts = new Map<number, Map<string, number>>();
      for (const node of coloring.keys()) {
        for (const otherNode of graph.getAdjList(node)) {
          this.numChecks++;

          const otherNodeColor = coloring.get(otherNode);
          const nodesInConflict = conflicts.get(otherNodeColor);
          if (isUndefined(nodesInConflict)) {
            conflicts.set(otherNodeColor, new Array<string>(otherNode));
          } else {
            nodesInConflict.push(otherNode);
          }
        }
      }

      tabuStatus = new Map<string, Map<number, number>>();
      for (const node of coloring.keys()) {
        tabuStatus.set(node, new Map<number, number>());
        const colorStatus = tabuStatus.get(node);
        for (let color = 0; color < this.getLastColor(); color ++) {
          colorStatus.set(color, 0);
        }
      }
    }
  }

  private Tabu(
    graph: any,
    coloring: Map<string, number>,
    numColors: number,
    config: TabuConfig
  ): number {

    let cost = 0;

    this.InitializeColoringForTabu(graph, coloring, numColors);


    return cost;
  }

  public generateSolution(graph: any): ColoringSolution {
    console.log('Color ' + this.getID());
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    this.Init();

    const nodesCount = graph.getNodesCount();
    const constructiveAlgo = new DSaturStrategy(this.colorGenerator);
    const initialSolution = constructiveAlgo.generateSolution(graph);

    let cost: number;

    if (isNullOrUndefined(initialSolution)) {
      console.error('Could not color graph with initial algo!');
    }

    this.numChecks += initialSolution.numConfChecks;
    let bestColoring = initialSolution.coloring;
    const coloring = new Map<string, number>();
    let numColors = this.getLastColor(); // the number of unique colors used in the initial solution

    numColors--;
    while (this.numChecks < this.config.maxChecks && numColors + 1 > this.config.colorTarget) {
      cost = this.Tabu(graph, coloring, numColors, this.config);
      if (cost === 0) {
        bestColoring = coloring;
        if (numColors <= this.config.colorTarget) {
          break;
        }
      }
      numColors--;
    }
    return new ColoringSolution(bestColoring, this.numChecks);
  }

  public getID(): string {
    return 'tabuCol';
  }
}
