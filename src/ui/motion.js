/** Возвращает сокращённую длительность при включённом уменьшении анимации.
 * @param {number} milliseconds - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function motionDuration(milliseconds) {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Math.min(milliseconds, 25)
    : milliseconds;
}

/** Ожидает анимацию; отмена визуального эффекта не должна прерывать игровой ход.
 * @param {HTMLElement} element - Параметр операции.
 * @param {Keyframe[]} keyframes - Параметр операции.
 * @param {number} milliseconds - Параметр операции.
 * @param {string} [easing='ease-out'] - Параметр операции.
 * @returns Результат выполнения операции.
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
 * @param {number} row - Параметр операции.
 * @param {number} col - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function tileTransform(row, col) {
  return `translate(${col * 100}%, ${row * 100}%)`;
}
