const STORAGE_KEY = 'bloom-progress';

/**
 * Возвращает сохранённую навигацию или начальные значения при недоступном хранилище.
 * @returns {{unlocked: number, level: number}}
 */
export function loadProgress() {
  try {
    return { unlocked: 1, level: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { unlocked: 1, level: 0 };
  }
}

/**
 * Сохраняет навигацию; отсутствие хранилища не мешает продолжать игру.
 * @param {{unlocked: number, level: number}} progress
 * @returns {void}
 */
export function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Приватный режим или переполненное хранилище не должны блокировать игру.
  }
}
