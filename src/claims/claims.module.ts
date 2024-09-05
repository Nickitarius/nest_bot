import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsUpdate } from './claims.update';

@Module({
  providers: [ClaimsService, ClaimsUpdate],
})
export class ClaimsModule {}
