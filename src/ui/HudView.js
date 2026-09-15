import { icon, goalLabel, goalItem } from './presentation.js';
import { animateElement } from './motion.js';

/** Displays live progress without owning goal rules or changing session state. */
export class HudView {
  /** Связывает HUD со страницей и состоянием доступности игрового поля.
   * @param {Document} root - Параметр операции.
   * @param {HTMLElement} board - Параметр операции.
   */
  constructor(root, board) {
    this.root = root;
    this.board = board;
    this.game = null;
  }

  /** Updates counters and preserves badge nodes so only changed goals pulse.
   * @param {import('../core/Game.js').Game} game - Параметр операции.
   * @returns Результат выполнения операции.
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

  /** Отображает собранное и требуемое количество, отметку выполнения и прогресс одной цели.
   * @param {HTMLElement} container - Параметр операции.
   * @param {number} index - Параметр операции.
   * @param {import('../types.js').GoalConfig} goal - Параметр операции.
   * @param {import('../core/Game.js').Game} game - Параметр операции.
   * @returns Результат выполнения операции.
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
