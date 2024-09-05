import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { AppService } from './app.service';
import { ClaimsModule } from './claims/claims.module';
import { AppController } from './app.controller';

// import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: '7427864021:AAEzpz80ZfPEQnYMkPsKeKzO2O913kl_xGw',
      include: [ClaimsModule],
    }),
    ClaimsModule,
  ],
  // controllers: [AppController], //, BotControllerController],
  // providers: [AppService],
})
export class AppModule {}

// TelegrafModule.forRoot({
//   token: '7427864021:AAEzpz80ZfPEQnYMkPsKeKzO2O913kl_xGw',
//   // useFactory: (configService: ConfigService) => ({
//   //   token: configService.get<string>('TELEGRAM_BOT_TOKEN'),
//   //   launchOptions: {
//   //     webhook: {
//   //       domain: 'domain.tld',
//   //       path: '/secret-path',
//   //     },
//   //   },
//   // }),
//   // inject: [ConfigService],

// }),
// BotModule,
