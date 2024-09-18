import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CustomContext } from 'src/interfaces/context.interface';
import { Markup } from 'telegraf';
import { Buttons } from '../claims.buttons';
import { ClaimsService } from '../claims.service';
import { ClaimsUtils } from '../claims.utils';

@Injectable()
export class NotificationService {
  constructor(private claimsService: ClaimsService) {}

  async notify(context: CustomContext, req: Request) {
    let data, notification, claim;
    try {
      data = req.body;
    } catch {
      this.claimsService.logger.error('code: 400, description: No json data');
      throw new HttpException('No json data :(', HttpStatus.BAD_REQUEST);
    }

    console.log(data.claim[0]);
    console.log(data.notify[0]);

    try {
      notification = data.notify[0];
      claim = data.claim[0];
    } catch (error) {
      this.claimsService.logger.error(
        `ArrayError: ${JSON.stringify(data, null, 3)}`,
      );
      throw new HttpException(
        `ArrayError: ${JSON.stringify(error, null, 3)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const isRequiredFieldsPresent =
      (claim.id || claim.id == 0) &&
      (claim.claim_no || claim.claim_no == 0) &&
      (claim.claim_phone || claim.claim_phone == 0) &&
      (notification.chat_id || notification.chat_id == 0) &&
      (notification.uid || notification.uid == 0);

    if (!isRequiredFieldsPresent) {
      this.claimsService.logger.error(
        `code: 400, description KeyError: ${JSON.stringify(data, null, 3)}`,
      );
      throw new HttpException(
        `KeyError: ${JSON.stringify(data, null, 3)}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    let text =
      `Вам назначена новая заявка\n\n` +
      `*Обращениe №:* ${claim.claim_no}\n` +
      `*Статус:* ${claim.status_name}\n` +
      `*Дата:* ${claim.claim_date}\n` +
      `*Инициатор:* ${claim.autor}\n` +
      `==========================\n` +
      `*Исполнитель:* ${claim.assigned}\n` +
      `*От:* ${claim.lw_date_change}\n` +
      `==========================\n` +
      `*Обращениe №:* ${claim.claim_no}\n` +
      `*Договор:* ${claim.client_contract}` +
      `*Телефон:* ${claim.claim_phone}\n` +
      `*Имя:* ${data.client_name}\n` +
      `*Адрес:* ${data.claim_addr}\n` +
      `*Комментарий:* ${claim.comment}\n\n`;

    text = ClaimsUtils.getMarkdownV2Shielded(text);

    const keyboard = [
      Buttons.takeWorkButton(claim),
      Buttons.getShortClaimsButton('К списку'),
    ];
    const replyMarkup = Markup.inlineKeyboard(keyboard).reply_markup;

    try {
      this.claimsService.bot.telegram.sendMessage(notification.chat_id, text, {
        parse_mode: 'MarkdownV2',
        reply_markup: replyMarkup,
      });
    } catch (error) {
      this.claimsService.logger.error(
        `Notification failed.\nNotification: ${notification.uid}\n` +
          `Recipient: ${notification.chat_id}\nError: ${JSON.stringify(error, null, 3)}`,
      );
    }
  }
}
