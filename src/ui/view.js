import { tileTransform, animateElement } from './motion.js';
import { HudView } from './HudView.js';
import { icon, itemLabel } from './presentation.js';

/** Отображает снимки состояния и не изменяет состояние движка. */
export class GameView {
  /**
   * @param {Document} [root]
   * @returns {void}
   */
  constructor(root = document) {
    this.root = root;
    this.board = root.querySelector('#board');
    this.hudView = new HudView(root, this.board);
    this.effects = root.querySelector('#effects');
    this.modal = root.querySelector('#modal');
    this.toastTimer = null;
  }

  /**
   * @param {string} text
   * @returns {void}
   */
  toast(text) {
    this.root.querySelector('#toast').textContent = text;
    this.root.querySelector('#toast').classList.add('visible');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(
      /**
       * @returns {*}
       */ () => this.root.querySelector('#toast').classList.remove('visible'),
      1700,
    );
  }

  /**
   * @param {import("../core/Game.js").Game} game
   * @param {number|null} [selected]
   * @param {import("../types.js").Cell[]} [state]
   * @returns {void}
   */
  draw(game, selected = null, state = game.board) {
    const liveIds = new Set();
    state.forEach(
      /**
       * @param {import("../types.js").Cell} item
       * @param {number} index
       * @returns {void}
       */ (item, index) => {
        if (!item) return;
        liveIds.add(String(item.id));
        let tile = this.board.querySelector(`[data-id="${item.id}"]`);
        if (!tile) {
          tile = document.createElement('button');
          tile.className = 'tile';
          tile.dataset.id = item.id;
          tile.setAttribute('role', 'gridcell');
          this.board.append(tile);
        }

        const key = JSON.stringify(item);
        if (tile.dataset.key !== key) {
          const hasChangedColor = tile.dataset.color && tile.dataset.color !== String(item.color);
          tile.innerHTML = `<span class="piece-art">${icon(item)}${this.obstacleDetails(item)}</span>`;
          tile.dataset.kind = item.kind;
          tile.dataset.type = item.type || '';
          tile.dataset.color = String(item.color);
          tile.dataset.durability = item.hp <= 1 ? 'low' : item.hp === 2 ? 'medium' : 'high';
          if (hasChangedColor && item.type === 'cycling') {
            void animateElement(
              tile.querySelector('.piece-art'),
              [{ transform: 'scale(1)' }, { transform: 'scale(1.13)' }, { transform: 'scale(1)' }],
              180,
            );
          }
          tile.dataset.key = key;
        }

        tile.dataset.index = index;
        tile.style.transform = tileTransform(Math.floor(index / game.cols), index % game.cols);
        tile.classList.toggle('selected', selected === index);
        tile.classList.toggle('is-booster', item.kind === 'booster');
        tile.setAttribute(
          'aria-label',
          `${Math.floor(index / game.cols) + 1} ряд, ${(index % game.cols) + 1} столбец: ${itemLabel(item)}`,
        );
        tile.tabIndex = index === 0 ? 0 : -1;
      },
    );
    for (const tile of this.board.querySelectorAll('.tile'))
      if (!liveIds.has(tile.dataset.id)) tile.remove();
  }

  /** Создаёт индикаторы прочности и скрытого содержимого без изменения ящика.
   * @param {import('../types.js').Piece} item
   * @returns {string}
   */
  obstacleDetails(item) {
    if (item.kind !== 'box' || item.type === 'blocker') return '';
    return `<img class="crate-cracks" src="/src/textures/crate-cracks.svg" alt="" aria-hidden="true">
      <span class="hp" aria-hidden="true">${'•'.repeat(Math.min(item.hp, 5))}${item.hp > 5 ? '+' : ''}</span>
      ${item.contains ? '<span class="contains-badge" aria-hidden="true">✦</span>' : ''}`;
  }

  /**
   * @param {import("../core/Game.js").Game} game
   * @returns {void}
   */
  hud(game) {
    this.hudView.hud(game);
  }

  /**
   * @param {import("../types.js").LevelConfig[]} levels
   * @param {number} index
   * @param {number} unlocked
   * @returns {void}
   */
  renderMap(levels, index, unlocked) {
    this.root.querySelector('#level-map').innerHTML = levels
      .map(
        /**
         * @param {import("../types.js").LevelConfig} level
         * @param {number} position
         * @returns {*}
         */ (level, position) => {
          const current = position === index;
          const passed = position + 1 < unlocked;
          const number = passed ? '✓' : String(position + 1).padStart(2, '0');
          const badge = current ? '<b>✿</b>' : passed ? '<b>✧</b>' : '';
          return `
        <button class="map-level ${current ? 'current' : ''} ${passed ? 'passed' : ''}"
          data-level="${position}" aria-label="Уровень ${position + 1}: ${level.name}"
          ${current ? 'aria-current="step"' : ''}>
          <span class="map-node">${number}</span>
          <span>${level.name}${current ? '<small>ВЫ ЗДЕСЬ</small>' : ''}</span>
          ${badge}
        </button>
      `;
        },
      )
      .join('');
    this.root.querySelector('#journey-count').textContent =
      `${String(index + 1).padStart(2, '0')} / ${levels.length}`;
  }

  /**
   * @param {import("../core/Game.js").Game} game
   * @param {number} index
   * @returns {void}
   */
  prepareLevel(game, index) {
    clearTimeout(this.toastTimer);
    this.root.querySelector('#toast').classList.remove('visible');
    this.root.querySelector('#toast').textContent = '';
    this.board.replaceChildren();
    this.effects.replaceChildren();
    this.modal.close();
    this.board.style.setProperty('--cols', game.cols);
    this.board.style.setProperty('--rows', game.rows);
    this.board.style.aspectRatio = `${game.cols}/${game.rows}`;
    this.board.setAttribute('aria-rowcount', game.rows);
    this.board.setAttribute('aria-colcount', game.cols);
    this.root.querySelector('#level-number').textContent =
      `УРОВЕНЬ ${String(index + 1).padStart(2, '0')}`;
    this.root.querySelector('#level-name').textContent = game.level.name;
    this.root.querySelector('#level-subtitle').textContent = game.level.subtitle;
    this.root.querySelector('#level-select').value = index;
    const section = this.root.querySelector('.play-section');
    if (section.getBoundingClientRect().top < 0)
      section.scrollIntoView({ block: 'start', behavior: 'instant' });
  }
}
