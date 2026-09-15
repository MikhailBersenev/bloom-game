import { calculateGravity } from '../core/Gravity.js';
import { gem } from '../entities/Piece.js';
import { Board } from '../core/Board.js';
/**
 * Applies gravity in place for legacy callers and returns paths for animation.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {import("../types.js").GravityMove[]} Result of the described operation.
 */
export function applyGravity(game) {
  const board = new Board(game.rows, game.cols);
  board.cells = game.board;
  const { cells, falls } = calculateGravity(
    board,
    /**
     * Supplies a fresh gem using the legacy random source.
     * @returns {*} Callback result used by the enclosing operation.
     */ () => gem(game.rand(game.level.colors)),
  );
  game.board.splice(0, game.board.length, ...cells);
  return falls;
}
