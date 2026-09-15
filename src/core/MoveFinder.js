/**
 * Проверяет обмены в стабильном порядке и восстанавливает поле после каждой пробной перестановки.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {Array<import("../types.js").Move>} Result of the described operation.
 */
export function findLegalMoves(game) {
  const result = [];
  for (let firstIndex = 0; firstIndex < game.board.length; firstIndex++)
    if (game.movable(firstIndex))
      for (const secondIndex of game.adjacent(firstIndex)) {
        if (secondIndex <= firstIndex || !game.movable(secondIndex)) continue;
        if (
          game.board[firstIndex].kind === 'booster' ||
          game.board[secondIndex].kind === 'booster'
        ) {
          result.push([firstIndex, secondIndex]);
          continue;
        }

        [game.board[firstIndex], game.board[secondIndex]] = [
          game.board[secondIndex],
          game.board[firstIndex],
        ];
        if (
          game.findMatches().some(
            /**
             * Checks whether a speculative exchange creates a match touching either swapped cell.
             * @param {import("../types.js").Match} match - Match produced by the tentative exchange.
             * @returns {boolean} Callback result used by the enclosing operation.
             */ (match) => match.cells.includes(firstIndex) || match.cells.includes(secondIndex),
          )
        )
          result.push([firstIndex, secondIndex]);
        [game.board[firstIndex], game.board[secondIndex]] = [
          game.board[secondIndex],
          game.board[firstIndex],
        ];
      }

  return result;
}
