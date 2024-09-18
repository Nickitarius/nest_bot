import { Ctx, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { CustomContext } from 'src/interfaces/context.interface';
import { ClaimsService } from '../claims.service';

@Scene('COMMENT_SCENE')
export class CommentScene {
  constructor(private readonly claimsService: ClaimsService) {}

  @SceneEnter()
  onSceneEnter() {
    console.log('Entered COMMENT scene');
  }

  @SceneLeave()
  onSceneLeave() {
    console.log('Leave from scene COMMENT');
  }

  @On('text')
  async readComment(@Ctx() context: CustomContext) {
    console.log('text!');
    console.log(context.session);
    // await this.claimsService.readComment(context);
    await this.claimsService.claimAction(context);
  }
}
