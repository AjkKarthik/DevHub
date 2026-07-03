import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-ssr-safe-components-without-a-real-server-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-ssr-safe-components-without-a-real-server.html',
  styleUrl: './testing-ssr-safe-components-without-a-real-server.scss',
})
export class TestingSsrSafeComponentsWithoutARealServerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic\'s guards, never actually verified',
      points: [
        'The main SSR page shows the CORRECT pattern for guarding browser-only code (<code>isPlatformBrowser(inject(PLATFORM_ID))</code>) but never shows how to VERIFY a component actually respects that guard. In practice, teams discover a missing platform guard by running <code>ng build</code> + starting the real Node server and watching it crash — a slow, late feedback loop compared to catching it in a unit test that runs in milliseconds on every CI run.',
      ],
    },
    {
      heading: 'Overriding PLATFORM_ID in a TestBed unit test',
      points: [
        '<code>TestBed.configureTestingModule(&#123; providers: [&#123; provide: PLATFORM_ID, useValue: \'server\' &#125;] &#125;)</code> lets a normal TestBed unit test simulate the SERVER environment without ever spinning up Node\'s <code>platform-server</code> package or a real Express server — the component under test reads <code>PLATFORM_ID</code> via <code>inject()</code> exactly as it does in production, so this genuinely exercises the same conditional branches.',
        'Write ONE test with <code>PLATFORM_ID: \'server\'</code> and ONE test with <code>PLATFORM_ID: \'browser\'</code> (Angular\'s default in a normal TestBed run, so this second test needs no override) — asserting the component\'s output/behavior differs correctly between them proves both branches of every <code>isPlatformBrowser()</code> guard actually execute as intended, not just that the browser branch works (which is all a normal test run already covers by default).',
        'Critically, this catches the exact bug class the main topic\'s "Common Mistakes" section warns about — an UNGUARDED <code>localStorage.getItem(...)</code> call — as a clean, readable test FAILURE (a thrown <code>ReferenceError</code> inside the test) instead of discovering it only when the real Node server process crashes on first request in staging or production.',
      ],
    },
    {
      heading: 'A closer approximation: actually running platform-server',
      points: [
        'For a HIGHER-FIDELITY check than the PLATFORM_ID override (which still runs inside Karma/Jest\'s browser-like or jsdom environment, not real Node.js), Angular\'s <code>@angular/platform-server</code> package exposes <code>renderApplication()</code> — calling this in a Node-environment test (e.g. a Jest test configured with <code>testEnvironment: \'node\'</code>, or a small standalone Node script run as part of CI) actually boots the app through the REAL server rendering path, catching issues the PLATFORM_ID-override approach might miss (a module-scope <code>window</code> reference from a third-party library, for instance, which only fails when truly running under Node — not when merely overriding an injection token inside a browser-like test runner).',
        'This tier is heavier (an actual full render pass) and is typically reserved for a SMOKE TEST at the app-root level — "does the whole app render without throwing under Node.js" — rather than something run per-component; the PLATFORM_ID-override unit test is the right granularity for testing individual components\' platform-guard LOGIC.',
      ],
    },
    {
      heading: 'Testing afterNextRender() code paths',
      points: [
        'Code inside <code>afterNextRender()</code> only runs in the BROWSER, after the first render — a TestBed unit test with the default browser-like environment DOES execute it (since TestBed simulates a browser context), but it runs ASYNCHRONOUSLY relative to <code>fixture.detectChanges()</code>, so a test asserting on its effects needs to <code>await fixture.whenStable()</code> (the same pattern used to fix Category 2 timing failures in the Component Harnesses debugging subtopic) before checking the result.',
        'A test can ALSO confirm the negative case — that <code>afterNextRender()</code> code does NOT run during a server-simulated pass — by overriding <code>PLATFORM_ID</code> to <code>\'server\'</code> and asserting the DOM/state remains at its PRE-hydration value even after <code>fixture.detectChanges()</code>, directly proving the deferred-platform-class pattern from the hydration-mismatch subtopic actually defers as intended.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/theme.component.ts',
      content: `import { Component, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-theme',
  standalone: true,
  template: \`<p>Theme: {{ theme() }}</p>\`,
})
export class ThemeComponent {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);

  theme = signal(this.readInitialTheme());

  private readInitialTheme(): string {
    // Correctly guarded — this is exactly the pattern the main topic
    // recommends, and exactly what this subtopic's tests verify.
    if (this.isBrowser) {
      return localStorage.getItem('theme') ?? 'light';
    }
    return 'light'; // deterministic default for the server render
  }
}
`,
    },
    {
      path: 'src/app/theme.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ThemeComponent } from './theme.component';

describe('ThemeComponent — platform-guard verification', () => {
  it('reads localStorage in the BROWSER (default TestBed environment)', () => {
    localStorage.setItem('theme', 'dark');

    const fixture = TestBed.createComponent(ThemeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.theme()).toBe('dark');
    localStorage.removeItem('theme');
  });

  it('does NOT touch localStorage when PLATFORM_ID is overridden to "server"', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    // If ThemeComponent's guard were missing (a bare, unguarded
    // localStorage.getItem call), this would throw a ReferenceError right
    // here — in a real Node SSR process, that exact same missing guard
    // would crash the server on first request instead of failing a test.
    const fixture = TestBed.createComponent(ThemeComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.theme()).toBe('light'); // deterministic default
  });
});
`,
    },
    {
      path: 'src/app/enhanced-theme.component.ts',
      content: `import { Component, signal, afterNextRender } from '@angular/core';

@Component({
  selector: 'app-enhanced-theme',
  standalone: true,
  template: \`<p [class.enhanced]="isEnhanced()">Enhanced: {{ isEnhanced() }}</p>\`,
})
export class EnhancedThemeComponent {
  isEnhanced = signal(false);

  constructor() {
    afterNextRender(() => {
      this.isEnhanced.set(true);
    });
  }
}
`,
    },
    {
      path: 'src/app/enhanced-theme.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { EnhancedThemeComponent } from './enhanced-theme.component';

describe('EnhancedThemeComponent — afterNextRender() timing', () => {
  it('sets isEnhanced true after whenStable() in the browser', async () => {
    const fixture = TestBed.createComponent(EnhancedThemeComponent);
    fixture.detectChanges();

    // afterNextRender() runs asynchronously relative to detectChanges() —
    // whenStable() is required before asserting on its effect.
    await fixture.whenStable();

    expect(fixture.componentInstance.isEnhanced()).toBe(true);
  });

  it('does NOT run afterNextRender() effects when simulating the server', async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });

    const fixture = TestBed.createComponent(EnhancedThemeComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    // Proves the deferred-platform-class pattern actually defers as
    // intended — the initial render stays at its deterministic default.
    expect(fixture.componentInstance.isEnhanced()).toBe(false);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ThemeComponent } from './theme.component';
import { EnhancedThemeComponent } from './enhanced-theme.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ThemeComponent, EnhancedThemeComponent],
  template: \`
    <h3>Testing SSR-safe components without a real server</h3>
    <p>Open theme.component.spec.ts — PLATFORM_ID is overridden to 'server' in a
    normal TestBed unit test to simulate the SSR environment, catching a missing
    platform guard as a fast test failure instead of a real Node process crash.</p>
    <app-theme />
    <app-enhanced-theme />
  \`,
})
export class App {}
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
  <head><title>Testing SSR-Safe Components Without a Real Server</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a test proving the specific bug the main topic\'s "Common Mistakes" section warns about — an UNGUARDED <code>localStorage</code> access — actually throws when <code>PLATFORM_ID</code> is <code>\'server\'</code>. Create a deliberately broken component with no platform guard, then assert that creating it under a server-simulated TestBed throws.',
    hint: 'Define a small BrokenThemeComponent whose constructor or field initializer calls localStorage.getItem() directly with no isPlatformBrowser() check. In a test, override PLATFORM_ID to \'server\' and wrap TestBed.createComponent(BrokenThemeComponent) in an expect(() => ...).toThrow() (or a try/catch asserting a ReferenceError).',
    solution: `import { Component } from '@angular/core';

@Component({
  selector: 'app-broken-theme',
  standalone: true,
  template: \`<p>{{ theme }}</p>\`,
})
class BrokenThemeComponent {
  // No platform guard — this is the exact mistake the main topic warns about.
  theme = localStorage.getItem('theme') ?? 'light';
}

it('throws when the missing platform guard runs under a server-simulated environment', () => {
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
  });

  expect(() => {
    TestBed.createComponent(BrokenThemeComponent);
  }).toThrow();
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the only reliable way to verify SSR-safe code is to actually build and run the real Node.js server process.',
      reality: 'overriding PLATFORM_ID to \'server\' in a normal TestBed unit test simulates the server branch of every isPlatformBrowser() guard, catching missing guards as fast test failures — no real Node process, Express server, or full build required.',
    },
    {
      thought: 'a PLATFORM_ID override in TestBed is functionally identical to actually running the app under Node.js via @angular/platform-server.',
      reality: 'the TestBed override still runs inside Karma/Jest\'s browser-like or jsdom environment — it verifies platform-guard LOGIC correctly but can miss issues that only manifest under real Node.js, such as a third-party library referencing window at MODULE scope. Reserve an actual renderApplication() smoke test for that higher-fidelity check.',
    },
    {
      thought: 'a test that calls <code>fixture.detectChanges()</code> immediately captures the effect of any <code>afterNextRender()</code> code in the component.',
      reality: 'afterNextRender() runs ASYNCHRONOUSLY relative to detectChanges() — a test must await fixture.whenStable() before asserting on its effects, the same pattern needed to avoid Category 2 timing failures with component harnesses.',
    },
  ];
}
