export class RainbowBooster {
  /**
   * @param {import("../core/Game.js").Game} game
   * @param {number} index
   * @param {string} [axis]
   * @param {number|null} [color]
   * @param {Set<number>} [excluded]
   * @returns {{positions: number[], effect: import("../types.js").BoosterEffect}}
   */
  describe(game, index, axis = 'h', color = null, excluded = new Set()) {
    const selectedColor = color ?? game.bestColor();
    const positions = [...game.board.keys()].filter(
      /**
       * @param {number} position
       * @returns {boolean}
       */ (position) =>
        game.board[position]?.kind === 'gem' && game.board[position].color === selectedColor,
    );
    return { positions, effect: { type: 'rainbow', i: index, axis } };
  }
}
