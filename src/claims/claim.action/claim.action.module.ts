import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ClaimActionService } from './claim.action.service';
import { ClaimActionUpdates } from './claim.action.updates';

@Module({
  imports: [
    //forwardRef(() => ClaimsModule),
    HttpModule,
  ],
  providers: [ClaimActionService, ClaimActionUpdates],
  exports: [ClaimActionService],
})
export class ClaimActionModule {}
