import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressService } from '../../../services/progress.service';
import { SEARCH_INDEX } from '../../../services/search.service';

const DIFF: Record<string, string> = Object.fromEntries(
  SEARCH_INDEX.map(e => [e.route, e.difficulty])
);

@Component({
  selector: 'app-terraform-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a routerLink="/terraform" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-home-link">
      <span class="nl-text">🔩 Terraform Home</span>
    </a>

    <div class="nav-group">
      <p class="nav-group-label">Foundations</p>
      <a routerLink="/terraform/fundamentals" routerLinkActive="active"><span class="nl-text">Terraform Fundamentals</span>@if(p.isDone('tf-fundamentals')){<span class="nl-done">✓</span>}@if(d('tf-fundamentals');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/providers" routerLinkActive="active"><span class="nl-text">Providers</span>@if(p.isDone('tf-providers')){<span class="nl-done">✓</span>}@if(d('tf-providers');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/variables" routerLinkActive="active"><span class="nl-text">Variables &amp; Locals</span>@if(p.isDone('tf-variables')){<span class="nl-done">✓</span>}@if(d('tf-variables');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/outputs" routerLinkActive="active"><span class="nl-text">Outputs</span>@if(p.isDone('tf-outputs')){<span class="nl-done">✓</span>}@if(d('tf-outputs');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Resources</p>
      <a routerLink="/terraform/resources" routerLinkActive="active"><span class="nl-text">Resources &amp; Meta-Arguments</span>@if(p.isDone('tf-resources')){<span class="nl-done">✓</span>}@if(d('tf-resources');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/data-sources" routerLinkActive="active"><span class="nl-text">Data Sources</span>@if(p.isDone('tf-data-sources')){<span class="nl-done">✓</span>}@if(d('tf-data-sources');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/expressions" routerLinkActive="active"><span class="nl-text">Expressions &amp; Dynamic Blocks</span>@if(p.isDone('tf-expressions')){<span class="nl-done">✓</span>}@if(d('tf-expressions');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/functions" routerLinkActive="active"><span class="nl-text">Built-in Functions</span>@if(p.isDone('tf-functions')){<span class="nl-done">✓</span>}@if(d('tf-functions');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">State</p>
      <a routerLink="/terraform/state" routerLinkActive="active"><span class="nl-text">Terraform State</span>@if(p.isDone('tf-state')){<span class="nl-done">✓</span>}@if(d('tf-state');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/remote-backends" routerLinkActive="active"><span class="nl-text">Remote Backends</span>@if(p.isDone('tf-remote-backends')){<span class="nl-done">✓</span>}@if(d('tf-remote-backends');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/workspaces" routerLinkActive="active"><span class="nl-text">Workspaces</span>@if(p.isDone('tf-workspaces')){<span class="nl-done">✓</span>}@if(d('tf-workspaces');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Modules</p>
      <a routerLink="/terraform/modules" routerLinkActive="active"><span class="nl-text">Modules</span>@if(p.isDone('tf-modules')){<span class="nl-done">✓</span>}@if(d('tf-modules');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/module-patterns" routerLinkActive="active"><span class="nl-text">Module Patterns</span>@if(p.isDone('tf-module-patterns')){<span class="nl-done">✓</span>}@if(d('tf-module-patterns');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Advanced</p>
      <a routerLink="/terraform/provisioners" routerLinkActive="active"><span class="nl-text">Provisioners</span>@if(p.isDone('tf-provisioners')){<span class="nl-done">✓</span>}@if(d('tf-provisioners');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/import" routerLinkActive="active"><span class="nl-text">Import &amp; Generated Config</span>@if(p.isDone('tf-import')){<span class="nl-done">✓</span>}@if(d('tf-import');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/cicd" routerLinkActive="active"><span class="nl-text">CI/CD with Terraform</span>@if(p.isDone('tf-cicd')){<span class="nl-done">✓</span>}@if(d('tf-cicd');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/testing" routerLinkActive="active"><span class="nl-text">Testing Terraform Code</span>@if(p.isDone('tf-testing')){<span class="nl-done">✓</span>}@if(d('tf-testing');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/security" routerLinkActive="active"><span class="nl-text">Security &amp; Compliance</span>@if(p.isDone('tf-security')){<span class="nl-done">✓</span>}@if(d('tf-security');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/drift" routerLinkActive="active"><span class="nl-text">Drift Detection</span>@if(p.isDone('tf-drift')){<span class="nl-done">✓</span>}@if(d('tf-drift');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/refactoring" routerLinkActive="active"><span class="nl-text">Refactoring &amp; State Ops</span>@if(p.isDone('tf-refactoring')){<span class="nl-done">✓</span>}@if(d('tf-refactoring');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
      <a routerLink="/terraform/opentofu" routerLinkActive="active"><span class="nl-text">OpenTofu</span>@if(p.isDone('tf-opentofu')){<span class="nl-done">✓</span>}@if(d('tf-opentofu');as v){<span class="nl-dot" [class]="'nl-dot--'+v"></span>}</a>
    </div>

    <div class="nav-group">
      <p class="nav-group-label">Reference</p>
      <a routerLink="/terraform/cheatsheet" routerLinkActive="active"><span class="nl-text">Terraform Cheatsheet</span></a>
      <a routerLink="/terraform/interview-prep" routerLinkActive="active"><span class="nl-text">Interview Prep</span></a>
    </div>
  `,
  styles: []
})
export class TerraformNavComponent {
  p = inject(ProgressService);
  d(route: string): string | null { return DIFF[route] ?? null; }
}
