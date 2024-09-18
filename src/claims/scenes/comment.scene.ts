import { Ctx, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { CustomContext } from 'src/interfaces/context.interface';
import { ClaimActionService } from '../claim.action/claim.action.service';

@Scene('COMMENT_SCENE')
export class CommentScene {
  constructor(private claimActionService: ClaimActionService) {}

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
    await this.claimActionService.claimAction(context);
  }
}
