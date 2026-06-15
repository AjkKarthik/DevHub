import { Component } from '@angular/core';
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

@Component({
  selector: 'app-harnesses',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './harnesses.html',
  styleUrl: './harnesses.scss',
})
export class HarnessesDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Testing with TestBed', route: '/angular/testing-demo' },
    { label: 'Components', route: '/angular/components' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are component harnesses and why they exist',
      points: [
        'A component harness is a test utility class that exposes a semantic API for interacting with a component — instead of querying internal DOM nodes, tests call methods like <code>click()</code>, <code>setValue()</code>, and <code>getValue()</code>.',
        'The problem harnesses solve: when a component\'s internal markup changes (e.g. Material updates a button\'s CSS classes), every test that used <code>querySelector(\'.mat-button\')</code> breaks — even though the component still works correctly.',
        'Harnesses decouple tests from implementation: the harness author owns the DOM knowledge, and test authors only interact with the semantic API. Internal refactors are invisible to consumers.',
        'Angular CDK (<code>@angular/cdk/testing</code>) provides the base classes. Angular Material ships ready-made harnesses for all its components — <code>MatButtonHarness</code>, <code>MatInputHarness</code>, <code>MatSelectHarness</code>, etc.',
        'Custom components can ship their own harnesses alongside their source — consumers import <code>RatingHarness</code> the same way they import <code>MatButtonHarness</code>.',
      ],
    },
    {
      heading: 'Using Angular Material harnesses in unit tests',
      points: [
        'Get a <code>HarnessLoader</code> via <code>TestbedHarnessEnvironment.loader(fixture)</code> in your <code>beforeEach</code> — this is the entry point for all harness lookups in the fixture.',
        '<code>await loader.getHarness(MatButtonHarness)</code> returns the first <code>MatButtonHarness</code> in the fixture; it throws if no match is found.',
        '<code>await loader.getAllHarnesses(MatInputHarness)</code> returns an array of all matching harness instances — use this when a component contains multiple inputs.',
        'Material harness methods are async and auto-handle change detection: <code>await button.click()</code> triggers the click AND runs change detection; no <code>fixture.detectChanges()</code> call is needed afterwards.',
        '<code>await input.getValue()</code>, <code>await input.isDisabled()</code>, <code>await input.getPlaceholder()</code> — read state without touching <code>nativeElement</code> or <code>componentInstance</code> at all.',
      ],
    },
    {
      heading: 'Writing custom harnesses with ComponentHarness',
      points: [
        'Extend <code>ComponentHarness</code> from <code>@angular/cdk/testing</code> and set <code>static hostSelector = \'app-my-widget\'</code> — the host selector identifies which component root element the harness wraps.',
        '<code>this.locatorFor(\'.class\')</code> returns a lazy async locator that resolves to the <strong>first</strong> matching child element inside the host; it throws if the element is absent — use for required elements.',
        '<code>this.locatorForOptional(\'.class\')</code> returns null when the element is absent — use for conditionally rendered children like error messages or empty states.',
        '<code>this.locatorForAll(\'.class\')</code> returns an array of all matching elements — ideal for repeated items like list rows, star icons, or tab headers.',
        'Export the harness class from the same package as the component: <code>export { RatingHarness } from \'./rating-harness\'</code>. Consumers import it in their test files; they never need to know the underlying CSS classes.',
      ],
    },
    {
      heading: 'HarnessPredicate — filtering to specific instances',
      points: [
        'When multiple instances of a component exist, <code>getHarness(MatButtonHarness)</code> returns the first one arbitrarily. Use <code>MatButtonHarness.with({ text: \'Submit\' })</code> to target a specific button by its visible text.',
        'Material harness <code>.with()</code> methods accept type-safe filter objects: <code>MatInputHarness.with({ selector: \'[formControlName="email"]\' })</code>, <code>MatSelectHarness.with({ selector: \'#country-select\' })</code>.',
        'You can implement a custom <code>.with()</code> on your harness by calling <code>HarnessPredicate.stringMatches()</code> for text matching — this lets consumers filter your harness by any property you expose.',
        '<code>loader.getAllHarnesses(MatInputHarness.with({ value: \'\' }))</code> — combine getAllHarnesses with a predicate to find all empty inputs in a complex form.',
        'Predicates compose with the same async harness environment — they work identically in TestBed unit tests and Playwright E2E tests, keeping your filter logic environment-agnostic.',
      ],
    },
    {
      heading: 'Cross-environment — the same harness in unit tests and E2E',
      points: [
        'The power of the harness abstraction is that <strong>the same harness class</strong> works in both TestBed unit tests and Playwright (or Protractor/WebDriver) E2E tests — only the loader adapter changes.',
        'Unit test: <code>TestbedHarnessEnvironment.loader(fixture)</code> from <code>@angular/cdk/testing/testbed</code>.',
        'E2E (Playwright): <code>PlaywrightHarnessEnvironment.loader(page)</code> from <code>@angular/cdk/testing/playwright</code> — passes a Playwright <code>Page</code> object instead of a fixture.',
        'The environment adapter handles the environment-specific details: TestBed triggers change detection; Playwright polls the page for async DOM updates. The harness author writes zero environment-specific code.',
        'This is the primary reason to write harnesses for library components — one harness investment covers both testing layers without duplication.',
      ],
    },
    {
      heading: 'Best practices and when to write a harness',
      points: [
        '<strong>Write a harness</strong> for shared or library components that are consumed across many test files — the abstraction pays off when one DOM change would otherwise break dozens of tests.',
        '<strong>Skip the harness</strong> for application-specific one-off components: a simple form page used in a single test file rarely justifies the harness boilerplate; direct DOM queries are fine.',
        'Publish harnesses alongside components in the same export — <code>import { RatingHarness } from \'@my-lib/rating/testing\'</code> mirrors the pattern Angular Material uses.',
        'Keep harness methods at the <em>user action</em> level (<code>setRating(4)</code>, <code>dismissAlert()</code>) rather than leaking internal DOM names — if you find yourself writing <code>getInternalSpanText()</code>, your harness is too low-level.',
        'Use <code>getChildLoader(selector)</code> to create a sub-harness-loader scoped to a sub-tree — useful for composite components with repeated regions (e.g. each row in a table).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Material harness (unit)',
      language: 'typescript',
      code: `import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

describe('LoginComponent', () => {
  let loader: HarnessLoader;

  beforeEach(async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('submits with correct values', async () => {
    const email    = await loader.getHarness(MatInputHarness.with({ selector: '[formControlName="email"]' }));
    const password = await loader.getHarness(MatInputHarness.with({ selector: '[formControlName="password"]' }));
    const submit   = await loader.getHarness(MatButtonHarness.with({ text: 'Sign in' }));

    await email.setValue('user@example.com');
    await password.setValue('secret123');
    await submit.click();

    // Assert without touching internal DOM — no detectChanges() needed
    expect(component.submitted()).toBeTrue();
  });

  it('lists all form inputs', async () => {
    const inputs = await loader.getAllHarnesses(MatInputHarness);
    expect(inputs.length).toBe(2);
  });
});`,
    },
    {
      label: 'Custom harness',
      language: 'typescript',
      code: `import { ComponentHarness } from '@angular/cdk/testing';

// Define the harness alongside your component
export class RatingHarness extends ComponentHarness {
  static hostSelector = 'app-star-rating';   // ← your component selector

  // locatorForAll — returns all .star elements as an array
  private getStars = this.locatorForAll('.star');

  // locatorForOptional — returns null if .error is absent
  private getError = this.locatorForOptional('.rating-error');

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

  async getErrorText(): Promise<string | null> {
    const err = await this.getError();
    return err ? err.text() : null;
  }
}

// Usage in test:
const rating = await loader.getHarness(RatingHarness);
await rating.setRating(4);
expect(await rating.getValue()).toBe(4);
expect(await rating.getErrorText()).toBeNull();`,
    },
    {
      label: 'HarnessPredicate',
      language: 'typescript',
      code: `import { HarnessPredicate, ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputHarness } from '@angular/material/input/testing';

// Built-in Material predicates — filter by text, selector, etc.
const submitBtn = await loader.getHarness(
  MatButtonHarness.with({ text: 'Sign in' })
);

const emailInput = await loader.getHarness(
  MatInputHarness.with({ selector: '[formControlName="email"]' })
);

// Get ALL empty inputs
const emptyInputs = await loader.getAllHarnesses(
  MatInputHarness.with({ value: '' })
);

// Custom .with() on your own harness
export class RatingHarness extends ComponentHarness {
  static hostSelector = 'app-star-rating';

  static with(options: { maxStars?: number } = {}) {
    return new HarnessPredicate(RatingHarness, options)
      .addOption('maxStars', options.maxStars,
        async (harness, max) => (await harness.getStarCount()) === max);
  }

  // ...
}

// Usage: only 5-star ratings
const fiveStar = await loader.getHarness(RatingHarness.with({ maxStars: 5 }));`,
    },
    {
      label: 'Playwright E2E',
      language: 'typescript',
      code: `// Same RatingHarness — different environment adapter
import { PlaywrightHarnessEnvironment } from '@angular/cdk/testing/playwright';
import { RatingHarness } from '../src/app/components/rating/rating-harness';

// Playwright test
test('user can set a 4-star rating', async ({ page }) => {
  await page.goto('/product/42');

  // Swap TestbedHarnessEnvironment for PlaywrightHarnessEnvironment
  const env = PlaywrightHarnessEnvironment.create(page);
  const loader = env.documentRootLoader('RatingHarness');

  const rating = await loader.getHarness(RatingHarness);

  // Same API as unit test — no DOM knowledge needed
  await rating.setRating(4);
  expect(await rating.getValue()).toBe(4);
});

// The RatingHarness class is unchanged — only the loader differs.
// TestBed unit test:  TestbedHarnessEnvironment.loader(fixture)
// Playwright E2E:     PlaywrightHarnessEnvironment.loader(page)`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which class do you extend to create a custom component test harness in Angular CDK?',
      options: ['HarnessLoader', 'ComponentHarness', 'TestbedHarnessEnvironment', 'HarnessEnvironment'],
      answer: 1,
      explanation: 'Custom harnesses extend ComponentHarness from @angular/cdk/testing. You set a static hostSelector property to the component\'s CSS selector and define semantic methods that interact with the component\'s DOM.',
    },
    {
      q: 'How do you obtain a HarnessLoader in an Angular unit test using TestBed?',
      options: ['HarnessLoader.from(fixture)', 'fixture.debugElement.harness()', 'TestbedHarnessEnvironment.loader(fixture)', 'new HarnessLoader(fixture.nativeElement)'],
      answer: 2,
      explanation: 'TestbedHarnessEnvironment.loader(fixture) is the correct way to get a HarnessLoader in a TestBed unit test. The environment adapter handles the bridge between the harness API and the TestBed fixture.',
    },
    {
      q: 'What is the difference between locatorFor() and locatorForOptional() in a custom harness?',
      options: ['locatorFor() is synchronous; locatorForOptional() is async', 'locatorFor() throws if the element is not found; locatorForOptional() returns null', 'locatorFor() returns all matches; locatorForOptional() returns only the first', 'They are identical — locatorForOptional() is just an alias'],
      answer: 1,
      explanation: 'locatorFor() throws an error if the target element is not found in the DOM, making it suitable for required elements. locatorForOptional() returns null when absent, which is appropriate for conditionally rendered elements like error messages.',
    },
    {
      q: 'Which of the following correctly retrieves a MatInputHarness filtered to a specific form control?',
      options: ['loader.getHarness(MatInputHarness, \'[formControlName="email"]\')', 'loader.queryHarness(MatInputHarness).where({ name: \'email\' })', 'loader.getHarness(MatInputHarness.with({ selector: \'[formControlName="email"]\' }))', 'MatInputHarness.find(loader, { controlName: \'email\' })'],
      answer: 2,
      explanation: 'The with() static method on a harness class accepts a filter object. For MatInputHarness you can filter by selector, placeholder, or value. This returns a HarnessPredicate that getHarness() uses to find the specific instance.',
    },
    {
      q: 'Why do Angular Material harness methods not require a manual fixture.detectChanges() call after interactions?',
      options: ['They run synchronously so change detection is not needed', 'They bypass Angular\'s change detection entirely', 'Material harness methods automatically trigger and await change detection after every interaction', 'They work only in E2E tests where Angular change detection is not used'],
      answer: 2,
      explanation: 'Angular Material harness methods automatically handle change detection after interactions like click() or setValue(). Manually calling detectChanges() is redundant and can cause double-change-detection issues.',
    },
    {
      q: 'You have a fixture with three MatButtonHarness instances. loader.getHarness(MatButtonHarness) returns the wrong button. What is the correct fix?',
      options: [
        'Call loader.getHarness(MatButtonHarness, 2) to get the third instance',
        'Use loader.getHarness(MatButtonHarness.with({ text: \'Submit\' })) to filter by accessible text',
        'Query all harnesses with getAllHarnesses and access index [2]',
        'Use loader.getChildLoader(\'.button-container\').getHarness(MatButtonHarness)',
      ],
      answer: 1,
      explanation: 'MatButtonHarness.with({ text: \'Submit\' }) creates a HarnessPredicate that filters by the button\'s visible text. This is more resilient than index-based access and explicitly documents which button you are targeting.',
    },
    {
      q: 'What changes when you run the same ComponentHarness class in a Playwright E2E test instead of a TestBed unit test?',
      options: [
        'The harness class must be rewritten to use Playwright\'s page.locator() API',
        'Only the environment loader changes — TestbedHarnessEnvironment vs PlaywrightHarnessEnvironment; the harness class is identical',
        'Harness methods become synchronous in Playwright because the browser handles async natively',
        'You must wrap the harness in a PlaywrightHarnessAdapter decorator before using it',
      ],
      answer: 1,
      explanation: 'The harness class is completely unchanged. Only the environment adapter differs: TestbedHarnessEnvironment.loader(fixture) for unit tests vs PlaywrightHarnessEnvironment.loader(page) for E2E. This is the key value proposition — write once, test everywhere.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is ComponentHarness?', a: 'The base class from <code>@angular/cdk/testing</code> for writing component test harnesses. Extend it, set <code>static hostSelector</code> to your component\'s CSS selector, then define semantic methods (<code>getValue()</code>, <code>click()</code>, <code>setRating(n)</code>) that interact with the component\'s DOM in a stable, encapsulated way.' },
    { q: 'How do you get a harness in a unit test?', a: '<code>const loader = TestbedHarnessEnvironment.loader(fixture)</code>. Then <code>await loader.getHarness(MatButtonHarness)</code>. Filter for a specific instance: <code>MatButtonHarness.with({ text: \'Submit\' })</code>. Get all instances: <code>loader.getAllHarnesses(MatInputHarness)</code>.' },
    { q: 'What is locatorFor() in a harness?', a: '<code>this.locatorFor(\'.star\')</code> returns a lazy locator that finds the first matching element inside the component. It throws if the element is not found — use for required elements. Use <code>locatorForOptional()</code> for elements that may not exist (returns null). Use <code>locatorForAll()</code> to get all matching elements as an array.' },
    { q: 'Can harnesses be used with Playwright (E2E)?', a: 'Yes — use <code>PlaywrightHarnessEnvironment.loader(page)</code> from <code>@angular/cdk/testing/playwright</code>. The same harness class works in both unit tests and E2E tests — only the loader adapter changes. This lets you write one harness that covers both testing layers.' },
    { q: 'How do you filter for a specific harness instance?', a: '<code>loader.getHarness(MatInputHarness.with({ selector: \'[formControlName="email"]\' }))</code>. The <code>with()</code> method accepts a filter object specific to each harness type — text, selector, placeholder, etc. Custom harnesses can implement their own <code>.with()</code> using <code>HarnessPredicate</code>.' },
    { q: 'Should every component have a harness?', a: 'Mainly useful for <strong>shared/library components</strong> used by many consumers. For application-specific components, direct DOM queries in tests are usually fine. Write a harness when the component\'s internals change frequently and you want to protect many tests from those changes.' },
    { q: 'What is the difference between loader.getHarness() and loader.getAllHarnesses()?', a: '<code>getHarness()</code> returns the <strong>first</strong> matching harness instance and throws if none are found — use when exactly one component is expected. <code>getAllHarnesses()</code> returns an array of all matching instances (empty array if none) — use when multiple components are present, like all inputs in a form or all rows in a table.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'ComponentHarness', type: 'class', desc: 'Base class from @angular/cdk/testing that you extend to create a custom component test harness; set static hostSelector to your component\'s CSS selector.' , since: '9'},
    { name: 'TestbedHarnessEnvironment', type: 'class', desc: 'Adapter that bridges Angular CDK harnesses to the TestBed fixture environment; call .loader(fixture) to obtain a HarnessLoader for unit tests.' , since: '9'},
    { name: 'HarnessLoader', type: 'interface', desc: 'API returned by TestbedHarnessEnvironment.loader() that exposes getHarness(), getAllHarnesses(), and getChildLoader() to query and load harness instances.' , since: '9'},
    { name: 'locatorFor()', type: 'function', desc: 'Instance method on ComponentHarness that returns a lazy locator resolving to the first matching element inside the host; throws if the element is absent.' , since: '9'},
    { name: 'locatorForOptional()', type: 'function', desc: 'Like locatorFor() but returns null instead of throwing when the target element is not found, suitable for conditionally rendered children.' , since: '9'},
    { name: 'locatorForAll()', type: 'function', desc: 'Returns a lazy locator that resolves to all matching elements inside the harness host as an array, useful for repeated elements like list items or star icons.' , since: '9'},
    { name: 'HarnessPredicate', type: 'class', desc: 'Returned by the static .with() method on harness classes; used as a filter to select a specific harness instance by text, selector, placeholder, or other criteria.' , since: '9'},
    { name: 'PlaywrightHarnessEnvironment', type: 'class', desc: 'Environment adapter from @angular/cdk/testing/playwright that lets the same ComponentHarness subclasses run inside Playwright E2E tests without modification.' , since: '14'},
    { name: 'getAllHarnesses()', type: 'function', desc: 'Method on HarnessLoader that returns an array of all harness instances matching the given class or predicate found within the fixture.' , since: '9'},
    { name: 'getHarness()', type: 'function', desc: 'Method on HarnessLoader that returns the first harness instance matching the given class or HarnessPredicate; throws if no match is found.' , since: '9'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Direct DOM query vs. harness API',
      before: '// Brittle — breaks if Material changes internal class names\nconst btn = fixture.debugElement\n  .query(By.css(\'.mat-mdc-button\'));\nbtn.nativeElement.click();\nfixture.detectChanges();',
      after: '// Stable — semantic API survives Material version bumps\nconst btn = await loader.getHarness(\n  MatButtonHarness.with({ text: \'Sign in\' })\n);\nawait btn.click(); // auto change detection',
      note: 'Harness methods auto-handle change detection and remain stable when internal DOM structure changes.',
    },
    {
      title: 'Manual setValue vs. MatInputHarness',
      before: '// Manual — must know which events to dispatch\nconst input = fixture.nativeElement.querySelector(\'input\');\ninput.value = \'user@example.com\';\ninput.dispatchEvent(new Event(\'input\'));\nfixture.detectChanges();',
      after: '// Harness — correct events fired automatically\nconst email = await loader.getHarness(\n  MatInputHarness.with({ selector: \'[formControlName="email"]\' })\n);\nawait email.setValue(\'user@example.com\');',
      note: 'MatInputHarness.setValue() dispatches the correct events and triggers change detection automatically.',
    },
    {
      title: 'Class-only selector vs. filtered HarnessPredicate',
      before: '// Gets first button — may be wrong if multiple exist\nconst btn = await loader.getHarness(MatButtonHarness);\nawait btn.click(); // clicked Cancel instead of Submit',
      after: '// Filter by text — always the right button\nconst btn = await loader.getHarness(\n  MatButtonHarness.with({ text: \'Submit\' })\n);\nawait btn.click();',
      note: '.with() returns a HarnessPredicate so getHarness() only matches the intended element.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using locatorFor() for optional elements',
      wrong: 'private getError = this.locatorFor(\'.error-msg\');\n// Throws if .error-msg is absent from DOM — test fails',
      right: 'private getError = this.locatorForOptional(\'.error-msg\');\n// Returns null when element is not rendered',
      explanation: 'locatorFor() throws an error when the target element is missing. For conditionally rendered elements use locatorForOptional() which safely returns null.',
    },
    {
      title: 'Calling fixture.detectChanges() after harness interactions',
      wrong: 'await submit.click();\nfixture.detectChanges(); // unnecessary — already done by harness\nexpect(component.done()).toBeTrue();',
      right: 'await submit.click();\n// No detectChanges() needed — harness handles it\nexpect(component.done()).toBeTrue();',
      explanation: 'Angular Material harness methods automatically trigger and await change detection after every interaction. Manually calling detectChanges() is redundant and can cause double-change-detection issues.',
    },
    {
      title: 'Forgetting to await harness async methods',
      wrong: 'const value = harness.getValue(); // returns Promise<number>\nexpect(value).toBe(4);           // always fails — comparing Promise object',
      right: 'const value = await harness.getValue();\nexpect(value).toBe(4);',
      explanation: 'All harness interaction and query methods are async and return Promises. Forgetting await means you are comparing a Promise object instead of the resolved value.',
    },
    {
      title: 'Writing harnesses for every component instead of only shared ones',
      wrong: '// Harness for a one-off page component used in one test file\nexport class DashboardPageHarness extends ComponentHarness {\n  static hostSelector = \'app-dashboard\';\n  async getTitle() { return (await this.locatorFor(\'h1\')()).text(); }\n}',
      right: '// Direct DOM query is simpler for one-off app components\nconst title = fixture.nativeElement.querySelector(\'h1\').textContent;\n// Reserve harnesses for shared library components like RatingHarness',
      explanation: 'Harnesses shine for shared or library components consumed by many tests. For application-specific one-off components, direct queries in the test file are simpler and equally maintainable.',
    },
    {
      title: 'Setting hostSelector to a generic tag instead of the component selector',
      wrong: '// Too broad — matches every div in the DOM\nexport class CardHarness extends ComponentHarness {\n  static hostSelector = \'div\';\n}',
      right: '// Match your exact component selector\nexport class CardHarness extends ComponentHarness {\n  static hostSelector = \'app-card\';\n}',
      explanation: 'hostSelector must uniquely identify the component root element. Using a generic tag like div causes getHarness() to find unintended elements and can produce ambiguous, hard-to-debug test failures.',
    },
  ];

  challenge: Challenge = {
    title: 'Build a RatingHarness for a Star-Rating Component',
    description: 'A simple star-rating component exists that renders five span.star elements. Filled stars have the class \'filled\'. Your task is to complete the RatingHarness class so that getValue() returns the current numeric rating (count of filled stars) and setRating(n) clicks the nth star to set the rating. Then write a short test using the harness.',
    language: 'typescript',
    hints: [
      'Extend ComponentHarness from @angular/cdk/testing and set static hostSelector to \'app-star-rating\'.',
      'Use this.locatorForAll(\'.star\') to get a lazy locator that returns all star elements as an array.',
      'Iterate the resolved stars array and call star.hasClass(\'filled\') to count filled stars for getValue().',
      'For setRating(n), resolve the stars array and call await stars[n - 1].click() — harness indices are 0-based internally.',
    ],
    starterCode: `import { ComponentHarness } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

// TODO: Complete this harness
export class RatingHarness extends ComponentHarness {
  // 1. Set the correct hostSelector
  static hostSelector = '';

  // 2. Create a private locator for all '.star' elements
  private getStars = /* your code here */;

  // 3. Return the count of stars that have the 'filled' class
  async getValue(): Promise<number> {
    // your code here
    return 0;
  }

  // 4. Click the star at position \`value\` (1-based)
  async setRating(value: number): Promise<void> {
    // your code here
  }
}

// Test using the harness
describe('StarRatingComponent with RatingHarness', () => {
  it('sets and reads the rating', async () => {
    const fixture = TestBed.createComponent(StarRatingComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const harness = await loader.getHarness(RatingHarness);

    // TODO: set rating to 3 and assert getValue() returns 3
  });
});
`,
    solution: `import { ComponentHarness } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { StarRatingComponent } from './star-rating.component';

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

describe('StarRatingComponent with RatingHarness', () => {
  it('sets and reads the rating', async () => {
    const fixture = TestBed.createComponent(StarRatingComponent);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const harness = await loader.getHarness(RatingHarness);

    await harness.setRating(3);
    expect(await harness.getValue()).toBe(3);
  });
});
`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Component harnesses are semantic test utilities that abstract a component\'s DOM into a stable API — interactions survive internal DOM refactors and the same harness works across TestBed unit tests and Playwright E2E.',
    mustKnow: [
      'Extend ComponentHarness and set static hostSelector to your component\'s CSS selector — this is the entry point for all harness lookups',
      'TestbedHarnessEnvironment.loader(fixture) gives you a HarnessLoader for unit tests; PlaywrightHarnessEnvironment.loader(page) does the same for E2E — same harness class, different adapter',
      'loader.getHarness(MatButtonHarness) finds the first match and throws if none; .getAllHarnesses() returns all matches as an array',
      'Filter with .with(): MatButtonHarness.with({ text: \'Submit\' }) returns a HarnessPredicate targeting a specific instance',
      'locatorFor(\'.class\') throws if element is absent; locatorForOptional returns null; locatorForAll returns array — choose by requirement',
      'Material harness methods are async and auto-handle change detection — no detectChanges() needed after click() or setValue()',
      'Write harnesses for shared/library components consumed by many tests; skip them for app-specific one-off components',
    ],
    interviewFocus: [
      'What problem do component harnesses solve that direct querySelector does not?',
      'Walk through creating a custom harness — what must you extend, set on hostSelector, and how do you define locators?',
      'What is the difference between locatorFor(), locatorForOptional(), and locatorForAll()?',
      'How does the same harness work in both TestBed unit tests and Playwright E2E tests?',
      'When should you NOT write a harness for a component?',
    ],
  };
}
