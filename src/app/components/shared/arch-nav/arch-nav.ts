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
  selector: 'app-arch-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/arch-patterns" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏛️ Architecture Patterns Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Architectural Styles</p>
      <a routerLink="/arch-patterns/monolith-vs-modular" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Monolith vs Modular Monolith</span>
        @if(p.isDone('arch-monolith-vs-modular')){<span class="nl-done">✓</span>}
        @if(d('arch-monolith-vs-modular');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('monolith-vs-modular')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('monolith-vs-modular')"
                  (click)="toggleSubtopics('monolith-vs-modular', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('monolith-vs-modular'); as mvmSubs) {
        @if (isSubtopicsExpanded('monolith-vs-modular')) {
          <div class="nav-subtopics">
            @for (s of mvmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/layered-architecture" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Layered Architecture</span>
        @if(p.isDone('arch-layered-architecture')){<span class="nl-done">✓</span>}
        @if(d('arch-layered-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('layered-architecture')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('layered-architecture')"
                  (click)="toggleSubtopics('layered-architecture', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('layered-architecture'); as laSubs) {
        @if (isSubtopicsExpanded('layered-architecture')) {
          <div class="nav-subtopics">
            @for (s of laSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/clean-architecture" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Clean / Onion Architecture</span>
        @if(p.isDone('arch-clean-architecture')){<span class="nl-done">✓</span>}
        @if(d('arch-clean-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('arch-clean-architecture')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('arch-clean-architecture')"
                  (click)="toggleSubtopics('arch-clean-architecture', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('arch-clean-architecture'); as caSubs) {
        @if (isSubtopicsExpanded('arch-clean-architecture')) {
          <div class="nav-subtopics">
            @for (s of caSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/hexagonal-architecture" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Hexagonal Architecture</span>
        @if(p.isDone('arch-hexagonal-architecture')){<span class="nl-done">✓</span>}
        @if(d('arch-hexagonal-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('hexagonal-architecture')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('hexagonal-architecture')"
                  (click)="toggleSubtopics('hexagonal-architecture', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('hexagonal-architecture'); as haSubs) {
        @if (isSubtopicsExpanded('hexagonal-architecture')) {
          <div class="nav-subtopics">
            @for (s of haSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/vertical-slice" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Vertical Slice Architecture</span>
        @if(p.isDone('arch-vertical-slice')){<span class="nl-done">✓</span>}
        @if(d('arch-vertical-slice');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('vertical-slice')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('vertical-slice')"
                  (click)="toggleSubtopics('vertical-slice', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('vertical-slice'); as vsSubs) {
        @if (isSubtopicsExpanded('vertical-slice')) {
          <div class="nav-subtopics">
            @for (s of vsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/service-oriented" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Service-Oriented Architecture</span>
        @if(p.isDone('arch-service-oriented')){<span class="nl-done">✓</span>}
        @if(d('arch-service-oriented');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('service-oriented')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('service-oriented')"
                  (click)="toggleSubtopics('service-oriented', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('service-oriented'); as soSubs) {
        @if (isSubtopicsExpanded('service-oriented')) {
          <div class="nav-subtopics">
            @for (s of soSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Microservices</p>
      <a routerLink="/arch-patterns/microservices-principles" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Microservices Principles</span>
        @if(p.isDone('arch-microservices-principles')){<span class="nl-done">✓</span>}
        @if(d('arch-microservices-principles');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('microservices-principles')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('microservices-principles')"
                  (click)="toggleSubtopics('microservices-principles', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('microservices-principles'); as mpSubs) {
        @if (isSubtopicsExpanded('microservices-principles')) {
          <div class="nav-subtopics">
            @for (s of mpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/service-communication" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Service Communication</span>
        @if(p.isDone('arch-service-communication')){<span class="nl-done">✓</span>}
        @if(d('arch-service-communication');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('service-communication')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('service-communication')"
                  (click)="toggleSubtopics('service-communication', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('service-communication'); as scSubs) {
        @if (isSubtopicsExpanded('service-communication')) {
          <div class="nav-subtopics">
            @for (s of scSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/api-gateway-pattern" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">API Gateway Pattern</span>
        @if(p.isDone('arch-api-gateway-pattern')){<span class="nl-done">✓</span>}
        @if(d('arch-api-gateway-pattern');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('api-gateway-pattern')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('api-gateway-pattern')"
                  (click)="toggleSubtopics('api-gateway-pattern', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('api-gateway-pattern'); as agpSubs) {
        @if (isSubtopicsExpanded('api-gateway-pattern')) {
          <div class="nav-subtopics">
            @for (s of agpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/service-discovery" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Service Discovery</span>
        @if(p.isDone('arch-service-discovery')){<span class="nl-done">✓</span>}
        @if(d('arch-service-discovery');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('service-discovery')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('service-discovery')"
                  (click)="toggleSubtopics('service-discovery', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('service-discovery'); as sdSubs) {
        @if (isSubtopicsExpanded('service-discovery')) {
          <div class="nav-subtopics">
            @for (s of sdSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/circuit-breaker" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Circuit Breaker</span>
        @if(p.isDone('arch-circuit-breaker')){<span class="nl-done">✓</span>}
        @if(d('arch-circuit-breaker');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('circuit-breaker')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('circuit-breaker')"
                  (click)="toggleSubtopics('circuit-breaker', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('circuit-breaker'); as cbSubs) {
        @if (isSubtopicsExpanded('circuit-breaker')) {
          <div class="nav-subtopics">
            @for (s of cbSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/sidecar-service-mesh" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Sidecar &amp; Service Mesh</span>
        @if(p.isDone('arch-sidecar-service-mesh')){<span class="nl-done">✓</span>}
        @if(d('arch-sidecar-service-mesh');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('sidecar-service-mesh')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sidecar-service-mesh')"
                  (click)="toggleSubtopics('sidecar-service-mesh', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sidecar-service-mesh'); as ssmSubs) {
        @if (isSubtopicsExpanded('sidecar-service-mesh')) {
          <div class="nav-subtopics">
            @for (s of ssmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Messaging</p>
      <a routerLink="/arch-patterns/event-driven" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Event-Driven Architecture</span>
        @if(p.isDone('arch-event-driven')){<span class="nl-done">✓</span>}
        @if(d('arch-event-driven');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('event-driven')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('event-driven')"
                  (click)="toggleSubtopics('event-driven', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('event-driven'); as edSubs) {
        @if (isSubtopicsExpanded('event-driven')) {
          <div class="nav-subtopics">
            @for (s of edSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/cqrs-event-sourcing" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">CQRS &amp; Event Sourcing</span>
        @if(p.isDone('arch-cqrs-event-sourcing')){<span class="nl-done">✓</span>}
        @if(d('arch-cqrs-event-sourcing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('cqrs-event-sourcing')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('cqrs-event-sourcing')"
                  (click)="toggleSubtopics('cqrs-event-sourcing', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('cqrs-event-sourcing'); as cesSubs) {
        @if (isSubtopicsExpanded('cqrs-event-sourcing')) {
          <div class="nav-subtopics">
            @for (s of cesSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/saga-choreography" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Saga &amp; Choreography</span>
        @if(p.isDone('arch-saga-choreography')){<span class="nl-done">✓</span>}
        @if(d('arch-saga-choreography');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('saga-choreography')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('saga-choreography')"
                  (click)="toggleSubtopics('saga-choreography', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('saga-choreography'); as sagaSubs) {
        @if (isSubtopicsExpanded('saga-choreography')) {
          <div class="nav-subtopics">
            @for (s of sagaSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/inbox-outbox" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Inbox &amp; Outbox Pattern</span>
        @if(p.isDone('arch-inbox-outbox')){<span class="nl-done">✓</span>}
        @if(d('arch-inbox-outbox');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('inbox-outbox')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('inbox-outbox')"
                  (click)="toggleSubtopics('inbox-outbox', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('inbox-outbox'); as ioSubs) {
        @if (isSubtopicsExpanded('inbox-outbox')) {
          <div class="nav-subtopics">
            @for (s of ioSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Domain-Driven Design</p>
      <a routerLink="/arch-patterns/ddd-core" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">DDD Core Concepts</span>
        @if(p.isDone('arch-ddd-core')){<span class="nl-done">✓</span>}
        @if(d('arch-ddd-core');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('ddd-core')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('ddd-core')"
                  (click)="toggleSubtopics('ddd-core', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('ddd-core'); as dddSubs) {
        @if (isSubtopicsExpanded('ddd-core')) {
          <div class="nav-subtopics">
            @for (s of dddSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/bounded-contexts" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Bounded Contexts</span>
        @if(p.isDone('arch-bounded-contexts')){<span class="nl-done">✓</span>}
        @if(d('arch-bounded-contexts');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('bounded-contexts')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('bounded-contexts')"
                  (click)="toggleSubtopics('bounded-contexts', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('bounded-contexts'); as bcSubs) {
        @if (isSubtopicsExpanded('bounded-contexts')) {
          <div class="nav-subtopics">
            @for (s of bcSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/aggregates-domain-events" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Aggregates &amp; Domain Events</span>
        @if(p.isDone('arch-aggregates-domain-events')){<span class="nl-done">✓</span>}
        @if(d('arch-aggregates-domain-events');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('aggregates-domain-events')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('aggregates-domain-events')"
                  (click)="toggleSubtopics('aggregates-domain-events', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('aggregates-domain-events'); as adeSubs) {
        @if (isSubtopicsExpanded('aggregates-domain-events')) {
          <div class="nav-subtopics">
            @for (s of adeSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Integration</p>
      <a routerLink="/arch-patterns/anti-corruption-layer" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Anti-Corruption Layer</span>
        @if(p.isDone('arch-anti-corruption-layer')){<span class="nl-done">✓</span>}
        @if(d('arch-anti-corruption-layer');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('anti-corruption-layer')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('anti-corruption-layer')"
                  (click)="toggleSubtopics('anti-corruption-layer', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('anti-corruption-layer'); as aclSubs) {
        @if (isSubtopicsExpanded('anti-corruption-layer')) {
          <div class="nav-subtopics">
            @for (s of aclSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/strangler-fig" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Strangler Fig Pattern</span>
        @if(p.isDone('arch-strangler-fig')){<span class="nl-done">✓</span>}
        @if(d('arch-strangler-fig');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('strangler-fig')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('strangler-fig')"
                  (click)="toggleSubtopics('strangler-fig', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('strangler-fig'); as sfSubs) {
        @if (isSubtopicsExpanded('strangler-fig')) {
          <div class="nav-subtopics">
            @for (s of sfSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/arch-patterns/backend-for-frontend" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Backend for Frontend (BFF)</span>
        @if(p.isDone('arch-backend-for-frontend')){<span class="nl-done">✓</span>}
        @if(d('arch-backend-for-frontend');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('backend-for-frontend')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('backend-for-frontend')"
                  (click)="toggleSubtopics('backend-for-frontend', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('backend-for-frontend'); as bffSubs) {
        @if (isSubtopicsExpanded('backend-for-frontend')) {
          <div class="nav-subtopics">
            @for (s of bffSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
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
  private router = inject(Router);
  d(route: string) { return DIFF[route] ?? ''; }

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
