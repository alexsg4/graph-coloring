import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloring-solution';
import { Injectable } from '@angular/core';

@Injectable()
export class DSaturStrategy extends ColoringStrategy {

  /**
   * Checks if a color can be assigned to a node given the current (partial) coloring
   * i.e. there are no neighbours of node having color c
   */
  private isColorFeasible(
    color: number,
    node: string,
    graphColoring: Map<string, number>,
    graph
  ): boolean {

    this.numChecks++;

    for (const coloredNode of graphColoring.keys()) {
      this.numChecks++;
      if (graphColoring.get(coloredNode) === color && graph.hasEdgeBetween(node, coloredNode)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Try to assign a color to a node and return the status of the operation's success
   * @param graph
   * @param nodeIndex
   * @param nodeIds
   * @param saturation
   * @param nodeColoring
   */
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

    for (let color = 0; color < this.getNumberOfColors(); color++) {
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
    if (graph === null || graph === undefined) {
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

    let color = this.getNumberOfColors() - 1;
    if (color < 0) {
      console.error('Initial color has not been generated!');
    }
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
    return new ColoringSolution(nodeColoring, this.getNumberOfColors(), this.numChecks);
  }

  public getID(): string {
    return 'dSatur';
  }
}
