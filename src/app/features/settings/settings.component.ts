import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Store } from '@ngrx/store';
import {
  BassBoostSettings,
  EqualizerSettings,
  REVERB_PRESETS,
  ReverbPreset,
  ReverbSettings,
  ThemeMode,
  VisualizerMode,
} from '../../shared/models';
import { SettingsActions } from '../../core/store/settings/settings.actions';
import {
  selectEffects,
  selectTheme,
  selectVisualizerMode,
} from '../../core/store/settings/settings.feature';

interface EqBand {
  key: keyof Omit<EqualizerSettings, 'enabled'>;
  label: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule],
  template: `
    <section class="page">
      <h1>Settings</h1>

      <!-- Appearance -->
      <div class="card glass">
        <h2><mat-icon>palette</mat-icon> Appearance</h2>
        <div class="row">
          <span class="label">Theme</span>
          <div class="seg">
            @for (t of themes; track t.value) {
              <button
                [class.on]="theme() === t.value"
                (click)="setTheme(t.value)"
              >
                <mat-icon>{{ t.icon }}</mat-icon>{{ t.label }}
              </button>
            }
          </div>
        </div>
        <div class="row">
          <span class="label">Visualizer</span>
          <div class="seg">
            @for (m of visualizers; track m.value) {
              <button
                [class.on]="visualizer() === m.value"
                (click)="setVisualizer(m.value)"
              >
                {{ m.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Equalizer -->
      <div class="card glass">
        <div class="card-head">
          <h2><mat-icon>graphic_eq</mat-icon> Equalizer</h2>
          <mat-slide-toggle
            [checked]="eq().enabled"
            (change)="toggleEq($event.checked)"
          >
            {{ eq().enabled ? 'On' : 'Off' }}
          </mat-slide-toggle>
        </div>
        <div class="eq" [class.disabled]="!eq().enabled">
          @for (band of eqBands; track band.key) {
            <div class="eq-band">
              <span class="db">{{ eqValue(band.key) }} dB</span>
              <input
                type="range"
                class="vertical"
                min="-12"
                max="12"
                step="1"
                [value]="eqValue(band.key)"
                (input)="onEqChange(band.key, $event)"
                [disabled]="!eq().enabled"
                [attr.aria-label]="band.label + ' gain'"
              />
              <span class="freq">{{ band.label }}</span>
            </div>
          }
        </div>
        <button mat-stroked-button (click)="resetEq()">Reset</button>
      </div>

      <!-- Reverb -->
      <div class="card glass">
        <div class="card-head">
          <h2><mat-icon>surround_sound</mat-icon> Reverb</h2>
          <mat-slide-toggle
            [checked]="reverb().enabled"
            (change)="toggleReverb($event.checked)"
          >
            {{ reverb().enabled ? 'On' : 'Off' }}
          </mat-slide-toggle>
        </div>

        <div class="row">
          <span class="label">Preset</span>
          <div class="seg wrap">
            @for (p of reverbPresets; track p.value) {
              <button
                [class.on]="reverb().preset === p.value"
                (click)="setReverbPreset(p.value)"
                [disabled]="!reverb().enabled"
              >
                {{ p.label }}
              </button>
            }
          </div>
        </div>

        <div class="sliders" [class.disabled]="!reverb().enabled">
          <label>
            <span>Wet / Dry <b>{{ (reverb().wet * 100).toFixed(0) }}%</b></span>
            <input
              type="range" min="0" max="1" step="0.01"
              [value]="reverb().wet" [disabled]="!reverb().enabled"
              (input)="onReverbChange('wet', $event, 1)"
            />
          </label>
          <label>
            <span>Decay <b>{{ reverb().decay.toFixed(1) }}s</b></span>
            <input
              type="range" min="0.1" max="8" step="0.1"
              [value]="reverb().decay" [disabled]="!reverb().enabled"
              (input)="onReverbChange('decay', $event, 1)"
            />
          </label>
          <label>
            <span>Pre-delay <b>{{ (reverb().preDelay * 1000).toFixed(0) }}ms</b></span>
            <input
              type="range" min="0" max="0.1" step="0.001"
              [value]="reverb().preDelay" [disabled]="!reverb().enabled"
              (input)="onReverbChange('preDelay', $event, 1)"
            />
          </label>
          <label>
            <span>Room size <b>{{ (reverb().roomSize * 100).toFixed(0) }}%</b></span>
            <input
              type="range" min="0" max="1" step="0.01"
              [value]="reverb().roomSize" [disabled]="!reverb().enabled"
              (input)="onReverbChange('roomSize', $event, 1)"
            />
          </label>
        </div>
      </div>

      <!-- Bass boost -->
      <div class="card glass">
        <div class="card-head">
          <h2><mat-icon>speaker</mat-icon> Bass Boost</h2>
          <mat-slide-toggle
            [checked]="bass().enabled"
            (change)="toggleBass($event.checked)"
          >
            {{ bass().enabled ? 'On' : 'Off' }}
          </mat-slide-toggle>
        </div>
        <div class="row">
          <span class="label">Amount</span>
          <div class="seg">
            @for (amount of bassAmounts; track amount) {
              <button
                [class.on]="bass().amount === amount"
                (click)="setBassAmount(amount)"
                [disabled]="!bass().enabled"
              >
                {{ amount }}%
              </button>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly store = inject(Store);

  readonly theme = this.store.selectSignal(selectTheme);
  readonly visualizer = this.store.selectSignal(selectVisualizerMode);
  private readonly effects = this.store.selectSignal(selectEffects);

  readonly eq = computed(() => this.effects().equalizer);
  readonly reverb = computed(() => this.effects().reverb);
  readonly bass = computed(() => this.effects().bassBoost);

  protected readonly themes: { value: ThemeMode; label: string; icon: string }[] =
    [
      { value: 'light', label: 'Light', icon: 'light_mode' },
      { value: 'dark', label: 'Dark', icon: 'dark_mode' },
      { value: 'system', label: 'System', icon: 'contrast' },
    ];

  protected readonly visualizers: { value: VisualizerMode; label: string }[] = [
    { value: 'bars', label: 'Bars' },
    { value: 'mirror', label: 'Mirror' },
    { value: 'waveform', label: 'Waveform' },
  ];

  protected readonly reverbPresets: { value: ReverbPreset; label: string }[] = [
    { value: 'small-room', label: 'Small Room' },
    { value: 'medium-room', label: 'Medium Room' },
    { value: 'large-hall', label: 'Large Hall' },
    { value: 'cathedral', label: 'Cathedral' },
    { value: 'studio', label: 'Studio' },
  ];

  protected readonly eqBands: EqBand[] = [
    { key: 'band60', label: '60Hz' },
    { key: 'band170', label: '170Hz' },
    { key: 'band350', label: '350Hz' },
    { key: 'band1k', label: '1kHz' },
    { key: 'band3_5k', label: '3.5kHz' },
    { key: 'band10k', label: '10kHz' },
  ];

  protected readonly bassAmounts: BassBoostSettings['amount'][] = [
    0, 25, 50, 75, 100,
  ];

  // ---- Appearance -----------------------------------------------------------
  setTheme(theme: ThemeMode): void {
    this.store.dispatch(SettingsActions.setTheme({ theme }));
  }
  setVisualizer(mode: VisualizerMode): void {
    this.store.dispatch(SettingsActions.setVisualizerMode({ mode }));
  }

  // ---- Equalizer ------------------------------------------------------------
  eqValue(key: EqBand['key']): number {
    return this.eq()[key];
  }
  toggleEq(enabled: boolean): void {
    this.store.dispatch(
      SettingsActions.updateEqualizer({ equalizer: { ...this.eq(), enabled } }),
    );
  }
  onEqChange(key: EqBand['key'], event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.store.dispatch(
      SettingsActions.updateEqualizer({
        equalizer: { ...this.eq(), [key]: value },
      }),
    );
  }
  resetEq(): void {
    this.store.dispatch(
      SettingsActions.updateEqualizer({
        equalizer: {
          enabled: this.eq().enabled,
          band60: 0,
          band170: 0,
          band350: 0,
          band1k: 0,
          band3_5k: 0,
          band10k: 0,
        },
      }),
    );
  }

  // ---- Reverb ---------------------------------------------------------------
  toggleReverb(enabled: boolean): void {
    this.store.dispatch(
      SettingsActions.updateReverb({ reverb: { ...this.reverb(), enabled } }),
    );
  }
  setReverbPreset(preset: ReverbPreset): void {
    const values = REVERB_PRESETS[preset];
    this.store.dispatch(
      SettingsActions.updateReverb({
        reverb: { ...this.reverb(), preset, ...values },
      }),
    );
  }
  onReverbChange(
    key: keyof Pick<ReverbSettings, 'wet' | 'decay' | 'preDelay' | 'roomSize'>,
    event: Event,
    _scale: number,
  ): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.store.dispatch(
      SettingsActions.updateReverb({
        reverb: { ...this.reverb(), [key]: value },
      }),
    );
  }

  // ---- Bass boost -----------------------------------------------------------
  toggleBass(enabled: boolean): void {
    this.store.dispatch(
      SettingsActions.updateBassBoost({ bassBoost: { ...this.bass(), enabled } }),
    );
  }
  setBassAmount(amount: BassBoostSettings['amount']): void {
    this.store.dispatch(
      SettingsActions.updateBassBoost({
        bassBoost: { ...this.bass(), amount },
      }),
    );
  }
}
