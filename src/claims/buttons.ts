import { Markup } from 'telegraf';

/**A midoule with buttons for bot's buttons. */

export function failedCallSMSButton(user) {
  return Markup.button.callback(
    'SMS о недозвоне',
    `cl_action_senddefsms_${user.id}_${user.username}_${user.claim_phone}`,
  );
}

export function closeClaimButton(user) {
  return Markup.button.callback(
    'Закрыть заявку',
    `cl_action_complete_${user.id}_${user.username}_${user.claim_phone}`,
  );
}

export function returnClaimButton(user) {
  return Markup.button.callback(
    'Вернуть заявку',
    `cl_action_return_${user.id}_${user.username}_${user.claim_phone}`,
  );
}

export function takeWorkButton(claim) {
  return Markup.button.callback(
    'В работу',
    `cl_action_takework_${claim.id}_${claim.claim_no}_${claim.claim_phone}`,
  );
}

export function getClaimButton(claim) {
  return Markup.button.callback(claim.claim_addr, `clgt_${claim.claim_no}`);
}

export const cancelButton = Markup.button.callback('Выход', 'cancel');

export function getShortClaimsButton(text) {
  return Markup.button.callback(text, 'get_short_claims');
}
