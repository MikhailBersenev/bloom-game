/** Дополнительный звук. Браузеры без Web Audio всё равно запускают игру штатно. */
export class GameAudio {
  muted = true;
  context = null;

  /**
   * @returns {boolean}
   */
  toggle() {
    this.muted = !this.muted;
    this.play();
    return !this.muted;
  }

  /**
   * @param {number} [frequency]
   * @returns {void}
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
      // Запрет звука или отсутствие аудиоустройства не должны прерывать игровой ход.
    }
  }
}
