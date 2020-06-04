import { Injectable } from '@angular/core';
import * as gen from 'color-generator';

@Injectable({
  providedIn: 'root'
})
export class ColorGeneratorService {
  colors: string[];

  /**
   * Generate a unique color and return its index
   * (length of the colors array - 1)
   */
  public generateColor(): number {
    let color = gen().hexString();
    while (this.colors.includes(color)) {
      color = gen().hexString();
    }
    this.colors.push(color);
    return this.colors.length - 1;
  }

  /**
   * Return a color's hex value given an index (when possible)
   * @param index positive integer, index of the desired color
   */
  public getColorByIndex(index: number): string {
    if (index >= 0 && index < this.colors.length) {
      return this.colors[index];
    }
    return undefined;
  }

  /**
   * Fill the colors array with up to numColors color classes
   * @param numColors - new size of the array
   */
  public fill(numColors: number) {
    for (let i = 0; i < numColors; i++) {
      this.generateColor();
    }
  }

  /**
   * Shrink or fill the colors array to contain exactly numColors color classes
   * @param numColors - desired number of colors
   */
  public resize(numColors: number) {
    if (numColors <= 0) {
      console.warn('Invalid num colors.');
      return;
    }

    const n = this.colors.length;
    if (n < numColors) {
      for (let i = 0; i < numColors - n; i++) {
        this.generateColor();
      }
    } else if (n > numColors) {
      this.colors.splice(numColors, n - numColors);
    }
  }

  /**
   * Get the size of the colors array
   */
  public getNumColors(): number {
    return this.colors.length;
  }

  constructor() {
    this.colors = new Array<string>();
  }
}
