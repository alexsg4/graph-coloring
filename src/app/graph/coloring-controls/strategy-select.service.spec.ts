import { TestBed } from '@angular/core/testing';

import { StrategySelectService } from './strategy-select.service';

describe('StrategySelectService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: StrategySelectService = TestBed.get(StrategySelectService);
    expect(service).toBeTruthy();
  });
});
