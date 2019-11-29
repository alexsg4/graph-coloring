export abstract class ColoringStrategy {
  protected colors = new Array<number>();

  constructor() {
    // TODO reset colors before/after generating a solution
    this.colors.length = 0;
    this.generateUniqueColor();
  }

  protected generateUniqueColor(): number {
    const min = 0x555555;
    const max = 0xdddddd;
    let generatedColor = Math.floor(Math.random() * (max - min)) + min;
    while (this.colors.includes(generatedColor)) {
      generatedColor = Math.floor(Math.random() * (max - min)) + min;
    }
    this.colors.push(generatedColor);
    return generatedColor;
  }

  abstract generateSolution(graph: any): Map<number, Array<string>>;

  isSolutionValid(solution: Map<number, Array<string>>, graph: any): boolean {
    // TODO add solution validation logic
    return true;
  }

  abstract getID(): string;

  protected getLast<T>(array: Array<T>): T {
    if (array.length === 0) {
      return null;
    }
    return array[array.length - 1];
  }

  protected getLastColor(): number {
    return this.getLast(this.colors);
  }

  // Fisher-Yates shuffle
  protected shuffleArray<T>(array: Array<T>): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}
