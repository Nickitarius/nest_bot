import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getBotToken } from 'nestjs-telegraf';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3900);
}
bootstrap();

const API_URL = 'localhost';
const API_PORT = 3901;
const API_USER = 'usr';
const API_PASS = 'pass';
