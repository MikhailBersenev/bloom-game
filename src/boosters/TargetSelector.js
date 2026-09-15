/**
 * Приоритет у цветов незавершённых целей, затем у количества фишек; равенство решает порядок палитры.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {number} Result of the described operation.
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
 * Выбирает первую цель наивысшего приоритета вне исключённых клеток; каменные блокеры не выбираются.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @param {Set<number>} [exclude] - Positions unavailable for targeting.
 * @returns {number} Result of the described operation.
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
       * Незавершённые цели повышают приоритет выбора элемента.
       * @param {string} key - Collection key supported by the element.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (key) =>
        game.level.goals.some(
          /**
           * Checks whether this matching goal still needs collection.
           * @param {import("../types.js").GoalConfig} goal - Collection requirement.
           * @returns {boolean} Callback result used by the enclosing operation.
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
