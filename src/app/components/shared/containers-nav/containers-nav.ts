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
      <a routerLink="/containers/docker-cli" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Docker CLI</span>
        @if (p.isDone('k8s-docker-cli')) {<span class="nl-done">✓</span>}
        @if (d('k8s-docker-cli'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('docker-cli')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('docker-cli')"
                  (click)="toggleSubtopics('docker-cli', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('docker-cli'); as cliSubs) {
        @if (isSubtopicsExpanded('docker-cli')) {
          <div class="nav-subtopics">
            @for (s of cliSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/docker-images" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Docker Images &amp; Registry</span>
        @if (p.isDone('k8s-docker-images')) {<span class="nl-done">✓</span>}
        @if (d('k8s-docker-images'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('docker-images')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('docker-images')"
                  (click)="toggleSubtopics('docker-images', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('docker-images'); as imgSubs) {
        @if (isSubtopicsExpanded('docker-images')) {
          <div class="nav-subtopics">
            @for (s of imgSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Dockerfile</p>
      <a routerLink="/containers/dockerfile" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Writing Dockerfiles</span>
        @if (p.isDone('k8s-dockerfile')) {<span class="nl-done">✓</span>}
        @if (d('k8s-dockerfile'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('dockerfile')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('dockerfile')"
                  (click)="toggleSubtopics('dockerfile', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('dockerfile'); as dfSubs) {
        @if (isSubtopicsExpanded('dockerfile')) {
          <div class="nav-subtopics">
            @for (s of dfSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/multi-stage" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Multi-Stage Builds</span>
        @if (p.isDone('k8s-multi-stage')) {<span class="nl-done">✓</span>}
        @if (d('k8s-multi-stage'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('multi-stage')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('multi-stage')"
                  (click)="toggleSubtopics('multi-stage', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('multi-stage'); as msSubs) {
        @if (isSubtopicsExpanded('multi-stage')) {
          <div class="nav-subtopics">
            @for (s of msSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Compose</p>
      <a routerLink="/containers/compose" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Docker Compose</span>
        @if (p.isDone('k8s-compose')) {<span class="nl-done">✓</span>}
        @if (d('k8s-compose'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('compose')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('compose')"
                  (click)="toggleSubtopics('compose', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('compose'); as composeSubs) {
        @if (isSubtopicsExpanded('compose')) {
          <div class="nav-subtopics">
            @for (s of composeSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/compose-profiles" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Compose Profiles &amp; Overrides</span>
        @if (p.isDone('k8s-compose-profiles')) {<span class="nl-done">✓</span>}
        @if (d('k8s-compose-profiles'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('compose-profiles')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('compose-profiles')"
                  (click)="toggleSubtopics('compose-profiles', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('compose-profiles'); as cpSubs) {
        @if (isSubtopicsExpanded('compose-profiles')) {
          <div class="nav-subtopics">
            @for (s of cpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Kubernetes</p>
      <a routerLink="/containers/k8s-architecture" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">K8s Architecture</span>
        @if (p.isDone('k8s-architecture')) {<span class="nl-done">✓</span>}
        @if (d('k8s-architecture'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('k8s-architecture')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('k8s-architecture')"
                  (click)="toggleSubtopics('k8s-architecture', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('k8s-architecture'); as archSubs) {
        @if (isSubtopicsExpanded('k8s-architecture')) {
          <div class="nav-subtopics">
            @for (s of archSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/kubectl" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">kubectl Fundamentals</span>
        @if (p.isDone('k8s-kubectl')) {<span class="nl-done">✓</span>}
        @if (d('k8s-kubectl'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('kubectl')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('kubectl')"
                  (click)="toggleSubtopics('kubectl', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('kubectl'); as kubectlSubs) {
        @if (isSubtopicsExpanded('kubectl')) {
          <div class="nav-subtopics">
            @for (s of kubectlSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/operators-crds" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Operators &amp; CRDs</span>
        @if (p.isDone('k8s-operators-crds')) {<span class="nl-done">✓</span>}
        @if (d('k8s-operators-crds'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('operators-crds')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('operators-crds')"
                  (click)="toggleSubtopics('operators-crds', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('operators-crds'); as opSubs) {
        @if (isSubtopicsExpanded('operators-crds')) {
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
      <p class="nav-group-label">Workloads</p>
      <a routerLink="/containers/pods-deployments" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Pods &amp; Deployments</span>
        @if (p.isDone('k8s-pods-deployments')) {<span class="nl-done">✓</span>}
        @if (d('k8s-pods-deployments'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('pods-deployments')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('pods-deployments')"
                  (click)="toggleSubtopics('pods-deployments', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('pods-deployments'); as podsSubs) {
        @if (isSubtopicsExpanded('pods-deployments')) {
          <div class="nav-subtopics">
            @for (s of podsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/configmaps-secrets" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">ConfigMaps &amp; Secrets</span>
        @if (p.isDone('k8s-configmaps-secrets')) {<span class="nl-done">✓</span>}
        @if (d('k8s-configmaps-secrets'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('configmaps-secrets')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('configmaps-secrets')"
                  (click)="toggleSubtopics('configmaps-secrets', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('configmaps-secrets'); as cmSubs) {
        @if (isSubtopicsExpanded('configmaps-secrets')) {
          <div class="nav-subtopics">
            @for (s of cmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/statefulsets" routerLinkActive="active"><span class="nl-text">StatefulSets &amp; DaemonSets</span>@if(p.isDone('k8s-statefulsets')){<span class="nl-done">✓</span>}@if(d('k8s-statefulsets');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/resource-limits" routerLinkActive="active"><span class="nl-text">Resource Requests &amp; Limits</span>@if(p.isDone('k8s-resource-limits')){<span class="nl-done">✓</span>}@if(d('k8s-resource-limits');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/containers/hpa" routerLinkActive="active"><span class="nl-text">Horizontal Pod Autoscaler</span>@if(p.isDone('k8s-hpa')){<span class="nl-done">✓</span>}@if(d('k8s-hpa');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Networking</p>
      <a routerLink="/containers/services-ingress" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Services &amp; Ingress</span>
        @if (p.isDone('k8s-services-ingress')) {<span class="nl-done">✓</span>}
        @if (d('k8s-services-ingress'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('services-ingress')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('services-ingress')"
                  (click)="toggleSubtopics('services-ingress', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('services-ingress'); as svcSubs) {
        @if (isSubtopicsExpanded('services-ingress')) {
          <div class="nav-subtopics">
            @for (s of svcSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/network-policies" routerLinkActive="active"><span class="nl-text">Network Policies</span>@if(p.isDone('k8s-network-policies')){<span class="nl-done">✓</span>}@if(d('k8s-network-policies');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Storage</p>
      <a routerLink="/containers/storage" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Persistent Volumes &amp; Storage</span>
        @if (p.isDone('k8s-storage')) {<span class="nl-done">✓</span>}
        @if (d('k8s-storage'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('storage')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('storage')"
                  (click)="toggleSubtopics('storage', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('storage'); as storageSubs) {
        @if (isSubtopicsExpanded('storage')) {
          <div class="nav-subtopics">
            @for (s of storageSubs; track s.route) {
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
      <a routerLink="/containers/helm" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Helm</span>
        @if (p.isDone('k8s-helm')) {<span class="nl-done">✓</span>}
        @if (d('k8s-helm'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('helm')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('helm')"
                  (click)="toggleSubtopics('helm', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('helm'); as helmSubs) {
        @if (isSubtopicsExpanded('helm')) {
          <div class="nav-subtopics">
            @for (s of helmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/containers/container-security" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Container Security</span>
        @if (p.isDone('k8s-container-security')) {<span class="nl-done">✓</span>}
        @if (d('k8s-container-security'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('container-security')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('container-security')"
                  (click)="toggleSubtopics('container-security', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('container-security'); as secSubs) {
        @if (isSubtopicsExpanded('container-security')) {
          <div class="nav-subtopics">
            @for (s of secSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
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
