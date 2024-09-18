import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { session } from 'telegraf';
import { ClaimsModule } from './claims/claims.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.dev.env',
      isGlobal: true,
      cache: true,
    }),
    TelegrafModule.forRoot({
      token: process.env.TOKEN,
      include: [ClaimsModule],
      middlewares: [session()],
    }),
    ClaimsModule,
  ],
  // controllers: [AppController],
  // providers: [AppService],
})
export class AppModule {}
