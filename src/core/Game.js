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
import { createEngineEvent } from '../types.js';

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

/**
 * @param {*} value
 */
function cloneData(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneData);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneData(item)]));
}

/** Публичная оболочка сессии: хранит счётчики и объединяет игровые операции через асинхронный обработчик событий. */
export class Game {
  /**
   * @param {import("../types.js").LevelConfig} level
   * @param {import('../types.js').GameOptions} options - Engine dependencies.
   * @returns {void}
   */
  constructor(
    level,
    {
      random = Math.random,
      animate = /**
       * Мгновенно завершает события, если адаптер отображения не передан.
       * @returns {Promise<void>} Результат callback-функции.
       */ async () => {},
    } = {},
  ) {
    this.level = cloneData(level);
    this.rows = this.level.rows;
    this.cols = this.level.cols;
    this.random = random;
    this.animate = animate;
    this.moves = this.level.moves;
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
   * @returns {import("../types.js").Cell[]}
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
   * @param {import("../types.js").Cell[]} cells
   * @returns {void}
   */
  set board(cells) {
    this.field.cells = cells;
  }

  /**
   * @param {boolean} isWon
   * @returns {void}
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
   * @param {import("../types.js").Cell} item
   * @returns {import("../types.js").Cell}
   */
  clone(item) {
    return cloneElement(item);
  }

  /**
   * Подбирает случайные клетки без стартовых матчей и с допустимым ходом; заданные клетки сохраняет. При исчерпании попыток сообщает об ошибке.
   * @returns {void}
   */
  initialize() {
    return initializeBoard(this);
  }

  /**
   * @returns {import("../types.js").Piece}
   */
  createPiece() {
    return gem(this.rand(this.level.colors));
  }

  /**
   * @param {number} n
   * @returns {number}
   */
  rand(n) {
    return Math.floor(this.random() * n);
  }

  /**
   * @param {number} i
   * @returns {number[]}
   */
  rc(i) {
    return this.field.coordinatesAt(i);
  }

  /**
   * @param {number} r
   * @param {number} c
   * @returns {number}
   */
  at(r, c) {
    return this.field.indexAt(r, c);
  }

  /**
   * @param {number} i
   * @returns {number[]}
   */
  adjacent(i) {
    return this.field.neighborsOf(i);
  }

  /**
   * @param {number} i
   * @returns {boolean|null|undefined}
   */
  movable(i) {
    return this.field.hasMovablePiece(i);
  }

  /**
   * Ищет ряды и квадраты без изменения поля; стабильный порядок фигур определяет создание бустеров.
   * @returns {import("../types.js").Match[]}
   */
  findMatches() {
    return findMatches(this.board, this.rows, this.cols);
  }

  /**
   * Проверяет обмены в стабильном порядке и восстанавливает поле после каждой пробной перестановки.
   * @returns {Array<import("../types.js").Move>}
   */
  legalMoves() {
    return findLegalMoves(this);
  }

  /**
   * @param {string} key
   * @param {number} [n]
   * @returns {void}
   */
  collect(key, n = 1) {
    return collect(this.collected, key, n);
  }

  /**
   * @param {import("../types.js").GoalConfig} goal
   * @returns {number}
   */
  remaining(goal) {
    return remaining(this.collected, goal);
  }

  /**
   * @returns {boolean}
   */
  won() {
    return won(this.level.goals, this.collected);
  }

  /**
   * @param {import('../types.js').EngineEventType} type - Event discriminator.
   * @param {Record<string, unknown>} [extra={}] - Event-specific payload.
   * @returns {Promise<void>}
   */
  async emit(type, extra = {}) {
    const event = createEngineEvent(type, this.board, extra);
    await this.animate(event, this);
  }

  /**
   * Приоритет у цветов незавершённых целей, затем у количества фишек; равенство решает порядок палитры.
   * @returns {number}
   */
  bestColor() {
    return bestColor(this);
  }

  /**
   * Выбирает первую цель наивысшего приоритета вне исключённых клеток; каменные блокеры не выбираются.
   * @param {Set<number>} [exclude]
   * @returns {number}
   */
  target(exclude = new Set()) {
    return target(this, exclude);
  }

  /**
   * @param {number} i
   * @param {number} radius
   * @returns {number[]}
   */
  area(i, radius) {
    return this.field.squareAround(i, radius);
  }

  /**
   * @param {number} i
   * @param {string} [axis]
   * @param {number} [width]
   * @returns {number[]}
   */
  line(i, axis = 'h', width = 1) {
    return this.field.lineThrough(i, axis, width);
  }

  /**
   * Разрешает волну удаления вместе с цепной реакцией, затем ожидает анимацию падения.
   * @param {import("../types.js").Match[]} [groups]
   * @param {import("../types.js").Activation[]} [activation]
   * @param {import("../types.js").Combination|null} [combo]
   * @returns {Promise<void>}
   */
  async wave(groups = [], activation = [], combo = null) {
    await new ResolutionWave(this).resolve(groups, activation, combo);
  }

  /**
   * @returns {Promise<void>}
   */
  async gravity() {
    const { cells, falls } = calculateGravity(
      this.field,
      /**
       * @returns {*}
       */ () => this.createPiece(),
    );
    this.board.splice(0, this.board.length, ...cells);
    await this.emit('fall', { falls });
  }

  /**
   * Матчи разрешаются последовательно; предел каскадов защищает от бесконечной цепочки.
   * @returns {Promise<void>}
   */
  async settle() {
    return resolveBoard(this);
  }
  /**
   * Принятый обмен расходует один ход и ожидает каскады; недопустимый обмен возвращается без расхода хода.
   * @param {number} a
   * @param {number} b
   * @returns {Promise<boolean>}
   */
  async swap(a, b) {
    return resolveMove(this, a, b);
  }
  /**
   * @param {number} i
   * @returns {Promise<boolean>}
   */
  async activate(i) {
    return activateBooster(this, i);
  }
  /**
   * После каскадов ящики меняют цвет один раз; победа проверяется раньше поражения, затем восстанавливаются ходы.
   * @returns {Promise<void>}
   */
  async finishTurn() {
    return finishTurn(this);
  }

  /**
   * Перемешивает фишки, при необходимости подбирает цвета заново; ящики неподвижны, завершение анимации обязательно.
   * @returns {Promise<void>}
   */
  async shuffle() {
    return shuffleBoard(this);
  }
}
