/**
 * Проверяет обмены в стабильном порядке и восстанавливает поле после каждой пробной перестановки.
 * @param {import("../core/Game.js").Game} game - Текущая игровая сессия.
 * @returns {Array<import("../types.js").Move>} Список допустимых обменов.
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
             * Проверяет, создаёт ли пробный обмен матч, затрагивающий одну из обменянных клеток.
             * @param {import("../types.js").Match} match - Match produced by the tentative exchange.
             * @returns {boolean} Результат проверки.
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
