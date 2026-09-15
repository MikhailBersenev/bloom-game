import { Board } from './Board.js';
import { initializeBoard, shuffleBoard } from './BoardInitializer.js';
import { resolveBoard, resolveMove, activateBooster, finishTurn } from './MoveResolver.js';
import { findLegalMoves } from './MoveFinder.js';
import { bestColor, target } from '../boosters/TargetSelector.js';
import { collect, remaining, won } from '../goals/GoalManager.js';
import { calculateGravity } from './Gravity.js';
import { gem, cloneElement } from '../entities/Piece.js';
import { findMatches } from './MatchFinder.js';
import { ResolutionWave } from './ResolutionWave.js';

/**
 * Рекурсивно копирует и замораживает данные снимка, чтобы внешнее изменение
 * уровня или вложенного элемента не могло повлиять на игровую сессию.
 * @param {*} value - Значение из текущего состояния игры.
 * @returns {*} Независимая неизменяемая копия.
 */
function frozenCopy(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
  return Object.freeze(
    Object.fromEntries(Object.entries(value).map(([key, item]) => [key, frozenCopy(item)])),
  );
}

/** Public session facade: owns counters and composes domain operations through an injected async event sink. */
export class Game {
  /**
   * Initializes owned state and injected dependencies.
   * @param {import("../types.js").LevelConfig} level - Level settings.
   * @param {Object} options - Named configuration and injected callbacks; see the destructured signature for defaults.
   * @returns {void} Completes the operation.
   */
  constructor(
    level,
    {
      random = Math.random,
      animate = /**
       * Completes events immediately when no presentation adapter is supplied.
       * @returns {Promise<void>} Callback result used by the enclosing operation.
       */ async () => {},
    } = {},
  ) {
    this.level = level;
    this.rows = level.rows;
    this.cols = level.cols;
    this.random = random;
    this.animate = animate;
    this.moves = level.moves;
    this.score = 0;
    this.collected = {};
    this.busy = false;
    this.status = 'playing';
    this.turn = 0;
    this.lastCommand = null;
    this.field = new Board(this.rows, this.cols);
    this.initialize();
  }

  /**
   * Exposes the live cell array for compatibility with engine consumers.
   * @returns {import("../types.js").Cell[]} Result of the described operation.
   */
  get board() {
    return this.field.cells;
  }

  /**
   * Возвращает независимый неизменяемый снимок состояния для интерфейса и интеграций.
   * Изменять живую игровую сессию можно только через её команды.
   * @returns {Object} Независимый снимок состояния.
   */
  getSnapshot() {
    return Object.freeze({
      level: frozenCopy(this.level),
      rows: this.rows,
      cols: this.cols,
      board: frozenCopy(this.board),
      moves: this.moves,
      score: this.score,
      collected: frozenCopy(this.collected),
      status: this.status,
      busy: this.busy,
      turn: this.turn,
      lastCommand: frozenCopy(this.lastCommand),
    });
  }

  /**
   * Replaces cell storage for compatibility with fixtures and engine consumers.
   * @param {import("../types.js").Cell[]} cells - Cell storage.
   * @returns {void} Completes the operation.
   */
  set board(cells) {
    this.field.cells = cells;
  }

  /**
   * Applies the testing-panel outcome and its counters when the session is idle.
   * @param {boolean} isWon - Whether to force victory.
   * @returns {void} Completes the operation.
   */
  forceOutcome(isWon) {
    if (this.busy) return;
    if (isWon) {
      for (const goal of this.level.goals) this.collected[goal.key] = goal.count;
    } else {
      this.moves = 0;
    }
    this.status = isWon ? 'won' : 'lost';
  }

  /**
   * Copies an element and nested contents with fresh runtime identities.
   * @param {import("../types.js").Cell} item - Current element.
   * @returns {import("../types.js").Cell} Result of the described operation.
   */
  clone(item) {
    return cloneElement(item);
  }

  /**
   * Подбирает случайные клетки без стартовых матчей и с допустимым ходом; заданные клетки сохраняет. При исчерпании попыток сообщает об ошибке.
   * @returns {void} Completes the operation.
   */
  initialize() {
    return initializeBoard(this);
  }

  /**
   * Creates a gem using the injected random source and current level palette.
   * @returns {import("../types.js").Piece} Result of the described operation.
   */
  createPiece() {
    return gem(this.rand(this.level.colors));
  }

  /**
   * Returns a uniformly selected integer below the exclusive bound using the injected random source.
   * @param {number} n - Count or exclusive upper bound.
   * @returns {number} Result of the described operation.
   */
  rand(n) {
    return Math.floor(this.random() * n);
  }

  /**
   * Converts a row-major cell index to its row and column.
   * @param {number} i - Row-major cell index.
   * @returns {number[]} Result of the described operation.
   */
  rc(i) {
    return this.field.coordinatesAt(i);
  }

  /**
   * Converts row and column to a cell index, returning -1 outside the board.
   * @param {number} r - Zero-based row.
   * @param {number} c - Zero-based column.
   * @returns {number} Result of the described operation.
   */
  at(r, c) {
    return this.field.indexAt(r, c);
  }

  /**
   * Returns in-bounds orthogonal neighbors in up, down, left, right order.
   * @param {number} i - Row-major cell index.
   * @returns {number[]} Result of the described operation.
   */
  adjacent(i) {
    return this.field.neighborsOf(i);
  }

  /**
   * Returns the occupied non-obstacle predicate, retaining the legacy null result for empty cells.
   * @param {number} i - Row-major cell index.
   * @returns {boolean|null|undefined} Result of the described operation.
   */
  movable(i) {
    return this.field.hasMovablePiece(i);
  }

  /**
   * Ищет ряды и квадраты без изменения поля; стабильный порядок фигур определяет создание бустеров.
   * @returns {import("../types.js").Match[]} Result of the described operation.
   */
  findMatches() {
    return findMatches(this.board, this.rows, this.cols);
  }

  /**
   * Проверяет обмены в стабильном порядке и восстанавливает поле после каждой пробной перестановки.
   * @returns {Array<import("../types.js").Move>} Result of the described operation.
   */
  legalMoves() {
    return findLegalMoves(this);
  }

  /**
   * Adds collected elements to the counter identified by a goal key.
   * @param {string} key - Collection key supported by the element.
   * @param {number} [n] - Count or exclusive upper bound.
   * @returns {void} Completes the operation.
   */
  collect(key, n = 1) {
    return collect(this.collected, key, n);
  }

  /**
   * Returns the outstanding goal count, clamped at zero.
   * @param {import("../types.js").GoalConfig} goal - Collection requirement.
   * @returns {number} Result of the described operation.
   */
  remaining(goal) {
    return remaining(this.collected, goal);
  }

  /**
   * Checks whether every current level goal has been completed.
   * @returns {boolean} Result of the described operation.
   */
  won() {
    return won(this.level.goals, this.collected);
  }

  /**
   * Sends a shallow cell snapshot to the injected event sink and waits for its completion.
   * @param {string} type - Element or event subtype.
   * @param {Object} [extra={}] - Additional event metadata.
   * @returns {Promise<void>} Completes the operation.
   */
  async emit(type, extra = {}) {
    await this.animate(
      {
        type,
        board: this.board.map(
          /**
           * Copies cell properties for the event snapshot.
           * @param {number} x - Candidate coordinate or element.
           * @returns {*} Callback result used by the enclosing operation.
           */ (x) => (x ? { ...x } : null),
        ),
        ...extra,
      },
      this,
    );
  }

  /**
   * Приоритет у цветов незавершённых целей, затем у количества фишек; равенство решает порядок палитры.
   * @returns {number} Result of the described operation.
   */
  bestColor() {
    return bestColor(this);
  }

  /**
   * Выбирает первую цель наивысшего приоритета вне исключённых клеток; каменные блокеры не выбираются.
   * @param {Set<number>} [exclude] - Positions unavailable for targeting.
   * @returns {number} Result of the described operation.
   */
  target(exclude = new Set()) {
    return target(this, exclude);
  }

  /**
   * Returns indices inside a square radius, clipped to the board.
   * @param {number} i - Row-major cell index.
   * @param {number} radius - Inclusive square radius.
   * @returns {number[]} Result of the described operation.
   */
  area(i, radius) {
    return this.field.squareAround(i, radius);
  }

  /**
   * Returns indices of a horizontal or vertical strip; width is the exclusive distance from its center.
   * @param {number} i - Row-major cell index.
   * @param {string} [axis] - Effect direction.
   * @param {number} [width] - Exclusive strip distance.
   * @returns {number[]} Result of the described operation.
   */
  line(i, axis = 'h', width = 1) {
    return this.field.lineThrough(i, axis, width);
  }

  /**
   * Разрешает волну удаления вместе с цепной реакцией, затем ожидает анимацию падения.
   * @param {import("../types.js").Match[]} [groups] - Connected matches.
   * @param {import("../types.js").Activation[]} [activation] - Initial booster queue.
   * @param {import("../types.js").Combination|null} [combo] - Optional paired activation.
   * @returns {Promise<void>} Completes the operation.
   */
  async wave(groups = [], activation = [], combo = null) {
    await new ResolutionWave(this).resolve(groups, activation, combo);
  }

  /**
   * Applies the calculated fall positions in place and waits for the fall event.
   * @returns {Promise<void>} Completes the operation.
   */
  async gravity() {
    const { cells, falls } = calculateGravity(
      this.field,
      /**
       * Supplies a new gem for a gravity vacancy.
       * @returns {*} Callback result used by the enclosing operation.
       */ () => this.createPiece(),
    );
    this.board.splice(0, this.board.length, ...cells);
    await this.emit('fall', { falls });
  }

  /**
   * Матчи разрешаются последовательно; предел каскадов защищает от бесконечной цепочки.
   * @returns {Promise<void>} Completes the operation.
   */
  async settle() {
    return resolveBoard(this);
  }
  /**
   * Принятый обмен расходует один ход и ожидает каскады; недопустимый обмен возвращается без расхода хода.
   * @param {number} a - First cell index.
   * @param {number} b - Second cell index.
   * @returns {Promise<boolean>} Result of the described operation.
   */
  async swap(a, b) {
    return resolveMove(this, a, b);
  }
  /**
   * Consumes one move to activate a booster and finish its cascades; releases the busy flag even on failure.
   * @param {number} i - Row-major cell index.
   * @returns {Promise<boolean>} Result of the described operation.
   */
  async activate(i) {
    return activateBooster(this, i);
  }
  /**
   * После каскадов ящики меняют цвет один раз; победа проверяется раньше поражения, затем восстанавливаются ходы.
   * @returns {Promise<void>} Completes the operation.
   */
  async finishTurn() {
    return finishTurn(this);
  }

  /**
   * Перемешивает фишки, при необходимости подбирает цвета заново; ящики неподвижны, завершение анимации обязательно.
   * @returns {Promise<void>} Completes the operation.
   */
  async shuffle() {
    return shuffleBoard(this);
  }
}
