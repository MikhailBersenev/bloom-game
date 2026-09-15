import { booster } from '../entities/Piece.js';

/** Создаёт одинаковый ключ для обоих порядков пары бустеров.
 * @param {string} firstType
 * @param {string} secondType
 * @returns {string}
 */
export function combinationKey(firstType, secondType) {
  return [firstType, secondType].sort().join('+');
}

/**
 * @typedef {Object} CombinationContext
 * @property {import('../core/ResolutionWave.js').ResolutionWave} wave
 * @property {number} a - Первая клетка комбинации после обмена.
 * @property {number} b - Вторая клетка после обмена; центр большинства эффектов.
 * @property {import('../types.js').Piece} first - Бустер в клетке a.
 * @property {import('../types.js').Piece} second - Бустер в клетке b.
 * @property {(partner: import('../types.js').Piece, origin: number) => void} convertColor - Превращает выбранный цвет в бустеры и ставит их в очередь активации.
 * @property {(origin: number) => number} flyToTarget - Помечает полезную мишень как задетую и возвращает её индекс либо -1.
 */

/** @type {Map<string, (context: CombinationContext) => void>} */
export const combinationStrategies = new Map();

/**
 * Регистрирует или заменяет обработчик комбинации; состояние волны передаётся через контекст.
 * @param {string} firstType @param {string} secondType
 * @param {(context: CombinationContext) => void} strategy
 * @returns {string}
 */
export function registerBoosterCombination(firstType, secondType, strategy) {
  if (!firstType || !secondType) throw new TypeError('Booster types are required');
  if (typeof strategy !== 'function')
    throw new TypeError('Combination strategy must be a function');
  const key = combinationKey(firstType, secondType);
  combinationStrategies.set(key, strategy);
  return key;
}

registerBoosterCombination('rainbow', 'rainbow', ({ wave, b }) => {
  wave.hitAll(wave.game.board.keys());
  wave.effects.push({ type: 'rainbow', i: b });
});

for (const partnerType of ['bomb', 'line', 'plane']) {
  registerBoosterCombination('rainbow', partnerType, ({ first, second, b, convertColor }) => {
    convertColor(first.type === 'rainbow' ? second : first, b);
  });
}

registerBoosterCombination('bomb', 'bomb', ({ wave, b }) => {
  wave.hitAll(wave.game.area(b, 4));
  wave.effects.push({ type: 'bomb', i: b, large: true });
});

registerBoosterCombination('line', 'line', ({ wave, b }) => {
  wave.hitAll([...wave.game.line(b, 'h'), ...wave.game.line(b, 'v')]);
  wave.effects.push({ type: 'line', i: b, axis: 'both' });
});

registerBoosterCombination('bomb', 'line', ({ wave, b }) => {
  wave.hitAll([...wave.game.line(b, 'h', 2), ...wave.game.line(b, 'v', 2)]);
  wave.effects.push({ type: 'line', i: b, axis: 'both', large: true });
});

registerBoosterCombination('plane', 'plane', ({ b, flyToTarget }) => {
  for (let flight = 0; flight < 3; flight++) flyToTarget(b);
});

for (const cargoType of ['bomb', 'line']) {
  registerBoosterCombination('plane', cargoType, ({ wave, first, second, b, flyToTarget }) => {
    const cargo = first.type === 'plane' ? second : first;
    const target = flyToTarget(b);
    if (target >= 0) wave.trigger(target, cargo.type, cargo.axis);
  });
}

export class BoosterCombinationResolver {
  /** @param {import('../core/ResolutionWave.js').ResolutionWave} wave */
  constructor(wave) {
    this.wave = wave;
  }

  /**
   * Засчитывает оба бустера и передаёт расчёт эффекта обработчику из реестра.
   * Неизвестная комбинация расходует оба бустера без дополнительного эффекта и возвращает `false`.
   * @param {import('../types.js').Combination} options
   * @returns {boolean}
   */
  combine({ a, b }) {
    const game = this.wave.game;
    const first = game.board[a];
    const second = game.board[b];
    if (first?.kind !== 'booster' || second?.kind !== 'booster') {
      throw new TypeError('A booster combination requires two boosters');
    }
    this.wave.activated.add(a);
    this.wave.activated.add(b);
    this.wave.hitAll([a, b]);
    this.wave.collectBooster(first);
    this.wave.collectBooster(second);

    const key = combinationKey(first.type, second.type);
    this.wave.effects.push({ type: 'combo', i: b, label: key });
    const strategy = combinationStrategies.get(key);
    if (!strategy) return false;
    strategy({
      wave: this.wave,
      a,
      b,
      first,
      second,
      convertColor: (partner, origin) => this.convertColor(partner, origin),
      flyToTarget: (origin) => this.flyToTarget(origin),
    });
    return true;
  }

  /** Сохраняет сбор исходных фишек при превращении выбранного цвета в цепь бустеров.
   * @param {import('../types.js').Piece} partner
   * @param {number} origin
   */
  convertColor(partner, origin) {
    const color = this.wave.game.bestColor();
    this.wave.game.board.forEach((item, index) => {
      if (item?.kind !== 'gem' || item.color !== color) return;
      this.wave.transformGem(index, booster(partner.type, index % 2 ? 'h' : 'v'));
    });
    this.wave.effects.push({ type: 'rainbow', i: origin });
  }

  /** Выбирает новую мишень с учётом уже задетых клеток этой волны.
   * @param {number} origin
   * @returns {number} Индекс мишени или -1, если подходящих клеток нет.
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
