import { Markup } from 'telegraf';

/**A class with buttons for bot the bot. */

export class Buttons {
  public static cancelButton = Markup.button.callback('Выход', 'cancel');

  static failedCallSMSButton(claim, text = 'SMS о недозвоне') {
    return Markup.button.callback(
      text,
      `cl_action_senddefsms_${claim.id}_${claim.claim_no}_${claim.claim_phone}`,
    );
  }

  static closeClaimButton(claim, text = 'Закрыть заявку') {
    return Markup.button.callback(
      text,
      `cl_action_complete_${claim.id}_${claim.claim_no}_${claim.claim_phone}`,
    );
  }

  static returnClaimButton(claim, text = 'Вернуть заявку') {
    return Markup.button.callback(
      text,
      `cl_action_return_${claim.id}_${claim.claim_no}_${claim.claim_phone}`,
    );
  }

  static takeWorkButton(claim, text = 'В работу') {
    return Markup.button.callback(
      text,
      `cl_action_takework_${claim.id}_${claim.claim_no}_${claim.claim_phone}`,
    );
  }

  static getClaimButton(claim, text = claim.claim_addr) {
    return Markup.button.callback(text, `clgt_${claim.claim_no}`);
  }

  static getShortClaimsButton(text) {
    return Markup.button.callback(text, 'get_short_claims');
  }
}
