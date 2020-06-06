// A set of helper functions used by constructive algorithms

/**
 * Checks if a color can be assigned to a node given the current (partial) coloring
 * i.e. there are no neighbours of node having color c
 */
export function isColorFeasible(
  color: number,
  node: string,
  graphColoring: Map<string, number>,
  graph
): [boolean, number] {

  let numChecks = 1;
  let isFeasible = true;

  for (const coloredNode of graphColoring.keys()) {
    numChecks++;
    if (graphColoring.get(coloredNode) === color && graph.hasEdgeBetween(node, coloredNode)) {
      isFeasible = false;
      break;
    }
  }
  return [isFeasible, numChecks];
}
