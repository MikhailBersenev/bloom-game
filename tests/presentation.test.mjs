import test from 'node:test';
import assert from 'node:assert/strict';
import { GameAnimations } from '../src/ui/animations.js';
import { animateElement } from '../src/ui/motion.js';

globalThis.matchMedia = () => ({ matches: false });

/** Создаёт управляемую цель Web Animations для проверки порядка событий.
 * @returns {Object}
 */
function visual() {
  return {
    style: {},
    calls: [],
    /** Записывает ключевые кадры и удерживает завершение до разрешения тестом.
     * @param {Keyframe[]} frames
     * @param {Object} options
     * @returns {Object}
     */
    animate(frames, options) {
      let finish;
      const finished = new Promise((resolve) => {
        finish = resolve;
      });
      this.calls.push({ frames, options, finish });
      return { finished, cancel() {} };
    },
  };
}

/** Даёт текущей цепочке ожидающих обещаний отображения продвинуться.
 * @returns {Promise<void>}
 */
async function flush() {
  for (let step = 0; step < 12; step++) await Promise.resolve();
}

test('survivors finish falling before spawned pieces become visible or start their fall', async () => {
  const survivor = visual(),
    spawned = visual();
  const tiles = { 1: survivor, 2: spawned };
  const view = {
    draw() {},
    board: {
      querySelector(selector) {
        return tiles[selector.match(/data-id="(\d+)"/)[1]];
      },
    },
  };
  const animations = new GameAnimations(view, { play() {} });
  const event = {
    board: [],
    falls: [
      { id: 1, from: 0, to: 2, col: 0 },
      { id: 2, from: -2, to: 0, col: 0 },
    ],
  };
  const task = animations.fall(event, { rows: 3, cols: 1 }, () => true);
  await flush();
  assert.equal(survivor.calls.length, 1);
  assert.equal(spawned.calls.length, 0);
  assert.equal(spawned.style.visibility, 'hidden');
  survivor.calls[0].finish();
  await flush();
  assert.equal(spawned.calls.length, 1);
  assert.equal(spawned.style.visibility, '');
  assert.equal(spawned.calls[0].frames[0].transform, 'translate(0%, -200%)');
  spawned.calls[0].finish();
  await task;
});

test('effect queue finishes in order before destruction begins', async () => {
  const art = visual();
  const animations = new GameAnimations(
    {
      draw() {},
      board: {
        querySelector() {
          return art;
        },
      },
    },
    { play() {} },
  );
  const calls = [],
    releases = [];
  animations.playEffect = (effect) =>
    new Promise((resolve) => {
      calls.push(effect.type);
      releases.push(resolve);
    });
  const task = animations.remove(
    { board: [], removed: [0], damaged: [], effects: [{ type: 'bomb' }, { type: 'plane' }] },
    {},
    () => true,
  );
  await flush();
  assert.deepEqual(calls, ['bomb']);
  assert.equal(art.calls.length, 0);
  releases[0]();
  await flush();
  assert.deepEqual(calls, ['bomb', 'plane']);
  assert.equal(art.calls.length, 0);
  releases[1]();
  await flush();
  assert.equal(art.calls.length, 1);
  art.calls[0].finish();
  await task;
  assert.equal(art.style.opacity, '0');
});

test('cancelling a detached visual does not reject the game turn', async () => {
  const element = {
    animate() {
      return { finished: Promise.reject(new Error('cancelled')), cancel() {} };
    },
  };
  await assert.doesNotReject(animateElement(element, [{ opacity: 1 }, { opacity: 0 }], 200));
});

test('reduced motion shortens functional animation while still waiting for completion', async () => {
  globalThis.matchMedia = () => ({ matches: true });
  const element = visual();
  const task = animateElement(element, [{ opacity: 1 }, { opacity: 0 }], 320);
  assert.equal(element.calls[0].options.duration, 25);
  element.calls[0].finish();
  await task;
  globalThis.matchMedia = () => ({ matches: false });
});

test('board rendering uses only transform positions so gravity cannot double the cell offset', async () => {
  const { GameView } = await import('../src/ui/view.js');
  const cells = Array.from({ length: 4 }, (_, index) => ({
    kind: 'gem',
    id: index + 1,
    color: index,
  }));
  const tiles = cells.map((piece) => ({
    dataset: { id: String(piece.id), key: JSON.stringify(piece) },
    style: {},
    classList: { toggle() {} },
    setAttribute() {},
  }));
  const board = {
    querySelector(selector) {
      return tiles.find((tile) => selector.includes(`data-id="${tile.dataset.id}"`));
    },
    querySelectorAll() {
      return tiles;
    },
  };
  GameView.prototype.draw.call({ board }, { rows: 2, cols: 2, board: cells });
  assert.deepEqual(
    tiles.map((tile) => tile.style.transform),
    ['translate(0%, 0%)', 'translate(100%, 0%)', 'translate(0%, 100%)', 'translate(100%, 100%)'],
  );
  assert.ok(tiles.every((tile) => tile.style.left === undefined && tile.style.top === undefined));
});

test('results automatically advance or retry, and an early button press cannot transition twice', async () => {
  const { GameController } = await import('../src/ui/controller.js');
  /** Создаёт минимальную сессию диалога результата без зависимости от браузера.
   * @param {'won'|'lost'} status
   * @returns {Object}
   */
  function session(status) {
    const content = {},
      button = {},
      destinations = [];
    return {
      destinations,
      button,
      game: { status, score: 0 },
      session: 1,
      levelIndex: 2,
      levels: Array(10),
      progress: { unlocked: 1 },
      view: {
        modal: {
          querySelector(selector) {
            return selector === '#modal-content' ? content : button;
          },
          showModal() {},
        },
      },
      audio: { play() {} },
      renderMap() {},
      async startLevel(index) {
        destinations.push(index);
        this.session++;
      },
    };
  }
  const victory = session('won'),
    defeat = session('lost'),
    early = session('won'),
    replaced = session('won');
  const tasks = [victory, defeat, early, replaced].map((owner) =>
    GameController.prototype.showOutcome.call(owner),
  );
  await early.button.onclick();
  replaced.session++;
  await Promise.all(tasks);
  assert.deepEqual(victory.destinations, [3]);
  assert.deepEqual(defeat.destinations, [2]);
  assert.deepEqual(early.destinations, [3]);
  assert.deepEqual(replaced.destinations, []);
});

test('lower segment spawn clips every interpolated position at its entrance in both motion modes', async () => {
  for (const reduced of [false, true]) {
    globalThis.matchMedia = () => ({ matches: reduced });
    const tile = visual();
    const animations = new GameAnimations(
      {
        draw() {},
        board: {
          querySelector() {
            return tile;
          },
        },
      },
      { play() {} },
    );
    const move = { id: 1, from: 1, to: 4, col: 0, spawn: true, segmentTop: 4, segmentBottom: 6 };
    const task = animations.fall({ board: [], falls: [move] }, {}, () => true);
    assert.equal(tile.style.visibility, 'hidden');
    await flush();
    const frames = tile.calls[0].frames;
    for (let i = 0; i < frames.length - 1; i++) {
      const row = (frame) => Number(frame.transform.match(/, ([\d.-]+)%/)[1]) / 100;
      const clip = (frame) => Number(frame.clipPath.match(/inset\(([\d.-]+)%/)[1]) / 100;
      for (let step = 0; step <= 10; step++) {
        const t = step / 10;
        const y = row(frames[i]) * (1 - t) + row(frames[i + 1]) * t;
        const hidden = clip(frames[i]) * (1 - t) + clip(frames[i + 1]) * t;
        assert.ok(y + hidden >= 4 - 1e-9, 'visible pixels never overlap the box above');
      }
    }
    tile.calls[0].finish();
    await task;
    assert.equal(tile.style.transform, 'translate(0%, 400%)');
    assert.equal(tile.style.visibility, '');
    assert.equal(tile.style.clipPath, '');
  }
  globalThis.matchMedia = () => ({ matches: false });
});

test('landing bounce stays above the box below a segment', async () => {
  const tile = visual();
  const animations = new GameAnimations({}, {});
  const task = animations.dropPieces(
    [{ tile, move: { from: 0, to: 2, col: 0, spawn: false, segmentTop: 0, segmentBottom: 2 } }],
    270,
  );
  for (const frame of tile.calls[0].frames) {
    assert.ok(Number(frame.transform.match(/, ([\d.-]+)%/)[1]) <= 200);
  }
  tile.calls[0].finish();
  await task;
});
