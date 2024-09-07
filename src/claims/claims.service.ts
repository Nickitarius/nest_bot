import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class ClaimsService {
  constructor(private readonly httpService: HttpService) {}
  echo(text: string): string {
    return `Echo: ${text}`;
  }
  async getShortClaims(): Promise<string> {
    var uuidOne = uuidV4();

    var url = `http://${process.env.API_URL}:${process.env.API_PORT}/claims?uid=${process.env.API_USER}`;
    var requestConfig = {
      auth: { username: process.env.API_USER, password: process.env.API_PASS },
    };
    try {
      var { data } = await firstValueFrom(
        this.httpService.get(url, requestConfig).pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data);
            throw error.response.data;
          }),
        ),
      );
      console.log(data.claims);
      return data;
    } catch (error) {
      return `Что то пошло не так:\nUUID: ${uuidOne}\nUSER_ID: {user.id}\nCODE: ${error.statusCode}\nDATA: ${error.message}\n\nОбратитесь к администратору`;
    }
  }
}
