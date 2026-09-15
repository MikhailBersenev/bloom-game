export const COLORS = ['coral', 'gold', 'green', 'blue', 'purple', 'pink'];
export const BOOSTERS = ['line', 'bomb', 'rainbow', 'plane'];
let sequence = 0;
/**
 * Описание операции или проверяемого поведения.
 * @param {number|null} color - Параметр операции.
 * @returns Результат выполнения операции.
 */
export const gem = (color) => ({ kind: 'gem', color, id: ++sequence });
/**
 * Описание операции или проверяемого поведения.
 * @param {string} type - Параметр операции.
 * @param {string} [axis] - Параметр операции.
 * @returns Результат выполнения операции.
 */
export const booster = (type, axis = 'h') => ({ kind: 'booster', type, axis, id: ++sequence });
/**
 * Описание операции или проверяемого поведения.
 * @param {string} [type] - Параметр операции.
 * @param {number} [hp] - Параметр операции.
 * @param {number|null} [color] - Параметр операции.
 * @param {import("../types.js").Cell} [contains] - Параметр операции.
 * @returns Результат выполнения операции.
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
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").Cell} item - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function cloneElement(item) {
  if (!item) return null;
  return { ...item, id: ++sequence, contains: cloneElement(item.contains) };
}
