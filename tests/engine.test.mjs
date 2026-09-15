import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, gem, booster, box, registerElement } from '../src/engine.js';
import { levels } from '../src/levels.js';

test('snapshot is detached and command failures expose a reason', async () => {
  const game = new Game(levels[0], { random: rng(1) });
  const snapshot = game.getSnapshot();
  const originalId = snapshot.board.find(Boolean).id;

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.board), true);
  assert.equal(Object.isFrozen(snapshot.collected), true);
  assert.equal(game.board[0] === null, false);
  assert.equal(game.collected.extra, undefined);
  assert.equal(game.getSnapshot().board.find(Boolean).id, originalId);

  const result = await game.swap(0, 2);
  assert.equal(result, false);
  assert.equal(game.lastCommand.accepted, false);
  assert.equal(typeof game.lastCommand.reason, 'string');
});

test('snapshot level, goals, map and nested contents cannot mutate the live session', () => {
  const level = structuredClone(levels[9]);
  const game = new Game(level, { random: rng(7) });
  const snapshot = game.getSnapshot();
  const nestedIndex = snapshot.board.findIndex((item) => item?.contains);
  const liveBefore = {
    moves: game.level.moves,
    goalCount: game.level.goals[0].count,
    mapCell: structuredClone(game.level.map[0]),
    nestedHp: game.board[nestedIndex].contains.hp,
  };

  assert.notEqual(snapshot.level, game.level);
  assert.equal(Object.isFrozen(snapshot.level), true);
  assert.equal(Object.isFrozen(snapshot.level.goals), true);
  assert.equal(Object.isFrozen(snapshot.level.goals[0]), true);
  assert.equal(Object.isFrozen(snapshot.level.map), true);
  assert.equal(Object.isFrozen(snapshot.board[nestedIndex].contains), true);

  assert.throws(() => {
    snapshot.level.moves = 999;
  }, TypeError);
  assert.throws(() => {
    snapshot.level.goals[0].count = 999;
  }, TypeError);
  assert.throws(() => {
    snapshot.level.map[0] = null;
  }, TypeError);
  assert.throws(() => {
    snapshot.board[nestedIndex].contains.hp = 999;
  }, TypeError);

  assert.equal(game.level.moves, liveBefore.moves);
  assert.equal(game.level.goals[0].count, liveBefore.goalCount);
  assert.deepEqual(game.level.map[0], liveBefore.mapCell);
  assert.equal(game.board[nestedIndex].contains.hp, liveBefore.nestedHp);
});

test('swap exposes exact diagnostic reasons and publishes the result before final events', async () => {
  const expectSwap = async (prepare, indices, expected) => {
    const game = fixture();
    prepare(game);
    const result = await game.swap(...indices);
    assert.equal(result, expected.accepted);
    assert.deepEqual(game.lastCommand, { type: 'swap', ...expected });
  };

  await expectSwap((game) => (game.busy = true), [0, 1], {
    accepted: false,
    reason: 'BUSY',
  });
  await expectSwap((game) => (game.status = 'lost'), [0, 1], {
    accepted: false,
    reason: 'INVALID_STATUS',
  });
  await expectSwap(() => {}, [0, 2], { accepted: false, reason: 'NOT_ADJACENT' });
  await expectSwap((game) => (game.board[1] = box()), [0, 1], {
    accepted: false,
    reason: 'IMMOVABLE',
  });

  const invalid = fixture();
  let invalidEventCommand;
  invalid.animate = async (event) => {
    if (event.type === 'invalid') invalidEventCommand = invalid.getSnapshot().lastCommand;
  };
  assert.equal(await invalid.swap(0, 1), false);
  assert.deepEqual(invalidEventCommand, {
    type: 'swap',
    accepted: false,
    reason: 'NO_MATCH',
  });

  const valid = fixture();
  put(valid, [14, 15, 23]);
  valid.board[16] = gem(1);
  let readyEventCommand;
  valid.animate = async (event) => {
    if (event.type === 'ready') readyEventCommand = valid.getSnapshot().lastCommand;
  };
  assert.equal(await valid.swap(16, 23), true);
  assert.deepEqual(readyEventCommand, { type: 'swap', accepted: true, reason: 'SUCCESS' });
});

test('booster activation exposes every diagnostic reason before the ready event', async () => {
  const busy = fixture();
  busy.busy = true;
  assert.equal(await busy.activate(0), false);
  assert.deepEqual(busy.lastCommand, { type: 'activate', accepted: false, reason: 'BUSY' });

  const stopped = fixture();
  stopped.status = 'lost';
  assert.equal(await stopped.activate(0), false);
  assert.deepEqual(stopped.lastCommand, {
    type: 'activate',
    accepted: false,
    reason: 'INVALID_STATUS',
  });

  const ordinary = fixture();
  assert.equal(await ordinary.activate(0), false);
  assert.deepEqual(ordinary.lastCommand, {
    type: 'activate',
    accepted: false,
    reason: 'NOT_BOOSTER',
  });

  const valid = fixture();
  valid.board[0] = booster('line');
  let readyEventCommand;
  valid.animate = async (event) => {
    if (event.type === 'ready') readyEventCommand = valid.getSnapshot().lastCommand;
  };
  assert.equal(await valid.activate(0), true);
  assert.deepEqual(readyEventCommand, {
    type: 'activate',
    accepted: true,
    reason: 'SUCCESS',
  });
});
function rng(seed = 17) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function fixture(rows = 7, cols = 7) {
  const g = new Game(
    { rows, cols, colors: 5, moves: 20, goals: [{ key: 'color:0', count: 999 }] },
    { random: rng() },
  );
  g.board = g.board.map((_, i) => gem((Math.floor(i / cols) * 2 + (i % cols)) % 5));
  return g;
}
function put(g, ids, color = 0) {
  for (const i of ids) g.board[i] = gem(color);
}
function group(g, ids) {
  return g.findMatches().find((x) => ids.every((i) => x.cells.includes(i)));
}
test('all ten level maps: 30 seeds without startup matches, with a legal move and preserved fixed cells', () => {
  assert.equal(levels.length, 10);
  for (const l of levels)
    for (let seed = 1; seed <= 30; seed++) {
      const g = new Game(l, { random: rng(seed) });
      assert.equal(g.board.length, l.rows * l.cols);
      assert.equal(g.findMatches().length, 0, `level ${l.id}, seed ${seed}`);
      assert.ok(g.legalMoves().length);
      for (let i = 0; i < l.map.length; i++) {
        const cell = l.map[i];
        if (typeof cell === 'number') assert.equal(g.board[i].color, cell);
        if (cell?.kind) assert.equal(g.board[i].kind, cell.kind);
      }
    }
});
test('match recognition: triples, both line orientations, five, T, L and 2x2', () => {
  for (const [ids, type, axis] of [
    [[14, 15, 16], null],
    [[14, 15, 16, 17], 'line', 'h'],
    [[2, 9, 16, 23], 'line', 'v'],
    [[14, 15, 16, 17, 18], 'rainbow'],
    [[15, 16, 17, 9, 23], 'bomb'],
    [[9, 16, 23, 24, 25], 'bomb'],
    [[16, 17, 23, 24], 'plane'],
  ]) {
    const g = fixture();
    g.board = g.board.map((_, i) => gem(1 + (i % 4)));
    put(g, ids);
    const match = group(g, ids);
    assert.ok(match, `${type}: ${ids}`);
    assert.equal(match.type, type);
    if (axis) assert.equal(match.axis, axis);
  }
});
test('invalid swaps are reversed without consuming a move; nonadjacent and boxes cannot swap', async () => {
  const g = fixture();
  const original = g.board.map((x) => x.id);
  assert.equal(await g.swap(0, 1), false);
  assert.deepEqual(
    g.board.map((x) => x.id),
    original,
  );
  assert.equal(g.moves, 20);
  assert.equal(await g.swap(0, 10), false);
  g.board[1] = box();
  assert.equal(await g.swap(0, 1), false);
});
test('valid match consumes exactly one move, collects gems, and settles cascades', async () => {
  const g = fixture();
  put(g, [14, 15, 23]);
  g.board[16] = gem(1);
  const events = [];
  g.animate = async (e) => events.push(e.type);
  assert.equal(await g.swap(16, 23), true);
  assert.equal(g.moves, 19);
  assert.ok(g.collected['color:0'] >= 3);
  assert.equal(g.findMatches().length, 0);
  assert.equal(g.busy, false);
  assert.ok(events.includes('remove') && events.includes('fall'));
});
test('a created booster occupies the preferred swapped cell', async () => {
  const g = fixture();
  const ids = [14, 15, 16, 17];
  put(g, ids);
  g.preferred = [16];
  await g.wave([group(g, ids)]);
  assert.ok(g.board.some((x) => x?.kind === 'booster' && x.type === 'line'));
  assert.equal(g.collected['color:0'], 4);
});
test('gravity waits until removal animation resolves', async () => {
  const g = fixture();
  put(g, [14, 15, 16]);
  let release;
  const gate = new Promise((r) => (release = r));
  const events = [];
  g.animate = async (e) => {
    events.push(e.type);
    if (e.type === 'remove') await gate;
  };
  const task = g.wave([group(g, [14, 15, 16])]);
  await Promise.resolve();
  assert.deepEqual(events, ['remove']);
  assert.ok(g.board[14]);
  release();
  await task;
  assert.deepEqual(events, ['remove', 'fall']);
});
test('gravity compacts each blocker-separated segment and spawns above the board', async () => {
  const g = fixture(7, 5);
  g.board[15] = box('blocker');
  g.board[10] = null;
  g.board[30] = null;
  const upper = g.board[5].id,
    lower = g.board[25].id;
  let falls;
  g.animate = async (e) => {
    if (e.type === 'fall') falls = e.falls;
  };
  await g.gravity();
  assert.equal(g.board[10].id, upper);
  assert.equal(g.board[30].id, lower);
  assert.equal(g.board[15].type, 'blocker');
  assert.ok(g.board.every(Boolean));
  assert.ok(falls.some((f) => f.from < 0));
});
test('ordinary, color, cycling and unbreakable boxes obey damage policies', async () => {
  for (const [type, color, expected] of [
    ['wood', 4, true],
    ['colored', 0, true],
    ['colored', 1, false],
    ['cycling', 0, true],
    ['cycling', 2, false],
    ['blocker', 0, false],
  ]) {
    const g = fixture();
    g.board[9] = box(type, 1, color);
    const id = g.board[9].id;
    put(g, [14, 15, 16]);
    await g.wave([group(g, [14, 15, 16])]);
    assert.equal(!g.board.some((x) => x?.id === id), expected, `${type}:${color}`);
  }
});
test('a box loses only one life per wave; nested boxes and contents retain their properties', async () => {
  const g = fixture();
  g.board[16] = box('wood', 2, 0, box('colored', 2, 3, booster('bomb')));
  g.board[17] = booster('line');
  await g.wave([], [{ i: 17 }]);
  assert.equal(g.board[16].hp, 1);
  assert.equal(g.collected.box || 0, 0);
  g.board[17] = booster('line');
  await g.wave([], [{ i: 17 }]);
  assert.equal(g.board[16].type, 'colored');
  assert.equal(g.board[16].hp, 2);
  assert.equal(g.board[16].color, 3);
  assert.equal(g.collected.box, 1);
  for (let k = 0; k < 2; k++) {
    put(g, [21, 22, 23], 3);
    await g.wave([{ cells: [21, 22, 23], color: 3, type: null }]);
  }
  assert.equal(g.collected.box, 2);
  assert.ok(g.board.some((x) => x?.type === 'bomb'));
});
test('cycling changes once after a valid turn; invalid swap leaves colors intact', async () => {
  const g = fixture();
  g.board[48] = box('cycling', 5, 1);
  await g.swap(0, 1);
  assert.equal(g.board[48].color, 1);
  g.board[0] = booster('line');
  await g.activate(0);
  assert.equal(g.board[48].color, 2);
  assert.equal(g.turn, 1);
});
test('plane prioritizes outstanding level goals and leaves blockers intact', async () => {
  const g = fixture();
  g.level.goals = [{ key: 'box:colored', count: 1 }];
  g.board[48] = box('colored', 1, 4);
  g.board[47] = box('blocker');
  g.board[0] = booster('plane');
  let event;
  g.animate = async (e) => {
    if (e.type === 'remove') event = e;
  };
  await g.wave([], [{ i: 0 }]);
  assert.equal(event.effects.find((e) => e.type === 'plane').target, 48);
  assert.equal(g.collected['box:colored'] || 0, 0);
  assert.equal(g.board[48].hp, 1);
  assert.equal(g.board[47].type, 'blocker');
});
test('rainbow swapped with a gem collects that exact color', async () => {
  const g = fixture();
  g.board[0] = booster('rainbow');
  g.board[1] = gem(3);
  const count = g.board.filter((x) => x.color === 3).length;
  await g.swap(0, 1);
  assert.ok(g.collected['color:3'] >= count);
  assert.equal(g.collected['booster:rainbow'], 1);
});
test('line, bomb, rainbow and plane have distinct effect areas', async () => {
  for (const [type, count] of [
    ['line', 7],
    ['bomb', 25],
    ['rainbow', null],
    ['plane', 6],
  ]) {
    const g = fixture();
    g.board[24] = booster(type);
    let event;
    g.animate = async (e) => {
      if (e.type === 'remove') event = e;
    };
    await g.wave([], [{ i: 24, color: 2 }]);
    if (count) assert.equal(event.removed.length, count, type);
    else assert.ok(event.removed.length > 1);
    assert.ok(event.effects.some((e) => e.type === type));
  }
});
test('all 10 unordered booster combinations activate both boosters, emit effects and settle', async () => {
  const types = ['line', 'bomb', 'rainbow', 'plane'];
  for (let a = 0; a < 4; a++)
    for (let b = a; b < 4; b++) {
      const g = fixture(9, 9);
      g.board[40] = booster(types[a]);
      g.board[41] = booster(types[b]);
      const events = [];
      g.animate = async (e) => events.push(e);
      assert.equal(await g.swap(40, 41), true);
      assert.equal(g.moves, 19);
      assert.ok(g.collected.booster >= 2, `${types[a]}+${types[b]}`);
      assert.ok(events.some((e) => e.effects?.some((f) => f.type === 'combo')));
      assert.equal(g.findMatches().length, 0);
      assert.ok(g.board.every(Boolean));
    }
});
test('combo shapes: cross, three-wide cross, 9x9, all cells, three plane targets', async () => {
  for (const [a, b, min] of [
    ['line', 'line', 17],
    ['line', 'bomb', 45],
    ['bomb', 'bomb', 81],
    ['rainbow', 'rainbow', 81],
    ['plane', 'plane', 5],
  ]) {
    const g = fixture(9, 9);
    g.board[39] = booster(a);
    g.board[40] = booster(b);
    let event;
    g.animate = async (e) => {
      if (e.type === 'remove') event = e;
    };
    await g.wave([], [], { a: 39, b: 40 });
    assert.equal(event.removed.length, min, `${a}+${b}`);
  }
});
test('rainbow combinations transform color gems into the partner booster', async () => {
  for (const type of ['line', 'bomb', 'plane']) {
    const g = fixture();
    g.board[0] = booster('rainbow');
    g.board[1] = booster(type);
    await g.wave([], [], { a: 0, b: 1 });
    assert.ok(g.collected[`booster:${type}`] > 1, type);
  }
});
test('chain reaction activates each booster at most once', async () => {
  const g = fixture();
  g.board[21] = booster('line');
  g.board[24] = booster('bomb');
  g.board[10] = booster('line', 'v');
  g.board[38] = booster('plane');
  await g.wave([], [{ i: 21 }]);
  assert.equal(g.collected.booster, 4);
  assert.equal(g.collected['booster:line'], 2);
  assert.equal(g.collected['booster:bomb'], 1);
  assert.equal(g.collected['booster:plane'], 1);
});
test('last move victory has priority over defeat; unfinished goals result in defeat', async () => {
  for (const win of [true, false]) {
    const g = fixture();
    g.moves = 1;
    g.level.goals = [{ key: 'booster:line', count: win ? 1 : 2 }];
    g.board[0] = booster('line');
    await g.activate(0);
    assert.equal(g.status, win ? 'won' : 'lost');
    assert.equal(g.moves, 0);
    assert.equal(await g.activate(0), false);
  }
});
test('custom element rule can be registered without changing the engine', async () => {
  registerElement('armor', { canDamage: (_, hit) => hit.direct, afterTurn: (item) => item.hp++ });
  const g = fixture();
  g.board[1] = box('armor', 2);
  g.board[0] = booster('line');
  await g.activate(0);
  assert.equal(g.board[1].hp, 2);
});
test('500 simulated turns across all levels preserve invariants', async () => {
  for (const l of levels)
    for (let seed = 1; seed <= 2; seed++) {
      const g = new Game(
        { ...l, moves: 25, goals: [{ key: 'color:0', count: 9999 }] },
        { random: rng(seed + 100) },
      );
      while (g.status === 'playing') {
        const moves = g.legalMoves();
        assert.ok(moves.length, `level ${l.id}`);
        await g.swap(...moves[g.rand(moves.length)]);
        assert.equal(g.findMatches().length, 0);
        assert.ok(g.board.every(Boolean));
        assert.equal(new Set(g.board.map((x) => x.id)).size, g.board.length);
      }
      assert.equal(g.moves, 0);
      assert.equal(g.status, 'lost');
    }
});
test('deadlock shuffle preserves boxes and yields a stable board with a legal move', async () => {
  const g = fixture();
  g.board[24] = box('wood', 3, 0, booster('bomb'));
  const id = g.board[24].id;
  const events = [];
  g.animate = async (e) => events.push(e.type);
  await g.shuffle();
  assert.equal(g.board[24].id, id);
  assert.equal(g.board[24].hp, 3);
  assert.equal(g.findMatches().length, 0);
  assert.ok(g.legalMoves().length);
  assert.ok(events.includes('shuffle'));
});
test('all goals must be fulfilled, including specific booster and box subtypes', () => {
  const g = fixture();
  g.level.goals = [
    { key: 'color:0', count: 3 },
    { key: 'booster:plane', count: 1 },
    { key: 'box:cycling', count: 1 },
  ];
  g.collect('color:0', 3);
  g.collect('booster:plane');
  assert.equal(g.won(), false);
  g.collect('box:cycling');
  assert.equal(g.won(), true);
});
test('line carried by a plane retains its vertical visual and damage direction', async () => {
  const g = fixture();
  g.level.goals = [{ key: 'box', count: 1 }];
  g.board[48] = box();
  g.board[0] = booster('plane');
  g.board[1] = booster('line', 'v');
  let event;
  g.animate = async (e) => {
    if (e.type === 'remove') event = e;
  };
  await g.wave([], [], { a: 0, b: 1 });
  assert.equal(event.effects.find((e) => e.type === 'line').axis, 'v');
  assert.ok(event.removed.includes(13));
});

test('colored and cycling reject every direct booster hit without a matching adjacent match', async () => {
  for (const type of ['wood', 'colored', 'cycling', 'blocker']) {
    for (const effect of ['line', 'bomb', 'plane', 'rainbow']) {
      const g = fixture();
      g.board[24] = box(type, 3, 0);
      g.board[23] = booster(effect);
      g.level.goals = [{ key: `box:${type}`, count: 1 }];
      let removal;
      g.animate = async (e) => {
        if (e.type === 'remove') removal = e;
      };
      await g.wave([], [{ i: 23 }]);
      const damaged = type === 'wood' && effect !== 'rainbow';
      assert.equal(g.board[24].hp, damaged ? 2 : 3, `${type}/${effect}`);
      assert.equal(removal.damaged.includes(24), damaged);
    }
  }
});

test('matching color plus overlapping booster hits damages a colored box once per wave', async () => {
  for (const type of ['colored', 'cycling']) {
    const g = fixture();
    g.board[9] = box(type, 3, 0);
    put(g, [14, 15, 16]);
    g.board[10] = booster('bomb');
    g.board[8] = booster('line');
    await g.wave([group(g, [14, 15, 16])], [{ i: 10 }, { i: 8 }]);
    assert.equal(g.board[9].hp, 2);
  }
});

test('rainbow conversions collect exact colors, score and booster activations once despite overlap', async () => {
  for (const type of ['line', 'bomb', 'plane']) {
    const g = fixture();
    g.board[0] = booster('rainbow');
    g.board[1] = booster(type);
    const original = [...g.board];
    const color = g.bestColor();
    const count = original.filter((x) => x.kind === 'gem' && x.color === color).length;
    let removal;
    g.animate = async (e) => {
      if (e.type !== 'remove') return;
      removal = e;
      assert.equal(g.collected[`color:${color}`] || 0, 0, 'collection waits for removal');
    };
    await g.wave([], [], { a: 0, b: 1 });
    assert.equal(g.collected[`color:${color}`], count, type);
    assert.equal(g.collected.booster, count + 2);
    assert.equal(g.collected[`booster:${type}`], count + 1);
    assert.equal(g.collected['booster:rainbow'], 1);
    assert.equal(g.score, removal.removed.filter((i) => original[i]?.kind === 'gem').length * 50);
  }
});

test('rainbow combination completes a color goal on the final move', async () => {
  for (const type of ['line', 'bomb', 'plane']) {
    const g = fixture();
    g.board[0] = booster('rainbow');
    g.board[1] = booster(type);
    const color = g.bestColor();
    const count = g.board.filter((x) => x.kind === 'gem' && x.color === color).length;
    g.level.goals = [{ key: `color:${color}`, count }];
    g.moves = 1;
    await g.swap(0, 1);
    assert.equal(g.status, 'won');
    assert.equal(g.moves, 0);
    assert.equal(g.findMatches().length, 0);
  }
});

test('double rainbow respects colored box immunity and collects all gem colors once', async () => {
  const g = fixture();
  g.board[0] = booster('rainbow');
  g.board[1] = booster('rainbow');
  for (const [i, type] of ['wood', 'colored', 'cycling', 'blocker'].entries())
    g.board[10 + i] = box(type, 3, 0);
  const counts = Array.from(
    { length: 5 },
    (_, color) => g.board.filter((x) => x.kind === 'gem' && x.color === color).length,
  );
  await g.wave([], [], { a: 0, b: 1 });
  assert.equal(g.board[10].hp, 2);
  for (const i of [11, 12, 13]) assert.equal(g.board[i].hp, 3);
  for (const [color, count] of counts.entries()) assert.equal(g.collected[`color:${color}`], count);
  assert.equal(g.collected['booster:rainbow'], 2);
});
