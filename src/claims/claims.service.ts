import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import * as fs from 'fs';
import { InjectBot } from 'nestjs-telegraf';
import { catchError, firstValueFrom } from 'rxjs';
import { Markup, Telegraf } from 'telegraf';
import { transliterate } from 'transliteration';
import { v4 as uuidV4 } from 'uuid';
import { Pagination } from '../../telegraf-pagination';
import { Buttons } from './buttons';
import { ClaimsUtils } from './utils';
import { CustomContext } from 'src/interfaces/context.interface';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly httpService: HttpService,
    @InjectBot() private bot: Telegraf<CustomContext>,
  ) {}
  private readonly logger = new Logger(ClaimsService.name);
  private apiClaims = `http://${process.env.API_URL}:${process.env.API_PORT}/claims`;

  async getShortClaims(context: CustomContext) {
    const uuidOne = uuidV4();

    console.log(context);

    const { user, requestConfig } = ClaimsUtils.getReqConfig(context);
    const url = this.apiClaims + `?uid=${user.id}`;

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

    const { user, requestConfig } = ClaimsUtils.getReqConfig(context);
    const url = this.apiClaims + `?uid=${user.id}`;

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

    const { user, requestConfig } = ClaimsUtils.getReqConfig(context);

    const url = this.apiClaims + `/${claimNo}?uid=${user.id}`;

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

      const clientContract = transliterate(data.client_contract);
      const tail = `${data.id}_${data.claim_no}_${data.claim_phone}_${clientContract}`;

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

  async claimAction(context: CustomContext) {
    const uuidOne = uuidV4();

    if (process.argv.includes('dev')) {
      this.logger.log(
        `DEV: welcome to one function:\n####UPDATE####\n${JSON.stringify(context.update, null, 3)}\n####Update END####`,
      );
    }

    const { user, requestConfig } = ClaimsUtils.getReqConfig(context);
    const url = `${this.apiClaims}/action?uid=${user.id}`;

    let keyboard, action, page;

    try {
      action = context.callbackQuery?.['data'].split('_');
    } catch {
      action = [0, 0, 'complete'];
    }

    switch (action[2]) {
      case 'takework':
        let response = await this.actionMakePostReq(
          uuidOne,
          action,
          user,
          url,
          requestConfig,
        );
        if (response.status == 0) {
          this.logger.log(
            `TAKEWORK: ${uuidOne}; ${action[4]}, ${JSON.stringify(user, null, 3)}; ${response['response']}`,
          );

          keyboard = [[Markup.button.callback('OK', `clgt_${action[4]}`)]];
          page = 'Заявка взята в работу';
        } else {
          this.logger.error(
            `TAKEWORK ERROR: ${uuidOne}; ${action[4]}, ${user}; ${JSON.stringify(response['error'], null, 3)};\
             DATASEND: ${JSON.stringify(response['datasend'], null, 3)}; DATAREAD: ${JSON.stringify(response['dataread'], null, 3)}`,
          );

          keyboard = [[Markup.button.callback('OK', `clgt_${action[4]}`)]];

          page =
            `*${JSON.stringify(response['datasend'], null, 3)}*\n\n` +
            `${JSON.stringify(response['error'], null, 3)}\n` +
            `Type: ${action[2]}\nClaim: ${action[4]}\nUser Id: ${user.id}\n` +
            `UUID: ${uuidOne}\n\n` +
            `Обратитесь к администратору или повторите попытку позже.`;
          page = ClaimsUtils.getMarkdownV2Shielded(page);
        }
        break;
      case 'complete':
      case 'return':
      case 'addcomment':
        let comment;
        try {
          comment = context.update?.['message'].text;
        } catch {
          keyboard = [[Markup.button.callback('Отмена', `clgt_${action[4]}`)]];

          switch (action[2]) {
            case 'complete':
              page = 'Для завершения заявки обязательно укажите комментарий';
              break;
            case 'return':
              page = 'Для возврата заявки обязательно укажите комментарий';
              break;
            case 'addcomment':
              page = 'Укажите комментарий';
              break;
            default:
              page = 'Что то пошло не так';
          }

          const replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;
          await context.editMessageText(page, {
            reply_markup: replyMarkup,
            parse_mode: 'MarkdownV2',
          });

          context.claimData = action;

          this.logger.log(
            `DEBBUG: context.claim = action; context.chat_data.claim_data = ${context.claimData}`,
          );
          this.logger.log(
            `DEBBUG: context.claim = action; update = ${context.update}`,
          );

          context.scene.enter('COMMENT_SCENE');
          // context.
          return;
        }
        // const claim_data = this.bot.context?.['claimData'];
        // action = {};
        action.push(comment);

        response = await this.actionMakePostReq(
          uuidOne,
          action,
          user,
          url,
          requestConfig,
        );

        try {
          this.logger.log(
            `DEBBUG context.bot.deleteMessage Trying: message_id = ${context.update?.['message'].message_id}`,
          );
          await context.deleteMessage(context.update?.['message'].message_id);
        } catch {
          this.logger.error(
            `message_id = ${context.update?.['message'].message_id}`,
          );
          this.logger.error(JSON.stringify(context.claimData, null, 3));
          this.logger.error(JSON.stringify(context.update, null, 3));
        }

        // try{}
        delete context.claimData;

        if (response.status === 0) {
          this.logger.log(
            `${action[2]}; ${uuidOne}; ${action[4]}; ${user}; ${response.response}`,
          );
          keyboard = [[Buttons.getShortClaimsButton('OK')]];

          switch (action[2]) {
            case 'complete':
              page = `Заявка ${action[4]} завершена\nКомментарий: ${action[7]}`;
              break;
            case 'return':
              page = `Заявка ${action[4]} возвращена\nКомментарий: ${action[7]}`;
              break;
            case 'addcomment':
              page = `Коментарий отправлен.\nНомер заявки ${action[4]}\nКомментарий: ${action[7]}`;
              break;
            default:
              page = 'Что-то пошло не так';
          }
          page = ClaimsUtils.getMarkdownV2Shielded(page);
          const replyMarkup = Markup.keyboard(keyboard).reply_markup;

          await context.reply(page, {
            reply_markup: replyMarkup,
            parse_mode: 'MarkdownV2',
          });

          context.scene.enter('START_SCENE');
          return;
        } else {
          this.logger.log(
            `${action[2]} ERROR: ${uuidOne}; ${action[4]}; ${JSON.stringify(user, null, 3)}; ` +
              `${response.error}; DATASEND: ${response.datasend}; DATAREAD: ${response.dataread}`,
          );
          keyboard = [Buttons.getClaimButton(context.claimData, 'OK')];
          page =
            `*${response.dataread}*\n\n${response.error}\nType: ${action[2]}\n` +
            `Claim: ${action[4]}\nUser Id: ${user.id}\nUUID: ${uuidOne}\n\n` +
            `Обратитесь к администратору или повторите попытку позже`;
        }

        page = ClaimsUtils.getMarkdownV2Shielded(page);
        const replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;
        await context.reply(page, {
          reply_markup: replyMarkup,
          parse_mode: 'MarkdownV2',
        });
        context.scene.enter('START_SCENE');
        return;
        break;
      case 'senddefsms':
        break;
    }

    const replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

    await context.editMessageText(page, {
      reply_markup: replyMarkup,
      parse_mode: 'MarkdownV2',
    });
  }

  async readComment(context: CustomContext) {
    // const message = context.update?.['message'].text;

    await this.claimAction(context);
  }

  /**Makes a POST request to the API server. Returns status and response. */
  async actionMakePostReq(uuidOne, action, user, url, requestConfig) {
    let data;
    data = {
      id: uuidOne,
      type: action[2],
      claim_id: action[3],
      claim_no: action[4],
      username: user.username,
      first_name: user.first_name,
      user_id: user.user_id,
    };

    switch (action[2]) {
      case 'complete':
      case 'return':
      case 'addcomment':
        data['commentary'] = action[7];
        break;
      case 'senddefsms':
        data['options'] = { phone: action[5], def_id: 1 };
        break;
      case 'getaccounts':
        const clientContract = transliterate(action[6]);
        console.log('sssssssssssssss');
        console.log(clientContract);
        data = {
          id: uuidOne,
          type: action[2],
          user_id: user.user_id,
        };
        data['options'] = { contract: clientContract };
    }

    requestConfig['Content-Type'] = 'application/json';
    // requestConfig['Content-Length'] = data.length;

    let response, res;
    try {
      response = await firstValueFrom(
        this.httpService.post(url, data, requestConfig).pipe(
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
      );
      // console.log('rrrrrrrrrrrrrrrrrrrrrr');
      // console.log(response);
    } catch (error) {
      if (error.response) {
        res = {
          status: 1,
          datasend: JSON.stringify(data, null, 3),
          dataread: error.message,
          error: error.response.data.statusCode,
        };
      } else {
        res = {
          status: 1,
          datasend: JSON.stringify(data, null, 3),
          error: error.code,
        };
      }

      return res;
    }
    res = { status: 0, response: response };
    return res;
  }
}
