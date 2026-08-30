import { Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SearchService, SEARCH_INDEX } from '../../../services/search.service';
import { SUBTOPICS } from '../../../data/subtopics';

const DIFF: Record<string, string> = Object.fromEntries(SEARCH_INDEX.map(e => [e.route, e.difficulty]));

@Component({
  selector: 'app-security-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/security" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 Security Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/security/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Security Fundamentals</span>
        @if(progress.isDone('sec-fundamentals')){<span class="nl-done">✓</span>}
        @if(d('sec-fundamentals');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('sec-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sec-fundamentals')"
                  (click)="toggleSubtopics('sec-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sec-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('sec-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/owasp-top-10" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">OWASP Top 10</span>
        @if(progress.isDone('sec-owasp-top-10')){<span class="nl-done">✓</span>}
        @if(d('sec-owasp-top-10');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('owasp-top-10')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('owasp-top-10')"
                  (click)="toggleSubtopics('owasp-top-10', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('owasp-top-10'); as owaspSubs) {
        @if (isSubtopicsExpanded('owasp-top-10')) {
          <div class="nav-subtopics">
            @for (s of owaspSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/threat-modelling" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Threat Modelling</span>
        @if(progress.isDone('sec-threat-modelling')){<span class="nl-done">✓</span>}
        @if(d('sec-threat-modelling');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('threat-modelling')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('threat-modelling')"
                  (click)="toggleSubtopics('threat-modelling', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('threat-modelling'); as tmSubs) {
        @if (isSubtopicsExpanded('threat-modelling')) {
          <div class="nav-subtopics">
            @for (s of tmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/secure-coding" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Secure Coding</span>
        @if(progress.isDone('sec-secure-coding')){<span class="nl-done">✓</span>}
        @if(d('sec-secure-coding');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('secure-coding')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('secure-coding')"
                  (click)="toggleSubtopics('secure-coding', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('secure-coding'); as scSubs) {
        @if (isSubtopicsExpanded('secure-coding')) {
          <div class="nav-subtopics">
            @for (s of scSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Identity &amp; Auth</p>
      <a routerLink="/security/password-security" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Password Security</span>
        @if(progress.isDone('sec-password-security')){<span class="nl-done">✓</span>}
        @if(d('sec-password-security');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('password-security')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('password-security')"
                  (click)="toggleSubtopics('password-security', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('password-security'); as psSubs) {
        @if (isSubtopicsExpanded('password-security')) {
          <div class="nav-subtopics">
            @for (s of psSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/oauth-oidc" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">OAuth 2.0 &amp; OIDC</span>
        @if(progress.isDone('sec-oauth-oidc')){<span class="nl-done">✓</span>}
        @if(d('sec-oauth-oidc');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('oauth-oidc')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('oauth-oidc')"
                  (click)="toggleSubtopics('oauth-oidc', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('oauth-oidc'); as oauthSubs) {
        @if (isSubtopicsExpanded('oauth-oidc')) {
          <div class="nav-subtopics">
            @for (s of oauthSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/jwt" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">JSON Web Tokens</span>
        @if(progress.isDone('sec-jwt')){<span class="nl-done">✓</span>}
        @if(d('sec-jwt');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('jwt')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('jwt')"
                  (click)="toggleSubtopics('jwt', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('jwt'); as jwtSubs) {
        @if (isSubtopicsExpanded('jwt')) {
          <div class="nav-subtopics">
            @for (s of jwtSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/mfa" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Multi-Factor Auth</span>
        @if(progress.isDone('sec-mfa')){<span class="nl-done">✓</span>}
        @if(d('sec-mfa');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('mfa')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('mfa')"
                  (click)="toggleSubtopics('mfa', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('mfa'); as mfaSubs) {
        @if (isSubtopicsExpanded('mfa')) {
          <div class="nav-subtopics">
            @for (s of mfaSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/sso" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Single Sign-On</span>
        @if(progress.isDone('sec-sso')){<span class="nl-done">✓</span>}
        @if(d('sec-sso');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('sso')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sso')"
                  (click)="toggleSubtopics('sso', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sso'); as ssoSubs) {
        @if (isSubtopicsExpanded('sso')) {
          <div class="nav-subtopics">
            @for (s of ssoSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/rbac-abac" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">RBAC &amp; ABAC</span>
        @if(progress.isDone('sec-rbac-abac')){<span class="nl-done">✓</span>}
        @if(d('sec-rbac-abac');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('rbac-abac')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('rbac-abac')"
                  (click)="toggleSubtopics('rbac-abac', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('rbac-abac'); as rbacSubs) {
        @if (isSubtopicsExpanded('rbac-abac')) {
          <div class="nav-subtopics">
            @for (s of rbacSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/claims-identity" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Claims &amp; Identity</span>
        @if(progress.isDone('sec-claims-identity')){<span class="nl-done">✓</span>}
        @if(d('sec-claims-identity');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('claims-identity')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('claims-identity')"
                  (click)="toggleSubtopics('claims-identity', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('claims-identity'); as claimsSubs) {
        @if (isSubtopicsExpanded('claims-identity')) {
          <div class="nav-subtopics">
            @for (s of claimsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/api-security" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">API Security</span>
        @if(progress.isDone('sec-api-security')){<span class="nl-done">✓</span>}
        @if(d('sec-api-security');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('sec-api-security')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('sec-api-security')"
                  (click)="toggleSubtopics('sec-api-security', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('sec-api-security'); as apiSecSubs) {
        @if (isSubtopicsExpanded('sec-api-security')) {
          <div class="nav-subtopics">
            @for (s of apiSecSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Web Attacks</p>
      <a routerLink="/security/xss" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Cross-Site Scripting</span>
        @if(progress.isDone('sec-xss')){<span class="nl-done">✓</span>}
        @if(d('sec-xss');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('xss')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('xss')"
                  (click)="toggleSubtopics('xss', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('xss'); as xssSubs) {
        @if (isSubtopicsExpanded('xss')) {
          <div class="nav-subtopics">
            @for (s of xssSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/csrf-clickjacking" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">CSRF &amp; Clickjacking</span>
        @if(progress.isDone('sec-csrf-clickjacking')){<span class="nl-done">✓</span>}
        @if(d('sec-csrf-clickjacking');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}
        @if (subtopicsOf('csrf-clickjacking')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('csrf-clickjacking')"
                  (click)="toggleSubtopics('csrf-clickjacking', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('csrf-clickjacking'); as csrfSubs) {
        @if (isSubtopicsExpanded('csrf-clickjacking')) {
          <div class="nav-subtopics">
            @for (s of csrfSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/security/injection" routerLinkActive="active"><span class="nl-text">Injection Attacks</span>@if(progress.isDone('sec-injection')){<span class="nl-done">✓</span>}@if(d('sec-injection');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
      <a routerLink="/security/security-headers" routerLinkActive="active"><span class="nl-text">Security Headers</span>@if(progress.isDone('sec-security-headers')){<span class="nl-done">✓</span>}@if(d('sec-security-headers');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Transport &amp; Crypto</p>
      <a routerLink="/security/tls-https" routerLinkActive="active"><span class="nl-text">TLS &amp; HTTPS</span>@if(progress.isDone('sec-tls-https')){<span class="nl-done">✓</span>}@if(d('sec-tls-https');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
      <a routerLink="/security/symmetric-encryption" routerLinkActive="active"><span class="nl-text">Symmetric Encryption</span>@if(progress.isDone('sec-symmetric-encryption')){<span class="nl-done">✓</span>}@if(d('sec-symmetric-encryption');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
      <a routerLink="/security/asymmetric-cryptography" routerLinkActive="active"><span class="nl-text">Asymmetric Cryptography</span>@if(progress.isDone('sec-asymmetric-cryptography')){<span class="nl-done">✓</span>}@if(d('sec-asymmetric-cryptography');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
      <a routerLink="/security/hashing" routerLinkActive="active"><span class="nl-text">Hashing &amp; MACs</span>@if(progress.isDone('sec-hashing')){<span class="nl-done">✓</span>}@if(d('sec-hashing');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Infrastructure</p>
      <a routerLink="/security/secrets-management" routerLinkActive="active"><span class="nl-text">Secrets Management</span>@if(progress.isDone('sec-secrets-management')){<span class="nl-done">✓</span>}@if(d('sec-secrets-management');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
      <a routerLink="/security/container-security" routerLinkActive="active"><span class="nl-text">Container Security</span>@if(progress.isDone('sec-container-security')){<span class="nl-done">✓</span>}@if(d('sec-container-security');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
      <a routerLink="/security/supply-chain" routerLinkActive="active"><span class="nl-text">Supply Chain Security</span>@if(progress.isDone('sec-supply-chain')){<span class="nl-done">✓</span>}@if(d('sec-supply-chain');as x){<span class="nl-dot" [class]="'nl-dot--'+x"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/security/cheatsheet" routerLinkActive="active"><span class="nl-text">📋 Security Cheat Sheet</span></a>
      <a routerLink="/security/interview-prep" routerLinkActive="active"><span class="nl-text">🎤 Interview Prep</span></a>
    </div>
  `,
})
export class SecurityNavComponent {
  progress = inject(ProgressService);
  private router = inject(Router);
  d(route: string) { return DIFF[route] ?? null; }

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
