import { Scenes } from 'telegraf';

export interface CustomContext extends Scenes.SceneContext {
  claimData?: object;
  action?: string;
}
