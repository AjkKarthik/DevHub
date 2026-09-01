import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-obs-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
<a routerLink="/observability" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
  <span class="nl-text">🏠 Observability Home</span>
</a>

<div class="nav-group">
  <p class="nav-group-label">Core Concepts</p>
  <a routerLink="/observability/observability-fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
    <span class="nl-text">Observability Fundamentals</span>
    @if(progress.isDone('obs-observability-fundamentals')){<span class="nl-done">✓</span>}
    @if (subtopicsOf('observability-fundamentals')) {
      <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('observability-fundamentals')"
              (click)="toggleSubtopics('observability-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
    }
  </a>
  @if (subtopicsOf('observability-fundamentals'); as fundSubs) {
    @if (isSubtopicsExpanded('observability-fundamentals')) {
      <div class="nav-subtopics">
        @for (s of fundSubs; track s.route) {
          <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
            <span class="nl-text">{{ s.label }}</span>
          </a>
        }
      </div>
    }
  }
  <a routerLink="/observability/opentelemetry" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
    <span class="nl-text">OpenTelemetry</span>
    @if(progress.isDone('obs-opentelemetry')){<span class="nl-done">✓</span>}
    @if (subtopicsOf('opentelemetry')) {
      <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('opentelemetry')"
              (click)="toggleSubtopics('opentelemetry', $event)" aria-label="Toggle subtopics">›</button>
    }
  </a>
  @if (subtopicsOf('opentelemetry'); as otelSubs) {
    @if (isSubtopicsExpanded('opentelemetry')) {
      <div class="nav-subtopics">
        @for (s of otelSubs; track s.route) {
          <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
            <span class="nl-text">{{ s.label }}</span>
          </a>
        }
      </div>
    }
  }
  <a routerLink="/observability/sli-slo-sla" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
    <span class="nl-text">SLIs, SLOs &amp; SLAs</span>
    @if(progress.isDone('obs-sli-slo-sla')){<span class="nl-done">✓</span>}
    @if (subtopicsOf('sli-slo-sla')) {
      <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sli-slo-sla')"
              (click)="toggleSubtopics('sli-slo-sla', $event)" aria-label="Toggle subtopics">›</button>
    }
  </a>
  @if (subtopicsOf('sli-slo-sla'); as sloSubs) {
    @if (isSubtopicsExpanded('sli-slo-sla')) {
      <div class="nav-subtopics">
        @for (s of sloSubs; track s.route) {
          <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
            <span class="nl-text">{{ s.label }}</span>
          </a>
        }
      </div>
    }
  }
</div>

<div class="nav-group">
  <p class="nav-group-label">Metrics</p>
  <a routerLink="/observability/prometheus-metrics"        routerLinkActive="active"><span class="nl-text">Prometheus &amp; Metrics</span>@if(progress.isDone('obs-prometheus-metrics')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/grafana-dashboards"        routerLinkActive="active"><span class="nl-text">Grafana Dashboards</span>@if(progress.isDone('obs-grafana-dashboards')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/custom-app-metrics"        routerLinkActive="active"><span class="nl-text">Custom App Metrics</span>@if(progress.isDone('obs-custom-app-metrics')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/infrastructure-metrics"    routerLinkActive="active"><span class="nl-text">Infrastructure Metrics</span>@if(progress.isDone('obs-infrastructure-metrics')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/cloud-native-monitoring"   routerLinkActive="active"><span class="nl-text">Cloud-Native Monitoring</span>@if(progress.isDone('obs-cloud-native-monitoring')){<span class="nl-done">✓</span>}</a>
</div>

<div class="nav-group">
  <p class="nav-group-label">Logging</p>
  <a routerLink="/observability/structured-logging"   routerLinkActive="active"><span class="nl-text">Structured Logging</span>@if(progress.isDone('obs-structured-logging')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/log-aggregation"      routerLinkActive="active"><span class="nl-text">Log Aggregation</span>@if(progress.isDone('obs-log-aggregation')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/log-best-practices"   routerLinkActive="active"><span class="nl-text">Log Best Practices</span>@if(progress.isDone('obs-log-best-practices')){<span class="nl-done">✓</span>}</a>
</div>

<div class="nav-group">
  <p class="nav-group-label">Tracing</p>
  <a routerLink="/observability/distributed-tracing"    routerLinkActive="active"><span class="nl-text">Distributed Tracing</span>@if(progress.isDone('obs-distributed-tracing')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/opentelemetry-tracing"  routerLinkActive="active"><span class="nl-text">OTel Tracing Deep Dive</span>@if(progress.isDone('obs-opentelemetry-tracing')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/performance-profiling"  routerLinkActive="active"><span class="nl-text">Performance Profiling</span>@if(progress.isDone('obs-performance-profiling')){<span class="nl-done">✓</span>}</a>
</div>

<div class="nav-group">
  <p class="nav-group-label">Alerting &amp; SRE</p>
  <a routerLink="/observability/alerting-design"      routerLinkActive="active"><span class="nl-text">Alerting Design</span>@if(progress.isDone('obs-alerting-design')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/on-call-incidents"    routerLinkActive="active"><span class="nl-text">On-Call &amp; Incidents</span>@if(progress.isDone('obs-on-call-incidents')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/error-budgets-toil"   routerLinkActive="active"><span class="nl-text">Error Budgets &amp; Toil</span>@if(progress.isDone('obs-error-budgets-toil')){<span class="nl-done">✓</span>}</a>
</div>

<div class="nav-group">
  <p class="nav-group-label">Advanced</p>
  <a routerLink="/observability/chaos-engineering"      routerLinkActive="active"><span class="nl-text">Chaos Engineering</span>@if(progress.isDone('obs-chaos-engineering')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/ebpf-observability"     routerLinkActive="active"><span class="nl-text">eBPF Observability</span>@if(progress.isDone('obs-ebpf-observability')){<span class="nl-done">✓</span>}</a>
  <a routerLink="/observability/observability-maturity" routerLinkActive="active"><span class="nl-text">Observability Maturity</span>@if(progress.isDone('obs-observability-maturity')){<span class="nl-done">✓</span>}</a>
</div>

<div class="nav-group">
  <p class="nav-group-label">Reference</p>
  <a routerLink="/observability/cheatsheet"    routerLinkActive="active"><span class="nl-text">Cheatsheet</span></a>
  <a routerLink="/observability/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
</div>
`,
})
export class ObsNavComponent {
  progress = inject(ProgressService);
  private router = inject(Router);

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
