import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-harness-failures-common-causes-and-diagnosis-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-harness-failures-common-causes-and-diagnosis.html',
  styleUrl: './debugging-harness-failures-common-causes-and-diagnosis.scss',
})
export class DebuggingHarnessFailuresCommonCausesAndDiagnosisSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A troubleshooting gap the main topic leaves entirely open',
      points: [
        'The main Harnesses page shows the happy path for every API — <code>getHarness()</code> succeeding, <code>locatorFor()</code> resolving, harness methods working — but never what a FAILURE looks like or how to diagnose one. In practice, harness failures fall into a small number of RECURRING categories, each with a distinct error signature and fix — recognizing which category you\'re in is the fastest path to a fix.',
      ],
    },
    {
      heading: 'Category 1 — hostSelector mismatch',
      points: [
        '<code>await loader.getHarness(MyHarness)</code> throws an error like "Failed to find element matching one of the following queries: (MyHarness\'s host selector)" — this means NO element in the fixture matched <code>static hostSelector</code> at all. The most common cause: the harness was written against an OLDER version of the component whose root selector has since changed, or a typo in the selector string itself.',
        'Diagnose by temporarily logging <code>fixture.nativeElement.outerHTML</code> (or inspecting it in a debugger) right before the failing <code>getHarness()</code> call, and visually confirming whether an element with the expected selector actually exists in the rendered DOM at that point — if it does not exist YET (see Category 2 below) vs. never exists AT ALL are different problems with different fixes.',
      ],
    },
    {
      heading: 'Category 2 — timing: the element does not exist YET',
      points: [
        'A harness lookup that fails intermittently (passes sometimes, fails other times, especially in CI vs local) often means the target element genuinely does not exist in the DOM AT THE MOMENT <code>getHarness()</code> is called — e.g. it\'s behind an <code>@if</code> gated by an async resource that hasn\'t resolved yet, or an animation/CDK overlay that opens on a microtask delay.',
        'For TestBed unit tests, this usually means missing an <code>await fixture.whenStable()</code> or an explicit <code>await</code> on the async operation gating the element\'s appearance BEFORE calling <code>getHarness()</code> — the harness loader does not wait for arbitrary async app logic to settle on its own, only for Angular\'s own change detection to catch up after a harness ACTION (like <code>click()</code>).',
        'This is DIFFERENT from Category 1: here the selector is CORRECT and the element WILL eventually render — the fix is sequencing (wait longer / wait for the right thing), not fixing a wrong selector string.',
      ],
    },
    {
      heading: 'Category 3 — ambiguous match (multiple elements, wrong one returned)',
      points: [
        'No error is thrown, but the WRONG button gets clicked or the WRONG input gets a value — <code>getHarness()</code> silently returns the FIRST matching instance when multiple exist, with no error to indicate ambiguity. This is the hardest category to diagnose because the test doesn\'t crash — it just does the wrong thing, sometimes producing an assertion failure several lines later that looks unrelated to the actual root cause.',
        'The fix (already covered in the main topic and the composition subtopic): use a <code>HarnessPredicate</code> via <code>.with(&#123; text: ... &#125;)</code> or similar to make the intended target explicit, rather than relying on document order. As a DIAGNOSTIC step specifically, temporarily switch to <code>getAllHarnesses()</code> and log the count and each instance\'s identifying property (text, value) — this quickly reveals whether ambiguity is actually the problem before committing to a predicate fix.',
      ],
    },
    {
      heading: 'Category 4 — forgotten await, silently comparing a Promise',
      points: [
        'The main topic\'s "Common Mistakes" section already names this one directly: <code>const value = harness.getValue()</code> (missing <code>await</code>) compares a <code>Promise&lt;number&gt;</code> object against an expected number, which ALWAYS fails the assertion — but the failure MESSAGE (something like "Expected Promise to equal 4") is the clear tell that distinguishes this category instantly from the others once you know to look for it.',
        'A quick sanity check when ANY harness-related assertion fails unexpectedly: scan every harness method call in that test for a missing <code>await</code> FIRST, since it is both extremely common (easy typo, especially when chaining multiple calls) and trivially fast to rule out compared to the other three categories.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/rating.component.ts',
      content: `import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  template: \`
    @if (loaded()) {
      @for (i of [1, 2, 3, 4, 5]; track i) {
        <span class="star" [class.filled]="i <= value()" (click)="value.set(i)">&#9733;</span>
      }
    } @else {
      <p>Loading rating widget…</p>
    }
  \`,
})
export class RatingComponent {
  value = signal(0);
  loaded = signal(false);

  constructor() {
    // Simulates an async resource gating the widget's real render —
    // this is exactly the kind of delay that causes Category 2 (timing) failures.
    setTimeout(() => this.loaded.set(true), 0);
  }
}
`,
    },
    {
      path: 'src/app/rating-harness.ts',
      content: `import { ComponentHarness } from '@angular/cdk/testing';

export class RatingHarness extends ComponentHarness {
  static hostSelector = 'app-star-rating';

  private getStars = this.locatorForAll('.star');

  async getValue(): Promise<number> {
    const stars = await this.getStars();
    let rating = 0;
    for (const star of stars) {
      if (await star.hasClass('filled')) rating++;
    }
    return rating;
  }

  async setRating(value: number): Promise<void> {
    const stars = await this.getStars();
    await stars[value - 1].click();
  }
}
`,
    },
    {
      path: 'src/app/rating.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { RatingComponent } from './rating.component';
import { RatingHarness } from './rating-harness';

describe('Harness failure categories — diagnosis walkthrough', () => {
  // CATEGORY 2 — TIMING: fails intermittently without whenStable(), because
  // .star elements do not exist until the async setTimeout in the component
  // flips loaded() to true. Uncommenting the version WITHOUT whenStable()
  // below would fail: "Failed to find element matching one of the following
  // queries: (RatingHarness's host selector: app-star-rating)" — NOT because
  // the selector is wrong, but because the @if hasn't resolved to true yet.
  it('waits for the async-gated widget to actually render first', async () => {
    const fixture = TestBed.createComponent(RatingComponent);
    fixture.detectChanges();
    await fixture.whenStable(); // <-- required: waits for the setTimeout to resolve

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const rating = await loader.getHarness(RatingHarness);

    await rating.setRating(3);
    expect(await rating.getValue()).toBe(3);
  });

  // CATEGORY 4 — FORGOTTEN AWAIT: this test is intentionally broken to show
  // the exact failure signature. Compare the assertion error message here
  // against a correctly-awaited call — "Expected Promise to equal 3" is the
  // unmistakable tell for this category.
  it('DEMONSTRATES the forgotten-await failure signature (intentionally broken)', async () => {
    const fixture = TestBed.createComponent(RatingComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const loader = TestbedHarnessEnvironment.loader(fixture);
    const rating = await loader.getHarness(RatingHarness);
    await rating.setRating(3);

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    const value = rating.getValue(); // MISSING await — returns a Promise<number>
    // expect(value).toBe(3); // would fail: "Expected Promise to equal 3"
    expect(value).toBeInstanceOf(Promise); // proves what actually got compared
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { RatingComponent } from './rating.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RatingComponent],
  template: \`
    <h3>Debugging harness failures: common causes and diagnosis</h3>
    <p>
      Open rating.component.spec.ts — the first test shows the fix for a Category 2
      (timing) failure via fixture.whenStable(); the second intentionally reproduces
      the Category 4 (forgotten await) failure signature so you can recognize it.
    </p>
    <app-star-rating />
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
  <head><title>Debugging Harness Failures</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a NEW test that deliberately reproduces a Category 3 (ambiguous match) failure: render TWO <code>&lt;app-star-rating&gt;</code> components in the fixture, call <code>loader.getHarness(RatingHarness)</code> without a predicate, and add a comment explaining why the test cannot know WHICH rating widget it actually got.',
    hint: 'Create a small wrapper component with two <app-star-rating> elements. In the test, call getHarness(RatingHarness) once — it returns the FIRST matching instance in document order with no error, even though a second instance exists. Contrast this with getAllHarnesses(RatingHarness), which would reveal the count is 2.',
    solution: `@Component({
  selector: 'app-two-ratings',
  standalone: true,
  imports: [RatingComponent],
  template: \`<app-star-rating /><app-star-rating />\`,
})
class TwoRatingsComponent {}

it('DEMONSTRATES the ambiguous-match failure signature (Category 3)', async () => {
  const fixture = TestBed.createComponent(TwoRatingsComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  const loader = TestbedHarnessEnvironment.loader(fixture);

  // No error is thrown here — getHarness() silently returns the FIRST
  // matching instance. The test has no way to know, from this call alone,
  // whether it got "the right" rating widget or just whichever happened
  // to render first in document order.
  const rating = await loader.getHarness(RatingHarness);

  // Diagnostic step: getAllHarnesses() reveals the ambiguity that
  // getHarness() alone hides.
  const all = await loader.getAllHarnesses(RatingHarness);
  expect(all.length).toBe(2); // confirms two matches existed
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a harness lookup that fails intermittently in CI but passes locally points to a flaky test infrastructure problem, not something fixable in the test itself.',
      reality: 'this is the classic signature of a Category 2 timing failure — the target element genuinely does not exist yet when getHarness() is called, often because CI is slower and more likely to catch the race. Add the missing await fixture.whenStable() (or await the specific async operation gating the element) rather than adding retries.',
    },
    {
      thought: 'if <code>loader.getHarness(MyHarness)</code> does not throw an error, the test correctly interacted with the intended component instance.',
      reality: 'when multiple matching instances exist, getHarness() silently returns the FIRST one in document order with no error at all — this is the ambiguous-match category, and it produces a wrong-behavior bug, not a crash, making it the hardest category to diagnose without deliberately checking with getAllHarnesses() first.',
    },
    {
      thought: 'an assertion failure on a harness-returned value always means the component under test has a real bug.',
      reality: 'a forgotten await on a harness method call (e.g. const value = harness.getValue()) compares a Promise object against the expected value and always fails — check for this specific, extremely common mistake first before assuming the component itself is broken.',
    },
  ];
}
