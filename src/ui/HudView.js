import { icon, goalLabel, goalItem } from './presentation.js';
import { animateElement } from './motion.js';

/** Displays live progress without owning goal rules or changing session state. */
export class HudView {
  /** Binds the HUD to the page and board accessibility state.
   * @param {Document} root - Page root.
   * @param {HTMLElement} board - Board grid.
   */
  constructor(root, board) {
    this.root = root;
    this.board = board;
    this.game = null;
  }

  /** Updates counters and preserves badge nodes so only changed goals pulse.
   * @param {import('../core/Game.js').Game} game - Session to display.
   * @returns {void}
   */
  hud(game) {
    const container = this.root.querySelector('#goals');
    if (game !== this.game) {
      container.replaceChildren();
      this.game = game;
    }
    this.root.querySelector('#moves').textContent = game.moves;
    this.root.querySelector('.moves-block').classList.toggle('low', game.moves <= 5);
    this.root.querySelector('#score').textContent = game.score.toLocaleString('ru');
    for (const [index, goal] of game.level.goals.entries())
      this.updateGoal(container, index, goal, game);
    this.root.querySelector('#game-status').textContent = game.busy
      ? 'Маленькая магия…'
      : 'Ваш ход';
    this.board.setAttribute('aria-busy', String(game.busy));
  }

  /** Renders the collected/required count, completion mark and progress track for one goal.
   * @param {HTMLElement} container - Goal list.
   * @param {number} index - Goal display index.
   * @param {import('../types.js').GoalConfig} goal - Required count and key.
   * @param {import('../core/Game.js').Game} game - Source of remaining counts.
   * @returns {void}
   */
  updateGoal(container, index, goal, game) {
    let badge = container.children[index];
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'goal';
      badge.innerHTML = `${icon(goalItem(goal.key))}<span class="goal-count"></span><span class="goal-track"><i></i></span><span class="goal-check" aria-hidden="true">✓</span>`;
      container.append(badge);
    }
    const collected = goal.count - game.remaining(goal);
    const hasChanged =
      badge.dataset.count !== undefined && Number(badge.dataset.count) !== collected;
    badge.dataset.count = collected;
    badge.classList.toggle('complete', collected >= goal.count);
    badge.querySelector('.goal-count').textContent = `${collected} / ${goal.count}`;
    badge.querySelector('.goal-track i').style.transform =
      `scaleX(${collected / Math.max(1, goal.count)})`;
    const label = `${goalLabel(goal.key)}: ${collected} из ${goal.count}`;
    badge.title = label;
    badge.setAttribute('aria-label', label);
    if (hasChanged)
      void animateElement(
        badge,
        [
          { transform: 'scale(1)', backgroundColor: '#fff9df' },
          { transform: 'scale(1.07)', backgroundColor: '#fff0a5' },
          { transform: 'scale(1)', backgroundColor: '#fff9df' },
        ],
        240,
      );
  }
}
