import { icon, boosterNames } from './presentation.js';
import { animateElement, motionDuration, tileTransform } from './motion.js';

/** Waits for a presentation pause while respecting reduced motion.
 * @param {number} milliseconds - Requested duration.
 * @param {boolean} [isMotion=true] - Whether reduced motion shortens this interval.
 * @returns {Promise<void>} Resolves after the presentation interval.
 */
export function pause(milliseconds, isMotion = true) {
  return new Promise(
    /** Schedules the centralized presentation delay.
     * @param {function(): void} resolve - Completes the delay.
     * @returns {void}
     */ (resolve) => {
      setTimeout(resolve, isMotion ? motionDuration(milliseconds) : milliseconds);
    },
  );
}

/** Сохраняет порядок визуальных фаз: обмен, эффекты, удаление, падение и появление новых фишек. */
export class GameAnimations {
  /** Creates the event-to-animation adapter.
   * @param {import('./view.js').GameView} view - Board and HUD renderer.
   * @param {import('./audio.js').GameAudio} audio - Optional sound adapter.
   */
  constructor(view, audio) {
    this.view = view;
    this.audio = audio;
    this.revealPositions = [];
  }

  /** Dispatches a domain snapshot and awaits all visuals belonging to it.
   * @param {Object} event - Engine event and immutable presentation metadata.
   * @param {import('../core/Game.js').Game} game - Current session.
   * @param {function(): boolean} isCurrent - Session ownership guard.
   * @returns {Promise<void>}
   */
  async play(event, game, isCurrent) {
    if (!isCurrent()) return;
    if (event.type === 'remove') await this.remove(event, game, isCurrent);
    else if (event.type === 'fall') await this.fall(event, game, isCurrent);
    else if (event.type === 'swap' || event.type === 'invalid' || event.type === 'shuffle')
      await this.reposition(event, game);
    else {
      this.view.draw(game, null, event.board);
      if (event.type === 'cascade' && event.chain > 1) this.view.toast(`Каскад ×${event.chain}`);
    }
    if (isCurrent()) this.view.hud(game);
  }

  /** Animates tile relocation using their previous and next board coordinates.
   * @param {Object} event - Swap, invalid-swap or shuffle snapshot.
   * @param {import('../core/Game.js').Game} game - Board dimensions.
   * @returns {Promise<void>}
   */
  async reposition(event, game) {
    const previous = new Map();
    for (const tile of this.view.board.children)
      previous.set(tile.dataset.id, Number(tile.dataset.index));
    this.view.draw(game, null, event.board);
    const animations = [];
    for (const tile of this.view.board.children) {
      const oldIndex = previous.get(tile.dataset.id);
      const newIndex = Number(tile.dataset.index);
      if (oldIndex === undefined || oldIndex === newIndex) continue;
      const [oldRow, oldCol] = game.rc(oldIndex);
      const [row, col] = game.rc(newIndex);
      animations.push(
        animateElement(
          tile,
          [{ transform: tileTransform(oldRow, oldCol) }, { transform: tileTransform(row, col) }],
          event.type === 'shuffle' ? 360 : 190,
          'cubic-bezier(.25,.8,.3,1)',
        ),
      );
    }
    this.audio.play(event.type === 'invalid' ? 190 : 330);
    await Promise.all(animations);
    if (event.type === 'invalid') {
      await animateElement(
        this.view.board,
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' },
        ],
        110,
      );
    }
    if (event.type === 'shuffle') this.view.toast('Новые возможности! Перемешиваем поле');
  }

  /** Эффекты бустеров идут по очереди до удаления; движок ждёт завершения всей последовательности.
   * @param {Object} event - Removal sets, damage sets and ordered effects.
   * @param {import('../core/Game.js').Game} game - Board dimensions.
   * @param {function(): boolean} isCurrent - Session ownership guard.
   * @returns {Promise<void>}
   */
  async remove(event, game, isCurrent) {
    this.view.draw(game, null, event.board);
    this.revealPositions = [];
    for (const index of event.damaged) {
      const piece = event.board[index];
      if (piece.hp <= 1 && piece.contains) this.revealPositions.push(index);
    }
    for (const effect of event.effects) {
      if (!isCurrent()) return;
      await this.playEffect(effect, game);
    }
    const animations = [];
    for (const index of event.removed) {
      const art = this.view.board.querySelector(`[data-index="${index}"] .piece-art`);
      animations.push(this.destroy(art));
    }
    for (const index of event.damaged) {
      if (event.removed.includes(index)) continue;
      const art = this.view.board.querySelector(`[data-index="${index}"] .piece-art`);
      animations.push(
        animateElement(
          art,
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px) rotate(-6deg)' },
            { transform: 'translateX(4px) rotate(4deg)' },
            { transform: 'translateX(0)' },
          ],
          230,
        ),
      );
    }
    this.audio.play(event.effects.length ? 660 : 500);
    await Promise.all(animations);
  }

  /** После анимации старая фишка остаётся скрытой до удаления её клетки движком.
   * @param {HTMLElement} art - Piece artwork container.
   * @returns {Promise<void>}
   */
  async destroy(art) {
    if (!art) return;
    await animateElement(
      art,
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.18)', opacity: 1, offset: 0.28 },
        { transform: 'scale(.15) rotate(12deg)', opacity: 0 },
      ],
      260,
    );
    art.style.opacity = '0';
  }

  /** Раскрывает содержимое, завершает падение выживших, затем запускает появление новых фишек в секциях.
   * @param {Object} event - Final cells and movement trajectories.
   * @param {import('../core/Game.js').Game} game - Board dimensions.
   * @param {function(): boolean} isCurrent - Session ownership guard.
   * @returns {Promise<void>}
   */
  async fall(event, game, isCurrent) {
    this.view.draw(game, null, event.board);
    const survivors = [],
      spawned = [];
    for (const move of event.falls) {
      const tile = this.view.board.querySelector(`[data-id="${move.id}"]`);
      tile.style.transform = tileTransform(move.from, move.col);
      if (move.spawn ?? move.from < 0) {
        tile.style.visibility = 'hidden';
        spawned.push({ tile, move });
      } else survivors.push({ tile, move });
    }
    const reveals = [];
    for (const index of this.revealPositions) {
      const [row, col] = game.rc(index);
      const contained = survivors.find(
        /** Finds a revealed movable piece at its source cell.
         * @param {{move: Object}} entry - Survivor trajectory.
         * @returns {boolean}
         */ (entry) => entry.move.from === row && entry.move.col === col,
      );
      const tile = contained?.tile ?? this.view.board.querySelector(`[data-index="${index}"]`);
      if (tile)
        reveals.push(
          animateElement(
            tile.querySelector('.piece-art'),
            [
              { transform: 'scale(.45)', opacity: 0.3 },
              { transform: 'scale(1.12)', opacity: 1 },
              { transform: 'scale(1)', opacity: 1 },
            ],
            180,
          ),
        );
    }
    this.revealPositions = [];
    await Promise.all(reveals);
    await this.dropPieces(survivors, 270);
    if (!isCurrent()) return;
    await this.dropPieces(spawned, 320);
  }

  /** Runs one fall phase with a small landing bounce and no layout-dependent animation loop.
   * @param {Array<{tile: HTMLElement, move: Object}>} entries - Tiles and their row trajectories.
   * @param {number} duration - Phase duration.
   * @returns {Promise<void>}
   */
  async dropPieces(entries, duration) {
    const animations = [];
    for (const { tile, move } of entries) {
      tile.style.visibility = '';
      tile.style.transform = tileTransform(move.to, move.col);
      if (move.from === move.to) continue;
      // Обрезка движется вместе с фишкой: видна лишь часть ниже входа в секцию.
      // Значения свыше 100% сохраняют полное скрытие до пересечения границы.
      const frame = (row, offset) => ({
        transform: tileTransform(row, move.col),
        offset,
        ...((move.spawn ?? move.from < 0)
          ? { clipPath: `inset(${Math.max(0, (move.segmentTop ?? 0) - row) * 100}% 0 0 0)` }
          : {}),
      });
      animations.push(
        animateElement(
          tile,
          [
            frame(move.from, 0),
            frame(Math.min(move.to + 0.065, move.segmentBottom ?? Infinity), 0.82),
            frame(move.to - 0.025, 0.93),
            frame(move.to, 1),
          ],
          duration,
          'cubic-bezier(.4,0,.7,1)',
        ),
      );
    }
    await Promise.all(animations);
    for (const { tile } of entries) tile.style.clipPath = '';
  }

  /** Порядок эффектов задаёт движок, включая комбинации и цепные активации.
   * @param {import('../types.js').BoosterEffect} effect - Effect metadata.
   * @param {import('../core/Game.js').Game} game - Board geometry.
   * @returns {Promise<void>}
   */
  async playEffect(effect, game) {
    if (effect.type === 'combo') {
      const names = effect.label
        .split('+')
        .map(
          /** Names the members of a booster pair.
           * @param {string} type - Booster type.
           * @returns {string}
           */ (type) => boosterNames[type],
        )
        .join(' + ');
      this.view.toast(names);
      await animateElement(
        this.view.board,
        [{ opacity: 1 }, { opacity: 0.7 }, { opacity: 1 }],
        130,
      );
      return;
    }
    const element = document.createElement('div');
    element.className = `effect effect-${effect.type} ${effect.axis || 'h'} ${effect.large ? 'large' : ''}`;
    const [row, col] = game.rc(effect.i);
    element.style.setProperty('--x', `${((col + 0.5) * 100) / game.cols}%`);
    element.style.setProperty('--y', `${((row + 0.5) * 100) / game.rows}%`);
    element.style.setProperty('--area', `${((effect.large ? 9 : 5) * 100) / game.cols}%`);
    if (effect.type === 'line') element.innerHTML = '<i></i><b></b>';
    this.view.effects.append(element);
    if (effect.type === 'plane') await this.fly(element, effect, game);
    else
      await animateElement(
        element,
        [
          { opacity: 0, scale: '.2' },
          { opacity: 1, scale: '1', offset: 0.4 },
          { opacity: 0, scale: '1.25' },
        ],
        effect.type === 'rainbow' ? 240 : 190,
      );
    element.remove();
  }

  /** Flies a plane to the engine-selected target and awaits the impact ring.
   * @param {HTMLElement} element - Flight visual.
   * @param {import('../types.js').BoosterEffect} effect - Source and target indices.
   * @param {import('../core/Game.js').Game} game - Board dimensions.
   * @returns {Promise<void>}
   */
  async fly(element, effect, game) {
    element.innerHTML = icon({ kind: 'booster', type: 'plane' });
    const [row, col] = game.rc(effect.i);
    const [targetRow, targetCol] = game.rc(effect.target ?? effect.i);
    const dx = ((targetCol - col) * this.view.board.clientWidth) / game.cols;
    const dy = ((targetRow - row) * this.view.board.clientHeight) / game.rows;
    await animateElement(
      element,
      [
        { transform: 'translate(-50%,-50%) scale(.8)' },
        { transform: 'translate(-50%,-75%) scale(1.2)', offset: 0.2 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.5)` },
      ],
      330,
      'ease-in-out',
    );
    element.className = 'effect effect-impact';
    element.innerHTML = '';
    element.style.left = `${((targetCol + 0.5) * 100) / game.cols}%`;
    element.style.top = `${((targetRow + 0.5) * 100) / game.rows}%`;
    await animateElement(
      element,
      [
        { opacity: 1, scale: '.3' },
        { opacity: 0, scale: '1.7' },
      ],
      130,
    );
  }
}
