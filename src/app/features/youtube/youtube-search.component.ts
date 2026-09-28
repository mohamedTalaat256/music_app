import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  YoutubeService,
  YoutubeVideo,
} from '../../core/services/youtube.service';

/** Search YouTube for songs and browse the results. */
@Component({
  selector: 'app-youtube-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatMenuModule, MatTooltipModule],
  template: `
    <section class="page">
      <form class="search glass" (submit)="onSubmit($event)">
        <mat-icon>search</mat-icon>
        <input
          type="search"
          placeholder="Search songs on YouTube…"
          [value]="query()"
          (input)="onInput($event)"
          autofocus
          aria-label="Search YouTube"
        />
        @if (query()) {
          <button
            class="clear"
            type="button"
            (click)="clear()"
            aria-label="Clear search"
          >
            <mat-icon>close</mat-icon>
          </button>
        }
        <button class="submit" type="submit" [disabled]="loading()">
          Search
        </button>
      </form>

      @if (error()) {
        <p class="error glass">
          <mat-icon>error_outline</mat-icon>{{ error() }}
        </p>
      }

      @if (loading()) {
        <p class="muted">Searching…</p>
      } @else if (searched()) {
        <p class="muted">
          {{ videos().length }}
          {{ videos().length === 1 ? 'result' : 'results' }}
        </p>
      }

      <div class="list glass">
        @if (!loading() && videos().length === 0) {
          <div class="empty">
            <mat-icon>music_video</mat-icon>
            <p>
              {{
                searched()
                  ? 'No videos found.'
                  : 'Search YouTube to see songs here.'
              }}
            </p>
          </div>
        } @else {
          @for (video of videos(); track video.videoId) {
            <div class="row">
              <a
                class="art"
                [href]="video.videoUrl"
                target="_blank"
                rel="noopener"
                [attr.aria-label]="'Open ' + video.title + ' on YouTube'"
              >
                <img [src]="video.thumbnailUrl" [alt]="video.title" />
                <span class="play-overlay">
                  <mat-icon>play_arrow</mat-icon>
                </span>
                <span class="badge">{{ video.duration }}</span>
              </a>

              <div class="meta">
                <span class="title" [title]="video.title">
                  {{ video.title }}
                </span>
                <span class="sub">
                  {{ video.channelTitle }} · {{ video.views }} views ·
                  {{ video.publishedAt }}
                </span>
              </div>

              <button
                class="icon-btn"
                type="button"
                [matMenuTriggerFor]="menu"
                [disabled]="downloadingId() === video.videoId"
                matTooltip="More"
                aria-label="Video actions"
              >
                <mat-icon>{{
                  downloadingId() === video.videoId
                    ? 'hourglass_top'
                    : 'more_vert'
                }}</mat-icon>
              </button>

              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="copyUrl(video)">
                  <mat-icon>link</mat-icon><span>Copy URL</span>
                </button>
                <button
                  mat-menu-item
                  [disabled]="downloadingId() !== null"
                  (click)="downloadMp3(video)"
                >
                  <mat-icon>download</mat-icon><span>Download as MP3</span>
                </button>
              </mat-menu>
            </div>
          }
        }
      </div>
    </section>
  `,
  styleUrl: './youtube-search.component.scss',
})
export class YoutubeSearchComponent {
  private readonly youtube = inject(YoutubeService);

  protected readonly query = signal('');
  protected readonly videos = signal<YoutubeVideo[]>([]);
  protected readonly loading = signal(false);
  protected readonly searched = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly downloadingId = signal<string | null>(null);

  onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const term = this.query().trim();
    if (!term) return;

    this.loading.set(true);
    this.error.set(null);
    this.youtube.searchVideos(term).subscribe({
      next: (result) => {
        this.videos.set(result.videos);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.videos.set([]);
        this.error.set(err.message);
        this.searched.set(true);
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.query.set('');
    this.videos.set([]);
    this.searched.set(false);
    this.error.set(null);
  }

  copyUrl(video: YoutubeVideo): void {
    void navigator.clipboard?.writeText(video.videoUrl);
  }

  async downloadMp3(video: YoutubeVideo): Promise<void> {
    if (this.downloadingId()) return;

    const params = new URLSearchParams({
      videoId: video.videoId,
      title: video.title,
    });

    this.error.set(null);
    this.downloadingId.set(video.videoId);
    try {
      // Same-origin request proxied to the local MP3 helper.
      const res = await fetch(`/api/download?${params.toString()}`);

      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !type.includes('audio')) {
        const detail = (await res.text().catch(() => '')).slice(0, 200);
        throw new Error(
          detail ||
            'MP3 helper not reachable. Stop any bare "ng serve" and run ' +
              '"npm start" so the downloader is running and /api is proxied.',
        );
      }

      const blob = await res.blob();
      if (blob.size < 1024) {
        throw new Error(
          'The download returned no audio. Check the yt-dlp output in the ' +
            'terminal (the video may be unavailable or age-restricted).',
        );
      }

      const objectUrl = URL.createObjectURL(blob);
      const safeName =
        video.title.replace(/[\\/:*?"<>|]+/g, '_').trim().slice(0, 120) ||
        video.videoId;
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${safeName}.mp3`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      this.error.set((err as Error).message);
    } finally {
      this.downloadingId.set(null);
    }
  }
}
