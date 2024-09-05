import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3900);
}
// const BOT_TOKEN = '7427864021:AAEzpz80ZfPEQnYMkPsKeKzO2O913kl_xGw';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   const bot = app.get(getBotToken());
//   app.use(bot.webhookCallback('/secret-path'));

//   // await app.listen(3900);
// }

bootstrap();

const API_URL = 'localhost';
const API_PORT = 3901;
const API_USER = 'usr';
const API_PASS = 'pass';
