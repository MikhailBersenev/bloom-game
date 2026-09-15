export const COLORS = ['coral', 'gold', 'green', 'blue', 'purple', 'pink'];
export const BOOSTERS = ['line', 'bomb', 'rainbow', 'plane'];
let sequence = 0;
/**
 * @param {number|null} color
 * @returns {import("../types.js").Piece}
 */
export const gem = (color) => ({ kind: 'gem', color, id: ++sequence });
/**
 * @param {string} type
 * @param {string} [axis]
 * @returns {import("../types.js").Piece}
 */
export const booster = (type, axis = 'h') => ({ kind: 'booster', type, axis, id: ++sequence });
/**
 * @param {string} [type]
 * @param {number} [hp]
 * @param {number|null} [color]
 * @param {import("../types.js").Cell} [contains]
 * @returns {import("../types.js").Piece}
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
 * @param {import("../types.js").Cell} item
 * @returns {import("../types.js").Cell}
 */
export function cloneElement(item) {
  if (!item) return null;
  return { ...item, id: ++sequence, contains: cloneElement(item.contains) };
}
