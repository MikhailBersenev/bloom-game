import { levels } from './levels.js';
import { GameController } from './ui/controller.js';

const app = new GameController(levels);
await app.mount();
