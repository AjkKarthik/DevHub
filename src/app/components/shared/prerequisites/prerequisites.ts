import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Prerequisite {
  label: string;
  route: string;
}

@Component({
  selector: 'app-prerequisites',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="prereq-wrap">
      <span class="prereq-heading">Prerequisites</span>
      <div class="prereq-chips">
        @for (p of items(); track p.route) {
          <a class="prereq-chip" [routerLink]="p.route">
            <span class="prereq-arrow">←</span>{{ p.label }}
          </a>
        }
      </div>
      @if (note()) {
        <p class="prereq-note">{{ note() }}</p>
      }
    </div>
  `,
  styles: [`
    .prereq-wrap {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: .5rem;
      padding: .55rem .9rem;
      background: var(--surface2, #f8fafc);
      border: 1px solid var(--border, #e5e7eb);
      border-radius: 8px;
      margin-bottom: 1.25rem;
    }
    .prereq-heading {
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--text3, #6b7280);
      white-space: nowrap;
      margin-right: .25rem;
    }
    .prereq-chips {
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      align-items: center;
    }
    .prereq-chip {
      display: inline-flex;
      align-items: center;
      gap: .3rem;
      padding: .25rem .65rem;
      background: var(--surface, #fff);
      border: 1px solid var(--border, #d1d5db);
      border-radius: 20px;
      font-size: .78rem;
      font-weight: 600;
      color: var(--accent, #4f46e5);
      text-decoration: none;
      transition: border-color .15s, background .15s;
      &:hover {
        border-color: var(--accent, #4f46e5);
        background: var(--accent-tint, #eff6ff);
      }
    }
    .prereq-arrow {
      font-size: .7rem;
      opacity: .6;
    }
    .prereq-note {
      width: 100%;
      margin: .2rem 0 0;
      font-size: .76rem;
      color: var(--text3, #6b7280);
      font-style: italic;
    }

    :host-context(body.dark) {
      .prereq-wrap {
        background: #1a1d24;
        border-color: #374151;
      }
      .prereq-chip {
        background: #0f1117;
        border-color: #374151;
        color: var(--accent, #818cf8);
        &:hover {
          border-color: var(--accent, #818cf8);
          background: #1e2030;
        }
      }
      .prereq-note { color: #6b7280; }
    }
  `]
})
export class PrerequisitesComponent {
  items = input.required<Prerequisite[]>();
  note  = input<string>('');
}
