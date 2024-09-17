import { Scenes, Context } from 'telegraf';

export interface CustomContext extends Scenes.SceneContext {
  claimData?: object;
}
