import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'graph-coloring';

  ngOnInit(): void {
    console.log('AppComponent: OnInit!');
  }

  /*
  generateUniqueColor(): number {
    const min = 0x0;
    const max = 0xffffff;
    let generatedColor = Math.floor(Math.random() * (max - min)) + min;
    while (colors.includes(generatedColor)) {
      generatedColor = Math.floor(Math.random() * (max - min)) + min;
    }
    colors.push(generatedColor);
    return generatedColor;
  }

  getLast<T>(array: Array<T>): T {
    if (array.length === 0) {
      return null;
    }
    return array[array.length - 1];
  }
  
  // Fisher-Yates shuffle
  shuffleArray<T>(array: Array<T>): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  isColorFeasible(color: number, candSol: Map<number, Array<string>>, node: string, graphColoring: Map<string, number>, graph): boolean {
    if (candSol.get(color).length > graph.degree(node)) {
      for (const adj of graph.getAdjList(node)) {
        if (graphColoring.get(adj) === color) {
          return false;
        }
      }
      return true;
    } else {
      for (const coloredNode of candSol.get(color)) {
        if (graph.hasEdgeBetween(node, coloredNode)) {
          return false;
        }
      }
      return true;
    }
  }

  colorSimpleGreedy(graph: any): Map<number, Array<string>> {
    console.log('Color SimpleGreedy!');
    if (graph === null) {
      console.error('No graph defined');
      return;
    }

    const nodeIds = new Array<string>(graph.getNodesCount());
    let k = 0;
    graph.nodes().forEach(node => {
      nodeIds[k++] = node.id;
    });

    const nodeColoring = new Map<string, number>();
    this.shuffleArray(nodeIds);

    nodeColoring.set(nodeIds[0], this.getLast(colors));
    const candSol = new Map<number, Array<string>>();
    let color = this.getLast(colors);
    candSol.set(color, new Array<string>());
    candSol.get(color).push(nodeIds[0]);
    let j = 0;
    for (const node of nodeIds) {
      // skip first element - TODO check if we can init cand sol in the loops
      if (node === nodeIds[0]) {
        continue;
      }
      for (j = 0; j < candSol.size; j++) {
        color = this.getLast(colors);
        if (this.isColorFeasible(color, candSol, node, nodeColoring, graph)) {
          candSol.get(color).push(node);
          nodeColoring.set(node, color);
          break;
        }
      }
      if (j >= candSol.size) {
        color = this.generateUniqueColor();
        candSol.set(color, new Array<string>());
        candSol.get(color).push(node);
        nodeColoring.set(node, color);
      }
    }

    return candSol;
  }

  colorGraph(): void {
    console.log('Color graph!');
    if (isColored) {
      console.warn('Graph is already colored. Please reset.');
      return;
    }

    colors.length = 0;
    this.generateUniqueColor();

    const solution = this.colorSimpleGreedy(sigmaInstance.graph);
    for (const coloring of solution) {
      const color = coloring[0];
      for (const nodeId of coloring[1]) {
        sigmaInstance.graph.colorNode(nodeId, color);
      }
    }
    sigmaInstance.refresh();
    isColored = true;
  }

  resetGraph(): void {
    console.log('Reset graph!');
    if (!isColored) {
      console.warn('Graph is not colored. Will not reset.');
      return;
    }
    for (const node of sigmaInstance.graph.nodes()) {
      sigmaInstance.graph.colorNode(node.id, K_NODE_COL_DEFAULT);
    }
    sigmaInstance.refresh();
    isColored = false;
  }
  */
}
