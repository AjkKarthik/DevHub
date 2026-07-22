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
  selector: 'app-azure-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/azure" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">☁ Azure Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/azure/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Azure Fundamentals</span>
        @if (p.isDone('azure-fundamentals')) {<span class="nl-done">✓</span>}
        @if (d('azure-fundamentals'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('azure-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('azure-fundamentals')"
                  (click)="toggleSubtopics('azure-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('azure-fundamentals'); as fSubs) {
        @if (isSubtopicsExpanded('azure-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/arm" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Azure Resource Manager</span>
        @if (p.isDone('azure-arm')) {<span class="nl-done">✓</span>}
        @if (d('azure-arm'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('arm')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('arm')"
                  (click)="toggleSubtopics('arm', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('arm'); as armSubs) {
        @if (isSubtopicsExpanded('arm')) {
          <div class="nav-subtopics">
            @for (s of armSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/bicep" routerLinkActive="active"><span class="nl-text">Azure Bicep Deep-dive</span>@if(p.isDone('azure-bicep')){<span class="nl-done">✓</span>}@if(d('azure-bicep');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Compute</p>
      <a routerLink="/azure/virtual-machines" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Virtual Machines</span>
        @if (p.isDone('azure-virtual-machines')) {<span class="nl-done">✓</span>}
        @if (d('azure-virtual-machines'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('virtual-machines')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('virtual-machines')"
                  (click)="toggleSubtopics('virtual-machines', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('virtual-machines'); as vmSubs) {
        @if (isSubtopicsExpanded('virtual-machines')) {
          <div class="nav-subtopics">
            @for (s of vmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/app-service" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">App Service</span>
        @if (p.isDone('azure-app-service')) {<span class="nl-done">✓</span>}
        @if (d('azure-app-service'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('app-service')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('app-service')"
                  (click)="toggleSubtopics('app-service', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('app-service'); as asSubs) {
        @if (isSubtopicsExpanded('app-service')) {
          <div class="nav-subtopics">
            @for (s of asSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/functions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Azure Functions</span>
        @if (p.isDone('azure-functions')) {<span class="nl-done">✓</span>}
        @if (d('azure-functions'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('azure-functions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('azure-functions')"
                  (click)="toggleSubtopics('azure-functions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('azure-functions'); as fnSubs) {
        @if (isSubtopicsExpanded('azure-functions')) {
          <div class="nav-subtopics">
            @for (s of fnSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/aks" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">AKS</span>
        @if (p.isDone('azure-aks')) {<span class="nl-done">✓</span>}
        @if (d('azure-aks'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('aks')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('aks')"
                  (click)="toggleSubtopics('aks', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('aks'); as aksSubs) {
        @if (isSubtopicsExpanded('aks')) {
          <div class="nav-subtopics">
            @for (s of aksSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/container-apps" routerLinkActive="active"><span class="nl-text">Container Apps</span>@if(p.isDone('azure-container-apps')){<span class="nl-done">✓</span>}@if(d('azure-container-apps');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Networking</p>
      <a routerLink="/azure/virtual-network" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Virtual Network</span>
        @if (p.isDone('azure-virtual-network')) {<span class="nl-done">✓</span>}
        @if (d('azure-virtual-network'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('virtual-network')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('virtual-network')"
                  (click)="toggleSubtopics('virtual-network', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('virtual-network'); as vnetSubs) {
        @if (isSubtopicsExpanded('virtual-network')) {
          <div class="nav-subtopics">
            @for (s of vnetSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/load-balancer" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Load Balancer &amp; Front Door</span>
        @if (p.isDone('azure-load-balancer')) {<span class="nl-done">✓</span>}
        @if (d('azure-load-balancer'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('load-balancer')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('load-balancer')"
                  (click)="toggleSubtopics('load-balancer', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('load-balancer'); as lbSubs) {
        @if (isSubtopicsExpanded('load-balancer')) {
          <div class="nav-subtopics">
            @for (s of lbSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Storage</p>
      <a routerLink="/azure/storage" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Blob &amp; Storage</span>
        @if (p.isDone('azure-storage')) {<span class="nl-done">✓</span>}
        @if (d('azure-storage'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('azure-storage')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('azure-storage')"
                  (click)="toggleSubtopics('azure-storage', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('azure-storage'); as stSubs) {
        @if (isSubtopicsExpanded('azure-storage')) {
          <div class="nav-subtopics">
            @for (s of stSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Identity</p>
      <a routerLink="/azure/entra-id" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Entra ID (AAD)</span>
        @if (p.isDone('azure-entra-id')) {<span class="nl-done">✓</span>}
        @if (d('azure-entra-id'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('entra-id')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('entra-id')"
                  (click)="toggleSubtopics('entra-id', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('entra-id'); as eidSubs) {
        @if (isSubtopicsExpanded('entra-id')) {
          <div class="nav-subtopics">
            @for (s of eidSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/rbac" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Azure RBAC</span>
        @if (p.isDone('azure-rbac')) {<span class="nl-done">✓</span>}
        @if (d('azure-rbac'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('azure-rbac')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('azure-rbac')"
                  (click)="toggleSubtopics('azure-rbac', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('azure-rbac'); as rbacSubs) {
        @if (isSubtopicsExpanded('azure-rbac')) {
          <div class="nav-subtopics">
            @for (s of rbacSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/azure/key-vault" routerLinkActive="active"><span class="nl-text">Key Vault</span>@if(p.isDone('azure-key-vault')){<span class="nl-done">✓</span>}@if(d('azure-key-vault');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Databases</p>
      <a routerLink="/azure/sql-cosmos" routerLinkActive="active"><span class="nl-text">SQL &amp; Cosmos DB</span>@if(p.isDone('azure-sql-cosmos')){<span class="nl-done">✓</span>}@if(d('azure-sql-cosmos');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/redis" routerLinkActive="active"><span class="nl-text">Cache for Redis</span>@if(p.isDone('azure-redis')){<span class="nl-done">✓</span>}@if(d('azure-redis');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">App Services</p>
      <a routerLink="/azure/monitor" routerLinkActive="active"><span class="nl-text">Monitor &amp; App Insights</span>@if(p.isDone('azure-monitor')){<span class="nl-done">✓</span>}@if(d('azure-monitor');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/devops-pipelines" routerLinkActive="active"><span class="nl-text">DevOps &amp; Pipelines</span>@if(p.isDone('azure-devops-pipelines')){<span class="nl-done">✓</span>}@if(d('azure-devops-pipelines');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/service-bus" routerLinkActive="active"><span class="nl-text">Service Bus</span>@if(p.isDone('azure-service-bus')){<span class="nl-done">✓</span>}@if(d('azure-service-bus');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/api-management" routerLinkActive="active"><span class="nl-text">API Management</span>@if(p.isDone('azure-api-management')){<span class="nl-done">✓</span>}@if(d('azure-api-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/azure/cost-management" routerLinkActive="active"><span class="nl-text">Cost Management</span>@if(p.isDone('azure-cost-management')){<span class="nl-done">✓</span>}@if(d('azure-cost-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/security-defender" routerLinkActive="active"><span class="nl-text">Security &amp; Defender</span>@if(p.isDone('azure-security-defender')){<span class="nl-done">✓</span>}@if(d('azure-security-defender');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/azure/cheatsheet" routerLinkActive="active"><span class="nl-text">Azure Cheat Sheet</span></a>
    </div>
  `,
  styles: []
})
export class AzureNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  d(route: string): string | null { return DIFF[route] ?? null; }

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
