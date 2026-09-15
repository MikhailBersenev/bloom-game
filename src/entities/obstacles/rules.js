export const elementRules = new Map([
  [
    'wood',
    {
      canDamage: /**
       * Деревянный ящик получает урон от соседнего матча любого цвета или прямого удара бустера.
       * @returns {*} Результат обработчика.
       */ () => true,
    },
  ],
  [
    'colored',
    {
      canDamage: /**
       * Цветной ящик повреждается только от соседнего матча своего цвета; прямой удар не обходит условие.
       * @param {import("../../types.js").Cell} item - Текущий элемент.
       * @param {{direct: boolean, colors: Set<number>}} hit - Накопленные прямые попадания и цвета соседних матчей.
       * @returns {*} Результат обработчика.
       */ (item, hit) => hit.colors.has(item.color),
    },
  ],
  [
    'cycling',
    {
      canDamage: /**
       * Меняющий цвет ящик повреждается только от соседнего матча своего текущего цвета.
       * @param {import("../../types.js").Cell} item - Текущий элемент.
       * @param {{direct: boolean, colors: Set<number>}} hit - Накопленные прямые попадания и цвета соседних матчей.
       * @returns {*} Результат обработчика.
       */ (item, hit) => hit.colors.has(item.color),
      afterTurn: /**
       * Цвет меняется один раз после принятого хода и завершения всех каскадов.
       * @param {import("../../types.js").Cell} item - Текущий элемент.
       * @param {number} n - Количество цветов уровня.
       * @returns {void} Завершает обновление состояния.
       */ (item, n) => {
        item.color = (item.color + 1) % n;
      },
    },
  ],
  [
    'blocker',
    {
      canDamage: /**
       * Каменный блокер не получает урон, в том числе от двойного радужного шара.
       * @returns {*} Результат обработчика.
       */ () => false,
    },
  ],
]);
/**
 * Регистрирует правила типа ящика. canDamage — чистая проверка без изменения
 * элемента: её вызывают и при выборе мишени, и при подсчёте урона волны.
 * Необязательный afterTurn изменяет ящик один раз после завершения принятого хода.
 * @param {string} type
 * @param {Object} rule
 * @returns {void}
 */
export function registerElement(type, rule) {
  if (typeof type !== 'string' || !type) throw new TypeError('Element type is required');
  if (!rule || typeof rule.canDamage !== 'function') {
    throw new TypeError(`Element rule "${type}" must define canDamage`);
  }
  elementRules.set(type, rule);
}
