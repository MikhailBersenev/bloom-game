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
// Описание совместимости и назначения модуля.
/**
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").Cell} item - Параметр операции.
 * @returns Результат выполнения операции.
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
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").Cell} item - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function itemLabel(item) {
  if (item.kind === 'gem') return gemNames[item.color];
  if (item.kind === 'booster') return boosterNames[item.type];
  const contents = item.contains ? ', внутри сюрприз' : '';
  const color = ['colored', 'cycling'].includes(item.type) ? `, цвет: ${gemNames[item.color]}` : '';
  return `${boxNames[item.type] || item.type}${color}, прочность ${item.hp}${contents}`;
}
/**
 * Описание операции или проверяемого поведения.
 * @param {string} key - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function goalItem(key) {
  if (key.startsWith('color:')) return { kind: 'gem', color: +key.split(':')[1] };
  if (key.startsWith('box'))
    return { kind: 'box', type: key.split(':')[1] || 'wood', hp: 1, color: 2 };
  return { kind: 'booster', type: key.split(':')[1] || 'line' };
}

/** Описывает категорию цели, не выдумывая обязательный цвет или прочность ящика.
 * @param {string} key - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function goalLabel(key) {
  if (key.startsWith('color:')) return gemNames[Number(key.split(':')[1])];
  if (key === 'box') return 'Ящики';
  if (key === 'booster') return 'Бустеры';
  const [kind, type] = key.split(':');
  return kind === 'box' ? boxNames[type] || type : boosterNames[type] || type;
}
