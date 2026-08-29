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
  selector: 'app-dp-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/design-patterns" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🎨 Design Patterns Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Creational</p>
      <a routerLink="/design-patterns/singleton" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Singleton</span>
        @if(p.isDone('dp-singleton')){<span class="nl-done">✓</span>}
        @if(d('dp-singleton');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('singleton')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('singleton')"
                  (click)="toggleSubtopics('singleton', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('singleton'); as sgSubs) {
        @if (isSubtopicsExpanded('singleton')) {
          <div class="nav-subtopics">
            @for (s of sgSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/factory-method" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Factory Method</span>
        @if(p.isDone('dp-factory-method')){<span class="nl-done">✓</span>}
        @if(d('dp-factory-method');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('factory-method')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('factory-method')"
                  (click)="toggleSubtopics('factory-method', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('factory-method'); as fmSubs) {
        @if (isSubtopicsExpanded('factory-method')) {
          <div class="nav-subtopics">
            @for (s of fmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/abstract-factory" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Abstract Factory</span>
        @if(p.isDone('dp-abstract-factory')){<span class="nl-done">✓</span>}
        @if(d('dp-abstract-factory');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('abstract-factory')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('abstract-factory')"
                  (click)="toggleSubtopics('abstract-factory', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('abstract-factory'); as afSubs) {
        @if (isSubtopicsExpanded('abstract-factory')) {
          <div class="nav-subtopics">
            @for (s of afSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/builder" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Builder</span>
        @if(p.isDone('dp-builder')){<span class="nl-done">✓</span>}
        @if(d('dp-builder');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('builder')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('builder')"
                  (click)="toggleSubtopics('builder', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('builder'); as blSubs) {
        @if (isSubtopicsExpanded('builder')) {
          <div class="nav-subtopics">
            @for (s of blSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/prototype" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Prototype</span>
        @if(p.isDone('dp-prototype')){<span class="nl-done">✓</span>}
        @if(d('dp-prototype');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('prototype')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('prototype')"
                  (click)="toggleSubtopics('prototype', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('prototype'); as ptSubs) {
        @if (isSubtopicsExpanded('prototype')) {
          <div class="nav-subtopics">
            @for (s of ptSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/object-pool" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Object Pool</span>
        @if(p.isDone('dp-object-pool')){<span class="nl-done">✓</span>}
        @if(d('dp-object-pool');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('object-pool')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('object-pool')"
                  (click)="toggleSubtopics('object-pool', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('object-pool'); as opSubs) {
        @if (isSubtopicsExpanded('object-pool')) {
          <div class="nav-subtopics">
            @for (s of opSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Structural</p>
      <a routerLink="/design-patterns/adapter" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Adapter</span>
        @if(p.isDone('dp-adapter')){<span class="nl-done">✓</span>}
        @if(d('dp-adapter');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('adapter')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('adapter')"
                  (click)="toggleSubtopics('adapter', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('adapter'); as adSubs) {
        @if (isSubtopicsExpanded('adapter')) {
          <div class="nav-subtopics">
            @for (s of adSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/bridge" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Bridge</span>
        @if(p.isDone('dp-bridge')){<span class="nl-done">✓</span>}
        @if(d('dp-bridge');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('bridge')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('bridge')"
                  (click)="toggleSubtopics('bridge', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('bridge'); as brSubs) {
        @if (isSubtopicsExpanded('bridge')) {
          <div class="nav-subtopics">
            @for (s of brSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/composite" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Composite</span>
        @if(p.isDone('dp-composite')){<span class="nl-done">✓</span>}
        @if(d('dp-composite');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('composite')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('composite')"
                  (click)="toggleSubtopics('composite', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('composite'); as cpSubs) {
        @if (isSubtopicsExpanded('composite')) {
          <div class="nav-subtopics">
            @for (s of cpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/decorator" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Decorator</span>
        @if(p.isDone('dp-decorator')){<span class="nl-done">✓</span>}
        @if(d('dp-decorator');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('decorator')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('decorator')"
                  (click)="toggleSubtopics('decorator', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('decorator'); as dcSubs) {
        @if (isSubtopicsExpanded('decorator')) {
          <div class="nav-subtopics">
            @for (s of dcSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/facade" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Facade</span>
        @if(p.isDone('dp-facade')){<span class="nl-done">✓</span>}
        @if(d('dp-facade');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('facade')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('facade')"
                  (click)="toggleSubtopics('facade', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('facade'); as fcSubs) {
        @if (isSubtopicsExpanded('facade')) {
          <div class="nav-subtopics">
            @for (s of fcSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/flyweight" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Flyweight</span>
        @if(p.isDone('dp-flyweight')){<span class="nl-done">✓</span>}
        @if(d('dp-flyweight');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('flyweight')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('flyweight')"
                  (click)="toggleSubtopics('flyweight', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('flyweight'); as fwSubs) {
        @if (isSubtopicsExpanded('flyweight')) {
          <div class="nav-subtopics">
            @for (s of fwSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/proxy" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Proxy</span>
        @if(p.isDone('dp-proxy')){<span class="nl-done">✓</span>}
        @if(d('dp-proxy');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('dp-proxy')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('dp-proxy')"
                  (click)="toggleSubtopics('dp-proxy', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('dp-proxy'); as pxSubs) {
        @if (isSubtopicsExpanded('dp-proxy')) {
          <div class="nav-subtopics">
            @for (s of pxSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Behavioral</p>
      <a routerLink="/design-patterns/chain-of-responsibility" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Chain of Responsibility</span>
        @if(p.isDone('dp-chain-of-responsibility')){<span class="nl-done">✓</span>}
        @if(d('dp-chain-of-responsibility');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('chain-of-responsibility')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('chain-of-responsibility')"
                  (click)="toggleSubtopics('chain-of-responsibility', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('chain-of-responsibility'); as corSubs) {
        @if (isSubtopicsExpanded('chain-of-responsibility')) {
          <div class="nav-subtopics">
            @for (s of corSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/command" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Command</span>
        @if(p.isDone('dp-command')){<span class="nl-done">✓</span>}
        @if(d('dp-command');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('command')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('command')"
                  (click)="toggleSubtopics('command', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('command'); as cmSubs) {
        @if (isSubtopicsExpanded('command')) {
          <div class="nav-subtopics">
            @for (s of cmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/iterator" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Iterator</span>
        @if(p.isDone('dp-iterator')){<span class="nl-done">✓</span>}
        @if(d('dp-iterator');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('iterator')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('iterator')"
                  (click)="toggleSubtopics('iterator', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('iterator'); as itSubs) {
        @if (isSubtopicsExpanded('iterator')) {
          <div class="nav-subtopics">
            @for (s of itSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/mediator" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Mediator</span>
        @if(p.isDone('dp-mediator')){<span class="nl-done">✓</span>}
        @if(d('dp-mediator');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('mediator')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mediator')"
                  (click)="toggleSubtopics('mediator', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mediator'); as medSubs) {
        @if (isSubtopicsExpanded('mediator')) {
          <div class="nav-subtopics">
            @for (s of medSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/memento" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Memento</span>
        @if(p.isDone('dp-memento')){<span class="nl-done">✓</span>}
        @if(d('dp-memento');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('memento')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('memento')"
                  (click)="toggleSubtopics('memento', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('memento'); as memSubs) {
        @if (isSubtopicsExpanded('memento')) {
          <div class="nav-subtopics">
            @for (s of memSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/observer" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Observer</span>
        @if(p.isDone('dp-observer')){<span class="nl-done">✓</span>}
        @if(d('dp-observer');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('observer')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('observer')"
                  (click)="toggleSubtopics('observer', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('observer'); as obsSubs) {
        @if (isSubtopicsExpanded('observer')) {
          <div class="nav-subtopics">
            @for (s of obsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/state" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">State</span>
        @if(p.isDone('dp-state')){<span class="nl-done">✓</span>}
        @if(d('dp-state');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('dp-state')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('dp-state')"
                  (click)="toggleSubtopics('dp-state', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('dp-state'); as stSubs) {
        @if (isSubtopicsExpanded('dp-state')) {
          <div class="nav-subtopics">
            @for (s of stSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/strategy" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Strategy</span>
        @if(p.isDone('dp-strategy')){<span class="nl-done">✓</span>}
        @if(d('dp-strategy');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('strategy')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('strategy')"
                  (click)="toggleSubtopics('strategy', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('strategy'); as strSubs) {
        @if (isSubtopicsExpanded('strategy')) {
          <div class="nav-subtopics">
            @for (s of strSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/template-method" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Template Method</span>
        @if(p.isDone('dp-template-method')){<span class="nl-done">✓</span>}
        @if(d('dp-template-method');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('template-method')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('template-method')"
                  (click)="toggleSubtopics('template-method', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('template-method'); as tmSubs) {
        @if (isSubtopicsExpanded('template-method')) {
          <div class="nav-subtopics">
            @for (s of tmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/visitor" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Visitor</span>
        @if(p.isDone('dp-visitor')){<span class="nl-done">✓</span>}
        @if(d('dp-visitor');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('visitor')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('visitor')"
                  (click)="toggleSubtopics('visitor', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('visitor'); as visSubs) {
        @if (isSubtopicsExpanded('visitor')) {
          <div class="nav-subtopics">
            @for (s of visSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/null-object" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Null Object</span>
        @if(p.isDone('dp-null-object')){<span class="nl-done">✓</span>}
        @if(d('dp-null-object');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('null-object')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('null-object')"
                  (click)="toggleSubtopics('null-object', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('null-object'); as noSubs) {
        @if (isSubtopicsExpanded('null-object')) {
          <div class="nav-subtopics">
            @for (s of noSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Enterprise</p>
      <a routerLink="/design-patterns/repository" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Repository</span>
        @if(p.isDone('dp-repository')){<span class="nl-done">✓</span>}
        @if(d('dp-repository');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('repository')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('repository')"
                  (click)="toggleSubtopics('repository', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('repository'); as repoSubs) {
        @if (isSubtopicsExpanded('repository')) {
          <div class="nav-subtopics">
            @for (s of repoSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/unit-of-work" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Unit of Work</span>
        @if(p.isDone('dp-unit-of-work')){<span class="nl-done">✓</span>}
        @if(d('dp-unit-of-work');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('unit-of-work')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('unit-of-work')"
                  (click)="toggleSubtopics('unit-of-work', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('unit-of-work'); as uowSubs) {
        @if (isSubtopicsExpanded('unit-of-work')) {
          <div class="nav-subtopics">
            @for (s of uowSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/cqrs" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">CQRS Pattern</span>
        @if(p.isDone('dp-cqrs')){<span class="nl-done">✓</span>}
        @if(d('dp-cqrs');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('cqrs')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('cqrs')"
                  (click)="toggleSubtopics('cqrs', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('cqrs'); as cqrsSubs) {
        @if (isSubtopicsExpanded('cqrs')) {
          <div class="nav-subtopics">
            @for (s of cqrsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/design-patterns/event-sourcing" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Event Sourcing</span>
        @if(p.isDone('dp-event-sourcing')){<span class="nl-done">✓</span>}
        @if(d('dp-event-sourcing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('event-sourcing')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('event-sourcing')"
                  (click)="toggleSubtopics('event-sourcing', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('event-sourcing'); as esSubs) {
        @if (isSubtopicsExpanded('event-sourcing')) {
          <div class="nav-subtopics">
            @for (s of esSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
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
