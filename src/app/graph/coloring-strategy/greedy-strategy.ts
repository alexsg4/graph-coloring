import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloring-solution';
import { Injectable } from '@angular/core';
import * as ConstructiveHelpers from './helpers/constructive-algo';

@Injectable()
export class SimpleGreedyStrategy extends ColoringStrategy {

  public generateSolution(graph: any): ColoringSolution {
    console.log('Color SimpleGreedy!');
    if (graph === null || graph === undefined) {
      console.error('No graph defined');
      return;
    }

    this.Init();

    // init and shuffle array of node indices
    const nodeIds = new Array<string>(graph.getNodesCount());
    let k = 0;
    for (const node of graph.nodes()) {
      nodeIds[k++] = node.id;
    }
    this.shuffleArray(nodeIds);

    const nodeColoring = new Map<string, number>();

    let color = this.getNumberOfColors() - 1;
    nodeColoring.set(nodeIds[0], color);

    let j = 0;
    for (const node of nodeIds) {
      if (node === nodeIds[0]) {
        continue;
      }
      const numColoredNodes = nodeColoring.size;
      for (j = 0; j < numColoredNodes; j++) {
        color = this.getNumberOfColors() - 1;
        const [feasible, nchecks] = ConstructiveHelpers.isColorFeasible(color, node, nodeColoring, graph);
        this.numChecks += nchecks;
        if (feasible) {
          nodeColoring.set(node, color);
          break;
        }
      }
      if (j >= numColoredNodes) {
        color = this.generateUniqueColor();
        nodeColoring.set(node, color);
      }
    }

    return new ColoringSolution(nodeColoring, this.getNumberOfColors(), this.numChecks);
  }

  public getID(): string {
    return 'simpleGreedy';
  }
}
