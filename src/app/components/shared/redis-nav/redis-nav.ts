import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

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
      <a routerLink="/redis/fundamentals" routerLinkActive="active"><span class="nl-text">Redis Fundamentals</span>@if(p.isDone('redis-fundamentals')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/installation-setup" routerLinkActive="active"><span class="nl-text">Installation &amp; CLI</span>@if(p.isDone('redis-installation-setup')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Data Structures</p>
      <a routerLink="/redis/strings" routerLinkActive="active"><span class="nl-text">Strings</span>@if(p.isDone('redis-strings')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/hashes" routerLinkActive="active"><span class="nl-text">Hashes</span>@if(p.isDone('redis-hashes')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/lists" routerLinkActive="active"><span class="nl-text">Lists</span>@if(p.isDone('redis-lists')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/sets" routerLinkActive="active"><span class="nl-text">Sets</span>@if(p.isDone('redis-sets')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/sorted-sets" routerLinkActive="active"><span class="nl-text">Sorted Sets</span>@if(p.isDone('redis-sorted-sets')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/redis-stack" routerLinkActive="active"><span class="nl-text">Redis Stack &amp; Modules</span>@if(p.isDone('redis-redis-stack')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Commands</p>
      <a routerLink="/redis/key-commands" routerLinkActive="active"><span class="nl-text">Key Commands</span>@if(p.isDone('redis-key-commands')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/transactions" routerLinkActive="active"><span class="nl-text">Transactions (MULTI/EXEC)</span>@if(p.isDone('redis-transactions')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/lua-scripting" routerLinkActive="active"><span class="nl-text">Lua Scripting</span>@if(p.isDone('redis-lua-scripting')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Persistence</p>
      <a routerLink="/redis/persistence" routerLinkActive="active"><span class="nl-text">Persistence: RDB &amp; AOF</span>@if(p.isDone('redis-persistence')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Pub/Sub &amp; Streams</p>
      <a routerLink="/redis/pub-sub" routerLinkActive="active"><span class="nl-text">Pub/Sub Messaging</span>@if(p.isDone('redis-pub-sub')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/streams" routerLinkActive="active"><span class="nl-text">Redis Streams</span>@if(p.isDone('redis-streams')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Caching</p>
      <a routerLink="/redis/caching-patterns" routerLinkActive="active"><span class="nl-text">Caching Patterns</span>@if(p.isDone('redis-caching-patterns')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/eviction-policies" routerLinkActive="active"><span class="nl-text">Eviction Policies</span>@if(p.isDone('redis-eviction-policies')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/redis/rate-limiting" routerLinkActive="active"><span class="nl-text">Rate Limiting</span>@if(p.isDone('redis-rate-limiting')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Cluster &amp; HA</p>
      <a routerLink="/redis/replication-sentinel" routerLinkActive="active"><span class="nl-text">Replication &amp; Sentinel</span>@if(p.isDone('redis-replication-sentinel')){<span class="nl-done">✓</span>}</a>
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
}
