import { classifyGroup } from '../boosters/MatchBooster.js';
const RUN_DIRECTIONS = [
  [0, 1, 'h'],
  [1, 0, 'v'],
];

/**
 * Ищет ряды и квадраты без изменения поля; стабильный порядок фигур определяет создание бустеров.
 * @param {import("../types.js").Cell[]} board - Row-major cell storage.
 * @param {number} rows - Board height.
 * @param {number} cols - Board width.
 * @returns {import("../types.js").Match[]} Result of the described operation.
 */
export function findMatches(board, rows, cols) {
  const indexAt = /**
   * Converts coordinates to a bounded index, using -1 outside the board.
   * @param {number} row - Zero-based row.
   * @param {number} col - Zero-based column.
   * @returns {*} Callback result used by the enclosing operation.
   */ (row, col) => (row >= 0 && col >= 0 && row < rows && col < cols ? row * cols + col : -1);
  const sameColor = /**
   * Checks that every supplied index holds a gem of the first cell color.
   * @param {number[]} indices - Positions to compare.
   * @returns {*} Callback result used by the enclosing operation.
   */ (indices) =>
    indices.every(
      /**
       * Checks bounds, element kind and the reference color.
       * @param {number} index - Row-major cell position.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (index) =>
        index >= 0 &&
        board[index]?.kind === 'gem' &&
        board[index].color === board[indices[0]].color,
    );
  const patterns = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const index = indexAt(row, col);
      if (board[index]?.kind !== 'gem') continue;
      for (const [rowStep, colStep, axis] of RUN_DIRECTIONS) {
        const previous = indexAt(row - rowStep, col - colStep);
        // Ряд регистрируется только по первой клетке, чтобы не учитывать один матч повторно.
        if (previous >= 0 && sameColor([index, previous])) continue;
        const cells = [index];
        let nextRow = row + rowStep;
        let nextCol = col + colStep;
        while (indexAt(nextRow, nextCol) >= 0 && sameColor([index, indexAt(nextRow, nextCol)])) {
          cells.push(indexAt(nextRow, nextCol));
          nextRow += rowStep;
          nextCol += colStep;
        }
        if (cells.length >= 3) patterns.push({ cells, axis });
      }
      const square = [
        index,
        indexAt(row, col + 1),
        indexAt(row + 1, col),
        indexAt(row + 1, col + 1),
      ];
      if (sameColor(square)) patterns.push({ cells: square, axis: 'square' });
    }
  }

  return mergeOverlaps(patterns).map(
    /**
     * Annotates a connected group with its color and booster creation policy.
     * @param {import("../types.js").Match} group - Connected match group.
     * @returns {*} Callback result used by the enclosing operation.
     */ (group) => ({
      ...group,
      color: board[group.cells[0]].color,
      ...classifyGroup(group.patterns),
    }),
  );
}

/**
 * Объединяет пересекающиеся фигуры, сохраняя стабильный порядок клеток для выбора места бустера.
 * @param {import("../types.js").MatchPattern[]} patterns - Overlapping run and square patterns.
 * @returns {Object[]} Result of the described operation.
 */
function mergeOverlaps(patterns) {
  const groups = [];
  for (const pattern of patterns) {
    const touching = groups.filter(
      /**
       * Finds groups connected to the current pattern.
       * @param {import("../types.js").Match} group - Connected match group.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (group) =>
        group.cells.some(
          /**
           * Checks whether this group cell overlaps the current pattern.
           * @param {number} index - Row-major cell position.
           * @returns {boolean} Callback result used by the enclosing operation.
           */ (index) => pattern.cells.includes(index),
        ),
    );
    const merged = { cells: [...pattern.cells], patterns: [pattern] };
    for (const group of touching) {
      merged.cells.push(...group.cells);
      merged.patterns.push(...group.patterns);
      groups.splice(groups.indexOf(group), 1);
    }
    merged.cells = [...new Set(merged.cells)];
    groups.push(merged);
  }
  return groups;
}
