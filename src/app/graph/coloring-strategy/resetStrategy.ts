import { ColoringStrategy } from './coloring-strategy';

export class ResetStrategy extends ColoringStrategy {

  public generateSolution(graph: any): Map<number, Array<string>> {
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
    const solution = new Map<number, Array<string>>();
    solution.set(0x0, nodeIds);

    return solution;
  }

  public getID(): string {
    return 'reset';
  }
}
