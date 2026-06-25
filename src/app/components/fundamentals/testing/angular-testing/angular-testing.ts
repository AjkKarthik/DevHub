import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-angular-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './angular-testing.html',
  styleUrl: './angular-testing.scss',
})
export class AngularTesting {
  quickRef: QuickRefItem[] = [
    { name: 'TestBed',                   type: 'class',    desc: 'Angular\'s test host — configures a mini Angular module for testing components and services.' },
    { name: 'ComponentFixture<T>',       type: 'class',    desc: 'Wraps the component instance, provides access to DOM and change detection.' },
    { name: 'fixture.detectChanges()',   type: 'method',   desc: 'Triggers Angular\'s change detection cycle — required after state changes.' },
    { name: 'fakeAsync / tick()',        type: 'function', desc: 'Simulates async passage of time in tests — useful for setTimeout, Observables.' },
    { name: 'HttpClientTestingModule',   type: 'class',    desc: 'Replaces HttpClient with a test version that lets you expect and flush requests.' },
    { name: 'By.css()',                  type: 'method',   desc: 'Query the fixture DOM by CSS selector — returns a DebugElement.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'TestBed Setup', points: [
      'TestBed.configureTestingModule() creates an isolated Angular environment for the test.',
      'Pass imports (standalone components), providers (services), and declarations as needed.',
      'TestBed.createComponent(MyComponent) instantiates the component and returns a ComponentFixture.',
      'For standalone components you typically only need imports: [MyComponent, ...dependencies].',
    ]},
    { heading: 'ComponentFixture and Change Detection', points: [
      'fixture.componentInstance gives you the component class — read/set properties directly.',
      'fixture.nativeElement gives you the raw DOM element.',
      'Always call fixture.detectChanges() after changing component state to flush the template.',
      'Use fixture.autoDetectChanges(true) to avoid manual detectChanges calls.',
    ]},
    { heading: 'Testing Signals', points: [
      'Read a signal directly: expect(component.count()).toBe(0).',
      'Set a signal: component.name.set("Alice"); fixture.detectChanges();',
      'computed() values update synchronously after signal changes — no async needed.',
      'For effect() — use TestBed.flushEffects() (Angular 18+) to run pending effects.',
    ]},
    { heading: 'Testing HTTP with HttpClientTestingModule', points: [
      'Import HttpClientTestingModule; inject HttpTestingController.',
      'Call the service method, then controller.expectOne(url) to get the pending request.',
      'Call req.flush(data) to respond with test data.',
      'Call controller.verify() in afterEach to ensure no unexpected HTTP calls were made.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Component Test', language: 'typescript', code:
`import { TestBed, ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CounterComponent } from './counter.component';

describe('CounterComponent', () => {
  let fixture: ComponentFixture<CounterComponent>;
  let comp: CounterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterComponent],  // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(CounterComponent);
    comp    = fixture.componentInstance;
    fixture.detectChanges();        // trigger ngOnInit + first render
  });

  it('starts at 0', () => {
    const el = fixture.nativeElement.querySelector('.count');
    expect(el.textContent).toContain('0');
  });

  it('increments on button click', () => {
    const btn = fixture.debugElement.query(By.css('[data-testid="increment"]'));
    btn.nativeElement.click();
    fixture.detectChanges();
    expect(comp.count()).toBe(1);
  });
});` },
    { label: 'Service Test', language: 'typescript', code:
`import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let svc: UserService;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    svc        = TestBed.inject(UserService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('fetches users from the API', () => {
    let result: any;
    svc.getUsers().subscribe(users => (result = users));

    const req = controller.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, name: 'Alice' }]);

    expect(result).toEqual([{ id: 1, name: 'Alice' }]);
  });
});` },
    { label: 'Signal Testing', language: 'typescript', code:
`import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SearchComponent } from './search.component';

describe('SearchComponent signals', () => {
  let fixture: ComponentFixture<SearchComponent>;
  let comp: SearchComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SearchComponent);
    comp    = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('filters results when query signal changes', () => {
    comp.query.set('ang');
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.result-item');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent).toContain('ang');
  });

  it('computed() updates synchronously', () => {
    comp.query.set('hello');
    // computed signals update immediately — no detectChanges needed
    expect(comp.hasResults()).toBe(false);
  });
});` },
    { label: 'fakeAsync', language: 'typescript', code:
`import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { AutoSaveComponent } from './auto-save.component';

it('auto-saves after 1 second debounce', fakeAsync(() => {
  const fixture = TestBed.createComponent(AutoSaveComponent);
  const comp    = fixture.componentInstance;
  const saveSpy = jest.spyOn(comp, 'save');

  fixture.detectChanges();
  comp.onChange('new value');

  tick(500);  // only 500ms passed — save not called yet
  expect(saveSpy).not.toHaveBeenCalled();

  tick(500);  // now 1000ms total — debounce fires
  expect(saveSpy).toHaveBeenCalledWith('new value');
}));` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Forgetting detectChanges()', wrong: 'comp.title = "Updated"; expect(nativeEl.textContent).toBe("Updated");', right: 'comp.title = "Updated"; fixture.detectChanges(); expect(nativeEl.textContent).toBe("Updated");', explanation: 'Angular does not update the DOM automatically in tests. detectChanges() must be called after any state change to flush the template.' },
    { title: 'Using NO_ERRORS_SCHEMA to hide real problems', wrong: 'schemas: [NO_ERRORS_SCHEMA] // silences all unknown element errors', right: 'import child components or provide stubs for them explicitly', explanation: 'NO_ERRORS_SCHEMA hides missing imports and typos in template element names. It makes tests pass for the wrong reasons.' },
    { title: 'Not calling controller.verify()', wrong: '// afterEach has no controller.verify()', right: 'afterEach(() => controller.verify());', explanation: 'Without verify(), unexpected HTTP calls are silently ignored. Your test may pass even though the component makes extra or wrong HTTP requests.' },
    { title: 'Testing signal internals instead of DOM output', wrong: 'expect(comp.internalSignal()).toBe(true)', right: 'fixture.detectChanges(); expect(nativeEl.querySelector(".badge")).toBeTruthy()', explanation: 'Tests should verify what the user sees, not internal signal state. Internal details change during refactors; DOM output should stay stable.' },
    { title: 'Not awaiting compileComponents()', wrong: 'TestBed.configureTestingModule({ imports: [MyComp] }); // no await', right: 'await TestBed.configureTestingModule({ imports: [MyComp] }).compileComponents();', explanation: 'compileComponents() is async — it compiles templates. Without await, the component may not be ready when the test runs.' },
  ];

  challenge: Challenge = {
    title: 'Test an Angular toggle component',
    language: 'typescript',
    description: 'Write TestBed tests for a ToggleComponent that has a `show` signal (default false) and a button that flips it. Test: initial state is hidden, clicking shows content, clicking again hides it.',
    hints: [
      'Use fixture.debugElement.query(By.css("button")).nativeElement.click()',
      'Call fixture.detectChanges() after each click before asserting on the DOM.',
    ],
    starterCode:
`// toggle.component.ts (already written)
// @Component({ template: \`
//   <button (click)="toggle()">Toggle</button>
//   @if (show()) { <div class="content">Content</div> }
// \` })
// export class ToggleComponent {
//   show = signal(false);
//   toggle() { this.show.update(v => !v); }
// }

// Write tests here using TestBed`,
    solution:
`describe('ToggleComponent', () => {
  let fixture: ComponentFixture<ToggleComponent>;
  let comp: ToggleComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToggleComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ToggleComponent);
    comp    = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts hidden', () => {
    expect(fixture.nativeElement.querySelector('.content')).toBeNull();
  });

  it('shows content after first click', () => {
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.content')).toBeTruthy();
  });

  it('hides content after second click', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.click(); fixture.detectChanges();
    btn.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.content')).toBeNull();
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why must you call fixture.detectChanges() after changing component state?', options: ['To refresh the service injector', 'To trigger Angular\'s change detection and update the DOM template', 'It is optional — Angular updates automatically', 'To compile the component template'], answer: 1, explanation: 'In tests, Angular does not run change detection automatically. You must call detectChanges() to flush template bindings after state changes.' },
    { q: 'What does HttpTestingController.verify() check?', options: ['That all HTTP calls returned 200', 'That no unexpected HTTP requests were made and all expected ones were flushed', 'That the service is correctly injected', 'That the component compiled without errors'], answer: 1, explanation: 'verify() asserts that no unmatched or unresolved HTTP requests remain. It catches extra HTTP calls and un-flushed expected calls.' },
    { q: 'How do you read a signal value in an Angular test?', options: ['component.signal // direct property access', 'component.signal() // call it as a function', 'fixture.getSignal("name")', 'await firstValueFrom(component.signal)'], answer: 1, explanation: 'Signals are getter functions — call them with () to read the current value. This works directly in tests without any special utilities.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I use SpectatorModule or plain TestBed?', a: 'Plain TestBed is the baseline — no extra dependencies and always current with Angular. Spectator and Angular Testing Library reduce boilerplate and encourage testing user behaviour rather than internals. For a team, any of these work — consistency matters more than the choice.' },
    { q: 'How do I test a component that uses Router?', a: 'Import RouterTestingModule or provideRouter([]) in TestBed. For components that only read the URL, you can provide a spy for ActivatedRoute. For components that navigate, import RouterTestingModule and spy on Router.navigate.' },
    { q: 'How do I test Angular effects (effect())?', a: 'In Angular 18+, call TestBed.flushEffects() to synchronously run all pending effects. In earlier versions, wrap the test in a fakeAsync zone and call tick() after setting a signal, then detectChanges().' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Angular tests use TestBed to create components, ComponentFixture to access the DOM, and detectChanges() to flush templates.',
    mustKnow: [
      'TestBed.configureTestingModule + compileComponents() — always await',
      'fixture.detectChanges() after every state change',
      'fixture.nativeElement / debugElement.query(By.css()) for DOM access',
      'Signals: read with signal(), set with signal.set(); detectChanges() to update DOM',
      'HttpClientTestingModule + controller.expectOne() + req.flush() + controller.verify()',
      'fakeAsync + tick() for timer/debounce testing',
    ],
    interviewFocus: [
      'Why detectChanges() is required in Angular tests',
      'HttpTestingController pattern — expectOne, flush, verify',
      'How to test Angular signals in a TestBed environment',
    ],
  };
}
