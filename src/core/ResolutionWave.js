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
 * Одна волна удаления включает все бустеры её цепной реакции.
 * Урон накапливается до изменения поля: ящик теряет не больше одной жизни,
 * а раскрытое содержимое защищено от повторного попадания до следующей волны.
 */
export class ResolutionWave {
  /**
   * Initializes owned state and injected dependencies.
   * @param {import("../core/Game.js").Game} game - Current game session.
   * @returns {void} Completes the operation.
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
   * Попадания накапливаются в одной волне; задетые бустеры добавляются в очередь.
   * @param {number} index - Row-major cell position.
   * @param {boolean} [direct] - Whether the hit comes from a booster.
   * @param {number|null} [color] - Palette index, or null to select automatically.
   * @returns {void} Completes the operation.
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
   * Marks each affected position as direct booster damage.
   * @param {Iterable<number>} indices - Positions to compare.
   * @returns {void} Completes the operation.
   */
  hitAll(indices) {
    for (const index of indices) this.hit(index, true);
  }

  /**
   * Цвета матчей определяют урон; при создании бустера приоритет у переставленных клеток.
   * @param {import("../types.js").Match[]} groups - Connected matches.
   * @returns {void} Completes the operation.
   */
  addMatches(groups) {
    for (const group of groups) {
      for (const index of group.cells) this.hit(index, false, group.color);
      if (!group.type) continue;
      const position =
        this.game.preferred?.find(
          /**
           * Selects the preferred swapped cell that belongs to this match.
           * @param {number} index - Row-major cell position.
           * @returns {boolean} Callback result used by the enclosing operation.
           */ (index) => group.cells.includes(index),
        ) ?? group.cells[Math.floor(group.cells.length / 2)];
      this.creations.set(position, booster(group.type, group.axis));
    }
  }

  /**
   * Describes the booster effect and queues its affected positions for the current wave.
   * @param {number} index - Row-major cell position.
   * @param {string} type - Element or event subtype.
   * @param {string} [axis] - Effect direction.
   * @param {number|null} [color] - Palette index, or null to select automatically.
   * @returns {void} Completes the operation.
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
   * Активация засчитывается одновременно в общую цель бустеров и цель своего типа.
   * @param {import("../types.js").Cell} item - Current element.
   * @returns {void} Completes the operation.
   */
  collectBooster(item) {
    this.game.collect('booster');
    this.game.collect(`booster:${item.type}`);
  }

  /**
   * Сохраняет исходный цвет до замены: сбор произойдёт после анимации удаления,
   * а созданный бустер попадёт в общую очередь и активируется один раз.
   * @param {number} index - Позиция исходной фишки.
   * @param {import('../types.js').Piece} replacement - Создаваемый бустер.
   */
  transformGem(index, replacement) {
    const item = this.game.board[index];
    if (item?.kind !== 'gem' || this.transformedGems.has(index)) return;
    this.transformedGems.set(index, item);
    this.game.board[index] = replacement;
    this.queue.push({ i: index });
  }

  /**
   * Бустеры активируются в порядке очереди, каждая клетка — не более одного раза за волну.
   * @returns {void} Completes the operation.
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
   * Объединяет прямые попадания и цвета соседних матчей; правило ящика определяет допустимость урона.
   * @returns {number[]} Result of the described operation.
   */
  damagedBoxes() {
    const boxHits = new Map();
    const addHit = /**
     * Merges direct and color damage into a single obstacle hit record.
     * @param {number} index - Row-major cell position.
     * @param {boolean} direct - Whether damage is a direct booster hit.
     * @param {Iterable<number>} colors - Colors of adjacent matches.
     * @returns {void} Completes the callback side effects.
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
         * Applies the registered obstacle damage policy.
         * @param {*} entry0 - Destructured entry supplied by the enclosing operation.
         * @returns {boolean} Callback result used by the enclosing operation.
         */ ([index, hit]) => {
          const item = this.game.board[index];
          return elementRules.get(item.type)?.canDamage(item, hit);
        },
      )
      .map(
        /**
         * Extracts a damage-approved obstacle position.
         * @param {*} entry0 - Destructured entry supplied by the enclosing operation.
         * @returns {*} Callback result used by the enclosing operation.
         */ ([index]) => index,
      );
  }

  /**
   * Сначала собирает фишки, затем повреждает ящики один раз и раскрывает защищённое содержимое.
   * @param {number[]} damaged - Obstacle indices receiving one hit.
   * @returns {void} Completes the operation.
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
   * Сначала рассчитывает всю волну и ждёт удаления, затем изменяет поле и запускает падение.
   * @param {import("../types.js").Match[]} groups - Connected matches.
   * @param {import("../types.js").Activation[]} activation - Initial booster queue.
   * @param {import("../types.js").Combination|null} combo - Optional paired activation.
   * @returns {Promise<void>} Completes the operation.
   */
  async resolve(groups, activation, combo) {
    this.queue.push(...activation);
    this.addMatches(groups);
    if (combo) new BoosterCombinationResolver(this).combine(combo);
    this.activateChain();
    const damaged = this.damagedBoxes();
    const removed = [...this.hits].filter(
      /**
       * Удаление не затрагивает ящики и бустеры, создаваемые текущим матчем.
       * @param {number} index - Row-major cell position.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (index) => this.game.board[index]?.kind !== 'box' && !this.creations.has(index),
    );
    for (const index of damaged) if (this.game.board[index].hp <= 1) removed.push(index);

    // Длительность задаёт UI: падение ждёт завершения эффектов и удаления.
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
