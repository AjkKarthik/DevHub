import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';
import { SUBTOPICS } from '../../../data/subtopics';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-sysdesign-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/system-design" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏗️ System Design Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Fundamentals</p>
      <a routerLink="/system-design/framework" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">System Design Framework</span>
        @if(p.isDone('sysdesign-framework')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-framework');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('framework')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('framework')"
                  (click)="toggleSubtopics('framework', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('framework'); as fwSubs) {
        @if (isSubtopicsExpanded('framework')) {
          <div class="nav-subtopics">
            @for (s of fwSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/capacity-estimation" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Capacity Estimation</span>
        @if(p.isDone('sysdesign-capacity-estimation')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-capacity-estimation');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('capacity-estimation')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('capacity-estimation')"
                  (click)="toggleSubtopics('capacity-estimation', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('capacity-estimation'); as ceSubs) {
        @if (isSubtopicsExpanded('capacity-estimation')) {
          <div class="nav-subtopics">
            @for (s of ceSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/cap-theorem" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">CAP &amp; PACELC Theorems</span>
        @if(p.isDone('sysdesign-cap-theorem')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-cap-theorem');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('cap-theorem')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('cap-theorem')"
                  (click)="toggleSubtopics('cap-theorem', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('cap-theorem'); as capSubs) {
        @if (isSubtopicsExpanded('cap-theorem')) {
          <div class="nav-subtopics">
            @for (s of capSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/networking" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Networking Fundamentals</span>
        @if(p.isDone('sysdesign-networking')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-networking');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sysdesign-networking')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sysdesign-networking')"
                  (click)="toggleSubtopics('sysdesign-networking', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sysdesign-networking'); as netSubs) {
        @if (isSubtopicsExpanded('sysdesign-networking')) {
          <div class="nav-subtopics">
            @for (s of netSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Scalability</p>
      <a routerLink="/system-design/scaling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Horizontal vs Vertical Scaling</span>
        @if(p.isDone('sysdesign-scaling')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-scaling');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('scaling')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('scaling')"
                  (click)="toggleSubtopics('scaling', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('scaling'); as scaleSubs) {
        @if (isSubtopicsExpanded('scaling')) {
          <div class="nav-subtopics">
            @for (s of scaleSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/load-balancing" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Load Balancing</span>
        @if(p.isDone('sysdesign-load-balancing')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-load-balancing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sysdesign-load-balancing')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sysdesign-load-balancing')"
                  (click)="toggleSubtopics('sysdesign-load-balancing', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sysdesign-load-balancing'); as lbSubs) {
        @if (isSubtopicsExpanded('sysdesign-load-balancing')) {
          <div class="nav-subtopics">
            @for (s of lbSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/caching" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Caching Strategies</span>
        @if(p.isDone('sysdesign-caching')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-caching');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sysdesign-caching')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sysdesign-caching')"
                  (click)="toggleSubtopics('sysdesign-caching', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sysdesign-caching'); as cacheSubs) {
        @if (isSubtopicsExpanded('sysdesign-caching')) {
          <div class="nav-subtopics">
            @for (s of cacheSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/cdn" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Content Delivery Networks</span>
        @if(p.isDone('sysdesign-cdn')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-cdn');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('cdn')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('cdn')"
                  (click)="toggleSubtopics('cdn', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('cdn'); as cdnSubs) {
        @if (isSubtopicsExpanded('cdn')) {
          <div class="nav-subtopics">
            @for (s of cdnSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/sharding" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Database Sharding</span>
        @if(p.isDone('sysdesign-sharding')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-sharding');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sharding')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sharding')"
                  (click)="toggleSubtopics('sharding', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sharding'); as shardSubs) {
        @if (isSubtopicsExpanded('sharding')) {
          <div class="nav-subtopics">
            @for (s of shardSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Data</p>
      <a routerLink="/system-design/sql-vs-nosql" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">SQL vs NoSQL</span>
        @if(p.isDone('sysdesign-sql-vs-nosql')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-sql-vs-nosql');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sql-vs-nosql')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sql-vs-nosql')"
                  (click)="toggleSubtopics('sql-vs-nosql', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sql-vs-nosql'); as sqlSubs) {
        @if (isSubtopicsExpanded('sql-vs-nosql')) {
          <div class="nav-subtopics">
            @for (s of sqlSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/replication" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Replication Strategies</span>
        @if(p.isDone('sysdesign-replication')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-replication');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('replication')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('replication')"
                  (click)="toggleSubtopics('replication', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('replication'); as replSubs) {
        @if (isSubtopicsExpanded('replication')) {
          <div class="nav-subtopics">
            @for (s of replSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/indexes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Indexes &amp; Query Optimisation</span>
        @if(p.isDone('sysdesign-indexes')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-indexes');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sysdesign-indexes')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sysdesign-indexes')"
                  (click)="toggleSubtopics('sysdesign-indexes', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sysdesign-indexes'); as idxSubs) {
        @if (isSubtopicsExpanded('sysdesign-indexes')) {
          <div class="nav-subtopics">
            @for (s of idxSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/system-design/distributed-transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Distributed Transactions</span>
        @if(p.isDone('sysdesign-distributed-transactions')){<span class="nl-done">✓</span>}
        @if(d('sysdesign-distributed-transactions');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('distributed-transactions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('distributed-transactions')"
                  (click)="toggleSubtopics('distributed-transactions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('distributed-transactions'); as dtSubs) {
        @if (isSubtopicsExpanded('distributed-transactions')) {
          <div class="nav-subtopics">
            @for (s of dtSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reliability</p>
      <a routerLink="/system-design/high-availability" routerLinkActive="active"><span class="nl-text">High Availability Design</span>@if(p.isDone('sysdesign-high-availability')){<span class="nl-done">✓</span>}@if(d('sysdesign-high-availability');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/fault-tolerance" routerLinkActive="active"><span class="nl-text">Fault Tolerance Patterns</span>@if(p.isDone('sysdesign-fault-tolerance')){<span class="nl-done">✓</span>}@if(d('sysdesign-fault-tolerance');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/distributed-tracing" routerLinkActive="active"><span class="nl-text">Distributed Tracing</span>@if(p.isDone('sysdesign-distributed-tracing')){<span class="nl-done">✓</span>}@if(d('sysdesign-distributed-tracing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/disaster-recovery" routerLinkActive="active"><span class="nl-text">Disaster Recovery</span>@if(p.isDone('sysdesign-disaster-recovery')){<span class="nl-done">✓</span>}@if(d('sysdesign-disaster-recovery');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Real Systems</p>
      <a routerLink="/system-design/url-shortener" routerLinkActive="active"><span class="nl-text">Design a URL Shortener</span>@if(p.isDone('sysdesign-url-shortener')){<span class="nl-done">✓</span>}@if(d('sysdesign-url-shortener');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/social-feed" routerLinkActive="active"><span class="nl-text">Design a Social Feed</span>@if(p.isDone('sysdesign-social-feed')){<span class="nl-done">✓</span>}@if(d('sysdesign-social-feed');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/chat-application" routerLinkActive="active"><span class="nl-text">Design a Chat Application</span>@if(p.isDone('sysdesign-chat-application')){<span class="nl-done">✓</span>}@if(d('sysdesign-chat-application');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/search-engine" routerLinkActive="active"><span class="nl-text">Design a Search Engine</span>@if(p.isDone('sysdesign-search-engine')){<span class="nl-done">✓</span>}@if(d('sysdesign-search-engine');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/payment-system" routerLinkActive="active"><span class="nl-text">Design a Payment System</span>@if(p.isDone('sysdesign-payment-system')){<span class="nl-done">✓</span>}@if(d('sysdesign-payment-system');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/video-streaming" routerLinkActive="active"><span class="nl-text">Design Netflix / YouTube</span>@if(p.isDone('sysdesign-video-streaming')){<span class="nl-done">✓</span>}@if(d('sysdesign-video-streaming');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/system-design/ai-ml-system-design" routerLinkActive="active"><span class="nl-text">AI/ML System Design</span>@if(p.isDone('sysdesign-ai-ml-system-design')){<span class="nl-done">✓</span>}@if(d('sysdesign-ai-ml-system-design');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/system-design/cheatsheet" routerLinkActive="active"><span class="nl-text">System Design Cheat Sheet</span></a>
      <a routerLink="/system-design/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
  styles: []
})
export class SysdesignNavComponent {
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
