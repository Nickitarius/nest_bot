import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsUpdate } from './claims.update';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [ClaimsService, ClaimsUpdate],
})
export class ClaimsModule {}
