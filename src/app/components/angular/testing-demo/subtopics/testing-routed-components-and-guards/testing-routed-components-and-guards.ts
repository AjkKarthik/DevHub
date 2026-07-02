import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-routed-components-and-guards-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-routed-components-and-guards.html',
  styleUrl: './testing-routed-components-and-guards.scss',
})
export class TestingRoutedComponentsAndGuardsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mocking ActivatedRoute for a component that reads route params',
      points: [
        'A component injecting <code>ActivatedRoute</code> to read <code>route.snapshot.paramMap.get(\'id\')</code> needs a MOCK <code>ActivatedRoute</code> provided in the test — <code>{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: \'42\' }) } } }</code> is the standard minimal shape, using the real <code>convertToParamMap</code> helper from <code>&#64;angular/router</code> so the mock behaves identically to the real thing.',
        'For a component reading the REACTIVE <code>route.paramMap</code> Observable (not just the snapshot), the mock needs an actual Observable: <code>{ provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: \'42\' })) } }</code> — using RxJS\'s <code>of()</code> to produce a synchronous, completed Observable that the component\'s <code>toSignal()</code> or subscription can consume immediately in the test.',
      ],
    },
    {
      heading: 'Testing functional guards as plain functions',
      points: [
        'A functional guard (<code>CanActivateFn</code>) is JUST A FUNCTION — the most direct way to test it is to call it DIRECTLY, wrapped in <code>TestBed.runInInjectionContext(() =&gt; authGuard(mockRoute, mockState))</code>, since the guard likely calls <code>inject()</code> internally and needs a valid injection context to run in a test.',
        'Mock the services the guard injects (e.g. <code>AuthService</code>) via <code>TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: mockAuthService }] })</code> BEFORE calling <code>runInInjectionContext</code> — this lets you test both the "user is logged in → returns true" and "user is not logged in → returns a UrlTree redirect" branches without any real routing or HTTP involved.',
        'When a guard returns a <code>UrlTree</code> (for a redirect), assert on its STRUCTURE rather than trying to compare it directly to another UrlTree instance: <code>expect(router.serializeUrl(result as UrlTree)).toBe(\'/login?returnUrl=%2Fadmin\')</code> — serializing to a string gives a readable, reliable assertion.',
      ],
    },
    {
      heading: 'RouterTestingHarness — a higher-level alternative for full navigation tests',
      points: [
        '<code>RouterTestingHarness</code> (from <code>&#64;angular/router/testing</code>) provides <code>navigateByUrl(url)</code> that actually resolves the ENTIRE route configuration — matching, guards, resolvers, and component instantiation — giving you the rendered component instance and fixture for that URL, closer to true end-to-end route testing than manually mocking <code>ActivatedRoute</code>.',
        'Use the lighter mock-<code>ActivatedRoute</code> approach when testing ONE component\'s reaction to route data in isolation; reach for <code>RouterTestingHarness</code> when you specifically want to verify the FULL routing configuration (including guards actually running) works correctly end-to-end.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/auth.guard.ts',
      content: `import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
`,
    },
    {
      path: 'src/app/auth.service.ts',
      content: `import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean { return false; } // real implementation elsewhere
}
`,
    },
    {
      path: 'src/app/auth.guard.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  function setup(isLoggedIn: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isLoggedIn: () => isLoggedIn } },
      ],
    });
    return {
      router: TestBed.inject(Router),
    };
  }

  it('allows activation when the user is logged in', () => {
    setup(true);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/admin' } as any),
    );
    expect(result).toBe(true);
  });

  it('redirects to /login with a returnUrl when the user is NOT logged in', () => {
    const { router } = setup(false);
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as any, { url: '/admin' } as any),
    );

    // Serializing the UrlTree gives a readable, reliable string assertion
    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fadmin');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>The guard under test — see auth.guard.spec.ts for the actual tests</h3>
    <p>Logged in: {{ auth.isLoggedIn() }}</p>
  \`,
})
export class App {
  auth = inject(AuthService);
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
  <head><title>Testing routed components and guards</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a third test asserting that a logged-in user navigating to a state.url of "/dashboard" still simply returns true (the returnUrl branch is only relevant when NOT logged in).',
    hint: 'Call setup(true), then TestBed.runInInjectionContext(() => authGuard({} as any, { url: \'/dashboard\' } as any)), and expect(result).toBe(true) — the URL passed in state doesn\'t matter when the user is already logged in.',
    solution: `it('ignores the requested URL entirely when the user is logged in', () => {
  setup(true);
  const result = TestBed.runInInjectionContext(() =>
    authGuard({} as any, { url: '/dashboard' } as any),
  );
  expect(result).toBe(true);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a functional guard requires spinning up a full router and navigating to a URL that triggers it.',
      reality: 'a functional guard is just a plain function — calling it directly (wrapped in TestBed.runInInjectionContext since it likely uses inject() internally) is the most direct, fastest way to test both its true and redirect branches.',
    },
    {
      thought: 'a guard\'s UrlTree redirect result should be compared directly against another UrlTree instance with toEqual().',
      reality: 'serializing it to a string with router.serializeUrl() gives a far more readable and reliable assertion — comparing UrlTree object structures directly is brittle and hard to debug when it fails.',
    },
    {
      thought: 'mocking ActivatedRoute always requires a full RouterTestingModule or RouterTestingHarness setup.',
      reality: 'for testing ONE component\'s reaction to route data in isolation, a minimal { provide: ActivatedRoute, useValue: {...} } mock is simpler and faster — RouterTestingHarness is for when you specifically need the full routing configuration (including guards) to actually run.',
    },
  ];
}
