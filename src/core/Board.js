export class Board {
  /**
   * Initializes owned state and injected dependencies.
   * @param {number} rows - Board height.
   * @param {number} cols - Board width.
   * @returns {void} Completes the operation.
   */
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = Array(rows * cols).fill(null);
  }
  /**
   * Exchanges two cells in place without validating move rules.
   * @param {number} firstIndex - First cell index.
   * @param {number} secondIndex - Second cell index.
   * @returns {void} Completes the operation.
   */
  swap(firstIndex, secondIndex) {
    [this.cells[firstIndex], this.cells[secondIndex]] = [
      this.cells[secondIndex],
      this.cells[firstIndex],
    ];
  }

  /**
   * Converts a row-major cell index to its row and column.
   * @param {number} index - Row-major cell position.
   * @returns {number[]} Result of the described operation.
   */
  coordinatesAt(index) {
    return [Math.floor(index / this.cols), index % this.cols];
  }
  /**
   * Converts row and column to a cell index, returning -1 outside the board.
   * @param {number} row - Zero-based row.
   * @param {number} col - Zero-based column.
   * @returns {number} Result of the described operation.
   */
  indexAt(row, col) {
    return row >= 0 && col >= 0 && row < this.rows && col < this.cols ? row * this.cols + col : -1;
  }
  /**
   * Returns in-bounds orthogonal neighbors in up, down, left, right order.
   * @param {number} index - Row-major cell position.
   * @returns {number[]} Result of the described operation.
   */
  neighborsOf(index) {
    const [row, col] = this.coordinatesAt(index);
    return [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ]
      .map(
        /**
         * Converts an orthogonal neighbor to its board index.
         * @param {*} entry0 - Destructured entry supplied by the enclosing operation.
         * @returns {*} Callback result used by the enclosing operation.
         */ ([y, x]) => this.indexAt(y, x),
      )
      .filter(
        /**
         * Rejects out-of-bounds neighbor indices.
         * @param {number} x - Candidate coordinate or element.
         * @returns {boolean} Callback result used by the enclosing operation.
         */ (x) => x >= 0,
      );
  }
  /**
   * Returns the occupied non-obstacle predicate, retaining the legacy null result for empty cells.
   * @param {number} index - Row-major cell position.
   * @returns {boolean|null|undefined} Result of the described operation.
   */
  hasMovablePiece(index) {
    return this.cells[index] && this.cells[index].kind !== 'box';
  }
  /**
   * Returns indices inside a square radius, clipped to the board.
   * @param {number} index - Row-major cell position.
   * @param {number} radius - Inclusive square radius.
   * @returns {number[]} Result of the described operation.
   */
  squareAround(index, radius) {
    const [row, col] = this.coordinatesAt(index);
    const positions = [];
    for (let y = row - radius; y <= row + radius; y++)
      for (let x = col - radius; x <= col + radius; x++) {
        const position = this.indexAt(y, x);
        if (position >= 0) positions.push(position);
      }

    return positions;
  }
  /**
   * Returns indices of a horizontal or vertical strip; width is the exclusive distance from its center.
   * @param {number} index - Row-major cell position.
   * @param {string} [axis] - Effect direction.
   * @param {number} [width] - Exclusive strip distance.
   * @returns {number[]} Result of the described operation.
   */
  lineThrough(index, axis = 'h', width = 1) {
    const [row, col] = this.coordinatesAt(index);
    return this.cells
      .map(
        /**
         * Enumerates cell positions independently of their contents.
         * @param {*} _ - Value supplied by the enclosing operation.
         * @param {number} position - Row-major cell position.
         * @returns {*} Callback result used by the enclosing operation.
         */ (_, position) => position,
      )
      .filter(
        /**
         * Selects positions within the requested line strip.
         * @param {number} position - Row-major cell position.
         * @returns {boolean} Callback result used by the enclosing operation.
         */ (position) => {
          const [y, x] = this.coordinatesAt(position);
          return axis === 'h' ? Math.abs(y - row) < width : Math.abs(x - col) < width;
        },
      );
  }
}
