import { calculateGravity } from '../core/Gravity.js';
import { gem } from '../entities/Piece.js';
import { Board } from '../core/Board.js';
/**
 * Применяет гравитацию на месте для совместимых вызывающих модулей и возвращает траектории анимации.
 * @param {import("../core/Game.js").Game} game - Текущая игровая сессия.
 * @returns {import("../types.js").GravityMove[]} Траектории падения.
 */
export function applyGravity(game) {
  const board = new Board(game.rows, game.cols);
  board.cells = game.board;
  const { cells, falls } = calculateGravity(
    board,
    /**
     * Создаёт новую фишку с помощью совместимого источника случайных чисел.
     * @returns {*} Результат callback-функции.
     */ () => gem(game.rand(game.level.colors)),
  );
  game.board.splice(0, game.board.length, ...cells);
  return falls;
}
