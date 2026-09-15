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
 * Описание операции или проверяемого поведения.
 * Описание операции или проверяемого поведения.
 * @param {*} value - Параметр операции.
 * @returns Результат выполнения операции.
 */
function frozenCopy(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return Object.freeze(value.map(frozenCopy));
  return Object.freeze(
    Object.fromEntries(Object.entries(value).map(([key, item]) => [key, frozenCopy(item)])),
  );
}

/**
 * Описание операции или проверяемого поведения.
 * @param {*} value - Параметр операции.
 * @returns Результат выполнения операции.
 */
function cloneData(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(cloneData);
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneData(item)]));
}

/** Публичная оболочка сессии: хранит счётчики и объединяет игровые операции через асинхронный обработчик событий. */
export class Game {
  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").LevelConfig} level - Параметр операции.
   * @param {import('../types.js').GameOptions} options - Engine dependencies.
   * @returns Результат выполнения операции.
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
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  get board() {
    return this.field.cells;
  }

  /**
   * Описание операции или проверяемого поведения.
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
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
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").Cell[]} cells - Параметр операции.
   * @returns Результат выполнения операции.
   */
  set board(cells) {
    this.field.cells = cells;
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {boolean} isWon - Параметр операции.
   * @returns Результат выполнения операции.
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
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").Cell} item - Параметр операции.
   * @returns Результат выполнения операции.
   */
  clone(item) {
    return cloneElement(item);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  initialize() {
    return initializeBoard(this);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  createPiece() {
    return gem(this.rand(this.level.colors));
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} n - Параметр операции.
   * @returns Результат выполнения операции.
   */
  rand(n) {
    return Math.floor(this.random() * n);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} i - Параметр операции.
   * @returns Результат выполнения операции.
   */
  rc(i) {
    return this.field.coordinatesAt(i);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} r - Параметр операции.
   * @param {number} c - Параметр операции.
   * @returns Результат выполнения операции.
   */
  at(r, c) {
    return this.field.indexAt(r, c);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} i - Параметр операции.
   * @returns Результат выполнения операции.
   */
  adjacent(i) {
    return this.field.neighborsOf(i);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} i - Параметр операции.
   * @returns Результат выполнения операции.
   */
  movable(i) {
    return this.field.hasMovablePiece(i);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  findMatches() {
    return findMatches(this.board, this.rows, this.cols);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  legalMoves() {
    return findLegalMoves(this);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {string} key - Параметр операции.
   * @param {number} [n] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  collect(key, n = 1) {
    return collect(this.collected, key, n);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").GoalConfig} goal - Параметр операции.
   * @returns Результат выполнения операции.
   */
  remaining(goal) {
    return remaining(this.collected, goal);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  won() {
    return won(this.level.goals, this.collected);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {import('../types.js').EngineEventType} type - Event discriminator.
   * @param {Record<string, unknown>} [extra={}] - Event-specific payload.
   * @returns Результат выполнения операции.
   */
  async emit(type, extra = {}) {
    const event = createEngineEvent(type, this.board, extra);
    await this.animate(event, this);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  bestColor() {
    return bestColor(this);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {Set<number>} [exclude] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  target(exclude = new Set()) {
    return target(this, exclude);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} i - Параметр операции.
   * @param {number} radius - Параметр операции.
   * @returns Результат выполнения операции.
   */
  area(i, radius) {
    return this.field.squareAround(i, radius);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} i - Параметр операции.
   * @param {string} [axis] - Параметр операции.
   * @param {number} [width] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  line(i, axis = 'h', width = 1) {
    return this.field.lineThrough(i, axis, width);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {import("../types.js").Match[]} [groups] - Параметр операции.
   * @param {import("../types.js").Activation[]} [activation] - Параметр операции.
   * @param {import("../types.js").Combination|null} [combo] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  async wave(groups = [], activation = [], combo = null) {
    await new ResolutionWave(this).resolve(groups, activation, combo);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  async gravity() {
    const { cells, falls } = calculateGravity(
      this.field,
      /**
       * Описание операции или проверяемого поведения.
       * @returns Результат выполнения операции.
       */ () => this.createPiece(),
    );
    this.board.splice(0, this.board.length, ...cells);
    await this.emit('fall', { falls });
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  async settle() {
    return resolveBoard(this);
  }
  /**
   * Описание операции или проверяемого поведения.
   * @param {number} a - Параметр операции.
   * @param {number} b - Параметр операции.
   * @returns Результат выполнения операции.
   */
  async swap(a, b) {
    return resolveMove(this, a, b);
  }
  /**
   * Описание операции или проверяемого поведения.
   * @param {number} i - Параметр операции.
   * @returns Результат выполнения операции.
   */
  async activate(i) {
    return activateBooster(this, i);
  }
  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  async finishTurn() {
    return finishTurn(this);
  }

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  async shuffle() {
    return shuffleBoard(this);
  }
}
