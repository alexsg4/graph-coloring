import { Injectable, Inject } from '@angular/core';
import { ColoringStrategy } from './coloring-strategy/coloring-strategy';
import { isNullOrUndefined } from 'util';

@Injectable()
export class ColoringService {
  constructor(@Inject(ColoringStrategy) private strategies: Array<ColoringStrategy>) { }

  applyColoringStrategy(graph: any, strategyId: string) {
    if (isNullOrUndefined(graph)) {
      console.error('Graph is null!');
      return null;
    }
    const strategy = this.strategies.find((strategyToFind) => {
      return strategyToFind.getID() === strategyId;
    });

    if (isNullOrUndefined(strategy)) {
      console.warn('Strategy ' + strategyId + 'does not exist!');
      return null;
    }
    return strategy.generateSolution(graph);
  }
}
