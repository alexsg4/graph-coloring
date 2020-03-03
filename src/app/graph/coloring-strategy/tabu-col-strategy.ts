import { ColoringStrategy } from './coloring-strategy';
import { DSaturStrategy } from './dsatur-strategy';
import { ColoringSolution } from './coloring-solution';
import { isUndefined, isNullOrUndefined } from 'util';

export class TabuConfig {
  maxChecks: number;
  colorTarget: number;
  tenure: number;
  frequency: number;
  increment: number;

  constructor(
    maxChecks = 10000000,
    colors = 2,
    tenure = 1,
    freq = 15000,
    inc = 1) {

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

  protected Init() {
    super.Init();
    this.config = new TabuConfig();
  }

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
    const nodeIds = graph.nodes().map(node => node.id);

    this.shuffleArray(nodeIds);
    this.colorGenerator.resize(numColors);

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

  private InitializeArrays(
    nodesByColor: any,
    nbcPos: any,
    conflicts: any,
    tabuStatus: any,
    graph: any,
    coloring: Map<string, number>,
    numColors: number
  ) {

    const nodes = graph.nodes();
    const n = nodes.length;

    for (let i = 0; i <= numColors; i++) {
      nodesByColor[i] = new Array<number>(n + 1).fill(0);
      conflicts[i] = new Array<number>(n + 1).fill(0);
    }

    for (let i = 0; i < n; i++) {
      tabuStatus[i] = new Array<number>(numColors + 1).fill(0);
    }

    for (let i = 0; i < n; i++) {
      const col = coloring.get(nodes[i].id);
      nodesByColor[col][0]++;
      nbcPos[i] = nodesByColor[col][0];
      nodesByColor[col][nbcPos[i]] = i;
    }

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        this.numChecks++;
        if (i !== j && graph.hasEdgeBetween(nodes[i].id, nodes[j].id)) {
          const col = coloring.get(nodes[j].id);
          conflicts[col][i]++;
        }
      }
    }
  }

  private MoveNodeToColor() {
    // TODO implement
    return;
  }

  private Tabu(
    graph: any,
    coloring: Map<string, number>,
    numColors: number,
    config: TabuConfig
  ): number {

    this.InitializeColoringForTabu(graph, coloring, numColors);
    let cost = 0;

    const n = graph.getNodesCount();
    const nodesByColor = new Array<Array<number>>(numColors + 1);
    const conflicts = new Array<Array<number>>(numColors + 1);
    const tabuStatus = new Array<Array<number>>(n);
    const nbcPos = new Array<number>(n + 1).fill(0);
    const nodesInConflict = new Array<number>(n + 1).fill(0);
    const confPos = new Array<number>(n).fill(0);

    this.InitializeArrays(nodesByColor, nbcPos, conflicts, tabuStatus, graph, coloring, numColors);
    console.log(nbcPos);

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
    const coloring = bestColoring;
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
