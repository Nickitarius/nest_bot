import { Test, TestingModule } from '@nestjs/testing';
import { ClaimNotificationController } from './claim.notification.controller';

describe('ClaimNotificationController', () => {
  let controller: ClaimNotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaimNotificationController],
    }).compile();

    controller = module.get<ClaimNotificationController>(
      ClaimNotificationController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
