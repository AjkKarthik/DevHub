import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-redis-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/redis" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 Redis Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/redis/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Redis Fundamentals</span>
        @if(p.isDone('redis-fundamentals')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('redis-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('redis-fundamentals')"
                  (click)="toggleSubtopics('redis-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('redis-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('redis-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/installation-setup" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Installation &amp; CLI</span>
        @if(p.isDone('redis-installation-setup')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('installation-setup')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('installation-setup')"
                  (click)="toggleSubtopics('installation-setup', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('installation-setup'); as instSubs) {
        @if (isSubtopicsExpanded('installation-setup')) {
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
      <p class="nav-group-label">Data Structures</p>
      <a routerLink="/redis/strings" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Strings</span>
        @if(p.isDone('redis-strings')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('redis-strings')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('redis-strings')"
                  (click)="toggleSubtopics('redis-strings', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('redis-strings'); as strSubs) {
        @if (isSubtopicsExpanded('redis-strings')) {
          <div class="nav-subtopics">
            @for (s of strSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/hashes" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Hashes</span>
        @if(p.isDone('redis-hashes')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('hashes')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('hashes')"
                  (click)="toggleSubtopics('hashes', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('hashes'); as hashSubs) {
        @if (isSubtopicsExpanded('hashes')) {
          <div class="nav-subtopics">
            @for (s of hashSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/lists" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Lists</span>
        @if(p.isDone('redis-lists')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('lists')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('lists')"
                  (click)="toggleSubtopics('lists', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('lists'); as listSubs) {
        @if (isSubtopicsExpanded('lists')) {
          <div class="nav-subtopics">
            @for (s of listSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/sets" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Sets</span>
        @if(p.isDone('redis-sets')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('sets')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sets')"
                  (click)="toggleSubtopics('sets', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sets'); as setSubs) {
        @if (isSubtopicsExpanded('sets')) {
          <div class="nav-subtopics">
            @for (s of setSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/sorted-sets" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Sorted Sets</span>
        @if(p.isDone('redis-sorted-sets')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('sorted-sets')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sorted-sets')"
                  (click)="toggleSubtopics('sorted-sets', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sorted-sets'); as sortedSetSubs) {
        @if (isSubtopicsExpanded('sorted-sets')) {
          <div class="nav-subtopics">
            @for (s of sortedSetSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/redis-stack" routerLinkActive="active"><span class="nl-text">Redis Stack &amp; Modules</span>@if(p.isDone('redis-redis-stack')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Commands</p>
      <a routerLink="/redis/key-commands" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Key Commands</span>
        @if(p.isDone('redis-key-commands')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('key-commands')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('key-commands')"
                  (click)="toggleSubtopics('key-commands', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('key-commands'); as keyCommandsSubs) {
        @if (isSubtopicsExpanded('key-commands')) {
          <div class="nav-subtopics">
            @for (s of keyCommandsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/transactions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Transactions (MULTI/EXEC)</span>
        @if(p.isDone('redis-transactions')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('redis-transactions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('redis-transactions')"
                  (click)="toggleSubtopics('redis-transactions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('redis-transactions'); as transactionsSubs) {
        @if (isSubtopicsExpanded('redis-transactions')) {
          <div class="nav-subtopics">
            @for (s of transactionsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/lua-scripting" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Lua Scripting</span>
        @if(p.isDone('redis-lua-scripting')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('lua-scripting')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('lua-scripting')"
                  (click)="toggleSubtopics('lua-scripting', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('lua-scripting'); as luaScriptingSubs) {
        @if (isSubtopicsExpanded('lua-scripting')) {
          <div class="nav-subtopics">
            @for (s of luaScriptingSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Persistence</p>
      <a routerLink="/redis/persistence" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Persistence: RDB &amp; AOF</span>
        @if(p.isDone('redis-persistence')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('persistence')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('persistence')"
                  (click)="toggleSubtopics('persistence', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('persistence'); as persistenceSubs) {
        @if (isSubtopicsExpanded('persistence')) {
          <div class="nav-subtopics">
            @for (s of persistenceSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Pub/Sub &amp; Streams</p>
      <a routerLink="/redis/pub-sub" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Pub/Sub Messaging</span>
        @if(p.isDone('redis-pub-sub')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('pub-sub')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('pub-sub')"
                  (click)="toggleSubtopics('pub-sub', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('pub-sub'); as pubSubSubs) {
        @if (isSubtopicsExpanded('pub-sub')) {
          <div class="nav-subtopics">
            @for (s of pubSubSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/streams" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Redis Streams</span>
        @if(p.isDone('redis-streams')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('redis-streams')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('redis-streams')"
                  (click)="toggleSubtopics('redis-streams', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('redis-streams'); as streamsSubs) {
        @if (isSubtopicsExpanded('redis-streams')) {
          <div class="nav-subtopics">
            @for (s of streamsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Caching</p>
      <a routerLink="/redis/caching-patterns" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Caching Patterns</span>
        @if(p.isDone('redis-caching-patterns')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('caching-patterns')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('caching-patterns')"
                  (click)="toggleSubtopics('caching-patterns', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('caching-patterns'); as cachingSubs) {
        @if (isSubtopicsExpanded('caching-patterns')) {
          <div class="nav-subtopics">
            @for (s of cachingSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/eviction-policies" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Eviction Policies</span>
        @if(p.isDone('redis-eviction-policies')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('eviction-policies')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('eviction-policies')"
                  (click)="toggleSubtopics('eviction-policies', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('eviction-policies'); as evictionSubs) {
        @if (isSubtopicsExpanded('eviction-policies')) {
          <div class="nav-subtopics">
            @for (s of evictionSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/rate-limiting" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Rate Limiting</span>
        @if(p.isDone('redis-rate-limiting')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('rate-limiting')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('rate-limiting')"
                  (click)="toggleSubtopics('rate-limiting', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('rate-limiting'); as rateLimitingSubs) {
        @if (isSubtopicsExpanded('rate-limiting')) {
          <div class="nav-subtopics">
            @for (s of rateLimitingSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Cluster &amp; HA</p>
      <a routerLink="/redis/replication-sentinel" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Replication &amp; Sentinel</span>
        @if(p.isDone('redis-replication-sentinel')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('replication-sentinel')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('replication-sentinel')"
                  (click)="toggleSubtopics('replication-sentinel', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('replication-sentinel'); as replicationSentinelSubs) {
        @if (isSubtopicsExpanded('replication-sentinel')) {
          <div class="nav-subtopics">
            @for (s of replicationSentinelSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/redis/redis-cluster" routerLinkActive="active"><span class="nl-text">Redis Cluster</span>@if(p.isDone('redis-redis-cluster')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Ecosystem</p>
      <a routerLink="/redis/redis-nodejs" routerLinkActive="active"><span class="nl-text">Redis with Node.js</span>@if(p.isDone('redis-redis-nodejs')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/security" routerLinkActive="active"><span class="nl-text">Redis Security</span>@if(p.isDone('redis-security')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/redis/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
      <a routerLink="/redis/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
})
export class RedisNavComponent {
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
