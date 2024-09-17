import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { ClaimsModule } from './claims/claims.module';
import { session } from 'telegraf';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.dev.env', isGlobal: true }),
    TelegrafModule.forRoot({
      token: process.env.TOKEN,
      include: [ClaimsModule],
      middlewares: [session()],
    }),
    ClaimsModule,
  ],
})
export class AppModule {}
