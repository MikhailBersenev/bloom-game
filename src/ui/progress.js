const STORAGE_KEY = 'bloom-progress';

/**
 * Reads saved progress with safe defaults when storage is absent or invalid.
 * @returns {{unlocked: number, level: number}} Result of the described operation.
 */
export function loadProgress() {
  try {
    return { unlocked: 1, level: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { unlocked: 1, level: 0 };
  }
}

/**
 * Persists navigation progress; storage failures do not interrupt play.
 * @param {{unlocked: number, level: number}} progress - Saved navigation state.
 * @returns {void} Completes the operation.
 */
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or full storage must not prevent local play.
  }
}
