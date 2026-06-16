import { Component, signal, computed, input, output } from '@angular/core';
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
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

// ── Counter component (used as subject under test) ────────────────────────────
@Component({
  selector: 'app-counter-under-test',
  standalone: true,
  template: `
    <div class="counter-box">
      <h3>Counter: {{ count() }}</h3>
      <p>Label: {{ label() }}</p>
      <button (click)="decrement()" [disabled]="count() <= 0">−</button>
      <button (click)="increment()">+</button>
      <button (click)="reset()">Reset</button>
    </div>`,
  styles: [`
    .counter-box { padding:1rem; border:1px solid #e0e0e0; border-radius:8px; display:inline-flex; flex-direction:column; gap:.5rem; }
    h3 { margin:0; font-size:1.1rem; }
    p { margin:0; color:#666; font-size:.85rem; }
    button { padding:.35rem .75rem; border:1px solid #ccc; border-radius:6px; cursor:pointer; &:disabled { opacity:.4; cursor:not-allowed; } }
  `],
})
export class CounterUnderTest {
  label = input('Default counter');
  changed = output<number>();

  count = signal(0);

  increment() { this.count.update(n => n + 1); this.changed.emit(this.count()); }
  decrement() { if (this.count() > 0) { this.count.update(n => n - 1); this.changed.emit(this.count()); } }
  reset()     { this.count.set(0); this.changed.emit(0); }
  double      = computed(() => this.count() * 2);
}

// ── Demo page ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-testing-demo',
  imports: [CodeBlockComponent, TheoryBlockComponent, CounterUnderTest, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './testing-demo.html',
  styleUrl: './testing-demo.scss',
})
export class TestingDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Signals', route: '/angular/signals' },
    { label: 'Components', route: '/angular/components' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'TestBed — Angular\'s test harness',
      points: [
        '<code>TestBed.configureTestingModule({ imports: [MyComponent] })</code> bootstraps a mini Angular environment for each test — standalone components go in <code>imports[]</code>, never <code>declarations[]</code>.',
        '<code>TestBed.createComponent(MyComponent)</code> creates a <code>ComponentFixture</code> — a wrapper around both the component instance and its rendered DOM.',
        'Call <code>fixture.detectChanges()</code> at least once to trigger the initial render; subsequent calls are needed after actions that change zone-based state (not needed for signal reads).',
        'Override providers per-test: <code>TestBed.overrideProvider(MyService, { useValue: mockService })</code> — or use <code>providers</code> inside <code>configureTestingModule</code> to swap the real service for a test double.',
        'Use <code>TestBed.inject(Token)</code> after configuration to retrieve any registered provider — useful to get the mock service instance and spy on it in assertions.',
      ],
    },
    {
      heading: 'ComponentFixture and DOM queries',
      points: [
        '<code>fixture.componentInstance</code> gives direct access to the component class — read signals, call methods, and inspect computed values without going through the DOM.',
        '<code>fixture.nativeElement</code> is the host DOM element; use <code>.querySelector</code> / <code>.querySelectorAll</code> for low-level DOM queries when accessibility queries are not applicable.',
        '<code>fixture.debugElement</code> is Angular\'s wrapper around the DOM — use <code>By.css(\'.class\')</code> or <code>By.directive(MyDir)</code> to query with Angular awareness including directive instances.',
        '<code>fixture.componentRef.setInput(\'label\', \'New\')</code> sets signal-based <code>input()</code> inputs in tests — do not assign to the input property directly as that bypasses the signal setter.',
        '<code>fixture.whenStable()</code> returns a Promise that resolves after all pending microtasks and macrotasks finish — use in <code>async/await</code> tests when not using <code>fakeAsync</code>.',
      ],
    },
    {
      heading: '@testing-library/angular — user-centric queries',
      points: [
        'RTL wraps TestBed with accessible query helpers: <code>screen.getByRole</code>, <code>screen.getByText</code>, <code>screen.getByLabelText</code> — these query what users and screen readers actually perceive.',
        'Query priority: <strong>role → label → text → testid</strong>. <code>getByRole(\'button\', { name: /submit/i })</code> verifies both semantics and accessible name in one assertion.',
        '<code>userEvent.click(el)</code> simulates a real browser interaction including focus, pointer events, and keyboard — far more realistic than <code>fireEvent.click</code> which dispatches only one synthetic event.',
        '<code>await render(MyComponent, { componentInputs: { label: \'X\' } })</code> renders with inputs declaratively; combine with <code>componentProviders</code> to inject mocks.',
        'RTL tests survive DOM refactors — if you rename a CSS class or restructure markup but keep the accessible name, tests still pass. This is impossible with <code>querySelector(\'button.my-btn\')</code>.',
      ],
    },
    {
      heading: 'Testing signals and computed values',
      points: [
        'Signal reads are <strong>synchronous</strong> — after calling <code>comp.increment()</code>, read <code>comp.count()</code> immediately; no <code>detectChanges()</code>, <code>tick()</code>, or <code>await</code> needed for the signal value itself.',
        'Computed signals also resolve synchronously: set the dependency signal, then read the computed — e.g. <code>comp.count.set(3); expect(comp.double()).toBe(6);</code>.',
        'When asserting that signal changes appear <em>in the DOM</em>, you do need <code>fixture.detectChanges()</code> — Angular batches DOM updates in a change detection cycle even in signal components.',
        'Use <code>fixture.componentRef.setInput(\'name\', value)</code> to set <code>input()</code> signals in tests; verify via <code>comp.name()</code> or DOM text assertions after detectChanges.',
        'For <code>output()</code>, subscribe <strong>before</strong> detectChanges and before triggering any action: <code>const emits: T[] = []; comp.changed.subscribe(v => emits.push(v));</code> — subscriptions set up after emissions are missed.',
      ],
    },
    {
      heading: 'Testing HTTP with HttpTestingController',
      points: [
        'Add <code>provideHttpClient()</code> and <code>provideHttpClientTesting()</code> to <code>providers</code> in <code>configureTestingModule</code> — the testing provider intercepts HTTP calls so no real network traffic occurs.',
        '<code>const req = httpTesting.expectOne(\'/api/posts\')</code> asserts that exactly one request was made to that URL and returns the request handle — the test fails immediately if zero or more than one request was made.',
        '<code>req.flush(mockData)</code> delivers the mock response body and triggers the subscription callback in the service under test.',
        '<code>req.flush(null, { status: 404, statusText: \'Not Found\' })</code> simulates HTTP errors — test your error handling path without a real server.',
        'Always call <code>httpTesting.verify()</code> in <code>afterEach</code> — it throws if any requests were made but never flushed, catching accidental extra HTTP calls that would silently pass otherwise.',
      ],
    },
    {
      heading: 'fakeAsync, tick(), and async testing patterns',
      points: [
        '<code>fakeAsync()</code> wraps a test body in a fake asynchronous zone where <code>setTimeout</code>, <code>setInterval</code>, and RxJS timer-based operators can be controlled with virtual time instead of real time.',
        '<code>tick(ms)</code> advances virtual time by the specified milliseconds — call it <em>after</em> the action that starts the timer and <em>before</em> your assertion: <code>trigger(); tick(600); expect(result);</code>.',
        'For <code>debounceTime(300)</code> in a stream, call <code>tick(300)</code> (or more); for <code>setInterval(fn, 1000)</code>, call <code>tick(1000)</code> once per iteration or <code>discardPeriodicTasks()</code> to stop runaway timers.',
        '<code>flushMicrotasks()</code> drains the microtask queue (Promises, queueMicrotask) without advancing macro-timers — combine with <code>tick()</code> when mixing Promises and timers.',
        'Alternative: use <code>async/await</code> + <code>fixture.whenStable()</code> for simpler async flows with real Promises — useful when the code under test returns a Promise and no virtual time control is needed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'TestBed basics',
      language: 'typescript',
      code: `import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CounterComponent],  // standalone — just import it
    });
  });

  it('should start at 0', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.count()).toBe(0);
  });

  it('should increment when + clicked', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button:last-of-type');
    btn.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.count()).toBe(1);
  });
});`,
    },
    {
      label: '@testing-library',
      language: 'typescript',
      code: `import { render, screen, fireEvent } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { CounterComponent } from './counter.component';

describe('CounterComponent (RTL)', () => {
  it('shows count and handles increment', async () => {
    const user = userEvent.setup();

    await render(CounterComponent, {
      componentInputs: { label: 'My counter' },
    });

    expect(screen.getByText('Counter: 0')).toBeInTheDocument();
    expect(screen.getByText('Label: My counter')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '+' }));
    expect(screen.getByText('Counter: 1')).toBeInTheDocument();
  });

  it('disables − button when count is 0', async () => {
    await render(CounterComponent);
    expect(screen.getByRole('button', { name: '−' })).toBeDisabled();
  });
});`,
    },
    {
      label: 'Service test',
      language: 'typescript',
      code: `import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PostsService } from './posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PostsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service  = TestBed.inject(PostsService);
    http     = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());  // ← ensure no outstanding requests

  it('fetches posts', () => {
    service.getPosts().subscribe(posts => {
      expect(posts.length).toBe(2);
    });

    const req = http.expectOne('/api/posts');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, title: 'Post A' }, { id: 2, title: 'Post B' }]);
  });

  it('handles 404 errors', () => {
    let error: any;
    service.getPosts().subscribe({ error: e => error = e });

    const req = http.expectOne('/api/posts');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    expect(error.status).toBe(404);
  });
});`,
    },
    {
      label: 'Signal testing',
      language: 'typescript',
      code: `import { TestBed } from '@angular/core/testing';
import { CounterComponent } from './counter.component';

describe('Signal-based component', () => {
  it('computed doubles correctly', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    const comp    = fixture.componentInstance;
    fixture.detectChanges();

    expect(comp.double()).toBe(0);  // 0 * 2

    comp.increment();
    comp.increment();
    // No detectChanges needed to read signal values — they compute immediately
    expect(comp.count()).toBe(2);
    expect(comp.double()).toBe(4);
  });

  it('emits output on change', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    const comp    = fixture.componentInstance;
    const emitted: number[] = [];

    // Subscribe BEFORE detectChanges and before triggering actions
    comp.changed.subscribe((v: number) => emitted.push(v));
    fixture.detectChanges();

    comp.increment();
    comp.decrement();
    expect(emitted).toEqual([1, 0]);
  });

  it('sets signal input via componentRef.setInput', () => {
    const fixture = TestBed.createComponent(CounterComponent);
    fixture.detectChanges();

    fixture.componentRef.setInput('label', 'Custom Label');
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('p');
    expect(el.textContent).toContain('Custom Label');
  });
});`,
    },
    {
      label: 'fakeAsync',
      language: 'typescript',
      code: `import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

@Component({
  standalone: true, template: '',
})
class SearchComp {
  input$ = new Subject<string>();
  result = signal('');

  constructor() {
    this.input$.pipe(debounceTime(400)).subscribe(v => this.result.set(v));
  }
}

describe('fakeAsync patterns', () => {
  it('debounce fires after 400ms', fakeAsync(() => {
    const fixture = TestBed.createComponent(SearchComp);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.input$.next('hello');
    expect(comp.result()).toBe('');   // not yet — debounce not elapsed

    tick(400);  // advance virtual time past the debounce threshold
    expect(comp.result()).toBe('hello');
  }));

  it('does NOT fire if another emission arrives within the window', fakeAsync(() => {
    const fixture = TestBed.createComponent(SearchComp);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.input$.next('h');
    tick(200);
    comp.input$.next('hello');
    tick(400);  // only the final emission matters

    expect(comp.result()).toBe('hello');
  }));
});`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the correct way to set up a standalone Angular component in TestBed?',
      options: [
        'TestBed.configureTestingModule({ declarations: [MyComponent] })',
        'TestBed.configureTestingModule({ imports: [MyComponent] })',
        'TestBed.configureTestingModule({ providers: [MyComponent] })',
        'TestBed.configureTestingModule({ components: [MyComponent] })',
      ],
      answer: 1,
      explanation: 'Standalone components are imported via the imports array in configureTestingModule — no NgModule or declarations needed. This mirrors how you use them in production code.',
    },
    {
      q: 'You call comp.increment() twice on a signal-based component. What do you need before asserting comp.count() === 2?',
      options: [
        'Call fixture.detectChanges() to flush change detection',
        'Wrap the calls in fakeAsync and call tick()',
        'Nothing — signal reads are synchronous and update immediately',
        'Call fixture.whenStable() and await the promise',
      ],
      answer: 2,
      explanation: 'Signal reads are synchronous. After calling comp.increment() the signal value is already updated — no detectChanges(), tick(), or async helpers are needed to read the current value.',
    },
    {
      q: 'In a fakeAsync test with debounceTime(600), when should you call tick()?',
      options: [
        'Before triggering the event so the timer is pre-warmed',
        'After triggering the event and before your assertion, passing at least 600ms',
        'After your assertion to clean up pending timers',
        'tick() is only for setInterval, not debounceTime',
      ],
      answer: 1,
      explanation: 'fakeAsync controls virtual time. You trigger the event first (which starts the debounce timer), then call tick(600) to advance virtual time past the 600ms threshold, then make your assertion.',
    },
    {
      q: 'Why should you call httpTestingController.verify() in afterEach when testing HTTP services?',
      options: [
        'It flushes pending requests so the test completes faster',
        'It resets the TestBed module between tests',
        'It ensures no unexpected or unflushed HTTP requests remain after each test',
        'It is required to initialise HttpTestingController before the next test',
      ],
      answer: 2,
      explanation: 'httpTestingController.verify() throws if any HTTP requests were made but not explicitly expected and flushed. Calling it in afterEach catches accidental extra requests that would otherwise silently pass.',
    },
    {
      q: 'Given the CounterUnderTest component, how would you test that the \'changed\' output emits the correct value after reset()?',
      options: [
        'Spy on the DOM event with spyOn(window, \'dispatchEvent\')',
        'Access fixture.nativeElement and listen for a custom event',
        'Call fixture.debugElement.query(By.css(\'button\')).triggerEventHandler(\'click\', null)',
        'Subscribe to comp.changed before calling reset(), then assert the emitted array contains 0',
      ],
      answer: 3,
      explanation: 'Angular outputs created with output() expose a subscribe method. You collect emitted values into an array before triggering the action, then assert the array contents after — this is the pattern shown in the Signal testing code tab.',
    },
    {
      q: 'How do you correctly set a signal-based input() on a component in TestBed?',
      options: [
        'comp.label = \'New\' — assign directly to the property',
        'fixture.componentRef.setInput(\'label\', \'New\') — use the fixture API',
        'fixture.nativeElement.setAttribute(\'label\', \'New\')',
        'TestBed.overrideComponent(MyComp, { set: { inputs: [\'label\'] } })',
      ],
      answer: 1,
      explanation: 'fixture.componentRef.setInput() is the correct API for setting signal-based inputs in tests. Directly assigning to the property bypasses the signal setter and the change will not propagate correctly.',
    },
    {
      q: 'You need to simulate a 404 HTTP error in a service test. How do you do this with HttpTestingController?',
      options: [
        'http.expectOne(url).error(new ErrorEvent(\'network error\'))',
        'http.expectOne(url).flush(null, { status: 404, statusText: \'Not Found\' })',
        'http.expectOne(url).cancel()',
        'Throw inside the queryFn before flushing',
      ],
      answer: 1,
      explanation: 'req.flush() accepts an optional init object with status and statusText to simulate HTTP error responses. Angular\'s HttpClient will deliver this as an HttpErrorResponse to the subscriber\'s error handler.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between TestBed and @testing-library/angular?', a: '<code>TestBed</code> gives you direct access to the component instance and DOM — great for unit testing Angular-specific behaviour (inputs, outputs, DI). <code>@testing-library</code> tests from the user\'s perspective using accessible queries — more resilient to refactors and also wraps TestBed internally.' },
    { q: 'How do you query elements in @testing-library without CSS selectors?', a: 'Use semantic queries: <code>getByRole(\'button\', { name: /submit/i })</code>, <code>getByLabelText(\'Email\')</code>, <code>getByText(\'Hello\')</code>. These survive DOM refactors — if the accessible name is correct, the test passes regardless of markup structure.' },
    { q: 'How do you test signal state changes?', a: 'Signal reads are synchronous — change the signal, then immediately assert: <code>component.count.set(5); expect(component.double()).toBe(10);</code>. No <code>detectChanges()</code> or async needed for signal values. You only need detectChanges() when asserting DOM changes driven by those signals.' },
    { q: 'How do you mock HTTP requests in tests?', a: 'Add <code>provideHttpClient()</code> and <code>provideHttpClientTesting()</code> to providers. Then: <code>const req = httpTesting.expectOne(\'/api/posts\'); req.flush(mockData);</code>. Call <code>httpTesting.verify()</code> in <code>afterEach</code> to catch unexpected requests.' },
    { q: 'How do you test a component that uses inject()?', a: 'Configure <code>TestBed.configureTestingModule({ providers: [{ provide: MyService, useValue: mockService }] })</code>. The component receives the mock via DI automatically — no need to manually instantiate. Use <code>TestBed.inject(MyService)</code> to get the same instance in your test assertions.' },
    { q: 'What is a fixture and how do you use it?', a: '<code>const fixture = TestBed.createComponent(MyComponent)</code>. <code>fixture.componentInstance</code> is the component class. <code>fixture.nativeElement</code> is the host DOM element. Call <code>fixture.detectChanges()</code> to trigger the initial render and subsequent change detection cycles.' },
    { q: 'When should you use fakeAsync + tick vs async + whenStable?', a: 'Use <code>fakeAsync + tick</code> when you need to control virtual time for <code>setTimeout</code>, <code>setInterval</code>, or RxJS timer-based operators (<code>debounceTime</code>, <code>delay</code>) — it lets you advance time without real waiting. Use <code>async + whenStable()</code> for simpler flows involving native Promises where you don\'t need timer control.' },
    { q: 'How do you test a component with ChangeDetectionStrategy.OnPush?', a: 'You still configure TestBed normally and call <code>fixture.detectChanges()</code> — TestBed handles OnPush correctly. To push new input values, use <code>fixture.componentRef.setInput(\'name\', newValue)</code> for signal inputs, or set the <code>@Input()</code> property and call <code>fixture.detectChanges()</code>. For programmatic triggers, <code>fixture.componentInstance.someSignal.set(value)</code> marks the view dirty automatically.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'TestBed', type: 'class', desc: 'Angular\'s primary testing harness that bootstraps a mini Angular environment for unit and integration tests.' , since: '2'},
    { name: 'TestBed.configureTestingModule', type: 'function', desc: 'Configures the testing module with imports (standalone comps), providers (mocks), and other Angular metadata.' , since: '2'},
    { name: 'TestBed.createComponent', type: 'function', desc: 'Creates a ComponentFixture wrapping the component instance and its DOM for inspection and interaction.' , since: '2'},
    { name: 'ComponentFixture', type: 'class', desc: 'Wrapper returned by createComponent — exposes componentInstance, nativeElement, debugElement, and detectChanges().' , since: '2'},
    { name: 'fakeAsync', type: 'function', desc: 'Wraps a test in a fake async zone so you can control time with tick() for setTimeout and debounce operators.' , since: '2'},
    { name: 'tick', type: 'function', desc: 'Advances virtual time inside a fakeAsync zone by the specified number of milliseconds.' , since: '2'},
    { name: 'HttpTestingController', type: 'class', desc: 'Intercepts HTTP requests in tests via expectOne/expectNone and req.flush() — no real network calls.' , since: '4'},
    { name: 'provideHttpClientTesting', type: 'function', desc: 'Functional provider replacing HttpClientTestingModule — registers HttpTestingController for HTTP interception.' , since: '17'},
    { name: 'render', type: 'function', desc: 'From @testing-library/angular — renders a standalone component with optional inputs and returns screen queries.' , since: '14'},
    { name: 'screen.getByRole', type: 'function', desc: 'RTL query that finds elements by ARIA role and accessible name, making tests resilient to DOM structure changes.' , since: '14'},
    { name: 'componentRef.setInput', type: 'method', desc: 'Sets a signal-based input() on a component fixture — the correct way to push input values in tests.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Configuring TestBed: NgModule declarations vs standalone imports',
      before: '// Old: NgModule-based component\nTestBed.configureTestingModule({\n  declarations: [CounterComponent],\n  imports: [CommonModule],\n});',
      after: '// New: standalone component — just import it\nTestBed.configureTestingModule({\n  imports: [CounterComponent],\n});',
      note: 'Standalone components (Angular 14+) go in imports[], not declarations[]. No extra NgModule needed.',
    },
    {
      title: 'Querying elements: nativeElement selectors vs RTL semantic queries',
      before: '// Old: CSS selector — brittle, tests implementation\nconst btn = fixture.nativeElement\n  .querySelector(\'button.increment-btn\');\nbtn.click();',
      after: '// New: RTL role query — tests what users see\nconst btn = screen.getByRole(\'button\', { name: \'+\' });\nawait user.click(btn);',
      note: 'Role-based queries survive CSS refactors and verify accessible names at the same time.',
    },
    {
      title: 'Asserting signal state: detectChanges vs direct read',
      before: '// Old: zone/Observable pattern required detectChanges\ncomp.increment();\nfixture.detectChanges();\nawait fixture.whenStable();\nexpect(el.textContent).toBe(\'1\');',
      after: '// New: signals are synchronous — read immediately\ncomp.increment();\n// No detectChanges needed for signal values\nexpect(comp.count()).toBe(1);\nexpect(comp.double()).toBe(2);\n// Only detectChanges for DOM assertions\nfixture.detectChanges();\nexpect(el.textContent).toContain(\'1\');',
      note: 'Signal reads compute immediately — detectChanges is only required when asserting DOM output, not signal values.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using declarations[] for standalone components',
      wrong: 'TestBed.configureTestingModule({\n  declarations: [MyStandaloneComponent],\n});',
      right: 'TestBed.configureTestingModule({\n  imports: [MyStandaloneComponent],\n});',
      explanation: 'Standalone components must be placed in imports[], not declarations[]. Using declarations[] causes a compile error because standalone components are self-contained modules.',
    },
    {
      title: 'Subscribing to outputs after detectChanges (missing early emissions)',
      wrong: 'fixture.detectChanges();\ncomp.changed.subscribe(v => emitted.push(v));\ncomp.increment();',
      right: 'const emitted: number[] = [];\ncomp.changed.subscribe(v => emitted.push(v)); // before detectChanges!\nfixture.detectChanges();\ncomp.increment();',
      explanation: 'Subscribe to outputs before detectChanges and before triggering any action — otherwise emissions that occur during initialisation or the triggering action itself are missed.',
    },
    {
      title: 'Forgetting httpTestingController.verify() after HTTP tests',
      wrong: 'afterEach(() => {\n  // nothing — silent pass even if extra requests exist\n});',
      right: 'afterEach(() => {\n  httpTestingController.verify();\n});',
      explanation: 'Without verify(), unexpected or un-flushed HTTP requests silently pass. verify() throws if any requests remain, catching accidental extra calls early.',
    },
    {
      title: 'Using tick() outside fakeAsync or with insufficient time',
      wrong: 'it(\'debounce test\', () => {\n  trigger();\n  tick(100); // error: tick() not in fakeAsync!\n  expect(result).toBeDefined();\n});',
      right: 'it(\'debounce test\', fakeAsync(() => {\n  trigger();\n  tick(600); // advance past the debounceTime(600)\n  expect(result).toBeDefined();\n}));',
      explanation: 'tick() only works inside a fakeAsync() wrapper. Also pass at least as many milliseconds as the debounce/setTimeout delay, or the timer will not fire.',
    },
    {
      title: 'Directly assigning to a signal input() property instead of setInput()',
      wrong: '// Does not trigger signal propagation correctly\nconst comp = fixture.componentInstance;\n(comp as any).label = \'New Label\';\nfixture.detectChanges();',
      right: '// Use the fixture API to set signal inputs\nfixture.componentRef.setInput(\'label\', \'New Label\');\nfixture.detectChanges();',
      explanation: 'Signal-based input() properties are readonly wrappers managed by Angular. Assigning to them directly bypasses the signal mechanism. fixture.componentRef.setInput() is the correct way to push new input values in tests.',
    },
  ];

  challenge: Challenge = {
    title: 'Write Unit Tests for a Toggle Component',
    description: 'A ToggleComponent has a boolean signal \'isOn\' (default false), a \'toggled\' output that emits the new boolean value, and a toggle() method. It also has a computed signal \'label\' that returns \'ON\' when isOn is true and \'OFF\' when false.\n\nUsing TestBed and Jasmine/Jest, write a complete describe block that:\n1. Configures the TestBed with the standalone component\n2. Tests that isOn starts as false and label() returns \'OFF\'\n3. Tests that calling toggle() flips isOn to true and label() returns \'ON\'\n4. Tests that the \'toggled\' output emits the new value when toggle() is called\n5. Uses fakeAsync + tick to test a hypothetical 300ms debounced side-effect (delayedLog) that appends to a \'log\' array',
    language: 'typescript',
    hints: [
      'For standalone components use imports: [ToggleComponent] inside configureTestingModule — not declarations',
      'Signal values are read synchronously — no detectChanges() needed between comp.toggle() and reading comp.isOn()',
      'Subscribe to comp.toggled before calling toggle() and collect values into a local array to assert later',
      'Wrap the fakeAsync test body with fakeAsync(() => { ... }) and call tick(300) after triggering the action to advance virtual time past the debounce',
    ],
    starterCode: `import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal, computed, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: '<button (click)="toggle()">{{ label() }}</button>',
})
export class ToggleComponent {
  isOn = signal(false);
  toggled = output<boolean>();
  label = computed(() => this.isOn() ? 'ON' : 'OFF');
  log: string[] = [];

  toggle() {
    this.isOn.update(v => !v);
    this.toggled.emit(this.isOn());
  }

  // Simulates a debounced side-effect (300ms delay)
  delayedLog() {
    setTimeout(() => {
      this.log.push('logged at ' + this.isOn());
    }, 300);
  }
}

// TODO: Write the test suite below
describe('ToggleComponent', () => {
  // TODO 1: Add beforeEach to configure TestBed

  // TODO 2: Test initial state (isOn = false, label = 'OFF')

  // TODO 3: Test toggle() flips state and updates label

  // TODO 4: Test 'toggled' output emits the new boolean value

  // TODO 5: Use fakeAsync + tick(300) to test delayedLog appends to log
});`,
    solution: `import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, signal, computed, output } from '@angular/core';

@Component({
  selector: 'app-toggle',
  standalone: true,
  template: '<button (click)="toggle()">{{ label() }}</button>',
})
export class ToggleComponent {
  isOn = signal(false);
  toggled = output<boolean>();
  label = computed(() => this.isOn() ? 'ON' : 'OFF');
  log: string[] = [];

  toggle() {
    this.isOn.update(v => !v);
    this.toggled.emit(this.isOn());
  }

  delayedLog() {
    setTimeout(() => {
      this.log.push('logged at ' + this.isOn());
    }, 300);
  }
}

describe('ToggleComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToggleComponent], // standalone — use imports, not declarations
    });
  });

  it('should start with isOn = false and label OFF', () => {
    const fixture = TestBed.createComponent(ToggleComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.isOn()).toBe(false);
    expect(comp.label()).toBe('OFF');
  });

  it('should flip isOn to true and update label to ON after toggle()', () => {
    const fixture = TestBed.createComponent(ToggleComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.toggle();
    // Signal reads are synchronous — no detectChanges needed
    expect(comp.isOn()).toBe(true);
    expect(comp.label()).toBe('ON');
  });

  it('should emit the new boolean value via toggled output', () => {
    const fixture = TestBed.createComponent(ToggleComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    const emitted: boolean[] = [];
    comp.toggled.subscribe((v: boolean) => emitted.push(v));

    comp.toggle(); // false -> true
    comp.toggle(); // true -> false

    expect(emitted).toEqual([true, false]);
  });

  it('should append to log after 300ms via delayedLog', fakeAsync(() => {
    const fixture = TestBed.createComponent(ToggleComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.toggle(); // isOn = true
    comp.delayedLog();

    expect(comp.log.length).toBe(0); // not fired yet

    tick(300); // advance virtual time past the 300ms setTimeout

    expect(comp.log.length).toBe(1);
    expect(comp.log[0]).toBe('logged at true');
  }));
});`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular testing uses TestBed to bootstrap a mini Angular environment; standalone components go in imports[], signal values read synchronously, and HttpTestingController intercepts HTTP without real network calls.',
    mustKnow: [
      'Standalone components belong in imports[], not declarations[], in configureTestingModule',
      'Signal values are synchronous — read comp.count() directly after comp.increment() with no detectChanges needed for the value; only detectChanges for DOM assertions',
      'Subscribe to output() signals BEFORE detectChanges and before triggering actions or you miss early emissions',
      'HttpTestingController: expectOne(url) → flush(data) → verify() in afterEach — this is the complete HTTP test pattern',
      'fakeAsync + tick(ms) controls virtual time for setTimeout and debounceTime — tick() only works inside a fakeAsync() wrapper',
      'fixture.componentRef.setInput(\'label\', value) is the correct way to push values to signal-based input() properties in tests',
      'provideNoopAnimations() in test providers skips animation delays that would otherwise block DOM assertions',
    ],
    interviewFocus: [
      'What goes in imports[] vs declarations[] in configureTestingModule for a standalone component?',
      'Why don\'t you need detectChanges() to read a signal value after calling a method — but you do need it to assert DOM text?',
      'Explain how HttpTestingController intercepts HTTP and why you call verify() in afterEach',
      'When would you use fakeAsync + tick vs async + whenStable?',
      'What is the advantage of screen.getByRole over fixture.nativeElement.querySelector?',
    ],
  };
}
