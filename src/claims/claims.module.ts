import { forwardRef, Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsUpdate } from './claims.update';
import { HttpModule } from '@nestjs/axios';
import { CommentScene } from './scenes/comment.scene';
import { StartScene } from './scenes/start.scene';
import { NotificationModule } from './claim.notification/notification.module';
import { ClaimActionModule } from './claim.action/claim.action.module';
import { ClaimActionService } from './claim.action/claim.action.service';

@Module({
  imports: [
    HttpModule,
    NotificationModule,
    forwardRef(() => ClaimActionModule),
  ],
  providers: [
    ClaimsService,
    ClaimsUpdate,
    CommentScene,
    StartScene,
    ClaimActionService,
  ],
  exports: [ClaimsService],
})
export class ClaimsModule {}
