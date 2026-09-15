import { booster } from '../entities/Piece.js';

export class BoosterCombinationResolver {
  /**
   * Initializes owned state and injected dependencies.
   * @param {import("../core/ResolutionWave.js").ResolutionWave} wave - Accumulated wave receiving combination effects.
   * @returns {void} Completes the operation.
   */
  constructor(wave) {
    this.wave = wave;
  }
  /**
   * Оба участника комбинации засчитываются до запуска цепной реакции.
   * @param {import("../types.js").Combination} options - Indices of the two exchanged boosters.
   * @returns {void} Completes the operation.
   */
  combine({ a, b }) {
    const game = this.wave.game;
    const first = game.board[a];
    const second = game.board[b];
    this.wave.activated.add(a);
    this.wave.activated.add(b);
    this.wave.hitAll([a, b]);
    this.wave.collectBooster(first);
    this.wave.collectBooster(second);
    const types = [first.type, second.type].sort();
    const combination = types.join('+');
    this.wave.effects.push({ type: 'combo', i: b, label: combination });

    switch (combination) {
      case 'rainbow+rainbow':
        this.wave.hitAll(game.board.keys());
        this.wave.effects.push({ type: 'rainbow', i: b });
        break;
      case 'bomb+rainbow':
      case 'line+rainbow':
      case 'plane+rainbow':
        this.convertColor(first.type === 'rainbow' ? second : first, b);
        break;
      case 'bomb+bomb':
        this.wave.hitAll(game.area(b, 4));
        this.wave.effects.push({ type: 'bomb', i: b, large: true });
        break;
      case 'line+line':
        this.wave.hitAll([...game.line(b, 'h'), ...game.line(b, 'v')]);
        this.wave.effects.push({ type: 'line', i: b, axis: 'both' });
        break;
      case 'bomb+line':
        this.wave.hitAll([...game.line(b, 'h', 2), ...game.line(b, 'v', 2)]);
        this.wave.effects.push({ type: 'line', i: b, axis: 'both', large: true });
        break;
      case 'plane+plane':
        for (let flight = 0; flight < 3; flight++) this.flyToTarget(b);
        break;
      case 'bomb+plane':
      case 'line+plane': {
        const cargo = first.type === 'plane' ? second : first;
        const target = this.flyToTarget(b);
        if (target >= 0) this.wave.trigger(target, cargo.type, cargo.axis);
        break;
      }
    }
  }
  /**
   * Фишки выбранного цвета превращаются в бустеры партнёра и активируются в порядке клеток поля.
   * @param {import("../types.js").Piece} partner - Partner booster.
   * @param {number} origin - Effect origin index.
   * @returns {void} Completes the operation.
   */
  convertColor(partner, origin) {
    const color = this.wave.game.bestColor();
    this.wave.game.board.forEach(
      /**
       * Converts a gem of the chosen color into the partner booster and queues it.
       * @param {import("../types.js").Cell} item - Current element.
       * @param {number} index - Row-major cell position.
       * @returns {void} Completes the callback side effects.
       */ (item, index) => {
        if (item?.kind !== 'gem' || item.color !== color) return;
        this.wave.transformGem(index, booster(partner.type, index % 2 ? 'h' : 'v'));
      },
    );
    this.wave.effects.push({ type: 'rainbow', i: origin });
  }
  /**
   * Каждый полёт резервирует отдельную приоритетную цель; -1 означает отсутствие доступных целей.
   * @param {number} origin - Effect origin index.
   * @returns {number} Result of the described operation.
   */
  flyToTarget(origin) {
    const target = this.wave.game.target(this.wave.hits);
    if (target >= 0) {
      this.wave.hit(target, true);
      this.wave.effects.push({ type: 'plane', i: origin, target });
    }
    return target;
  }
}
