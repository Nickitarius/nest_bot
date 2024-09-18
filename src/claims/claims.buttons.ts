import { Markup } from 'telegraf';
import { transliterate } from 'transliteration';

/**A class with buttons for the bot. */
export class Buttons {
  public static cancelButton = Markup.button.callback('Выход', 'cancel');

  static failedCallSMSButton(claim, text = 'SMS о недозвоне') {
    const clientContract = transliterate(claim.client_contract);
    return Markup.button.callback(
      text,
      `cl_action_senddefsms_${claim.id}_${claim.claim_no}_${claim.claim_phone}_${clientContract}`,
    );
  }

  static closeClaimButton(claim, text = 'Закрыть заявку') {
    const clientContract = transliterate(claim.client_contract);
    return Markup.button.callback(
      text,
      `cl_action_complete_${claim.id}_${claim.claim_no}_${claim.claim_phone}_${clientContract}`,
    );
  }

  static returnClaimButton(claim, text = 'Вернуть заявку') {
    const clientContract = transliterate(claim.client_contract);
    return Markup.button.callback(
      text,
      `cl_action_return_${claim.id}_${claim.claim_no}_${claim.claim_phone}_${clientContract}`,
    );
  }

  static takeWorkButton(claim, text = 'В работу') {
    const clientContract = transliterate(claim.client_contract);
    return Markup.button.callback(
      text,
      `cl_action_takework_${claim.id}_${claim.claim_no}_${claim.claim_phone}_${clientContract}`,
    );
  }

  static getAccountButton(claim, text = 'Логин и пароль') {
    const clientContract = transliterate(claim.client_contract);
    return Markup.button.callback(
      text,
      `cl_action_getaccounts_${claim.id}_${claim.claim_no}_${claim.claim_phone}_${clientContract}`,
    );
  }

  static addCommentButton(claim, text = 'Добавить комментарий') {
    const clientContract = transliterate(claim.client_contract);
    return Markup.button.callback(
      text,
      `cl_action_addcomment_${claim.id}_${claim.claim_no}_${claim.claim_phone}_${clientContract}`,
    );
  }

  static getClaimButton(claim, text = claim.claim_addr) {
    return Markup.button.callback(text, `clgt_${claim.claim_no}`);
  }

  static getShortClaimsButton(text) {
    return Markup.button.callback(text, 'get_short_claims');
  }
}
