import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Lazy YouTube embed (facade pattern).
 *
 * Renders only a thumbnail + play button (a couple of KB) until the user
 * clicks — only then is the real iframe loaded, from the privacy-enhanced
 * youtube-nocookie.com domain. Keeps pages fast and visitors untracked
 * until they opt in by pressing play.
 *
 * Usage:
 *   <app-video-embed videoId="dQw4w9WgXcQ" title="Signals explained" />
 */
@Component({
  selector: 'app-video-embed',
  standalone: true,
  template: `
    <div class="ve-wrap">
      @if (!activated()) {
        <button type="button" class="ve-facade" (click)="activated.set(true)"
                [attr.aria-label]="'Play video: ' + title()">
          <img class="ve-thumb" [src]="thumbnailUrl()" [alt]="title()" loading="lazy" />
          <span class="ve-play" aria-hidden="true">
            <svg width="68" height="48" viewBox="0 0 68 48">
              <path class="ve-play-bg" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"/>
              <path d="M45 24 27 14v20" fill="#fff"/>
            </svg>
          </span>
          <span class="ve-title">{{ title() }}</span>
        </button>
      } @else {
        <iframe
          class="ve-iframe"
          [src]="embedUrl()"
          [title]="title()"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen></iframe>
      }
    </div>
  `,
  styles: [`
    .ve-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 12px;
      overflow: hidden;
      background: #000;
      margin: 1.25rem 0;
    }
    .ve-facade {
      display: block; width: 100%; height: 100%;
      padding: 0; border: none; cursor: pointer; background: #000;
      position: relative;
    }
    .ve-thumb {
      width: 100%; height: 100%; object-fit: cover;
      opacity: .85; transition: opacity .15s;
    }
    .ve-facade:hover .ve-thumb { opacity: 1; }
    .ve-play {
      position: absolute; top: 50%; left: 50%;
      translate: -50% -50%;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,.4));
    }
    .ve-play-bg { fill: rgba(33,33,33,.85); transition: fill .15s; }
    .ve-facade:hover .ve-play-bg { fill: #f00; }
    .ve-title {
      position: absolute; left: 0; right: 0; top: 0;
      padding: .65rem .9rem;
      text-align: left;
      font-size: .9rem; font-weight: 600; color: #fff;
      background: linear-gradient(rgba(0,0,0,.7), transparent);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .ve-iframe {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
    }
  `],
})
export class VideoEmbedComponent {
  /** YouTube video id, e.g. 'dQw4w9WgXcQ' (the v= parameter). */
  videoId = input.required<string>();
  /** Accessible title shown on the facade and used by screen readers. */
  title = input<string>('Video');

  activated = signal(false);

  private sanitizer = inject(DomSanitizer);

  thumbnailUrl = computed(() =>
    `https://i.ytimg.com/vi/${this.videoId()}/hqdefault.jpg`);

  embedUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${this.videoId()}?autoplay=1`));
}
