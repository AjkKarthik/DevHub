import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

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
      <a routerLink="/dsa/big-o" routerLinkActive="active"><span class="nl-text">Big-O Notation</span>@if(p.isDone('dsa-big-o')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/recursion-backtracking" routerLinkActive="active"><span class="nl-text">Recursion &amp; Backtracking</span>@if(p.isDone('dsa-recursion-backtracking')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Arrays &amp; Strings</p>
      <a routerLink="/dsa/arrays" routerLinkActive="active"><span class="nl-text">Arrays</span>@if(p.isDone('dsa-arrays')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/strings" routerLinkActive="active"><span class="nl-text">Strings</span>@if(p.isDone('dsa-strings')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/hash-tables" routerLinkActive="active"><span class="nl-text">Hash Tables</span>@if(p.isDone('dsa-hash-tables')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/stacks-queues" routerLinkActive="active"><span class="nl-text">Stacks &amp; Queues</span>@if(p.isDone('dsa-stacks-queues')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Linked Lists</p>
      <a routerLink="/dsa/linked-lists" routerLinkActive="active"><span class="nl-text">Singly Linked Lists</span>@if(p.isDone('dsa-linked-lists')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/doubly-linked-lists" routerLinkActive="active"><span class="nl-text">Doubly Linked Lists</span>@if(p.isDone('dsa-doubly-linked-lists')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Trees &amp; Graphs</p>
      <a routerLink="/dsa/binary-trees" routerLinkActive="active"><span class="nl-text">Binary Trees</span>@if(p.isDone('dsa-binary-trees')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/bst" routerLinkActive="active"><span class="nl-text">Binary Search Trees</span>@if(p.isDone('dsa-bst')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/heaps" routerLinkActive="active"><span class="nl-text">Heaps &amp; Priority Queues</span>@if(p.isDone('dsa-heaps')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/graphs-bfs-dfs" routerLinkActive="active"><span class="nl-text">Graphs — BFS &amp; DFS</span>@if(p.isDone('dsa-graphs-bfs-dfs')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/dsa/graph-algorithms" routerLinkActive="active"><span class="nl-text">Graph Algorithms</span>@if(p.isDone('dsa-graph-algorithms')){<span class="nl-done">✓</span>}</a>
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
}
