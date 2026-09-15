import { LineBooster } from '../boosters/LineBooster.js';
import { BombBooster } from '../boosters/BombBooster.js';
import { RainbowBooster } from '../boosters/RainbowBooster.js';
import { PlaneBooster } from '../boosters/PlaneBooster.js';
import { BoosterCombinationResolver } from '../boosters/BoosterCombinationResolver.js';
import { booster, elementRules } from '../entities/Piece.js';

const boosterEffects = new Map([
  ['line', new LineBooster()],
  ['bomb', new BombBooster()],
  ['rainbow', new RainbowBooster()],
  ['plane', new PlaneBooster()],
]);

const GEM_SCORE = 50;
const BOX_SCORE = 100;

/**
 * Описание операции или проверяемого поведения.
 * Описание операции или проверяемого поведения.
 * Описание операции или проверяемого поведения.
 */
export class ResolutionWave {
  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../core/Game.js").Game} game - Параметр операции.
   * @returns Результат выполнения операции.
   */
  constructor(game) {
    this.game = game;
    this.hits = new Set();
    this.directHits = new Set();
    this.matchColors = new Map();
    this.creations = new Map();
    this.effects = [];
    this.queue = [];
    this.activated = new Set();
    this.transformedGems = new Map();
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} index - Параметр операции.
   * @param {boolean} [direct] - Параметр операции.
   * @param {number|null} [color] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  hit(index, direct = false, color = null) {
    if (index < 0 || index >= this.game.board.length) return;
    this.hits.add(index);
    if (direct) this.directHits.add(index);
    if (color !== null) {
      if (!this.matchColors.has(index)) this.matchColors.set(index, new Set());
      this.matchColors.get(index).add(color);
    }
    if (this.game.board[index]?.kind === 'booster' && !this.activated.has(index)) {
      this.queue.push({ i: index });
    }
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {Iterable<number>} indices - Параметр операции.
   * @returns Результат выполнения операции.
   */
  hitAll(indices) {
    for (const index of indices) this.hit(index, true);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").Match[]} groups - Параметр операции.
   * @returns Результат выполнения операции.
   */
  addMatches(groups) {
    for (const group of groups) {
      for (const index of group.cells) this.hit(index, false, group.color);
      if (!group.type) continue;
      const position =
        this.game.preferred?.find(
          /**
           * Описание операции или проверяемого поведения.
           * @param {number} index - Параметр операции.
           * @returns Результат выполнения операции.
           */ (index) => group.cells.includes(index),
        ) ?? group.cells[Math.floor(group.cells.length / 2)];
      this.creations.set(position, booster(group.type, group.axis));
    }
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} index - Параметр операции.
   * @param {string} type - Параметр операции.
   * @param {string} [axis] - Параметр операции.
   * @param {number|null} [color] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  trigger(index, type, axis = 'h', color = null) {
    const handler = boosterEffects.get(type);
    if (!handler) {
      this.effects.push({ type, i: index, axis });
      return;
    }
    const { positions, effect } = handler.describe(this.game, index, axis, color, this.hits);
    this.effects.push(effect);
    this.hitAll(positions);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").Cell} item - Параметр операции.
   * @returns Результат выполнения операции.
   */
  collectBooster(item) {
    this.game.collect('booster');
    this.game.collect(`booster:${item.type}`);
  }

  /**
   * Описание операции или проверяемого поведения.
   * Описание операции или проверяемого поведения.
   * @param {number} index - Параметр операции.
   * @param {import('../types.js').Piece} replacement - Параметр операции.
   */
  transformGem(index, replacement) {
    const item = this.game.board[index];
    if (item?.kind !== 'gem' || this.transformedGems.has(index)) return;
    this.transformedGems.set(index, item);
    this.game.board[index] = replacement;
    this.queue.push({ i: index });
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  activateChain() {
    while (this.queue.length) {
      const { i: index, color } = this.queue.shift();
      if (this.activated.has(index)) continue;
      const item = this.game.board[index];
      if (item?.kind !== 'booster') continue;
      this.activated.add(index);
      this.hit(index, true);
      this.collectBooster(item);
      this.trigger(index, item.type, item.axis, color);
    }
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  damagedBoxes() {
    const boxHits = new Map();
    const addHit = /**
     * Объединяет прямой урон и цветовой урон в одну запись попадания по ящику.
     * @param {number} index - Индекс клетки в порядке строк.
     * @param {boolean} direct - Признак прямого попадания бустера.
     * @param {Iterable<number>} colors - Цвета соседних матчей.
     * @returns {void} Завершает побочные эффекты callback-функции.
     */ (index, direct, colors) => {
      if (this.game.board[index]?.kind !== 'box') return;
      if (!boxHits.has(index)) boxHits.set(index, { direct: false, colors: new Set() });
      const hit = boxHits.get(index);
      hit.direct ||= direct;
      for (const color of colors) hit.colors.add(color);
    };
    for (const index of this.hits) {
      addHit(index, this.directHits.has(index), this.matchColors.get(index) || []);
      if (!this.matchColors.has(index)) continue;
      for (const neighbor of this.game.adjacent(index)) {
        addHit(neighbor, false, this.matchColors.get(index));
      }
    }
    return [...boxHits]
      .filter(
        /**
         * Описание операции или проверяемого поведения.
         * @param {*} entry0 - Параметр операции.
         * @returns Результат выполнения операции.
         */ ([index, hit]) => {
          const item = this.game.board[index];
          return elementRules.get(item.type)?.canDamage(item, hit);
        },
      )
      .map(
        /**
         * Описание операции или проверяемого поведения.
         * @param {*} entry0 - Параметр операции.
         * @returns Результат выполнения операции.
         */ ([index]) => index,
      );
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number[]} damaged - Параметр операции.
   * @returns Результат выполнения операции.
   */
  applyDamage(damaged) {
    const game = this.game;
    for (const index of this.hits) {
      const item = game.board[index];
      if (!item || item.kind === 'box') continue;
      const collectedGem = this.transformedGems.get(index) ?? (item.kind === 'gem' ? item : null);
      if (collectedGem) {
        game.collect(`color:${collectedGem.color}`);
        game.score += GEM_SCORE;
      }
      game.board[index] = null;
    }
    for (const index of damaged) {
      const item = game.board[index];
      item.hp--;
      if (item.hp > 0) continue;
      game.collect('box');
      game.collect(`box:${item.type}`);
      game.score += BOX_SCORE;
      game.board[index] = game.clone(item.contains);
    }
    for (const [index, item] of this.creations) game.board[index] = item;
    game.preferred = null;
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").Match[]} groups - Параметр операции.
   * @param {import("../types.js").Activation[]} activation - Параметр операции.
   * @param {import("../types.js").Combination|null} combo - Параметр операции.
   * @returns Результат выполнения операции.
   */
  async resolve(groups, activation, combo) {
    this.queue.push(...activation);
    this.addMatches(groups);
    if (combo) new BoosterCombinationResolver(this).combine(combo);
    this.activateChain();
    const damaged = this.damagedBoxes();
    const removed = [...this.hits].filter(
      /**
       * Описание операции или проверяемого поведения.
       * @param {number} index - Параметр операции.
       * @returns Результат выполнения операции.
       */ (index) => this.game.board[index]?.kind !== 'box' && !this.creations.has(index),
    );
    for (const index of damaged) if (this.game.board[index].hp <= 1) removed.push(index);

    // Описание совместимости и назначения модуля.
    await this.game.emit('remove', {
      removed,
      damaged,
      effects: this.effects,
      creations: [...this.creations.keys()],
    });
    this.applyDamage(damaged);
    await this.game.gravity();
  }
}
