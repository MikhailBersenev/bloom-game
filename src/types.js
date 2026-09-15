/**
 * Shared domain vocabulary. Cell positions use row-major numeric indices in the engine.
 * @typedef {{row: number, col: number}} Position
 * @typedef {'h'|'v'} Axis
 * @typedef {'line'|'bomb'|'plane'|'rainbow'} BoosterType
 * @typedef {Object} Piece
 * @property {'gem'|'booster'|'box'} kind - Runtime element category.
 * @property {number} id - Unique runtime identity used by animations.
 * @property {number} [color] - Zero-based palette index.
 * @property {string} [type] - Booster or obstacle subtype.
 * @property {Axis} [axis] - Line direction.
 * @property {number} [hp] - Remaining obstacle durability.
 * @property {Piece|null} [contains] - Nested obstacle contents.
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
 * @property {number} rows - Board height.
 * @property {number} cols - Board width.
 * @property {number} colors - Number of available colors.
 * @property {number} moves - Initial move budget.
 * @property {GoalConfig[]} goals - Required collection counts.
 * @property {Array<number|string|Piece|null>} [map] - Fixed and random cell templates.
 * @property {Array<[number, number, Piece|number]>} [placements] - Sparse template positions.
 * @property {number} [id] - Level number.
 * @property {string} [name] - Display name.
 * @property {string} [subtitle] - Display description.
 * @typedef {{i: number, color?: number|null}} Activation
 * @typedef {{a: number, b: number}} Combination
 */
export {};
