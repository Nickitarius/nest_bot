import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';
import { CustomContext } from 'src/interfaces/context.interface';
import { Markup } from 'telegraf';
import { transliterate } from 'transliteration';
import { v4 as uuidV4 } from 'uuid';
import { Buttons } from '../claims.buttons';
import { ClaimsUtils } from '../claims.utils';

@Injectable()
export class ClaimActionService {
  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    const url = this.configService.get('API_URL');
    const port = this.configService.get('API_PORT');
    this.apiUrl = `http://${url}:${port}/claims/action`;
  }

  private readonly apiUrl;

  readonly logger = new Logger(ClaimActionService.name);

  async claimAction(context: CustomContext) {
    const uuidOne = uuidV4();

    if (process.argv.includes('dev')) {
      this.logger.log(
        `DEV: welcome to one function:\n####UPDATE####\n` +
          `${JSON.stringify(context.update, null, 3)}\n####Update END####`,
      );
    }

    const { user, requestConfig } = ClaimsUtils.getReqConfig(
      context,
      this.configService,
    );

    const apiAction = `${this.apiUrl}?uid=${user.id}`;

    let keyboard, action, page, response;

    if (context.callbackQuery) {
      action = context.callbackQuery?.['data'].split('_');
      context.session['action'] = action;
    } else if (context.session['action']) {
      action = context.session['action'];
    } else {
      action = [0, 0, 'complete'];
    }

    switch (action[2]) {
      case 'takework':
        response = await this.actionMakePostReq(
          uuidOne,
          action,
          user,
          apiAction,
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
          return;
        }

        action.push(comment);
        response = await this.actionMakePostReq(
          uuidOne,
          action,
          user,
          apiAction,
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

        delete context.claimData;
        delete context.session['action'];

        if (response.status === 0) {
          this.logger.log(
            `${action[2]}; ${uuidOne}; ${action[4]}; ${user}; ${response.response}`,
          );
          keyboard = [[Buttons.getShortClaimsButton('OK')]];

          switch (action[2]) {
            case 'complete':
              page = `Заявка ${action[4]} завершена\nКомментарий: ${comment}`;
              break;
            case 'return':
              page = `Заявка ${action[4]} возвращена\nКомментарий: ${comment}`;
              break;
            case 'addcomment':
              page = `Коментарий отправлен.\nНомер заявки ${action[4]}\nКомментарий: ${comment}`;
              break;
            default:
              page = 'Что-то пошло не так';
          }
          page = ClaimsUtils.getMarkdownV2Shielded(page);
          const replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

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
          keyboard = [[Buttons.getClaimButton(context.claimData, 'OK')]];
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
        response = await this.actionMakePostReq(
          uuidOne,
          action,
          user,
          apiAction,
          requestConfig,
        );

        if (response.status === 0) {
          this.logger.log(
            `SENDDEFSMS: ${uuidOne}; ${action[4]}; ` +
              `${JSON.stringify(user, null, 3)}; ${response.response}`,
          );
          page = 'СМС отправлено';
        } else {
          this.logger.error(
            `SENDDEFSMS ERROR: ${uuidOne}; ${action[4]}; ${user}; ` +
              `${response.error}; DATASEND: ${response.datasend}; ` +
              `DATAREAD: ${response.dataread}`,
          );
          page =
            `*${response.dataread}*\n\n${response.error}\nType: ${action[2]}\n` +
            `Claim: ${action[4]}\nUser Id: ${user.id}\nUUID: ${uuidOne}\n\n` +
            `Обратитесь к администратору или повторите попытку позже`;
        }
        break;
      case 'comment':
        if (response.status === 0) {
          page = 'Функция в стадии разработки.';
        } else {
          this.logger.error(
            `COMMENT ERROR: ${uuidOne}; ${action[4]}; ${user}; ` +
              `${response.error}; DATASEND: ${response.datasend}; ` +
              `DATAREAD: ${response.dataread}`,
          );
          page =
            `*${response.dataread}*\n\n${response.error}\nType: ${action[2]}\n` +
            `Claim: ${action[4]}\nUser Id: ${user.id}\nUUID: ${uuidOne}\n\n` +
            `Обратитесь к администратору или повторите попытку позже`;
        }
        keyboard = [[Buttons.getClaimButton(context.claimData, 'OK')]];
        break;
      case 'getaccounts':
        response = await this.actionMakePostReq(
          uuidOne,
          action,
          user,
          apiAction,
          requestConfig,
        );

        if (response.status === 0) {
          this.logger.log(
            `SENDDEFSMS: ${uuidOne}; ${action[4]}; ` +
              `${JSON.stringify(user, null, 3)}; ${response.response}`,
          );
          page = '***Учётные данные***\n\n';
          const data = response.response;
          if (data.length != 0) {
            for (const account of data) {
              account.tarplan_name = account.tarplan_name.replaceAll('_', '-');
              account.status_name = account.status_name.replaceAll('_', '-');

              page +=
                `*Аккаунт код*:  ${account.account_code}` +
                `\n*Статус*:  ${account.status_name}\n` +
                `*Тарифный план*: ${account.tarplan_name}\n` +
                `*Логин*: ${account.login}\n` +
                `*Пароль*: ${account.password}\n\n`;
            }
            page = ClaimsUtils.getMarkdownV2Shielded(page);
          }
        } else {
          this.logger.error(
            `GETACCOUNTS ERROR: ${uuidOne}; ${action[4]}; ${user}; ` +
              `${response.error}; DATASEND: ${response.datasend}; ` +
              `DATAREAD: ${response.dataread}`,
          );
          page =
            `*${response.dataread}*\n\n${response.error}\nType: ${action[2]}\n` +
            `Claim: ${action[4]}\nUser Id: ${user.id}\nUUID: ${uuidOne}\n\n` +
            `Обратитесь к администратору или повторите попытку позже`;
        }
        keyboard = [[Buttons.getClaimButton(context.claimData, 'OK')]];
        break;
      default:
    }

    const replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

    await context.editMessageText(page, {
      reply_markup: replyMarkup,
      parse_mode: 'MarkdownV2',
    });
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
