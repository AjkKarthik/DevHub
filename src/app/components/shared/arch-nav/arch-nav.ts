import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-arch-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/arch-patterns" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏛️ Architecture Patterns Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Architectural Styles</p>
      <a routerLink="/arch-patterns/monolith-vs-modular" routerLinkActive="active"><span class="nl-text">Monolith vs Modular Monolith</span>@if(p.isDone('arch-monolith-vs-modular')){<span class="nl-done">✓</span>}@if(d('arch-monolith-vs-modular');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/layered-architecture" routerLinkActive="active"><span class="nl-text">Layered Architecture</span>@if(p.isDone('arch-layered-architecture')){<span class="nl-done">✓</span>}@if(d('arch-layered-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/clean-architecture" routerLinkActive="active"><span class="nl-text">Clean / Onion Architecture</span>@if(p.isDone('arch-clean-architecture')){<span class="nl-done">✓</span>}@if(d('arch-clean-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/hexagonal-architecture" routerLinkActive="active"><span class="nl-text">Hexagonal Architecture</span>@if(p.isDone('arch-hexagonal-architecture')){<span class="nl-done">✓</span>}@if(d('arch-hexagonal-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/vertical-slice" routerLinkActive="active"><span class="nl-text">Vertical Slice Architecture</span>@if(p.isDone('arch-vertical-slice')){<span class="nl-done">✓</span>}@if(d('arch-vertical-slice');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/service-oriented" routerLinkActive="active"><span class="nl-text">Service-Oriented Architecture</span>@if(p.isDone('arch-service-oriented')){<span class="nl-done">✓</span>}@if(d('arch-service-oriented');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Microservices</p>
      <a routerLink="/arch-patterns/microservices-principles" routerLinkActive="active"><span class="nl-text">Microservices Principles</span>@if(p.isDone('arch-microservices-principles')){<span class="nl-done">✓</span>}@if(d('arch-microservices-principles');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/service-communication" routerLinkActive="active"><span class="nl-text">Service Communication</span>@if(p.isDone('arch-service-communication')){<span class="nl-done">✓</span>}@if(d('arch-service-communication');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/api-gateway-pattern" routerLinkActive="active"><span class="nl-text">API Gateway Pattern</span>@if(p.isDone('arch-api-gateway-pattern')){<span class="nl-done">✓</span>}@if(d('arch-api-gateway-pattern');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/service-discovery" routerLinkActive="active"><span class="nl-text">Service Discovery</span>@if(p.isDone('arch-service-discovery')){<span class="nl-done">✓</span>}@if(d('arch-service-discovery');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/circuit-breaker" routerLinkActive="active"><span class="nl-text">Circuit Breaker</span>@if(p.isDone('arch-circuit-breaker')){<span class="nl-done">✓</span>}@if(d('arch-circuit-breaker');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/sidecar-service-mesh" routerLinkActive="active"><span class="nl-text">Sidecar &amp; Service Mesh</span>@if(p.isDone('arch-sidecar-service-mesh')){<span class="nl-done">✓</span>}@if(d('arch-sidecar-service-mesh');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Messaging</p>
      <a routerLink="/arch-patterns/event-driven" routerLinkActive="active"><span class="nl-text">Event-Driven Architecture</span>@if(p.isDone('arch-event-driven')){<span class="nl-done">✓</span>}@if(d('arch-event-driven');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/cqrs-event-sourcing" routerLinkActive="active"><span class="nl-text">CQRS &amp; Event Sourcing</span>@if(p.isDone('arch-cqrs-event-sourcing')){<span class="nl-done">✓</span>}@if(d('arch-cqrs-event-sourcing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/saga-choreography" routerLinkActive="active"><span class="nl-text">Saga &amp; Choreography</span>@if(p.isDone('arch-saga-choreography')){<span class="nl-done">✓</span>}@if(d('arch-saga-choreography');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/inbox-outbox" routerLinkActive="active"><span class="nl-text">Inbox &amp; Outbox Pattern</span>@if(p.isDone('arch-inbox-outbox')){<span class="nl-done">✓</span>}@if(d('arch-inbox-outbox');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Domain-Driven Design</p>
      <a routerLink="/arch-patterns/ddd-core" routerLinkActive="active"><span class="nl-text">DDD Core Concepts</span>@if(p.isDone('arch-ddd-core')){<span class="nl-done">✓</span>}@if(d('arch-ddd-core');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/bounded-contexts" routerLinkActive="active"><span class="nl-text">Bounded Contexts</span>@if(p.isDone('arch-bounded-contexts')){<span class="nl-done">✓</span>}@if(d('arch-bounded-contexts');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/aggregates-domain-events" routerLinkActive="active"><span class="nl-text">Aggregates &amp; Domain Events</span>@if(p.isDone('arch-aggregates-domain-events')){<span class="nl-done">✓</span>}@if(d('arch-aggregates-domain-events');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Integration</p>
      <a routerLink="/arch-patterns/anti-corruption-layer" routerLinkActive="active"><span class="nl-text">Anti-Corruption Layer</span>@if(p.isDone('arch-anti-corruption-layer')){<span class="nl-done">✓</span>}@if(d('arch-anti-corruption-layer');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/strangler-fig" routerLinkActive="active"><span class="nl-text">Strangler Fig Pattern</span>@if(p.isDone('arch-strangler-fig')){<span class="nl-done">✓</span>}@if(d('arch-strangler-fig');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/arch-patterns/backend-for-frontend" routerLinkActive="active"><span class="nl-text">Backend for Frontend (BFF)</span>@if(p.isDone('arch-backend-for-frontend')){<span class="nl-done">✓</span>}@if(d('arch-backend-for-frontend');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/arch-patterns/adr" routerLinkActive="active"><span class="nl-text">Architecture Decision Records</span></a>
      <a routerLink="/arch-patterns/pattern-comparison" routerLinkActive="active"><span class="nl-text">Pattern Comparison Guide</span></a>
      <a routerLink="/arch-patterns/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
})
export class ArchNavComponent {
  p = inject(ProgressService);
  d(route: string) { return DIFF[route] ?? ''; }
}
