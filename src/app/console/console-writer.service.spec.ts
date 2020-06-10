import { TestBed } from '@angular/core/testing';

import { ConsoleWriterService } from './console-writer.service';

describe('ConsoleWriterService', () => {
  let service: ConsoleWriterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsoleWriterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
