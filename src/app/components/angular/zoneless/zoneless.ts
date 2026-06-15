import { Component, signal, computed, NgZone, inject } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-zoneless',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent,
    CommonMistakesComponent, PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './zoneless.html',
  styleUrl: './zoneless.scss',
})
export class ZonelessDemo {
  private ngZone = inject(NgZone);

  count       = signal(0);
  zoneLog     = signal<string[]>([]);
  double      = computed(() => this.count() * 2);

  increment() {
    this.count.update(n => n + 1);
    this.zoneLog.update(l => [`Signal updated → count = ${this.count()}`, ...l].slice(0, 6));
  }

  runOutsideZone() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        this.zoneLog.update(l => ['setTimeout outside zone — no CD triggered (plain property)', ...l].slice(0, 6));
      }, 100);
    });
  }

  prerequisites: Prerequisite[] = [
    { label: 'Signal Effects', route: '/angular/signal-effects' },
    { label: 'Change Detection', route: '/angular/change-detection' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'provideZonelessChangeDetection()', type: 'function', desc: 'Registers Angular\'s zoneless scheduler in app.config.ts. Stable from Angular 18+. Remove zone.js from polyfills alongside this.', since: '18' },
    { name: 'signal()', type: 'function', desc: 'Reactive primitive that notifies Angular\'s scheduler directly when its value changes — zone-agnostic, works in both zone and zoneless apps.', since: '16' },
    { name: 'computed()', type: 'function', desc: 'Derives a read-only signal from other signals. Lazily re-evaluated; triggers re-renders of only the templates that read it.', since: '16' },
    { name: 'NgZone', type: 'class', desc: 'Service with runOutsideAngular() (suppress CD) and run() (schedule CD). Still exists in zoneless apps — used to interop with third-party libraries.', since: '2' },
    { name: 'NgZone.run()', type: 'method', desc: 'Re-enters Angular\'s CD context from outside — the escape hatch for third-party library callbacks in zoneless apps that do not use signals.', since: '2' },
    { name: 'NgZone.runOutsideAngular()', type: 'method', desc: 'Suppresses Angular CD for a callback — use for high-frequency work (animation frames, canvas, WebGL) that must not trigger re-renders.', since: '2' },
    { name: 'ChangeDetectorRef.markForCheck()', type: 'method', desc: 'Manually schedules a component for re-check. Still needed in zoneless apps for state that changes outside the signal graph.', since: '2' },
    { name: 'async pipe', type: 'pipe', desc: 'Works in zoneless apps — subscribes, calls markForCheck() on each emission, and unsubscribes on destroy. Safe to use with HttpClient.', since: '2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Zone.js and the problem it solves',
      points: [
        'Zone.js is a library that monkey-patches all browser async APIs — <code>setTimeout</code>, <code>Promise.then</code>, <code>fetch</code>, <code>addEventListener</code> — to intercept when async work starts and finishes. After each async completion, it calls <code>ApplicationRef.tick()</code> to trigger a full change detection pass from the root.',
        'This was Angular\'s original solution to the question "how does Angular know when to re-render?" without requiring developers to manually signal state changes. It worked: Angular v2–v17 apps could use plain class fields and Angular would update the view after any user interaction or HTTP response.',
        'The cost is significant: Zone.js adds approximately <strong>50 kB</strong> to the production bundle, and it fires a full CD tree walk after <em>every</em> async event — including events from third-party libraries, animation frames, and timers that have nothing to do with Angular state.',
        'In large apps with many event listeners (analytics, monitoring, chat widgets, maps), Zone.js can trigger hundreds of unnecessary CD cycles per second. Each cycle checks every Default-strategy component in the tree, doing string-compare of template bindings.',
        'Zone.js also complicates SSR, Web Workers, and micro-frontend scenarios because it patches globals — if multiple Angular apps or modules load, they share the patched globals, which can cause interaction bugs. Zoneless mode eliminates all of these problems at the source.',
      ],
    },
    {
      heading: 'How zoneless change detection works',
      points: [
        'In zoneless mode, Angular\'s scheduler is driven entirely by the reactive graph. When a <code>signal()</code> value changes, the signal notifies every computed and template that depends on it — Angular\'s scheduler queues a micro-task to re-render only those components, without walking the entire tree.',
        'The <code>async</code> pipe still works: it calls <code>markForCheck()</code> internally when an Observable emits, which schedules the component for re-check on the next CD cycle. No zone notification needed.',
        '<code>HttpClient</code> works correctly in zoneless apps because it uses <code>RxJS</code> Observables consumed by either the <code>async</code> pipe or <code>httpResource()</code> — both of which schedule CD correctly through signals or <code>markForCheck()</code>.',
        'What does NOT work out of the box: plain class field mutations inside native callbacks (<code>setTimeout</code>, <code>setInterval</code>, <code>WebSocket.onmessage</code>) because nothing notifies the scheduler. The fix is always the same: use <code>signal()</code> for that state, or call <code>markForCheck()</code>.',
        'The performance model shifts: instead of "check everything after every async event," Angular now runs CD exactly when and where signals say to. In a fully signal-driven app, every re-render is targeted — no wasted cycles, no full-tree walks, no zone overhead.',
      ],
    },
    {
      heading: 'Setting up zoneless — step by step',
      points: [
        '<strong>Step 1</strong>: Add <code>provideZonelessChangeDetection()</code> to the <code>providers</code> array in <code>app.config.ts</code>. Do not remove zone.js yet — you can run both together during the migration period to identify what breaks.',
        '<strong>Step 2</strong>: Convert all mutable component state to <code>signal()</code>. Any plain field that the template reads and that changes via async callbacks must become a signal. Use <code>ng lint</code> rules (available as community plugins) to flag plain field mutations after async events.',
        '<strong>Step 3</strong>: Audit third-party library integrations. Libraries that directly mutate DOM or fire callbacks outside Angular\'s reactive graph need <code>ngZone.run(() => ...)</code> wrappers, or better — signal-based adapters.',
        '<strong>Step 4</strong>: Remove <code>zone.js</code> from the <code>polyfills</code> array in <code>angular.json</code> once all state is signal-driven and no third-party callbacks are breaking. This is the final step that actually reduces bundle size.',
        '<strong>Step 5</strong>: Update <code>TestBed</code> configuration. Add <code>provideZonelessChangeDetection()</code> to the testing module providers. Tests that used <code>fixture.detectChanges()</code> still work, but you may need to add <code>await fixture.whenStable()</code> after signal-based state changes.',
      ],
    },
    {
      heading: 'What breaks without Zone.js and how to fix it',
      points: [
        '<strong>Plain field mutations in async callbacks</strong>: <code>setTimeout(() => this.count++)</code> silently does nothing to the view. Fix: <code>this.count.update(n => n + 1)</code> — signals notify Angular regardless of zone context.',
        '<strong>Third-party libraries</strong> that call your callback from outside Angular\'s zone and mutate state: wrap with <code>this.ngZone.run(() => this.mySignal.set(data))</code>. This re-enters Angular\'s CD context and ensures the scheduler is notified.',
        '<strong>Manual <code>Observable</code> subscriptions</strong> that update non-signal state without <code>markForCheck()</code>: use <code>takeUntilDestroyed()</code> + subscribe, but call <code>this.cdr.markForCheck()</code> in the callback. Or: switch to signal-based state and use <code>toSignal()</code> to convert the Observable.',
        '<strong>Constructor-injected <code>NgZone</code> checks</strong>: some libraries use <code>NgZone.isInAngularZone()</code> to decide whether to schedule work. In a zoneless app this always returns false. Libraries that depend on this check need wrappers — check the library\'s changelog for zoneless compatibility notes.',
        '<strong>E2E test timing</strong>: Protractor and some Cypress helpers waited for zone stability. In zoneless apps, tests must wait for signals to settle instead. Angular\'s <code>fixture.whenStable()</code> and <code>fixture.detectChanges()</code> still work but the semantics change slightly — prefer signal-based assertions with <code>await fixture.whenStable()</code>.',
      ],
    },
    {
      heading: 'NgZone in zoneless apps — the interop layer',
      points: [
        '<code>NgZone</code> still exists in zoneless apps and can be injected. Its two key methods remain useful: <code>runOutsideAngular()</code> suppresses CD for high-frequency work; <code>run()</code> schedules a CD cycle from a non-Angular callback. Neither relies on Zone.js monkey-patching.',
        '<code>runOutsideAngular()</code> is the tool for animation frames, canvas renders, and polling loops. Running <code>requestAnimationFrame</code> inside Angular (with signals) would schedule a re-render every frame — wasteful. <code>runOutsideAngular</code> keeps these callbacks outside Angular\'s reactive tracking.',
        'Importantly: <code>signal.set()</code> called inside <code>runOutsideAngular</code> STILL notifies Angular\'s scheduler. The zone only controls whether the callback\'s completion is detected by Zone.js — signals bypass this entirely. Only plain field mutations are affected by zone context.',
        'When adapting a third-party library: prefer a thin adapter service that wraps callbacks in signals. This is cleaner than sprinkling <code>ngZone.run()</code> throughout components, and it makes the adapter unit-testable independently.',
        'Angular\'s test utilities (<code>fakeAsync</code>, <code>tick()</code>) are zone-based. In zoneless tests, prefer <code>async/await</code> with <code>fixture.whenStable()</code> instead of <code>fakeAsync</code>/<code>tick</code> for testing async signal updates.',
      ],
    },
    {
      heading: 'Production impact and when to migrate',
      points: [
        'Bundle size: removing zone.js saves approximately <strong>50 kB minified</strong> (~30 kB gzipped). For mobile users on slow connections this is meaningful — it reduces Time to Interactive and First Contentful Paint.',
        'Runtime performance: elimination of full-tree CD passes on every event is the bigger gain. In apps with complex component trees (100+ components), unnecessary CD cycles account for 20–40% of main-thread CPU time. Zoneless + signals brings this to near-zero.',
        'SSR and hydration: zoneless apps hydrate more predictably because the CD model is explicit (signals) rather than implicit (zone interception). Angular\'s incremental hydration (Angular 17+) works better with signal-driven apps because it can identify exactly which components need to be hydrated.',
        'Migration readiness checklist: (1) all state in signals, (2) all HTTP via async pipe or httpResource(), (3) all third-party callbacks wrapped or adapted, (4) TestBed configs updated, (5) E2E tests not relying on zone stability detection. Only migrate to fully zoneless when all five are checked.',
        'New projects in Angular 22 should start zoneless by default. The Angular team\'s stated trajectory is to deprecate zone.js-based CD in a future version — starting zoneless is future-proofing, not just an optimisation.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup & config',
      language: 'typescript',
      code: `// ── app.config.ts ────────────────────────────────────────────────
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideZonelessChangeDetection(),  // ← replaces provideZoneChangeDetection()
  ],
};

// ── angular.json — remove zone.js polyfill ───────────────────────
// BEFORE:
// "polyfills": ["zone.js"]
// AFTER:
// "polyfills": []

// ── TestBed — add zoneless provider to tests ─────────────────────
TestBed.configureTestingModule({
  providers: [
    provideZonelessChangeDetection(),   // ← same provider in tests
    // other providers...
  ],
});`,
    },
    {
      label: 'Signals drive rendering',
      language: 'typescript',
      code: `// In zoneless mode, signals are the ONLY automatic CD trigger.
// Angular tracks which templates read which signals and re-renders
// only those components when the signal changes.

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // optional but recommended
  template: \`
    <p>Count: {{ count() }}</p>        <!-- reads count signal -->
    <p>Double: {{ double() }}</p>      <!-- reads double computed -->
    <button (click)="increment()">+</button>
  \`,
})
export class CounterComponent {
  count  = signal(0);
  double = computed(() => this.count() * 2);

  increment() {
    this.count.update(n => n + 1);
    // 1. count signal marks itself dirty
    // 2. double computed is invalidated (lazy — not yet recalculated)
    // 3. Angular scheduler queues re-render of this component only
    // 4. On next micro-task: template re-evaluates count() and double()
    // All without Zone.js.
  }
}

// ── What doesn't work without signals ──────────────────────────────
@Component({ template: '<p>{{ count }}</p>' })
export class BrokenComponent {
  count = 0;
  increment() {
    setTimeout(() => {
      this.count++; // ← Zone.js gone: nothing notifies Angular → view stays stale
    }, 1000);
  }
}`,
    },
    {
      label: 'NgZone interop',
      language: 'typescript',
      code: `import { NgZone, inject } from '@angular/core';

@Component({})
export class InteropComponent {
  private ngZone = inject(NgZone);
  result = signal<string | null>(null);

  // ── Third-party library callback ──────────────────────────────────
  initLibrary() {
    thirdPartyLib.on('data', (payload) => {
      // Library runs callback outside Angular — use ngZone.run() to
      // ensure Angular's scheduler is notified, even without Zone.js
      this.ngZone.run(() => {
        this.result.set(payload.value);
      });
    });
  }

  // ── High-frequency work (canvas, animation) ───────────────────────
  startAnimation() {
    this.ngZone.runOutsideAngular(() => {
      const loop = () => {
        this.draw(); // plain canvas drawing — no CD
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    // Note: signal.set() inside runOutsideAngular STILL schedules CD
    // Only plain property mutations are undetected
  }

  // ── Observable → signal adapter ────────────────────────────────────
  // toSignal() converts an Observable to a signal — zoneless-safe
  private readonly data = toSignal(
    inject(DataService).data$, // Observable<string>
    { initialValue: '' }
  );
}`,
    },
    {
      label: 'Testing zoneless',
      language: 'typescript',
      code: `import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

describe('ZonelessCounterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],
      providers: [provideZonelessChangeDetection()], // ← required
    }).compileComponents();
  });

  it('should increment count via signal', async () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();                     // initial render

    const component = fixture.componentInstance;
    component.increment();

    await fixture.whenStable();                  // wait for micro-task scheduler
    fixture.detectChanges();                     // apply DOM updates

    const text = fixture.nativeElement.querySelector('p').textContent;
    expect(text).toContain('1');
  });

  it('should NOT use fakeAsync/tick for signal-based state', async () => {
    // fakeAsync is zone-based — use async/await instead
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();

    fixture.componentInstance.count.set(5);      // set signal directly
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.double()).toBe(10);
  });
});`,
    },
    {
      label: 'toSignal() for Observables',
      language: 'typescript',
      code: `import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// ── toSignal: Observable → signal (zoneless-safe) ────────────────
@Component({
  template: \`
    @if (user()) { <p>{{ user()!.name }}</p> }
    @if (loading()) { <p>Loading...</p> }
  \`,
})
export class UserComponent {
  private http = inject(HttpClient);
  private userId = signal(1);

  // toSignal() subscribes and updates the signal on each emission
  // Angular detects the signal change and re-renders without Zone.js
  user = toSignal(
    toObservable(this.userId).pipe(
      switchMap(id => this.http.get<User>('/api/users/' + id))
    ),
    { initialValue: null }
  );

  loading = computed(() => this.user() === null);
}

// ── toObservable: signal → Observable ────────────────────────────
// Useful when you need to feed a signal into an RxJS pipeline
const count$ = toObservable(this.count); // emits every time count() changes
const doubled$ = count$.pipe(map(n => n * 2));`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Zone.js-based CD vs zoneless providers',
      before: `// app.config.ts (default — zone.js required)
import { provideZoneChangeDetection } from '@angular/core';

export const appConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
  ],
};
// angular.json: "polyfills": ["zone.js"]  ← 50 kB in bundle`,
      after: `// app.config.ts (zoneless — Angular 18+ stable)
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig = {
  providers: [
    provideZonelessChangeDetection(),
  ],
};
// angular.json: "polyfills": []  ← 50 kB removed from bundle`,
      note: 'Swap one provider, remove one polyfill. The rest of the migration is converting state to signals.',
    },
    {
      title: 'Plain property mutation vs signal in async callback',
      before: `// Zone-based: Zone.js intercepts setTimeout and triggers CD
export class CounterComponent {
  count = 0;
  increment() {
    setTimeout(() => { this.count++; }, 500);
    // View updates because Zone.js calls ApplicationRef.tick()
  }
}`,
      after: `// Zoneless: signal.update() notifies Angular's scheduler directly
export class CounterComponent {
  count = signal(0);
  increment() {
    setTimeout(() => { this.count.update(n => n + 1); }, 500);
    // No Zone.js needed — signal notifies scheduler on its own
  }
}`,
      note: 'The code change is minimal — just wrap state in signal(). The runtime behavior is identical but no zone interception is involved.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Mutating plain class properties in async callbacks',
      wrong: `// Zoneless app — view never updates!
count = 0;
increment() {
  setTimeout(() => { this.count++; }, 500);
  setInterval(() => { this.total += 10; }, 1000);
}`,
      right: `count = signal(0);
total = signal(0);
increment() {
  setTimeout(() => { this.count.update(n => n + 1); }, 500);
  setInterval(() => { this.total.update(n => n + 10); }, 1000);
}`,
      explanation: 'Without Zone.js, plain property mutations inside async callbacks have no mechanism to notify Angular\'s scheduler. All mutable state used in templates must be a signal (or trigger markForCheck() manually).',
    },
    {
      title: 'Keeping zone.js in polyfills after enabling zoneless',
      wrong: `// angular.json — zone.js still loaded, wasting ~50 kB
"polyfills": ["zone.js"]`,
      right: `// angular.json — remove it after all state is signal-driven
"polyfills": []`,
      explanation: 'Loading Zone.js alongside the zoneless provider is safe during migration but wasteful in production. Once all state is signal-driven and no third-party callbacks break without zone.js, remove it to eliminate ~50 kB from the bundle.',
    },
    {
      title: 'Assuming signal.set() inside runOutsideAngular is suppressed',
      wrong: `this.ngZone.runOutsideAngular(() => {
  // Thinking signal mutations won't trigger CD from outside zone
  this.count.set(5); // WRONG assumption — this STILL triggers CD!
  // Use a plain field for work that must not cause re-renders
});`,
      right: `// For state that should NOT trigger CD, use a plain field
private frameCount = 0;
this.ngZone.runOutsideAngular(() => {
  const loop = () => {
    this.frameCount++; // plain field — no CD
    this.draw();
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
});`,
      explanation: 'signal.set() always notifies Angular\'s scheduler regardless of zone context. Zone context only affects whether Zone.js detects async completion. For high-frequency work that must not trigger re-renders, use plain private fields, not signals.',
    },
    {
      title: 'Using fakeAsync/tick in zoneless tests',
      wrong: `it('should update count', fakeAsync(() => {
  component.increment();
  tick(500); // zone-based — does not flush signal microtasks
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('1'); // fails
}));`,
      right: `it('should update count', async () => {
  component.increment();
  await fixture.whenStable(); // waits for signal micro-task scheduler
  fixture.detectChanges();
  expect(fixture.nativeElement.textContent).toContain('1'); // passes
});`,
      explanation: 'fakeAsync and tick() are zone-based utilities. In zoneless tests, signal updates are scheduled as micro-tasks. Use async/await with fixture.whenStable() to let the signal scheduler settle before asserting DOM state.',
    },
    {
      title: 'Forgetting provideZonelessChangeDetection() in TestBed',
      wrong: `beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent],
    // Missing zoneless provider — tests run with zone-based CD
    // Component signals may not trigger re-renders correctly
  }).compileComponents();
});`,
      right: `import { provideZonelessChangeDetection } from '@angular/core';

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent],
    providers: [provideZonelessChangeDetection()], // ← required for zoneless components
  }).compileComponents();
});`,
      explanation: 'TestBed uses zone-based CD by default. If your component is designed for a zoneless app, tests will behave differently without the zoneless provider — signal-triggered re-renders may not work as expected. Always mirror your app.config.ts providers in TestBed.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which provider enables zoneless change detection in Angular 18+?',
      options: [
        'provideZoneChangeDetection({ zoneless: true })',
        'provideZonelessChangeDetection()',
        'disableZoneJs()',
        'provideChangeDetection({ strategy: \'zoneless\' })',
      ],
      answer: 1,
      explanation: 'provideZonelessChangeDetection() is the correct provider (stable from Angular 18). It replaces zone-based CD with a signal-driven scheduler. Remove zone.js from polyfills in angular.json to also reduce bundle size.',
    },
    {
      q: 'In a zoneless Angular app, what happens when you mutate a plain class property inside a setTimeout callback?',
      options: [
        'The view updates because setTimeout is still patched by Zone.js',
        'Angular throws a runtime error about a missing zone',
        'The mutation does not trigger change detection — the view stays stale',
        'The async pipe automatically re-renders the component',
      ],
      answer: 2,
      explanation: 'Without Zone.js, setTimeout is not intercepted. Angular\'s scheduler is never notified of the mutation, so no re-render is scheduled. Fix: wrap state in signal() so that signal.update() notifies the scheduler directly.',
    },
    {
      q: 'A third-party library fires a callback and mutates Angular state. In a zoneless app, what is the correct fix?',
      options: [
        'The library cannot work in zoneless mode — remove it',
        'Wrap the callback with ngZone.run(() => ...) to schedule a CD cycle',
        'Switch the host component to Default change detection strategy',
        'Import zone.js only in that component\'s file',
      ],
      answer: 1,
      explanation: 'ngZone.run() schedules a CD cycle even without Zone.js. NgZone still exists in zoneless apps and its run() method is the standard interop pattern for third-party library callbacks. Better long-term: convert the state mutation to a signal so the library callback updates a signal instead.',
    },
    {
      q: 'Why does signal.set() trigger re-renders even inside NgZone.runOutsideAngular()?',
      options: [
        'Because runOutsideAngular only suppresses Zone.js detection, not the Angular reactive graph',
        'Because Angular re-enters the zone automatically when a signal is mutated',
        'Because signals always bypass change detection checks entirely',
        'Because runOutsideAngular has no effect in Angular 18+',
      ],
      answer: 0,
      explanation: 'runOutsideAngular() prevents Zone.js from detecting async completion — but signals notify Angular\'s scheduler directly through the reactive graph, which is independent of zone context. Plain property mutations inside runOutsideAngular are truly invisible to Angular; signal mutations are not.',
    },
    {
      q: 'What is the correct way to test signal-based state changes in a zoneless TestBed?',
      options: [
        'Use fakeAsync() and tick() as normal — they work with signals',
        'Use async/await with fixture.whenStable() to let the signal scheduler settle',
        'Call fixture.detectChanges() synchronously immediately after the signal update',
        'Signals don\'t need any special handling in tests — detectChanges() is sufficient',
      ],
      answer: 1,
      explanation: 'Signal updates are scheduled as micro-tasks. fakeAsync/tick is zone-based and does not flush the signal scheduler. Use async/await with await fixture.whenStable() to wait for all pending micro-tasks before asserting DOM state.',
    },
    {
      q: 'Does the async pipe work correctly in a zoneless Angular app?',
      options: [
        'No — the async pipe relies on Zone.js to trigger re-renders',
        'Yes — the async pipe calls markForCheck() internally when an Observable emits, which schedules a re-check without zone.js',
        'Only if the Observable is created inside NgZone.run()',
        'Only with Subjects — not with HttpClient Observables',
      ],
      answer: 1,
      explanation: 'The async pipe is zoneless-compatible. Internally it calls markForCheck() after each emission, which schedules a CD cycle through Angular\'s scheduler — no Zone.js interception required. HttpClient, BehaviorSubject, and all standard Observable types work correctly through the async pipe.',
    },
    {
      q: 'What approximately how much bundle size does removing zone.js save?',
      options: ['5 kB', '50 kB', '150 kB', '500 kB'],
      answer: 1,
      explanation: 'Zone.js weighs approximately 50 kB minified (~30 kB gzipped). While not enormous in absolute terms, it contributes to Time to Interactive and First Contentful Paint on slow connections — and provides zero benefit in a fully signal-driven app.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is Zone.js and why might you want to remove it?',
      a: 'Zone.js monkey-patches all browser async APIs to tell Angular when to run change detection. It adds ~50 kB to the bundle and has runtime overhead — every async event (click, timer, HTTP) triggers a full CD tree walk even if no relevant state changed. Removing it (going zoneless) eliminates wasted CD cycles and reduces bundle size. The tradeoff: all state that affects templates must be in signals (or use <code>markForCheck()</code>), because Angular no longer has zone-based auto-detection.',
    },
    {
      q: 'How do you enable zoneless change detection?',
      a: 'Two steps:<br><ol><li>Add <code>provideZonelessChangeDetection()</code> to the <code>providers</code> array in <code>app.config.ts</code>.</li><li>Remove <code>"zone.js"</code> from the <code>polyfills</code> array in <code>angular.json</code>.</li></ol>You can do step 1 alone first (both zone and zoneless providers co-exist during migration) to see what breaks before fully removing zone.js. Also add the provider to <code>TestBed</code> so tests match production behaviour.',
    },
    {
      q: 'What happens to setTimeout and setInterval in a zoneless app?',
      a: 'They still work as normal JavaScript — they just no longer trigger Angular\'s change detection automatically. Mutations to plain class properties inside these callbacks are invisible to Angular. The fix is always the same: use <code>signal()</code> for any state that changes in these callbacks. <code>signal.update()</code> notifies Angular\'s scheduler regardless of zone context — so <code>setInterval(() => this.count.update(n => n + 1), 1000)</code> works correctly in a fully zoneless app.',
    },
    {
      q: 'Do all Angular features work in zoneless mode?',
      a: 'Most do:<ul><li><strong>Signals, computed, effect</strong> — fully zoneless-native</li><li><strong>async pipe</strong> — works; calls <code>markForCheck()</code> internally</li><li><strong>HttpClient</strong> — works via async pipe or <code>httpResource()</code></li><li><strong>Router</strong> — works; navigation uses signals internally</li></ul>What needs attention:<ul><li><strong>Third-party libraries</strong> that mutate state directly — wrap in <code>ngZone.run()</code></li><li><strong>Manual Observable subscriptions</strong> without <code>async</code> pipe — add <code>markForCheck()</code></li><li><strong>fakeAsync in tests</strong> — replace with <code>async/await</code> + <code>fixture.whenStable()</code></li></ul>',
    },
    {
      q: 'Is using OnPush + signals + zoneless redundant?',
      a: 'Partially. In a fully signal-driven component, OnPush adds minimal benefit because Angular already only re-renders components whose signals changed. However, OnPush still matters for: (1) components that receive data through <code>@Input()</code> decorator inputs (not signal inputs), (2) components in partially-migrated codebases that still use mutable state, and (3) library components you don\'t control. Best practice: use OnPush on every component regardless — it\'s a safety net and makes the CD model explicit.',
    },
    {
      q: 'What is NgZone.runOutsideAngular() and when should you use it in a zoneless app?',
      a: '<code>ngZone.runOutsideAngular()</code> executes a callback in a context that suppresses Zone.js-based CD triggers. In a zoneless app it is useful for <strong>high-frequency work that must not trigger re-renders</strong> — canvas animation frames, WebGL render loops, or polling timers that update internal state without affecting the template. Important caveat: <code>signal.set()</code> inside <code>runOutsideAngular</code> <em>still triggers CD</em> because signals bypass zone context entirely. Use plain private fields (not signals) for data that must not cause re-renders.',
    },
    {
      q: 'How do you test a zoneless component with TestBed?',
      a: 'Add <code>provideZonelessChangeDetection()</code> to <code>TestBed.configureTestingModule({ providers: [...] })</code>. Then replace <code>fakeAsync</code>/<code>tick()</code> patterns with <code>async/await</code> + <code>await fixture.whenStable()</code>:<br><pre>it(\'updates\', async () => {<br>  component.count.set(5);<br>  await fixture.whenStable();<br>  fixture.detectChanges();<br>  expect(el.textContent).toContain(\'5\');<br>});</pre><code>fixture.whenStable()</code> waits for all pending micro-tasks (including signal scheduler flushes) before returning, making it safe to assert DOM state afterward.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Zoneless Angular removes Zone.js (~50 kB) and replaces automatic CD-on-every-async-event with signal-driven, surgical re-renders — Angular only updates the exact components whose signals changed, cutting wasted cycles to near-zero.',
    mustKnow: [
      'Enable with <code>provideZonelessChangeDetection()</code> in app.config.ts + remove <code>zone.js</code> from angular.json polyfills',
      'Without Zone.js, plain property mutations in async callbacks are invisible — all mutable template state must be a <code>signal()</code>',
      '<code>signal.set()</code> notifies Angular\'s scheduler directly, regardless of zone context — works inside <code>runOutsideAngular</code> and from third-party callbacks',
      'The <code>async</code> pipe and <code>HttpClient</code> work in zoneless apps — the async pipe calls <code>markForCheck()</code> internally on each emission',
      '<code>ngZone.run()</code> is the interop escape hatch for third-party library callbacks that don\'t use signals',
      '<code>runOutsideAngular()</code> suppresses CD for high-frequency loops (canvas, rAF) — use plain fields, not signals, for data that must not trigger re-renders',
      'In zoneless tests: use <code>provideZonelessChangeDetection()</code> in TestBed and <code>async/await + fixture.whenStable()</code> instead of <code>fakeAsync/tick</code>',
    ],
    interviewFocus: [
      'What does Zone.js do and what are its costs? Why would you remove it?',
      'Why does setTimeout(() => this.count++) break in a zoneless app, but setTimeout(() => this.count.update(n => n + 1)) work?',
      'Does signal.set() inside runOutsideAngular() trigger change detection? Why?',
      'How does the async pipe work without Zone.js?',
      'What changes in TestBed when testing a zoneless component?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a Zoneless Countdown Timer',
    language: 'typescript',
    description: 'Create a countdown timer component that works correctly in a zoneless Angular app. Use only signals for state — no Zone.js to trigger re-renders. Implement: a `timeLeft` signal (starts at 10), a `running` computed, `start()` using setInterval that decrements via signal.update(), and `reset()`. The timer must stop at 0 and set running to false automatically.',
    hints: [
      'Declare timeLeft = signal<number>(10) and isRunning = signal<boolean>(false)',
      'Store the interval ID in a private field (not a signal) — clearing the interval must not trigger CD',
      'In start(), guard against double-starts: if (this.isRunning()) return;',
      'In the setInterval callback, call signal.update() — this notifies Angular\'s scheduler without Zone.js',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-zoneless-timer',
  standalone: true,
  template: \`
    <div class="timer-card">
      <div class="time-display">{{ timeLeft() }}</div>
      <div class="status-badge">{{ running() ? 'Running' : 'Stopped' }}</div>
      <div class="controls">
        <button (click)="start()" [disabled]="running()">Start</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  \`,
})
export class ZonelessTimerComponent {
  // TODO: declare timeLeft signal (initial 10)
  // TODO: declare isRunning signal (initial false)
  // TODO: declare running computed

  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    // TODO: guard, set isRunning, setInterval with update()
  }

  reset() {
    // TODO: clearInterval, reset signals
  }
}`,
    solution: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-zoneless-timer',
  standalone: true,
  template: \`
    <div class="timer-card">
      <div class="time-display">{{ timeLeft() }}</div>
      <div class="status-badge">{{ running() ? 'Running' : 'Stopped' }}</div>
      <div class="controls">
        <button (click)="start()" [disabled]="running()">Start</button>
        <button (click)="reset()">Reset</button>
      </div>
    </div>
  \`,
})
export class ZonelessTimerComponent {
  timeLeft  = signal<number>(10);
  isRunning = signal<boolean>(false);
  running   = computed(() => this.isRunning());

  private intervalId: ReturnType<typeof setInterval> | null = null;

  start() {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.intervalId = setInterval(() => {
      this.timeLeft.update(t => {
        if (t <= 1) {
          clearInterval(this.intervalId!);
          this.intervalId = null;
          this.isRunning.set(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    // signal.update() inside setInterval notifies Angular's scheduler
    // even without Zone.js — the view updates on every tick
  }

  reset() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning.set(false);
    this.timeLeft.set(10);
  }
}`,
  };
}
