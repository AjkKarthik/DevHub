import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';
import { SUBTOPICS } from '../../../data/subtopics';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-rust-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/rust" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🦀 Rust Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/rust/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Rust Fundamentals</span>
        @if (p.isDone('rust-fundamentals')) {<span class="nl-done">✓</span>}
        @if (d('rust-fundamentals'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('rust-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('rust-fundamentals')"
                  (click)="toggleSubtopics('rust-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('rust-fundamentals'); as rustFundamentalsSubs) {
        @if (isSubtopicsExpanded('rust-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of rustFundamentalsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>
  `,
  styles: []
})
export class RustNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  d(route: string): string | null { return DIFF[route] ?? null; }

  subtopicsOf(routeSlug: string) {
    return SUBTOPICS[routeSlug] ?? null;
  }

  private expandedTopics = signal<Set<string>>(new Set());

  isSubtopicsExpanded(routeSlug: string): boolean {
    return this.expandedTopics().has(routeSlug);
  }

  toggleSubtopics(routeSlug: string, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const next = new Set(this.expandedTopics());
    next.has(routeSlug) ? next.delete(routeSlug) : next.add(routeSlug);
    this.expandedTopics.set(next);
  }

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [topicSlug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(topicSlug));
        break;
      }
    }
  }
}
