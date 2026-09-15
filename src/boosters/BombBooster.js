export class BombBooster {
  /**
   * @param {import("../core/Game.js").Game} game
   * @param {number} index
   * @param {string} [axis]
   * @param {number|null} [color]
   * @param {Set<number>} [excluded]
   * @returns {{positions: number[], effect: import("../types.js").BoosterEffect}}
   */
  describe(game, index, axis = 'h', color = null, excluded = new Set()) {
    return { positions: game.area(index, 2), effect: { type: 'bomb', i: index, axis } };
  }
}
