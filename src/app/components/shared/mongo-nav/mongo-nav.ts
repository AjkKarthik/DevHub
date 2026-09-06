import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-mongo-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/mongodb" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 MongoDB Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/mongodb/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">MongoDB Fundamentals</span>
        @if(p.isDone('mongo-fundamentals')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('mongo-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mongo-fundamentals')"
                  (click)="toggleSubtopics('mongo-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mongo-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('mongo-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/installation-setup" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Installation &amp; Setup</span>
        @if(p.isDone('mongo-installation-setup')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('mongo-installation-setup')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mongo-installation-setup')"
                  (click)="toggleSubtopics('mongo-installation-setup', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mongo-installation-setup'); as instSubs) {
        @if (isSubtopicsExpanded('mongo-installation-setup')) {
          <div class="nav-subtopics">
            @for (s of instSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">CRUD</p>
      <a routerLink="/mongodb/crud-operations" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">CRUD Operations</span>
        @if(p.isDone('mongo-crud-operations')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('crud-operations')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('crud-operations')"
                  (click)="toggleSubtopics('crud-operations', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('crud-operations'); as crudSubs) {
        @if (isSubtopicsExpanded('crud-operations')) {
          <div class="nav-subtopics">
            @for (s of crudSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/update-operators" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Update Operators</span>
        @if(p.isDone('mongo-update-operators')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('update-operators')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('update-operators')"
                  (click)="toggleSubtopics('update-operators', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('update-operators'); as updSubs) {
        @if (isSubtopicsExpanded('update-operators')) {
          <div class="nav-subtopics">
            @for (s of updSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Querying</p>
      <a routerLink="/mongodb/query-operators" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Query Operators</span>
        @if(p.isDone('mongo-query-operators')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('query-operators')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('query-operators')"
                  (click)="toggleSubtopics('query-operators', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('query-operators'); as qoSubs) {
        @if (isSubtopicsExpanded('query-operators')) {
          <div class="nav-subtopics">
            @for (s of qoSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/array-queries" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Array Queries</span>
        @if(p.isDone('mongo-array-queries')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('array-queries')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('array-queries')"
                  (click)="toggleSubtopics('array-queries', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('array-queries'); as aqSubs) {
        @if (isSubtopicsExpanded('array-queries')) {
          <div class="nav-subtopics">
            @for (s of aqSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/projections-sorting" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Projections &amp; Sorting</span>
        @if(p.isDone('mongo-projections-sorting')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('projections-sorting')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('projections-sorting')"
                  (click)="toggleSubtopics('projections-sorting', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('projections-sorting'); as psSubs) {
        @if (isSubtopicsExpanded('projections-sorting')) {
          <div class="nav-subtopics">
            @for (s of psSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Aggregation</p>
      <a routerLink="/mongodb/aggregation-pipeline" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Aggregation Pipeline</span>
        @if(p.isDone('mongo-aggregation-pipeline')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('aggregation-pipeline')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('aggregation-pipeline')"
                  (click)="toggleSubtopics('aggregation-pipeline', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('aggregation-pipeline'); as apSubs) {
        @if (isSubtopicsExpanded('aggregation-pipeline')) {
          <div class="nav-subtopics">
            @for (s of apSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/lookup-joins" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">$lookup &amp; Joins</span>
        @if(p.isDone('mongo-lookup-joins')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('lookup-joins')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('lookup-joins')"
                  (click)="toggleSubtopics('lookup-joins', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('lookup-joins'); as ljSubs) {
        @if (isSubtopicsExpanded('lookup-joins')) {
          <div class="nav-subtopics">
            @for (s of ljSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/aggregation-expressions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Aggregation Expressions</span>
        @if(p.isDone('mongo-aggregation-expressions')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('aggregation-expressions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('aggregation-expressions')"
                  (click)="toggleSubtopics('aggregation-expressions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('aggregation-expressions'); as aeSubs) {
        @if (isSubtopicsExpanded('aggregation-expressions')) {
          <div class="nav-subtopics">
            @for (s of aeSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Schema Design</p>
      <a routerLink="/mongodb/schema-design-patterns" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Schema Design Patterns</span>
        @if(p.isDone('mongo-schema-design-patterns')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('schema-design-patterns')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('schema-design-patterns')"
                  (click)="toggleSubtopics('schema-design-patterns', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('schema-design-patterns'); as sdpSubs) {
        @if (isSubtopicsExpanded('schema-design-patterns')) {
          <div class="nav-subtopics">
            @for (s of sdpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/data-modelling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Data Modelling</span>
        @if(p.isDone('mongo-data-modelling')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('data-modelling')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('data-modelling')"
                  (click)="toggleSubtopics('data-modelling', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('data-modelling'); as dmSubs) {
        @if (isSubtopicsExpanded('data-modelling')) {
          <div class="nav-subtopics">
            @for (s of dmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/time-series" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Time Series Collections</span>
        @if(p.isDone('mongo-time-series')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('time-series')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('time-series')"
                  (click)="toggleSubtopics('time-series', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('time-series'); as tsSubs) {
        @if (isSubtopicsExpanded('time-series')) {
          <div class="nav-subtopics">
            @for (s of tsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Performance</p>
      <a routerLink="/mongodb/indexes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Indexes</span>
        @if(p.isDone('mongo-indexes')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('mongo-indexes')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mongo-indexes')"
                  (click)="toggleSubtopics('mongo-indexes', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mongo-indexes'); as idxSubs) {
        @if (isSubtopicsExpanded('mongo-indexes')) {
          <div class="nav-subtopics">
            @for (s of idxSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/query-performance" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Query Performance</span>
        @if(p.isDone('mongo-query-performance')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('query-performance')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('query-performance')"
                  (click)="toggleSubtopics('query-performance', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('query-performance'); as qpSubs) {
        @if (isSubtopicsExpanded('query-performance')) {
          <div class="nav-subtopics">
            @for (s of qpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Transactions & Streaming</p>
      <a routerLink="/mongodb/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Transactions</span>
        @if(p.isDone('mongo-transactions')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('mongo-transactions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mongo-transactions')"
                  (click)="toggleSubtopics('mongo-transactions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mongo-transactions'); as txnSubs) {
        @if (isSubtopicsExpanded('mongo-transactions')) {
          <div class="nav-subtopics">
            @for (s of txnSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/mongodb/change-streams" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Change Streams</span>
        @if(p.isDone('mongo-change-streams')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('change-streams')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('change-streams')"
                  (click)="toggleSubtopics('change-streams', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('change-streams'); as csSubs) {
        @if (isSubtopicsExpanded('change-streams')) {
          <div class="nav-subtopics">
            @for (s of csSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/mongodb/replication-sharding" routerLinkActive="active"><span class="nl-text">Replication &amp; Sharding</span>@if(p.isDone('mongo-replication-sharding')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/mongodb/security" routerLinkActive="active"><span class="nl-text">Security &amp; Auth</span>@if(p.isDone('mongo-security')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/mongodb/mongodb-nodejs" routerLinkActive="active"><span class="nl-text">MongoDB with Node.js</span>@if(p.isDone('mongo-mongodb-nodejs')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/mongodb/atlas-search" routerLinkActive="active"><span class="nl-text">Atlas &amp; Vector Search</span>@if(p.isDone('mongo-atlas-search')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/mongodb/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
      <a routerLink="/mongodb/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
})
export class MongoNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);

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
