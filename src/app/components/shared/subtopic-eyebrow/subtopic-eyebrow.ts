import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Small "Topic › Subtopic" link row at the top of every Phase 10 subtopic
 * page — extracted after the same markup/styles were being copy-pasted
 * into every subtopic's own .html/.scss. Reuse this instead of inlining it.
 */
@Component({
  selector: 'app-subtopic-eyebrow',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="se-wrap">
      <a [routerLink]="topicRoute()">{{ topicLabel() }}</a>
      <span class="se-sep">›</span>
      <span>{{ subtopicLabel() }}</span>
    </div>
  `,
  styles: [`
    .se-wrap {
      font-size: .82rem;
      font-weight: 600;
      color: var(--text3, #6b7280);
      margin-bottom: 1rem;
    }
    a {
      color: var(--text3, #6b7280);
      text-decoration: none;
      &:hover { color: var(--accent, #4f46e5); }
    }
    .se-sep { margin: 0 .4rem; opacity: .6; }
  `],
})
export class SubtopicEyebrowComponent {
  topicLabel = input.required<string>();
  topicRoute = input.required<string>();
  subtopicLabel = input.required<string>();
}
