import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Context, Markup, Telegraf } from 'telegraf';
import { v4 as uuidV4 } from 'uuid';
import * as fs from 'fs';
import { Pagination } from '../../telegraf-pagination';
import { InjectBot } from 'nestjs-telegraf';
// import { inlineKeyboard } from 'telegraf/typings/markup';

/**
 * Returns string with all characters incompatible
 with Telegram's MarkdonwnV2 shielded.*/
function getMarkdownV2Shielded(string: string): string {
  return (
    string
      .replace(/\_/g, '\\_')
      // .replace(/\*/g, '\\*')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\~/g, '\\~')
      .replace(/\`/g, '\\`')
      .replace(/\>/g, '\\>')
      .replace(/\#/g, '\\#')
      .replace(/\+/g, '\\+')
      .replace(/\-/g, '\\-')
      .replace(/\=/g, '\\=')
      .replace(/\|/g, '\\|')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\./g, '\\.')
      .replace(/\!/g, '\\!')
  );
}

@Injectable()
export class ClaimsService {
  constructor(
    private readonly httpService: HttpService,
    @InjectBot() private bot: Telegraf<Context>,
  ) {}
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
      });

      page =
        `***Список Заявок***\n` +
        `*Общее количество*:  ${total}\n` +
        `*Новых*: ${newClaims}\n` +
        `*В работе*: ${takenWork}\n\n` +
        `*Исполнитель*: ${assigned}`;
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
          { parse_mode: 'MarkdownV2', reply_markup: replyMarkup.reply_markup },
        );
      } catch {
        await context.reply(
          `Для вас нет заявок :(\n\nUUID: ${uuidOne}\nUserID: ${user.id}`,
          { parse_mode: 'MarkdownV2', reply_markup: replyMarkup.reply_markup },
        );
      }

      return;
    }

    replyMarkup = Markup.inlineKeyboard(keyboard);

    try {
      await context.editMessageText(page, {
        reply_markup: replyMarkup.reply_markup,
        parse_mode: 'MarkdownV2',
      });
    } catch {
      await context.reply(page, {
        reply_markup: replyMarkup.reply_markup,
        parse_mode: 'MarkdownV2',
      });
    }

    return;
  }

  async help(context: Context) {
    const page =
      `Help\n` +
      `1. Бери заявку в работу.\n` +
      `2. Закрывай или возвращай обратно.\n` +
      `3. При недозвоне абоненту можно отправить СМС. Абонент уже не открутится что ему не звонили\\не приезжали.\n` +
      `4. Можно по заявке узнать логин\\пароль для PPPOE.\n` +
      `5. Заявку в работе можно завершить, но необходимо написать комментарий, что было устранено.`;

    const keyboard = [
      Markup.button.callback('Загрузить заявки', 'getShortClaims'),
    ];
    const replyMarkup = Markup.inlineKeyboard(keyboard);

    await context.reply(page, replyMarkup);
  }

  /**Replies with a paginator containing all claims.*/
  async getListClaims(context: Context) {
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

    let data;
    if (process.argv.includes('dev')) {
      this.logger.log(
        `DEV: welcome to one function:\n####UPDATE####\n${JSON.stringify(context.update)}\n####Update END####`,
      );
      data = JSON.parse(
        fs.readFileSync('data/data_just_one_entry.json', 'utf-8'), //data_just_one_entry
      );
    } else {
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
      data = response.data;
    }

    let claims = [];
    const total = data.claims.length;
    const claimsNumbers = [];

    if (data.length != 0) {
      keyboard = [];
      let tmpClaim;

      data.claims.forEach((claim) => {
        claim.claim_addr = claim.claim_addr.replaceAll('_', '-');
        claim.claim_date = claim.claim_date.replaceAll('_', '-');
        claim.client_contract = claim.client_contract.replaceAll('_', '-');
        claim.client_name = claim.client_name.replaceAll('_', '-');
        claim.claim_phone = claim.claim_phone.replaceAll('_', '-');
        claim.autor = claim.autor.replaceAll('_', '-');
        claim.assigned = claim.assigned.replaceAll('_', '-');
        claim.comment = claim.comment.replaceAll('_', '-');

        if (claim.work_commentary != undefined) {
          claim.work_commentary = claim.work_commentary.replaceAll('_', '-');
        }
        if (claim.status_name != undefined) {
          claim.status_name = claim.status_name.replaceAll('_', '-');
        }

        claimsNumbers.push(claim.claim_no);

        tmpClaim =
          `*Обращениe №:* ${claim.claim_no}\n` +
          `*Статус:* ${claim.status_name}\n` +
          `*Дата:* ${claim.claim_date}\n` +
          `*Договор:* ${claim.client_contract}\n` +
          `*Телефон:* ${claim.claim_phone}\n` +
          `*Имя:* ${claim.client_name}\n` +
          `*Адрес:* ${claim.claim_addr}\n` +
          `*Инициатор:* ${claim.autor}\n` +
          `*Исполнитель:* ${claim.assigned}\n` +
          `*Комментарий к заявке:* ${claim.comment}\n` +
          `*Комментарий к работе:* ${claim.work_commentary}\n\n`;

        claims.push(getMarkdownV2Shielded(tmpClaim));
      });
    } else {
      this.logger.log(
        `UUIF: ${uuidOne}; User: ${user.id}${user.username}; Not a single claim; data = ${JSON.stringify(data)}`,
      );

      keyboard = [
        Markup.button.callback('Попробовать снова', 'getShortClaims'),
      ];
      replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

      try {
        await context.editMessageText(
          `Для вас нет заявок :(\n\nUUID: ${uuidOne}\nUserID: ${user.id}`,
          { parse_mode: 'MarkdownV2', reply_markup: replyMarkup },
        );
      } catch {
        await context.reply(
          `Для вас нет заявок :(\n\nUUID: ${uuidOne}\nUserID: ${user.id}`,
          { parse_mode: 'MarkdownV2', reply_markup: replyMarkup },
        );
      }

      return;
    }

    const tmpHead =
      `***Список Заявок***\n` +
      `*Общее количество*:  ${total}\n` +
      `==========================\n`.replaceAll('=', '\\=');

    claims = claims.map((claim, i) => ({
      id: i,
      claimNo: claimsNumbers[i],
      claim: claim,
    }));

    const paginator = new Pagination({
      data: claims,
      header: () => tmpHead,
      isEnabledDeleteButton: false,
      format: (item) => `${item.claim}`,
      pageSize: 3,
      messages: {
        firstPage: '<<',
        lastPage: '>>',
        prev: '<',
        next: '>',
        indexKey: 'claimNo',
        currentPageIndicator: 'Стр',
      },
      onSelect: (item) => {
        this.getClaim(context, item.claimNo);
      },
      parse_mode: 'MarkdownV2',
      inlineCustomButtons: [[Markup.button.callback('Выход', 'cancel')]],
      isEnablePageButtons: true,
    });

    const customButtons = [];

    if (data.claims.length == 1) {
      paginator.isEnableItemButtons = false;

      let claim = data.claims[0];
      claim ??= 666;
      switch (claim.id) {
        case 10:
        case 20:
          customButtons.push([
            Markup.button.callback(
              'В работу',
              `cl_action_takework_${claim.id}_${claim.claim_no}_${claim.claim_phone}`,
            ),
          ]);
          break;
        case 666:
          this.logger.warn(
            `UUIF: ${uuidOne}; User: ${user.id}(${user.username}); Claim has no defined status_id; data = ${JSON.stringify(data)}`,
          );
          break;
        default:
          keyboard.push([
            Markup.button.callback(
              'SMS о недозвоне',
              `cl_action_senddefsms_${user.id}_${user.username}_${user.claim_phone}`,
            ),
          ]);
          keyboard.push([
            Markup.button.callback(
              'Закрыть заявку',
              `cl_action_complete_${user.id}_${user.username}_${user.claim_phone}`,
            ),
            Markup.button.callback(
              'Вернуть заявку',
              `cl_action_return_${user.id}_${user.username}_${user.claim_phone}`,
            ),
          ]);
      }
    }

    customButtons.push([Markup.button.callback('Выход', 'cancel')]);

    paginator.inlineCustomButtons = customButtons;

    const text = await paginator.text();
    const paginatorKeyboard = await paginator.keyboard();

    paginatorKeyboard.reply_markup.inline_keyboard.forEach((item) => {
      keyboard.push(item);
    });

    replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

    try {
      await context.editMessageText(text, {
        reply_markup: replyMarkup,
        parse_mode: 'MarkdownV2',
      });
    } catch {
      await context.reply(text, {
        reply_markup: replyMarkup,
        parse_mode: 'MarkdownV2',
      });
    }

    paginator.handleActions(this.bot);
  }

  async getClaim(context: Context, claimNo: number) {
    console.log(claimNo);
    // console.log(context);
  }
}
