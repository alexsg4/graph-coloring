import { TestBed } from '@angular/core/testing';

import { GraphSelectService } from './graph-select.service';

describe('GraphSelectService', () => {
  let service: GraphSelectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphSelectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
