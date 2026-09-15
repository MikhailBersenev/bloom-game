const MIN_DRAG_DISTANCE = 15;
const CLICK_SUPPRESSION_MS = 100;

/**
 * Binds pointer and keyboard input, suppressing the synthetic click after a drag.
 * @param {HTMLElement} board - Interactive board element.
 * @param {{getGame: function(): import("../core/Game.js").Game, choose: function(number): *, swap: function(number, number): *}} options - Input command handlers.
 * @returns {void} Completes the operation.
 */
export function bindBoardInput(board, { getGame, choose, swap }) {
  let pointer = null;
  let suppressClick = false;

  board.addEventListener(
    'pointerdown',
    /**
     * Records an idle board gesture origin.
     * @param {Object} event - Event being handled.
     * @returns {void} Completes the callback side effects.
     */ (event) => {
      const tile = event.target.closest('.tile');
      if (!tile || getGame().busy) return;
      pointer = { index: Number(tile.dataset.index), x: event.clientX, y: event.clientY };
    },
  );

  window.addEventListener(
    'pointerup',
    /**
     * Resolves a completed drag to an adjacent cell and suppresses its synthetic click.
     * @param {Object} event - Event being handled.
     * @returns {void} Completes the callback side effects.
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
         * Re-enables click selection after the drag suppression window.
         * @returns {void} Completes the callback side effects.
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
     * Discards a cancelled pointer gesture.
     * @returns {void} Completes the callback side effects.
     */ () => {
      pointer = null;
    },
  );
  board.addEventListener(
    'click',
    /**
     * Forwards a tile click unless it belongs to a completed drag.
     * @param {Object} event - Event being handled.
     * @returns {void} Completes the callback side effects.
     */ (event) => {
      if (suppressClick) return;
      const tile = event.target.closest('.tile');
      if (tile) choose(Number(tile.dataset.index));
    },
  );

  board.addEventListener(
    'keydown',
    /**
     * Moves keyboard focus to the arrow-selected neighboring tile.
     * @param {Object} event - Event being handled.
     * @returns {void} Completes the callback side effects.
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
