import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import AudioMotionAnalyzer from 'audiomotion-analyzer';
import { VisualizerMode } from '../../models';
import { AudioEngineService } from '../../../core/services/audio-engine.service';
import { ThemeService } from '../../../core/services/theme.service';

/**
 * Real-time spectrum visualizer powered by audioMotion-analyzer.
 * Taps the audio engine's master output node and reacts to the selected
 * visualizer mode and the active colour theme.
 */
@Component({
  selector: 'app-visualizer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #canvas class="canvas"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .canvas {
        width: 100%;
        height: 100%;
        border-radius: var(--radius);
        overflow: hidden;
      }
    `,
  ],
})
export class VisualizerComponent implements AfterViewInit {
  private readonly engine = inject(AudioEngineService);
  private readonly theme = inject(ThemeService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLDivElement>>('canvas');

  private analyzer: AudioMotionAnalyzer | null = null;

  readonly mode = input<VisualizerMode>('bars');

  constructor() {
    // React to visualizer-mode and theme changes once the analyzer exists.
    effect(() => {
      const mode = this.mode();
      const resolved = this.theme.resolved();
      this.applyMode(mode, resolved);
    });

    this.destroyRef.onDestroy(() => this.analyzer?.destroy());
  }

  ngAfterViewInit(): void {
    const ctx = this.engine.audioContext;
    const source = this.engine.analyserSource;
    if (!ctx || !source) return;

    this.analyzer = new AudioMotionAnalyzer(this.canvasRef().nativeElement, {
      audioCtx: ctx,
      source,
      connectSpeakers: false,
      overlay: true,
      showBgColor: false,
      showScaleX: false,
      showScaleY: false,
      smoothing: 0.75,
      fftSize: 8192,
    });
    this.applyMode(this.mode(), this.theme.resolved());
  }

  private applyMode(mode: VisualizerMode, theme: 'light' | 'dark'): void {
    if (!this.analyzer) return;
    const gradient = theme === 'dark' ? 'prism' : 'rainbow';

    switch (mode) {
      case 'bars':
        this.analyzer.setOptions({ mode: 5, mirror: 0, gradient, lumiBars: false });
        break;
      case 'mirror':
        this.analyzer.setOptions({ mode: 5, mirror: 1, gradient, lumiBars: true });
        break;
      case 'waveform':
        this.analyzer.setOptions({ mode: 10, mirror: 0, gradient, fillAlpha: 0.4 });
        break;
    }
  }
}
