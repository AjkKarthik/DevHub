import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-meta',
  standalone: true,
  template: `
    <div class="pm-bar">
      <span class="pm-time">⏱ {{ readingTime() }} min read</span>
      <span class="pm-diff pm-diff--{{ difficulty() }}">{{ difficulty() }}</span>
      @if (since()) {
        <span class="pm-since" [class]="'pm-since--' + tech()">{{ since() }}</span>
      }
      @if (tech() === 'csharp' || tech() === 'dotnet') {
        <a class="pm-play pm-play--csharp" href="https://dotnetfiddle.net/" target="_blank" rel="noopener">▶ .NET Fiddle</a>
        <a class="pm-play pm-play--sharplab" href="https://sharplab.io/" target="_blank" rel="noopener">⚗ SharpLab</a>
      } @else if (!hidePlayground()) {
        @if (stackblitzUrl()) {
          <a class="pm-play" [href]="stackblitzUrl()" target="_blank" rel="noopener">▶ Playground</a>
        } @else {
          <a class="pm-play" href="https://angular.dev/playground" target="_blank" rel="noopener">▶ Playground</a>
        }
      }
    </div>
  `,
  styles: [`
    .pm-bar {
      display: flex; align-items: center; flex-wrap: wrap; gap: .5rem;
      margin-bottom: .85rem;
    }
    .pm-time { font-size: .78rem; font-weight: 600; color: var(--text3, #6b7280); }
    .pm-diff {
      font-size: .72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .05em; padding: 2px 8px; border-radius: 20px;
      &--beginner     { background: #dcfce7; color: #166534; }
      &--intermediate { background: #fef3c7; color: #92400e; }
      &--advanced     { background: #fee2e2; color: #991b1b; }
    }
    :host-context(body.dark) .pm-diff {
      &--beginner     { background: #052e16; color: #86efac; }
      &--intermediate { background: #2d1f00; color: #fcd34d; }
      &--advanced     { background: #3b0000; color: #fca5a5; }
    }
    .pm-since {
      font-size: .72rem; font-weight: 700; color: #fff;
      padding: 2px 8px; border-radius: 20px;
      background: #0ea5e9;
      &--csharp  { background: #6b21a8; }
      &--dotnet  { background: #512bd4; }
      &--node    { background: #16a34a; }
      &--python  { background: #ca8a04; }
    }
    .pm-play {
      font-size: .78rem; font-weight: 600; color: #0ea5e9;
      text-decoration: none; display: inline-flex; align-items: center; gap: .25rem;
      padding: 2px 8px; border-radius: 20px; border: 1px solid currentColor;
      &:hover { text-decoration: underline; }
      &:first-of-type { margin-left: auto; }
      &--csharp   { color: #7c3aed; border-color: #7c3aed; }
      &--sharplab { color: #0891b2; border-color: #0891b2; }
    }
  `],
})
export class PageMetaComponent {
  readingTime    = input.required<number>();
  difficulty     = input<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  since          = input<string>('');
  tech           = input<'angular' | 'csharp' | 'dotnet' | 'node' | 'python'>('angular');
  stackblitzUrl  = input<string>('');
  hidePlayground = input<boolean>(false);
}
