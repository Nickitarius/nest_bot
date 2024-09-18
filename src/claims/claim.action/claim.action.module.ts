import { forwardRef, Module } from '@nestjs/common';
import { ClaimActionService } from './claim.action.service';
import { ClaimActionUpdates } from './claim.action.updates';
import { ClaimsModule } from '../claims.module';
import { ClaimsService } from '../claims.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [forwardRef(() => ClaimsModule), HttpModule],
  providers: [ClaimActionService, ClaimActionUpdates, ClaimsService],
  exports: [ClaimActionModule],
})
export class ClaimActionModule {}
