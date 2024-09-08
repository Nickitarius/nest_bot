import { Action, Ctx, Hears, Help, On, Start, Update } from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import { ClaimsService } from './claims.service';

@Update()
export class ClaimsUpdate {
  constructor(private readonly claimsService: ClaimsService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await this.claimsService.help(ctx);
  }

  @On('sticker')
  async on(@Ctx() ctx: Context) {
    await ctx.reply('👍');
  }

  @Action('getShortClaims')
  async getShortClaims(@Ctx() ctx: Context) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Hears('hi')
  async hears(@Ctx() ctx: Context) {
    await ctx.reply('Hey there');
  }
}
