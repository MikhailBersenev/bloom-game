/**
 * Adds a collection event to its goal counter in place.
 * @param {Record<string, number>} collected - Mutable collection counters.
 * @param {string} key - Collection key supported by the element.
 * @param {number} [count=1] - Number of collected elements.
 * @returns {void}
 */
export function collect(collected, key, count = 1) {
  collected[key] = (collected[key] || 0) + count;
}

/**
 * Calculates the unfulfilled part of a goal without changing counters.
 * @param {Record<string, number>} collected - Current collection counters.
 * @param {import('../types.js').GoalConfig} goal - Collection requirement.
 * @returns {number} Remaining count, clamped at zero.
 */
export function remaining(collected, goal) {
  return Math.max(0, goal.count - (collected[goal.key] || 0));
}

/**
 * Checks completion against the current goal configuration.
 * @param {import('../types.js').GoalConfig[]} goals - All required goals.
 * @param {Record<string, number>} collected - Current collection counters.
 * @returns {boolean} Whether every goal is complete.
 */
export function won(goals, collected) {
  for (const goal of goals) {
    if (remaining(collected, goal) > 0) return false;
  }
  return true;
}
