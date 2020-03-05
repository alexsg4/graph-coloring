import { ColoringSolution } from './coloring-solution';
import { ColorGeneratorService } from '../color-generator.service';
import { Inject } from '@angular/core';
import { isNullOrUndefined } from 'util';

export abstract class ColoringStrategy {
  protected numChecks = 0;

  constructor(@Inject(ColorGeneratorService) protected colorGenerator: ColorGeneratorService) {
    this.Init();
  }

  protected Init() {
    this.colorGenerator.colors.length = 0;
    this.generateUniqueColor();
    this.numChecks = 0;
  }

  abstract generateSolution(graph: any): ColoringSolution;

  abstract getID(): string;

  protected generateUniqueColor(): number {
    return this.colorGenerator.generateColor();
  }

  protected getLastColor(): number {
    return this.colorGenerator.getNumColors() - 1;
  }

  public getColorById(id: number) {
    return this.colorGenerator.getColorByIndex(id);
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
