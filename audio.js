// ─── 8-BIT AUDIO ENGINE ────────────────────────────────────────────────────
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicNodes = [];
    this.musicPlaying = false;
    this.musicLoop = null;
    this.tempo = 120; // BPM
    this._tick = 0;
    this._scheduleAhead = 0.12;
    this._nextBeatTime = 0;
  }

  _ensure() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  // Low-level square-wave beep
  _beep(freq, duration, vol = 0.15, when = 0, type = 'square') {
    if (this.muted || !this.ctx) return;
    const t = when || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.01);
  }

  // ── SFX ──────────────────────────────────────────────────────────────────
  sfxMove() {
    this._ensure();
    this._beep(220, 0.04, 0.06);
  }

  sfxRotate() {
    this._ensure();
    this._beep(330, 0.06, 0.08);
  }

  sfxDrop() {
    this._ensure();
    this._beep(150, 0.08, 0.12);
    this._beep(100, 0.05, 0.08, this.ctx.currentTime + 0.06);
  }

  sfxHold() {
    this._ensure();
    this._beep(440, 0.05, 0.1);
    this._beep(660, 0.05, 0.1, this.ctx.currentTime + 0.06);
  }

  sfxLineClear(count) {
    this._ensure();
    const t = this.ctx.currentTime;
    const freqs = [523, 659, 784, 1047];
    const vols  = [0.1, 0.12, 0.14, 0.2];
    for (let i = 0; i < count; i++) {
      this._beep(freqs[i] || 1047, 0.12, vols[count - 1], t + i * 0.06);
    }
    if (count === 4) {
      // Tetris! fanfare
      [523,659,784,1047,1319].forEach((f, i) => {
        this._beep(f, 0.1, 0.18, t + i * 0.07);
      });
    }
  }

  sfxGameOver() {
    this._ensure();
    const t = this.ctx.currentTime;
    [440,330,220,110].forEach((f, i) => {
      this._beep(f, 0.15, 0.15, t + i * 0.12, 'sawtooth');
    });
  }

  sfxLevelUp() {
    this._ensure();
    const t = this.ctx.currentTime;
    [523,659,784,1047].forEach((f, i) => {
      this._beep(f, 0.08, 0.15, t + i * 0.06);
    });
  }

  // ── BACKGROUND MUSIC (Korobeiniki / Tetris Theme A) ──────────────────────
  // Melody in ABC notation → [freq, beats]
  _theme() {
    // Tetris Theme A melody (Korobeiniki) - simplified 8-bit version
    const N = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
    const E4=N(64),D4=N(62),C4=N(60),B3=N(59),A3=N(57),G3=N(55),F3=N(53),
          E3=N(52),D3=N(50),C3=N(48),B4=N(71),A4=N(69),G4=N(67),F4=N(65);

    // [freq, beats] — 0 freq = rest
    return [
      [E4,1],[B3,.5],[C4,.5],[D4,1],[C4,.5],[B3,.5],
      [A3,1],[A3,.5],[C4,.5],[E4,1],[D4,.5],[C4,.5],
      [B3,1.5],[C4,.5],[D4,1],[E4,1],
      [C4,1],[A3,1],[A3,2],

      [0,.5],[D4,1.5],[F4,.5],[A4,1],[G4,.5],[F4,.5],
      [E4,1.5],[C4,.5],[E4,1],[D4,.5],[C4,.5],
      [B3,1],[B3,.5],[C4,.5],[D4,1],[E4,1],
      [C4,1],[A3,1],[A3,2],

      // bass walk (repeat section)
      [E4,1],[B3,.5],[C4,.5],[D4,1],[C4,.5],[B3,.5],
      [A3,1],[A3,.5],[C4,.5],[E4,1],[D4,.5],[C4,.5],
      [B3,1.5],[C4,.5],[D4,1],[E4,1],
      [C4,1],[A3,1],[A3,2],

      [0,.5],[D4,1.5],[F4,.5],[A4,1],[G4,.5],[F4,.5],
      [E4,1.5],[C4,.5],[E4,1],[D4,.5],[C4,.5],
      [B3,1],[B3,.5],[C4,.5],[D4,1],[E4,1],
      [C4,1],[A3,1],[A3,2],
    ];
  }

  startMusic() {
    if (this.musicPlaying) return;
    this._ensure();
    this.musicPlaying = true;
    this._playThemeLoop();
  }

  _playThemeLoop() {
    if (!this.musicPlaying || this.muted) return;

    const notes = this._theme();
    const bps = this.tempo / 60; // beats per second
    let t = this.ctx.currentTime + 0.05;

    notes.forEach(([freq, beats]) => {
      const dur = beats / bps;
      if (freq > 0) {
        this._scheduleMusicNote(freq, t, dur * 0.88);
      }
      t += dur;
    });

    // Schedule next loop
    const totalDur = notes.reduce((sum, [,b]) => sum + b, 0) / bps;
    this.musicLoop = setTimeout(() => this._playThemeLoop(), (totalDur - 0.1) * 1000);
  }

  _scheduleMusicNote(freq, when, dur) {
    if (!this.ctx || this.muted) return;
    const osc  = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, when);
    gain.gain.setValueAtTime(0.07, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.01);
    this.musicNodes.push(osc);
  }

  stopMusic() {
    this.musicPlaying = false;
    clearTimeout(this.musicLoop);
    this.musicNodes.forEach(n => { try { n.stop(); } catch(e) {} });
    this.musicNodes = [];
  }

  setTempo(bpm) {
    if (this.tempo === bpm) return;
    this.tempo = bpm;
    if (this.musicPlaying) {
      this.stopMusic();
      this.musicPlaying = true;
      this._playThemeLoop();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      this.musicPlaying = true;
      this._ensure();
      this._playThemeLoop();
    }
    return this.muted;
  }
}

const audio = new AudioEngine();
