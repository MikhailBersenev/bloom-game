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
 */
export {};
