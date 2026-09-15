/**
 * Описание операции или проверяемого поведения.
 * @typedef {{row: number, col: number}} Position
 * @typedef {'h'|'v'} Axis
 * @typedef {'line'|'bomb'|'plane'|'rainbow'} BoosterType
 * @typedef {Object} Piece
 * @property {'gem'|'booster'|'box'} kind - Свойство структуры.
 * @property {number} id - Свойство структуры.
 * @property {number} [color] - Свойство структуры.
 * @property {string} [type] - Свойство структуры.
 * @property {Axis} [axis] - Свойство структуры.
 * @property {number} [hp] - Свойство структуры.
 * @property {Piece|null} [contains] - Свойство структуры.
 * @typedef {Piece|null} Cell
 * @typedef {{cells: number[], axis: 'h'|'v'|'square'}} MatchPattern
 * @typedef {{cells: number[], patterns: MatchPattern[], color: number, type: BoosterType|null, axis: Axis}} Match
 * @typedef {[number, number]} Move
 * @typedef {{type: string, i: number, axis?: string, target?: number, large?: boolean, label?: string}} BoosterEffect
 * @typedef {Object} GravityMove
 * @property {number} id - Свойство структуры.
 * @property {number} from - Свойство структуры.
 * @property {number} to - Свойство структуры.
 * @property {number} col - Свойство структуры.
 * @property {boolean} spawn - Свойство структуры.
 * @property {number} segmentTop - Свойство структуры.
 * @property {number} segmentBottom - Свойство структуры.
 * @typedef {{key: string, count: number}} GoalConfig
 * @typedef {Object} LevelConfig
 * @property {number} rows - Свойство структуры.
 * @property {number} cols - Свойство структуры.
 * @property {number} colors - Свойство структуры.
 * @property {number} moves - Свойство структуры.
 * @property {GoalConfig[]} goals - Свойство структуры.
 * @property {Array<number|string|Piece|null>} [map] - Свойство структуры.
 * @property {Array<[number, number, Piece|number]>} [placements] - Свойство структуры.
 * @property {number} [id] - Свойство структуры.
 * @property {string} [name] - Свойство структуры.
 * @property {string} [subtitle] - Свойство структуры.
 * @typedef {{i: number, color?: number|null}} Activation
 * @typedef {{a: number, b: number}} Combination
 *
 * Engine events follow this lifecycle:
 * `swap -> remove -> fall -> cascade (optional, repeated) -> ready`.
 * `invalid` replaces the resolution phases for a rejected swap, while `shuffle`
 * may occur before `ready`. Every event is a detached, deeply frozen snapshot.
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
 * Creates and validates the immutable boundary object consumed by UI adapters.
 * @param {string} type @param {Cell[]} board
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
