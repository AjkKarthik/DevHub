import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';

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
      <a routerLink="/go/fundamentals" routerLinkActive="active"><span class="nl-text">Go Fundamentals</span>@if(p.isDone('go-fundamentals')){<span class="nl-done">✓</span>}@if(d('go-fundamentals');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/structs-interfaces" routerLinkActive="active"><span class="nl-text">Structs &amp; Interfaces</span>@if(p.isDone('go-structs-interfaces')){<span class="nl-done">✓</span>}@if(d('go-structs-interfaces');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/error-handling" routerLinkActive="active"><span class="nl-text">Error Handling</span>@if(p.isDone('go-error-handling')){<span class="nl-done">✓</span>}@if(d('go-error-handling');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/slices-maps" routerLinkActive="active"><span class="nl-text">Slices &amp; Maps</span>@if(p.isDone('go-slices-maps')){<span class="nl-done">✓</span>}@if(d('go-slices-maps');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/generics" routerLinkActive="active"><span class="nl-text">Go Generics</span>@if(p.isDone('go-generics')){<span class="nl-done">✓</span>}@if(d('go-generics');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Concurrency</p>
      <a routerLink="/go/goroutines" routerLinkActive="active"><span class="nl-text">Goroutines</span>@if(p.isDone('go-goroutines')){<span class="nl-done">✓</span>}@if(d('go-goroutines');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/channels" routerLinkActive="active"><span class="nl-text">Channels</span>@if(p.isDone('go-channels')){<span class="nl-done">✓</span>}@if(d('go-channels');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/go/sync" routerLinkActive="active"><span class="nl-text">sync &amp; sync/atomic</span>@if(p.isDone('go-sync')){<span class="nl-done">✓</span>}@if(d('go-sync');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
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
  d(route: string): string | null { return DIFF[route] ?? null; }
}
