import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';
import { SUBTOPICS } from '../../../data/subtopics';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-mesh-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/service-mesh" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🕸️ Service Mesh Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/service-mesh/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Service Mesh Fundamentals</span>
        @if(p.isDone('mesh-fundamentals')){<span class="nl-done">✓</span>}
        @if(d('mesh-fundamentals');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('mesh-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mesh-fundamentals')"
                  (click)="toggleSubtopics('mesh-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mesh-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('mesh-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/service-mesh/ambient-mesh" routerLinkActive="active"><span class="nl-text">Ambient Mesh</span>@if(p.isDone('mesh-ambient-mesh')){<span class="nl-done">✓</span>}@if(d('mesh-ambient-mesh');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/multi-cluster" routerLinkActive="active"><span class="nl-text">Multi-cluster Mesh</span>@if(p.isDone('mesh-multi-cluster')){<span class="nl-done">✓</span>}@if(d('mesh-multi-cluster');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Istio</p>
      <a routerLink="/service-mesh/istio-architecture" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Istio Architecture</span>
        @if(p.isDone('mesh-istio-architecture')){<span class="nl-done">✓</span>}
        @if(d('mesh-istio-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('istio-architecture')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('istio-architecture')"
                  (click)="toggleSubtopics('istio-architecture', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('istio-architecture'); as istioArchSubs) {
        @if (isSubtopicsExpanded('istio-architecture')) {
          <div class="nav-subtopics">
            @for (s of istioArchSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/service-mesh/istio-install" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Istio Install &amp; Config</span>
        @if(p.isDone('mesh-istio-install')){<span class="nl-done">✓</span>}
        @if(d('mesh-istio-install');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('istio-install')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('istio-install')"
                  (click)="toggleSubtopics('istio-install', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('istio-install'); as istioInstallSubs) {
        @if (isSubtopicsExpanded('istio-install')) {
          <div class="nav-subtopics">
            @for (s of istioInstallSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/service-mesh/envoy" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Envoy Proxy Deep Dive</span>
        @if(p.isDone('mesh-envoy')){<span class="nl-done">✓</span>}
        @if(d('mesh-envoy');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('envoy')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('envoy')"
                  (click)="toggleSubtopics('envoy', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('envoy'); as envoySubs) {
        @if (isSubtopicsExpanded('envoy')) {
          <div class="nav-subtopics">
            @for (s of envoySubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Linkerd</p>
      <a routerLink="/service-mesh/linkerd" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Linkerd</span>
        @if(p.isDone('mesh-linkerd')){<span class="nl-done">✓</span>}
        @if(d('mesh-linkerd');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}
        @if (subtopicsOf('linkerd')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('linkerd')"
                  (click)="toggleSubtopics('linkerd', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('linkerd'); as linkerdSubs) {
        @if (isSubtopicsExpanded('linkerd')) {
          <div class="nav-subtopics">
            @for (s of linkerdSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Traffic</p>
      <a routerLink="/service-mesh/traffic-management" routerLinkActive="active"><span class="nl-text">Traffic Management</span>@if(p.isDone('mesh-traffic-management')){<span class="nl-done">✓</span>}@if(d('mesh-traffic-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/resilience" routerLinkActive="active"><span class="nl-text">Retries, Timeouts &amp; Circuit Breaking</span>@if(p.isDone('mesh-resilience')){<span class="nl-done">✓</span>}@if(d('mesh-resilience');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/load-balancing" routerLinkActive="active"><span class="nl-text">Load Balancing Algorithms</span>@if(p.isDone('mesh-load-balancing')){<span class="nl-done">✓</span>}@if(d('mesh-load-balancing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Security</p>
      <a routerLink="/service-mesh/mtls" routerLinkActive="active"><span class="nl-text">mTLS &amp; Service Identity</span>@if(p.isDone('mesh-mtls')){<span class="nl-done">✓</span>}@if(d('mesh-mtls');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/authorization" routerLinkActive="active"><span class="nl-text">Authorization Policies</span>@if(p.isDone('mesh-authorization')){<span class="nl-done">✓</span>}@if(d('mesh-authorization');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Observability</p>
      <a routerLink="/service-mesh/metrics" routerLinkActive="active"><span class="nl-text">Metrics &amp; Telemetry</span>@if(p.isDone('mesh-metrics')){<span class="nl-done">✓</span>}@if(d('mesh-metrics');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/tracing" routerLinkActive="active"><span class="nl-text">Distributed Tracing</span>@if(p.isDone('mesh-tracing')){<span class="nl-done">✓</span>}@if(d('mesh-tracing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/kiali" routerLinkActive="active"><span class="nl-text">Kiali &amp; Dashboards</span>@if(p.isDone('mesh-kiali')){<span class="nl-done">✓</span>}@if(d('mesh-kiali');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Gateway API</p>
      <a routerLink="/service-mesh/gateway-api" routerLinkActive="active"><span class="nl-text">Kubernetes Gateway API</span>@if(p.isDone('mesh-gateway-api')){<span class="nl-done">✓</span>}@if(d('mesh-gateway-api');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/ingress-gateway" routerLinkActive="active"><span class="nl-text">Ingress Gateway</span>@if(p.isDone('mesh-ingress-gateway')){<span class="nl-done">✓</span>}@if(d('mesh-ingress-gateway');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/service-mesh/performance" routerLinkActive="active"><span class="nl-text">Service Mesh Performance</span>@if(p.isDone('mesh-performance')){<span class="nl-done">✓</span>}@if(d('mesh-performance');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/service-mesh/consul" routerLinkActive="active"><span class="nl-text">Consul Connect</span>@if(p.isDone('mesh-consul')){<span class="nl-done">✓</span>}@if(d('mesh-consul');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/service-mesh/cheatsheet" routerLinkActive="active"><span class="nl-text">Service Mesh Cheat Sheet</span></a>
      <a routerLink="/service-mesh/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
  styles: []
})
export class MeshNavComponent {
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
