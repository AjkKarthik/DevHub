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
  selector: 'app-linux-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/linux" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🐧 Linux Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/linux/fundamentals" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Linux Fundamentals</span>
        @if (p.isDone('linux-fundamentals')) {<span class="nl-done">✓</span>}
        @if (d('linux-fundamentals'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('linux-fundamentals')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('linux-fundamentals')"
                  (click)="toggleSubtopics('linux-fundamentals', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('linux-fundamentals'); as fundSubs) {
        @if (isSubtopicsExpanded('linux-fundamentals')) {
          <div class="nav-subtopics">
            @for (s of fundSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/linux/vim" routerLinkActive="active"><span class="nl-text">Vim &amp; Text Editors</span>@if(p.isDone('linux-vim')){<span class="nl-done">✓</span>}@if(d('linux-vim');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">File System</p>
      <a routerLink="/linux/file-system" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">File System &amp; Hierarchy</span>
        @if (p.isDone('linux-file-system')) {<span class="nl-done">✓</span>}
        @if (d('linux-file-system'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('file-system')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('file-system')"
                  (click)="toggleSubtopics('file-system', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('file-system'); as fsSubs) {
        @if (isSubtopicsExpanded('file-system')) {
          <div class="nav-subtopics">
            @for (s of fsSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/linux/essential-commands" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Essential Commands</span>
        @if (p.isDone('linux-essential-commands')) {<span class="nl-done">✓</span>}
        @if (d('linux-essential-commands'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('essential-commands')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('essential-commands')"
                  (click)="toggleSubtopics('essential-commands', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('essential-commands'); as ecSubs) {
        @if (isSubtopicsExpanded('essential-commands')) {
          <div class="nav-subtopics">
            @for (s of ecSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Users &amp; Permissions</p>
      <a routerLink="/linux/file-permissions" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">File Permissions &amp; Ownership</span>
        @if (p.isDone('linux-file-permissions')) {<span class="nl-done">✓</span>}
        @if (d('linux-file-permissions'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('file-permissions')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('file-permissions')"
                  (click)="toggleSubtopics('file-permissions', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('file-permissions'); as fpSubs) {
        @if (isSubtopicsExpanded('file-permissions')) {
          <div class="nav-subtopics">
            @for (s of fpSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/linux/users-groups" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Users &amp; Groups</span>
        @if (p.isDone('linux-users-groups')) {<span class="nl-done">✓</span>}
        @if (d('linux-users-groups'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('users-groups')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('users-groups')"
                  (click)="toggleSubtopics('users-groups', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('users-groups'); as ugSubs) {
        @if (isSubtopicsExpanded('users-groups')) {
          <div class="nav-subtopics">
            @for (s of ugSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Process</p>
      <a routerLink="/linux/process-management" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">Process Management</span>
        @if (p.isDone('linux-process-management')) {<span class="nl-done">✓</span>}
        @if (d('linux-process-management'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('process-management')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('process-management')"
                  (click)="toggleSubtopics('process-management', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('process-management'); as pmSubs) {
        @if (isSubtopicsExpanded('process-management')) {
          <div class="nav-subtopics">
            @for (s of pmSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
      <a routerLink="/linux/system-monitoring" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">
        <span class="nl-text">System Monitoring</span>
        @if (p.isDone('linux-system-monitoring')) {<span class="nl-done">✓</span>}
        @if (d('linux-system-monitoring'); as v) {<span class="nl-dot" [class]="'nl-dot--' + v"></span>}
        @if (subtopicsOf('system-monitoring')) {
          <button type="button" class="nav-subtopics-toggle" [class.open]="isSubtopicsExpanded('system-monitoring')"
                  (click)="toggleSubtopics('system-monitoring', $event)" aria-label="Toggle subtopics">›</button>
        }
      </a>
      @if (subtopicsOf('system-monitoring'); as smSubs) {
        @if (isSubtopicsExpanded('system-monitoring')) {
          <div class="nav-subtopics">
            @for (s of smSubs; track s.route) {
              <a [routerLink]="s.route" routerLinkActive="active" class="nav-subtopic-link">
                <span class="nl-text">{{ s.label }}</span>
              </a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Networking</p>
      <a routerLink="/linux/networking" routerLinkActive="active"><span class="nl-text">Networking Commands</span>@if(p.isDone('linux-networking')){<span class="nl-done">✓</span>}@if(d('linux-networking');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/firewall" routerLinkActive="active"><span class="nl-text">Firewall &amp; iptables</span>@if(p.isDone('linux-firewall')){<span class="nl-done">✓</span>}@if(d('linux-firewall');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/ssh" routerLinkActive="active"><span class="nl-text">SSH &amp; Remote Access</span>@if(p.isDone('linux-ssh')){<span class="nl-done">✓</span>}@if(d('linux-ssh');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Shell Scripting</p>
      <a routerLink="/linux/bash-scripting" routerLinkActive="active"><span class="nl-text">Bash Scripting Basics</span>@if(p.isDone('linux-bash-scripting')){<span class="nl-done">✓</span>}@if(d('linux-bash-scripting');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/bash-advanced" routerLinkActive="active"><span class="nl-text">Advanced Bash Scripting</span>@if(p.isDone('linux-bash-advanced')){<span class="nl-done">✓</span>}@if(d('linux-bash-advanced');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/environment-variables" routerLinkActive="active"><span class="nl-text">Environment Variables</span>@if(p.isDone('linux-environment-variables')){<span class="nl-done">✓</span>}@if(d('linux-environment-variables');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">System Admin</p>
      <a routerLink="/linux/package-management" routerLinkActive="active"><span class="nl-text">Package Management</span>@if(p.isDone('linux-package-management')){<span class="nl-done">✓</span>}@if(d('linux-package-management');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/systemd" routerLinkActive="active"><span class="nl-text">systemd &amp; Services</span>@if(p.isDone('linux-systemd')){<span class="nl-done">✓</span>}@if(d('linux-systemd');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/disk-storage" routerLinkActive="active"><span class="nl-text">Disk &amp; Storage</span>@if(p.isDone('linux-disk-storage')){<span class="nl-done">✓</span>}@if(d('linux-disk-storage');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/log-analysis" routerLinkActive="active"><span class="nl-text">Log Analysis</span>@if(p.isDone('linux-log-analysis')){<span class="nl-done">✓</span>}@if(d('linux-log-analysis');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/linux/performance-tuning" routerLinkActive="active"><span class="nl-text">Performance Tuning</span>@if(p.isDone('linux-performance-tuning')){<span class="nl-done">✓</span>}@if(d('linux-performance-tuning');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/linux/security-hardening" routerLinkActive="active"><span class="nl-text">Security Hardening</span></a>
      <a routerLink="/linux/cron" routerLinkActive="active"><span class="nl-text">Cron &amp; Scheduling</span></a>
    </div>
  `,
  styles: []
})
export class LinuxNavComponent {
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
