export class ColoringSolution {
  coloring: Map<string, number>;
  numConfChecks: number;

  constructor(coloring: Map<string, number>, numChecks = 0) {
    this.coloring = coloring;
    this.numConfChecks = numChecks;
  }
}
