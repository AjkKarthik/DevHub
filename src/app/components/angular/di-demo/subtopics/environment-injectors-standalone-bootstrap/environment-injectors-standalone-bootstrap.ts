import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-environment-injectors-standalone-bootstrap-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './environment-injectors-standalone-bootstrap.html',
  styleUrl: './environment-injectors-standalone-bootstrap.scss',
})
export class EnvironmentInjectorsStandaloneBootstrapSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Two separate injector hierarchies: Environment vs Element',
      points: [
        'Angular actually maintains TWO parallel injector trees. The <strong>EnvironmentInjector</strong> hierarchy holds <code>providedIn: \'root\'</code> services, the platform injector, and route-level <code>providers</code>. The <strong>ElementInjector</strong> hierarchy holds component/directive-level <code>providers</code> and <code>viewProviders</code>, mirroring the DOM/component tree.',
        'When you call <code>inject(Token)</code>, Angular searches the ElementInjector hierarchy FIRST (walking up through host component providers), and only falls back to the EnvironmentInjector hierarchy if no ElementInjector along the way has a provider for that token.',
      ],
    },
    {
      heading: 'bootstrapApplication() sets up the root EnvironmentInjector',
      points: [
        '<code>bootstrapApplication(App, { providers: [...] })</code> is the standalone-app replacement for the old root <code>NgModule.providers</code> array — everything passed here becomes part of the root EnvironmentInjector, available app-wide unless shadowed by a closer provider.',
        'Function-style providers like <code>provideRouter(routes)</code>, <code>provideHttpClient()</code>, and <code>provideAnimations()</code> are just convenience factories that expand into ordinary EnvironmentInjector provider arrays — they compose the same way as any other entry in that <code>providers</code> array.',
      ],
    },
    {
      heading: 'Route-level providers create a child EnvironmentInjector, not an ElementInjector',
      points: [
        '<code>{ path: \'feature\', providers: [FeatureService], loadComponent: () => ... }</code> in a route config creates a CHILD ENVIRONMENT INJECTOR scoped to that route subtree — this is a genuinely different mechanism from a component\'s own <code>providers: [...]</code>, even though the syntax looks similar.',
        'This route-scoped environment injector is destroyed when the user navigates away from that route (and all its children), making it the standard place for per-feature state that should outlive individual components within the route but not the route itself.',
      ],
    },
    {
      heading: 'createEnvironmentInjector() for manually scoped injectors',
      points: [
        '<code>createEnvironmentInjector(providers, parentInjector)</code> creates an isolated child EnvironmentInjector programmatically — useful for micro-frontends, dynamically created components via <code>createComponent()</code> with a custom injector, or any provider scope not tied to a specific route or component.',
        'Nothing destroys a manually created environment injector automatically — you own its lifecycle. Call <code>envInjector.destroy()</code> explicitly when the scope ends, which runs <code>ngOnDestroy</code> on any of its providers, or you will leak those instances for the lifetime of the app.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject, Injectable, EnvironmentInjector, createEnvironmentInjector, signal } from '@angular/core';

@Injectable()
class ScopedSession {
  id = Math.random().toString(36).slice(2, 8);
  constructor() { console.log('ScopedSession created:', this.id); }
  ngOnDestroy() { console.log('ScopedSession destroyed:', this.id); }
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Manually scoped EnvironmentInjector</h3>
    <button (click)="createScope()">Create scoped session</button>
    <button (click)="destroyScope()" [disabled]="!activeSessionId()">Destroy it</button>
    <p>Active session: {{ activeSessionId() || '(none — check console for lifecycle logs)' }}</p>
  \`,
})
export class App {
  // Parent EnvironmentInjector — captured to create a scoped child from
  private parentInjector = inject(EnvironmentInjector);
  private scopedInjector: EnvironmentInjector | null = null;

  activeSessionId = signal<string | null>(null);

  createScope() {
    // Creates a genuinely isolated child EnvironmentInjector
    this.scopedInjector = createEnvironmentInjector([ScopedSession], this.parentInjector);
    const session = this.scopedInjector.get(ScopedSession);
    this.activeSessionId.set(session.id);
  }

  destroyScope() {
    // Nothing does this automatically — the owner is responsible.
    this.scopedInjector?.destroy();
    this.scopedInjector = null;
    this.activeSessionId.set(null);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Environment injectors and standalone bootstrap</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click "Create scoped session" twice in a row without destroying in between, and check the console — explain why two different ScopedSession instances get created.',
    hint: 'Each click calls createEnvironmentInjector([ScopedSession], this.parentInjector) again, creating a brand-new child injector with its own fresh ScopedSession instance — the previous scopedInjector reference is overwritten (and leaked, since it was never destroyed).',
    solution: `// Each call to createScope() creates a NEW child EnvironmentInjector,
// so each has its own independent ScopedSession instance — creating
// twice without destroying in between leaks the first scoped injector,
// since nothing else references or destroys it. Always destroy the
// previous scope before creating a new one, or track multiple scopes
// explicitly if that is genuinely the intent.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'component providers:[] and route-level providers:[] create the same kind of injector, just at different points in the config.',
      reality: 'component providers:[] creates an ElementInjector entry, while route-level providers:[] creates a child EnvironmentInjector — genuinely different mechanisms that happen to share similar-looking syntax.',
    },
    {
      thought: 'a manually created environment injector (via createEnvironmentInjector) gets cleaned up automatically when it goes out of scope, like a normal JS object.',
      reality: 'nothing destroys it automatically — the creator must call .destroy() explicitly when the scope ends, or its providers (and their ngOnDestroy hooks) leak for the lifetime of the app.',
    },
    {
      thought: 'inject() always searches the EnvironmentInjector hierarchy (root, route-level) before checking component-level providers.',
      reality: 'it is the other way around — inject() searches the ElementInjector hierarchy (component/directive providers) FIRST, walking up through host components, and only falls back to the EnvironmentInjector hierarchy if nothing is found there.',
    },
  ];
}
