import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';

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
      <a routerLink="/testing-hub/testing-fundamentals" routerLinkActive="active"><span class="nl-text">Testing Fundamentals</span>@if(p.isDone('test-testing-fundamentals')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/tdd" routerLinkActive="active"><span class="nl-text">Test-Driven Development</span>@if(p.isDone('test-tdd')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/test-doubles" routerLinkActive="active"><span class="nl-text">Test Doubles</span>@if(p.isDone('test-test-doubles')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/property-based-testing" routerLinkActive="active"><span class="nl-text">Property-Based Testing</span>@if(p.isDone('test-property-based-testing')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Unit Testing</p>
      <a routerLink="/testing-hub/jest-fundamentals" routerLinkActive="active"><span class="nl-text">Jest Fundamentals</span>@if(p.isDone('test-jest-fundamentals')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/mocking-spies" routerLinkActive="active"><span class="nl-text">Mocking &amp; Spies</span>@if(p.isDone('test-mocking-spies')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/vitest" routerLinkActive="active"><span class="nl-text">Vitest</span>@if(p.isDone('test-vitest')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/xunit" routerLinkActive="active"><span class="nl-text">xUnit (.NET)</span>@if(p.isDone('test-xunit')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/snapshot-testing" routerLinkActive="active"><span class="nl-text">Snapshot Testing</span>@if(p.isDone('test-snapshot-testing')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Integration</p>
      <a routerLink="/testing-hub/integration-testing" routerLinkActive="active"><span class="nl-text">Integration Testing</span>@if(p.isDone('test-integration-testing')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/testing-databases" routerLinkActive="active"><span class="nl-text">Testing with Databases</span>@if(p.isDone('test-testing-databases')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/msw" routerLinkActive="active"><span class="nl-text">MSW — Mock Service Worker</span>@if(p.isDone('test-msw')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Frontend Testing</p>
      <a routerLink="/testing-hub/react-testing-library" routerLinkActive="active"><span class="nl-text">React Testing Library</span>@if(p.isDone('test-react-testing-library')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/angular-testing" routerLinkActive="active"><span class="nl-text">Angular Testing</span>@if(p.isDone('test-angular-testing')){<span class="nl-done">✓</span>}</a>
      <a routerLink="/testing-hub/visual-regression" routerLinkActive="active"><span class="nl-text">Visual Regression</span>@if(p.isDone('test-visual-regression')){<span class="nl-done">✓</span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">E2E & API</p>
      <a routerLink="/testing-hub/playwright" routerLinkActive="active"><span class="nl-text">Playwright</span>@if(p.isDone('test-playwright')){<span class="nl-done">✓</span>}</a>
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
}
