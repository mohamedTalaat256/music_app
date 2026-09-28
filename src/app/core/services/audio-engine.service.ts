import { Injectable, signal } from '@angular/core';
import * as Tone from 'tone';
import {
  BassBoostSettings,
  EqualizerSettings,
  ReverbSettings,
} from '../../shared/models';

/** Centre frequencies for the six-band graphic equalizer. */
const EQ_BANDS = [60, 170, 350, 1000, 3500, 10000] as const;

/**
 * Wraps a single HTMLAudioElement in a Web Audio graph built with Tone.js:
 *
 *   MediaElement → Equalizer(6 bands) → Bass Boost → Reverb → Master Gain → Destination
 *
 * The service owns playback state (exposed as signals) and exposes imperative
 * controls plus live effect setters that update the running graph immediately.
 */
@Injectable({ providedIn: 'root' })
export class AudioEngineService {
  private readonly audio: HTMLAudioElement = new Audio();

  private context: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private eqFilters: Tone.Filter[] = [];
  private bassFilter: Tone.Filter | null = null;
  private reverb: Tone.Reverb | null = null;
  private masterGain: Tone.Gain | null = null;
  private analyserTap: GainNode | null = null;
  private graphReady = false;

  private rafId: number | null = null;
  private volume = 0.8;

  // ---- Reactive playback state ----------------------------------------------
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly isPlaying = signal(false);
  readonly isLoading = signal(false);

  /** Fired when the current track reaches its end (for auto-advance). */
  private endedCallback: (() => void) | null = null;

  constructor() {
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';

    this.audio.addEventListener('loadedmetadata', () => {
      this.duration.set(this.audio.duration || 0);
    });
    this.audio.addEventListener('durationchange', () => {
      this.duration.set(this.audio.duration || 0);
    });
    this.audio.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.startClock();
    });
    this.audio.addEventListener('pause', () => {
      this.isPlaying.set(false);
      this.stopClock();
    });
    this.audio.addEventListener('waiting', () => this.isLoading.set(true));
    this.audio.addEventListener('playing', () => this.isLoading.set(false));
    this.audio.addEventListener('ended', () => {
      this.isPlaying.set(false);
      this.stopClock();
      this.endedCallback?.();
    });

    this.buildGraph();
  }

  onEnded(callback: () => void): void {
    this.endedCallback = callback;
  }

  /** The final native node in the graph — used to feed the visualizer. */
  get analyserSource(): AudioNode | null {
    return this.analyserTap;
  }

  get audioContext(): AudioContext | null {
    return this.context;
  }

  // ---- Graph construction ---------------------------------------------------

  /** Builds the (initially suspended) Web Audio graph. Safe before any gesture. */
  private buildGraph(): void {
    if (this.graphReady) return;
    this.context = Tone.getContext().rawContext as unknown as AudioContext;

    this.sourceNode = this.context.createMediaElementSource(this.audio);

    this.eqFilters = EQ_BANDS.map(
      (freq) =>
        new Tone.Filter({
          type: 'peaking',
          frequency: freq,
          Q: 1,
          gain: 0,
        }),
    );

    this.bassFilter = new Tone.Filter({
      type: 'lowshelf',
      frequency: 200,
      gain: 0,
    });

    this.reverb = new Tone.Reverb({ decay: 1.5, preDelay: 0.01, wet: 0 });

    this.masterGain = new Tone.Gain(this.volume);

    this.analyserTap = this.context.createGain();
    this.analyserTap.gain.value = 1;

    // Wire the chain: source → EQ chain → bass → reverb → master → tap → out.
    Tone.connect(this.sourceNode, this.eqFilters[0]);
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }
    this.eqFilters[this.eqFilters.length - 1].connect(this.bassFilter);
    this.bassFilter.connect(this.reverb);
    this.reverb.connect(this.masterGain);
    Tone.connect(this.masterGain, this.analyserTap);
    this.analyserTap.connect(this.context.destination);

    this.graphReady = true;
  }

  /** Resumes the audio context — must be called from a user gesture. */
  private async ensureStarted(): Promise<void> {
    await Tone.start();
  }

  // ---- Transport controls ---------------------------------------------------

  async loadTrack(url: string, autoplay = true): Promise<void> {
    await this.ensureStarted();
    this.isLoading.set(true);
    this.audio.src = url;
    this.audio.load();
    this.currentTime.set(0);
    if (autoplay) {
      await this.play();
    }
  }

  async play(): Promise<void> {
    await this.ensureStarted();
    try {
      await this.audio.play();
    } catch {
      // Autoplay can be blocked until a user gesture — safe to ignore.
    }
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.currentTime.set(0);
  }

  seek(seconds: number): void {
    if (isFinite(seconds)) {
      this.audio.currentTime = Math.max(0, Math.min(seconds, this.audio.duration || seconds));
      this.currentTime.set(this.audio.currentTime);
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.rampTo(this.volume, 0.05);
    }
  }

  // ---- Live effect setters --------------------------------------------------

  applyEqualizer(eq: EqualizerSettings): void {
    if (!this.eqFilters.length) return;
    const gains = eq.enabled
      ? [eq.band60, eq.band170, eq.band350, eq.band1k, eq.band3_5k, eq.band10k]
      : [0, 0, 0, 0, 0, 0];
    this.eqFilters.forEach((filter, i) => {
      filter.gain.rampTo(gains[i], 0.05);
    });
  }

  applyBassBoost(bass: BassBoostSettings): void {
    if (!this.bassFilter) return;
    const gainDb = bass.enabled ? (bass.amount / 100) * 15 : 0;
    this.bassFilter.gain.rampTo(gainDb, 0.05);
  }

  async applyReverb(reverb: ReverbSettings): Promise<void> {
    if (!this.reverb) return;
    const wet = reverb.enabled ? reverb.wet : 0;
    this.reverb.wet.rampTo(wet, 0.1);
    // Decay/preDelay changes require regenerating the impulse response.
    if (Math.abs((this.reverb.decay as number) - reverb.decay) > 0.01) {
      this.reverb.decay = reverb.decay;
    }
    if (Math.abs((this.reverb.preDelay as number) - reverb.preDelay) > 0.001) {
      this.reverb.preDelay = reverb.preDelay;
    }
  }

  // ---- Position clock -------------------------------------------------------

  private startClock(): void {
    this.stopClock();
    const tick = () => {
      this.currentTime.set(this.audio.currentTime);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopClock(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
