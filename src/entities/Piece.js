export const COLORS = ['coral', 'gold', 'green', 'blue', 'purple', 'pink'];
export const BOOSTERS = ['line', 'bomb', 'rainbow', 'plane'];
let sequence = 0;
/**
 * Creates a colored gem with a fresh runtime identity.
 * @param {number|null} color - Palette index, or null to select automatically.
 * @returns {import("../types.js").Piece} Result of the described operation.
 */
export const gem = (color) => ({ kind: 'gem', color, id: ++sequence });
/**
 * Creates a booster with its direction and a fresh runtime identity.
 * @param {string} type - Element or event subtype.
 * @param {string} [axis] - Effect direction.
 * @returns {import("../types.js").Piece} Result of the described operation.
 */
export const booster = (type, axis = 'h') => ({ kind: 'booster', type, axis, id: ++sequence });
/**
 * Creates an obstacle with durability and optional nested contents.
 * @param {string} [type] - Element or event subtype.
 * @param {number} [hp] - Obstacle durability.
 * @param {number|null} [color] - Palette index, or null to select automatically.
 * @param {import("../types.js").Cell} [contains] - Nested contents.
 * @returns {import("../types.js").Piece} Result of the described operation.
 */
export const box = (type = 'wood', hp = 1, color = 0, contains = null) => ({
  kind: 'box',
  type,
  hp,
  color,
  contains,
  id: ++sequence,
});
export { elementRules, registerElement } from './obstacles/rules.js';

/**
 * Копирует вложения с новыми ID, чтобы игровые сессии не разделяли изменяемые ящики.
 * @param {import("../types.js").Cell} item - Current element.
 * @returns {import("../types.js").Cell} Result of the described operation.
 */
export function cloneElement(item) {
  if (!item) return null;
  return { ...item, id: ++sequence, contains: cloneElement(item.contains) };
}
