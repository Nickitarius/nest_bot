import { Ctx, Hears, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import { ClaimsService } from './claims.service';

@Update()
export class ClaimsUpdate {
  constructor(private readonly claimsService: ClaimsService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    // try {
    await ctx.reply(await this.claimsService.getShortClaims());
    // } catch (error) {
    //   console.log(error);
    // }
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await ctx.reply('Send me a sticker');
  }

  @On('sticker')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Hears('hi')
  async hears(@Ctx() ctx: Context) {
    await ctx.reply('Hey there');
  }
}
