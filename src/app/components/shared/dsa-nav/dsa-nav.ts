import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-dsa-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/dsa" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 DSA Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/dsa/big-o" routerLinkActive="active">
        <span class="nl-text">Big-O Notation</span>
        @if(p.isDone('dsa-big-o')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('big-o'); as bigOSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('big-o', $event)">
            {{ isSubtopicsExpanded('big-o') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('big-o'); as bigOSubs) {
        @if (isSubtopicsExpanded('big-o')) {
          <div class="nav-subtopics">
            @for (sub of bigOSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/recursion-backtracking" routerLinkActive="active"><span class="nl-text">Recursion &amp; Backtracking</span>@if(p.isDone('dsa-recursion-backtracking')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Arrays &amp; Strings</p>
      <a routerLink="/dsa/arrays" routerLinkActive="active">
        <span class="nl-text">Arrays</span>
        @if(p.isDone('dsa-arrays')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('dsa-arrays'); as arraysSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('dsa-arrays', $event)">
            {{ isSubtopicsExpanded('dsa-arrays') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('dsa-arrays'); as arraysSubs) {
        @if (isSubtopicsExpanded('dsa-arrays')) {
          <div class="nav-subtopics">
            @for (sub of arraysSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/strings" routerLinkActive="active">
        <span class="nl-text">Strings</span>
        @if(p.isDone('dsa-strings')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('strings'); as stringsSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('strings', $event)">
            {{ isSubtopicsExpanded('strings') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('strings'); as stringsSubs) {
        @if (isSubtopicsExpanded('strings')) {
          <div class="nav-subtopics">
            @for (sub of stringsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/hash-tables" routerLinkActive="active">
        <span class="nl-text">Hash Tables</span>
        @if(p.isDone('dsa-hash-tables')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('hash-tables'); as hashSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('hash-tables', $event)">
            {{ isSubtopicsExpanded('hash-tables') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('hash-tables'); as hashSubs) {
        @if (isSubtopicsExpanded('hash-tables')) {
          <div class="nav-subtopics">
            @for (sub of hashSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/stacks-queues" routerLinkActive="active">
        <span class="nl-text">Stacks &amp; Queues</span>
        @if(p.isDone('dsa-stacks-queues')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('stacks-queues'); as sqSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('stacks-queues', $event)">
            {{ isSubtopicsExpanded('stacks-queues') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('stacks-queues'); as sqSubs) {
        @if (isSubtopicsExpanded('stacks-queues')) {
          <div class="nav-subtopics">
            @for (sub of sqSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Linked Lists</p>
      <a routerLink="/dsa/linked-lists" routerLinkActive="active">
        <span class="nl-text">Singly Linked Lists</span>
        @if(p.isDone('dsa-linked-lists')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('linked-lists'); as llSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('linked-lists', $event)">
            {{ isSubtopicsExpanded('linked-lists') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('linked-lists'); as llSubs) {
        @if (isSubtopicsExpanded('linked-lists')) {
          <div class="nav-subtopics">
            @for (sub of llSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/doubly-linked-lists" routerLinkActive="active">
        <span class="nl-text">Doubly Linked Lists</span>
        @if(p.isDone('dsa-doubly-linked-lists')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('doubly-linked-lists'); as dllSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('doubly-linked-lists', $event)">
            {{ isSubtopicsExpanded('doubly-linked-lists') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('doubly-linked-lists'); as dllSubs) {
        @if (isSubtopicsExpanded('doubly-linked-lists')) {
          <div class="nav-subtopics">
            @for (sub of dllSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Trees &amp; Graphs</p>
      <a routerLink="/dsa/binary-trees" routerLinkActive="active">
        <span class="nl-text">Binary Trees</span>
        @if(p.isDone('dsa-binary-trees')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('binary-trees'); as btSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('binary-trees', $event)">
            {{ isSubtopicsExpanded('binary-trees') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('binary-trees'); as btSubs) {
        @if (isSubtopicsExpanded('binary-trees')) {
          <div class="nav-subtopics">
            @for (sub of btSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/bst" routerLinkActive="active">
        <span class="nl-text">Binary Search Trees</span>
        @if(p.isDone('dsa-bst')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('bst'); as bstSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('bst', $event)">
            {{ isSubtopicsExpanded('bst') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('bst'); as bstSubs) {
        @if (isSubtopicsExpanded('bst')) {
          <div class="nav-subtopics">
            @for (sub of bstSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/heaps" routerLinkActive="active">
        <span class="nl-text">Heaps &amp; Priority Queues</span>
        @if(p.isDone('dsa-heaps')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('heaps'); as heapsSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('heaps', $event)">
            {{ isSubtopicsExpanded('heaps') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('heaps'); as heapsSubs) {
        @if (isSubtopicsExpanded('heaps')) {
          <div class="nav-subtopics">
            @for (sub of heapsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/graphs-bfs-dfs" routerLinkActive="active">
        <span class="nl-text">Graphs — BFS &amp; DFS</span>
        @if(p.isDone('dsa-graphs-bfs-dfs')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('graphs-bfs-dfs'); as graphsSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('graphs-bfs-dfs', $event)">
            {{ isSubtopicsExpanded('graphs-bfs-dfs') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('graphs-bfs-dfs'); as graphsSubs) {
        @if (isSubtopicsExpanded('graphs-bfs-dfs')) {
          <div class="nav-subtopics">
            @for (sub of graphsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/dsa/graph-algorithms" routerLinkActive="active">
        <span class="nl-text">Graph Algorithms</span>
        @if(p.isDone('dsa-graph-algorithms')){<span class="nl-done">✓</span>}
        @if (subtopicsOf('graph-algorithms'); as galgoSubs) {
          <button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('graph-algorithms', $event)">
            {{ isSubtopicsExpanded('graph-algorithms') ? '▾' : '▸' }}
          </button>
        }
      </a>
      @if (subtopicsOf('graph-algorithms'); as galgoSubs) {
        @if (isSubtopicsExpanded('graph-algorithms')) {
          <div class="nav-subtopics">
            @for (sub of galgoSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Sorting</p>
      <a routerLink="/dsa/basic-sorts" routerLinkActive="active"><span class="nl-text">Basic Sorts</span>@if(p.isDone('dsa-basic-sorts')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/advanced-sorts" routerLinkActive="active"><span class="nl-text">Merge &amp; Quick Sort</span>@if(p.isDone('dsa-advanced-sorts')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/binary-search" routerLinkActive="active"><span class="nl-text">Binary Search</span>@if(p.isDone('dsa-binary-search')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Dynamic Programming</p>
      <a routerLink="/dsa/dynamic-programming" routerLinkActive="active"><span class="nl-text">Dynamic Programming</span>@if(p.isDone('dsa-dynamic-programming')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/dp-patterns" routerLinkActive="active"><span class="nl-text">DP Patterns</span>@if(p.isDone('dsa-dp-patterns')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/dsa/trie" routerLinkActive="active"><span class="nl-text">Trie</span>@if(p.isDone('dsa-trie')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/bit-manipulation" routerLinkActive="active"><span class="nl-text">Bit Manipulation</span>@if(p.isDone('dsa-bit-manipulation')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/greedy" routerLinkActive="active"><span class="nl-text">Greedy Algorithms</span>@if(p.isDone('dsa-greedy')){<span class="nl-done">✓</span>}</a>
    </div>
  `,
})
export class DsaNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  private expandedTopics = signal<Set<string>>(new Set());

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [slug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(slug));
      }
    }
  }

  subtopicsOf(slug: string) {
    return SUBTOPICS[slug] ?? null;
  }

  isSubtopicsExpanded(slug: string): boolean {
    return this.expandedTopics().has(slug);
  }

  toggleSubtopics(slug: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.expandedTopics.update(set => {
      const next = new Set(set);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }
}
