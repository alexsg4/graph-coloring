import { ColoringStrategy } from './coloring-strategy';
import { DSaturStrategy } from './dsatur-strategy';
import { ColoringSolution } from './coloring-solution';
import { Injectable } from '@angular/core';

// tslint:disable:no-redundant-jsdoc

export class HEAConfig {
  /**
   * A set of configuration parameters for the Hybrid Evolutionary algorithm
   *
   * @param maxChecks - max number of clash(conflict) checks
   * @param colorTarget - initial max number of colors for the solution
   * @param popSize - population size
   * @param maxTabuIter - number of tabu search iterations per cycle
   * (will be multiplied by number of nodes)
   */

  maxChecks: number;
  colorTarget: number;
  tenure: number;
  frequency: number;
  increment: number;
  popSize: number;
  maxTabuIter: number;

  constructor(
    maxChecks = 5000000,
    colors = 2,
    freq = 15000,
    inc = 1,
    ) {

      this.Build(maxChecks, colors, freq, inc);
  }

  /** Initializes the tabu config params with sane values */
  Build(maxChecks: number, colors: number, freq: number, inc: number) {
    this.maxChecks = maxChecks !== 0 ? Math.abs(Math.floor(maxChecks)) : 10000000;
    this.colorTarget = colors !== 0 ? Math.abs(Math.floor(colors)) : 2;
    this.tenure = Math.floor(Math.random() * 9);
    this.frequency = freq !== 0 ? Math.abs(Math.floor(freq)) : 15000;
    this.increment = inc !== 0 ? Math.abs(Math.floor(inc)) : 1;

    // TODO tweak magic numbers (sane defaults based on the literature)
    this.popSize = 10;
    this.maxTabuIter = 16;
  }
}

@Injectable()
export class HEAStrategy extends ColoringStrategy {

  private config: HEAConfig;

  protected Init() {
    super.Init();
    this.config = new HEAConfig();
  }

  /**
   * Assigns a node to a color during the initial solution created by modified DSatur
   * and updates the color info arrays
   *
   * @param nColsAvailable - number of colors available per node
   * @param colByNode - matrix containing info about availalble colors per node
   * @param coloring - partial solution computed so far
   * @param nc - number of color classes
   * @param node - node's id (can be replaced by index by parsing the string as int)
   *
   */
  private assignToCol4Init(
    nColsAvailable: Array<number>,
    colByNode: Array<Array<boolean>>,
    coloring: Map<string, number>,
    nc: number,
    node: string,
    graph: any,
  ) {

    const nodeId = parseInt(node, 10);
    let c = 0;
    let foundColor = false;

    while (c < nc) {
      // color is available for our node
      if (colByNode[nodeId][c]) {
        // add it to the solution
        coloring.set(node, c);
        foundColor = true;
        break;
      }
      c++;
    }

    // this should not happen
    if (!foundColor) {
      console.error('Could not assign color class during initial solution.');
    }

    // update the available-color info arrays
    nColsAvailable[nodeId] = -1; // mark the node as having been assigned
    // go through all nodes, see who's not assigned a color and reduce its color options
    for (let i = 0; i < graph.getNodesCount(); i++) {

      if (nColsAvailable[i] !== -1) {
        this.numChecks++;

        if (colByNode[i][c] && graph.hasEdgeBetween(i.toString(), node)) {
          colByNode[i][c] = false;
          nColsAvailable[i]--;
        }
      }
    }
  }

  /**
   * Builds the initial solution using modified DSatur algo on a random
   * permutation of the vertices, allowing only numColors color classes.
   *
   * @param graph - the graph we operate on
   * @param coloring - the current coloring solution
   * @param numColors - the number of color classes allowed
   */
  private InitializeColoringForHEA(
    graph: any,
    coloring: Map<string, number>,
    numColors: number
  ) {

    if (graph === null || graph === undefined) {
      console.error('No graph defined');
      return;
    }

    const n = graph.getNodesCount();
    // keep track of available colors for each node
    // every node has numColors available initially
    const numColsAvailable = new Array<number>(n).fill(numColors);
    // keep a list of available color classes per node
    // all colors are available for every node initially
    const colorsByNode = new Array(n).fill(true).map(() => new Array<boolean>(numColors).fill(true));

    // choose a random node and assign it to the first color
    let node = Math.floor(Math.random() * n).toString();

    this.assignToCol4Init(numColsAvailable, colorsByNode, coloring, numColors, node, graph);
    // while we can still assign colors
    while (numColsAvailable.some(x => x >= 1)) {

      // find the minimum accepted value
      let minValue = Number.MAX_SAFE_INTEGER;
      for (const nca of numColsAvailable) {
        if (nca >= 1 && nca < minValue) {
          minValue = nca;
        }
      }

      // get all the nodes (array indexes) with this value and randomly choose one to assign to a color
      const candNodes = new Array<number>();
      for (let i = 0; i < numColsAvailable.length; i++) {
        if (numColsAvailable[i] === minValue) {
          candNodes.push(i);
        }
      }

      const randId = Math.floor(Math.random() * candNodes.length);
      // assign a color to the newly chosen node
      node = candNodes[randId].toString();
      this.assignToCol4Init(numColsAvailable, colorsByNode, coloring, numColors, node, graph);
    }

    // now randomly assigned the nodes with 0 options to some color (if needed)
    for (let i = 0; i < n; i++) {
      if (numColsAvailable[i] > 0) {
        console.error('Node with options was not assigned. Something went wrong!');
      }

      if (numColsAvailable[i] === 0) {
        const randColor = Math.floor(Math.random() * numColors);
        coloring.set(i.toString(), randColor);
      }
    }
    // finally shift the color indexes to the interval [1, numColors]
    coloring.forEach((v, k) => coloring.set(k, v + 1));
  }

  /**
   * Checks if a coloring solution is optimal. i.e. all adjacent nodes have different
   * colors within [1, nc]
   * @param sol
   * @param nc
   * @param graph
   */
  private isSolutionOptimal(
    sol: Map<string, number>,
    nc: number,
    graph: any,
  ): boolean {

    const n = graph.getNodesCount();
    const nodeIds = graph.nodes().map(node => node.id);

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j ++) {
        const node1 = nodeIds[i];
        const node2 = nodeIds[j];

        const col1 = sol.get(node1);
        const col2 = sol.get(node2);

        if (Math.max(col1, col2) > nc || Math.min(col1, col2) < 1) {
          console.error('Node colors out of bounds!');
        }

        if (col1 === col2 && graph.hasEdgeBetween(node1, node2)) {
          return false;
        }
      }
    }
    return true;
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
   * @param conflicts
   * @param nodesInConflict
   * @param confPos
   * @param tabuStatus
   * @param totalIter
   * @param tenure - tabu tenure
   */
  private MoveNodeToColor(
    bestNode, bestColor, graph, coloring, conflicts, nodesInConflict,
    confPos, tabuStatus, totalIter, tenure) {

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

    const n = graph.getNodesCount();
    const nodesByColor = new Array<Array<number>>(numColors + 1);
    const conflicts = new Array<Array<number>>(numColors + 1);
    const tabuStatus = new Array<Array<number>>(n);
    const nbcPos = new Array<number>(n + 1).fill(0);
    const nodesInConflict = new Array<number>(n + 1).fill(0);
    const confPos = new Array<number>(n).fill(0);
    const nodes = graph.nodes();

    this.InitializeArrays(nodesByColor, nbcPos, conflicts, tabuStatus, graph, coloring, numColors);

    let cost = 0;
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

    let totalIter = 0;

    // TABU LOOP
    while (totalIter < this.config.maxTabuIter) {
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
          bestCol = Math.floor(Math.random() * numColors) + 1;
          this.numChecks += 2;
          bestCost = cost + conflicts[bestCol][bestNode] - conflicts[col][bestNode];
        }
      }

      let tenure = this.config.tenure;
      this.MoveNodeToColor(bestNode, bestCol, graph, coloring, conflicts,
        nodesInConflict, confPos, tabuStatus, totalIter, tenure);

      cost = bestCost;
      // update the tabu tenure - we're using static tenure for now
      tenure = Math.floor(0.6 * nc) + Math.floor(Math.random() * 10);

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
      }
    }
    return cost;
  }

  /**
   * Do a GPX crossover with 2 parents, update the population by replacing
   *
   * @param parents - parents array
   * @param graph - graph
   * @param numColors - number of color classes
   * @param population - population array
   *
   * @returns ofs - the resulting offspring
   */
  private crossover(
    parents: number[],
    graph: any,
    numColors: number,
    population: Map<string, number>[]
  ): Map<string, number> {

    const n = graph.getNodesCount();
    // init the offspring - we'll convert to a map later
    // NOTE this only works for sequential node indexes
    // colors start from 1 in this case
    const osp = new Map<string, number>();

    const numParents = parents.length;
    // keep track of available parents (all are available initially)
    const tabuList = new Array<number>(numParents).fill(-1);

    // 2d array of color cardinality per parent
    const parentCardinality = new Array<number>(numParents).fill(null).map(
      () => new Array<number>(numColors + 1).fill(0)
    );

    // TODO choose parents randomly at first

    // build a copy of the parents for bookkeeping later
    const parentsCopies = new Array(numParents).fill(null);

    // compute the cardinality
    for (let i = 0; i < numParents; i++) {
      parentsCopies[i] = new Map(population[parents[i]]);
      for (let j = 0; j < n; j++) {
        // get the color of node j from the i-th parent
        const colorIndex = population[parents[i]].get(j.toString());
        parentCardinality[i][colorIndex]++;
      }
    }

    // actual crossover
    let chosenParent = 0;
    let chosenColor = 0;

    // 'evolve' every color
    for (let c = 1; c <= numColors; c++) {

      // find the parent(s) with the biggest cardinality(ies)
      let maxCard = -1;
      const maxColors = new Array<number>();
      const maxParents = new Array<number>();

      for (let p = 0; p < numParents; p++) {
        // skip unavailable parents
        if (tabuList[p] >= c) {
          continue;
        }
        for (let col = 1; col <= numColors; col++) {
          const currentCard = parentCardinality[p][col];
          if (currentCard > maxCard) {
            maxCard = currentCard;

            // repopulate the arrays with the max values
            maxParents.length = 0;
            maxParents.push(p);

            maxColors.length = 0;
            maxColors.push(col);
          } else if (currentCard === maxCard) {
            maxParents.push(p);
            maxColors.push(col);
          }
        }
      }
      if (maxParents.length === 0) {
        console.error('Could not choose suitable parent in crossover!');
      } else {
        // randomly choose a parent/color
        const id = Math.floor(Math.random() * maxParents.length);
        chosenParent = maxParents[id];
        chosenColor = maxParents[id];
      }
      tabuList[chosenParent] = c + 1;
      /** copy all of chosenParent's chosenColor-ed nodes to offspring AS color c and
       * remove them from population
       */

      for (let i = 0; i < n; i++) {
        if (parentsCopies[chosenParent].get(i.toString()) === chosenColor) {
          // copy the 'good' color vertices to the offspring
          osp.set(i.toString(), c);
          // update the parent cardinalities (remove vertices from parents)
          for (let pc = 0; pc < numParents; pc++) {
            const color = parentsCopies[pc].get(i.toString());
            if (color !== -1) {
              parentCardinality[pc][color]--;
            }
            parentsCopies[pc].set(i.toString(), -1);
          }
        }
      }
    }

    // crossover done - color remaining nodes randomly
    for (let i = 0; i < n; i++) {
      const iStr = i.toString();
      const colorVal = osp.get(iStr);

      if (colorVal === undefined) {
        const randColor = Math.floor(Math.random() * numColors) + 1;
        osp.set(iStr, randColor);
      }

      if (colorVal < 1) {
        console.error('Invalid color found in osp. Something went wrong!');
      }
    }
    return osp;
  }

  /**
   * Replaces the weakest parent in the population with offspring
   *
   * @param population
   * @param parents
   * @param osp - offspring
   * @param popCosts - population costs
   * @param ospCost - offspring's cost
   */
  private replace(
    population: Map<string, number>[],
    parents: number[],
    osp: Map<string, number>,
    popCosts: number[],
    ospCost: number
  ) {

    let maxCost = -1;
    let worstParent = -1;
    // find the weakest pop

    for (const p of parents) {
      const parentCost = popCosts[p];
      if (parentCost > maxCost) {
        maxCost = parentCost;
        worstParent = p;
      }
    }
    population[worstParent] = new Map(osp);
    popCosts[worstParent] = ospCost;
  }

  /**
   * Initializes and runs the HE algorithm to generate a solution
   * @param graph
   */
  public generateSolution(graph: any): ColoringSolution {
    console.log('Color ' + this.getID());
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    // initialize the algorithm params
    this.Init();

    const n = graph.getNodesCount();
    const parents = new Array<number>(2).fill(0);
    this.config.maxTabuIter = this.config.maxTabuIter * n;

    // a population is comprised of colorings
    const population = new Array<Map<string, number>>(this.config.popSize).fill(null).map(
      () => new Map<string, number>()
    );

    const popCosts = new Array<number>(this.config.popSize);

    // final population after local search
    let osp = new Map<string, number>();

    // generate the initial solution using DSatur
    const constructiveAlgo = new DSaturStrategy(this.colorGenerator);
    const initialSolution = constructiveAlgo.generateSolution(graph);
    if (initialSolution === null || initialSolution === undefined) {
      console.error('Could not color graph with initial algo!');
    }
    this.numChecks = initialSolution.numConfChecks;
    let bestColoring = initialSolution.coloring;

    // the number of unique colors used in the initial solution
    let numColors = this.getNumberOfColors();

    numColors -= 1;

    // cache main loop vars
    let cost = 0;
    let foundSol = false;

    // MAIN LOOP
    while (this.numChecks < this.config.maxChecks && numColors + 1 > this.config.colorTarget) {
      foundSol = false;

      // build the initial population
      for (let i = 0; i < this.config.popSize; i++) {
        this.InitializeColoringForHEA(graph, population[i], numColors);

        // check for optimal solution
        if (this.isSolutionOptimal(population[i], numColors, graph)) {
          foundSol = true;
          osp = population[i];
          break;
        }
        // check for max checks limit and save current solution
        if (this.numChecks > this.config.maxChecks) {
          osp = population[i];
          break;
        }

        // improve it via tabu search
        popCosts[i] = this.Tabu(graph, population[i], numColors);

        // check for optimal solution after tabu
        if (popCosts[i] === 0) {
          foundSol = true;
          osp = population[i];
          break;
        }
        // check for max checks limit and save current solution
        if (this.numChecks > this.config.maxChecks) {
          osp = population[i];
          break;
        }
      }

      // Evolve the population
      cost = 1;
      let bestCost = Number.MAX_SAFE_INTEGER;

      // EVOLUTIONARY LOOP
      while (this.numChecks < this.config.maxChecks && !foundSol) {

        // DO CROSSOVER
        osp = this.crossover(parents, graph, numColors, population);

        // improve offspring via tabu search
        cost = this.Tabu(graph, osp, numColors);

        // REPLACE weakest parent with offspring
        this.replace(population, parents, osp, popCosts, cost);

        if (cost < bestCost) {
          bestCost = cost;
        }
        if (bestCost === 0) {
          foundSol = true;
        }
      }

      if (foundSol) {
        bestColoring = osp;
        break;
      } else {
        console.warn('No solution was found using ', this.getID(),
        ' reverting to constructive algo sol.');
      }
      numColors--;
    }
    return new ColoringSolution(bestColoring, numColors + 1, this.numChecks);
  }

  public getID(): string {
    return 'hea';
  }
}
