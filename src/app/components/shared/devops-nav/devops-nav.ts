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
  selector: 'app-devops-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/devops" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🔧 DevOps Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/devops/culture" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">DevOps Culture</span>
        @if (p.isDone('devops-culture')) {<span class="nl-done">✓</span>}
        @if (d('devops-culture'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('culture')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('culture')"
                  (click)="toggleSubtopics('culture', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('culture'); as cultureSubs) {
        @if (isSubtopicsExpanded('culture')) {
          <div class="nav-subtopics">
            @for (s of cultureSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/sdlc-agile" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">SDLC &amp; Agile</span>
        @if (p.isDone('devops-sdlc-agile')) {<span class="nl-done">✓</span>}
        @if (d('devops-sdlc-agile'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('sdlc-agile')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sdlc-agile')"
                  (click)="toggleSubtopics('sdlc-agile', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sdlc-agile'); as sdlcSubs) {
        @if (isSubtopicsExpanded('sdlc-agile')) {
          <div class="nav-subtopics">
            @for (s of sdlcSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/environment-strategy" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Environment Strategy</span>
        @if (p.isDone('devops-environment-strategy')) {<span class="nl-done">✓</span>}
        @if (d('devops-environment-strategy'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('environment-strategy')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('environment-strategy')"
                  (click)="toggleSubtopics('environment-strategy', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('environment-strategy'); as envSubs) {
        @if (isSubtopicsExpanded('environment-strategy')) {
          <div class="nav-subtopics">
            @for (s of envSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/platform-engineering" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Platform Engineering</span>
        @if (p.isDone('devops-platform-engineering')) {<span class="nl-done">✓</span>}
        @if (d('devops-platform-engineering'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('platform-engineering')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('platform-engineering')"
                  (click)="toggleSubtopics('platform-engineering', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('platform-engineering'); as platformSubs) {
        @if (isSubtopicsExpanded('platform-engineering')) {
          <div class="nav-subtopics">
            @for (s of platformSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Source Control</p>
      <a routerLink="/devops/git-workflows" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Git Workflows</span>
        @if (p.isDone('devops-git-workflows')) {<span class="nl-done">✓</span>}
        @if (d('devops-git-workflows'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('git-workflows')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('git-workflows')"
                  (click)="toggleSubtopics('git-workflows', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('git-workflows'); as gitSubs) {
        @if (isSubtopicsExpanded('git-workflows')) {
          <div class="nav-subtopics">
            @for (s of gitSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">CI/CD</p>
      <a routerLink="/devops/github-actions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">GitHub Actions</span>
        @if (p.isDone('devops-github-actions')) {<span class="nl-done">✓</span>}
        @if (d('devops-github-actions'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('github-actions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('github-actions')"
                  (click)="toggleSubtopics('github-actions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('github-actions'); as ghaSubs) {
        @if (isSubtopicsExpanded('github-actions')) {
          <div class="nav-subtopics">
            @for (s of ghaSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/azure-pipelines" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Azure DevOps Pipelines</span>
        @if (p.isDone('devops-azure-pipelines')) {<span class="nl-done">✓</span>}
        @if (d('devops-azure-pipelines'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('azure-pipelines')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('azure-pipelines')"
                  (click)="toggleSubtopics('azure-pipelines', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('azure-pipelines'); as apSubs) {
        @if (isSubtopicsExpanded('azure-pipelines')) {
          <div class="nav-subtopics">
            @for (s of apSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/jenkins" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Jenkins</span>
        @if (p.isDone('devops-jenkins')) {<span class="nl-done">✓</span>}
        @if (d('devops-jenkins'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('jenkins')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('jenkins')"
                  (click)="toggleSubtopics('jenkins', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('jenkins'); as jenkinsSubs) {
        @if (isSubtopicsExpanded('jenkins')) {
          <div class="nav-subtopics">
            @for (s of jenkinsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/continuous-integration" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Continuous Integration</span>
        @if (p.isDone('devops-continuous-integration')) {<span class="nl-done">✓</span>}
        @if (d('devops-continuous-integration'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('continuous-integration')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('continuous-integration')"
                  (click)="toggleSubtopics('continuous-integration', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('continuous-integration'); as ciSubs) {
        @if (isSubtopicsExpanded('continuous-integration')) {
          <div class="nav-subtopics">
            @for (s of ciSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/devops/continuous-delivery" routerLinkActive="active"><span class="nl-text">Continuous Delivery</span>@if(p.isDone('devops-continuous-delivery')){<span class="nl-done">✓</span>}@if(d('devops-continuous-delivery');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/devops/gitops" routerLinkActive="active"><span class="nl-text">GitOps (ArgoCD &amp; Flux)</span>@if(p.isDone('devops-gitops')){<span class="nl-done">✓</span>}@if(d('devops-gitops');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/devops/artifact-management" routerLinkActive="active"><span class="nl-text">Artifact Management</span>@if(p.isDone('devops-artifact-management')){<span class="nl-done">✓</span>}@if(d('devops-artifact-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Containers</p>
      <a routerLink="/devops/docker-cicd" routerLinkActive="active"><span class="nl-text">Docker in CI/CD</span>@if(p.isDone('devops-docker-cicd')){<span class="nl-done">✓</span>}@if(d('devops-docker-cicd');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/devops/kubernetes-deployments" routerLinkActive="active"><span class="nl-text">Kubernetes Deployments</span>@if(p.isDone('devops-kubernetes-deployments')){<span class="nl-done">✓</span>}@if(d('devops-kubernetes-deployments');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">IaC</p>
      <a routerLink="/devops/iac" routerLinkActive="active"><span class="nl-text">Infrastructure as Code</span>@if(p.isDone('devops-iac')){<span class="nl-done">✓</span>}@if(d('devops-iac');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Monitoring</p>
      <a routerLink="/devops/monitoring" routerLinkActive="active"><span class="nl-text">Monitoring &amp; Alerting</span>@if(p.isDone('devops-monitoring')){<span class="nl-done">✓</span>}@if(d('devops-monitoring');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/devops/logging" routerLinkActive="active"><span class="nl-text">Logging Pipelines</span>@if(p.isDone('devops-logging')){<span class="nl-done">✓</span>}@if(d('devops-logging');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/devops/incident-response" routerLinkActive="active"><span class="nl-text">On-call &amp; Incident Response</span>@if(p.isDone('devops-incident-response')){<span class="nl-done">✓</span>}@if(d('devops-incident-response');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Security</p>
      <a routerLink="/devops/devsecops" routerLinkActive="active"><span class="nl-text">DevSecOps</span>@if(p.isDone('devops-devsecops')){<span class="nl-done">✓</span>}@if(d('devops-devsecops');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/devops/release-management" routerLinkActive="active"><span class="nl-text">Release Management</span>@if(p.isDone('devops-release-management')){<span class="nl-done">✓</span>}@if(d('devops-release-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/devops/sre" routerLinkActive="active"><span class="nl-text">SRE Practices</span>@if(p.isDone('devops-sre')){<span class="nl-done">✓</span>}@if(d('devops-sre');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/devops/cheatsheet" routerLinkActive="active"><span class="nl-text">Cheat Sheet</span></a>
    </div>
  `,
  styles: []
})
export class DevopsNavComponent {
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
