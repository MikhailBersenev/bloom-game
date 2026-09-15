/**
 * @param {import("../types.js").LevelConfig} options
 * @returns {import("../types.js").LevelConfig}
 */
export function loadLevel({ placements = [], ...settings }) {
  const map = Array(settings.rows * settings.cols).fill('?');
  for (const [row, col, item] of placements) map[row * settings.cols + col] = item;
  return { ...settings, map };
}
