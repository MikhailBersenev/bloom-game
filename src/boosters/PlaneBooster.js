export class PlaneBooster {
  /**
   * @param {import("../core/Game.js").Game} game
   * @param {number} index
   * @param {string} [axis]
   * @param {number|null} [color]
   * @param {Set<number>} [excluded]
   * @returns {{positions: number[], effect: import("../types.js").BoosterEffect}}
   */
  describe(game, index, axis = 'h', color = null, excluded = new Set()) {
    const target = game.target(excluded);
    const effect = { type: 'plane', i: index, axis };
    if (target >= 0) effect.target = target;
    return { positions: [...(target >= 0 ? [target] : []), ...game.adjacent(index)], effect };
  }
}
