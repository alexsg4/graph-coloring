import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloringSolution';

export class DSaturStrategy extends ColoringStrategy {

  private isColorFeasible(
    color: number,
    candSol: Map<number, Array<string>>,
    node: string,
    graphColoring: Map<string, number>,
    graph
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

  private assignColorDSatur(
    candSol: Map<number, Array<string>>,
    graph,
    nodeIndex: number,
    nodeIds: Array<string>,
    saturation: Array<number>,
    nodeColoring: Map<string, number>
  ): boolean {

    let foundColor = false;
    let alreadyAdj = false;
    if (nodeIndex < 0 || nodeIndex >= nodeIds.length) {
      console.error('Node index out of range!');
    }
    const node = nodeIds[nodeIndex];

    for (const color of candSol.keys()) {
      if (this.isColorFeasible(color, candSol, node, nodeColoring, graph)) {
        foundColor = true;
        candSol.get(color).push(node);
        nodeColoring.set(node, color);

        // update saturation degrees
        for (let i = 0; i < saturation.length; i++) {
          this.numChecks++;
          if (graph.hasEdgeBetween(node, nodeIds[i])) {
            alreadyAdj = false;
            for (const coloredNode of candSol.get(color)) {
              this.numChecks++;
              if (graph.hasEdgeBetween(coloredNode, nodeIds[i])) {
                alreadyAdj = true;
                break;
              }
            }
            if (!alreadyAdj) {
              saturation[i]++;
            }
          }
        }
      }
      if (foundColor) {
        return true;
      }
    }

    return false;
  }

  public generateSolution(graph: any): ColoringSolution {
    console.log('Color ' + this.getID());
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    this.Init();

    // init and shuffle array of node indices
    const nodeIds = new Array<string>(graph.getNodesCount());
    let k = 0;
    // tslint:disable-next-line: no-shadowed-variable
    for (const node of graph.nodes()) {
      nodeIds[k++] = node.id;
    }
    this.shuffleArray(nodeIds);

    // then sort based on degree
    // usually this is implemented as a nlogn STABLE sort, not sure we need the shuffle
    nodeIds.sort((lhs: string, rhs: string) => {
      return (graph.degree(lhs) - graph.degree(rhs));
    });

    const nodesCount = graph.getNodesCount();
    // keep track of each node's color
    const nodeColoring = new Map<string, number>();

    // keep track of each node's saturation
    const saturation = new Array<number>(nodesCount).fill(0);

    const candSol = new Map<number, Array<string>>();
    let color = this.generateUniqueColor();
    candSol.set(color, new Array<string>());
    const node = nodeIds.pop();
    candSol.get(color).push(node);
    nodeColoring.set(node, color);
    saturation.pop();
    for (let i = 0; i < saturation.length; i++) {
      this.numChecks++;
      if (graph.hasEdgeBetween(node, nodeIds[i])) {
        saturation[i]++;
      }
    }

    let maxSaturation: number;
    let nodeIndex = 0;
    while (nodeIds.length > 0) {
      maxSaturation = -1;
      for (let i = 0; i < saturation.length; i++) {
        if (saturation[i] > maxSaturation) {
          maxSaturation = saturation[i];
          nodeIndex = i;
        }
      }
      const foundColor = this.assignColorDSatur(candSol, graph, nodeIndex, nodeIds, saturation, nodeColoring);
      if (!foundColor) {
        color = this.generateUniqueColor();
        candSol.set(color, new Array<string>());
        const currentNode = nodeIds[nodeIndex];
        candSol.get(color).push(currentNode);
        nodeColoring.set(currentNode, color);

        for (let i = 0; i < nodeIds.length; i++) {
          if (graph.hasEdgeBetween(currentNode, nodeIds[i])) {
            saturation[i]++;
          }
        }
      }
      nodeIds.splice(nodeIndex, 1);
      saturation.splice(nodeIndex, 1);

    }
    return new ColoringSolution(candSol, this.numChecks);
  }

  public getID(): string {
    return 'dSatur';
  }
}
