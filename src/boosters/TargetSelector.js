/**
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @returns Результат выполнения операции.
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
 * Описание операции или проверяемого поведения.
 * @param {import("../core/Game.js").Game} game - Параметр операции.
 * @param {Set<number>} [exclude] - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function target(game, exclude = new Set()) {
  let best = -1,
    rank = -Infinity;
  for (let index = 0; index < game.board.length; index++) {
    const piece = game.board[index];
    if (!piece || exclude.has(index) || piece.type === 'blocker') continue;
    const keys =
      piece.kind === 'gem'
        ? [`color:${piece.color}`]
        : piece.kind === 'box'
          ? ['box', `box:${piece.type}`]
          : ['booster', `booster:${piece.type}`];
    let value = keys.some(
      /**
       * Описание операции или проверяемого поведения.
       * @param {string} key - Параметр операции.
       * @returns Результат выполнения операции.
       */ (key) =>
        game.level.goals.some(
          /**
           * Описание операции или проверяемого поведения.
           * @param {import("../types.js").GoalConfig} goal - Параметр операции.
           * @returns Результат выполнения операции.
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
