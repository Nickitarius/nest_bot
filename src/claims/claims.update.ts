import { Action, Ctx, Hears, Help, Start, Update } from 'nestjs-telegraf';
import { Context } from 'src/interfaces/context.interface';
import { ClaimsService } from './claims.service';

@Update()
export class ClaimsUpdate {
  constructor(private readonly claimsService: ClaimsService) {}

  @Start()
  async start(@Ctx() ctx: Context) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Hears(/start/)
  async hearsStart(@Ctx() ctx: Context) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Action(/^getShortClaims/)
  async getShortClaims(@Ctx() ctx: Context) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Help()
  async help(@Ctx() ctx: Context) {
    await this.claimsService.help(ctx);
  }

  @Hears(/help/)
  async hearsHelp(@Ctx() ctx: Context) {
    await this.claimsService.help(ctx);
  }

  @Action(/^clgt_/)
  async getClaim(@Ctx() ctx: Context) {
    // console.log(context);
    await this.claimsService.getClaim(ctx, 1);
  }

  @Hears(/clgt/)
  async hearsClaim(@Ctx() ctx: Context) {
    await this.claimsService.getClaim(ctx, 1);
  }

  @Hears('get_list')
  async getList(@Ctx() ctx: Context) {
    await this.claimsService.getListClaims(ctx);
  }

  // @On('sticker')
  // async on(@Ctx() ctx: Context) {
  //   await ctx.reply('👍');
  // }
}
