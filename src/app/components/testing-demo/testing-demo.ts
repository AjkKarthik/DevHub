import { Component, signal, computed, input, output } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

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
  imports: [CodeBlockComponent, TheoryBlockComponent, CounterUnderTest, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './testing-demo.html',
  styleUrl: './testing-demo.scss',
})
export class TestingDemo {
  qna: QnaItem[] = [
    { q: 'What is the difference between TestBed and @testing-library/angular?', a: '<code>TestBed</code> gives you direct access to the component instance and DOM — great for unit testing Angular-specific behaviour (inputs, outputs, DI). <code>@testing-library</code> tests from the user\'s perspective using accessible queries — more resilient to refactors.' },
    { q: 'How do you query elements in @testing-library without CSS selectors?', a: 'Use semantic queries: <code>getByRole(\'button\', { name: /submit/i })</code>, <code>getByLabelText(\'Email\')</code>, <code>getByText(\'Hello\')</code>. These survive DOM refactors — if the accessible name is correct, the test passes.' },
    { q: 'How do you test signal state changes?', a: 'Signal reads are synchronous — change the signal, then immediately assert: <code>component.count.set(5); expect(component.doubled()).toBe(10);</code>. No <code>detectChanges()</code> or async needed for signal values.' },
    { q: 'How do you mock HTTP requests in tests?', a: 'Use <code>HttpTestingController</code>: <code>const req = httpTesting.expectOne(\'/api/posts\'); req.flush(mockData);</code>. Call <code>httpTesting.verify()</code> in <code>afterEach</code> to catch unexpected requests.' },
    { q: 'How do you test a component that uses inject()?', a: 'Configure <code>TestBed.configureTestingModule({ providers: [{ provide: MyService, useValue: mockService }] })</code>. The component receives the mock via DI — no need to manually instantiate. Use <code>TestBed.inject(MyService)</code> to access it in tests.' },
    { q: 'What is a fixture and how do you use it?', a: '<code>const fixture = TestBed.createComponent(MyComponent)</code>. <code>fixture.componentInstance</code> is the component. <code>fixture.nativeElement</code> is the DOM. Call <code>fixture.detectChanges()</code> to trigger the initial render and apply changes.' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'TestBed — Angular\'s test harness',
    points: [
      '<code>TestBed.configureTestingModule({ imports: [MyComponent] })</code> bootstraps a mini Angular app for each test.',
      '<code>TestBed.createComponent(MyComponent)</code> creates a fixture — a wrapper around the component instance and its DOM.',
      'Call <code>fixture.detectChanges()</code> to run initial change detection (equivalent to the first render).',
      'For standalone components just add them to <code>imports: []</code> — no NgModule needed.',
    ],
  },
  {
    heading: '@testing-library/angular',
    points: [
      'RTL wraps TestBed with user-centric query helpers: <code>screen.getByRole</code>, <code>screen.getByText</code>, etc.',
      'Query by role first (<code>getByRole(\'button\', { name: /submit/i })</code>) — it tests what screen readers actually see.',
      '<code>userEvent.click(el)</code> simulates real browser interaction including focus, keyboard, pointer events.',
      '<code>await render(MyComponent, { componentInputs: { label: \'X\' } })</code> — pass inputs declaratively.',
    ],
  },
  {
    heading: 'Testing signals & async',
    points: [
      'Signal reads are synchronous — read <code>comp.count()</code> directly after calling <code>comp.increment()</code>, no detectChanges needed.',
      'For observables: use <code>fakeAsync</code> + <code>tick(600)</code> to advance virtual time for <code>debounceTime</code> etc.',
      '<code>HttpTestingController</code> intercepts HTTP calls: <code>http.expectOne(url)</code> then <code>req.flush(mockData)</code>.',
      'Always call <code>httpTestingController.verify()</code> in <code>afterEach</code> to catch unexpected requests.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Test behaviour, not implementation — resist querying <code>fixture.componentInstance.privateField</code>.',
      'Use <code>provideNoopAnimations()</code> in test providers to skip animation delays.',
      'Use <code>jest</code> instead of Karma for faster, parallelised test runs — Angular CLI supports Jest natively.',
      'Keep tests deterministic: mock <code>Date.now()</code> and random values via jest\'s timer/mock APIs.',
    ],
  },
];

  tabs: CodeTab[] = [
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

    comp.changed.subscribe((v: number) => emitted.push(v));
    fixture.detectChanges();

    comp.increment();
    expect(emitted).toEqual([1]);
  });
});`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the correct way to set up a standalone Angular component in TestBed?', options: ['TestBed.configureTestingModule({ declarations: [MyComponent] })', 'TestBed.configureTestingModule({ imports: [MyComponent] })', 'TestBed.configureTestingModule({ providers: [MyComponent] })', 'TestBed.configureTestingModule({ components: [MyComponent] })'], answer: 1, explanation: 'Standalone components are imported via the imports array in configureTestingModule — no NgModule or declarations needed. This mirrors how you use them in production code.' },
    { q: 'You call comp.increment() twice on a signal-based component. What do you need to do before asserting comp.count() === 2?', options: ['Call fixture.detectChanges() to flush change detection', 'Wrap the calls in fakeAsync and call tick()', 'Nothing — signal reads are synchronous and update immediately', 'Call fixture.whenStable() and await the promise'], answer: 2, explanation: 'Signal reads are synchronous. After calling comp.increment() the signal value is already updated — no detectChanges(), tick(), or async helpers are needed to read the current value.' },
    { q: 'In a fakeAsync test with debounceTime(600), when should you call tick()?', options: ['Before triggering the event so the timer is pre-warmed', 'After triggering the event and before your assertion, passing at least 600ms', 'After your assertion to clean up pending timers', 'tick() is only for setInterval, not debounceTime'], answer: 1, explanation: 'fakeAsync controls virtual time. You trigger the event first (which starts the debounce timer), then call tick(600) to advance virtual time past the 600ms threshold, then make your assertion.' },
    { q: 'Why should you call httpTestingController.verify() in afterEach when testing HTTP services?', options: ['It flushes pending requests so the test completes faster', 'It resets the TestBed module between tests', 'It ensures no unexpected or unflushed HTTP requests remain after each test', 'It is required to initialise HttpTestingController before the next test'], answer: 2, explanation: 'httpTestingController.verify() throws if any HTTP requests were made but not explicitly expected and flushed. Calling it in afterEach catches accidental extra requests that would otherwise silently pass.' },
    { q: 'Given the CounterUnderTest component, how would you test that the \'changed\' output emits the correct value after calling reset()?', options: ['Spy on the DOM event with spyOn(window, \'dispatchEvent\')', 'Access fixture.nativeElement and listen for a custom event', 'Call fixture.debugElement.query(By.css(\'button\')).triggerEventHandler(\'click\', null)', 'Subscribe to comp.changed before calling reset(), then assert the emitted array contains 0'], answer: 3, explanation: 'Angular outputs created with output() expose a subscribe method. You collect emitted values into an array before triggering the action, then assert the array contents after — this is the pattern shown in the Signal testing code tab.' },
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
  // TODO 1: Configure TestBed
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToggleComponent], // standalone — use imports, not declarations
    });
  });

  // TODO 2: Initial state
  it('should start with isOn = false and label OFF', () => {
    const fixture = TestBed.createComponent(ToggleComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    expect(comp.isOn()).toBe(false);
    expect(comp.label()).toBe('OFF');
  });

  // TODO 3: Toggle flips state
  it('should flip isOn to true and update label to ON after toggle()', () => {
    const fixture = TestBed.createComponent(ToggleComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;

    comp.toggle();
    // Signal reads are synchronous — no detectChanges needed
    expect(comp.isOn()).toBe(true);
    expect(comp.label()).toBe('ON');
  });

  // TODO 4: Output emission
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

  // TODO 5: fakeAsync + tick for setTimeout
  it('should append to log after 300ms via delayedLog', fakeAsync(() => {
    const fixture = TestBed.createComponent(ToggleComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();

    comp.toggle(); // isOn = true
    comp.delayedLog();

    // Log is still empty before tick
    expect(comp.log.length).toBe(0);

    tick(300); // advance virtual time past the 300ms setTimeout

    expect(comp.log.length).toBe(1);
    expect(comp.log[0]).toBe('logged at true');
  }));
});`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'TestBed', type: 'class', desc: 'Angular\'s primary testing harness that bootstraps a mini Angular environment for unit and integration tests.' , since: '2'},
    { name: 'TestBed.configureTestingModule', type: 'function', desc: 'Configures a testing NgModule with imports, providers, and declarations before each test suite.' , since: '2'},
    { name: 'TestBed.createComponent', type: 'function', desc: 'Creates a ComponentFixture wrapping the component instance and its DOM for inspection and interaction.' , since: '2'},
    { name: 'ComponentFixture', type: 'class', desc: 'Wrapper returned by createComponent that exposes componentInstance, nativeElement, and detectChanges().' , since: '2'},
    { name: 'fakeAsync', type: 'function', desc: 'Wraps a test in a fake asynchronous zone so you can control time with tick() for setTimeout and debounce.' , since: '2'},
    { name: 'tick', type: 'function', desc: 'Advances virtual time inside a fakeAsync zone by the specified number of milliseconds.' , since: '2'},
    { name: 'HttpTestingController', type: 'class', desc: 'Intercepts and flushes HTTP requests in tests via expectOne/expectNone and req.flush().' , since: '4'},
    { name: 'provideHttpClientTesting', type: 'function', desc: 'Registers the HttpTestingController provider so HTTP calls are intercepted rather than sent to the network.' , since: '17'},
    { name: 'render', type: 'function', desc: 'From @testing-library/angular — renders a standalone component with optional inputs and returns screen queries.' , since: '14'},
    { name: 'screen.getByRole', type: 'function', desc: 'RTL query that finds elements by ARIA role and accessible name, making tests resilient to DOM refactors.' , since: '14'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Configuring TestBed: NgModule declarations vs standalone imports', before: '// Old: NgModule-based component\nTestBed.configureTestingModule({\n  declarations: [CounterComponent],\n  imports: [CommonModule],\n});', after: '// New: standalone component — just import it\nTestBed.configureTestingModule({\n  imports: [CounterComponent],\n});',
      note: 'Standalone components (Angular 14+) go in imports[], not declarations[]. No extra NgModule needed.' },
    { title: 'Querying elements: nativeElement selectors vs RTL semantic queries', before: '// Old: CSS selector — brittle, tests implementation\nconst btn = fixture.nativeElement\n  .querySelector(\'button.increment-btn\');\nbtn.click();', after: '// New: RTL role query — tests what users see\nconst btn = screen.getByRole(\'button\', { name: \'+\' });\nawait user.click(btn);',
      note: 'Role-based queries survive CSS refactors and verify accessible names at the same time.' },
    { title: 'Asserting signal state: detectChanges vs direct read', before: '// Old Observable/zone pattern\ncomp.increment();\nfixture.detectChanges();\nawait fixture.whenStable();\nexpect(el.textContent).toBe(\'1\');', after: '// New: signals are synchronous\ncomp.increment();\n// No detectChanges needed for signal values\nexpect(comp.count()).toBe(1);\nexpect(comp.double()).toBe(2);',
      note: 'Signal reads compute immediately — no change detection cycle is required to assert the current value.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using declarations[] for standalone components', wrong: 'TestBed.configureTestingModule({\n  declarations: [MyStandaloneComponent],\n});', right: 'TestBed.configureTestingModule({\n  imports: [MyStandaloneComponent],\n});', explanation: 'Standalone components must be placed in imports[], not declarations[]. Using declarations[] causes a compile error because standalone components are self-contained modules.'  },
    { title: 'Calling detectChanges before subscribing to outputs', wrong: 'fixture.detectChanges();\ncomp.changed.subscribe(v => emitted.push(v));\ncomp.increment();', right: 'const emitted: number[] = [];\ncomp.changed.subscribe(v => emitted.push(v));\nfixture.detectChanges();\ncomp.increment();', explanation: 'Subscribe to outputs before detectChanges and before triggering actions, otherwise emissions that occur during initialisation or the action itself are missed.'  },
    { title: 'Forgetting httpTestingController.verify() after HTTP tests', wrong: 'afterEach(() => {\n  // nothing — silent pass even if extra requests exist\n});', right: 'afterEach(() => {\n  httpTestingController.verify();\n});', explanation: 'Without verify(), unexpected or un-flushed HTTP requests silently pass. verify() throws if any requests remain, catching accidental extra calls early.'  },
    { title: 'Using tick() outside fakeAsync or without enough time', wrong: 'it(\'debounce test\', () => {\n  trigger();\n  tick(100); // error: tick() not in fakeAsync\n  expect(result).toBeDefined();\n});', right: 'it(\'debounce test\', fakeAsync(() => {\n  trigger();\n  tick(600); // advance past the debounceTime(600)\n  expect(result).toBeDefined();\n}));', explanation: 'tick() only works inside a fakeAsync() wrapper. Also pass at least as many milliseconds as the debounce/setTimeout delay, or the timer will not fire.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '14', label: 'Standalone components in TestBed', features: ['Standalone components can be placed directly in imports[] of configureTestingModule — no NgModule wrapper required.', '@testing-library/angular render() gained componentInputs support for passing signal-compatible inputs declaratively.'] },
    { version: '17', label: 'provideHttpClientTesting replaces HttpClientTestingModule', features: ['provideHttpClientTesting() is the new functional provider replacing the deprecated HttpClientTestingModule.', 'Pair with provideHttpClient() in the providers array for clean, NgModule-free HTTP testing setup.'] },
  ];
}
