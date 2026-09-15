/**
 * Общие типы движка. Индекс клетки считается построчно, индексы цветов начинаются с нуля.
 * @typedef {{row: number, col: number}} Position
 * @typedef {'h'|'v'} Axis
 * @typedef {'line'|'bomb'|'plane'|'rainbow'} BoosterType
 * @typedef {Object} Piece
 * @property {'gem'|'booster'|'box'} kind - Категория элемента на поле.
 * @property {number} id - Уникальный идентификатор экземпляра для отслеживания анимаций.
 * @property {number} [color] - Индекс цвета фишки или ящика.
 * @property {string} [type] - Тип бустера или правило ящика в реестре.
 * @property {Axis} [axis] - Направление линейного бустера.
 * @property {number} [hp] - Оставшиеся жизни ящика.
 * @property {Piece|null} [contains] - Содержимое, раскрываемое после разрушения ящика.
 * @typedef {Piece|null} Cell
 * @typedef {{cells: number[], axis: 'h'|'v'|'square'}} MatchPattern
 * @typedef {{cells: number[], patterns: MatchPattern[], color: number, type: BoosterType|null, axis: Axis}} Match
 * @typedef {[number, number]} Move
 * @typedef {{type: string, i: number, axis?: string, target?: number, large?: boolean, label?: string}} BoosterEffect
 * @typedef {Object} GravityMove
 * @property {number} id - Идентификатор фишки.
 * @property {number} from - Начальная строка; для новых фишек источник выше границы своей секции.
 * @property {number} to - Конечная строка.
 * @property {number} col - Столбец.
 * @property {boolean} spawn - Новая фишка, ожидающая отдельной фазы появления.
 * @property {number} segmentTop - Верхняя свободная строка; граница видимости при появлении.
 * @property {number} segmentBottom - Нижняя свободная строка.
 * @typedef {{key: string, count: number}} GoalConfig
 * @typedef {Object} LevelConfig
 * @property {number} rows - Высота поля в клетках.
 * @property {number} cols - Ширина поля в клетках.
 * @property {number} colors - Количество доступных цветов.
 * @property {number} moves - Начальный запас ходов.
 * @property {GoalConfig[]} goals - Все цели, необходимые для победы.
 * @property {Array<number|string|Piece|null>} [map] - Построчная карта: число задаёт цвет, '?' или null означают случайную фишку.
 * @property {Array<[number, number, Piece|number]>} [placements] - Заданные клетки шаблона в формате [строка, столбец, элемент].
 * @property {number} [id] - Номер уровня.
 * @property {string} [name] - Название в интерфейсе.
 * @property {string} [subtitle] - Описание уровня.
 * @typedef {{i: number, color?: number|null}} Activation
 * @typedef {{a: number, b: number}} Combination
 *
 * Последовательность событий принятого обмена:
 * `swap → remove → fall → (cascade → remove → fall)* → ready`.
 * При отклонённом обмене после `swap` приходит `invalid`; перед `ready` возможно
 * событие `shuffle`. Каждое событие — независимый, глубоко замороженный снимок.
 *
 * @typedef {Readonly<{type: string, board: ReadonlyArray<Cell>} & Record<string, unknown>>} BaseEngineEvent
 * @typedef {BaseEngineEvent & Readonly<{type: 'swap'}>} SwapEvent
 * @typedef {BaseEngineEvent & Readonly<{type: 'invalid'}>} InvalidEvent
 * @typedef {BaseEngineEvent & Readonly<{type: 'shuffle'}>} ShuffleEvent
 * @typedef {BaseEngineEvent & Readonly<{type: 'ready'}>} ReadyEvent
 * @typedef {BaseEngineEvent & Readonly<{type: 'cascade', chain: number}>} CascadeEvent
 * @typedef {BaseEngineEvent & Readonly<{type: 'fall', falls: ReadonlyArray<GravityMove>}>} FallEvent
 * @typedef {BaseEngineEvent & Readonly<{
 *   type: 'remove', removed: ReadonlyArray<number>, damaged: ReadonlyArray<number>,
 *   effects: ReadonlyArray<BoosterEffect>, creations: ReadonlyArray<number>
 * }>} RemoveEvent
 * @typedef {SwapEvent|InvalidEvent|ShuffleEvent|ReadyEvent|CascadeEvent|FallEvent|RemoveEvent} EngineEvent
 * @typedef {'swap'|'invalid'|'shuffle'|'ready'|'cascade'|'fall'|'remove'} EngineEventType
 * @typedef {{random?: () => number, animate?: (event: EngineEvent, game: import('./core/Game.js').Game) => Promise<void>}} GameOptions
 */

const EVENT_PAYLOAD_FIELDS = Object.freeze({
  swap: [],
  invalid: [],
  shuffle: [],
  ready: [],
  cascade: ['chain'],
  fall: ['falls'],
  remove: ['removed', 'damaged', 'effects', 'creations'],
});

export const ENGINE_EVENT_TYPES = Object.freeze(Object.keys(EVENT_PAYLOAD_FIELDS));

function frozenCopy(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
  return Object.freeze(
    Object.fromEntries(Object.entries(value).map(([key, item]) => [key, frozenCopy(item)])),
  );
}

/**
 * Проверяет поля события и создаёт неизменяемый снимок для адаптеров интерфейса.
 * @param {string} type - Тип события из ENGINE_EVENT_TYPES.
 * @param {Cell[]} board - Состояние поля для копирования.
 * @param {Record<string, unknown>} [payload]
 * @returns {EngineEvent}
 */
export function createEngineEvent(type, board, payload = {}) {
  const requiredFields = EVENT_PAYLOAD_FIELDS[type];
  if (!requiredFields) throw new TypeError(`Unknown engine event type: ${type}`);

  const unexpected = Object.keys(payload).find((field) => !requiredFields.includes(field));
  if (unexpected)
    throw new TypeError(`Unexpected field "${unexpected}" for engine event "${type}"`);
  const missing = requiredFields.find((field) => !(field in payload));
  if (missing) throw new TypeError(`Missing field "${missing}" for engine event "${type}"`);

  if (type === 'cascade' && (!Number.isInteger(payload.chain) || payload.chain < 1)) {
    throw new TypeError('Cascade event chain must be a positive integer');
  }
  for (const field of requiredFields.filter((field) => field !== 'chain')) {
    if (!Array.isArray(payload[field])) {
      throw new TypeError(`Engine event field "${field}" must be an array`);
    }
  }

  return frozenCopy({ type, board, ...payload });
}
