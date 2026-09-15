import { gem } from '../entities/Piece.js';
const INITIAL_BOARD_ATTEMPTS = 500;
const MATCH_REPAIR_ATTEMPTS = 200;
const SHUFFLE_ATTEMPTS = 1000;
/**
 * Подбирает случайные клетки без стартовых матчей и с допустимым ходом; заданные клетки сохраняет. При исчерпании попыток сообщает об ошибке.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {void} Completes the operation.
 */
export function initializeBoard(game) {
  const fixed = new Set();
  for (let index = 0; index < game.board.length; index++) {
    const cell = game.level.map?.[index];
    if (cell !== undefined && cell !== null && cell !== '?') {
      game.board[index] = typeof cell === 'number' ? gem(cell) : game.clone(cell);
      fixed.add(index);
    }
  }

  for (let attempt = 0; attempt < INITIAL_BOARD_ATTEMPTS; attempt++) {
    for (let index = 0; index < game.board.length; index++)
      if (!fixed.has(index)) game.board[index] = gem(game.rand(game.level.colors));
    for (let pass = 0; pass < MATCH_REPAIR_ATTEMPTS; pass++) {
      const matches = game.findMatches();
      if (!matches.length) break;
      for (const group of matches) {
        const editable = group.cells.filter(
          /**
           * Selects cells whose initial color may be repaired.
           * @param {number} index - Row-major cell position.
           * @returns {boolean} Callback result used by the enclosing operation.
           */ (index) => !fixed.has(index),
        );
        if (!editable.length) throw new Error('Карта содержит неизбежный стартовый матч');
        const index = editable[game.rand(editable.length)];
        game.board[index] = gem(game.rand(game.level.colors));
      }
    }

    if (!game.findMatches().length && game.legalMoves().length) return;
  }

  throw new Error('Не удалось создать игровое поле без матчей');
}

/**
 * Перемешивает фишки, при необходимости подбирает цвета заново; ящики неподвижны, завершение анимации обязательно.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @returns {Promise<void>} Completes the operation.
 */
export async function shuffleBoard(game) {
  const ids = game.board
    .map(
      /**
       * Selects gem indices while reserving obstacles.
       * @param {import("../types.js").Cell} piece - Current element.
       * @param {number} index - Row-major cell position.
       * @returns {*} Callback result used by the enclosing operation.
       */ (piece, index) => (piece?.kind === 'gem' ? index : -1),
    )
    .filter(
      /**
       * Discards obstacle placeholders.
       * @param {number} index - Row-major cell position.
       * @returns {boolean} Callback result used by the enclosing operation.
       */ (index) => index >= 0,
    );
  for (let attempt = 0; attempt < SHUFFLE_ATTEMPTS; attempt++) {
    for (let remainingIndex = ids.length - 1; remainingIndex > 0; remainingIndex--) {
      const swapIndex = game.rand(remainingIndex + 1);
      [game.board[ids[remainingIndex]], game.board[ids[swapIndex]]] = [
        game.board[ids[swapIndex]],
        game.board[ids[remainingIndex]],
      ];
    }

    if (!game.findMatches().length && game.legalMoves().length) {
      await game.emit('shuffle');
      return;
    }
  }

  // При неподходящем составе цветов перестановки не помогут — нужно заново подобрать цвета.
  for (let attempt = 0; attempt < SHUFFLE_ATTEMPTS; attempt++) {
    for (const index of ids) game.board[index] = gem(game.rand(game.level.colors));
    if (!game.findMatches().length && game.legalMoves().length) {
      await game.emit('shuffle');
      return;
    }
  }

  throw new Error('Карта не допускает доступных ходов');
}
