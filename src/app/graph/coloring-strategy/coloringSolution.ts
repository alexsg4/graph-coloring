export class ColoringSolution {
  coloring: Map<number, Array<string>>;
  numConfChecks: number;

  constructor(coloring: Map<number, Array<string>>, numChecks = 0) {
    this.coloring = coloring;
    this.numConfChecks = numChecks;
  }
}
