import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-turning-a-profiler-finding-into-a-regression-test-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './turning-a-profiler-finding-into-a-regression-test.html',
  styleUrl: './turning-a-profiler-finding-into-a-regression-test.scss',
})
export class TurningAProfilerFindingIntoARegressionTestSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A DevTools finding is a snapshot in time — it needs to become a permanent check',
      points: [
        'The main topic\'s profiling workflow ends at "measure, change, measure again" — a manual, one-time verification that the fix worked in THAT session, on THAT machine. Nothing stops the exact same performance regression from silently coming back in a future refactor, since the DevTools trace itself is not committed to the repository or run automatically. Converting the INSIGHT (this component was re-checking unnecessarily because of X) into an AUTOMATED test is what makes the fix durable.',
      ],
    },
    {
      heading: 'Translating "why did this check?" findings into a change-detection COUNT assertion',
      points: [
        'The profiler\'s "why" tooltip categories map directly onto testable claims: "input reference changed" becomes a test asserting a <code>computed()</code> or memoized value\'s reference STAYS the same across re-renders when its underlying data has not logically changed; "async pipe emitted" becomes a test asserting a stream has <code>debounceTime</code>/<code>distinctUntilChanged</code> by simulating rapid emissions and counting how many actually reach the subscriber; "OnPush component still checking" becomes a test using the SAME counter-in-effect technique from an earlier subtopic in this session\'s signal-effects and @let content — incrementing a counter inside a tracked <code>effect()</code> or a component\'s render path and asserting it does NOT increment for irrelevant state changes.',
        'The exact regression the main topic\'s challenge fixes ("the filtered list recomputes in a way that creates new references every cycle") becomes a ONE-LINE, PERMANENT test: <code>const before = component.filtered(); component.sortAsc.set(component.sortAsc()); const after = component.filtered(); expect(after).toBe(before);</code> — asserting REFERENCE equality (<code>toBe</code>, not <code>toEqual</code>) when nothing that should affect the computed value actually changed, which is exactly what a memoized <code>computed()</code> guarantees and a broken re-creating function does not.',
      ],
    },
    {
      heading: 'This is a genuinely different kind of test — asserting the ABSENCE of unnecessary work',
      points: [
        'Most tests assert that something CORRECT happened. A performance regression test asserts the OPPOSITE shape of claim — that something UNNECESSARY did NOT happen (a recompute, a re-render, a fresh object allocation) — which is why the counting/reference-equality techniques from this theory section matter: without them, there is no observable signal to assert on for "this expensive thing did not needlessly re-run."',
        'Keep these tests narrowly scoped to the SPECIFIC regression DevTools surfaced, not a general "the component is fast" assertion (which is not really testable in a deterministic unit test) — a reference-equality or call-count assertion tied to the EXACT bug found is durable, fast, and precisely reproduces what the profiler observed, without needing a real browser or timing-based flakiness.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/product-list.ts',
      content: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`@for (p of filtered(); track p.id) { <p>{{ p.name }}</p> }\`,
})
export class ProductListComponent {
  products = signal([
    { id: 1, name: 'Widget A' },
    { id: 2, name: 'Widget B' },
  ]);
  filter  = signal('');
  sortAsc = signal(true);

  // FIXED version — computed() memoizes, giving a stable reference when
  // neither products nor filter actually changed (only sortAsc reads inside
  // computation but is not part of the memoization key in this simplified demo).
  filtered = computed(() => {
    return this.products().filter(p => p.name.includes(this.filter()));
  });
}
`,
    },
    {
      path: 'src/app/product-list.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { ProductListComponent } from './product-list';

describe('ProductListComponent — DevTools finding regression test', () => {
  it('keeps filtered() reference stable when an UNRELATED signal changes', () => {
    // This test is the PERMANENT record of a real DevTools profiler finding:
    // "the filtered list recomputes with a new reference on every CD cycle,
    // even when the underlying data hasn't logically changed."
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();

    const before = fixture.componentInstance.filtered();

    // Changing a signal that filtered() does NOT read should not affect
    // the memoized reference at all.
    fixture.componentInstance.sortAsc.set(!fixture.componentInstance.sortAsc());
    fixture.detectChanges();

    const after = fixture.componentInstance.filtered();

    // Reference equality (toBe), not deep equality (toEqual) — this is
    // the exact claim a memoized computed() makes and a broken
    // re-creating function violates.
    expect(after).toBe(before);
  });

  it('DOES produce a new reference when a relevant signal (filter) changes', () => {
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();

    const before = fixture.componentInstance.filtered();
    fixture.componentInstance.filter.set('Widget A');
    fixture.detectChanges();
    const after = fixture.componentInstance.filtered();

    // A DIFFERENT reference here is CORRECT — proves the test isn't
    // trivially passing by asserting stability unconditionally.
    expect(after).not.toBe(before);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ProductListComponent } from './product-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductListComponent],
  template: \`
    <h3>Turning a profiler finding into a regression test</h3>
    <p>Open product-list.spec.ts — the first test is the permanent, automated record of
    a real DevTools profiler finding, asserting REFERENCE stability (toBe) when an
    unrelated signal changes, and the second test proves the assertion isn't trivial by
    confirming a relevant change DOES produce a new reference.</p>
    <app-product-list />
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
  <head><title>Turning a profiler finding into a regression test</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Introduce the ORIGINAL bug (a plain method that creates a new array every call instead of computed()) and confirm the first test now fails, proving it genuinely guards against the regression.',
    hint: 'Replace `filtered = computed(() => ...)` with a plain method `getFiltered() { return this.products().filter(...); }`, update the test to call `component.getFiltered()` instead of reading the computed signal, and observe the "stays stable" test now fails since a new array is created every call.',
    solution: `// product-list.ts — reintroducing the bug
getFiltered() {
  return this.products().filter(p => p.name.includes(this.filter()));
}

// product-list.spec.ts — same test, now calling the buggy method
it('keeps filtered() reference stable when an UNRELATED signal changes', () => {
  const fixture = TestBed.createComponent(ProductListComponent);
  const before = fixture.componentInstance.getFiltered();
  fixture.componentInstance.sortAsc.set(!fixture.componentInstance.sortAsc());
  const after = fixture.componentInstance.getFiltered();

  expect(after).toBe(before); // FAILS — getFiltered() always returns a new array
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'once a DevTools profiler session confirms a performance fix worked, the investigation is complete.',
      reality: 'a DevTools trace is a one-time, manual snapshot that is not committed to the repository or run automatically — converting the finding into an automated test is what prevents the exact same regression from silently returning in a future refactor.',
    },
    {
      thought: 'a performance regression test should assert general claims like "the component renders quickly".',
      reality: 'a durable, deterministic test asserts something narrow and precise — like reference equality (toBe) on a memoized value when an unrelated signal changes — reproducing the EXACT bug the profiler surfaced, without timing-based flakiness.',
    },
    {
      thought: 'a test asserting a reference stays stable is sufficient on its own to prove memoization works correctly.',
      reality: 'a second test proving a RELEVANT change DOES produce a new reference is equally necessary — otherwise the "stability" assertion could trivially pass on a computed() that never recomputes at all, which would be a different, worse bug.',
    },
  ];
}
