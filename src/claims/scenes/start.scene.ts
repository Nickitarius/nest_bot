import { Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';

@Scene('START')
export class CommentScene {
  @SceneEnter()
  onSceneEnter() {
    console.log('Entered START scene');
  }

  @SceneLeave()
  onSceneLeave() {
    console.log('Leave from START scene');
  }
}
