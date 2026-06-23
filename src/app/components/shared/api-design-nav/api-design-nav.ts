import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProgressService } from '../../../services/progress.service';

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
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
        </a>
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">REST Design</p>
      @for (item of restDesign; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
        </a>
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Protocols</p>
      @for (item of protocols; track item.route) {
        <a [routerLink]="'/api-design/' + item.path" routerLinkActive="active" class="nav-link">
          @if (progress.isDone(item.route)) { <span class="nl-done">✓</span> }
          <span class="nl-text">{{ item.label }}</span>
          @if (diff(item.route); as d) { <span class="nl-dot" [class]="d"></span> }
        </a>
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
