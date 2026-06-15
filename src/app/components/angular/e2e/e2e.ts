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
  selector: 'app-e2e',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './e2e.html',
  styleUrl: './e2e.scss',
})
export class E2eDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Testing with TestBed', route: '/angular/testing-demo' },
    { label: 'Component Harnesses', route: '/angular/harnesses' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'E2E testing with Playwright — what and why',
      points: [
        'E2E (end-to-end) tests automate a real browser against your fully running app — they verify complete user journeys from UI interaction through the API layer and back, catching integration failures that unit tests cannot.',
        'Playwright drives Chromium, Firefox, and WebKit browsers in parallel, on the same test suite, catching cross-browser regressions automatically.',
        '<code>ng add playwright-ng-schematics</code> scaffolds Playwright with Angular-aware defaults: <code>playwright.config.ts</code>, an <code>e2e/</code> folder, and a pre-built Angular dev server integration.',
        'E2E tests should focus on <strong>critical user journeys</strong> (login, checkout, form submission, navigation) — not edge cases or error states, which are faster and cheaper to cover with unit/integration tests.',
        'Run with <code>npx playwright test</code> for headless CI, <code>--ui</code> for the interactive test runner with time-travel debugging, and <code>--headed</code> for a live browser during local debugging.',
      ],
    },
    {
      heading: 'Playwright locators — finding elements',
      points: [
        '<code>page.getByRole(\'button\', { name: \'Submit\' })</code> is the <strong>preferred locator</strong> — it queries the accessibility tree (what screen readers see) rather than CSS, surviving DOM and class-name refactors.',
        '<code>page.getByLabel(\'Email\')</code> finds form controls by their associated <code>&lt;label&gt;</code> text — the correct way to locate inputs without coupling to id attributes.',
        '<code>page.getByText(\'Hello\')</code> matches elements containing the specified visible text — useful for asserting rendered copy or locating menu items.',
        '<code>page.getByTestId(\'submit-btn\')</code> uses <code>data-testid</code> attributes — framework-agnostic and stable across visual redesigns, but requires adding attributes to markup.',
        '<code>page.locator(\'.css-selector\')</code> is a last resort — it couples tests to implementation details that change during refactoring and provides no accessibility validation.',
      ],
    },
    {
      heading: 'Actions and auto-waiting',
      points: [
        'Playwright\'s action methods (<code>click()</code>, <code>fill()</code>, <code>press()</code>, <code>check()</code>) <strong>auto-wait</strong> for the target element to be visible, stable (not animating), enabled, and attached before acting — no manual waits needed.',
        '<code>await page.getByRole(\'button\').click()</code> retries the element look-up and waits for actionability checks to pass — if the element takes time to render, the test waits up to the configured <code>actionTimeout</code>.',
        '<code>await page.getByLabel(\'Email\').fill(\'user@example.com\')</code> clears the input first, then types the value — equivalent to triple-click then type, simulating real user input correctly.',
        '<code>await page.keyboard.press(\'Enter\')</code> sends a raw keyboard event — use when the element itself doesn\'t expose a direct action method.',
        '<code>await page.getByRole(\'combobox\').selectOption(\'Paris\')</code> works for <code>&lt;select&gt;</code> elements by option text, value, or label.',
      ],
    },
    {
      heading: 'Assertions and expect()',
      points: [
        'All Playwright assertions come from <code>expect()</code> in <code>@playwright/test</code> and are <strong>auto-retrying</strong> — they poll until the condition is true or the timeout expires, eliminating the need for separate wait calls.',
        '<code>await expect(page).toHaveURL(\'/dashboard\')</code> asserts the current page URL — auto-retries through navigation delays.',
        '<code>await expect(locator).toBeVisible()</code> / <code>.toBeHidden()</code> checks DOM visibility; <code>.toBeEnabled()</code> / <code>.toBeDisabled()</code> checks interactive state.',
        '<code>await expect(locator).toHaveText(\'Welcome\')</code> checks visible text content; <code>.toContainText(/regex/)</code> allows partial or pattern matching.',
        '<code>await expect(locator).toHaveValue(\'text\')</code> for form inputs; <code>.toHaveCount(3)</code> asserts how many elements match a locator.',
      ],
    },
    {
      heading: 'API mocking with page.route()',
      points: [
        '<code>await page.route(\'**/api/posts\', async route => { await route.fulfill({ ... }) })</code> intercepts all matching network requests before they reach a real server — tests run without a backend.',
        'Pass a glob pattern (<code>\'**/api/**\'</code>) or a full URL string. Playwright matches it against outgoing requests and calls your handler instead of making a real HTTP call.',
        '<code>route.fulfill({ status: 200, contentType: \'application/json\', body: JSON.stringify(data) })</code> returns fixture data. Set <code>status: 401</code> or <code>status: 500</code> to test error handling flows.',
        '<code>await page.route(\'**/api/posts\', route => route.abort())</code> simulates network failures (offline mode) — useful for testing retry logic.',
        'Combine <code>page.route()</code> with <code>page.waitForResponse(\'**/api/posts\')</code> to assert the exact request payload the frontend sends before receiving the mocked response.',
      ],
    },
    {
      heading: 'Page Object Model and best practices',
      points: [
        'The Page Object Model (POM) encapsulates locators and actions for a page into a reusable class — tests call <code>loginPage.fillCredentials(email, pwd)</code> instead of embedding selectors directly in test files.',
        'POM classes contain no assertions — keep assertions in the test; POMs own navigation and interaction. This separation makes both readable and independent.',
        'Use <code>test.beforeEach()</code> for shared setup (navigation, mocks) across tests in a <code>describe</code> block — do not duplicate <code>page.goto()</code> in every individual test.',
        'Enable <code>trace: \'on-first-retry\'</code> in <code>playwright.config.ts</code> — traces capture screenshots, DOM snapshots, and network tab for every step on failure, making CI debugging possible without re-running.',
        'In CI: <code>npx playwright install --with-deps</code> installs browsers; run with <code>--reporter=html</code> to generate an interactive HTML report with video playback on failure.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'bash',
      code: `# Install Playwright with Angular schematics
ng add playwright-ng-schematics

# Or manually:
npm init playwright@latest

# Run all tests
npx playwright test

# Run with UI (visual test runner)
npx playwright test --ui

# Show HTML report
npx playwright show-report`,
    },
    {
      label: 'Basic test',
      language: 'typescript',
      code: `// e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test('home page shows topic cards', async ({ page }) => {
  await page.goto('/');

  // Assert heading
  await expect(page.getByRole('heading', { name: /Angular/ })).toBeVisible();

  // Click a card link
  await page.getByRole('link', { name: 'Signals & State' }).click();

  // Assert navigation
  await expect(page).toHaveURL('/counter');
  await expect(page.getByRole('button', { name: /increment/i })).toBeVisible();
});`,
    },
    {
      label: 'API mocking',
      language: 'typescript',
      code: `test('shows posts from API', async ({ page }) => {
  // Intercept the API call and return fixture data
  await page.route('**/api/posts', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, title: 'Mocked Post', body: 'From fixture' }
      ]),
    });
  });

  await page.goto('/posts');
  await expect(page.getByText('Mocked Post')).toBeVisible();
});

// playwright.config.ts base URL:
// use: { baseURL: 'http://localhost:4200' }`,
    },
    {
      label: 'Page Object Model',
      language: 'typescript',
      code: `// e2e/pages/login.page.ts
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillEmail(email: string) {
    await this.page.getByLabel('Email').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel('Password').fill(password);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}

// e2e/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';

test.describe('Login flow', () => {
  test('successful login navigates to dashboard', async ({ page }) => {
    await page.route('**/api/login', route =>
      route.fulfill({ status: 200, body: JSON.stringify({ token: 'abc' }) })
    );

    const loginPage = new LoginPage(page);
    await loginPage.login('user@example.com', 'password123');

    await expect(page).toHaveURL('/dashboard');
  });
});`,
    },
    {
      label: 'Config & CI',
      language: 'typescript',
      code: `// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env['CI'] ? 2 : 0,  // retry flaky tests in CI
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',   // capture trace on first retry for debugging
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
    { name: 'mobile',   use: { ...devices['iPhone 14'] } },
  ],

  // Start Angular dev server before tests
  webServer: {
    command: 'ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
  },
});

// CI install command:
// npx playwright install --with-deps`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Which Playwright locator is considered the most robust and resilient to DOM refactors?',
      options: ['page.locator(\'.css-selector\')', 'page.getByRole(\'button\', { name: \'Submit\' })', 'page.locator(\'div:nth-child(3)\')', 'page.getByTestId(\'submit-btn\')'],
      answer: 1,
      explanation: 'getByRole() queries by ARIA role and accessible name — the same way assistive technology sees the page. It survives CSS and DOM restructuring and doubles as an accessibility check.',
    },
    {
      q: 'What command installs Playwright with Angular-aware defaults using schematics?',
      options: ['npm init playwright@latest', 'npx playwright install --with-deps', 'ng add playwright-ng-schematics', 'ng generate playwright'],
      answer: 2,
      explanation: '\'ng add playwright-ng-schematics\' sets up Playwright with Angular-aware defaults, placing tests in the e2e/ folder and configuring the project correctly.',
    },
    {
      q: 'How do you intercept an API call in Playwright and return fixture data?',
      options: ['page.mock(\'**/api/posts\', { body: [...] })', 'page.intercept(\'**/api/posts\').reply(200, [...])', 'await page.route(\'**/api/posts\', route => route.fulfill({ body: JSON.stringify([...]) }))', 'page.stub(\'**/api/posts\', [...])'],
      answer: 2,
      explanation: 'page.route() intercepts matching requests. Calling route.fulfill() inside the handler returns your fixture data, removing the backend dependency from E2E tests.',
    },
    {
      q: 'Which Playwright assertion auto-retries until the condition is true or a timeout is reached?',
      options: ['assert(element.isVisible())', 'element.check()', 'await expect(locator).toBeVisible()', 'page.waitForSelector(\'.element\')'],
      answer: 2,
      explanation: 'Playwright\'s expect() assertions (from @playwright/test) auto-retry until the condition is met or the timeout expires. This is different from Node\'s built-in assert which is a one-shot check.',
    },
    {
      q: 'What is the Page Object Model (POM) pattern primarily used for in E2E testing?',
      options: ['Generating mock API responses at build time', 'Encapsulating page interactions and selectors into reusable classes, decoupling tests from DOM structure', 'Running tests in parallel across multiple browser instances', 'Replacing unit tests for component logic'],
      answer: 1,
      explanation: 'POM groups locators and actions for a page into a dedicated class. Tests call methods like loginPage.fillCredentials() instead of repeating selectors, making tests readable and resilient to UI changes.',
    },
    {
      q: 'You need to simulate a network failure (offline mode) for a specific API call in Playwright. How do you do it?',
      options: [
        'await page.setOfflineMode(true)',
        'await page.route(\'**/api/posts\', route => route.abort())',
        'await page.route(\'**/api/posts\', route => route.fulfill({ status: 0 }))',
        'await page.evaluate(() => navigator.onLine = false)',
      ],
      answer: 1,
      explanation: 'route.abort() causes the intercepted request to fail as a network error (not an HTTP error status), simulating offline behavior or a connection failure so you can test retry logic and error states.',
    },
    {
      q: 'What does setting `trace: \'on-first-retry\'` in playwright.config.ts do?',
      options: [
        'Slows test execution to make traces human-readable',
        'Captures screenshots, DOM snapshots, and network activity for each test step on the first retry — invaluable for debugging CI failures',
        'Records a video of every test regardless of outcome',
        'Enables Playwright\'s interactive test runner automatically',
      ],
      answer: 1,
      explanation: 'trace: \'on-first-retry\' records a full trace (screenshots, DOM state, network requests) for any test that fails and is retried. You download the trace from CI artifacts and open it with npx playwright show-report to diagnose failures without re-running.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Why is getByRole() the preferred locator in Playwright?', a: 'It queries by ARIA role and accessible name — the same way assistive technology sees the page. It\'s more stable than CSS selectors (survives DOM refactors) and doubles as an accessibility check (if the role is wrong, the test fails).' },
    { q: 'How does Playwright auto-wait work?', a: 'Playwright\'s action methods (click, fill, getByRole) auto-retry until the element is visible, stable (not animating), and attached. You almost never need manual <code>sleep()</code> — the test waits just long enough, using actionability checks before every interaction.' },
    { q: 'How do you intercept API calls in Playwright?', a: '<code>await page.route(\'**/api/posts\', route => route.fulfill({ body: JSON.stringify([...]) }))</code>. All matching requests are intercepted. Use <code>route.abort()</code> for network failures, <code>route.continue()</code> to pass through, or <code>route.fulfill()</code> for fixture data.' },
    { q: 'How do you debug a failing Playwright test?', a: '<code>npx playwright test --headed</code> runs with a visible browser. <code>--ui</code> opens the interactive test runner with time-travel debugging. Enable traces with <code>trace: \'on-first-retry\'</code> in config — traces record screenshots, DOM, and network for every step.' },
    { q: 'How do you run Playwright tests in CI?', a: '<code>npx playwright install --with-deps</code> in the CI step installs browsers and system dependencies. Then <code>npx playwright test --reporter=html</code>. The HTML report includes video and trace on failure — download it as a CI artifact for debugging.' },
    { q: 'When should you use E2E tests vs unit tests?', a: 'E2E tests verify critical user journeys (login, checkout, form submit, navigation). Unit tests verify isolated logic, edge cases, and error states. E2E tests are slow and flaky at scale — keep them focused on happy paths and the most important flows. Use unit tests for everything else.' },
    { q: 'What is the advantage of using test.beforeEach() in a Playwright test suite?', a: '<code>test.beforeEach(({ page }) => { ... })</code> runs shared setup (navigation, route mocking, authentication) before every test in a <code>describe</code> block — eliminates duplicated <code>page.goto()</code> and mock setup in each test. It also makes the test body smaller and focused on the specific scenario being verified.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'page.getByRole()', type: 'function', desc: 'Locates elements by ARIA role and accessible name — the most robust and refactor-resilient locator in Playwright.' , since: '1'},
    { name: 'page.getByText()', type: 'function', desc: 'Locates elements by their visible text content, useful for asserting rendered copy.' , since: '1'},
    { name: 'page.getByLabel()', type: 'function', desc: 'Locates form controls by their associated label text, preferred for input fields.' , since: '1'},
    { name: 'page.getByTestId()', type: 'function', desc: 'Locates elements by data-testid attribute — framework-agnostic and stable across visual redesigns.' , since: '1'},
    { name: 'page.route()', type: 'function', desc: 'Intercepts network requests matching a URL pattern so tests can return fixture data without a real backend.' , since: '1'},
    { name: 'route.fulfill()', type: 'function', desc: 'Responds to an intercepted request with a custom status, headers, and body inside a page.route() handler.' , since: '1'},
    { name: 'expect(locator).toBeVisible()', type: 'function', desc: 'Auto-retrying assertion that waits until the matched element is visible in the DOM before passing or timing out.' , since: '1'},
    { name: 'expect(page).toHaveURL()', type: 'function', desc: 'Asserts the current page URL, auto-retrying until navigation completes.' , since: '1'},
    { name: 'test.describe()', type: 'function', desc: 'Groups related Playwright tests into a named suite for organisation and shared beforeEach setup.' , since: '1'},
    { name: 'ng add playwright-ng-schematics', type: 'keyword', desc: 'Angular schematic that scaffolds Playwright with Angular-aware defaults and places tests in the e2e/ folder.' , since: '14'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Protractor / manual waits vs Playwright auto-wait',
      before: `// Old Protractor approach — manual waits needed
browser.get('/');
browser.sleep(2000);
expect(element(by.css('h1')).getText()).toBe('Welcome');`,
      after: `// Playwright — auto-waits for visibility before asserting
await page.goto('/');
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();`,
      note: 'Playwright retries assertions until they pass or time out, eliminating fragile sleep() calls.',
    },
    {
      title: 'CSS selector locators vs semantic locators',
      before: `// Fragile — breaks when class names or DOM order change
await page.locator('div.card:nth-child(2) button.btn-primary').click();`,
      after: `// Robust — survives refactors, also validates accessibility
await page.getByRole('button', { name: 'Submit' }).click();`,
      note: 'getByRole() queries the accessibility tree, matching what screen readers see.',
    },
    {
      title: 'Real network call vs page.route() mock',
      before: `// Test depends on a live backend — slow, brittle in CI
await page.goto('/posts');
await expect(page.getByText('Real Post From DB')).toBeVisible();`,
      after: `// Mock the API — fast, deterministic, no backend needed
await page.route('**/api/posts', route => route.fulfill({
  status: 200,
  body: JSON.stringify([{ id: 1, title: 'Mocked Post' }]),
}));
await page.goto('/posts');
await expect(page.getByText('Mocked Post')).toBeVisible();`,
      note: 'page.route() decouples E2E tests from backend availability, making them deterministic and fast.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using CSS selectors instead of semantic locators',
      wrong: `// Breaks on any CSS or DOM restructure
await page.locator('.submit-btn').click();
await page.locator('#user-name').fill('Alice');`,
      right: `// Stable — tied to intent and accessibility role
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('Alice');`,
      explanation: 'CSS selectors couple tests to implementation details. Semantic locators like getByRole() and getByLabel() survive redesigns and double as accessibility checks.',
    },
    {
      title: 'Adding manual sleep() calls instead of using auto-wait',
      wrong: `await page.goto('/');
await page.waitForTimeout(3000); // arbitrary sleep — slow and still flaky
await expect(page.getByText('Dashboard')).toBeVisible();`,
      right: `await page.goto('/');
// No sleep needed — Playwright auto-retries the assertion
await expect(page.getByText('Dashboard')).toBeVisible();`,
      explanation: 'Playwright assertions auto-retry until they pass or the timeout expires. Manual sleeps slow tests down and are still flaky on slow machines or under high CI load.',
    },
    {
      title: 'Hitting a real backend instead of mocking APIs',
      wrong: `// Requires a running API server — slow, flaky in CI
test('shows posts', async ({ page }) => {
  await page.goto('/posts');
  await expect(page.getByText('Post from DB')).toBeVisible();
});`,
      right: `test('shows posts', async ({ page }) => {
  await page.route('**/api/posts', route =>
    route.fulfill({ body: JSON.stringify([{ title: 'Mocked' }]) }));
  await page.goto('/posts');
  await expect(page.getByText('Mocked')).toBeVisible();
});`,
      explanation: 'Real backend calls make E2E tests slow and brittle. page.route() returns deterministic fixture data, isolating the frontend under test from backend availability.',
    },
    {
      title: 'Skipping traces and headed mode when debugging failures',
      wrong: `// No visibility into what went wrong in CI
npx playwright test`,
      right: `// Headed mode shows the browser live locally:
npx playwright test --headed
// Enable traces for CI debugging in playwright.config.ts:
// use: { trace: 'on-first-retry', screenshot: 'only-on-failure' }`,
      explanation: 'Without traces or headed mode, CI failures are nearly impossible to diagnose. Traces record screenshots, DOM snapshots, and network activity for every step — download from CI artifacts and open with npx playwright show-report.',
    },
    {
      title: 'Duplicating page.goto() in every test instead of using beforeEach',
      wrong: `test('login shows form', async ({ page }) => {
  await page.goto('/login');
  await page.route('**/api/login', route => route.fulfill({ status: 200 }));
  ...
});
test('login shows error', async ({ page }) => {
  await page.goto('/login');
  await page.route('**/api/login', route => route.fulfill({ status: 401 }));
  ...
});`,
      right: `test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login'); // shared navigation
  });
  test('shows form', async ({ page }) => { ... });
  test('shows error', async ({ page }) => { ... });
});`,
      explanation: 'test.beforeEach() runs shared setup (navigation, auth, common mocks) before every test in the describe block — keeps individual tests focused and eliminates copy-pasted setup code.',
    },
  ];

  challenge: Challenge = {
    title: 'Page Object Model for a Login Page',
    description: 'Implement a Page Object Model (POM) class for a login page, then write two Playwright tests that use it: one for a successful login that asserts navigation to /dashboard, and one for a failed login that asserts an error message is visible. Use getByRole() and getByLabel() as the primary locators. Mock the auth API inside the test using page.route() so no real backend is needed.',
    language: 'typescript',
    hints: [
      'Define a LoginPage class whose constructor accepts a Page object and stores it as a private field',
      'Add methods like fillEmail(email: string), fillPassword(password: string), and submit() that encapsulate the locators — tests should never reference selectors directly',
      'Use page.route(\'**/api/login\', ...) inside each test (before page.goto) and call route.fulfill() with status 200 or 401 to simulate success vs failure',
      'Assert navigation with await expect(page).toHaveURL(\'/dashboard\') and assert the error banner with await expect(page.getByRole(\'alert\')).toBeVisible()',
    ],
    starterCode: `// e2e/login.spec.ts
import { test, expect, Page } from '@playwright/test';

// TODO: Implement the LoginPage Page Object Model class
class LoginPage {
  constructor(private page: Page) {}

  // TODO: Add a method to navigate to the login page

  // TODO: Add a method to fill the email field (use getByLabel)

  // TODO: Add a method to fill the password field (use getByLabel)

  // TODO: Add a method to click the Submit button (use getByRole)
}

test.describe('Login flow', () => {
  test('successful login navigates to dashboard', async ({ page }) => {
    // TODO: Mock POST **/api/login to return { token: 'abc' } with status 200

    const loginPage = new LoginPage(page);
    // TODO: Navigate, fill credentials, and submit

    // TODO: Assert URL is /dashboard
  });

  test('failed login shows error message', async ({ page }) => {
    // TODO: Mock POST **/api/login to return status 401

    const loginPage = new LoginPage(page);
    // TODO: Navigate, fill credentials, and submit

    // TODO: Assert an alert role element is visible
  });
});
`,
    solution: `// e2e/login.spec.ts
import { test, expect, Page } from '@playwright/test';

class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async fillEmail(email: string) {
    await this.page.getByLabel('Email').fill(email);
  }

  async fillPassword(password: string) {
    await this.page.getByLabel('Password').fill(password);
  }

  async submit() {
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }
}

test.describe('Login flow', () => {
  test('successful login navigates to dashboard', async ({ page }) => {
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'abc123', user: { name: 'Test User' } }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('failed login shows error message', async ({ page }) => {
    await page.route('**/api/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Invalid credentials' }),
      });
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('user@example.com', 'wrongpassword');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(/invalid/i);
  });
});
`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Playwright automates real browsers with auto-waiting assertions, semantic locators that mirror the accessibility tree, and network interception — no manual sleeps, no brittle CSS selectors, no backend dependency.',
    mustKnow: [
      'getByRole() is the most robust locator — queries the accessibility tree so tests survive DOM refactors and validate accessibility simultaneously',
      'Playwright auto-waits for elements to be visible, stable, and attached before every action — eliminate manual waitForTimeout/sleep calls entirely',
      'page.route(\'**/api/posts\', route => route.fulfill(...)) intercepts network requests and returns fixture data — decouple E2E tests from backend availability',
      'expect(locator).toBeVisible() auto-retries until the assertion passes or times out — never call waitForTimeout before an assertion',
      'Page Object Model: encapsulate locators and actions per page into a class; tests call semantic methods not CSS selectors — resilient to UI changes',
      'trace: \'on-first-retry\' in config captures screenshots, DOM snapshots, and network for every CI failure step',
      'test.beforeEach() for shared navigation and mock setup — avoids duplicating page.goto() in every test in a describe block',
    ],
    interviewFocus: [
      'Which Playwright locator is most resilient to refactors and why?',
      'How does Playwright auto-wait differ from explicit waitForSelector or sleep calls?',
      'How do you mock an API response in Playwright to test frontend behavior without a running backend?',
      'What is the Page Object Model and how does it improve test maintainability?',
      'When should you write E2E tests vs unit/integration tests?',
    ],
  };
}
