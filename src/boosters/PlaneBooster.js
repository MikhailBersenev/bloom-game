export class PlaneBooster {
  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../core/Game.js").Game} game - Параметр операции.
   * @param {number} index - Параметр операции.
   * @param {string} [axis] - Параметр операции.
   * @param {number|null} [color] - Параметр операции.
   * @param {Set<number>} [excluded] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  describe(game, index, axis = 'h', color = null, excluded = new Set()) {
    const target = game.target(excluded);
    const effect = { type: 'plane', i: index, axis };
    if (target >= 0) effect.target = target;
    return { positions: [...(target >= 0 ? [target] : []), ...game.adjacent(index)], effect };
  }
}
