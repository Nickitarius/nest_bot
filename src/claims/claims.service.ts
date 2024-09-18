import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import * as fs from 'fs';
import { InjectBot } from 'nestjs-telegraf';
import { catchError, firstValueFrom } from 'rxjs';
import { CustomContext } from 'src/interfaces/context.interface';
import { Markup, Telegraf } from 'telegraf';
import { v4 as uuidV4 } from 'uuid';
import { Pagination } from '../../lib/telegraf-pagination';
import { Buttons } from './claims.buttons';
import { ClaimsUtils } from './claims.utils';

@Injectable()
export class ClaimsService {
  constructor(
    readonly httpService: HttpService,
    @InjectBot() readonly bot: Telegraf<CustomContext>,
    private configService: ConfigService,
  ) {
    const url = this.configService.get('API_URL');
    const port = this.configService.get('API_PORT');
    this.apiUrl = `http://${url}:${port}/claims`;
  }
  private readonly logger = new Logger(ClaimsService.name);

  private readonly apiUrl;

  async getShortClaims(context: CustomContext) {
    const uuidOne = uuidV4();

    const { user, requestConfig } = ClaimsUtils.getReqConfig(
      context,
      this.configService,
    );
    const url = this.apiUrl + `?uid=${user.id}`;

    let keyboard, replyMarkup, response;

    try {
      this.logger.log(`${user.id}(${user.username}) Request ${url}`);
      response = await firstValueFrom(
        this.httpService.get(url, requestConfig).pipe(
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
      );
    } catch (error) {
      ClaimsUtils.handleAxiosError(error, uuidOne, context, user, this.logger);
      context.scene.enter('START_SCENE');
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
        `UUIF: ${uuidOne}; User: ${user.id}${user.username}; Not a single claim; data = ${JSON.stringify(data, null, 3)}`,
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

      context.scene.enter('START_SCENE');
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
  }

  /**
   *Replies with a paginator containing all claims.
   */
  async getListClaims(context: CustomContext) {
    const uuidOne = uuidV4();

    const { user, requestConfig } = ClaimsUtils.getReqConfig(
      context,
      this.configService,
    );
    const url = this.apiUrl + `?uid=${user.id}`;

    let response, keyboard, replyMarkup, data;

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
              throw error;
            }),
          ),
        );
      } catch (error) {
        ClaimsUtils.handleAxiosError(
          error,
          uuidOne,
          context,
          user,
          this.logger,
        );

        context.scene.enter('START_SCENE');
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
        tmpClaim = ClaimsUtils.formClaimDescription(claim);

        claimsNumbers.push(claim.claim_no);

        claims.push(ClaimsUtils.getMarkdownV2Shielded(tmpClaim));
      });
    } else {
      this.logger.log(
        `UUIF: ${uuidOne}; User: ${user.id}${user.username}; Not a single claim; data = ${JSON.stringify(data, null, 3)}`,
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

      context.scene.enter('START_SCENE');
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
            `UUIF: ${uuidOne}; User: ${user.id}(${user.username}); Claim has no defined status_id; data = ${JSON.stringify(data, null, 3)}`,
          );
          break;
        default:
          keyboard.push([Buttons.failedCallSMSButton(claim)]);
          keyboard.push([
            Buttons.closeClaimButton(claim),
            Buttons.returnClaimButton(claim),
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
  async getClaim(context: CustomContext, claimNo: number) {
    const uuidOne = uuidV4();

    const { user, requestConfig } = ClaimsUtils.getReqConfig(
      context,
      this.configService,
    );

    const url = this.apiUrl + `/${claimNo}?uid=${user.id}`;

    let data, replyMarkup, response;
    let keyboard = [];

    if (process.argv.includes('dev')) {
      this.logger.log(
        `DEV: welcome to one function:\n####UPDATE####\n${JSON.stringify(context.update, null, 3)}\n####Update END####`,
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
          `claimIndex not found.\nclaim_no : ${claimNo}\ndata: ${JSON.stringify(data, null, 3)}`,
        );
      }
    } else {
      try {
        this.logger.log(`${user.id}(${user.username}) Request ${url}`);
        response = await firstValueFrom(
          this.httpService.get(url, requestConfig).pipe(
            catchError((error: AxiosError) => {
              throw error;
            }),
          ),
        );
      } catch (error) {
        ClaimsUtils.handleAxiosError(
          error,
          uuidOne,
          context,
          user,
          this.logger,
        );

        context.scene.enter('START_SCENE');
        return;
      }
      data = response.data;
    }

    if (data != undefined) {
      let page = ClaimsUtils.formClaimDescription(data);
      page = ClaimsUtils.getMarkdownV2Shielded(page);

      switch (data.status_id) {
        case 10:
        case 20:
          keyboard.push([Buttons.takeWorkButton(data)]);
          break;
        case undefined:
          this.logger.warn(
            `UUIF: ${uuidOne}; User: ${user.id}(${user.username}); Claim has no defined status_id; data = ${JSON.stringify(data, null, 3)}`,
          );
          break;
        default:
          keyboard.push([Buttons.failedCallSMSButton(data)]);
          keyboard.push([Buttons.getAccountButton(data)]);
          keyboard.push([Buttons.addCommentButton(data)]);
          keyboard.push([
            Buttons.closeClaimButton(data),
            Buttons.returnClaimButton(data),
          ]);
      }

      keyboard.push([Buttons.getShortClaimsButton('К списку')]);
      replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

      context.claimData = data;

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
      this.logger.warn(
        `Couldn't get claim; data = ${JSON.stringify(data, null, 3)}`,
      );
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

  async help(context: CustomContext) {
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

  async cancel(context: CustomContext) {
    if (process.argv.includes('dev')) {
      this.logger.log(
        `DEV: welcome to one function:\n####UPDATE####\n${JSON.stringify(context.update, null, 3)}\n####Update END####`,
      );
    }

    const keyboard = Markup.inlineKeyboard([
      [Buttons.getShortClaimsButton('Загрузить заявки')],
    ]);
    const replyMarkup = keyboard.reply_markup;

    await context.editMessageText('Доброго дня\\!', {
      reply_markup: replyMarkup,
      parse_mode: 'MarkdownV2',
    });
  }
}
