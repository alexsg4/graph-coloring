import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloringSolution';

export class SimpleGreedyStrategy extends ColoringStrategy {

  private isColorFeasible(
    color: number,
    candSol: Map<number, Array<string>>,
    node: string,
    graphColoring: Map<string, number>,
    graph: any
    ): boolean {

    this.numChecks++;
    if (candSol.get(color).length > graph.degree(node)) {
      for (const adj of graph.getAdjList(node)) {
        this.numChecks++;
        if (graphColoring.get(adj) === color) {
          return false;
        }
      }
      return true;
    } else {
      for (const coloredNode of candSol.get(color)) {
        this.numChecks++;
        if (graph.hasEdgeBetween(node, coloredNode)) {
          return false;
        }
      }
      return true;
    }
  }

  public generateSolution(graph: any): ColoringSolution {
    console.log('Color SimpleGreedy!');
    if (graph === null) {
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
    const candSol = new Map<number, Array<string>>();
    let color = this.getLastColor();
    nodeColoring.set(nodeIds[0], color);

    candSol.set(color, new Array<string>());
    candSol.get(color).push(nodeIds[0]);
    let j = 0;
    for (const node of nodeIds) {
      // skip first element - TODO check if we can init cand sol in the loops
      if (node === nodeIds[0]) {
        continue;
      }
      for (j = 0; j < candSol.size; j++) {
        color = this.getLastColor();
        if (this.isColorFeasible(color, candSol, node, nodeColoring, graph)) {
          candSol.get(color).push(node);
          nodeColoring.set(node, color);
          break;
        }
      }
      if (j >= candSol.size) {
        color = this.generateUniqueColor();
        candSol.set(color, new Array<string>());
        candSol.get(color).push(node);
        nodeColoring.set(node, color);
      }
    }

    return new ColoringSolution(candSol, this.numChecks);
  }

  public getID(): string {
    return 'simpleGreedy';
  }
}
