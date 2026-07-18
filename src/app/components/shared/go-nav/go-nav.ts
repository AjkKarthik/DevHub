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
  selector: 'app-go-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/go" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🐹 Go Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/go/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Go Fundamentals</span>
        @if (p.isDone('go-fundamentals')) {<span class="nl-done">✓</span>}
        @if (d('go-fundamentals'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('go-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('go-fundamentals')"
                  (click)="toggleSubtopics('go-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('go-fundamentals'); as goFundamentalsSubs) {
        @if (isSubtopicsExpanded('go-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of goFundamentalsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/structs-interfaces" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Structs &amp; Interfaces</span>
        @if (p.isDone('go-structs-interfaces')) {<span class="nl-done">✓</span>}
        @if (d('go-structs-interfaces'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('structs-interfaces')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('structs-interfaces')"
                  (click)="toggleSubtopics('structs-interfaces', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('structs-interfaces'); as goStructsSubs) {
        @if (isSubtopicsExpanded('structs-interfaces')) {
          <div class="nav-subtopics">
            @for (s of goStructsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/error-handling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Error Handling</span>
        @if (p.isDone('go-error-handling')) {<span class="nl-done">✓</span>}
        @if (d('go-error-handling'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('go-error-handling')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('go-error-handling')"
                  (click)="toggleSubtopics('go-error-handling', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('go-error-handling'); as goErrorHandlingSubs) {
        @if (isSubtopicsExpanded('go-error-handling')) {
          <div class="nav-subtopics">
            @for (s of goErrorHandlingSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/slices-maps" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Slices &amp; Maps</span>
        @if (p.isDone('go-slices-maps')) {<span class="nl-done">✓</span>}
        @if (d('go-slices-maps'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('slices-maps')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('slices-maps')"
                  (click)="toggleSubtopics('slices-maps', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('slices-maps'); as goSlicesMapsSubs) {
        @if (isSubtopicsExpanded('slices-maps')) {
          <div class="nav-subtopics">
            @for (s of goSlicesMapsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/generics" routerLinkActive="active"><span class="nl-text">Go Generics</span>@if(p.isDone('go-generics')){<span class="nl-done">✓</span>}@if(d('go-generics');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Concurrency</p>
      <a routerLink="/go/goroutines" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Goroutines</span>
        @if (p.isDone('go-goroutines')) {<span class="nl-done">✓</span>}
        @if (d('go-goroutines'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('goroutines')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('goroutines')"
                  (click)="toggleSubtopics('goroutines', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('goroutines'); as goroutinesSubs) {
        @if (isSubtopicsExpanded('goroutines')) {
          <div class="nav-subtopics">
            @for (s of goroutinesSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/channels" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Channels</span>
        @if (p.isDone('go-channels')) {<span class="nl-done">✓</span>}
        @if (d('go-channels'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('go-channels')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('go-channels')"
                  (click)="toggleSubtopics('go-channels', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('go-channels'); as goChannelsSubs) {
        @if (isSubtopicsExpanded('go-channels')) {
          <div class="nav-subtopics">
            @for (s of goChannelsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/sync" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">sync &amp; sync/atomic</span>
        @if (p.isDone('go-sync')) {<span class="nl-done">✓</span>}
        @if (d('go-sync'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('sync')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sync')"
                  (click)="toggleSubtopics('sync', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sync'); as syncSubs) {
        @if (isSubtopicsExpanded('sync')) {
          <div class="nav-subtopics">
            @for (s of syncSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/go/context" routerLinkActive="active"><span class="nl-text">context Package</span>@if(p.isDone('go-context')){<span class="nl-done">✓</span>}@if(d('go-context');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">HTTP &amp; APIs</p>
      <a routerLink="/go/net-http" routerLinkActive="active"><span class="nl-text">net/http &amp; REST</span>@if(p.isDone('go-net-http')){<span class="nl-done">✓</span>}@if(d('go-net-http');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/gin" routerLinkActive="active"><span class="nl-text">Gin Framework</span>@if(p.isDone('go-gin')){<span class="nl-done">✓</span>}@if(d('go-gin');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/json-encoding" routerLinkActive="active"><span class="nl-text">JSON &amp; Encoding</span>@if(p.isDone('go-json-encoding')){<span class="nl-done">✓</span>}@if(d('go-json-encoding');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/grpc" routerLinkActive="active"><span class="nl-text">gRPC in Go</span>@if(p.isDone('go-grpc')){<span class="nl-done">✓</span>}@if(d('go-grpc');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Data &amp; Storage</p>
      <a routerLink="/go/pgx" routerLinkActive="active"><span class="nl-text">Database with pgx</span>@if(p.isDone('go-pgx')){<span class="nl-done">✓</span>}@if(d('go-pgx');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/gorm" routerLinkActive="active"><span class="nl-text">GORM</span>@if(p.isDone('go-gorm')){<span class="nl-done">✓</span>}@if(d('go-gorm');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Patterns</p>
      <a routerLink="/go/patterns" routerLinkActive="active"><span class="nl-text">Go Patterns</span>@if(p.isDone('go-patterns')){<span class="nl-done">✓</span>}@if(d('go-patterns');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Tooling</p>
      <a routerLink="/go/modules" routerLinkActive="active"><span class="nl-text">Go Modules</span>@if(p.isDone('go-modules')){<span class="nl-done">✓</span>}@if(d('go-modules');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/testing" routerLinkActive="active"><span class="nl-text">Testing in Go</span>@if(p.isDone('go-testing')){<span class="nl-done">✓</span>}@if(d('go-testing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/cli" routerLinkActive="active"><span class="nl-text">Go CLI Tools</span>@if(p.isDone('go-cli')){<span class="nl-done">✓</span>}@if(d('go-cli');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/profiling" routerLinkActive="active"><span class="nl-text">Performance &amp; Profiling</span>@if(p.isDone('go-profiling')){<span class="nl-done">✓</span>}@if(d('go-profiling');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/build" routerLinkActive="active"><span class="nl-text">Build &amp; Deployment</span>@if(p.isDone('go-build')){<span class="nl-done">✓</span>}@if(d('go-build');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/go/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
      <a routerLink="/go/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
  styles: []
})
export class GoNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  d(route: string): string | null { return DIFF[route] ?? null; }

  subtopicsOf(routeSlug: string) {
    return SUBTOPICS[routeSlug] ?? null;
  }

  // Subtopics list collapses by default; expand state does not persist
  // across reloads (a fresh page load always starts collapsed), mirroring
  // the identical behavior for hubs whose nav lives inline in app.html.
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

  // Auto-expand a topic's subtopics accordion when landing directly on one of
  // its subtopic pages (bookmark, prev/next pager, refresh).
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
