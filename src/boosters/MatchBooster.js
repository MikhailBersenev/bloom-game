/**
 * Приоритет создания: пять в ряд, пересечение рядов, четыре в ряд, квадрат.
 * @param {import("../types.js").MatchPattern[]} patterns
 * @returns {{type: string|null, axis: string}}
 */
export function classifyGroup(patterns) {
  const fiveInRow = patterns.some(
    /**
     * @param {import("../types.js").MatchPattern} pattern
     * @returns {boolean}
     */ (pattern) => pattern.axis !== 'square' && pattern.cells.length >= 5,
  );
  const horizontal = patterns.some(
    /**
     * @param {import("../types.js").MatchPattern} pattern
     * @returns {boolean}
     */ (pattern) => pattern.axis === 'h',
  );
  const vertical = patterns.some(
    /**
     * @param {import("../types.js").MatchPattern} pattern
     * @returns {boolean}
     */ (pattern) => pattern.axis === 'v',
  );
  const fourInRow = patterns.find(
    /**
     * @param {import("../types.js").MatchPattern} pattern
     * @returns {boolean}
     */ (pattern) => pattern.axis !== 'square' && pattern.cells.length === 4,
  );
  const square = patterns.some(
    /**
     * @param {import("../types.js").MatchPattern} pattern
     * @returns {boolean}
     */ (pattern) => pattern.axis === 'square',
  );
  const axis = fourInRow?.axis || 'h';

  // Если группа содержит несколько фигур, создаётся бустер по старшей из них.
  if (fiveInRow) return { type: 'rainbow', axis };
  if (horizontal && vertical) return { type: 'bomb', axis };
  if (fourInRow) return { type: 'line', axis };
  if (square) return { type: 'plane', axis };
  return { type: null, axis };
}
