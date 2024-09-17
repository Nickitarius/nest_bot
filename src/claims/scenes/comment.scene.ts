import { Ctx, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { CustomContext } from 'src/interfaces/context.interface';

@Scene('COMMENT')
export class CommentScene {
  @SceneEnter()
  onSceneEnter() {
    console.log('Entered COMMENT scene');
  }

  @SceneLeave()
  onSceneLeave() {
    console.log('Leave from scene');
  }

  @On('text')
  readComment(@Ctx() context: CustomContext) {
    console.log('text!');
    
    // context;
  }
}
