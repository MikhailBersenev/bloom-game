import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Game, gem, box } from '../src/engine.js';
import { levels } from '../src/levels.js';
import { Board } from '../src/core/Board.js';
import { calculateGravity } from '../src/core/Gravity.js';

/** Produces the same repeatable random sequence used to capture the original engine.
 * @param {number} seed - Initial generator state.
 * @returns {function(): number} Random source in [0, 1).
 */
function randomSource(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

test('120 turns retain the corrected engine board, counters and event payloads', async () => {
  const hashes = JSON.parse(readFileSync(new URL('./behavior-hashes.json', import.meta.url)));
  for (const [index, level] of levels.entries()) {
    const events = [];
    const game = new Game(
      { ...level, moves: 12, goals: [{ key: 'color:0', count: 9999 }] },
      {
        random: randomSource(123 + level.id),
        animate: async (event) => {
          events.push(event);
        },
      },
    );
    const initial = JSON.parse(JSON.stringify(game.board));
    while (game.status === 'playing') {
      const moves = game.legalMoves();
      await game.swap(...moves[game.rand(moves.length)]);
    }
    // Runtime IDs are globally allocated; their numeric offsets are not gameplay state.
    const trace = JSON.stringify(
      {
        initial,
        events,
        board: game.board,
        score: game.score,
        collected: game.collected,
        moves: game.moves,
        status: game.status,
      },
      (key, value) => (key === 'id' ? undefined : value),
    );
    assert.equal(
      createHash('sha256').update(trace).digest('hex'),
      hashes[index],
      `level ${level.id}`,
    );
  }
});

test('gravity calculation preserves input cells and respects obstacle-separated segments', () => {
  const board = new Board(5, 1);
  const upper = gem(1);
  const lower = gem(2);
  const obstacle = box('blocker');
  board.cells = [upper, null, obstacle, lower, null];
  Object.freeze(board.cells);
  let spawned = 0;
  const result = calculateGravity(board, () => {
    spawned++;
    return gem(0);
  });
  assert.deepEqual(board.cells, [upper, null, obstacle, lower, null]);
  assert.equal(result.cells[1], upper);
  assert.equal(result.cells[2], obstacle);
  assert.equal(result.cells[4], lower);
  assert.equal(spawned, 2);
  assert.ok(result.falls.filter((move) => move.spawn).length === 2);
});

test('testing outcome belongs to the engine and refuses changes during a move', () => {
  const game = new Game(levels[0], { random: randomSource(17) });
  game.busy = true;
  game.forceOutcome(true);
  assert.equal(game.status, 'playing');
  game.busy = false;
  game.forceOutcome(true);
  assert.equal(game.won(), true);
  assert.equal(game.status, 'won');
});

test('gravity records local spawn sources and keeps survivors in each segment', () => {
  for (const obstacles of [[], [3], [2, 5], [0, 3, 4, 7]]) {
    const board = new Board(8, 1);
    board.cells = Array.from({ length: 8 }, (_, row) =>
      obstacles.includes(row) ? box('blocker') : row % 2 ? gem(row % 5) : null,
    );
    const original = [...board.cells];
    const result = calculateGravity(board, () => gem(0));
    for (const move of result.falls) {
      const top = Math.max(-1, ...obstacles.filter((row) => row < move.to)) + 1;
      const bottom = Math.min(8, ...obstacles.filter((row) => row > move.to)) - 1;
      assert.equal(move.segmentTop, top);
      assert.equal(move.segmentBottom, bottom);
      const source = original.findIndex((x) => x?.id === move.id);
      assert.equal(move.spawn, source < 0);
      if (source >= 0) {
        assert.equal(move.from, source);
        assert.ok(move.from >= top && move.to <= bottom);
      } else {
        assert.ok(move.from < top);
        if (top === 0) assert.ok(move.from < 0);
      }
    }
    for (const row of obstacles) assert.equal(result.cells[row], original[row]);
  }
});

test('ordinary column retains survivor order and legacy spawn order', () => {
  const board = new Board(5, 1);
  const a = gem(1),
    b = gem(2);
  board.cells = [a, null, b, null, null];
  let color = 0;
  const result = calculateGravity(board, () => gem(color++));
  assert.deepEqual(
    result.cells.map((x) => x.color),
    [2, 1, 0, 1, 2],
  );
  assert.deepEqual(
    result.falls.map(({ from, to, spawn }) => [from, to, spawn]),
    [
      [2, 4, false],
      [0, 3, false],
      [-2, 2, true],
      [-3, 1, true],
      [-4, 0, true],
    ],
  );
});
