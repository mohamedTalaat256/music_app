import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { RepeatMode } from '../../shared/models';
import { DurationPipe } from '../../shared/pipes/duration.pipe';
import { AudioEngineService } from '../../core/services/audio-engine.service';
import { PlayerActions } from '../../core/store/player/player.actions';
import {
  selectCurrentSong,
  selectRepeatMode,
  selectShuffle,
} from '../../core/store/player/player.feature';
import { SettingsActions } from '../../core/store/settings/settings.actions';
import { selectVolume } from '../../core/store/settings/settings.feature';

/** Persistent transport bar shown across the whole application. */
@Component({
  selector: 'app-player-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule, DurationPipe],
  template: `
    <div class="bar glass">
      <!-- Now playing -->
      <div class="now">
        @if (song(); as s) {
          <div class="art">
            @if (s.artwork) {
              <img [src]="s.artwork" [alt]="s.album" />
            } @else {
              <mat-icon>music_note</mat-icon>
            }
          </div>
          <div class="meta">
            <span class="title" [title]="s.title">{{ s.title }}</span>
            <span class="artist">{{ s.artist }}</span>
          </div>
        } @else {
          <div class="art"><mat-icon>music_note</mat-icon></div>
          <div class="meta">
            <span class="title">Nothing playing</span>
            <span class="artist">Pick a track from your library</span>
          </div>
        }
      </div>

      <!-- Controls + seek -->
      <div class="center">
        <div class="controls">
          <button
            class="ctrl"
            [class.on]="shuffle()"
            (click)="toggleShuffle()"
            matTooltip="Shuffle"
            aria-label="Toggle shuffle"
          >
            <mat-icon>shuffle</mat-icon>
          </button>
          <button
            class="ctrl"
            (click)="previous()"
            matTooltip="Previous"
            aria-label="Previous track"
          >
            <mat-icon>skip_previous</mat-icon>
          </button>
          <button
            class="ctrl play"
            (click)="togglePlay()"
            [attr.aria-label]="isPlaying() ? 'Pause' : 'Play'"
          >
            <mat-icon>{{ isPlaying() ? 'pause' : 'play_arrow' }}</mat-icon>
          </button>
          <button
            class="ctrl"
            (click)="next()"
            matTooltip="Next"
            aria-label="Next track"
          >
            <mat-icon>skip_next</mat-icon>
          </button>
          <button
            class="ctrl"
            [class.on]="repeat() !== RepeatMode.Off"
            (click)="cycleRepeat()"
            [matTooltip]="repeatLabel()"
            aria-label="Cycle repeat mode"
          >
            <mat-icon>{{
              repeat() === RepeatMode.One ? 'repeat_one' : 'repeat'
            }}</mat-icon>
          </button>
        </div>

        <div class="seek">
          <span class="t">{{ currentTime() | duration }}</span>
          <input
            type="range"
            min="0"
            [max]="duration() || 0"
            step="0.1"
            [value]="currentTime()"
            (input)="onSeek($event)"
            aria-label="Seek"
          />
          <span class="t">{{ remaining() | duration }}</span>
        </div>
      </div>

      <!-- Volume -->
      <div class="volume">
        <mat-icon>{{ volumeIcon() }}</mat-icon>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          [value]="volume()"
          (input)="onVolume($event)"
          aria-label="Volume"
        />
      </div>
    </div>
  `,
  styleUrl: './player-bar.component.scss',
})
export class PlayerBarComponent {
  private readonly store = inject(Store);
  private readonly engine = inject(AudioEngineService);

  protected readonly RepeatMode = RepeatMode;

  readonly song = this.store.selectSignal(selectCurrentSong);
  readonly shuffle = this.store.selectSignal(selectShuffle);
  readonly repeat = this.store.selectSignal(selectRepeatMode);
  readonly volume = this.store.selectSignal(selectVolume);

  readonly currentTime = this.engine.currentTime;
  readonly duration = this.engine.duration;
  readonly isPlaying = this.engine.isPlaying;

  readonly remaining = computed(() =>
    Math.max(0, this.duration() - this.currentTime()),
  );

  readonly repeatLabel = computed(() => {
    switch (this.repeat()) {
      case RepeatMode.One:
        return 'Repeat one';
      case RepeatMode.All:
        return 'Repeat all';
      default:
        return 'Repeat off';
    }
  });

  readonly volumeIcon = computed(() => {
    const v = this.volume();
    if (v === 0) return 'volume_off';
    if (v < 0.5) return 'volume_down';
    return 'volume_up';
  });

  togglePlay(): void {
    this.store.dispatch(PlayerActions.togglePlay());
  }
  next(): void {
    this.store.dispatch(PlayerActions.next({ auto: false }));
  }
  previous(): void {
    this.store.dispatch(PlayerActions.previous());
  }
  toggleShuffle(): void {
    this.store.dispatch(PlayerActions.toggleShuffle());
  }
  cycleRepeat(): void {
    this.store.dispatch(PlayerActions.cycleRepeat());
  }

  onSeek(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.engine.seek(value);
  }

  onVolume(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.store.dispatch(SettingsActions.setVolume({ volume: value }));
  }
}
