export class PlaneBooster {
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
    const target = game.target(excluded);
    const effect = { type: 'plane', i: index, axis };
    if (target >= 0) effect.target = target;
    return { positions: [...(target >= 0 ? [target] : []), ...game.adjacent(index)], effect };
  }
}
