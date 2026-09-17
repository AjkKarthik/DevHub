import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-gql-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/graphql" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 GraphQL Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/graphql/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">GraphQL Fundamentals</span>
        @if(p.isDone('gql-fundamentals')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('gql-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('gql-fundamentals')"
                  (click)="toggleSubtopics('gql-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('gql-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('gql-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/schema-definition-language" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Schema Definition Language</span>
        @if(p.isDone('gql-schema-definition-language')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('schema-definition-language')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('schema-definition-language')"
                  (click)="toggleSubtopics('schema-definition-language', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('schema-definition-language'); as sdlSubs) {
        @if (isSubtopicsExpanded('schema-definition-language')) {
          <div class="nav-subtopics">
            @for (s of sdlSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/type-system" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Type System Deep Dive</span>
        @if(p.isDone('gql-type-system')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('type-system')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('type-system')"
                  (click)="toggleSubtopics('type-system', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('type-system'); as tsSubs) {
        @if (isSubtopicsExpanded('type-system')) {
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
      <p class="nav-group-label">Queries</p>
      <a routerLink="/graphql/queries" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Queries</span>
        @if(p.isDone('gql-queries')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('queries')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('queries')"
                  (click)="toggleSubtopics('queries', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('queries'); as queriesSubs) {
        @if (isSubtopicsExpanded('queries')) {
          <div class="nav-subtopics">
            @for (s of queriesSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/variables-arguments" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Variables &amp; Arguments</span>
        @if(p.isDone('gql-variables-arguments')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('variables-arguments')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('variables-arguments')"
                  (click)="toggleSubtopics('variables-arguments', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('variables-arguments'); as varArgsSubs) {
        @if (isSubtopicsExpanded('variables-arguments')) {
          <div class="nav-subtopics">
            @for (s of varArgsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/directives" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Directives</span>
        @if(p.isDone('gql-directives')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('gql-directives')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('gql-directives')"
                  (click)="toggleSubtopics('gql-directives', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('gql-directives'); as directivesSubs) {
        @if (isSubtopicsExpanded('gql-directives')) {
          <div class="nav-subtopics">
            @for (s of directivesSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Mutations &amp; Subscriptions</p>
      <a routerLink="/graphql/mutations" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Mutations</span>
        @if(p.isDone('gql-mutations')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('mutations')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mutations')"
                  (click)="toggleSubtopics('mutations', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mutations'); as mutationsSubs) {
        @if (isSubtopicsExpanded('mutations')) {
          <div class="nav-subtopics">
            @for (s of mutationsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/error-handling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Mutation Error Handling</span>
        @if(p.isDone('gql-error-handling')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('gql-error-handling')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('gql-error-handling')"
                  (click)="toggleSubtopics('gql-error-handling', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('gql-error-handling'); as errHandlingSubs) {
        @if (isSubtopicsExpanded('gql-error-handling')) {
          <div class="nav-subtopics">
            @for (s of errHandlingSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/subscriptions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Subscriptions</span>
        @if(p.isDone('gql-subscriptions')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('subscriptions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('subscriptions')"
                  (click)="toggleSubtopics('subscriptions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('subscriptions'); as subscriptionsSubs) {
        @if (isSubtopicsExpanded('subscriptions')) {
          <div class="nav-subtopics">
            @for (s of subscriptionsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Resolvers &amp; Data</p>
      <a routerLink="/graphql/resolvers" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Resolvers</span>
        @if(p.isDone('gql-resolvers')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('resolvers')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('resolvers')"
                  (click)="toggleSubtopics('resolvers', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('resolvers'); as resolversSubs) {
        @if (isSubtopicsExpanded('resolvers')) {
          <div class="nav-subtopics">
            @for (s of resolversSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/dataloader" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">DataLoader &amp; N+1</span>
        @if(p.isDone('gql-dataloader')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('dataloader')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('dataloader')"
                  (click)="toggleSubtopics('dataloader', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('dataloader'); as dataloaderSubs) {
        @if (isSubtopicsExpanded('dataloader')) {
          <div class="nav-subtopics">
            @for (s of dataloaderSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/auth" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Auth &amp; Authorization</span>
        @if(p.isDone('gql-auth')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('auth')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('auth')"
                  (click)="toggleSubtopics('auth', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('auth'); as authSubs) {
        @if (isSubtopicsExpanded('auth')) {
          <div class="nav-subtopics">
            @for (s of authSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Server</p>
      <a routerLink="/graphql/apollo-server" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Apollo Server</span>
        @if(p.isDone('gql-apollo-server')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('apollo-server')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('apollo-server')"
                  (click)="toggleSubtopics('apollo-server', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('apollo-server'); as apolloServerSubs) {
        @if (isSubtopicsExpanded('apollo-server')) {
          <div class="nav-subtopics">
            @for (s of apolloServerSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/graphql/pagination" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Pagination Patterns</span>
        @if(p.isDone('gql-pagination')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('pagination')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('pagination')"
                  (click)="toggleSubtopics('pagination', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('pagination'); as paginationSubs) {
        @if (isSubtopicsExpanded('pagination')) {
          <div class="nav-subtopics">
            @for (s of paginationSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Client</p>
      <a routerLink="/graphql/apollo-client" routerLinkActive="active"><span class="nl-text">Apollo Client</span>@if(p.isDone('gql-apollo-client')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/client-caching" routerLinkActive="active"><span class="nl-text">Client Caching</span>@if(p.isDone('gql-client-caching')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/code-generation" routerLinkActive="active"><span class="nl-text">Code Generation</span>@if(p.isDone('gql-code-generation')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/graphql/performance" routerLinkActive="active"><span class="nl-text">Performance &amp; Best Practices</span>@if(p.isDone('gql-performance')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/federation" routerLinkActive="active"><span class="nl-text">Schema Stitching &amp; Federation</span>@if(p.isDone('gql-federation')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/graphql/testing" routerLinkActive="active"><span class="nl-text">Testing GraphQL APIs</span>@if(p.isDone('gql-testing')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/graphql/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
      <a routerLink="/graphql/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
})
export class GqlNavComponent {
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
