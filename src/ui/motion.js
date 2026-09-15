/** Returns a short functional duration when reduced motion is requested.
 * @param {number} milliseconds - Normal presentation duration.
 * @returns {number} Duration in milliseconds.
 */
export function motionDuration(milliseconds) {
  return matchMedia('(prefers-reduced-motion: reduce)').matches
    ? Math.min(milliseconds, 25)
    : milliseconds;
}

/** Ожидает анимацию; отмена визуального эффекта не должна прерывать игровой ход.
 * @param {HTMLElement} element - Visual element to animate.
 * @param {Keyframe[]} keyframes - Presentation keyframes.
 * @param {number} milliseconds - Normal duration.
 * @param {string} [easing='ease-out'] - Timing curve.
 * @returns {Promise<void>} Resolves when the visual is finished or cancelled.
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

/** Builds a tile transform in cell units; no per-frame layout reads are needed.
 * @param {number} row - Row, including negative spawn rows.
 * @param {number} col - Column.
 * @returns {string} CSS transform relative to the tile dimensions.
 */
export function tileTransform(row, col) {
  return `translate(${col * 100}%, ${row * 100}%)`;
}
