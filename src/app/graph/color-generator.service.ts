import { Injectable } from '@angular/core';
import * as gen from 'color-generator';

@Injectable({
  providedIn: 'root'
})
export class ColorGeneratorService {
  colors: string[];

  // generate a unique color and return its id
  public generateColor(): number {
    let color = gen().hexString();
    while (this.colors.includes(color)) {
      color = gen().hexString();
    }
    this.colors.push(color);
    return this.colors.length - 1;
  }

  public getColorByIndex(index: number): string {
    if (index >= 0 && index < this.colors.length) {
      return this.colors[index];
    }
    return undefined;
  }

  public fill(numColors: number) {
    for (let i = 0; i < numColors; i++) {
      this.generateColor();
    }
  }

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

  public getNumColors(): number {
    return this.colors.length;
  }

  constructor() {
    this.colors = new Array<string>();
  }
}
