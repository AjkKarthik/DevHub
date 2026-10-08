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
      <a routerLink="/rust/ownership-borrowing" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Ownership &amp; Borrowing</span>
        @if (p.isDone('rust-ownership-borrowing')) {<span class="nl-done">✓</span>}
        @if (d('rust-ownership-borrowing'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('rust-ownership-borrowing')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('rust-ownership-borrowing')"
                  (click)="toggleSubtopics('rust-ownership-borrowing', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('rust-ownership-borrowing'); as rustOwnershipSubs) {
        @if (isSubtopicsExpanded('rust-ownership-borrowing')) {
          <div class="nav-subtopics">
            @for (s of rustOwnershipSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/rust/lifetimes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Lifetimes</span>
        @if (p.isDone('rust-lifetimes')) {<span class="nl-done">✓</span>}
        @if (d('rust-lifetimes'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/structs-enums" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Structs &amp; Enums</span>
        @if (p.isDone('rust-structs-enums')) {<span class="nl-done">✓</span>}
        @if (d('rust-structs-enums'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/pattern-matching" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Pattern Matching</span>
        @if (p.isDone('rust-pattern-matching')) {<span class="nl-done">✓</span>}
        @if (d('rust-pattern-matching'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/error-handling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Error Handling</span>
        @if (p.isDone('rust-error-handling')) {<span class="nl-done">✓</span>}
        @if (d('rust-error-handling'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/traits-generics" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Traits &amp; Generics</span>
        @if (p.isDone('rust-traits-generics')) {<span class="nl-done">✓</span>}
        @if (d('rust-traits-generics'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/collections" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Collections</span>
        @if (p.isDone('rust-collections')) {<span class="nl-done">✓</span>}
        @if (d('rust-collections'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/modules-cargo" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Modules &amp; Cargo</span>
        @if (p.isDone('rust-modules-cargo')) {<span class="nl-done">✓</span>}
        @if (d('rust-modules-cargo'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Memory &amp; Concurrency</p>
      <a routerLink="/rust/smart-pointers" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Smart Pointers</span>
        @if (p.isDone('rust-smart-pointers')) {<span class="nl-done">✓</span>}
        @if (d('rust-smart-pointers'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/concurrency-threads" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Concurrency &amp; Threads</span>
        @if (p.isDone('rust-concurrency-threads')) {<span class="nl-done">✓</span>}
        @if (d('rust-concurrency-threads'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/async-await" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Async/Await</span>
        @if (p.isDone('rust-async-await')) {<span class="nl-done">✓</span>}
        @if (d('rust-async-await'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/unsafe-ffi" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Unsafe Rust &amp; FFI</span>
        @if (p.isDone('rust-unsafe-ffi')) {<span class="nl-done">✓</span>}
        @if (d('rust-unsafe-ffi'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Building Things</p>
      <a routerLink="/rust/web-frameworks" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Web Frameworks</span>
        @if (p.isDone('rust-web-frameworks')) {<span class="nl-done">✓</span>}
        @if (d('rust-web-frameworks'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/rest-apis" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Building REST APIs</span>
        @if (p.isDone('rust-rest-apis')) {<span class="nl-done">✓</span>}
        @if (d('rust-rest-apis'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/serialization" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Serialization</span>
        @if (p.isDone('rust-serialization')) {<span class="nl-done">✓</span>}
        @if (d('rust-serialization'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/cli-tools" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">CLI Tools</span>
        @if (p.isDone('rust-cli-tools')) {<span class="nl-done">✓</span>}
        @if (d('rust-cli-tools'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/wasm" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">WASM with Rust</span>
        @if (p.isDone('rust-wasm')) {<span class="nl-done">✓</span>}
        @if (d('rust-wasm'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Craft &amp; Ops</p>
      <a routerLink="/rust/testing" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Testing in Rust</span>
        @if (p.isDone('rust-testing')) {<span class="nl-done">✓</span>}
        @if (d('rust-testing'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/macros" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Macros</span>
        @if (p.isDone('rust-macros')) {<span class="nl-done">✓</span>}
        @if (d('rust-macros'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
      <a routerLink="/rust/performance-profiling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Performance &amp; Profiling</span>
        @if (p.isDone('rust-performance-profiling')) {<span class="nl-done">✓</span>}
        @if (d('rust-performance-profiling'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
      </a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/rust/cheatsheet" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Rust Cheat Sheet</span>
      </a>
      <a routerLink="/rust/interview-prep" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Rust Interview Prep</span>
      </a>
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
