const MIN_DRAG_DISTANCE = 15;
const CLICK_SUPPRESSION_MS = 100;

/**
 * Описание операции или проверяемого поведения.
 * @param {HTMLElement} board - Параметр операции.
 * @param {{getGame: function(): import("../core/Game.js").Game, choose: function(number): *, swap: function(number, number): *}} options - Параметр операции.
 * @returns Результат выполнения операции.
 */
export function bindBoardInput(board, { getGame, choose, swap }) {
  let pointer = null;
  let suppressClick = false;

  board.addEventListener(
    'pointerdown',
    /**
     * Описание операции или проверяемого поведения.
     * @param {Object} event - Параметр операции.
     * @returns Результат выполнения операции.
     */ (event) => {
      const tile = event.target.closest('.tile');
      if (!tile || getGame().busy) return;
      pointer = { index: Number(tile.dataset.index), x: event.clientX, y: event.clientY };
    },
  );

  window.addEventListener(
    'pointerup',
    /**
     * Описание операции или проверяемого поведения.
     * @param {Object} event - Параметр операции.
     * @returns Результат выполнения операции.
     */ (event) => {
      if (!pointer) return;
      const origin = pointer;
      pointer = null;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.hypot(dx, dy) < MIN_DRAG_DISTANCE) return;

      suppressClick = true;
      setTimeout(
        /**
         * Описание операции или проверяемого поведения.
         * @returns Результат выполнения операции.
         */ () => {
          suppressClick = false;
        },
        CLICK_SUPPRESSION_MS,
      );
      const game = getGame();
      const [row, col] = game.rc(origin.index);
      const target =
        Math.abs(dx) > Math.abs(dy)
          ? game.at(row, col + Math.sign(dx))
          : game.at(row + Math.sign(dy), col);
      if (target >= 0) swap(origin.index, target);
    },
  );

  board.addEventListener(
    'pointercancel',
    /**
     * Описание операции или проверяемого поведения.
     * @returns Результат выполнения операции.
     */ () => {
      pointer = null;
    },
  );
  board.addEventListener(
    'click',
    /**
     * Описание операции или проверяемого поведения.
     * @param {Object} event - Параметр операции.
     * @returns Результат выполнения операции.
     */ (event) => {
      if (suppressClick) return;
      const tile = event.target.closest('.tile');
      if (tile) choose(Number(tile.dataset.index));
    },
  );

  board.addEventListener(
    'keydown',
    /**
     * Описание операции или проверяемого поведения.
     * @param {Object} event - Параметр операции.
     * @returns Результат выполнения операции.
     */ (event) => {
      const tile = event.target.closest('.tile');
      if (!tile) return;
      const game = getGame();
      const [row, col] = game.rc(Number(tile.dataset.index));
      const directions = {
        ArrowUp: [row - 1, col],
        ArrowDown: [row + 1, col],
        ArrowLeft: [row, col - 1],
        ArrowRight: [row, col + 1],
      };
      if (!directions[event.key]) return;
      event.preventDefault();
      const next = game.at(...directions[event.key]);
      board.querySelector(`[data-index="${next}"]`)?.focus();
    },
  );
}
