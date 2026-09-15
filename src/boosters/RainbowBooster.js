export class RainbowBooster {
  /**
   * Calculates affected positions and presentation metadata without mutating game state.
   * @param {import("../core/Game.js").Game} game - Current game session.
   * @param {number} index - Row-major cell position.
   * @param {string} [axis] - Effect direction.
   * @param {number|null} [color] - Palette index, or null to select automatically.
   * @param {Set<number>} [excluded] - Positions unavailable for targeting.
   * @returns {{positions: number[], effect: import("../types.js").BoosterEffect}} Result of the described operation.
   */
  describe(game, index, axis = 'h', color = null, excluded = new Set()) {
    const selectedColor = color ?? game.bestColor();
    const positions = [...game.board.keys()].filter(
      /**
       * Selects gems of the chosen color, excluding all other element kinds.
       * @param {number} position - Row-major cell position.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (position) =>
        game.board[position]?.kind === 'gem' && game.board[position].color === selectedColor,
    );
    return { positions, effect: { type: 'rainbow', i: index, axis } };
  }
}
