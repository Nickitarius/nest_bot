import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { Context, Markup, Telegraf } from 'telegraf';
import { v4 as uuidV4 } from 'uuid';
import * as fs from 'fs';
import { Pagination } from '../../telegraf-pagination';
import { InjectBot } from 'nestjs-telegraf';
import { transliterate } from 'transliteration';
import * as Buttons from './buttons';

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
  private apiClaims = `http://${process.env.API_URL}:${process.env.API_PORT}/claims`;

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
      user = query.chat;
    }

    const url = this.apiClaims + `?uid=${user.id}`;
    const requestConfig = {
      auth: {
        username: process.env.API_USER,
        password: process.env.API_PASS,
      },
    };

    let keyboard, replyMarkup, data;

    try {
      this.logger.log(`${user.id}(${user.username}) Request ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, requestConfig).pipe(
          catchError((error: AxiosError) => {
            throw error.response.data;
          }),
        ),
      );
      data = response.data;
    } catch (error) {
      this.logger.error(
        `UUID: ${uuidOne} USER_ID: ${user.id} CODE: ${error.statusCode} DATA: ${JSON.stringify(error)}`,
      );

      keyboard = [Buttons.getShortClaimsButton('Попробовать снова')];
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

        console.log(claim);

        keyboard.push([Buttons.getClaimButton(claim)]);
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

      keyboard = [Buttons.getShortClaimsButton('Попробовать снова')];
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

    replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

    try {
      await context.editMessageText(page, {
        reply_markup: replyMarkup,
        parse_mode: 'MarkdownV2',
      });
    } catch {
      await context.reply(page, {
        reply_markup: replyMarkup,
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

    const keyboard = [Buttons.getShortClaimsButton('Загрузить заявки')];
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
      user = query.chat;
    }

    const url = this.apiClaims + `?uid=${user.id}`;
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
        `DEV: welcome to one function:\n####UPDATE####\n${JSON.stringify(context.update, null, 3)}\n####Update END####`,
      );
      data = JSON.parse(
        fs.readFileSync('data/data.json', 'utf-8'), //data_just_one_entry
      );
    } else {
      try {
        this.logger.log(`${user.id}(${user.username}) Request ${url}`);

        response = await firstValueFrom(
          this.httpService.get(url, requestConfig).pipe(
            catchError((error: AxiosError) => {
              throw error.response.data;
            }),
          ),
        );
      } catch (error) {
        this.logger.error(
          `UUID: ${uuidOne} USER_ID: ${user.id} CODE: ${error.statusCode} DATA: ${JSON.stringify(error)}`,
        );

        keyboard = [Buttons.getShortClaimsButton('Попоробовать снова')];
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
        claim.client_contract ??= '-';
        claim.client_name ??= '-';
        claim.claim_phone ??= '-';
        claim.claim_addr ??= '-';
        claim.autor ??= '-';
        claim.assigned ??= '-';
        claim.comment ??= '-';
        claim.work_commentary ??= '-';
        claim.lw_date_change ??= '-';
        claim.status_name ??= '-';

        claim.claim_addr = claim.claim_addr.replaceAll('_', '-');
        claim.claim_date = claim.claim_date.replaceAll('_', '-');
        claim.client_contract = claim.client_contract.replaceAll('_', '-');
        claim.client_name = claim.client_name.replaceAll('_', '-');
        claim.claim_phone = claim.claim_phone.replaceAll('_', '-');
        claim.autor = claim.autor.replaceAll('_', '-');
        claim.assigned = claim.assigned.replaceAll('_', '-');
        claim.comment = claim.comment.replaceAll('_', '-');

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

      keyboard = [Buttons.getShortClaimsButton('Попробовать снова')];
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
      inlineCustomButtons: [Buttons.cancelButton],
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
          customButtons.push([Buttons.takeWorkButton(claim)]);
          break;
        case 666:
          this.logger.warn(
            `UUIF: ${uuidOne}; User: ${user.id}(${user.username}); Claim has no defined status_id; data = ${JSON.stringify(data)}`,
          );
          break;
        default:
          keyboard.push([Buttons.failedCallSMSButton(user)]);
          keyboard.push([
            Buttons.closeClaimButton(user),
            Buttons.returnClaimButton(user),
          ]);
      }
    }

    customButtons.push([Buttons.cancelButton]);

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

  /**Returns claim with specified number. */
  async getClaim(context: Context, claimNo: number) {
    const uuidOne = uuidV4();

    let user, query;
    // let fl;
    try {
      query = context.callbackQuery;
      user = query.from;
      // fl = 'cl';
    } catch {
      query = context.update?.['message'];
      user = query.chat;
      // fl = 'ms';
    }

    const url = this.apiClaims + `/${claimNo}?uid=${user.id}`;
    const requestConfig = {
      auth: {
        username: process.env.API_USER,
        password: process.env.API_PASS,
      },
    };

    let data;
    let replyMarkup;
    let keyboard = [];

    if (process.argv.includes('dev')) {
      this.logger.log(
        `DEV: welcome to one function:\n####UPDATE####\n${JSON.stringify(context.update)}\n####Update END####`,
      );
      data = JSON.parse(
        fs.readFileSync('data/data.json', 'utf-8'), //data_just_one_entry
      );
      let hasRequiredClaim = false;
      for (const claim of data.claims) {
        if (claim.claim_no === claimNo) {
          data = claim;
          hasRequiredClaim = true;
          break;
        }
      }
      if (!hasRequiredClaim) {
        this.logger.log(
          `claimIndex not found.\nclaim_no : ${claimNo}\ndata: ${JSON.stringify(data)}`,
        );
      }
    } else {
      this.logger.log(`${user.id}(${user.username}) Request ${url}`);
      const response = await firstValueFrom(
        this.httpService.get(url, requestConfig).pipe(
          catchError((error: AxiosError) => {
            throw error.response.data;
          }),
        ),
      );
      data = response.data;
    }

    if (data != undefined) {
      // let status = 'Активна (в работе)';

      data.client_contract ??= '-';
      data.client_name ??= '-';
      data.claim_phone ??= '-';
      data.claim_addr ??= '-';
      data.autor ??= '-';
      data.assigned ??= '-';
      data.comment ??= '-';
      data.work_commentary ??= '-';
      data.lw_date_change ??= '-';
      data.status_name ??= '-';

      data.claim_addr = data.claim_addr.replaceAll('_', '-');
      data.claim_date = data.claim_date.replaceAll('_', '-');
      data.client_contract = data.client_contract.replaceAll('_', '-');
      data.client_name = data.client_name.replaceAll('_', '-');
      data.claim_phone = data.claim_phone.replaceAll('_', '-');
      data.autor = data.autor.replaceAll('_', '-');
      data.assigned = data.assigned.replaceAll('_', '-');
      data.comment = data.comment.replaceAll('_', '-');

      // status = '';

      const clientContract = transliterate(data.client_contract);
      const tail = `${data.id}_${data.claim_no}_${data.claim_phone}_${clientContract}`;

      switch (data.id) {
        case 10:
        case 20:
          keyboard.push([[Buttons.takeWorkButton(data)]]);
          break;
        case 666:
          this.logger.warn(
            `UUIF: ${uuidOne}; User: ${user.id}(${user.username}); Claim has no defined status_id; data = ${JSON.stringify(data)}`,
          );
          break;
        default:
          keyboard.push([Buttons.failedCallSMSButton(user)]);
          keyboard.push([
            Markup.button.callback(
              'Логин и пароль',
              `cl_action_getaccounts_${tail}`,
            ),
          ]);
          keyboard.push([
            Markup.button.callback(
              'Комментарий',
              `cl_action_addcomment_${tail}`,
            ),
          ]);
          keyboard.push([
            Buttons.closeClaimButton(user),
            Buttons.returnClaimButton(user),
          ]);
      }

      keyboard.push([Buttons.getShortClaimsButton('К списку')]);

      let page =
        `*Обращениe №:* ${data.claim_no}\n` +
        `*Статус:* ${data.status_name}\n` +
        `*Дата:* ${data.claim_date}\n` +
        `*Договор:* ${data.client_contract}\n` +
        `*Телефон:* ${data.claim_phone}\n` +
        `*Имя:* ${data.client_name}\n` +
        `*Адрес:* ${data.claim_addr}\n` +
        `*Инициатор:* ${data.autor}\n` +
        `*Исполнитель:* ${data.assigned}\n` +
        `*Комментарий к заявке:* ${data.comment}\n` +
        `*Комментарий к работе:* ${data.work_commentary}\n\n`;
      page = getMarkdownV2Shielded(page);

      console.log(keyboard);

      replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

      try {
        await context.editMessageText(page, {
          reply_markup: replyMarkup,
          parse_mode: 'MarkdownV2',
        });
      } catch {
        this.logger.debug(`DEBBUG: ${page}\n ${replyMarkup}`);
        await context.reply(page, {
          reply_markup: replyMarkup,
          parse_mode: 'MarkdownV2',
        });
      }
    } else {
      this.logger.warn(`Couldn't get claim; data = ${JSON.stringify(data)}`);
      keyboard = [
        [Buttons.getShortClaimsButton('К списку'), Buttons.cancelButton],
      ];
      replyMarkup = Markup.inlineKeyboard(keyboard);
      try {
        await context.editMessageText('Что то пошло не так :(', replyMarkup);
      } catch {
        await context.reply('Что то пошло не так :(', replyMarkup);
      }
    }
  }
}
