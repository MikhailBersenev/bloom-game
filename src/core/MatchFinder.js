import { classifyGroup } from '../boosters/MatchBooster.js';
const RUN_DIRECTIONS = [
  [0, 1, 'h'],
  [1, 0, 'v'],
];

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").Cell[]} board - Параметр операции.
 * @param {number} rows - Параметр операции.
 * @param {number} cols - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function findMatches(board, rows, cols) {
  const indexAt = /**
   * Преобразует координаты в индекс и возвращает -1 за пределами поля.
   * @param {number} row - Строка с нулевой индексацией.
   * @param {number} col - Столбец с нулевой индексацией.
   * @returns {*} Результат callback-функции.
   */ (row, col) => (row >= 0 && col >= 0 && row < rows && col < cols ? row * cols + col : -1);
  const sameColor = /**
   * Проверяет, что все переданные индексы содержат фишку цвета первой клетки.
   * @param {number[]} indices - Позиции для сравнения.
   * @returns {*} Результат callback-функции.
   */ (indices) =>
    indices.every(
      /**
       * Описание операции или проверяемого поведения.
       * @param {number} index - Параметр операции.
       * @returns Результат выполнения операции.
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
        // Описание совместимости и назначения модуля.
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
     * Описание операции или проверяемого поведения.
     * @param {import("../types.js").Match} group - Параметр операции.
     * @returns Результат выполнения операции.
     */ (group) => ({
      ...group,
      color: board[group.cells[0]].color,
      ...classifyGroup(group.patterns),
    }),
  );
}

/**
 * Описание операции или проверяемого поведения.
 * @param {import("../types.js").MatchPattern[]} patterns - Параметр операции.
 * @returns Результат выполнения операции.
 */
function mergeOverlaps(patterns) {
  const groups = [];
  for (const pattern of patterns) {
    const touching = groups.filter(
      /**
       * Описание операции или проверяемого поведения.
       * @param {import("../types.js").Match} group - Параметр операции.
       * @returns Результат выполнения операции.
       */ (group) =>
        group.cells.some(
          /**
           * Описание операции или проверяемого поведения.
           * @param {number} index - Параметр операции.
           * @returns Результат выполнения операции.
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
