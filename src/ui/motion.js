/** Возвращает сокращённую длительность при включённом уменьшении анимации.
 * @param {number} milliseconds
 * @returns {number}
 */
export function motionDuration(milliseconds) {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Math.min(milliseconds, 25)
    : milliseconds;
}

/** Ожидает анимацию; отмена визуального эффекта не должна прерывать игровой ход.
 * @param {HTMLElement} element
 * @param {Keyframe[]} keyframes
 * @param {number} milliseconds
 * @param {string} [easing='ease-out']
 * @returns {Promise<void>}
 */
export async function animateElement(element, keyframes, milliseconds, easing = 'ease-out') {
  if (!element) return;
  const animation = element.animate(keyframes, { duration: motionDuration(milliseconds), easing });
  try {
    await animation.finished;
  } catch {
    /* Смена сессии может отменить анимации удалённых элементов; это не прерывает ход. */
  } finally {
    animation.cancel();
  }
}

/** Строит преобразование фишки в единицах клеток без чтения layout на каждом кадре.
 * @param {number} row
 * @param {number} col
 * @returns {string}
 */
export function tileTransform(row, col) {
  return `translate(${col * 100}%, ${row * 100}%)`;
}
