/**
 * Expands sparse placements into a new map; templates remain data and are cloned when a game starts.
 * @param {import("../types.js").LevelConfig} options - Sparse placements and level settings.
 * @returns {import("../types.js").LevelConfig} Result of the described operation.
 */
export function loadLevel({ placements = [], ...settings }) {
  const map = Array(settings.rows * settings.cols).fill('?');
  for (const [row, col, item] of placements) map[row * settings.cols + col] = item;
  return { ...settings, map };
}
