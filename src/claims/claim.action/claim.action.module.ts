import { forwardRef, Module } from '@nestjs/common';
import { ClaimsModule } from '../claims.module';
import { ClaimActionService } from './claim.action.service';
import { ClaimActionUpdates } from './claim.action.updates';

@Module({
  imports: [forwardRef(() => ClaimsModule)],
  providers: [ClaimActionService, ClaimActionUpdates],
  exports: [ClaimActionService],
})
export class ClaimActionModule {}
