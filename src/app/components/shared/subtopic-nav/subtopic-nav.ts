import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface SubtopicLink { label: string; route: string; }

/**
 * Prev / next subtopic navigation for Phase 10 subtopic pages, plus a
 * persistent link back to the parent topic's overview page. Subtopics are
 * meant to be read in sequence, like a mini-course.
 */
@Component({
  selector: 'app-subtopic-nav',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav class="sn-wrap">
      <a class="sn-back" [routerLink]="topicRoute()">← Back to {{ topicLabel() }} overview</a>
      <div class="sn-pager">
        @if (prev()) {
          <a class="sn-link sn-link--prev" [routerLink]="prev()!.route">
            <span class="sn-dir">← Previous</span>
            <span class="sn-title">{{ prev()!.label }}</span>
          </a>
        } @else {
          <span class="sn-spacer"></span>
        }
        @if (next()) {
          <a class="sn-link sn-link--next" [routerLink]="next()!.route">
            <span class="sn-dir">Next →</span>
            <span class="sn-title">{{ next()!.label }}</span>
          </a>
        } @else {
          <span class="sn-spacer"></span>
        }
      </div>
    </nav>
  `,
  styles: [`
    .sn-wrap { margin: 2rem 0 1rem; }
    .sn-back {
      display: inline-block;
      font-size: .82rem; font-weight: 600;
      color: var(--text3, #6b7280);
      text-decoration: none;
      margin-bottom: 1rem;
      &:hover { color: #4f46e5; }
    }
    .sn-pager {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    .sn-link {
      display: flex; flex-direction: column; gap: .2rem;
      padding: .85rem 1.1rem;
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 10px;
      text-decoration: none;
      transition: border-color .15s;
      &:hover { border-color: #4f46e5; }
    }
    .sn-link--next { text-align: right; align-items: flex-end; }
    .sn-dir { font-size: .72rem; font-weight: 700; color: #4f46e5; text-transform: uppercase; letter-spacing: .04em; }
    .sn-title { font-size: .9rem; font-weight: 600; color: var(--text, #1a1a1a); }
    .sn-spacer { display: block; }

    :host-context(body.dark) {
      .sn-back:hover { color: #818cf8; }
      .sn-link { border-color: #334155; &:hover { border-color: #818cf8; } }
      .sn-dir { color: #818cf8; }
    }
  `],
})
export class SubtopicNavComponent {
  topicLabel = input.required<string>();
  topicRoute = input.required<string>();
  prev = input<SubtopicLink | null>(null);
  next = input<SubtopicLink | null>(null);
}
