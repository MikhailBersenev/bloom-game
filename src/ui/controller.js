import { Game } from '../engine.js';
import { GameView } from './view.js';
import { GameAudio } from './audio.js';
import { GameAnimations, pause } from './animations.js';
import { loadProgress, saveProgress } from './progress.js';
import { bindBoardInput } from './input.js';
import { showHelp, showResult, renderGuide } from './dialogs.js';

/** Coordinates a level session. Gameplay rules remain in the engine. */
export class GameController {
  /**
   * Initializes owned state and injected dependencies.
   * @param {import("../types.js").LevelConfig[]} levels - Available levels.
   * @param {Document} [root] - DOM root containing the controls.
   * @returns {void} Completes the operation.
   */
  constructor(levels, root = document) {
    this.levels = levels;
    this.root = root;
    this.view = new GameView(root);
    this.audio = new GameAudio();
    this.animations = new GameAnimations(this.view, this.audio);
    this.progress = loadProgress();
    this.levelIndex = 0;
    this.selected = null;
    this.session = 0;
    this.game = null;
  }

  /**
   * Binds the interface and opens the saved level.
   * @returns {Promise<void>} Completes the operation.
   */
  async mount() {
    this.bindControls();
    renderGuide(this.root.querySelector('#booster-guide-list'));
    await this.startLevel(Number.isInteger(this.progress.level) ? this.progress.level : 0);
  }

  /**
   * Запускает уровень; отложенная анимация не должна обновлять более новую игровую сессию.
   * @param {number} index - Row-major cell position.
   * @returns {Promise<void>} Completes the operation.
   */
  async startLevel(index) {
    this.levelIndex = Math.max(0, Math.min(this.levels.length - 1, index));
    const session = ++this.session;
    this.selected = null;
    this.progress.level = this.levelIndex;
    saveProgress(this.progress);
    this.game = new Game(this.levels[this.levelIndex], {
      animate: /**
       * Forwards engine events to the current animation adapter.
       * @param {Object} event - Event being handled.
       * @param {import("../core/Game.js").Game} game - Current game session.
       * @returns {*} Callback result used by the enclosing operation.
       */ (event, game) =>
        this.animations.play(
          event,
          game,
          /**
           * Отложенные события допускаются только для текущей сессии уровня.
           * @returns {*} Callback result used by the enclosing operation.
           */ () => session === this.session,
        ),
    });
    this.game.busy = true;
    this.view.prepareLevel(this.game, this.levelIndex);
    this.renderMap();
    this.render();
    this.view.board.classList.add('arriving');
    await pause(500);
    if (session !== this.session) return;
    this.view.board.classList.remove('arriving');
    this.game.busy = false;
    this.view.hud(this.game);
  }

  /**
   * Refreshes the board selection and HUD from the current game.
   * @returns {void} Completes the operation.
   */
  render() {
    this.view.draw(this.game, this.selected);
    this.view.hud(this.game);
  }

  /**
   * Renders level navigation and the saved completion state.
   * @returns {void} Completes the operation.
   */
  renderMap() {
    this.view.renderMap(this.levels, this.levelIndex, this.progress.unlocked);
  }

  /**
   * Saves progress and presents the result before automatically opening its destination.
   * @returns {Promise<void>} Resolves after the guarded level transition.
   */
  async showOutcome() {
    if (this.game.status === 'playing') return;
    const won = this.game.status === 'won';
    if (won) {
      this.progress.unlocked = Math.max(
        this.progress.unlocked,
        Math.min(this.levels.length + 1, this.levelIndex + 2),
      );
      saveProgress(this.progress);
      this.renderMap();
    }
    const game = this.game;
    const session = this.session;
    let hasContinued = false;
    /** Переход по результату выполняется один раз; события заменённой сессии игнорируются.
     * @returns {Promise<void>}
     */
    const continueLevel = async () => {
      if (hasContinued || this.game !== game || session !== this.session) return;
      hasContinued = true;
      await this.startLevel(won ? (this.levelIndex + 1) % this.levels.length : this.levelIndex);
    };
    const last = this.levelIndex === this.levels.length - 1;
    showResult(this.view.modal, this.game, last, continueLevel);
    this.audio.play(won ? 880 : 220);
    await pause(2200, false);
    await continueLevel();
  }

  /**
   * Runs a game command and refreshes the current session, presenting command failures as a toast.
   * @param {function(import("../core/Game.js").Game): Promise<*>} action - Control action to invoke.
   * @returns {Promise<void>} Completes the operation.
   */
  async perform(action) {
    const game = this.game;
    this.selected = null;
    try {
      this.view.hud(game);
      await action(game);
      if (game !== this.game) return;
      this.render();
      await this.showOutcome();
    } catch (error) {
      console.error(error);
      this.view.toast('Не удалось завершить ход. Начните уровень заново.');
    }
  }

  /**
   * Forwards a cell exchange to the game command handler.
   * @param {number} first - First selected cell.
   * @param {number} second - Second selected cell.
   * @returns {Promise<void>} Completes the operation.
   */
  swap(first, second) {
    return this.perform(
      /**
       * Requests the selected exchange through the game API.
       * @param {import("../core/Game.js").Game} game - Current game session.
       * @returns {*} Callback result used by the enclosing operation.
       */ (game) => game.swap(first, second),
    );
  }

  /**
   * Translates a cell selection into a swap, booster activation or visual selection.
   * @param {number} index - Row-major cell position.
   * @returns {Promise<void>} Completes the operation.
   */
  async choose(index) {
    const game = this.game;
    if (game.busy || game.status !== 'playing') return;
    if (!game.movable(index)) {
      this.view.toast(
        game.board[index].type === 'blocker'
          ? 'Камень нельзя разрушить'
          : 'Соберите матч рядом с ящиком',
      );
      return;
    }
    if (this.selected === index && game.board[index].kind === 'booster') {
      await this.perform(
        /**
         * Requests direct booster activation through the game API.
         * @param {import("../core/Game.js").Game} owner - Session receiving the command.
         * @returns {*} Callback result used by the enclosing operation.
         */ (owner) => owner.activate(index),
      );
      return;
    }
    if (this.selected !== null && game.adjacent(this.selected).includes(index)) {
      await this.swap(this.selected, index);
      return;
    }
    this.selected = this.selected === index ? null : index;
    this.view.draw(game, this.selected);
  }

  /**
   * Highlights the first available move temporarily.
   * @returns {void} Completes the operation.
   */
  hint() {
    if (this.game.busy) return;
    const move = this.game.legalMoves()[0];
    if (!move) return;
    for (const index of move) {
      const tile = this.view.board.querySelector(`[data-index="${index}"]`);
      tile?.classList.add('hint');
      setTimeout(
        /**
         * Removes the temporary hint highlight.
         * @returns {*} Callback result used by the enclosing operation.
         */ () => tile?.classList.remove('hint'),
        1800,
      );
    }
    this.view.toast('Попробуйте соединить подсвеченные фишки');
  }

  /**
   * Forwards the testing outcome to the engine and refreshes the result display.
   * @param {boolean} won - Whether to force victory.
   * @returns {void} Completes the operation.
   */
  cheat(won) {
    if (this.game.busy) return;
    this.game.forceOutcome(won);
    this.view.hud(this.game);
    void this.showOutcome().catch(
      /** Reports a failed result transition.
       * @param {Error} error - Transition failure.
       * @returns {void}
       */ (error) => {
        console.error(error);
        this.view.toast('Не удалось открыть уровень. Попробуйте ещё раз.');
      },
    );
  }

  /**
   * Connects navigation, game commands, audio and help controls to the current session.
   * @returns {void} Completes the operation.
   */
  bindControls() {
    const query = /**
     * Finds a control within the controller root.
     * @param {string} selector - CSS selector of the control.
     * @returns {*} Callback result used by the enclosing operation.
     */ (selector) => this.root.querySelector(selector);
    const whenIdle = /**
     * Wraps a control action with the current busy-state guard.
     * @param {function(): *} action - Control action to invoke.
     * @returns {*} Callback result used by the enclosing operation.
     */ (action) =>
      /**
       * Runs the control action only between game operations.
       * @returns {void} Completes the callback side effects.
       */ () => {
        if (!this.game.busy) action();
      };
    bindBoardInput(this.view.board, {
      getGame: /**
       * Supplies the current session to persistent input handlers.
       * @returns {*} Callback result used by the enclosing operation.
       */ () => this.game,
      choose: /**
       * Forwards the selected cell to selection handling.
       * @param {number} index - Row-major cell position.
       * @returns {*} Callback result used by the enclosing operation.
       */ (index) => this.choose(index),
      swap: /**
       * Forwards a drag exchange to the command handler.
       * @param {number} first - First selected cell.
       * @param {number} second - Second selected cell.
       * @returns {*} Callback result used by the enclosing operation.
       */ (first, second) => this.swap(first, second),
    });
    query('#restart').onclick = whenIdle(
      /**
       * Restarts the current level.
       * @returns {*} Callback result used by the enclosing operation.
       */ () => this.startLevel(this.levelIndex),
    );
    query('#hint').onclick = /**
     * Displays a suggested exchange.
     * @returns {*} Callback result used by the enclosing operation.
     */ () => this.hint();
    query('#level-map').onclick = /**
     * Opens the clicked map level when the game is idle.
     * @param {Object} event - Event being handled.
     * @returns {void} Completes the callback side effects.
     */ (event) => {
      const button = event.target.closest('[data-level]');
      if (button && !this.game.busy) this.startLevel(Number(button.dataset.level));
    };
    query('#level-select').innerHTML = this.levels
      .map(
        /**
         * Builds a level-selector option with a numbered label.
         * @param {import("../types.js").LevelConfig} level - Level settings.
         * @param {number} index - Row-major cell position.
         * @returns {*} Callback result used by the enclosing operation.
         */ (level, index) =>
          `<option value="${index}">${String(index + 1).padStart(2, '0')} · ${level.name}</option>`,
      )
      .join('');
    query('#level-go').onclick = whenIdle(
      /**
       * Opens the level chosen in the testing panel.
       * @returns {*} Callback result used by the enclosing operation.
       */ () => this.startLevel(Number(query('#level-select').value)),
    );
    query('#cheat-win').onclick = /**
     * Requests the victory testing command.
     * @returns {*} Callback result used by the enclosing operation.
     */ () => this.cheat(true);
    query('#cheat-lose').onclick = /**
     * Requests the defeat testing command.
     * @returns {*} Callback result used by the enclosing operation.
     */ () => this.cheat(false);
    query('#sound').onclick = /**
     * Toggles sound and synchronizes the button appearance and accessible label.
     * @returns {void} Completes the callback side effects.
     */ () => {
      const enabled = this.audio.toggle();
      query('#sound').classList.toggle('enabled', enabled);
      query('#sound').setAttribute('aria-label', enabled ? 'Выключить звук' : 'Включить звук');
    };
    query('#help').onclick = /**
     * Opens instructions while the session is playing.
     * @returns {void} Completes the callback side effects.
     */ () => {
      if (this.game.status === 'playing') showHelp(this.view.modal);
    };
    this.view.modal.addEventListener(
      'cancel',
      /**
       * Prevents dismissing a final result with the dialog cancel gesture.
       * @param {Object} event - Event being handled.
       * @returns {void} Completes the callback side effects.
       */ (event) => {
        if (this.game.status !== 'playing') event.preventDefault();
      },
    );
  }
}
