import { COLORS } from '../entities/Piece.js';
const gemNames = ['Клубника', 'Лимон', 'Листик', 'Капля', 'Цветок', 'Малина'];
export const boosterNames = {
  line: 'Линия',
  bomb: 'Бомба',
  rainbow: 'Радужный шар',
  plane: 'Самолётик',
};
const boxNames = {
  wood: 'Деревянный ящик',
  colored: 'Цветной ящик',
  cycling: 'Меняющий цвет ящик',
  blocker: 'Каменный блокер',
};
// Textures are standalone SVG files, shared by the board, goals and effects.
/**
 * Returns decorative SVG image markup for an element, or an empty string for unsupported types.
 * @param {import("../types.js").Cell} item - Current element.
 * @returns {string} Result of the described operation.
 */
export function icon(item) {
  if (!item) return '';
  let name;
  if (item.kind === 'gem') name = 'gem-' + COLORS[item.color];
  else if (item.kind === 'booster')
    name = 'booster-' + item.type + (item.type === 'line' ? '-' + (item.axis || 'h') : '');
  else if (item.kind === 'box')
    name =
      'box-' +
      (['colored', 'cycling', 'blocker'].includes(item.type) ? item.type : 'wood') +
      (['colored', 'cycling'].includes(item.type) ? '-' + COLORS[item.color] : '');
  else return '';
  return `<img class="texture" src="/src/textures/${name}.svg" alt="" aria-hidden="true" draggable="false" width="80" height="80">`;
}
/**
 * Returns an accessible Russian description including obstacle durability and nested contents.
 * @param {import("../types.js").Cell} item - Current element.
 * @returns {string} Result of the described operation.
 */
export function itemLabel(item) {
  if (item.kind === 'gem') return gemNames[item.color];
  if (item.kind === 'booster') return boosterNames[item.type];
  const contents = item.contains ? ', внутри сюрприз' : '';
  const color = ['colored', 'cycling'].includes(item.type) ? `, цвет: ${gemNames[item.color]}` : '';
  return `${boxNames[item.type] || item.type}${color}, прочность ${item.hp}${contents}`;
}
/**
 * Builds the display-only element representing a goal key.
 * @param {string} key - Collection key supported by the element.
 * @returns {Object} Result of the described operation.
 */
export function goalItem(key) {
  if (key.startsWith('color:')) return { kind: 'gem', color: +key.split(':')[1] };
  if (key.startsWith('box'))
    return { kind: 'box', type: key.split(':')[1] || 'wood', hp: 1, color: 2 };
  return { kind: 'booster', type: key.split(':')[1] || 'line' };
}

/** Describes a goal category without inventing a required box color or durability.
 * @param {string} key - Collection key from the level configuration.
 * @returns {string} Accessible category label.
 */
export function goalLabel(key) {
  if (key.startsWith('color:')) return gemNames[Number(key.split(':')[1])];
  if (key === 'box') return 'Ящики';
  if (key === 'booster') return 'Бустеры';
  const [kind, type] = key.split(':');
  return kind === 'box' ? boxNames[type] || type : boosterNames[type] || type;
}
