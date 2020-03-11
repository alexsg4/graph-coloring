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
    const nodeIdsShuffled = graph.nodes().map(node => node.id);
    this.shuffleArray(nodeIdsShuffled);
    this.colorGenerator.resize(numColors + 1);

    let usedColors = new Array<boolean>(numColors + 1).fill(false);
    for (const pair of coloring.entries()) {
      if (pair[1] < 1 || pair[1] > numColors) {
        coloring.set(pair[0], 1);
      }
    }

    for (const nodeId of nodeIdsShuffled) {
      usedColors = usedColors.map(el => false);
      const color = coloring.get(nodeId);
      for (const otherNodeId of nodeIds) {
        this.numChecks++;
        if (nodeId !== otherNodeId && graph.hasEdgeBetween(nodeId, otherNodeId)) {
          usedColors[color] = true;
        }
      }
      if (usedColors[color]) {
        let newCol = Math.floor(Math.random() * numColors) + 1;
        for (let col = 1; col <= numColors; col++) {
          if (!usedColors[col]) {
            newCol = col;
            break;
          }
        }
        coloring.set(nodeId, newCol);
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

  private MoveNodeToColor(
    bestNode, bestColor, graph, coloring, nodesByColor, conflicts, nbcPos, nodesInConflict, confPos,
    tabuStatus, totalIter) {

      const nodes = graph.nodes();
      const bestNodeId = nodes[bestNode].id;
      const oldColor = coloring.get(bestNodeId);
      coloring.set(bestNodeId, bestColor);

      // If bestNode is not a conflict node anymore, remove it from the list
      this.numChecks += 2;
      if (conflicts[oldColor][bestNode] > 0 && conflicts[bestColor][bestNode] === 0) {
        confPos[nodesInConflict[nodesInConflict[0]]] = confPos[bestNode];
        nodesInConflict[confPos[bestNode]] = nodesInConflict[nodesInConflict[0]];
        nodesInConflict[0]--;
      } else {
        this.numChecks += 2;
        // If bestNode becomes a conflict node, add it to the list
        // TODO double check
        if (!(conflicts[oldColor][bestNode] && conflicts[bestColor][bestNode])) {
          nodesInConflict[0]++;
          confPos[bestNode] = nodesInConflict[0];
          nodesInConflict[confPos[bestNode]] = bestNode;
        }
      }

      // Update the conflicts of the neighbors.
      this.numChecks++;
      const bestNodeNeighbors = graph.getAdjList(bestNodeId);
      for (const nb of bestNodeNeighbors) {
        this.numChecks += 2;
        // this works because we rebuild the graph with the correct ids
        const nbId = parseInt(nb, 10);
        conflicts[oldColor][nbId]--;
        if (conflicts[oldColor][nbId] == 0 && coloring.get(nb.id) === oldColor) {
          // Remove nb from the list of conflicting nodes if there are 0 conflicts in
          // its own color
          confPos[nodesInConflict[nodesInConflict[0]]] = confPos[nbId];
          nodesInConflict[confPos[nbId]] = nodesInConflict[nodesInConflict[0]--];
        }
        // Increase the number of conflicts in the new color
        this.numChecks++;
        conflicts[bestColor][nbId]++;
        if (conflicts[bestColor][nb.id] == 1 && coloring.get(nb) === bestColor) {
          // Add nb from the list conflicting nodes if there is a new conflict in
          // its own color
          nodesInConflict[0]++;
          confPos[nbId] = nodesInConflict[0];
          nodesInConflict[confPos[nbId]] = nbId;
        }
      }
      // Set the tabu status
      tabuStatus[bestNode][oldColor] = totalIter + this.config.tenure;
  }

  private Tabu(
    graph: any,
    coloring: Map<string, number>,
    numColors: number
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
    const nodes = graph.nodes();

    this.InitializeArrays(nodesByColor, nbcPos, conflicts, tabuStatus, graph, coloring, numColors);

    nodesInConflict[0] = 0;
    for (let i = 0; i < n; i++) {
      this.numChecks++;
      const col = coloring.get(nodes[i].id);
      const nConflicts = conflicts[col][i];
      if (nConflicts > 0) {
        nodesInConflict[0]++;
        confPos[i] = nodesInConflict[0];
        nodesInConflict[confPos[i]] = i;

        cost += nConflicts;
      }
    }
    cost = Math.floor(cost / 2);

    // least number of conflicts
    let bestSolValue = cost;
    // in case we found a legal coloring with numColors
    if (bestSolValue === 0) {
      return 0;
    }

    let minSol = n;
    let maxSol = 0;

    let currentIter = 0;
    let totalIter = 0;

    // tabu loop
    while (this.numChecks < this.config.maxChecks) {
      currentIter++;
      totalIter++;

      const nc = nodesInConflict[0];

      let bestNode = -1;
      let bestCol = -1;
      let bestCost = n * n;
      let numBest = 0;

      // try to move every node in conflict to a color different than its own
      for (let i = 1; i <= nodesInConflict[0]; i++) {
        const node = nodesInConflict[i];
        for (let c = 1; c <= numColors; c++) {
          if (c === coloring.get(nodes[node].id)) {
            continue; // we don't care about the node's current color
          }
          this.numChecks += 2;
          const col = coloring.get(nodes[node].id);
          const newCost = cost + conflicts[c][node] - conflicts[col][node];
          if (newCost <= bestCost && c !== col) {
            if (newCost < bestCost) {
              numBest = 0;
            }
            if (tabuStatus[node][c] < totalIter || newCost < bestCost) {
              // Select the nth move with probability 1/n
              // TODO tweak
              if (Math.floor(Math.random() * (numBest + 1)) === 0) {
                bestNode = node;
                bestCol = c;
                bestCost = newCost;
              }
            }
          }

        }
      }

      // if we only found tabu moves, then take a random move
      if (bestNode === -1) {
        bestNode = Math.floor(Math.random() * n);
        bestCol = Math.floor(Math.random() * numColors + 1);
        const col = coloring.get(nodes[bestNode].id);

        while (bestCol !== col) {
          bestCol = Math.floor(Math.random() * numColors + 1);
          this.numChecks += 2;
          bestCost = cost + conflicts[bestCol][bestNode] - conflicts[col][bestNode];
        }
      }

      this.MoveNodeToColor(bestNode, bestCol, graph, coloring, nodesByColor, conflicts, nbcPos,
        nodesInConflict, confPos, tabuStatus, totalIter);

      cost = bestCost;
      // update the tabu tenure - we're using static tenure for now
      this.config.tenure = Math.floor(0.6 * nc) + Math.floor(Math.random() * 10);

      // check: have we a new globally best solution?
      if (cost < bestSolValue) {
        bestSolValue = cost;

        // If all nodes are colored we report success and stop iterating
        if (bestSolValue === 0) {
          break;
        }
        // Otherwise reinitialize some values
        minSol = n * n;
        maxSol = 0;
        currentIter = 0;
      }
    }
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
      coloring.forEach((v, k) => coloring.set(k, 0));
      cost = this.Tabu(graph, coloring, numColors);
      if (cost === 0) {
        bestColoring = coloring;
        if (numColors <= this.config.colorTarget) {
          break;
        }
      }
      numColors--;
    }
    return new ColoringSolution(bestColoring, numColors + 1, this.numChecks);
  }

  public getID(): string {
    return 'tabuCol';
  }
}
