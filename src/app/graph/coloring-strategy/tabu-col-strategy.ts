import { ColoringStrategy } from './coloring-strategy';
import { DSaturStrategy } from './dsatur-strategy';
import { ColoringSolution } from './coloring-solution';
import { Injectable } from '@angular/core';

export class TabuConfig {
  /**
   * A set of configuration parameters for the TabuCol algorithm
   *
   * @param maxChecks - max number of clash(conflict) checks
   * @param colorTarget - initial max number of colors for the solution
   */

  maxChecks: number;
  colorTarget: number;
  tenure: number;
  frequency: number;
  increment: number;

  constructor(
    maxChecks = 5000000,
    colors = 2,
    freq = 15000,
    inc = 1) {

      this.Build(maxChecks, colors, freq, inc);
  }

  /** Initializes the tabu config params with sane values */
  Build(maxChecks: number, colors: number, freq: number, inc: number) {
    this.maxChecks = maxChecks !== 0 ? Math.abs(Math.floor(maxChecks)) : 10000000;
    this.colorTarget = colors !== 0 ? Math.abs(Math.floor(colors)) : 2;
    this.tenure = Math.floor(Math.random() * 9);
    this.frequency = freq !== 0 ? Math.abs(Math.floor(freq)) : 15000;
    this.increment = inc !== 0 ? Math.abs(Math.floor(inc)) : 1;
  }
}

@Injectable()
export class TabuColStrategy extends ColoringStrategy {

  private config: TabuConfig;

  protected Init() {
    super.Init();
    this.config = new TabuConfig();
  }

  /**
   * Builds the initial solution using modified Greedy algo on a random
   * permutation of the vertices, allowing only numColors color classes.
   *
   * @param graph - the graph we operate on
   * @param coloring - the current coloring solution
   * @param numColors - the number of color classes allowed
   */
  private InitializeColoringForTabu(
    graph: any,
    coloring: Map<string, number>,
    numColors: number
  ) {

    if (graph === null || graph === undefined) {
      console.error('No graph defined');
      return;
    }

    // init and shuffle array of node indices
    const nodeIds = graph.nodes().map(node => node.id);
    const nodeIdsShuffled = graph.nodes().map(node => node.id);
    this.shuffleArray(nodeIdsShuffled);
    this.colorGenerator.resize(numColors + 1);

    let usedColors = new Array<boolean>(numColors + 1).fill(false);

    // sanitize values outside of max color range
    for (const pair of coloring.entries()) {
      const color = pair[1];
      if (color < 1 || color > numColors) {
        coloring.set(pair[0], 1);
      }
    }

    for (const nodeId of nodeIdsShuffled) {
      usedColors = usedColors.map(el => false);
      const color = coloring.get(nodeId);
      for (const otherNodeId of nodeIds) {
        this.numChecks++;
        if (graph.hasEdgeBetween(nodeId, otherNodeId)) {
          usedColors[color] = true;
          break;
        }
      }
      // node is part of a clash so we randomly assign a different color to it
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

  /**
   * Initializes the 'bookeeping' arrays for the tabu heuristic
   *
   * @param nodesByColor - keeps track of all node ids per color class as well as their total
   * @param nbcPos - the order of every node in its color class sublist
   * (i.e. column index on the line corresponding to its color in nodesByColor)
   * @param conflicts - number of conflicts
   * @param tabuStatus - keeps track of what moves are taboo and for how long
   * @param graph - the graph we operate on
   * @param coloring - the current coloring
   * @param numColors - the number of color classes currently used
   */
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
      // count the number of nodes per color class on the first column
      nodesByColor[col][0]++;
      nbcPos[i] = nodesByColor[col][0];
      nodesByColor[col][nbcPos[i]] = i;
    }

    // init conflicts array
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        this.numChecks++;
        if (graph.hasEdgeBetween(nodes[i].id, nodes[j].id)) {
          const col = coloring.get(nodes[j].id);
          if (parseInt(nodes[i].id, 10) !== i || parseInt(nodes[j].id, 10) !== j) {
            console.warn('Node ID different from index!');
          }
          conflicts[col][i]++;
        }
      }
    }
  }

  /**
   * Move bestNode to color class bestColor
   * @param bestNode - the node's integer index (not id)
   * @param bestColor - the color class's index
   * @param graph - graph
   * @param coloring - current coloring
   * @param nodesByColor
   * @param conflicts
   * @param nbcPos
   * @param nodesInConflict
   * @param confPos
   * @param tabuStatus
   * @param totalIter
   */
  private MoveNodeToColor(
    bestNode, bestColor, graph, coloring, nodesByColor, conflicts, nbcPos, nodesInConflict,
    confPos, tabuStatus, totalIter) {

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
        if (conflicts[oldColor][bestNode] === 0 && conflicts[bestColor][bestNode] > 0) {
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
        if (conflicts[oldColor][nbId] === 0 && coloring.get(nb) === oldColor) {
          // Remove nb from the list of conflicting nodes if there are 0 conflicts in
          // its own color
          confPos[nodesInConflict[nodesInConflict[0]]] = confPos[nbId];
          nodesInConflict[confPos[nbId]] = nodesInConflict[nodesInConflict[0]--];
        }
        // Increase the number of conflicts in the new color
        this.numChecks++;
        conflicts[bestColor][nbId]++;
        if (conflicts[bestColor][nbId] === 1 && coloring.get(nb) === bestColor) {
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
      const nodeID = nodes[i].id;
      const col = coloring.get(nodeID);
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
      let bestCol = 0;
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
            numBest += 1; // count the number of moves
          }
        }
      }

      // if we only found tabu moves, then take a random move
      if (bestNode === -1) {
        bestNode = Math.floor(Math.random() * n);
        bestCol = Math.floor(Math.random() * numColors) + 1;
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

  /**
   * Initializes and runs the tabuCol algorithm to generate a solution
   * @param graph
   */
  public generateSolution(graph: any): ColoringSolution {
    console.log('Color ' + this.getID());
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    // initialize the tabu algorithm params
    this.Init();

    const constructiveAlgo = new DSaturStrategy(this.colorGenerator);
    const initialSolution = constructiveAlgo.generateSolution(graph);

    let cost: number;

    if (initialSolution === null || initialSolution === undefined) {
      console.error('Could not color graph with initial algo!');
    }

    this.numChecks += initialSolution.numConfChecks;
    let bestColoring = initialSolution.coloring;
    const coloring = bestColoring;
    // the number of unique colors used in the initial solution
    let numColors = this.getNumberOfColors();

    while (this.numChecks < this.config.maxChecks && numColors > this.config.colorTarget) {
      coloring.forEach((v, k) => coloring.set(k, 0));
      cost = this.Tabu(graph, coloring, numColors);
      if (cost === 0) {
        coloring.forEach((v, k) => coloring.set(k, v - 1));
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
