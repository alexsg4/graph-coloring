import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloring-solution';
import { isNullOrUndefined } from 'util';

export class SimpleGreedyStrategy extends ColoringStrategy {

  private isColorFeasible(
    color: number,
    node: string,
    graphColoring: Map<string, number>,
    graph: any
    ): boolean {

    this.numChecks++;

    let numColoredNodes = 0;
    for (const entry of graphColoring.entries()) {
      if (entry[1] === color) {
        numColoredNodes++;
      }
    }
    if (numColoredNodes > graph.degree(node)) {
      for (const adj of graph.getAdjList(node)) {
        this.numChecks++;
        if (graphColoring.get(adj) === color) {
          return false;
        }
      }
      return true;
    } else {
      for (const coloredNode of graphColoring.keys()) {
        this.numChecks++;
        if (graphColoring.get(coloredNode) === color && graph.hasEdgeBetween(node, coloredNode)) {
          return false;
        }
      }
      return true;
    }
  }

  public generateSolution(graph: any): ColoringSolution {
    console.log('Color SimpleGreedy!');
    if (isNullOrUndefined(graph)) {
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

    let color = this.getLastColor();
    nodeColoring.set(nodeIds[0], color);

    let j = 0;
    for (const node of nodeIds) {
      // skip first element - TODO check if we can init cand sol in the loops
      if (node === nodeIds[0]) {
        continue;
      }
      const numColoredNodes = nodeColoring.size;
      for (j = 0; j < numColoredNodes; j++) {
        color = this.getLastColor();
        if (this.isColorFeasible(color, node, nodeColoring, graph)) {
          nodeColoring.set(node, color);
          break;
        }
      }
      if (j >= numColoredNodes) {
        color = this.generateUniqueColor();
        nodeColoring.set(node, color);
      }
    }

    return new ColoringSolution(nodeColoring, this.getLastColor(), this.numChecks);
  }

  public getID(): string {
    return 'simpleGreedy';
  }
}
