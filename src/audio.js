const NOTES = {
  hit: [170, 0.055, 'square'], crit: [310, 0.10, 'sawtooth'], swing: [110, 0.045, 'triangle'], shoot: [280, 0.07, 'square'],
  skill: [440, 0.18, 'sawtooth'], pickup: [620, 0.10, 'sine'], coin: [850, 0.07, 'square'], chest: [390, 0.28, 'triangle'],
  level: [760, 0.25, 'sine'], buy: [520, 0.12, 'triangle'], hurt: [95, 0.15, 'sawtooth'], enemyDown: [145, 0.09, 'square'],
  boss: [70, 0.38, 'sawtooth'], clear: [580, 0.22, 'triangle'], menu: [480, 0.06, 'square'], portal: [360, 0.35, 'sine'],
};

export class Sound {
  constructor(settings = {}) {
    this.master = settings.master ?? 0.6;
    this.sfx = settings.sfx ?? 0.72;
    this.music = settings.music ?? 0.35;
    this.context = null;
    this.last = new Map();
    this.musicTimer = null;
    this.musicStep = 0;
    this.track = 'menu';
  }
  unlock() {
    if (!this.context) {
      const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (AudioCtx) this.context = new AudioCtx();
    }
    if (this.context?.state === 'suspended') this.context.resume().catch(() => {});
  }
  setVolumes(settings) {
    this.master = settings.master ?? this.master;
    this.sfx = settings.sfx ?? this.sfx;
    this.music = settings.music ?? this.music;
  }
  play(name, intensity = 1) {
    const now = performance.now();
    if (now - (this.last.get(name) || 0) < (name === 'hit' ? 55 : 22)) return;
    this.last.set(name, now);
    this.unlock();
    if (!this.context || this.master * this.sfx <= 0.002) return;
    const [freq, duration, wave] = NOTES[name] || NOTES.menu;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const start = this.context.currentTime;
    const vol = Math.min(0.17, 0.065 * this.master * this.sfx * intensity);
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(35, freq * (name === 'hurt' ? 0.68 : 1.48)), start + duration);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.015);
  }
  setTrack(name) {
    if (this.track === name && this.musicTimer) return;
    this.track = name;
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicStep = 0;
    const patterns = {
      menu: [196, 247, 294, 247, 165, 220, 262, 220],
      dungeon: [147, 196, 220, 175, 131, 175, 208, 165],
      boss: [110, 131, 165, 123, 98, 147, 185, 123],
      hub: [220, 262, 330, 294, 196, 247, 294, 262],
    };
    this.musicTimer = setInterval(() => {
      if (!this.context || this.music * this.master <= 0.002) return;
      const pattern = patterns[this.track] || patterns.dungeon;
      const freq = pattern[this.musicStep++ % pattern.length];
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const start = this.context.currentTime;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.018 * this.master * this.music, start + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.42);
      osc.connect(gain).connect(this.context.destination);
      osc.start(start);
      osc.stop(start + 0.44);
    }, this.track === 'boss' ? 340 : 500);
  }
  stop() { if (this.musicTimer) clearInterval(this.musicTimer); this.musicTimer = null; }
}
