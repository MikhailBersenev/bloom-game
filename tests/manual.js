import { Game, gem, booster, box } from '../src/engine.js';
import { GameView } from '../src/ui/view.js';
import { GameAnimations } from '../src/ui/animations.js';

const view = new GameView();
view.hud = () => {};
const animations = new GameAnimations(view, { play() {} });
const nativeMatchMedia = window.matchMedia.bind(window);
window.matchMedia = (query) =>
  query === '(prefers-reduced-motion: reduce)'
    ? { matches: document.querySelector('#reduced').checked }
    : nativeMatchMedia(query);
const report = document.querySelector('#report');
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};
function fixture() {
  let seed = 17;
  const game = new Game(
    { rows: 7, cols: 7, colors: 5, moves: 20, goals: [{ key: 'color:0', count: 999 }] },
    {
      random: () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      },
      animate: (event, game) => animations.play(event, game, () => true),
    },
  );
  game.board = game.board.map((_, i) => gem((Math.floor(i / 7) * 2 + (i % 7)) % 5));
  return game;
}
const scenarios = [];
for (const type of ['colored', 'cycling']) {
  for (const color of [0, 1])
    scenarios.push([
      `${type}: соседний матч цвета ${color}`,
      async () => {
        const g = fixture();
        g.board[9] = box(type, 3, 0);
        for (const i of [14, 15, 16]) g.board[i] = gem(color);
        view.draw(g);
        await g.wave([{ cells: [14, 15, 16], color, type: null }]);
        check(g.board[9].hp === (color === 0 ? 2 : 3), 'Неверный урон от матча');
      },
    ]);
  for (const effect of ['line', 'bomb', 'plane'])
    scenarios.push([
      `${type}: прямой удар ${effect}`,
      async () => {
        const g = fixture();
        g.board[24] = box(type, 3, 0);
        g.board[23] = booster(effect);
        view.draw(g);
        await g.wave([], [{ i: 23 }]);
        check(g.board[24].hp === 3, 'Бустер обошёл цветовое условие');
      },
    ]);
}
for (const type of ['line', 'bomb', 'plane'])
  scenarios.push([
    `Радужный шар + ${type}`,
    async () => {
      const g = fixture();
      g.board[0] = booster('rainbow');
      g.board[1] = booster(type);
      const color = g.bestColor();
      const count = g.board.filter((x) => x.kind === 'gem' && x.color === color).length;
      view.draw(g);
      await g.wave([], [], { a: 0, b: 1 });
      check(g.collected[`color:${color}`] === count, 'Неверный сбор цвета');
      check(g.collected.booster === count + 2, 'Повторная или пропущенная активация');
    },
  ]);
scenarios.push([
  'Пустоты между несколькими ящиками',
  async () => {
    const g = fixture();
    for (const i of [14, 35]) g.board[i] = box('blocker');
    for (const i of [7, 21, 28, 42]) g.board[i] = null;
    view.draw(g);
    await g.gravity();
    check(g.board.every(Boolean), 'Осталась пустота');
    check(g.board[14].type === 'blocker' && g.board[35].type === 'blocker', 'Сдвинулся ящик');
  },
]);
scenarios.push([
  'Победа после радужной комбинации на последнем ходу',
  async () => {
    const g = fixture();
    g.board[0] = booster('rainbow');
    g.board[1] = booster('line');
    const color = g.bestColor();
    g.level.goals = [
      {
        key: `color:${color}`,
        count: g.board.filter((x) => x.kind === 'gem' && x.color === color).length,
      },
    ];
    g.moves = 1;
    view.draw(g);
    await g.swap(0, 1);
    check(g.status === 'won' && g.moves === 0, 'Не засчитана победа');
  },
]);
document.querySelector('#run').onclick = async () => {
  const button = document.querySelector('#run');
  button.disabled = true;
  report.textContent = '';
  try {
    for (const [name, run] of scenarios) {
      document.querySelector('#scenario').textContent = name;
      await run();
      report.textContent += `✓ ${name}\n`;
    }
    report.textContent += `Готово: ${scenarios.length}/${scenarios.length}, reduced motion: ${document.querySelector('#reduced').checked}`;
  } catch (error) {
    report.textContent += `ОШИБКА: ${error.message}`;
  } finally {
    button.disabled = false;
  }
};
