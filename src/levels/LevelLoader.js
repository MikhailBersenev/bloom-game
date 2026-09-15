/**
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").LevelConfig} options - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function loadLevel({ placements = [], ...settings }) {
  const map = Array(settings.rows * settings.cols).fill('?');
  for (const [row, col, item] of placements) map[row * settings.cols + col] = item;
  return { ...settings, map };
}
