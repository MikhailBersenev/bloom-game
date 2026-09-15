export class BombBooster {
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
    return { positions: game.area(index, 2), effect: { type: 'bomb', i: index, axis } };
  }
}
