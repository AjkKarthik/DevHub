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
  selector: 'app-containers-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/containers" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">⎈ Containers Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Docker</p>
      <a routerLink="/containers/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Container Fundamentals</span>
        @if (p.isDone('k8s-fundamentals')) {<span class="nl-done">✓</span>}
        @if (d('k8s-fundamentals'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('k8s-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('k8s-fundamentals')"
                  (click)="toggleSubtopics('k8s-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('k8s-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('k8s-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/docker-cli" routerLinkActive="active"><span class="nl-text">Docker CLI</span>@if(p.isDone('k8s-docker-cli')){<span class="nl-done">✓</span>}@if(d('k8s-docker-cli');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/docker-images" routerLinkActive="active"><span class="nl-text">Docker Images &amp; Registry</span>@if(p.isDone('k8s-docker-images')){<span class="nl-done">✓</span>}@if(d('k8s-docker-images');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Dockerfile</p>
      <a routerLink="/containers/dockerfile" routerLinkActive="active"><span class="nl-text">Writing Dockerfiles</span>@if(p.isDone('k8s-dockerfile')){<span class="nl-done">✓</span>}@if(d('k8s-dockerfile');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/multi-stage" routerLinkActive="active"><span class="nl-text">Multi-Stage Builds</span>@if(p.isDone('k8s-multi-stage')){<span class="nl-done">✓</span>}@if(d('k8s-multi-stage');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Compose</p>
      <a routerLink="/containers/compose" routerLinkActive="active"><span class="nl-text">Docker Compose</span>@if(p.isDone('k8s-compose')){<span class="nl-done">✓</span>}@if(d('k8s-compose');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/compose-profiles" routerLinkActive="active"><span class="nl-text">Compose Profiles &amp; Overrides</span>@if(p.isDone('k8s-compose-profiles')){<span class="nl-done">✓</span>}@if(d('k8s-compose-profiles');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Kubernetes</p>
      <a routerLink="/containers/k8s-architecture" routerLinkActive="active"><span class="nl-text">K8s Architecture</span>@if(p.isDone('k8s-architecture')){<span class="nl-done">✓</span>}@if(d('k8s-architecture');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/kubectl" routerLinkActive="active"><span class="nl-text">kubectl Fundamentals</span>@if(p.isDone('k8s-kubectl')){<span class="nl-done">✓</span>}@if(d('k8s-kubectl');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/operators-crds" routerLinkActive="active"><span class="nl-text">Operators &amp; CRDs</span>@if(p.isDone('k8s-operators-crds')){<span class="nl-done">✓</span>}@if(d('k8s-operators-crds');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Workloads</p>
      <a routerLink="/containers/pods-deployments" routerLinkActive="active"><span class="nl-text">Pods &amp; Deployments</span>@if(p.isDone('k8s-pods-deployments')){<span class="nl-done">✓</span>}@if(d('k8s-pods-deployments');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/configmaps-secrets" routerLinkActive="active"><span class="nl-text">ConfigMaps &amp; Secrets</span>@if(p.isDone('k8s-configmaps-secrets')){<span class="nl-done">✓</span>}@if(d('k8s-configmaps-secrets');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/statefulsets" routerLinkActive="active"><span class="nl-text">StatefulSets &amp; DaemonSets</span>@if(p.isDone('k8s-statefulsets')){<span class="nl-done">✓</span>}@if(d('k8s-statefulsets');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/resource-limits" routerLinkActive="active"><span class="nl-text">Resource Requests &amp; Limits</span>@if(p.isDone('k8s-resource-limits')){<span class="nl-done">✓</span>}@if(d('k8s-resource-limits');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/hpa" routerLinkActive="active"><span class="nl-text">Horizontal Pod Autoscaler</span>@if(p.isDone('k8s-hpa')){<span class="nl-done">✓</span>}@if(d('k8s-hpa');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Networking</p>
      <a routerLink="/containers/services-ingress" routerLinkActive="active"><span class="nl-text">Services &amp; Ingress</span>@if(p.isDone('k8s-services-ingress')){<span class="nl-done">✓</span>}@if(d('k8s-services-ingress');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/network-policies" routerLinkActive="active"><span class="nl-text">Network Policies</span>@if(p.isDone('k8s-network-policies')){<span class="nl-done">✓</span>}@if(d('k8s-network-policies');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Storage</p>
      <a routerLink="/containers/storage" routerLinkActive="active"><span class="nl-text">Persistent Volumes &amp; Storage</span>@if(p.isDone('k8s-storage')){<span class="nl-done">✓</span>}@if(d('k8s-storage');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/containers/helm" routerLinkActive="active"><span class="nl-text">Helm</span>@if(p.isDone('k8s-helm')){<span class="nl-done">✓</span>}@if(d('k8s-helm');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/container-security" routerLinkActive="active"><span class="nl-text">Container Security</span>@if(p.isDone('k8s-container-security')){<span class="nl-done">✓</span>}@if(d('k8s-container-security');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/rbac" routerLinkActive="active"><span class="nl-text">Kubernetes RBAC</span>@if(p.isDone('k8s-rbac')){<span class="nl-done">✓</span>}@if(d('k8s-rbac');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/troubleshooting" routerLinkActive="active"><span class="nl-text">K8s Troubleshooting</span>@if(p.isDone('k8s-troubleshooting')){<span class="nl-done">✓</span>}@if(d('k8s-troubleshooting');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
    </div>
  `,
  styles: []
})
export class ContainersNavComponent {
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
