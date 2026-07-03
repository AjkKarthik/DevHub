import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-nullinjectorerror-after-migration-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-nullinjectorerror-after-migration.html',
  styleUrl: './debugging-nullinjectorerror-after-migration.scss',
})
export class DebuggingNullinjectorerrorAfterMigrationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A triage checklist — read the error message\'s injector chain first',
      points: [
        'A <code>NullInjectorError</code> message always includes a chain like <code>NullInjectorError: No provider for AuthService!</code> or, more verbosely, <code>R3InjectorError(Standalone[AppComponent])[AuthService -> AuthService]: NullInjectorError</code> — the bracketed part names WHICH injector context was searched. This is the single most useful piece of information for triage: it tells you whether the search happened in the root injector, a specific component\'s injector, or a lazy-loaded route\'s injector, which narrows down WHERE the missing provider registration needs to go.',
        'The main topic\'s common mistake ("third-party NgModule not bridged") is ONE cause of this error, but post-migration NullInjectorErrors come from at least four distinct root causes that all produce a similarly-shaped message — treating every instance as "must be a missing importProvidersFrom()" wastes time on the other three.',
      ],
    },
    {
      heading: 'The four common post-migration causes, in order of likelihood',
      points: [
        '<strong>1. Provider still in the deleted AppModule\'s providers array</strong> — the migration schematic moves ROUTER, HTTP, and a few other well-known providers automatically, but a CUSTOM provider registered directly in <code>AppModule.providers</code> (not <code>providedIn: \'root\'</code> on the service itself) is easy to miss during Pass 3 cleanup. Fix: search the deleted AppModule\'s git history for the missing provider and add it to <code>app.config.ts</code>.',
        '<strong>2. Third-party NgModule genuinely not bridged</strong> — the main topic\'s documented case: use <code>importProvidersFrom(ThirdPartyModule.forRoot(...))</code> in <code>app.config.ts</code>.',
        '<strong>3. A route-scoped provider lost its scope during route-file migration</strong> — when converting <code>RouterModule.forChild(routes)</code> (which could carry its OWN <code>providers: []</code> on the NgModule) to a plain <code>Routes</code> array, any providers that lived on that feature module are easy to drop entirely, since a plain <code>Routes</code> array has no <code>providers</code> field of its own at the array level — the fix is to move them onto the INDIVIDUAL route object\'s own <code>providers: []</code> field, which Angular Router DOES support per-route.',
        '<strong>4. A service is provided in a component\'s <code>providers: []</code> array, but ANOTHER, unrelated component that also needs it is not a descendant of that first component in the render tree</strong> — component-scoped DI was already true before migration, but migration is often when teams reorganize component hierarchies, which can accidentally move a consumer OUTSIDE its provider\'s subtree. Fix: either move the provider to a common ancestor, or to <code>providedIn: \'root\'</code> if app-wide singleton behavior was always intended.',
      ],
    },
    {
      heading: 'A fast reproduction technique — bisect app.config.ts',
      points: [
        'When the error message\'s injector chain is ambiguous or the missing provider was registered through several layers of re-exported modules, temporarily COMMENT OUT roughly half of the <code>providers: []</code> array in <code>app.config.ts</code>, reload, and see if the SAME error still appears — if yes, the missing provider lives in the OTHER half; if the error changes or disappears, it\'s in the commented-out half. This binary-search approach narrows a large, unfamiliar providers array to the specific missing registration in a handful of reload cycles, faster than reading through the whole list line by line.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/analytics.service.ts',
      content: `import { Injectable } from '@angular/core';

// NOT providedIn: 'root' — this service was historically registered
// directly in AppModule.providers, a pattern easy to lose during migration.
@Injectable()
export class AnalyticsService {
  track(event: string) {
    console.log('[analytics]', event);
  }
}
`,
    },
    {
      path: 'src/app/dashboard.ts',
      content: `import { Component, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: \`<button (click)="track()">Track an event</button>\`,
})
export class DashboardComponent {
  // Throws NullInjectorError if AnalyticsService is not registered anywhere
  // in the injector chain — see app.config.ts for the fix.
  private analytics = inject(AnalyticsService);

  track() {
    this.analytics.track('dashboard_click');
  }
}
`,
    },
    {
      path: 'src/app/app.config.ts',
      content: `import { ApplicationConfig } from '@angular/core';
import { AnalyticsService } from './analytics.service';

// FIXED — AnalyticsService explicitly added, since it lacks
// providedIn: 'root' and was previously only registered in the now-deleted
// AppModule.providers array. This is post-migration cause #1 from the theory.
export const appConfig: ApplicationConfig = {
  providers: [
    AnalyticsService,
  ],
};

// ── BUGGY VERSION for comparison (would throw NullInjectorError) ──────────
// export const appConfig: ApplicationConfig = {
//   providers: [],  // AnalyticsService missing — never migrated from AppModule
// };
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { DashboardComponent } from './dashboard';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardComponent],
  template: \`
    <h3>Debugging NullInjectorError after migration</h3>
    <p>AnalyticsService is NOT providedIn: 'root' — it was historically registered
    directly in AppModule.providers. app.config.ts explicitly re-registers it,
    simulating the fix for post-migration cause #1: a custom provider dropped
    during AppModule deletion.</p>
    <app-dashboard />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Debugging NullInjectorError after migration</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Remove AnalyticsService from app.config.ts\'s providers array and observe the NullInjectorError in the console when clicking "Track an event" — then read the injector chain in the error message.',
    hint: 'Comment out AnalyticsService in the providers array (or set providers: []), reload, click the button, and inspect the console error — the bracketed injector chain names AnalyticsService as the unresolved dependency.',
    solution: `// app.config.ts — removing the fix reproduces the error
export const appConfig: ApplicationConfig = {
  providers: [], // AnalyticsService missing again

// Console error (approximate):
// NullInjectorError: R3InjectorError(Standalone[AppComponent])[AnalyticsService -> AnalyticsService]:
//   NullInjectorError: No provider for AnalyticsService!
};`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'every NullInjectorError seen after a standalone migration is caused by a missing importProvidersFrom() for a third-party module.',
      reality: 'that is only one of at least four common post-migration causes — a custom provider dropped from a deleted AppModule, a route-scoped provider lost during route-file conversion, and component-hierarchy reorganization moving a consumer outside its provider\'s subtree are equally common.',
    },
    {
      thought: 'the NullInjectorError message is too generic to give any useful diagnostic information beyond "something is missing".',
      reality: 'the bracketed injector chain in the full error message names WHICH injector context was searched — root, a specific standalone component, or a lazy route — directly narrowing down where the missing registration needs to go.',
    },
    {
      thought: 'a plain Routes array (replacing RouterModule.forChild) has no way to scope a provider to just that feature\'s routes.',
      reality: 'Angular Router supports a providers: [] field directly on an INDIVIDUAL route object — the equivalent scoping just moves from the module level to the per-route level, it does not disappear.',
    },
  ];
}
