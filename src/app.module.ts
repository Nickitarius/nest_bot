import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ClaimsModule } from './claims/claims.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.dev.env', isGlobal: true }),
    TelegrafModule.forRoot({
      token: process.env.TOKEN,
      include: [ClaimsModule],
    }),
    ClaimsModule,
  ],
})
export class AppModule {}
