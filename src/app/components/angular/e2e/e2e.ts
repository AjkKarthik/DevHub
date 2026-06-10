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
  selector: 'app-e2e',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './e2e.html',
  styleUrl: './e2e.scss',
})
export class E2eDemo {
  qna: QnaItem[] = [
    { q: 'Why is getByRole() the preferred locator in Playwright?', a: 'It queries by ARIA role and accessible name — the same way assistive technology sees the page. It\'s more stable than CSS selectors (survives DOM refactors) and doubles as an accessibility check (if the role is wrong, the test fails).' },
    { q: 'How does Playwright auto-wait work?', a: 'Playwright\'s action methods (click, fill, getByRole) auto-retry until the element is visible, stable (not animating), and attached. You almost never need manual <code>sleep()</code> — the test waits just long enough.' },
    { q: 'How do you intercept API calls in Playwright?', a: '<code>await page.route(\'**/api/posts\', route => route.fulfill({ body: JSON.stringify([...]) }))</code>. All matching requests are intercepted. Combine with <code>page.unroute()</code> to remove the mock later in the test.' },
    { q: 'How do you debug a failing Playwright test?', a: '<code>npx playwright test --headed</code> runs with a visible browser. <code>--ui</code> opens the interactive test runner. Enable traces with <code>trace: \'on\'</code> in config — traces record screenshots, DOM, and network for every step.' },
    { q: 'How do you run Playwright tests in CI?', a: '<code>npx playwright install --with-deps</code> in the CI step to install browsers. Then <code>npx playwright test --reporter=html</code>. The HTML report includes video and trace on failure — download it as a CI artifact.' },
    { q: 'When should you use E2E tests vs unit tests?', a: 'E2E tests verify critical user journeys (login, checkout, form submit). Unit tests verify isolated logic. E2E tests are slow and flaky at scale — keep them focused on happy paths. Use unit tests for edge cases and error states.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'E2E testing with Playwright',
      points: [
        'Playwright automates real browsers (Chromium, Firefox, WebKit) — tests run against the actual DOM.',
        'ng add playwright-ng-schematics sets up Playwright with Angular-aware defaults.',
        'Tests live in e2e/ folder — run with npx playwright test or ng e2e.',
        'Playwright auto-waits for elements to be visible, stable, and attached — no manual sleeps.',
      ],
    },
    {
      heading: 'Locators — finding elements',
      points: [
        'page.getByRole(\'button\', { name: \'Submit\' }) — preferred: robust against CSS and DOM changes.',
        'page.getByText(\'Hello\') — matches by visible text content.',
        'page.getByTestId(\'my-widget\') — uses data-testid attribute — framework-agnostic.',
        'page.locator(\'.css-selector\') — fallback for when semantic locators are not possible.',
      ],
    },
    {
      heading: 'Assertions',
      points: [
        'await expect(page.getByRole(\'heading\')).toHaveText(\'Welcome\') — auto-retries until true or timeout.',
        'await expect(page).toHaveURL(\'/dashboard\') — asserts current URL.',
        'await expect(locator).toBeVisible() / toBeHidden() — checks visibility.',
        'await expect(locator).toHaveValue(\'text\') — for form inputs.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Prefer getByRole() over CSS selectors — accessible roles survive refactors and match how users perceive the UI.',
        'Use page.route() to intercept API calls and return fixtures — removes backend dependency from E2E tests.',
        'Playwright traces (--trace on) record screenshots, DOM snapshots, and network — invaluable for debugging CI failures.',
        'Run in CI with npx playwright test --reporter=html — generates an interactive report with video on failure.',
      ],
    },
  ];

  tabs: CodeTab[] = [
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
  ];

  quiz: QuizQuestion[] = [
    { q: 'Which Playwright locator is considered the most robust and resilient to DOM refactors?', options: ['page.locator(\'.css-selector\')', 'page.getByRole(\'button\', { name: \'Submit\' })', 'page.locator(\'div:nth-child(3)\')', 'page.getByTestId(\'submit-btn\')'], answer: 1, explanation: 'getByRole() queries by ARIA role and accessible name — the same way assistive technology sees the page. It survives CSS and DOM restructuring and doubles as an accessibility check.' },
    { q: 'What command installs Playwright with Angular-aware defaults using schematics?', options: ['npm init playwright@latest', 'npx playwright install --with-deps', 'ng add playwright-ng-schematics', 'ng generate playwright'], answer: 2, explanation: '\'ng add playwright-ng-schematics\' sets up Playwright with Angular-aware defaults, placing tests in the e2e/ folder and configuring the project correctly.' },
    { q: 'How do you intercept an API call in Playwright and return fixture data?', options: ['page.mock(\'**/api/posts\', { body: [...] })', 'page.intercept(\'**/api/posts\').reply(200, [...])', 'await page.route(\'**/api/posts\', route => route.fulfill({ body: JSON.stringify([...]) }))', 'page.stub(\'**/api/posts\', [...])'], answer: 2, explanation: 'page.route() intercepts matching requests. Calling route.fulfill() inside the handler returns your fixture data, removing the backend dependency from E2E tests.' },
    { q: 'Which Playwright assertion auto-retries until the condition is true or a timeout is reached?', options: ['assert(element.isVisible())', 'element.check()', 'await expect(locator).toBeVisible()', 'page.waitForSelector(\'.element\')'], answer: 2, explanation: 'Playwright\'s expect() assertions (from @playwright/test) auto-retry until the condition is met or the timeout expires. This is different from Node\'s built-in assert which is a one-shot check.' },
    { q: 'What is the Page Object Model (POM) pattern primarily used for in E2E testing?', options: ['Generating mock API responses at build time', 'Encapsulating page interactions and selectors into reusable classes, decoupling tests from DOM structure', 'Running tests in parallel across multiple browser instances', 'Replacing unit tests for component logic'], answer: 1, explanation: 'POM groups locators and actions for a page into a dedicated class. Tests call methods like loginPage.fillCredentials() instead of repeating selectors, making tests readable and resilient to UI changes.' },
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

  quickRef: QuickRefItem[] = [
    { name: 'page.getByRole()', type: 'function', desc: 'Locates elements by ARIA role and accessible name — the most robust and refactor-resilient locator in Playwright.' , since: '1'},
    { name: 'page.getByText()', type: 'function', desc: 'Locates elements by their visible text content, useful for asserting rendered copy.' , since: '1'},
    { name: 'page.getByLabel()', type: 'function', desc: 'Locates form controls by their associated label text, preferred for input fields.' , since: '1'},
    { name: 'page.getByTestId()', type: 'function', desc: 'Locates elements by data-testid attribute — framework-agnostic and stable across visual redesigns.' , since: '1'},
    { name: 'page.route()', type: 'function', desc: 'Intercepts network requests matching a URL pattern so tests can return fixture data without a real backend.' , since: '1'},
    { name: 'expect(locator).toBeVisible()', type: 'function', desc: 'Auto-retrying assertion that waits until the matched element is visible in the DOM before passing or timing out.' , since: '1'},
    { name: 'expect(page).toHaveURL()', type: 'function', desc: 'Asserts the current page URL, auto-retrying until navigation completes.' , since: '1'},
    { name: 'test.describe()', type: 'function', desc: 'Groups related Playwright tests into a named suite for organisation and shared setup.' , since: '1'},
    { name: 'route.fulfill()', type: 'function', desc: 'Responds to an intercepted request with a custom status, headers, and body inside a page.route() handler.' , since: '1'},
    { name: 'ng add playwright-ng-schematics', type: 'function', desc: 'Angular schematic that scaffolds Playwright with Angular-aware defaults and places tests in the e2e/ folder.' , since: '14'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Protractor / manual waits vs Playwright auto-wait', before: `// Old Protractor approach — manual waits needed
browser.get('/');
browser.sleep(2000);
expect(element(by.css('h1')).getText()).toBe('Welcome');`, after: `// Playwright — auto-waits for visibility before asserting
await page.goto('/');
await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();`,
      note: 'Playwright retries assertions until they pass or time out, eliminating fragile sleep() calls.' },
    { title: 'CSS selector locators vs semantic locators', before: `// Fragile — breaks when class names or DOM order change
await page.locator('div.card:nth-child(2) button.btn-primary').click();`, after: `// Robust — survives refactors, also validates accessibility
await page.getByRole('button', { name: 'Submit' }).click();`,
      note: 'getByRole() queries the accessibility tree, matching what screen readers see.' },
    { title: 'Real network call vs page.route() mock', before: `// Test depends on a live backend — slow, brittle in CI
await page.goto('/posts');
await expect(page.getByText('Real Post From DB')).toBeVisible();`, after: `// Mock the API — fast, deterministic, no backend needed
await page.route('**/api/posts', route => route.fulfill({
  status: 200,
  body: JSON.stringify([{ id: 1, title: 'Mocked Post' }]),
}));
await page.goto('/posts');
await expect(page.getByText('Mocked Post')).toBeVisible();`,
      note: 'page.route() decouples E2E tests from backend availability.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using CSS selectors instead of semantic locators', wrong: `// Breaks on any CSS or DOM restructure
await page.locator('.submit-btn').click();
await page.locator('#user-name').fill('Alice');`, right: `// Stable — tied to intent and accessibility role
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('Alice');`, explanation: 'CSS selectors couple tests to implementation details. Semantic locators like getByRole() and getByLabel() survive redesigns and double as accessibility checks.'  },
    { title: 'Adding manual sleep() calls instead of using auto-wait', wrong: `await page.goto('/');
await page.waitForTimeout(3000); // arbitrary sleep
await expect(page.getByText('Dashboard')).toBeVisible();`, right: `await page.goto('/');
// No sleep needed — Playwright auto-retries the assertion
await expect(page.getByText('Dashboard')).toBeVisible();`, explanation: 'Playwright assertions auto-retry until they pass or the timeout expires. Manual sleeps slow tests down and are still flaky on slow machines.'  },
    { title: 'Hitting a real backend instead of mocking APIs', wrong: `// Requires a running API server — flaky in CI
test('shows posts', async ({ page }) => {
  await page.goto('/posts');
  await expect(page.getByText('Post from DB')).toBeVisible();
});`, right: `test('shows posts', async ({ page }) => {
  await page.route('**/api/posts', route =>
    route.fulfill({ body: JSON.stringify([{ title: 'Mocked' }]) }));
  await page.goto('/posts');
  await expect(page.getByText('Mocked')).toBeVisible();
});`, explanation: 'Real backend calls make E2E tests slow and brittle. page.route() returns deterministic fixture data, isolating the frontend under test.'  },
    { title: 'Skipping traces and headed mode when debugging failures', wrong: `// No visibility into what went wrong
npx playwright test`, right: `// Headed mode shows the browser live
npx playwright test --headed
// Or enable traces for CI debugging in playwright.config.ts:
// use: { trace: 'on-first-retry' }`, explanation: 'Without traces or headed mode, CI failures are nearly impossible to diagnose. Traces record screenshots, DOM snapshots, and network for every step.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Playwright 1.20+', label: 'Component Testing support', features: ['Playwright added @playwright/experimental-ct-angular for mounting Angular components in isolation without a full browser navigation', 'Lets you write component-level tests with the same Playwright API (getByRole, expect, route) used for full E2E flows'] },
    { version: 'Angular 14+', label: 'ng add playwright-ng-schematics', features: ['The playwright-ng-schematics package targets standalone/module-based Angular 14+ projects', 'Generates playwright.config.ts, installs browser binaries, and wires ng e2e to run Playwright automatically'] },
  ];
}
