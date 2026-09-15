export class RainbowBooster {
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
    const selectedColor = color ?? game.bestColor();
    const positions = [...game.board.keys()].filter(
      /**
       * Описание операции или проверяемого поведения.
       * @param {number} position - Параметр операции.
       * @returns Результат выполнения операции.
       */ (position) =>
        game.board[position]?.kind === 'gem' && game.board[position].color === selectedColor,
    );
    return { positions, effect: { type: 'rainbow', i: index, axis } };
  }
}
