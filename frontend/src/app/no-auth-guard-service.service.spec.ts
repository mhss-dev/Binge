import { TestBed } from '@angular/core/testing';

import { NoAuthGuardServiceService } from './no-auth-guard-service.service';

describe('NoAuthGuardServiceService', () => {
  let service: NoAuthGuardServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoAuthGuardServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
