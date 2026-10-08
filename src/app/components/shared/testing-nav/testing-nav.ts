import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ProgressService } from '../../../services/progress.service';
import { SUBTOPICS } from '../../../data/subtopics';

@Component({
  selector: 'app-testing-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/testing-hub" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🏠 Testing Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/testing-hub/testing-fundamentals" routerLinkActive="active"><span class="nl-text">Testing Fundamentals</span>@if(p.isDone('test-testing-fundamentals')){<span class="nl-done">✓</span>}@if (subtopicsOf('testing-fundamentals'); as testingFundamentalsSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('testing-fundamentals', $event)">{{ isSubtopicsExpanded('testing-fundamentals') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('testing-fundamentals'); as testingFundamentalsSubs) {
        @if (isSubtopicsExpanded('testing-fundamentals')) {
          <div class="nav-subtopics">
            @for (sub of testingFundamentalsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/tdd" routerLinkActive="active"><span class="nl-text">Test-Driven Development</span>@if(p.isDone('test-tdd')){<span class="nl-done">✓</span>}@if (subtopicsOf('tdd'); as tddSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('tdd', $event)">{{ isSubtopicsExpanded('tdd') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('tdd'); as tddSubs) {
        @if (isSubtopicsExpanded('tdd')) {
          <div class="nav-subtopics">
            @for (sub of tddSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/test-doubles" routerLinkActive="active"><span class="nl-text">Test Doubles</span>@if(p.isDone('test-test-doubles')){<span class="nl-done">✓</span>}@if (subtopicsOf('test-doubles'); as testDoublesSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('test-doubles', $event)">{{ isSubtopicsExpanded('test-doubles') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('test-doubles'); as testDoublesSubs) {
        @if (isSubtopicsExpanded('test-doubles')) {
          <div class="nav-subtopics">
            @for (sub of testDoublesSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/property-based-testing" routerLinkActive="active"><span class="nl-text">Property-Based Testing</span>@if(p.isDone('test-property-based-testing')){<span class="nl-done">✓</span>}@if (subtopicsOf('property-based-testing'); as propertyBasedTestingSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('property-based-testing', $event)">{{ isSubtopicsExpanded('property-based-testing') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('property-based-testing'); as propertyBasedTestingSubs) {
        @if (isSubtopicsExpanded('property-based-testing')) {
          <div class="nav-subtopics">
            @for (sub of propertyBasedTestingSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Unit Testing</p>
      <a routerLink="/testing-hub/jest-fundamentals" routerLinkActive="active"><span class="nl-text">Jest Fundamentals</span>@if(p.isDone('test-jest-fundamentals')){<span class="nl-done">✓</span>}@if (subtopicsOf('jest-fundamentals'); as jestFundamentalsSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('jest-fundamentals', $event)">{{ isSubtopicsExpanded('jest-fundamentals') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('jest-fundamentals'); as jestFundamentalsSubs) {
        @if (isSubtopicsExpanded('jest-fundamentals')) {
          <div class="nav-subtopics">
            @for (sub of jestFundamentalsSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/mocking-spies" routerLinkActive="active"><span class="nl-text">Mocking &amp; Spies</span>@if(p.isDone('test-mocking-spies')){<span class="nl-done">✓</span>}@if (subtopicsOf('mocking-spies'); as mockingSpiesSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('mocking-spies', $event)">{{ isSubtopicsExpanded('mocking-spies') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('mocking-spies'); as mockingSpiesSubs) {
        @if (isSubtopicsExpanded('mocking-spies')) {
          <div class="nav-subtopics">
            @for (sub of mockingSpiesSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/vitest" routerLinkActive="active"><span class="nl-text">Vitest</span>@if(p.isDone('test-vitest')){<span class="nl-done">✓</span>}@if (subtopicsOf('vitest'); as vitestSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('vitest', $event)">{{ isSubtopicsExpanded('vitest') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('vitest'); as vitestSubs) {
        @if (isSubtopicsExpanded('vitest')) {
          <div class="nav-subtopics">
            @for (sub of vitestSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/xunit" routerLinkActive="active"><span class="nl-text">xUnit (.NET)</span>@if(p.isDone('test-xunit')){<span class="nl-done">✓</span>}@if (subtopicsOf('xunit'); as xunitSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('xunit', $event)">{{ isSubtopicsExpanded('xunit') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('xunit'); as xunitSubs) {
        @if (isSubtopicsExpanded('xunit')) {
          <div class="nav-subtopics">
            @for (sub of xunitSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/snapshot-testing" routerLinkActive="active"><span class="nl-text">Snapshot Testing</span>@if(p.isDone('test-snapshot-testing')){<span class="nl-done">✓</span>}@if (subtopicsOf('snapshot-testing'); as snapshotTestingSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('snapshot-testing', $event)">{{ isSubtopicsExpanded('snapshot-testing') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('snapshot-testing'); as snapshotTestingSubs) {
        @if (isSubtopicsExpanded('snapshot-testing')) {
          <div class="nav-subtopics">
            @for (sub of snapshotTestingSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Integration</p>
      <a routerLink="/testing-hub/integration-testing" routerLinkActive="active"><span class="nl-text">Integration Testing</span>@if(p.isDone('test-integration-testing')){<span class="nl-done">✓</span>}@if (subtopicsOf('integration-testing'); as integrationTestingSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('integration-testing', $event)">{{ isSubtopicsExpanded('integration-testing') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('integration-testing'); as integrationTestingSubs) {
        @if (isSubtopicsExpanded('integration-testing')) {
          <div class="nav-subtopics">
            @for (sub of integrationTestingSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/testing-databases" routerLinkActive="active"><span class="nl-text">Testing with Databases</span>@if(p.isDone('test-testing-databases')){<span class="nl-done">✓</span>}@if (subtopicsOf('testing-databases'); as testingDatabasesSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('testing-databases', $event)">{{ isSubtopicsExpanded('testing-databases') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('testing-databases'); as testingDatabasesSubs) {
        @if (isSubtopicsExpanded('testing-databases')) {
          <div class="nav-subtopics">
            @for (sub of testingDatabasesSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/msw" routerLinkActive="active"><span class="nl-text">MSW — Mock Service Worker</span>@if(p.isDone('test-msw')){<span class="nl-done">✓</span>}@if (subtopicsOf('test-msw'); as testMswSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('test-msw', $event)">{{ isSubtopicsExpanded('test-msw') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('test-msw'); as testMswSubs) {
        @if (isSubtopicsExpanded('test-msw')) {
          <div class="nav-subtopics">
            @for (sub of testMswSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Frontend Testing</p>
      <a routerLink="/testing-hub/react-testing-library" routerLinkActive="active"><span class="nl-text">React Testing Library</span>@if(p.isDone('test-react-testing-library')){<span class="nl-done">✓</span>}@if (subtopicsOf('react-testing-library'); as reactTestingLibrarySubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('react-testing-library', $event)">{{ isSubtopicsExpanded('react-testing-library') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('react-testing-library'); as reactTestingLibrarySubs) {
        @if (isSubtopicsExpanded('react-testing-library')) {
          <div class="nav-subtopics">
            @for (sub of reactTestingLibrarySubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/angular-testing" routerLinkActive="active"><span class="nl-text">Angular Testing</span>@if(p.isDone('test-angular-testing')){<span class="nl-done">✓</span>}@if (subtopicsOf('angular-testing'); as angularTestingSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('angular-testing', $event)">{{ isSubtopicsExpanded('angular-testing') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('angular-testing'); as angularTestingSubs) {
        @if (isSubtopicsExpanded('angular-testing')) {
          <div class="nav-subtopics">
            @for (sub of angularTestingSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/visual-regression" routerLinkActive="active"><span class="nl-text">Visual Regression</span>@if(p.isDone('test-visual-regression')){<span class="nl-done">✓</span>}@if (subtopicsOf('visual-regression'); as visualRegressionSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('visual-regression', $event)">{{ isSubtopicsExpanded('visual-regression') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('visual-regression'); as visualRegressionSubs) {
        @if (isSubtopicsExpanded('visual-regression')) {
          <div class="nav-subtopics">
            @for (sub of visualRegressionSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
    </div>

    <div class="nav-group">
      <p class="nav-group-label">E2E & API</p>
      <a routerLink="/testing-hub/playwright" routerLinkActive="active"><span class="nl-text">Playwright</span>@if(p.isDone('test-playwright')){<span class="nl-done">✓</span>}@if (subtopicsOf('playwright'); as playwrightSubs) {<button type="button" class="nav-subtopics-toggle" (click)="toggleSubtopics('playwright', $event)">{{ isSubtopicsExpanded('playwright') ? '▾' : '▸' }}</button>}</a>
      @if (subtopicsOf('playwright'); as playwrightSubs) {
        @if (isSubtopicsExpanded('playwright')) {
          <div class="nav-subtopics">
            @for (sub of playwrightSubs; track sub.route) {
              <a [routerLink]="sub.route" routerLinkActive="active" class="nav-subtopic-link">{{ sub.label }}</a>
            }
          </div>
        }
      }
      <a routerLink="/testing-hub/cypress" routerLinkActive="active"><span class="nl-text">Cypress</span>@if(p.isDone('test-cypress')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/api-testing" routerLinkActive="active"><span class="nl-text">API Testing</span>@if(p.isDone('test-api-testing')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/contract-testing" routerLinkActive="active"><span class="nl-text">Contract Testing</span>@if(p.isDone('test-contract-testing')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/testing-hub/cheatsheet" routerLinkActive="active"><span class="nl-text">Testing Cheat Sheet</span></a>
      <a routerLink="/testing-hub/performance-testing" routerLinkActive="active"><span class="nl-text">Performance &amp; Load Testing</span></a>
      <a routerLink="/testing-hub/mutation-testing" routerLinkActive="active"><span class="nl-text">Mutation Testing</span></a>
    </div>
  `,
})
export class TestingNavComponent {
  p = inject(ProgressService);
  private router = inject(Router);
  private expandedTopics = signal<Set<string>>(new Set());

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.autoExpandForCurrentUrl());
    this.autoExpandForCurrentUrl();
  }

  private autoExpandForCurrentUrl(): void {
    const url = this.router.url.split('?')[0];
    for (const [slug, subs] of Object.entries(SUBTOPICS)) {
      if (subs.some(s => s.route === url)) {
        this.expandedTopics.update(set => new Set(set).add(slug));
      }
    }
  }

  subtopicsOf(slug: string) {
    return SUBTOPICS[slug] ?? null;
  }

  isSubtopicsExpanded(slug: string): boolean {
    return this.expandedTopics().has(slug);
  }

  toggleSubtopics(slug: string, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.expandedTopics.update(set => {
      const next = new Set(set);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      return next;
    });
  }
}

