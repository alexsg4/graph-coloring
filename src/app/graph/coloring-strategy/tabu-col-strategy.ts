import { ColoringStrategy } from './coloring-strategy';
import { DSaturStrategy } from './dsatur-strategy';
import { ColoringSolution } from './coloring-solution';
import { Tabu } from './helpers/tabu';

import { Injectable } from '@angular/core';
// tslint:disable:no-redundant-jsdoc

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
      for (const otherNodeId of nodeIds) {
        this.numChecks++;
        if (graph.hasEdgeBetween(nodeId, otherNodeId)) {
          const color = coloring.get(otherNodeId);
          usedColors[color] = true;
        }
      }
      // node is part of a clash so we randomly assign a different color to it
      const currentCol = coloring.get(nodeId);
      if (usedColors[currentCol]) {
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
    const coloring = new Map(bestColoring);
    // the number of unique colors used in the initial solution
    let numColors = this.getNumberOfColors();

    numColors--;
    while (this.numChecks < this.config.maxChecks && numColors + 1 > this.config.colorTarget) {
      coloring.forEach((v, k) => coloring.set(k, 0));
      this.InitializeColoringForTabu(graph, coloring, numColors);
      const[tCost, tChecks] = Tabu(graph, coloring, numColors,
        this.config.tenure, -1, this.config.maxChecks, this.numChecks);
      // update cost and clash checks after tabu search
      cost = tCost;
      this.numChecks = tChecks;
      if (cost === 0) {
        bestColoring = new Map(coloring);
        // shift colors to start from 0
        bestColoring.forEach((v, k) => bestColoring.set(k, v - 1));

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
