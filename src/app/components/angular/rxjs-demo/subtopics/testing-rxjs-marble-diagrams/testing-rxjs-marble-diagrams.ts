import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-rxjs-marble-diagrams-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-rxjs-marble-diagrams.html',
  styleUrl: './testing-rxjs-marble-diagrams.scss',
})
export class TestingRxjsMarbleDiagramsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Marble syntax — a text diagram of emissions over time',
      points: [
        'A marble string like <code>\'-a-b-c|\'</code> encodes a timeline: <code>-</code> is one "frame" of time passing, letters are emitted VALUES (mapped to real values via a second argument), <code>|</code> means complete, <code>#</code> means error, and <code>^</code> marks the subscription point in some helper methods.',
        'The <code>TestScheduler</code> (from <code>rxjs/testing</code>) runs an entire marble-based test SYNCHRONOUSLY in virtual time — a <code>debounceTime(300)</code> or <code>delay(5000)</code> in the pipeline under test does not actually wait real milliseconds; the scheduler fast-forwards virtual frames instantly.',
      ],
    },
    {
      heading: 'cold(), hot(), and expectObservable()',
      points: [
        '<code>testScheduler.run(({ cold, hot, expectObservable }) =&gt; {...})</code> is the standard entry point — inside the callback, <code>cold(\'-a-b|\', { a: 1, b: 2 })</code> creates a COLD test observable that starts emitting relative to when it is SUBSCRIBED, matching real cold-observable semantics.',
        '<code>hot(\'-a-b|\', {...})</code> creates a test observable whose timeline is FIXED relative to the start of the test, regardless of when something subscribes — the correct choice for testing operators against a source that is already "running" before your subscription (e.g. simulating a live event stream).',
        '<code>expectObservable(source$.pipe(yourOperator)).toBe(\'-a---b|\', { a: 1, b: 2 })</code> asserts the EXACT resulting marble string, including timing — this catches bugs a value-only assertion (e.g. plain Jasmine <code>toEqual</code> on collected values) would completely miss, such as an operator emitting the right values but at the wrong time.',
      ],
    },
    {
      heading: 'Why marble tests catch timing bugs other tests can\'t',
      points: [
        'A test that just collects emitted values into an array and compares with <code>toEqual([1, 2])</code> cannot tell you WHEN each value arrived relative to the others — a <code>debounceTime</code> bug that debounces for the wrong duration, or a <code>switchMap</code> bug that fails to cancel a stale inner observable, can still produce the "right" final array while being completely broken in its actual timing behavior.',
        'Marble tests are the standard way RxJS itself is tested internally, and are the right tool specifically for testing YOUR custom operators (from the "Custom Operators & pipe()" subtopic) or any pipeline where debouncing, switching, or ordering behavior is the thing actually under test — not just the final values.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/search.ts',
      content: `import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

// The pipeline under test — debounce, dedupe, then switch to a "search" observable
export function debouncedSearch(
  input$: Observable<string>,
  search: (term: string) => Observable<string[]>,
) {
  return input$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(search),
  );
}
`,
    },
    {
      path: 'src/app/search.spec.ts',
      content: `import { TestScheduler } from 'rxjs/testing';
import { debouncedSearch } from './search';

describe('debouncedSearch (marble tests)', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    // Deep-equal comparison drives the pass/fail — runs entirely in virtual time
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('debounces rapid keystrokes and only searches the settled value', () => {
    scheduler.run(({ cold, expectObservable }) => {
      // 'a' then quickly 'ab' then quickly 'abc' — only the FINAL value should search
      const input$ = cold('-a-b-c------|', { a: 'a', b: 'ab', c: 'abc' });
      const search = (term: string) => cold('(r|)', { r: [term + '-result'] });

      const result$ = debouncedSearch(input$, search);

      // 300ms (3 virtual frames at 10ms/frame here) after the LAST keystroke ('c')
      expectObservable(result$).toBe('------(r|)', { r: ['abc-result'] });
    });
  });

  it('cancels a stale in-flight search when a new term arrives (switchMap behavior)', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const input$ = cold('-a----b|', { a: 'first', b: 'second' });
      // 'first' search takes a long time — should be CANCELLED before it resolves
      const search = (term: string) =>
        term === 'first' ? cold('------(r|)', { r: ['first-result'] }) : cold('-(r|)', { r: ['second-result'] });

      const result$ = debouncedSearch(input$, search);

      // Only 'second-result' ever emits — 'first-result' was cancelled by switchMap
      expectObservable(result$).toBe('-------(r|)', { r: ['second-result'] });
    });
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debouncedSearch } from './search';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>The pipeline under test — see search.spec.ts for the marble tests</h3>
    <input (input)="onInput($event)" placeholder="Type to search..." />
    <p>Results: {{ results() }}</p>
  \`,
})
export class App {
  private input$ = new Subject<string>();
  results = signal<string[]>([]);

  constructor() {
    debouncedSearch(this.input$, term => of([term + '-result'])).subscribe(r => this.results.set(r));
  }

  onInput(e: Event) {
    this.input$.next((e.target as HTMLInputElement).value);
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
  <head><title>Testing RxJS with marble diagrams</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a third marble test asserting that debouncedSearch propagates an error if the search function\'s observable errors out (use \'#\' in the marble string).',
    hint: 'const input$ = cold(\'-a|\', { a: \'x\' }); const search = () => cold(\'-#\', {}, new Error(\'boom\')); then expectObservable(debouncedSearch(input$, search)).toBe(\'---#\', {}, new Error(\'boom\'));',
    solution: `it('propagates a search error downstream', () => {
  scheduler.run(({ cold, expectObservable }) => {
    const input$ = cold('-a|', { a: 'x' });
    const search = () => cold('-#', {}, new Error('boom'));

    const result$ = debouncedSearch(input$, search);

    expectObservable(result$).toBe('----#', {}, new Error('boom'));
  });
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a marble test with debounceTime(300) actually waits 300 real milliseconds while the test runs.',
      reality: 'TestScheduler runs entirely in VIRTUAL time — the whole test executes synchronously and instantly, regardless of how many milliseconds of delay/debounce are configured in the pipeline under test.',
    },
    {
      thought: 'collecting emitted values into an array and asserting with toEqual() is just as thorough as a marble test.',
      reality: 'value-only assertions cannot detect timing bugs — an operator that emits the correct final values but at the wrong time (wrong debounce duration, failure to cancel a stale switchMap branch) can still pass a values-only test while being genuinely broken.',
    },
    {
      thought: 'cold() and hot() in TestScheduler are interchangeable ways to create the same kind of test observable.',
      reality: 'cold() observables start their timeline relative to WHEN they are subscribed (matching real cold semantics), while hot() observables have a timeline fixed from the start of the test regardless of subscription time — the correct choice depends on what you are simulating.',
    },
  ];
}
