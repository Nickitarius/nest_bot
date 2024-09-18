import { forwardRef, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ClaimNotificationController } from './claim.notification.controller';
import { ClaimsModule } from '../claims.module';

@Module({
  imports: [forwardRef(() => ClaimsModule)],
  providers: [NotificationService],
  controllers: [ClaimNotificationController],
})
export class NotificationModule {}
