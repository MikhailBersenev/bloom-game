import { levelConfigs } from './levels/levels.js';
import { loadLevel } from './levels/LevelLoader.js';
export const levels = levelConfigs.map(loadLevel);
