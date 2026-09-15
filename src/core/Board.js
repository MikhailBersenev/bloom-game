export class Board {
  /**
   * Инициализирует собственное состояние и переданные зависимости.
   * @param {number} rows - Board height.
   * @param {number} cols - Board width.
   * @returns {void} Завершает операцию.
   */
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.cells = Array(rows * cols).fill(null);
  }
  /**
   * Обменивает две клетки на месте без проверки правил хода.
   * @param {number} firstIndex - Индекс первой клетки.
   * @param {number} secondIndex - Индекс второй клетки.
   * @returns {void} Завершает операцию.
   */
  swap(firstIndex, secondIndex) {
    [this.cells[firstIndex], this.cells[secondIndex]] = [
      this.cells[secondIndex],
      this.cells[firstIndex],
    ];
  }

  /**
   * Преобразует индекс клетки в порядке строк в её строку и столбец.
   * @param {number} index - Индекс клетки в порядке строк.
   * @returns {number[]}
   */
  coordinatesAt(index) {
    return [Math.floor(index / this.cols), index % this.cols];
  }
  /**
   * Преобразует строку и столбец в индекс клетки, возвращая -1 за пределами поля.
   * @param {number} row - Строка с нулевой индексацией.
   * @param {number} col - Столбец с нулевой индексацией.
   * @returns {number}
   */
  indexAt(row, col) {
    return row >= 0 && col >= 0 && row < this.rows && col < this.cols ? row * this.cols + col : -1;
  }
  /**
   * Возвращает соседние клетки по сторонам света в порядке вверх, вниз, влево, вправо.
   * @param {number} index - Индекс клетки в порядке строк.
   * @returns {number[]}
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
         * Преобразует соседнюю клетку в индекс поля.
         * @param {*} entry0 - Destructured entry supplied by the enclosing operation.
         * @returns {*} Результат callback-функции.
         */ ([y, x]) => this.indexAt(y, x),
      )
      .filter(
        /**
         * Отбрасывает индексы за пределами поля.
         * @param {number} x - Проверяемая координата или элемент.
         * @returns {boolean} Результат callback-функции.
         */ (x) => x >= 0,
      );
  }
  /**
   * Проверяет подвижность занятой клетки, сохраняя совместимый результат null для пустой клетки.
   * @param {number} index - Индекс клетки в порядке строк.
   * @returns {boolean|null|undefined}
   */
  hasMovablePiece(index) {
    return this.cells[index] && this.cells[index].kind !== 'box';
  }
  /**
   * Возвращает индексы внутри квадратного радиуса с обрезкой по полю.
   * @param {number} index - Индекс клетки в порядке строк.
   * @param {number} radius - Inclusive square radius.
   * @returns {number[]}
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
   * Возвращает индексы горизонтальной или вертикальной полосы заданной ширины.
   * @param {number} index - Индекс клетки в порядке строк.
   * @param {string} [axis] - Направление эффекта.
   * @param {number} [width] - Exclusive strip distance.
   * @returns {number[]}
   */
  lineThrough(index, axis = 'h', width = 1) {
    const [row, col] = this.coordinatesAt(index);
    return this.cells
      .map(
        /**
         * Перечисляет позиции клеток независимо от их содержимого.
         * @param {*} _ - Value supplied by the enclosing operation.
         * @param {number} position - Индекс клетки в порядке строк.
         * @returns {*} Результат callback-функции.
         */ (_, position) => position,
      )
      .filter(
        /**
         * Выбирает позиции внутри запрошенной полосы.
         * @param {number} position - Индекс клетки в порядке строк.
         * @returns {boolean} Результат callback-функции.
         */ (position) => {
          const [y, x] = this.coordinatesAt(position);
          return axis === 'h' ? Math.abs(y - row) < width : Math.abs(x - col) < width;
        },
      );
  }
}
