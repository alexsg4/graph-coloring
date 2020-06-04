export class ColoringSolution {
  coloring: Map<string, number>;
  numColors: number;
  numConfChecks: number;

  /**
   * Class for storing a coloring solution for a graph
   *
   * @param coloring - a map assigning a color id to a single node's id in the graph
   * @param numColors - the number of color classes used
   * @param numChecks - the number of clash checks performed when building the solution
   */
  constructor(coloring: Map<string, number>, numColors: number, numChecks = 0) {
    this.coloring = coloring;
    this.numColors = numColors;
    this.numConfChecks = numChecks;
  }

  /**
   * Checks if the solution is valid (i.e. no 2 adjacent nodes have the same color)
   *
   * @param graph - the graph we operate on
   */
  public isValid(graph: any): boolean {
    if (this.coloring === null || this.coloring === undefined) {
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
