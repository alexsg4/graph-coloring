import { ColoringSolution } from './coloring-solution';
import { ColorGeneratorService } from '../color-generator.service';
import { Inject, Injectable } from '@angular/core';

@Injectable()
export abstract class ColoringStrategy {
  protected numChecks = 0;

  constructor(@Inject(ColorGeneratorService) protected colorGenerator: ColorGeneratorService) {
    this.Init();
  }

  /**
   * Reset the color generator and generate one color
   */
  protected Init() {
    this.colorGenerator.colors.length = 0;
    this.generateUniqueColor();
    this.numChecks = 0;
  }

  /**
   * Generate a coloring solution - overridden by child strategy
   * @param graph - graph to operate on
   */
  abstract generateSolution(graph: any): ColoringSolution;

  /**
   * Store and return the strategy's identifier string
   * - overridden by child
   */
  abstract getID(): string;

  /**
   * Get a unique color from the generator service
   */
  protected generateUniqueColor(): number {
    return this.colorGenerator.generateColor();
  }

  /**
   * Get the last color's index
   */
  protected getLastColor(): number {
    return this.colorGenerator.getNumColors() - 1;
  }

  /**
   * Get a color's hex value by index (when possible)
   */
  public getColorById(id: number) {
    return this.colorGenerator.getColorByIndex(id);
  }

  /**
   * Apply a Fisher-Yates in-place shuffle to an array
   * @param array - array that's modified in place
   */
  protected shuffleArray<T>(array: Array<T>): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}
