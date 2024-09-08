import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Context, Markup } from 'telegraf';
import { v4 as uuidV4 } from 'uuid';

@Injectable()
export class ClaimsService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(ClaimsService.name);

  echo(text: string): string {
    return `Echo: ${text}`;
  }

  async getShortClaims(context: Context) {
    const uuidOne = uuidV4();

    let user, query;
    try {
      query = context.callbackQuery;
      user = query.from;
    } catch {
      query = context.update?.['message'];
      user = query.from;
    }

    const apiClaims = `http://${process.env.API_URL}:${process.env.API_PORT}/claims?uid=${user.id}`;
    const requestConfig = {
      auth: {
        username: process.env.API_USER,
        password: process.env.API_PASS,
      },
    };

    let response;
    let keyboard, replyMarkup;

    try {
      this.logger.log(`${user.id}(${user.username}) Request ${apiClaims}`);
      response = await firstValueFrom(
        this.httpService.get(apiClaims, requestConfig).pipe(
          catchError((error: AxiosError) => {
            throw error.response.data;
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `UUID: ${uuidOne} USER_ID: ${user.id} CODE: ${error.statusCode} DATA: ${JSON.stringify(error)}`,
      );

      keyboard = [
        Markup.button.callback('Попробовать снова', 'getShortClaims'),
      ];
      replyMarkup = Markup.inlineKeyboard(keyboard);

      try {
        await context.editMessageText(
          `Что то пошло не так:\nUUID: ${uuidOne}\nUSER_ID: {user.id}\nCODE: ${error.statusCode}\nDATA: ${error.message}\n\nОбратитесь к администратору`,
          replyMarkup,
        );
      } catch {
        await context.reply(
          `Что то пошло не так:\nUUID: ${uuidOne}\nUSER_ID: {user.id}\nCODE: ${error.statusCode}\nDATA: ${error.message}\n\nОбратитесь к администратору`,
          replyMarkup,
        );
      }

      return;
    }

    const data = response.data;
    let page;

    if (data.length != 0) {
      const total = data.claims.length;
      let newClaims = 0;
      let takenWork = 0;
      let assigned = null;
      keyboard = [];

      data.claims.forEach((claim) => {
        claim = {
          claim_no: claim.claim_no,
          claim_addr: claim.claim_addr,
          status_id: claim.status_id,
          assigned: claim.assigned,
        };

        claim.claim_addr = claim.claim_addr.replaceAll('_', '-');
        claim.assigned = claim.assigned.replaceAll('_', '-');

        if (claim.status_id == 10 || claim.status_id == 20) {
          newClaims += 1;
        } else if (claim.status_id == 30) {
          takenWork += 1;
        }

        if (assigned == null) {
          assigned = claim.assigned;
        }

        keyboard.push(
          Markup.button.callback(claim.claim_addr, `clgt_${claim.claim_no}`),
        );
      });

      page = `***Список Заявок***\n\
      *Общее количество*:  ${total}\n\
      *Новых*: ${newClaims}\n\
      *В работе*: ${takenWork}\n\
      *Исполнитель*: ${assigned}`;
    } else {
      this.logger.log(
        `UUIF: ${uuidOne}; User: ${user.id}${user.username}; Not a single claim; data = ${JSON.stringify(data)}`,
      );

      keyboard = [
        Markup.button.callback('Попробовать снова', 'getShortClaims'),
      ];
      replyMarkup = Markup.inlineKeyboard(keyboard);

      try {
        await context.editMessageText(
          `Для вас нет заявок :(\n\nUUID: ${uuidOne}\nUserID: ${user.id}`,
          { parse_mode: 'Markdown', reply_markup: replyMarkup.reply_markup },
        );
      } catch {
        await context.reply(
          `Для вас нет заявок :(\n\nUUID: ${uuidOne}\nUserID: ${user.id}`,
          { parse_mode: 'Markdown', reply_markup: replyMarkup.reply_markup },
        );
      }

      return;
    }

    replyMarkup = Markup.inlineKeyboard(keyboard);

    try {
      await context.editMessageText(page, replyMarkup);
    } catch {
      await context.reply(page, replyMarkup);
    }

    return;
  }

  async help(context: Context) {
    const page = `Help\n\
    1. Бери заявку в работу.\n\
    2. Закрывай или возвращай обратно.\n\
    3. При недозвоне абоненту можно отправить СМС. Абонент уже не открутится что ему не звонили\\не приезжали.\n\
    4. Можно по заявке узнать логин\пароль для PPPOE.\n\
    5. Заявку в работе можно завершить, но необходимо написать комментарий, что было устранено.`;

    const keyboard = [
      Markup.button.callback('Загрузить заявки', 'getShortClaims'),
    ];
    const replyMarkup = Markup.inlineKeyboard(keyboard);

    await context.reply(page, replyMarkup);
  }
}
