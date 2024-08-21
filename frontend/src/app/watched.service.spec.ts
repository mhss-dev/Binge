import { TestBed } from '@angular/core/testing';

import { WatchedService } from './watched.service';

describe('WatchedService', () => {
  let service: WatchedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WatchedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
