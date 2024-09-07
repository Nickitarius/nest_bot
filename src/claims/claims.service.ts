import { HttpService } from '@nestjs/axios';
import { Catch, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { catchError, firstValueFrom, Observable } from 'rxjs';
import { v4 as uuidV4 } from 'uuid';

const API_URL = 'localhost';
const API_PORT = 3700;
const API_USER = 'usr';
const API_PASS = 'pass';

@Injectable()
export class ClaimsService {
  constructor(private readonly httpService: HttpService) {}
  echo(text: string): string {
    return `Echo: ${text}`;
  }
  async getShortClaims(): Promise<string> {
    var uuidOne = uuidV4();
    var url = `http://${API_URL}:${API_PORT}/claims?uid=${API_USER}`;
    var requestConfig = {
      auth: { username: API_USER, password: 'API_PASS' },
    };
    try {
      var { data } = await firstValueFrom(
        this.httpService.get(url, requestConfig).pipe(
          catchError((error: AxiosError) => {
            console.log(error.response.data);
            // return 'b';
            // return { data: 'b' };
            throw error.response.data;
          }),
        ),
      );
      // console.log(data.claims);
      return data;
    } catch (error) {
      // console.log(error);
      return `Что то пошло не так:\nUUID: ${uuidOne}\nUSER_ID: {}\nCODE: ${error.statusCode}\nDATA: ${error.message}\n\nОбратитесь к администратору`;
      //   "".format(
      //                 str(uuidOne),
      //                 str(user.id),
      //                 str(e),
      //                 json.loads(e.read().decode())["message"],
      //             ),
      // }

      // console.log('c');
      // return data;
    }
  }
}
