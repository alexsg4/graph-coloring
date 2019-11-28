import { ColoringStrategy } from './coloring-strategy';

export class DSaturStrategy extends ColoringStrategy {

  public generateSolution(graph: any): Map<number, Array<string>> {
    console.log('Color DSatur!');
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    // init and shuffle array of node indices
    const nodeIds = new Array<string>(graph.getNodesCount());
    let k = 0;
    for (const node of graph.nodes()) {
      nodeIds[k++] = node.id;
    }

    return new Map<number, Array<string>>();
  }

  public getID(): string {
    return 'dSatur';
  }
}
