class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.15, slideTo = null) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  gunshot() {
    this.playTone(220, 'sawtooth', 0.09, 0.22, 45);
  }

  cqcHit() {
    this.playTone(130, 'triangle', 0.14, 0.28, 35);
  }

  flareLaunch() {
    this.playTone(680, 'sine', 0.35, 0.16, 180);
  }

  sirenPulse(high = true) {
    this.playTone(high ? 780 : 620, 'sine', 0.18, 0.05);
  }

  speakRadio(text, langCode = 'es-ES') {
    if (this.muted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = 1.05;
    utter.pitch = 0.95;
    window.speechSynthesis.speak(utter);
  }
}

export const sfx = new SoundEngine();
