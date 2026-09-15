import { Game } from '../engine.js';
import { GameView } from './view.js';
import { GameAudio } from './audio.js';
import { GameAnimations, pause } from './animations.js';
import { loadProgress, saveProgress } from './progress.js';
import { bindBoardInput } from './input.js';
import { showHelp, showResult, renderGuide } from './dialogs.js';

/** Управляет сессией уровня и интерфейсом; игровые правила остаются в движке. */
export class GameController {
  /**
   * @param {import("../types.js").LevelConfig[]} levels
   * @param {Document} [root]
   * @returns {void}
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
   * @returns {Promise<void>}
   */
  async mount() {
    this.bindControls();
    renderGuide(this.root.querySelector('#booster-guide-list'));
    await this.startLevel(Number.isInteger(this.progress.level) ? this.progress.level : 0);
  }

  /**
   * Запускает уровень; отложенная анимация не должна обновлять более новую игровую сессию.
   * @param {number} index
   * @returns {Promise<void>}
   */
  async startLevel(index) {
    this.levelIndex = Math.max(0, Math.min(this.levels.length - 1, index));
    const session = ++this.session;
    this.selected = null;
    this.progress.level = this.levelIndex;
    saveProgress(this.progress);
    this.game = new Game(this.levels[this.levelIndex], {
      animate: /**
       * Передаёт события движка текущему адаптеру анимации.
       * @param {Object} event - Event being handled.
       * @param {import("../core/Game.js").Game} game - Current game session.
       * @returns {*} Результат обработчика.
       */ (event, game) =>
        this.animations.play(
          event,
          game,
          /**
           * Отложенные события допускаются только для текущей сессии уровня.
           * @returns {*}
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
   * @returns {void}
   */
  render() {
    this.view.draw(this.game, this.selected);
    this.view.hud(this.game);
  }

  /**
   * @returns {void}
   */
  renderMap() {
    this.view.renderMap(this.levels, this.levelIndex, this.progress.unlocked);
  }

  /**
   * @returns {Promise<void>}
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
   * @param {function(import("../core/Game.js").Game): Promise<*>} action
   * @returns {Promise<void>}
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
   * @param {number} first
   * @param {number} second
   * @returns {Promise<void>}
   */
  swap(first, second) {
    return this.perform(
      /**
       * @param {import("../core/Game.js").Game} game
       * @returns {*}
       */ (game) => game.swap(first, second),
    );
  }

  /**
   * @param {number} index
   * @returns {Promise<void>}
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
         * @param {import("../core/Game.js").Game} owner
         * @returns {*}
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
   * @returns {void}
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
         * @returns {*}
         */ () => tile?.classList.remove('hint'),
        1800,
      );
    }
    this.view.toast('Попробуйте соединить подсвеченные фишки');
  }

  /**
   * @param {boolean} won
   * @returns {void}
   */
  cheat(won) {
    if (this.game.busy) return;
    this.game.forceOutcome(won);
    this.view.hud(this.game);
    void this.showOutcome().catch(
      /** Сообщает об ошибке перехода после результата.
       * @param {Error} error
       * @returns {void}
       */ (error) => {
        console.error(error);
        this.view.toast('Не удалось открыть уровень. Попробуйте ещё раз.');
      },
    );
  }

  /**
   * @returns {void}
   */
  bindControls() {
    const query = /**
     * Ищет элемент управления внутри корня контроллера.
     * @param {string} selector - CSS selector of the control.
     * @returns {*} Результат обработчика.
     */ (selector) => this.root.querySelector(selector);
    const whenIdle = /**
     * Разрешает действие только между игровыми ходами.
     * @param {function(): *} action - Control action to invoke.
     * @returns {*} Результат обработчика.
     */ (action) =>
      /**
       * @returns {void}
       */ () => {
        if (!this.game.busy) action();
      };
    bindBoardInput(this.view.board, {
      getGame: /**
       * Передаёт текущую сессию постоянным обработчикам ввода.
       * @returns {*} Результат обработчика.
       */ () => this.game,
      choose: /**
       * Передаёт выбранную клетку обработчику выбора.
       * @param {number} index - Row-major cell position.
       * @returns {*} Результат обработчика.
       */ (index) => this.choose(index),
      swap: /**
       * Передаёт обмен перетаскиванием обработчику команд.
       * @param {number} first - First selected cell.
       * @param {number} second - Second selected cell.
       * @returns {*} Результат обработчика.
       */ (first, second) => this.swap(first, second),
    });
    query('#restart').onclick = whenIdle(
      /**
       * @returns {*}
       */ () => this.startLevel(this.levelIndex),
    );
    query('#hint').onclick = /**
     * Подсвечивает доступный обмен.
     * @returns {*} Результат обработчика.
     */ () => this.hint();
    query('#level-map').onclick = /**
     * Открывает выбранный уровень карты, когда игра бездействует.
     * @param {Object} event - Event being handled.
     * @returns {void} Завершает обновление состояния.
     */ (event) => {
      const button = event.target.closest('[data-level]');
      if (button && !this.game.busy) this.startLevel(Number(button.dataset.level));
    };
    query('#level-select').innerHTML = this.levels
      .map(
        /**
         * @param {import("../types.js").LevelConfig} level
         * @param {number} index
         * @returns {*}
         */ (level, index) =>
          `<option value="${index}">${String(index + 1).padStart(2, '0')} · ${level.name}</option>`,
      )
      .join('');
    query('#level-go').onclick = whenIdle(
      /**
       * @returns {*}
       */ () => this.startLevel(Number(query('#level-select').value)),
    );
    query('#cheat-win').onclick = /**
     * Запрашивает тестовую команду победы.
     * @returns {*} Результат обработчика.
     */ () => this.cheat(true);
    query('#cheat-lose').onclick = /**
     * Запрашивает тестовую команду поражения.
     * @returns {*} Результат обработчика.
     */ () => this.cheat(false);
    query('#sound').onclick = /**
     * Переключает звук и синхронизирует вид кнопки и доступную подпись.
     * @returns {void} Завершает обновление состояния.
     */ () => {
      const enabled = this.audio.toggle();
      query('#sound').classList.toggle('enabled', enabled);
      query('#sound').setAttribute('aria-label', enabled ? 'Выключить звук' : 'Включить звук');
    };
    query('#help').onclick = /**
     * Открывает инструкции во время игры.
     * @returns {void} Завершает обновление состояния.
     */ () => {
      if (this.game.status === 'playing') showHelp(this.view.modal);
    };
    this.view.modal.addEventListener(
      'cancel',
      /**
       * @param {Object} event
       * @returns {void}
       */ (event) => {
        if (this.game.status !== 'playing') event.preventDefault();
      },
    );
  }
}
