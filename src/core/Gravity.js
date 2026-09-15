/**
 * Сжимает независимые секции между ящиками на копии поля, сохраняя порядок фишек и вызовов генератора.
 * @param {import("../core/Board.js").Board} board - Board state and dimensions.
 * @param {function(): import("../types.js").Piece} spawnPiece - Factory called once per vacancy.
 * @returns {{cells: import("../types.js").Cell[], falls: import("../types.js").GravityMove[]}} Result of the described operation.
 */
export function calculateGravity(board, spawnPiece) {
  const cells = [...board.cells];
  const falls = [];
  for (let col = 0; col < board.cols; col++) {
    let bottom = board.rows - 1;
    while (bottom >= 0) {
      if (cells[board.indexAt(bottom, col)]?.kind === 'box') {
        bottom--;
        continue;
      }
      let top = bottom;
      while (top >= 0 && cells[board.indexAt(top, col)]?.kind !== 'box') top--;
      top++;
      compactSegment(board, cells, spawnPiece, col, top, bottom, falls);
      bottom = top - 2; // Ящик над секцией отделяет её от следующей области падения.
    }
  }
  return { cells, falls };
}

/**
 * Существующие фишки остаются в своей секции; новые появляются относительно её верхней границы.
 * @param {import("../core/Board.js").Board} board - Board state and dimensions.
 * @param {import("../types.js").Cell[]} cells - Cell storage.
 * @param {function(): import("../types.js").Piece} spawnPiece - Factory called once per vacancy.
 * @param {number} col - Zero-based column.
 * @param {number} top - First row of the segment.
 * @param {number} bottom - Last row of the segment.
 * @param {import("../types.js").GravityMove[]} falls - Output animation paths.
 * @returns {void} Completes the operation.
 */
function compactSegment(board, cells, spawnPiece, col, top, bottom, falls) {
  const survivors = [];
  for (let row = bottom; row >= top; row--) {
    const index = board.indexAt(row, col);
    if (cells[index]) survivors.push({ item: cells[index], from: row });
    cells[index] = null;
  }
  let next = 0;
  for (let row = bottom; row >= top; row--) {
    const previous = survivors[next++];
    const item = previous?.item || spawnPiece();
    cells[board.indexAt(row, col)] = item;
    falls.push({
      id: item.id,
      // Источник новых фишек локален для секции; UI скрывает их выше её границы.
      from: previous?.from ?? top - 1 - (next - survivors.length),
      spawn: !previous,
      segmentTop: top,
      segmentBottom: bottom,
      to: row,
      col,
    });
  }
}
