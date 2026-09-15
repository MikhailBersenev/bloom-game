const STORAGE_KEY = 'bloom-progress';

/**
 * Описание операции или проверяемого поведения.
 * @returns Результат выполнения операции.
 */
export function loadProgress() {
  try {
    return { unlocked: 1, level: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { unlocked: 1, level: 0 };
  }
}

/**
 * Описание операции или проверяемого поведения.
 * @param {{unlocked: number, level: number}} progress - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Описание совместимости и назначения модуля.
  }
}
