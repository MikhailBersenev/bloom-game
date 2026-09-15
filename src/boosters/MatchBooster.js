/**
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").MatchPattern[]} patterns - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function classifyGroup(patterns) {
  const fiveInRow = patterns.some(
    /**
     * Описание операции или проверяемого поведения.
     * @param {import("../types.js").MatchPattern} pattern - Параметр операции.
     * @returns Результат выполнения операции.
     */ (pattern) => pattern.axis !== 'square' && pattern.cells.length >= 5,
  );
  const horizontal = patterns.some(
    /**
     * Описание операции или проверяемого поведения.
     * @param {import("../types.js").MatchPattern} pattern - Параметр операции.
     * @returns Результат выполнения операции.
     */ (pattern) => pattern.axis === 'h',
  );
  const vertical = patterns.some(
    /**
     * Описание операции или проверяемого поведения.
     * @param {import("../types.js").MatchPattern} pattern - Параметр операции.
     * @returns Результат выполнения операции.
     */ (pattern) => pattern.axis === 'v',
  );
  const fourInRow = patterns.find(
    /**
     * Описание операции или проверяемого поведения.
     * @param {import("../types.js").MatchPattern} pattern - Параметр операции.
     * @returns Результат выполнения операции.
     */ (pattern) => pattern.axis !== 'square' && pattern.cells.length === 4,
  );
  const square = patterns.some(
    /**
     * Описание операции или проверяемого поведения.
     * @param {import("../types.js").MatchPattern} pattern - Параметр операции.
     * @returns Результат выполнения операции.
     */ (pattern) => pattern.axis === 'square',
  );
  const axis = fourInRow?.axis || 'h';

  // Описание совместимости и назначения модуля.
  if (fiveInRow) return { type: 'rainbow', axis };
  if (horizontal && vertical) return { type: 'bomb', axis };
  if (fourInRow) return { type: 'line', axis };
  if (square) return { type: 'plane', axis };
  return { type: null, axis };
}
