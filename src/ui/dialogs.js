import { icon, boosterNames } from './presentation.js';

const OUTCOMES = {
  lost: {
    art: '❧',
    eyebrow: 'ПОПРОБУЕМ ЕЩЁ РАЗ',
    title: 'Саду нужно чуть больше заботы',
    description: 'Ходы закончились. Новая расстановка — новые возможности.',
    button: 'Попробовать снова ↻',
  },
  won: {
    art: '✿',
    eyebrow: 'ЕЩЁ ОДНО МАЛЕНЬКОЕ ЧУДО',
    title: 'Прекрасная работа!',
    description: 'Все цели собраны. Следующий уголок уже ждёт вас.',
    button: 'Следующий уровень →',
  },
  completed: {
    art: '✿',
    eyebrow: 'ЕЩЁ ОДНО МАЛЕНЬКОЕ ЧУДО',
    title: 'Ваш сад расцвёл!',
    description: 'Все 10 уголков открыты. Можно вернуться в любой любимый сад.',
    button: 'Вернуться к первому уровню',
  },
};

/**
 * Opens the result dialog and binds its continuation action.
 * @param {HTMLDialogElement} modal - Dialog to populate.
 * @param {import("../core/Game.js").Game} game - Current game session.
 * @param {boolean} last - Whether this is the final level.
 * @param {function(): *} onContinue - Action for the continuation button.
 * @returns {void} Completes the operation.
 */
export function showResult(modal, game, last, onContinue) {
  const outcome = game.status === 'won' && last ? 'completed' : game.status;
  const copy = OUTCOMES[outcome];
  modal.querySelector('#modal-content').innerHTML = `
    <div class="result-art">${copy.art}</div>
    <div class="eyebrow">${copy.eyebrow}</div>
    <h2>${copy.title}</h2>
    <p>${copy.description}</p>
    <div class="result-score">${game.score.toLocaleString('ru')} <small>очков</small></div>
    <button class="primary" id="result-next">${copy.button}</button>
    <p class="auto-continue">${game.status === 'won' ? 'Следующий уровень' : 'Новая попытка'} откроется автоматически</p>
  `;
  modal.showModal();
  modal.querySelector('#result-next').onclick = onContinue;
}

const RULES = [
  'Перетащите фишку на соседнюю или нажмите на две соседние фишки. Ряд из 3 и больше исчезает. Неудачный обмен не тратит ход.',
  'Выполните все цели до конца ходов. Число у цели — сколько осталось собрать. Цель бустера засчитывается при его активации.',
  'Нажмите на бустер дважды, обменяйте с фишкой или соедините с другим бустером. Радужный шар при обмене собирает цвет соседней фишки.',
  'Матч рядом повреждает ящик. Цветным нужен свой цвет; ↻ меняет цвет каждый ход. Прямые удары бустеров повреждают только деревянные ящики и не обходят условие цвета. Точки — жизни, ✧ — содержимое. Камни неразрушимы.',
  'Клавиатура: стрелки перемещают фокус, Enter выбирает фишку. Подсказка выделяет доступный обмен.',
];

/**
 * Opens gameplay instructions and binds their close buttons.
 * @param {HTMLDialogElement} modal - Dialog to populate.
 * @returns {void} Completes the operation.
 */
export function showHelp(modal) {
  modal.querySelector('#modal-content').innerHTML = `
    <button class="modal-close" aria-label="Закрыть">×</button>
    <div class="eyebrow">КАК ИГРАТЬ</div>
    <h2>Пусть всё расцветает</h2>
    <div class="rules">
      ${RULES.map(
        /**
         * Formats a numbered gameplay instruction.
         * @param {*} rule - Obstacle policy or instruction text.
         * @param {number} index - Row-major cell position.
         * @returns {*} Callback result used by the enclosing operation.
         */ (rule, index) => `<p><b>${index + 1}.</b> ${rule}</p>`,
      ).join('')}
    </div>
    <button class="primary modal-close">Всё понятно, в сад!</button>
  `;
  modal.showModal();
  for (const button of modal.querySelectorAll('.modal-close')) {
    button.onclick = /**
     * Closes the help dialog.
     * @returns {*} Callback result used by the enclosing operation.
     */ () => modal.close();
  }
}

/**
 * Renders the four booster recipes and their descriptions.
 * @param {HTMLElement} container - Container receiving markup.
 * @returns {void} Completes the operation.
 */
export function renderGuide(container) {
  const guide = [
    ['line', 'Четыре в ряд', 'Очищает целую линию'],
    ['bomb', 'Угол или буква Т', 'Взрыв на площади 5 × 5'],
    ['rainbow', 'Пять в ряд', 'Собирает один цвет'],
    ['plane', 'Квадрат 2 × 2', 'Летит к нужной цели'],
  ];
  container.innerHTML = guide
    .map(
      /**
       * Formats one booster recipe and its effect description.
       * @param {*} entry0 - Destructured entry supplied by the enclosing operation.
       * @returns {*} Callback result used by the enclosing operation.
       */ ([type, title, description]) => `
    <div class="guide-item">
      <div class="guide-icon">${icon({ kind: 'booster', type })}</div>
      <div>
        <strong>${boosterNames[type]}</strong>
        <span>${title}</span>
        <small>${description}</small>
      </div>
    </div>
  `,
    )
    .join('');
}
