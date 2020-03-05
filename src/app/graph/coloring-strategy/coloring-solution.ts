import { isNullOrUndefined } from 'util';

export class ColoringSolution {
  coloring: Map<string, number>;
  numColors: number;
  numConfChecks: number;

  constructor(coloring: Map<string, number>, numColors: number, numChecks = 0) {
    this.coloring = coloring;
    this.numColors = numColors;
    this.numConfChecks = numChecks;
  }

  public isValid(graph: any): boolean {
    if (isNullOrUndefined(this.coloring)) {
      console.error('isSolutionValid: coloring is null or undefined.');
      return undefined;
    }

    if (isNullOrUndefined(graph)) {
      console.error('isSolutionValid: graph is null or undefined.');
      return undefined;
    }

    for (const node of graph.nodes()) {
      for (const neighbourNodeId of graph.getAdjList(node.id)) {
        if (this.coloring.get(node.id) === this.coloring.get(neighbourNodeId)) {
          return false;
        }
      }
    }
    return true;
  }
}
