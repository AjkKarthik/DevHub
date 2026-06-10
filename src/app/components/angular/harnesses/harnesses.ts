import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

@Component({
  selector: 'app-harnesses',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './harnesses.html',
  styleUrl: './harnesses.scss',
})
export class HarnessesDemo {
  qna: QnaItem[] = [
    { q: 'What is ComponentHarness?', a: 'The base class from <code>@angular/cdk/testing</code> for writing component test harnesses. Extend it, set <code>static hostSelector</code> to your component\'s CSS selector, then define methods that interact with the component\'s DOM.' },
    { q: 'How do you get a harness in a unit test?', a: '<code>const loader = TestbedHarnessEnvironment.loader(fixture)</code>. Then <code>await loader.getHarness(MatButtonHarness)</code>. For a specific instance: <code>MatButtonHarness.with({ text: \'Submit\' })</code>.' },
    { q: 'What is locatorFor() in a harness?', a: '<code>this.locatorFor(\'.star\')</code> returns a lazy locator that finds the first matching element inside the component. It throws if the element is not found. Use <code>locatorForOptional()</code> for elements that may not exist.' },
    { q: 'Can harnesses be used with Playwright (E2E)?', a: 'Yes — use <code>PlaywrightHarnessEnvironment</code> from <code>@angular/cdk/testing/playwright</code>. The same harness class works in both unit tests and E2E tests — the loader adapter handles the environment difference.' },
    { q: 'How do you filter for a specific harness instance?', a: '<code>loader.getHarness(MatInputHarness.with({ selector: \'[formControlName="email"]\' }))</code>. The <code>with()</code> method accepts a filter object specific to each harness type — text, selector, placeholder, etc.' },
    { q: 'Should every component have a harness?', a: 'Mainly useful for shared/library components used by many consumers. For application-specific components, direct DOM queries in tests are usually fine. Write a harness when the component\'s internals change frequently and you want to protect many tests.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What are component harnesses?',
      points: [
        'Component harnesses are test utilities that let you interact with a component the same way a user would.',
        'Angular CDK\'s HarnessLoader finds components by role/selector and returns a harness API.',
        'Angular Material ships harnesses for all components: MatButtonHarness, MatInputHarness, MatSelectHarness…',
        'Custom components can ship their own harnesses using ComponentHarness from @angular/cdk/testing.',
      ],
    },
    {
      heading: 'Why use harnesses?',
      points: [
        'Harnesses hide internal DOM structure — your tests don\'t break when the component\'s implementation changes.',
        'Harness methods are semantic: await button.click(), await input.setValue(\'text\') — no querySelector.',
        'Harnesses work with both TestBed (unit tests) and Playwright/Puppeteer (integration tests) via loader adapters.',
        'Angular Material harness methods auto-wait and handle change detection — no detectChanges() needed.',
      ],
    },
    {
      heading: 'Custom harness',
      points: [
        'Extend ComponentHarness and set static hostSelector = \'app-my-widget\'.',
        'Use this.locatorFor(\'.inner\') to lazily locate child elements — throws if not found.',
        'Use this.locatorForOptional() for optional elements — returns null if absent.',
        'Export your harness alongside the component — consumers import it in tests just like Material does.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Use TestbedHarnessEnvironment.loader(fixture) to get the HarnessLoader in unit tests.',
        'await loader.getHarness(MatButtonHarness.with({ text: \'Submit\' })) finds a specific instance.',
        'await loader.getAllHarnesses(MatInputHarness) returns all matching instances in the component.',
        'Custom harnesses are the right abstraction for component library authors — ship tests your consumers can use.',
      ],
    },
  ];

  tabs: CodeTab[] = [
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

    // Assert without touching internal DOM
    expect(component.submitted()).toBeTrue();
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

// Usage in test:
const rating = await loader.getHarness(RatingHarness);
await rating.setRating(4);
expect(await rating.getValue()).toBe(4);`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which class do you extend to create a custom component test harness in Angular CDK?', options: ['HarnessLoader', 'ComponentHarness', 'TestbedHarnessEnvironment', 'HarnessEnvironment'], answer: 1, explanation: 'Custom harnesses extend ComponentHarness from @angular/cdk/testing. You set a static hostSelector property to the component\'s CSS selector and define semantic methods that interact with the component\'s DOM.' },
    { q: 'How do you obtain a HarnessLoader in an Angular unit test using TestBed?', options: ['HarnessLoader.from(fixture)', 'fixture.debugElement.harness()', 'TestbedHarnessEnvironment.loader(fixture)', 'new HarnessLoader(fixture.nativeElement)'], answer: 2, explanation: 'TestbedHarnessEnvironment.loader(fixture) is the correct way to get a HarnessLoader in a TestBed unit test. The environment adapter handles the bridge between the harness API and the TestBed fixture.' },
    { q: 'What is the difference between locatorFor() and locatorForOptional() in a custom harness?', options: ['locatorFor() is synchronous; locatorForOptional() is async', 'locatorFor() throws if the element is not found; locatorForOptional() returns null', 'locatorFor() returns all matches; locatorForOptional() returns only the first', 'They are identical — locatorForOptional() is just an alias'], answer: 1, explanation: 'locatorFor() throws an error if the target element is not found in the DOM, making it suitable for required elements. locatorForOptional() returns null when absent, which is appropriate for conditionally rendered elements.' },
    { q: 'Which of the following correctly retrieves a MatInputHarness filtered to a specific form control?', options: ['loader.getHarness(MatInputHarness, \'[formControlName="email"]\')', 'loader.queryHarness(MatInputHarness).where({ name: \'email\' })', 'loader.getHarness(MatInputHarness.with({ selector: \'[formControlName="email"]\' }))', 'MatInputHarness.find(loader, { controlName: \'email\' })'], answer: 2, explanation: 'The with() static method on a harness class accepts a filter object. For MatInputHarness you can filter by selector, placeholder, or value. This returns a HarnessPredicate that getHarness() uses to find the specific instance.' },
    { q: 'One of the main advantages of using Angular Material harness methods over direct DOM queries is:', options: ['They run synchronously so tests complete faster', 'They bypass Angular\'s change detection entirely', 'They auto-wait and handle change detection so detectChanges() is not needed', 'They work only in E2E tests, making unit tests redundant'], answer: 2, explanation: 'Angular Material harness methods automatically handle change detection after interactions like click() or setValue(). This means you do not need to manually call fixture.detectChanges() after every interaction, and the tests remain stable across Material version changes.' },
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

  quickRef: QuickRefItem[] = [
    { name: 'ComponentHarness', type: 'class', desc: 'Base class from @angular/cdk/testing that you extend to create a custom component test harness; set static hostSelector to your component\'s CSS selector.' , since: '9'},
    { name: 'TestbedHarnessEnvironment', type: 'class', desc: 'Adapter that bridges Angular CDK harnesses to the TestBed fixture environment; call .loader(fixture) to obtain a HarnessLoader for unit tests.' , since: '9'},
    { name: 'HarnessLoader', type: 'interface', desc: 'API returned by TestbedHarnessEnvironment.loader() that exposes getHarness(), getAllHarnesses(), and getChildLoader() to query and load harness instances.' , since: '9'},
    { name: 'locatorFor()', type: 'function', desc: 'Instance method on ComponentHarness that returns a lazy locator resolving to the first matching element inside the host; throws if the element is absent.' , since: '9'},
    { name: 'locatorForOptional()', type: 'function', desc: 'Like locatorFor() but returns null instead of throwing when the target element is not found, suitable for conditionally rendered children.' , since: '9'},
    { name: 'locatorForAll()', type: 'function', desc: 'Returns a lazy locator that resolves to all matching elements inside the harness host as an array, useful for repeated elements like list items or star icons.' , since: '9'},
    { name: 'HarnessPredicate', type: 'class', desc: 'Returned by the static .with() method on Material harness classes; used as a filter to select a specific harness instance by text, selector, placeholder, or other criteria.' , since: '9'},
    { name: 'PlaywrightHarnessEnvironment', type: 'class', desc: 'Environment adapter from @angular/cdk/testing/playwright that lets the same ComponentHarness subclasses run inside Playwright E2E tests without modification.' , since: '14'},
    { name: 'getAllHarnesses()', type: 'function', desc: 'Method on HarnessLoader that returns an array of all harness instances matching the given class or predicate found within the fixture.' , since: '9'},
    { name: 'getHarness()', type: 'function', desc: 'Method on HarnessLoader that returns the first harness instance matching the given class or HarnessPredicate; throws if no match is found.' , since: '9'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Direct DOM query vs. harness API', before: '// Old: brittle querySelector in tests\nconst btn = fixture.nativeElement.querySelector(\'button.submit\');\nbtn.click();\nfixture.detectChanges();\nexpect(component.submitted).toBeTrue();', after: '// New: semantic harness interaction\nconst submit = await loader.getHarness(MatButtonHarness.with({ text: \'Sign in\' }));\nawait submit.click();\nexpect(component.submitted()).toBeTrue();',
      note: 'Harness methods auto-handle change detection and remain stable when internal DOM structure changes.' },
    { title: 'Manual setValue vs. MatInputHarness', before: '// Old: direct nativeElement manipulation\nconst input = fixture.nativeElement.querySelector(\'input\');\ninput.value = \'user@example.com\';\ninput.dispatchEvent(new Event(\'input\'));\nfixture.detectChanges();', after: '// New: harness setValue\nconst email = await loader.getHarness(\n  MatInputHarness.with({ selector: \'[formControlName="email"]\' })\n);\nawait email.setValue(\'user@example.com\');',
      note: 'MatInputHarness.setValue() dispatches the correct events and triggers change detection automatically.' },
    { title: 'Class-only selector vs. filtered HarnessPredicate', before: '// Old: get first harness, no filtering\nconst btn = await loader.getHarness(MatButtonHarness);\n// Wrong button may be returned if multiple exist', after: '// New: filter with .with() to target exact instance\nconst btn = await loader.getHarness(\n  MatButtonHarness.with({ text: \'Submit\' })\n);',
      note: '.with() returns a HarnessPredicate so getHarness() only matches the intended element.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using locatorFor() for optional elements', wrong: 'private getError = this.locatorFor(\'.error-msg\');\n// Throws if .error-msg is absent from DOM', right: 'private getError = this.locatorForOptional(\'.error-msg\');\n// Returns null when element is not rendered', explanation: 'locatorFor() throws an error when the target element is missing. For conditionally rendered elements use locatorForOptional() which safely returns null.'  },
    { title: 'Calling fixture.detectChanges() after harness interactions', wrong: 'await submit.click();\nfixture.detectChanges(); // unnecessary\nexpect(component.done()).toBeTrue();', right: 'await submit.click();\n// No detectChanges() needed\nexpect(component.done()).toBeTrue();', explanation: 'Angular Material harness methods automatically trigger and await change detection after every interaction. Manually calling detectChanges() is redundant and can cause double-change-detection issues.'  },
    { title: 'Forgetting to await harness async methods', wrong: 'const value = harness.getValue(); // returns Promise\nexpect(value).toBe(4);           // always fails', right: 'const value = await harness.getValue();\nexpect(value).toBe(4);', explanation: 'All harness interaction and query methods are async and return Promises. Forgetting await means you are comparing a Promise object instead of the resolved value.'  },
    { title: 'Writing harnesses for every component instead of only shared ones', wrong: '// Harness for a one-off page component used in a single test file\nexport class DashboardPageHarness extends ComponentHarness {\n  static hostSelector = \'app-dashboard\';\n  ...\n}', right: '// Reserve harnesses for reusable library components\nexport class RatingHarness extends ComponentHarness {\n  static hostSelector = \'app-star-rating\';\n  ...\n}', explanation: 'Harnesses shine for shared or library components consumed by many tests. For application-specific one-off components, direct queries in the test file are simpler and equally maintainable.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 9 (CDK v9)', label: 'Component Harnesses introduced', features: ['ComponentHarness base class added to @angular/cdk/testing', 'TestbedHarnessEnvironment.loader() available for unit tests', 'Angular Material ships harnesses for all components (MatButtonHarness, MatInputHarness, etc.)', 'HarnessPredicate and .with() filtering API introduced'] },
    { version: 'Angular 14+', label: 'E2E environment adapters stabilised', features: ['PlaywrightHarnessEnvironment available via @angular/cdk/testing/playwright', 'Same harness class reusable across TestBed unit tests and Playwright E2E tests', 'Parallel harness loading with getAllHarnesses() performance improvements'] },
  ];
}
