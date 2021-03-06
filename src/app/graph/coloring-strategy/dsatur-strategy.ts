import { ColoringStrategy } from './coloring-strategy';
import { ColoringSolution } from './coloring-solution';
import { Injectable } from '@angular/core';
import * as ConstructiveHelpers from './helpers/constructive-algo';

@Injectable()
export class DSaturStrategy extends ColoringStrategy {

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
      const [feasible, nchecks] = ConstructiveHelpers.isColorFeasible(color, node, nodeColoring, graph);
      this.numChecks += nchecks;
      if (feasible) {
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
    
    // DISABLE SHUFFLE for consistency
    //this.shuffleArray(nodeIds);

    // then sort based on degree
    // ES6 sort is NOT STABLE
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
      const otherNode = nodeIds[i];
      if (graph.hasEdgeBetween(node, otherNode)) {
        saturation[otherNode]++;
      }
    }

    let maxSaturation: number;
    let nodeIndex = nodeIds.length - 1;
    while (nodeIds.length > 0) {
      maxSaturation = -1;
      for (let i = nodeIndex; i >= 0; i--) {
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
          const otherNode = nodeIds[i];
          if (graph.hasEdgeBetween(currentNode, otherNode)) {
            saturation[otherNode]++;
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
