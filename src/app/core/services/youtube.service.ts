import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

/** A single YouTube video result, shaped for the search UI. */
export interface YoutubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
  views: string;
  publishedAt: string;
}

export interface YoutubeSearchResult {
  videos: YoutubeVideo[];
  nextPageToken: string | null;
}

interface SearchApiResponse {
  items: {
    id: { videoId: string };
    snippet: {
      title: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: { medium: { url: string } };
    };
  }[];
  nextPageToken?: string;
}

interface DetailsApiResponse {
  items: {
    id: string;
    contentDetails: { duration: string };
    statistics: { viewCount?: string };
  }[];
}

const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos';
const MAX_RESULTS = 10;

/**
 * Thin client for the YouTube Data API v3.
 *
 * NOTE: the API key is embedded in the browser bundle and is therefore public.
 * Restrict it (HTTP referrers + YouTube Data API only) in the Google Cloud
 * console, or proxy these calls through your own backend for production.
 */
@Injectable({ providedIn: 'root' })
export class YoutubeService {
  private readonly http = inject(HttpClient);
  private readonly apiKey = 'AIzaSyBnukYYzHc1HsIq5JI8jyxioU8h8ehc5zc';

  searchVideos(
    query: string,
    pageToken: string | null = null,
  ): Observable<YoutubeSearchResult> {
    if (!this.apiKey) {
      return throwError(() => new Error('youtube_api_key_missing'));
    }

    const searchParams: Record<string, string> = {
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(MAX_RESULTS),
      key: this.apiKey,
    };
    if (pageToken) {
      searchParams['pageToken'] = pageToken;
    }

    return this.http
      .get<SearchApiResponse>(SEARCH_URL, { params: searchParams })
      .pipe(
        switchMap((search) => {
          const ids = search.items.map((i) => i.id.videoId);
          if (ids.length === 0) {
            return of({ videos: [], nextPageToken: null });
          }

          const details$ = this.http.get<DetailsApiResponse>(VIDEOS_URL, {
            params: {
              part: 'contentDetails,statistics',
              id: ids.join(','),
              key: this.apiKey,
            },
          });

          return forkJoin({ search: of(search), details: details$ }).pipe(
            map(({ search, details }) => this.merge(search, details)),
          );
        }),
        catchError((err: HttpErrorResponse) =>
          throwError(
            () =>
              new Error(
                err.error?.error?.message ??
                  err.message ??
                  'youtube_request_failed',
              ),
          ),
        ),
      );
  }

  private merge(
    search: SearchApiResponse,
    details: DetailsApiResponse,
  ): YoutubeSearchResult {
    const extra = new Map<string, { duration: string; views: string }>();
    for (const item of details.items) {
      extra.set(item.id, {
        duration: this.formatDuration(item.contentDetails.duration),
        views: this.formatViews(Number(item.statistics.viewCount ?? 0)),
      });
    }

    const videos: YoutubeVideo[] = search.items.map((v) => {
      const id = v.id.videoId;
      const info = extra.get(id);
      return {
        videoId: id,
        title: this.decodeHtml(v.snippet.title),
        channelTitle: this.decodeHtml(v.snippet.channelTitle),
        thumbnailUrl: v.snippet.thumbnails.medium.url,
        videoUrl: `https://www.youtube.com/watch?v=${id}`,
        duration: info?.duration ?? '',
        views: info?.views ?? '0',
        publishedAt: this.timeAgo(v.snippet.publishedAt),
      };
    });

    return { videos, nextPageToken: search.nextPageToken ?? null };
  }

  /** Convert an ISO-8601 duration (e.g. PT4M13S) to mm:ss or h:mm:ss. */
  private formatDuration(iso: string): string {
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso);
    if (!match) return '';
    const h = Number(match[1] ?? 0);
    const m = Number(match[2] ?? 0);
    const s = Number(match[3] ?? 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  /** 1_200_000 -> "1.2M", 3_400 -> "3.4K". */
  private formatViews(n: number): string {
    if (n >= 1_000_000) return `${Math.round(n / 100_000) / 10}M`;
    if (n >= 1_000) return `${Math.round(n / 100) / 10}K`;
    return String(n);
  }

  /** "2 hours ago" style relative time. */
  private timeAgo(datetime: string): string {
    const diff = Math.floor((Date.now() - new Date(datetime).getTime()) / 1000);
    if (diff < 1) return 'just now';

    const intervals: [number, string][] = [
      [31_536_000, 'year'],
      [2_592_000, 'month'],
      [604_800, 'week'],
      [86_400, 'day'],
      [3_600, 'hour'],
      [60, 'minute'],
      [1, 'second'],
    ];

    for (const [secs, label] of intervals) {
      const value = Math.floor(diff / secs);
      if (value >= 1) {
        return `${value} ${label}${value > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  }

  /** Decode HTML entities that the YouTube API returns in titles. */
  private decodeHtml(text: string): string {
    const el = document.createElement('textarea');
    el.innerHTML = text;
    return el.value;
  }
}
