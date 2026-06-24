import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-dp-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/design-patterns" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🎨 Design Patterns Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Creational</p>
      <a routerLink="/design-patterns/singleton" routerLinkActive="active"><span class="nl-text">Singleton</span>@if(p.isDone('dp-singleton')){<span class="nl-done">✓</span>}@if(d('dp-singleton');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/factory-method" routerLinkActive="active"><span class="nl-text">Factory Method</span>@if(p.isDone('dp-factory-method')){<span class="nl-done">✓</span>}@if(d('dp-factory-method');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/abstract-factory" routerLinkActive="active"><span class="nl-text">Abstract Factory</span>@if(p.isDone('dp-abstract-factory')){<span class="nl-done">✓</span>}@if(d('dp-abstract-factory');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/builder" routerLinkActive="active"><span class="nl-text">Builder</span>@if(p.isDone('dp-builder')){<span class="nl-done">✓</span>}@if(d('dp-builder');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/prototype" routerLinkActive="active"><span class="nl-text">Prototype</span>@if(p.isDone('dp-prototype')){<span class="nl-done">✓</span>}@if(d('dp-prototype');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/object-pool" routerLinkActive="active"><span class="nl-text">Object Pool</span>@if(p.isDone('dp-object-pool')){<span class="nl-done">✓</span>}@if(d('dp-object-pool');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Structural</p>
      <a routerLink="/design-patterns/adapter" routerLinkActive="active"><span class="nl-text">Adapter</span>@if(p.isDone('dp-adapter')){<span class="nl-done">✓</span>}@if(d('dp-adapter');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/bridge" routerLinkActive="active"><span class="nl-text">Bridge</span>@if(p.isDone('dp-bridge')){<span class="nl-done">✓</span>}@if(d('dp-bridge');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/composite" routerLinkActive="active"><span class="nl-text">Composite</span>@if(p.isDone('dp-composite')){<span class="nl-done">✓</span>}@if(d('dp-composite');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/decorator" routerLinkActive="active"><span class="nl-text">Decorator</span>@if(p.isDone('dp-decorator')){<span class="nl-done">✓</span>}@if(d('dp-decorator');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/facade" routerLinkActive="active"><span class="nl-text">Facade</span>@if(p.isDone('dp-facade')){<span class="nl-done">✓</span>}@if(d('dp-facade');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/flyweight" routerLinkActive="active"><span class="nl-text">Flyweight</span>@if(p.isDone('dp-flyweight')){<span class="nl-done">✓</span>}@if(d('dp-flyweight');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/proxy" routerLinkActive="active"><span class="nl-text">Proxy</span>@if(p.isDone('dp-proxy')){<span class="nl-done">✓</span>}@if(d('dp-proxy');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Behavioral</p>
      <a routerLink="/design-patterns/chain-of-responsibility" routerLinkActive="active"><span class="nl-text">Chain of Responsibility</span>@if(p.isDone('dp-chain-of-responsibility')){<span class="nl-done">✓</span>}@if(d('dp-chain-of-responsibility');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/command" routerLinkActive="active"><span class="nl-text">Command</span>@if(p.isDone('dp-command')){<span class="nl-done">✓</span>}@if(d('dp-command');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/iterator" routerLinkActive="active"><span class="nl-text">Iterator</span>@if(p.isDone('dp-iterator')){<span class="nl-done">✓</span>}@if(d('dp-iterator');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/mediator" routerLinkActive="active"><span class="nl-text">Mediator</span>@if(p.isDone('dp-mediator')){<span class="nl-done">✓</span>}@if(d('dp-mediator');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/memento" routerLinkActive="active"><span class="nl-text">Memento</span>@if(p.isDone('dp-memento')){<span class="nl-done">✓</span>}@if(d('dp-memento');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/observer" routerLinkActive="active"><span class="nl-text">Observer</span>@if(p.isDone('dp-observer')){<span class="nl-done">✓</span>}@if(d('dp-observer');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/state" routerLinkActive="active"><span class="nl-text">State</span>@if(p.isDone('dp-state')){<span class="nl-done">✓</span>}@if(d('dp-state');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/strategy" routerLinkActive="active"><span class="nl-text">Strategy</span>@if(p.isDone('dp-strategy')){<span class="nl-done">✓</span>}@if(d('dp-strategy');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/template-method" routerLinkActive="active"><span class="nl-text">Template Method</span>@if(p.isDone('dp-template-method')){<span class="nl-done">✓</span>}@if(d('dp-template-method');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/visitor" routerLinkActive="active"><span class="nl-text">Visitor</span>@if(p.isDone('dp-visitor')){<span class="nl-done">✓</span>}@if(d('dp-visitor');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/null-object" routerLinkActive="active"><span class="nl-text">Null Object</span>@if(p.isDone('dp-null-object')){<span class="nl-done">✓</span>}@if(d('dp-null-object');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Enterprise</p>
      <a routerLink="/design-patterns/repository" routerLinkActive="active"><span class="nl-text">Repository</span>@if(p.isDone('dp-repository')){<span class="nl-done">✓</span>}@if(d('dp-repository');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/unit-of-work" routerLinkActive="active"><span class="nl-text">Unit of Work</span>@if(p.isDone('dp-unit-of-work')){<span class="nl-done">✓</span>}@if(d('dp-unit-of-work');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/cqrs" routerLinkActive="active"><span class="nl-text">CQRS Pattern</span>@if(p.isDone('dp-cqrs')){<span class="nl-done">✓</span>}@if(d('dp-cqrs');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/event-sourcing" routerLinkActive="active"><span class="nl-text">Event Sourcing</span>@if(p.isDone('dp-event-sourcing')){<span class="nl-done">✓</span>}@if(d('dp-event-sourcing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/saga" routerLinkActive="active"><span class="nl-text">Saga Pattern</span>@if(p.isDone('dp-saga')){<span class="nl-done">✓</span>}@if(d('dp-saga');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/outbox" routerLinkActive="active"><span class="nl-text">Outbox Pattern</span>@if(p.isDone('dp-outbox')){<span class="nl-done">✓</span>}@if(d('dp-outbox');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/specification" routerLinkActive="active"><span class="nl-text">Specification Pattern</span>@if(p.isDone('dp-specification')){<span class="nl-done">✓</span>}@if(d('dp-specification');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/clean-architecture" routerLinkActive="active"><span class="nl-text">Clean Architecture Pattern</span>@if(p.isDone('dp-clean-architecture')){<span class="nl-done">✓</span>}@if(d('dp-clean-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Principles</p>
      <a routerLink="/design-patterns/solid" routerLinkActive="active"><span class="nl-text">SOLID Principles</span>@if(p.isDone('dp-solid')){<span class="nl-done">✓</span>}@if(d('dp-solid');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/grasp" routerLinkActive="active"><span class="nl-text">GRASP Principles</span>@if(p.isDone('dp-grasp')){<span class="nl-done">✓</span>}@if(d('dp-grasp');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/dry-kiss-yagni" routerLinkActive="active"><span class="nl-text">DRY, KISS &amp; YAGNI</span>@if(p.isDone('dp-dry-kiss-yagni')){<span class="nl-done">✓</span>}@if(d('dp-dry-kiss-yagni');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/design-patterns/dependency-inversion" routerLinkActive="active"><span class="nl-text">Dependency Inversion</span>@if(p.isDone('dp-dependency-inversion')){<span class="nl-done">✓</span>}@if(d('dp-dependency-inversion');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/design-patterns/cheatsheet" routerLinkActive="active"><span class="nl-text">Design Patterns Cheat Sheet</span></a>
      <a routerLink="/design-patterns/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
      <a routerLink="/design-patterns/pattern-decision" routerLinkActive="active"><span class="nl-text">Pattern Decision Guide</span></a>
    </div>
  `,
})
export class DpNavComponent {
  p = inject(ProgressService);
  d(route: string) { return DIFF[route] ?? ''; }
}
