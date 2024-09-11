import { Context } from 'telegraf';

/**
 * Returns string with all characters incompatible
 with Telegram's MarkdonwnV2 shielded.*/
export function getMarkdownV2Shielded(string: string): string {
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

/**
 * Returns string for insertion into the message representing a claim.
 * @param claim claim JSON object.
 * @returns string representing the claim.
 */
export function formClaimDescription(claim): string {
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

  const res =
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

  return res;
}

/**
 * Returns data necessary for the API request.
 * @param context context of the request.
 * @returns the user and the config gor the claims API request.
 */
export function getReqConfig(context: Context) {
  let query, user;
  try {
    query = context.callbackQuery;
    user = query.from;
  } catch {
    query = context.update?.['message'];
    user = query.chat;
  }

  const requestConfig = {
    auth: {
      username: process.env.API_USER,
      password: process.env.API_PASS,
    },
  };

  return { user, requestConfig };
}
