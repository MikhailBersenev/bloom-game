/**
 * @param {Record<string, number>} collected
 * @param {string} key
 * @param {number} [count=1]
 * @returns {void}
 */
export function collect(collected, key, count = 1) {
  collected[key] = (collected[key] || 0) + count;
}

/**
 * @param {Record<string, number>} collected
 * @param {import('../types.js').GoalConfig} goal
 * @returns {number}
 */
export function remaining(collected, goal) {
  return Math.max(0, goal.count - (collected[goal.key] || 0));
}

/**
 * @param {import('../types.js').GoalConfig[]} goals
 * @param {Record<string, number>} collected
 * @returns {boolean}
 */
export function won(goals, collected) {
  for (const goal of goals) {
    if (remaining(collected, goal) > 0) return false;
  }
  return true;
}
