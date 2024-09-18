import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsUpdate } from './claims.update';
import { HttpModule } from '@nestjs/axios';
import { CommentScene } from './scenes/comment.scene';
import { StartScene } from './scenes/start.scene';

@Module({
  imports: [HttpModule],
  providers: [ClaimsService, ClaimsUpdate, CommentScene, StartScene],
})
export class ClaimsModule {}
