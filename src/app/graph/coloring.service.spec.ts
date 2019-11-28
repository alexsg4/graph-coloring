import { TestBed } from '@angular/core/testing';

import { ColoringService } from './coloring.service';

describe('ColoringService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ColoringService = TestBed.get(ColoringService);
    expect(service).toBeTruthy();
  });
});
