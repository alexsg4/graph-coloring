import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloring-solution';
import { isNullOrUndefined } from 'util';

export class DSaturStrategy extends ColoringStrategy {

  private isColorFeasible(
    color: number,
    node: string,
    graphColoring: Map<string, number>,
    graph
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

  private assignColorDSatur(
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

    for (let color = 0; color < this.getLastColor(); color++) {
      if (this.isColorFeasible(color, node, nodeColoring, graph)) {
        foundColor = true;
        nodeColoring.set(node, color);

        // update saturation degrees
        for (let i = 0; i < saturation.length; i++) {
          this.numChecks++;
          if (graph.hasEdgeBetween(node, nodeIds[i])) {
            alreadyAdj = false;
            for (const coloredNode of nodeColoring.keys()) {
              this.numChecks++;
              if (nodeColoring.get(coloredNode) === color && graph.hasEdgeBetween(coloredNode, nodeIds[i])) {
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
    if (isNullOrUndefined(graph)) {
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
    // usually this is implemented as a O(n*log(n)) STABLE sort
    nodeIds.sort((lhs: string, rhs: string) => {
      return (graph.degree(lhs) - graph.degree(rhs));
    });

    const nodesCount = graph.getNodesCount();
    // keep track of each node's color
    const nodeColoring = new Map<string, number>();

    // keep track of each node's saturation
    const saturation = new Array<number>(nodesCount).fill(0);

    let color = this.generateUniqueColor();
    const node = nodeIds.pop();
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
      const foundColor = this.assignColorDSatur(graph, nodeIndex, nodeIds, saturation, nodeColoring);
      if (!foundColor) {
        color = this.generateUniqueColor();
        const currentNode = nodeIds[nodeIndex];
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
    return new ColoringSolution(nodeColoring, this.getLastColor(), this.numChecks);
  }

  public getID(): string {
    return 'dSatur';
  }
}
