// Set of helper functions used by tabu search

/**
 * Initializes the 'bookeeping' arrays for the tabu heuristic
 *
 * @param nodesByColor - keeps track of all node ids per color class as well as their total
 * @param nbcPos - the order of every node in its color class sublist
 * (i.e. column index on the line corresponding to its color in nodesByColor)
 * @param conflicts - number of conflicts
 * @param tabuStatus - keeps track of what moves are taboo and for how long
 * @param graph - the graph we operate on
 * @param coloring - the current coloring
 * @param numColors - the number of color classes currently used
 *
 * @returns numChecks - number of clash checks performed
 */
function InitializeArrays(
  nodesByColor: any,
  nbcPos: any,
  conflicts: any,
  tabuStatus: any,
  graph: any,
  coloring: Map<string, number>,
  numColors: number
): number {

  const nodes = graph.nodes();
  const n = nodes.length;
  let numChecks = 0;

  for (let i = 0; i <= numColors; i++) {
    nodesByColor[i] = new Array<number>(n + 1).fill(0);
    conflicts[i] = new Array<number>(n + 1).fill(0);
  }

  for (let i = 0; i < n; i++) {
    tabuStatus[i] = new Array<number>(numColors + 1).fill(0);
  }

  for (let i = 0; i < n; i++) {
    const col = coloring.get(nodes[i].id);
    // count the number of nodes per color class on the first column
    nodesByColor[col][0]++;
    nbcPos[i] = nodesByColor[col][0];
    nodesByColor[col][nbcPos[i]] = i;
  }

  // init conflicts array
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      numChecks++;
      if (graph.hasEdgeBetween(nodes[i].id, nodes[j].id)) {
        const col = coloring.get(nodes[j].id);
        if (parseInt(nodes[i].id, 10) !== i || parseInt(nodes[j].id, 10) !== j) {
          console.warn('Node ID different from index!');
        }
        conflicts[col][i]++;
      }
    }
  }
  return numChecks;
}

/**
 * Move bestNode to color class bestColor
 * @param bestNode - the node's integer index (not id)
 * @param bestColor - the color class's index
 * @param graph - graph
 * @param coloring - current coloring
 * @param conflicts
 * @param nodesInConflict
 * @param confPos
 * @param tabuStatus
 * @param totalIter
 * @param tenure - tabu tenure
 *
 * @returns numChecks - number of clash checks performed
 */
function MoveNodeToColor(
  bestNode, bestColor, graph, coloring, conflicts, nodesInConflict,
  confPos, tabuStatus, totalIter, tenure) {

    let numChecks = 0;
    const nodes = graph.nodes();
    const bestNodeId = nodes[bestNode].id;
    const oldColor = coloring.get(bestNodeId);
    coloring.set(bestNodeId, bestColor);

    // If bestNode is not a conflict node anymore, remove it from the list
    numChecks += 2;
    if (conflicts[oldColor][bestNode] > 0 && conflicts[bestColor][bestNode] === 0) {
      confPos[nodesInConflict[nodesInConflict[0]]] = confPos[bestNode];
      nodesInConflict[confPos[bestNode]] = nodesInConflict[nodesInConflict[0]];
      nodesInConflict[0]--;
    } else {
      numChecks += 2;
      // If bestNode becomes a conflict node, add it to the list
      if (conflicts[oldColor][bestNode] === 0 && conflicts[bestColor][bestNode] > 0) {
        nodesInConflict[0]++;
        confPos[bestNode] = nodesInConflict[0];
        nodesInConflict[confPos[bestNode]] = bestNode;
      }
    }

    // Update the conflicts of the neighbors.
    numChecks++;
    const bestNodeNeighbors = graph.getAdjList(bestNodeId);
    for (const nb of bestNodeNeighbors) {
      numChecks += 2;
      // this works because we rebuild the graph with the correct ids
      const nbId = parseInt(nb, 10);
      conflicts[oldColor][nbId]--;
      if (conflicts[oldColor][nbId] === 0 && coloring.get(nb) === oldColor) {
        // Remove nb from the list of conflicting nodes if there are 0 conflicts in
        // its own color
        confPos[nodesInConflict[nodesInConflict[0]]] = confPos[nbId];
        nodesInConflict[confPos[nbId]] = nodesInConflict[nodesInConflict[0]--];
      }
      // Increase the number of conflicts in the new color
      numChecks++;
      conflicts[bestColor][nbId]++;
      if (conflicts[bestColor][nbId] === 1 && coloring.get(nb) === bestColor) {
        // Add nb from the list conflicting nodes if there is a new conflict in
        // its own color
        nodesInConflict[0]++;
        confPos[nbId] = nodesInConflict[0];
        nodesInConflict[confPos[nbId]] = nbId;
      }
    }
    // Set the tabu status
    tabuStatus[bestNode][oldColor] = totalIter + tenure;

    return numChecks;
}

/**
 * Runs Tabu search for a graph's coloring solution
 * @param graph - the graph
 * @param coloring - initial solution
 * @param numColors - desired color classes
 * @param tabuTenure - used for blocking color moves
 * @param iterLimit - stopping criteria: tabu iterations (-1 for 'infinite')
 * @param checkLimit - stopping criteria: clash checks (-1 for 'infinite')
 * @param numChecks - initial number of clash checks ran by the algo that uses tabu search
 */
export function Tabu(
  graph: any,
  coloring: Map<string, number>,
  numColors: number,
  tabuTenure: number,
  iterLimit: number,
  checkLimit: number,
  numChecks: number
): [number, number] {

  const n = graph.getNodesCount();
  const nodesByColor = new Array<Array<number>>(numColors + 1);
  const conflicts = new Array<Array<number>>(numColors + 1);
  const tabuStatus = new Array<Array<number>>(n);
  const nbcPos = new Array<number>(n + 1).fill(0);
  const nodesInConflict = new Array<number>(n + 1).fill(0);
  const confPos = new Array<number>(n).fill(0);
  const nodes = graph.nodes();

  InitializeArrays(nodesByColor, nbcPos, conflicts, tabuStatus, graph, coloring, numColors);

  let cost = 0;
  nodesInConflict[0] = 0;
  for (let i = 0; i < n; i++) {
    numChecks++;
    const nodeID = nodes[i].id;
    const col = coloring.get(nodeID);
    const nConflicts = conflicts[col][i];
    if (nConflicts > 0) {
      nodesInConflict[0]++;
      confPos[i] = nodesInConflict[0];
      nodesInConflict[confPos[i]] = i;

      cost += nConflicts;
    }
  }
  cost = Math.floor(cost / 2);

  // least number of conflicts
  let bestSolValue = cost;
  // in case we found a legal coloring with numColors
  if (bestSolValue === 0) {
    return [0, numChecks];
  }

  let minSol = n;
  let maxSol = 0;

  let totalIter = 0;

  // TABU LOOP
  while ((totalIter < iterLimit && iterLimit > 0) || (numChecks < checkLimit && checkLimit > 0)) {
    totalIter++;

    const nc = nodesInConflict[0];

    let bestNode = -1;
    let bestCol = -1;
    let bestCost = n * n;
    let numBest = 0;

    // try to move every node in conflict to a color different than its own
    for (let i = 1; i <= nodesInConflict[0]; i++) {
      const node = nodesInConflict[i];
      for (let c = 1; c <= numColors; c++) {
        if (c === coloring.get(nodes[node].id)) {
          continue; // we don't care about the node's current color
        }
        numChecks += 2;
        const col = coloring.get(nodes[node].id);
        const newCost = cost + conflicts[c][node] - conflicts[col][node];
        if (newCost <= bestCost && c !== col) {
          if (newCost < bestCost) {
            numBest = 0;
          }
          if (tabuStatus[node][c] < totalIter || newCost < bestCost) {
            // Select the nth move with probability 1/n
            if (Math.floor(Math.random() * (numBest + 1)) === 0) {
              bestNode = node;
              bestCol = c;
              bestCost = newCost;
            }
          }
          numBest += 1; // count the number of moves
        }
      }
    }

    // if we only found tabu moves, then take a random move
    if (bestNode === -1) {
      bestNode = Math.floor(Math.random() * n);
      bestCol = Math.floor(Math.random() * numColors) + 1;
      const col = coloring.get(nodes[bestNode].id);

      while (bestCol !== col) {
        bestCol = Math.floor(Math.random() * numColors) + 1;
        numChecks += 2;
        bestCost = cost + conflicts[bestCol][bestNode] - conflicts[col][bestNode];
      }
    }

    let tenure = tabuTenure;
    numChecks += MoveNodeToColor(bestNode, bestCol, graph, coloring, conflicts,
      nodesInConflict, confPos, tabuStatus, totalIter, tenure);

    cost = bestCost;
    // update the tabu tenure - we're using static tenure for now
    tenure = Math.floor(0.6 * nc) + Math.floor(Math.random() * 10);

    // check: have we a new globally best solution?
    if (cost < bestSolValue) {
      bestSolValue = cost;

      // If all nodes are colored we report success and stop iterating
      if (bestSolValue === 0) {
        break;
      }
      // Otherwise reinitialize some values
      minSol = n * n;
      maxSol = 0;
    }
  }
  return [cost, numChecks];
}
