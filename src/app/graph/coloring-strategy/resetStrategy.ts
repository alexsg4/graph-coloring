import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloringSolution';

export class ResetStrategy extends ColoringStrategy {

  public generateSolution(graph: any): ColoringSolution {
    console.log('Color ' + this.getID());
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    // init array of node indices
    const nodeIds = new Array<string>(graph.getNodesCount());
    let k = 0;
    for (const node of graph.nodes()) {
      nodeIds[k++] = node.id;
    }
    const coloring = new Map<string, number>();
    for (const node of nodeIds) {
      coloring.set(node, 0x0);
    }

    const solution = new ColoringSolution(coloring);
    return solution;
  }

  public getID(): string {
    return 'reset';
  }
}
