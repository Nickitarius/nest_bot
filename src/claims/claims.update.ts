import { Action, Ctx, Hears, Help, Start, Update } from 'nestjs-telegraf';
import { CustomContext } from 'src/interfaces/context.interface';
import { ClaimsService } from './claims.service';

@Update()
export class ClaimsUpdate {
  constructor(private readonly claimsService: ClaimsService) {}

  @Start()
  async start(@Ctx() ctx: CustomContext) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Hears(/start/)
  async hearsStart(@Ctx() ctx: CustomContext) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Action(/^get_short_claims/)
  async getShortClaims(@Ctx() ctx: CustomContext) {
    await this.claimsService.getShortClaims(ctx);
  }

  @Help()
  async help(@Ctx() ctx: CustomContext) {
    await this.claimsService.help(ctx);
  }

  @Hears(/help/)
  async hearsHelp(@Ctx() ctx: CustomContext) {
    await this.claimsService.help(ctx);
  }

  @Action(/^clgt_/)
  async getClaim(@Ctx() ctx: CustomContext) {
    const claimNo = parseInt(
      ctx.update?.['callback_query'].data.replace('clgt_', ''),
    );
    await this.claimsService.getClaim(ctx, claimNo);
  }

  @Hears(/clgt/)
  async hearsClaim(@Ctx() ctx: CustomContext) {
    await this.claimsService.getClaim(ctx, 1);
  }

  @Action(/^cancel/)
  async cancel(@Ctx() ctx: CustomContext) {
    await this.claimsService.cancel(ctx);
  }

  /**
   * For testing get_list callback.
   */
  @Hears('get_list')
  async getList(@Ctx() ctx: CustomContext) {
    await this.claimsService.getListClaims(ctx);
  }
}
