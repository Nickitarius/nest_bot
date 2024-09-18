import { Test, TestingModule } from '@nestjs/testing';
import { ClaimActionService } from './claim.action.service';

describe('ClaimActionService', () => {
  let service: ClaimActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClaimActionService],
    }).compile();

    service = module.get<ClaimActionService>(ClaimActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
