import { elementRules } from '../entities/obstacles/rules.js';

/**
 * Выбирает цвет незавершённой цели, затем — наиболее частый цвет на поле.
 * @param {import("../core/Game.js").Game} game
 * @returns {number} Индекс цвета в палитре уровня.
 */
export function bestColor(game) {
  const counts = Array(game.level.colors).fill(0);
  for (const piece of game.board) if (piece?.kind === 'gem') counts[piece.color]++;
  for (const goal of game.level.goals)
    if (goal.key.startsWith('color:') && game.remaining(goal))
      counts[+goal.key.split(':')[1]] += game.board.length;
  return counts.indexOf(Math.max(...counts));
}

/**
 * Выбирает доступную для прямого удара цель: сначала незавершённые цели уровня,
 * затем ящики и бустеры. Уже задетые клетки исключаются для следующих самолётов волны.
 * @param {import("../core/Game.js").Game} game
 * @param {Set<number>} [exclude]
 * @returns {number} Индекс мишени или -1, если подходящих клеток нет.
 */
export function target(game, exclude = new Set()) {
  let best = -1,
    rank = -Infinity;
  for (let index = 0; index < game.board.length; index++) {
    const piece = game.board[index];
    if (!piece || exclude.has(index)) continue;
    // Самолёт наносит прямой удар без цвета матча. Правило ящика определяет,
    // будет ли попадание полезным, в том числе для зарегистрированных расширений.
    if (
      piece.kind === 'box' &&
      !elementRules.get(piece.type)?.canDamage(piece, { direct: true, colors: new Set() })
    )
      continue;
    const keys =
      piece.kind === 'gem'
        ? [`color:${piece.color}`]
        : piece.kind === 'box'
          ? ['box', `box:${piece.type}`]
          : ['booster', `booster:${piece.type}`];
    let value = keys.some(
      /**
       * @param {string} key
       */ (key) =>
        game.level.goals.some(
          /**
           * @param {import("../types.js").GoalConfig} goal
           */ (goal) => goal.key === key && game.remaining(goal) > 0,
        ),
    )
      ? 100
      : 0;
    value += piece.kind === 'box' ? 20 : piece.kind === 'booster' ? 10 : 0;
    if (value > rank) {
      rank = value;
      best = index;
    }
  }

  return best;
}
