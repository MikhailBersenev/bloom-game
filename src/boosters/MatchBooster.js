/**
 * Приоритет создания: пять в ряд, пересечение рядов, четыре в ряд, квадрат.
 * @param {import("../types.js").MatchPattern[]} patterns - Overlapping run and square patterns.
 * @returns {{type: string|null, axis: string}} Result of the described operation.
 */
export function classifyGroup(patterns) {
  const fiveInRow = patterns.some(
    /**
     * Recognizes a straight run eligible for a rainbow.
     * @param {import("../types.js").MatchPattern} pattern - Detected run or square.
     * @returns {boolean} Callback result used by the enclosing operation.
     */ (pattern) => pattern.axis !== 'square' && pattern.cells.length >= 5,
  );
  const horizontal = patterns.some(
    /**
     * Recognizes a horizontal run.
     * @param {import("../types.js").MatchPattern} pattern - Detected run or square.
     * @returns {boolean} Callback result used by the enclosing operation.
     */ (pattern) => pattern.axis === 'h',
  );
  const vertical = patterns.some(
    /**
     * Recognizes a vertical run.
     * @param {import("../types.js").MatchPattern} pattern - Detected run or square.
     * @returns {boolean} Callback result used by the enclosing operation.
     */ (pattern) => pattern.axis === 'v',
  );
  const fourInRow = patterns.find(
    /**
     * Recognizes a straight run eligible for a line.
     * @param {import("../types.js").MatchPattern} pattern - Detected run or square.
     * @returns {boolean} Callback result used by the enclosing operation.
     */ (pattern) => pattern.axis !== 'square' && pattern.cells.length === 4,
  );
  const square = patterns.some(
    /**
     * Recognizes a square eligible for a plane.
     * @param {import("../types.js").MatchPattern} pattern - Detected run or square.
     * @returns {boolean} Callback result used by the enclosing operation.
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
