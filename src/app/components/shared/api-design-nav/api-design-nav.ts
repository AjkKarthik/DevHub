import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

// Difficulty metadata
const DIFF: Record<string, string> = {
  'api-rest-fundamentals':     'beginner',
  'api-resource-url-design':   'beginner',
  'api-http-methods-status-codes': 'beginner',
  'api-pagination-patterns':   'intermediate',
  'api-api-versioning':        'intermediate',
  'api-error-response-design': 'intermediate',
  'api-hateoas-hypermedia':    'intermediate',
  'api-protocol-buffers':      'intermediate',
  'api-grpc-service-patterns': 'intermediate',
  'api-grpc-web-transcoding':  'intermediate',
  'api-graphql-fundamentals':  'intermediate',
  'api-graphql-vs-rest':       'intermediate',
  'api-websockets-sse-polling':'intermediate',
  'api-webhook-design':        'intermediate',
  'api-api-design-principles': 'intermediate',
  'api-openapi-contracts':     'intermediate',
  'api-api-security':          'advanced',
  'api-breaking-changes':      'advanced',
  'api-rate-limiting':         'intermediate',
};

@Component({
  selector: 'app-api-design-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/api-design" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🔌 API Design Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      @for (item of foundations; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active"
           [routerLinkActiveOptions]="{exact:true}" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
          @if (subtopicsOf(item.path)) {
            <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded(item.path)"
                    (click)="toggleSubtopics(item.path, $event)" aria-label="Toggle subtopics">›</button>
          }
        </a>
        @if (subtopicsOf(item.path); as itemSubs) {
          @if (isSubtopicsExpanded(item.path)) {
            <div class="nav-subtopics">
              @for (s of itemSubs; track s.route) {
                <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                  <span class="nl-text">{{ s.label }}</span>
                </a>
              }
            </div>
          }
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">REST Design</p>
      @for (item of restDesign; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active"
           [routerLinkActiveOptions]="{exact:true}" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
          @if (subtopicsOf(item.path)) {
            <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded(item.path)"
                    (click)="toggleSubtopics(item.path, $event)" aria-label="Toggle subtopics">›</button>
          }
        </a>
        @if (subtopicsOf(item.path); as itemSubs) {
          @if (isSubtopicsExpanded(item.path)) {
            <div class="nav-subtopics">
              @for (s of itemSubs; track s.route) {
                <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                  <span class="nl-text">{{ s.label }}</span>
                </a>
              }
            </div>
          }
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Protocols</p>
      @for (item of protocols; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
          @if (subtopicsOf(item.path)) {
            <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded(item.path)"
                    (click)="toggleSubtopics(item.path, $event)" aria-label="Toggle subtopics">›</button>
          }
        </a>
        @if (subtopicsOf(item.path); as itemSubs) {
          @if (isSubtopicsExpanded(item.path)) {
            <div class="nav-subtopics">
              @for (s of itemSubs; track s.route) {
                <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                  <span class="nl-text">{{ s.label }}</span>
                </a>
              }
            </div>
          }
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">GraphQL & Real-Time</p>
      @for (item of realtime; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
        </a>
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      @for (item of advanced; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
        </a>
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      @for (item of reference; track item.path) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          <span class="nl-text">{{ item.label }}</span>
        </a>
      }
    </div>
  `,
})
export class ApiDesignNavComponent {
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

  foundations = [
    { path: 'rest-fundamentals',        route: 'api-rest-fundamentals',        label: 'REST Fundamentals' },
    { path: 'resource-url-design',      route: 'api-resource-url-design',      label: 'Resource & URL Design' },
    { path: 'http-methods-status-codes',route: 'api-http-methods-status-codes',label: 'HTTP Methods & Status Codes' },
    { path: 'pagination-patterns',      route: 'api-pagination-patterns',      label: 'Pagination Patterns' },
  ];

  restDesign = [
    { path: 'api-versioning',       route: 'api-api-versioning',       label: 'API Versioning' },
    { path: 'error-response-design',route: 'api-error-response-design',label: 'Error Response Design' },
    { path: 'hateoas-hypermedia',   route: 'api-hateoas-hypermedia',   label: 'HATEOAS & Hypermedia' },
    { path: 'api-design-principles',route: 'api-api-design-principles',label: 'API Design Principles' },
    { path: 'openapi-contracts',    route: 'api-openapi-contracts',    label: 'OpenAPI & Contracts' },
  ];

  protocols = [
    { path: 'protocol-buffers',     route: 'api-protocol-buffers',     label: 'Protocol Buffers' },
    { path: 'grpc-service-patterns',route: 'api-grpc-service-patterns',label: 'gRPC Service Patterns' },
    { path: 'grpc-web-transcoding', route: 'api-grpc-web-transcoding', label: 'gRPC-Web & Transcoding' },
  ];

  realtime = [
    { path: 'graphql-fundamentals', route: 'api-graphql-fundamentals', label: 'GraphQL Fundamentals' },
    { path: 'graphql-vs-rest',      route: 'api-graphql-vs-rest',      label: 'GraphQL vs REST' },
    { path: 'websockets-sse-polling',route:'api-websockets-sse-polling',label: 'WebSockets vs SSE vs Polling' },
    { path: 'webhook-design',       route: 'api-webhook-design',       label: 'Webhook Design' },
  ];

  advanced = [
    { path: 'api-security',    route: 'api-api-security',    label: 'API Security' },
    { path: 'breaking-changes',route: 'api-breaking-changes',label: 'Breaking Changes' },
    { path: 'rate-limiting',   route: 'api-rate-limiting',   label: 'Rate Limiting' },
  ];

  reference = [
    { path: 'cheatsheet',    label: 'Cheat Sheet' },
    { path: 'interview-prep',label: 'Interview Prep' },
  ];

  diff(route: string) { return DIFF[route] ?? null; }
}
