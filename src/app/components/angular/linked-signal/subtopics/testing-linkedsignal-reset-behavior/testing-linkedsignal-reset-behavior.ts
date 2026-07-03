import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-linkedsignal-reset-behavior-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-linkedsignal-reset-behavior.html',
  styleUrl: './testing-linkedsignal-reset-behavior.scss',
})
export class TestingLinkedsignalResetBehaviorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Signals are synchronous — no fakeAsync or flushEffects needed for the reset itself',
      points: [
        'Unlike testing an <code>effect()</code>-based reset (which historically needed <code>TestBed.flushEffects()</code> or a microtask tick), a <code>linkedSignal()</code> recomputes SYNCHRONOUSLY the moment its source signal is read after the source changes — calling <code>.set()</code> on the source signal and then immediately reading the linked signal in the very next line reflects the new value with no async wait, exactly like <code>computed()</code>.',
        'The three behaviors worth testing explicitly: (1) the linked signal computes the correct INITIAL value, (2) manual <code>.set()</code> overrides persist across UNRELATED changes, (3) the override is DISCARDED and replaced by the computed value the moment the actual source changes.',
      ],
    },
    {
      heading: 'Testing the "manual override survives until source changes" contract',
      points: [
        'This is the single most important behavior to verify and the easiest to accidentally break during a refactor — write a test that sets a manual value, asserts it persisted, THEN changes the source and asserts the OLD manual value is gone and the newly-computed value is present. A test that only checks one half of this (either "override works" OR "reset works") can pass while the other half silently regresses.',
        'For components (not raw signals in a service), instantiate via <code>TestBed.createComponent</code>, call methods/set inputs to change the underlying source signal, and read the linked signal directly off <code>fixture.componentInstance</code> — no <code>fixture.detectChanges()</code> is required purely to observe the SIGNAL value (only to see it reflected in the rendered DOM).',
      ],
    },
    {
      heading: 'Testing the equal option and the source-vs-computation tracking boundary',
      points: [
        'To test a custom <code>equal</code> function actually prevents a reset: set the source to a NEW object that is semantically equal per your <code>equal</code> function (e.g. same <code>id</code>, different other fields), and assert the linked signal\'s value did NOT change — proving the custom equality check suppressed the reset rather than merely not being called.',
        'To test the "signals in computation are not tracked" gotcha directly: change a signal that is read ONLY inside <code>computation</code> (not inside <code>source</code>) and assert the linked signal\'s value did NOT update — this is a genuinely useful regression test for the exact bug documented in the main topic\'s common mistakes.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/catalog.ts',
      content: `import { Component, signal, linkedSignal } from '@angular/core';

const CATALOG: Record<string, string[]> = {
  Electronics: ['Phones', 'Laptops', 'Tablets'],
  Clothing:    ['Shirts', 'Pants', 'Shoes'],
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  template: \`<p>{{ selectedSubcategory() }}</p>\`,
})
export class CatalogComponent {
  selectedCategory = signal('Electronics');

  subCategories = linkedSignal(() => CATALOG[this.selectedCategory()]);
  selectedSubcategory = linkedSignal(() => this.subCategories()[0]);
}
`,
    },
    {
      path: 'src/app/catalog.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { CatalogComponent } from './catalog';

describe('CatalogComponent linkedSignal behavior', () => {
  it('computes the initial value from the initial source', () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedSubcategory()).toBe('Phones');
  });

  it('preserves a manual override across unrelated re-reads', () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectedSubcategory.set('Tablets');
    // Reading again without changing the source — override must persist
    expect(fixture.componentInstance.selectedSubcategory()).toBe('Tablets');
  });

  it('discards the manual override when the source changes', () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();

    fixture.componentInstance.selectedSubcategory.set('Tablets');
    fixture.componentInstance.selectedCategory.set('Clothing');

    // The override is gone — reset to the first item of the NEW category
    expect(fixture.componentInstance.selectedSubcategory()).toBe('Shirts');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { CatalogComponent } from './catalog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CatalogComponent],
  template: \`
    <h3>Testing linkedSignal reset behavior</h3>
    <p>Open catalog.spec.ts — three tests cover initial computation, override
    persistence, and reset-on-source-change, all read synchronously with no fakeAsync.</p>
    <app-catalog />
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
  <head><title>Testing linkedSignal reset behavior</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that a signal read only inside computation (not source) does NOT trigger a reset when it changes.',
    hint: 'Add a sortOrder signal read only inside computation on subCategories, change sortOrder, and assert subCategories() did not change — mirroring the "reading a signal inside computation" mistake from the main topic.',
    solution: `// catalog.ts — add a signal read only inside computation
sortOrder = signal<'asc' | 'desc'>('asc');
subCategories = linkedSignal({
  source: () => this.selectedCategory(),
  computation: (cat) => {
    const list = CATALOG[cat];
    return this.sortOrder() === 'asc' ? list : [...list].reverse();
  },
});

// catalog.spec.ts
it('does not reset when a computation-only signal changes', () => {
  const fixture = TestBed.createComponent(CatalogComponent);
  fixture.detectChanges();

  const before = fixture.componentInstance.subCategories();
  fixture.componentInstance.sortOrder.set('desc');

  // sortOrder is read inside computation, not source — no reset triggered
  expect(fixture.componentInstance.subCategories()).toEqual(before);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a linkedSignal reset requires fakeAsync or flushEffects, similar to testing an effect()-based workaround.',
      reality: 'linkedSignal recomputes synchronously when its source changes and is read — a plain synchronous test with no async utilities is sufficient, exactly like testing computed().',
    },
    {
      thought: 'a test asserting "the linkedSignal resets on source change" is sufficient coverage on its own.',
      reality: 'the override-persistence half of the contract (manual .set() surviving UNRELATED changes) is just as easy to accidentally break — both halves need separate, explicit tests.',
    },
    {
      thought: 'testing a custom equal function means checking that it was called with the right arguments.',
      reality: 'the meaningful test is behavioral — set a semantically-equal-but-reference-different source value and assert the linked signal\'s VALUE did not change, proving the equal function actually suppressed the reset.',
    },
  ];
}
