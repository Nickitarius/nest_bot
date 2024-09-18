import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ClaimActionModule } from './claim.action/claim.action.module';
import { NotificationModule } from './claim.notification/notification.module';
import { ClaimsService } from './claims.service';
import { ClaimsUpdate } from './claims.update';
import { CommentScene } from './scenes/comment.scene';
import { StartScene } from './scenes/start.scene';

@Module({
  imports: [
    HttpModule,
    NotificationModule,
    forwardRef(() => ClaimActionModule),
  ],
  providers: [ClaimsService, ClaimsUpdate, CommentScene, StartScene],
  exports: [ClaimsService],
})
export class ClaimsModule {}
