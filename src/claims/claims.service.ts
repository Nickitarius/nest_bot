import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Context } from 'telegraf';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class ClaimsService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(ClaimsService.name);

  echo(text: string): string {
    return `Echo: ${text}`;
  }

  async getShortClaims(context: Context): Promise<string> {
    const uuidOne = uuidV4();

    let user;
    try {
      user = context.callbackQuery.from;
    } catch {
      user = context.update?.['message'].from;
    }

    const apiClaims = `http://${process.env.API_URL}:${process.env.API_PORT}/claims?uid=${user.id}`;
    const requestConfig = {
      auth: {
        username: process.env.API_USER,
        password: process.env.API_PASS,
      },
    };

    let response;
    try {
      this.logger.log(`${user.id}(${user.username}) Request ${apiClaims}`);
      response = await firstValueFrom(
        this.httpService.get(apiClaims, requestConfig).pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data);
            throw error.response.data;
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `UUID: ${uuidOne} USER_ID: ${user.id} CODE: ${error.statusCode} DATA: ${JSON.stringify(error)}`,
      );

      return `Что то пошло не так:\nUUID: ${uuidOne}\nUSER_ID: {user.id}\nCODE: ${error.statusCode}\nDATA: ${error.message}\n\nОбратитесь к администратору`;
    }
    const data = response.data;

    console.log(data);
    return data;
  }
}
