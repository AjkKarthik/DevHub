import { Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Collapsed-by-default YouTube embed — two-step accordion + lazy facade.
 *
 * Step 0 (default): a slim "Watch" toggle button. No video, no YouTube
 *   scripts, just a thumbnail-free button.
 * Step 1 (first click): expands to the video thumbnail with a play
 *   button — still no YouTube scripts (thumbnail comes from i.ytimg.com).
 * Step 2 (second click): loads the real iframe from the privacy-enhanced
 *   youtube-nocookie.com domain and starts playback.
 * "Hide video" collapses everything back to step 0 and unloads the iframe.
 *
 * Usage:
 *   <app-video-embed videoId="dQw4w9WgXcQ" title="Signals explained" />
 */
@Component({
  selector: 'app-video-embed',
  standalone: true,
  template: `
    @if (!expanded()) {
      <button type="button" class="ve-toggle" (click)="expanded.set(true)">
        <span class="ve-toggle-icon">▶</span>
        <span class="ve-toggle-text">Watch: {{ title() }}</span>
        <span class="ve-toggle-chevron">▾</span>
      </button>
    } @else {
      <div class="ve-player">
        <div class="ve-frame-wrap">
          @if (!playing()) {
            <button type="button" class="ve-facade" (click)="playing.set(true)"
                    [attr.aria-label]="'Play video: ' + title()">
              <img class="ve-thumb" [src]="thumbnailUrl()" [alt]="title()" loading="lazy" />
              <span class="ve-play" aria-hidden="true">
                <svg width="68" height="48" viewBox="0 0 68 48">
                  <path class="ve-play-bg" d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"/>
                  <path d="M45 24 27 14v20" fill="#fff"/>
                </svg>
              </span>
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
        <button type="button" class="ve-hide" (click)="collapse()">
          ▴ Hide video
        </button>
      </div>
    }
  `,
  styles: [`
    .ve-toggle {
      display: inline-flex;
      align-items: center;
      gap: .55rem;
      padding: .5rem 1rem;
      margin: .75rem 0;
      background: #1e293b;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: .875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s;

      &:hover { background: #334155; }
    }
    .ve-toggle-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #f00;
      font-size: .55rem;
      padding-left: 2px;
    }
    .ve-toggle-chevron { opacity: .7; font-size: .8rem; }

    .ve-player { margin: .75rem 0 1rem; }
    .ve-frame-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 12px;
      overflow: hidden;
      background: #000;
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
    .ve-iframe {
      position: absolute; inset: 0;
      width: 100%; height: 100%;
    }
    .ve-hide {
      display: inline-block;
      margin-top: .5rem;
      padding: .3rem .8rem;
      background: transparent;
      color: var(--text3, #6b7280);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 6px;
      font-size: .78rem;
      font-weight: 600;
      cursor: pointer;
      transition: color .15s, border-color .15s;

      &:hover { color: var(--text, #1f2937); border-color: #9ca3af; }
    }

    :host-context(body.dark) {
      .ve-toggle { background: #334155; &:hover { background: #475569; } }
      .ve-hide {
        border-color: #334155;
        color: #94a3b8;
        &:hover { color: #e2e8f0; border-color: #64748b; }
      }
    }
  `],
})
export class VideoEmbedComponent {
  /** YouTube video id, e.g. 'dQw4w9WgXcQ' (the v= parameter). */
  videoId = input.required<string>();
  /** Title shown on the toggle button and used by screen readers. */
  title = input<string>('Video');

  expanded = signal(false);
  playing  = signal(false);

  collapse() {
    this.expanded.set(false);
    this.playing.set(false);   // unload the iframe entirely
  }

  private sanitizer = inject(DomSanitizer);

  thumbnailUrl = computed(() =>
    `https://i.ytimg.com/vi/${this.videoId()}/hqdefault.jpg`);

  embedUrl = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube-nocookie.com/embed/${this.videoId()}?autoplay=1`));
}
