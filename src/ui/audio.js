/** Optional sound. Browsers without Web Audio still run the game normally. */
export class GameAudio {
  muted = true;
  context = null;

  /**
   * Toggles muted state and plays feedback when enabling sound.
   * @returns {boolean} Result of the described operation.
   */
  toggle() {
    this.muted = !this.muted;
    this.play();
    return !this.muted;
  }

  /**
   * Plays the requested presentation with the configured view or optional audio device.
   * @param {number} [frequency] - Tone frequency in hertz.
   * @returns {void} Completes the operation.
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
      // Audio permissions or device availability must not interrupt a turn.
    }
  }
}
