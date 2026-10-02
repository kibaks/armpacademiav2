// ============================================================================
// SOFT AMBIENT BACKGROUND MUSIC ENGINE (Web Audio API Procedural Synthesizer)
// Generates a warm, soothing acoustic piano & gentle ambient pad melody
// designed specifically to accompany pedagogical voice explanations softly.
// ============================================================================

class AmbientMusicService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying = false;
  private isEnabled = true;
  private volume = 0.075; // Soft, unobtrusive background level under voice
  private schedulerTimer: number | null = null;
  private stepIndex = 0;
  private listeners: Set<(state: { enabled: boolean; playing: boolean; volume: number }) => void> =
    new Set();

  // Warm, soothing chord progression in C Major / Lydian (frequencies in Hz)
  // Each chord has [Root bass, Warm pad 3rd/7th, Gentle arpeggio notes...]
  private readonly chords: number[][] = [
    // Cmaj9 (Peaceful, inspiring opening)
    [130.81, 261.63, 329.63, 392.0, 493.88, 587.33],
    // Am11 (Warm, reflective pedagogical flow)
    [110.0, 220.0, 261.63, 329.63, 392.0, 440.0],
    // Fmaj9(#11) (Uplifting clarity)
    [174.61, 261.63, 349.23, 440.0, 523.25, 659.25],
    // G6add9 (Gentle resolution)
    [196.0, 246.94, 293.66, 392.0, 440.0, 587.33]
  ];

  // Melodic arpeggio pattern indices into the active chord
  private readonly arpPattern = [1, 2, 3, 5, 4, 2, 3, 4];

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playWarmPad(chord: number[], durationSec: number) {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master || !this.isEnabled) return;

    const now = ctx.currentTime;
    // Play root + 3rd + 7th as a warm low-pass filtered ambient pad
    const padNotes = [chord[0], chord[1], chord[2]];
    padNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const noteGain = ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, now);

      const peakGain = idx === 0 ? 0.22 : 0.12;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(peakGain, now + 1.1);
      noteGain.gain.setValueAtTime(peakGain, now + Math.max(1.2, durationSec - 1.2));
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(master);

      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    });
  }

  private playSoftPianoNote(freq: number, durationSec: number) {
    const ctx = this.ctx;
    const master = this.masterGain;
    if (!ctx || !master || !this.isEnabled) return;

    const now = ctx.currentTime;

    // Fundamental + soft 2nd harmonic for a warm Rhodes / felt-piano timbre
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const env = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.06, now);
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(420, now + durationSec);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.26, now + 0.045);
    env.gain.exponentialRampToValueAtTime(0.0008, now + durationSec);

    osc1.connect(filter);
    osc2.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(env);
    env.connect(master);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
  }

  public start() {
    this.isPlaying = true;
    this.notify();
    if (!this.isEnabled) return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const now = ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(Math.max(0.001, this.masterGain.gain.value), now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.6);

    if (this.schedulerTimer !== null) return;

    const triggerStep = () => {
      if (!this.isPlaying || !this.isEnabled) return;
      const chordIdx = Math.floor(this.stepIndex / 8) % this.chords.length;
      const stepInBar = this.stepIndex % 8;
      const chord = this.chords[chordIdx];

      // Trigger warm pad at the start of every 8-step bar (~5.6s)
      if (stepInBar === 0) {
        this.playWarmPad(chord, 5.5);
      }

      // Trigger gentle felt-piano arpeggio note
      const noteIdx = this.arpPattern[stepInBar % this.arpPattern.length];
      const noteFreq = chord[noteIdx] || chord[1];
      this.playSoftPianoNote(noteFreq, 1.45);

      this.stepIndex++;
    };

    triggerStep();
    this.schedulerTimer = window.setInterval(triggerStep, 700);
  }

  public stop() {
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
    }
    this.notify();
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      if (this.schedulerTimer !== null) {
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      }
    } else if (this.isPlaying) {
      this.start();
    }
    this.notify();
  }

  public toggleEnabled(): boolean {
    this.setEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0.01, Math.min(0.25, vol));
    if (this.ctx && this.masterGain && this.isPlaying && this.isEnabled) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.volume, now, 0.15);
    }
    this.notify();
  }

  public getState() {
    return {
      enabled: this.isEnabled,
      playing: this.isPlaying,
      volume: this.volume
    };
  }

  public subscribe(fn: (state: { enabled: boolean; playing: boolean; volume: number }) => void) {
    this.listeners.add(fn);
    fn(this.getState());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const st = this.getState();
    this.listeners.forEach((fn) => fn(st));
  }
}

export const ambientMusicService = new AmbientMusicService();
