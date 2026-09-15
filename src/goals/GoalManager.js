/**
 * Описание операции или проверяемого поведения.
 * @param {Record<string, number>} collected - Параметр операции.
 * @param {string} key - Параметр операции.
 * @param {number} [count=1] - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function collect(collected, key, count = 1) {
  collected[key] = (collected[key] || 0) + count;
}

/**
 * Описание операции или проверяемого поведения.
 * @param {Record<string, number>} collected - Параметр операции.
 * @param {import('../types.js').GoalConfig} goal - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function remaining(collected, goal) {
  return Math.max(0, goal.count - (collected[goal.key] || 0));
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import('../types.js').GoalConfig[]} goals - Параметр операции.
 * @param {Record<string, number>} collected - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function won(goals, collected) {
  for (const goal of goals) {
    if (remaining(collected, goal) > 0) return false;
  }
  return true;
}
