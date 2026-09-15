export const elementRules = new Map([
  [
    'wood',
    {
      canDamage: /**
       * Деревянный ящик получает урон от соседнего матча любого цвета или прямого удара бустера.
       * @returns {*} Callback result used by the enclosing operation.
       */ () => true,
    },
  ],
  [
    'colored',
    {
      canDamage: /**
       * Цветной ящик повреждается только от соседнего матча своего цвета; прямой удар не обходит условие.
       * @param {import("../../types.js").Cell} item - Current element.
       * @param {{direct: boolean, colors: Set<number>}} hit - Accumulated direct and color damage.
       * @returns {*} Callback result used by the enclosing operation.
       */ (item, hit) => hit.colors.has(item.color),
    },
  ],
  [
    'cycling',
    {
      canDamage: /**
       * Меняющий цвет ящик повреждается только от соседнего матча своего текущего цвета.
       * @param {import("../../types.js").Cell} item - Current element.
       * @param {{direct: boolean, colors: Set<number>}} hit - Accumulated direct and color damage.
       * @returns {*} Callback result used by the enclosing operation.
       */ (item, hit) => hit.colors.has(item.color),
      afterTurn: /**
       * Цвет меняется один раз после принятого хода и завершения всех каскадов.
       * @param {import("../../types.js").Cell} item - Current element.
       * @param {number} n - Count or exclusive upper bound.
       * @returns {void} Completes the callback side effects.
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
       * @returns {*} Callback result used by the enclosing operation.
       */ () => false,
    },
  ],
]);
/**
 * Registers or replaces an obstacle damage policy and optional end-of-turn behavior.
 * @param {string} type - Element or event subtype.
 * @param {Object} rule - Obstacle policy or instruction text.
 * @returns {void} Completes the operation.
 */
export function registerElement(type, rule) {
  elementRules.set(type, rule);
}
