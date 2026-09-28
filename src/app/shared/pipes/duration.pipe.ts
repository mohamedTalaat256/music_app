import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a duration in seconds as `m:ss` (or `h:mm:ss` when >= 1 hour).
 * Usage: {{ song.duration | duration }}
 */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null || !isFinite(totalSeconds) || totalSeconds < 0) {
      return '0:00';
    }
    const total = Math.floor(totalSeconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const ss = seconds.toString().padStart(2, '0');
    if (hours > 0) {
      const mm = minutes.toString().padStart(2, '0');
      return `${hours}:${mm}:${ss}`;
    }
    return `${minutes}:${ss}`;
  }
}
