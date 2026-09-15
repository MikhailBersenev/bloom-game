/** Дополнительный звук. Браузеры без Web Audio всё равно запускают игру штатно. */
export class GameAudio {
  muted = true;
  context = null;

  /**
   * Описание операции или проверяемого поведения.
   * @returns Результат выполнения операции.
   */
  toggle() {
    this.muted = !this.muted;
    this.play();
    return !this.muted;
  }

  /**
   * Описание операции или проверяемого поведения.
   * @param {number} [frequency] - Параметр операции.
   * @returns Результат выполнения операции.
   */
  play(frequency = 440) {
    if (this.muted) return;
    try {
      this.context ??= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      const now = this.context.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      oscillator.start();
      oscillator.stop(now + 0.18);
    } catch {
      // Описание совместимости и назначения модуля.
    }
  }
}
