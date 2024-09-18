import { Module } from '@nestjs/common';
import { ClaimNotificationController } from './claim.notification.controller';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationService],
  controllers: [ClaimNotificationController],
})
export class NotificationModule {}
