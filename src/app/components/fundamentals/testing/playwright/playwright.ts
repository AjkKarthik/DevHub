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
  selector: 'app-playwright-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './playwright.html',
  styleUrl: './playwright.scss',
})
export class PlaywrightTesting {
  quickRef: QuickRefItem[] = [
    { name: 'page.goto(url)',              type: 'method',   desc: 'Navigate to a URL and wait for the page to load.' },
    { name: 'page.getByRole()',            type: 'method',   desc: 'Locate by ARIA role — preferred accessible locator.' },
    { name: 'locator.click()',             type: 'method',   desc: 'Click an element. Playwright auto-waits for it to be actionable.' },
    { name: 'locator.fill(text)',          type: 'method',   desc: 'Clear and type text into an input.' },
    { name: 'expect(locator).toBeVisible()',type: 'method',  desc: 'Assert the element is visible in the viewport.' },
    { name: 'page.route()',                type: 'method',   desc: 'Intercept network requests and return mock responses.' },
    { name: 'test.use({ storageState })',  type: 'method',   desc: 'Reuse saved authentication state across tests.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Auto-Wait — the Key Differentiator', points: [
      'Every Playwright action (click, fill, check) automatically waits for the element to be visible, stable, and actionable.',
      'No sleep() or explicit waitForElement() needed in most cases.',
      'expect() assertions also auto-retry until the condition passes or the timeout is reached.',
      'Default timeout is 30 seconds for actions; 5 seconds for assertions — configurable per test.',
    ]},
    { heading: 'Locators', points: [
      'getByRole() — preferred; mirrors ARIA tree (button, link, textbox, heading, checkbox).',
      'getByLabel() — for form inputs by their associated label text.',
      'getByText() — for non-interactive elements.',
      'getByTestId() — for elements with data-testid attribute; last resort.',
      'Locators are lazy — no DOM lookup until an action is performed.',
    ]},
    { heading: 'Page Object Model', points: [
      'POM encapsulates page interactions in a class — tests call high-level methods, not raw locators.',
      'LoginPage class: fillEmail(), fillPassword(), clickSubmit() instead of repeated locator calls.',
      'POMs make tests more readable and reduce duplication.',
      'Playwright recommends using fixtures to inject POMs into tests.',
    ]},
    { heading: 'Network Interception', points: [
      'page.route(pattern, handler) intercepts requests matching the pattern.',
      'Use route.fulfill() to return a mock response without hitting the real API.',
      'Use route.abort() to simulate network failures.',
      'Intercept is useful for making E2E tests deterministic without a seeded backend.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Basic E2E', language: 'typescript', code:
`import { test, expect } from '@playwright/test';

test('user can log in and reach dashboard', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Auto-waits for URL change
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome, Alice' })).toBeVisible();
});

test('shows error for wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toContainText('Invalid credentials');
});` },
    { label: 'Page Object Model', language: 'typescript', code:
`// pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() { await this.page.goto('/login'); }

  async login(email: string, password: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(password);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }

  get errorAlert() { return this.page.getByRole('alert'); }
}

// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test('login success', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login('alice@example.com', 'secret');
  await expect(page).toHaveURL('/dashboard');
});` },
    { label: 'Network Intercept', language: 'typescript', code:
`test('shows products from mocked API', async ({ page }) => {
  // Intercept before navigation
  await page.route('**/api/products', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Widget', price: 9.99 },
        { id: 2, name: 'Gadget', price: 24.99 },
      ]),
    });
  });

  await page.goto('/products');

  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(2);
  await expect(items.first()).toContainText('Widget');
});

test('shows error when API fails', async ({ page }) => {
  await page.route('**/api/products', route => route.abort());
  await page.goto('/products');
  await expect(page.getByRole('alert')).toContainText('Failed to load');
});` },
    { label: 'Auth State Reuse', language: 'typescript', code:
`// auth.setup.ts — run once before other tests
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/dashboard');
  // Save storage state (cookies + localStorage) for reuse
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// playwright.config.ts
export default {
  projects: [
    { name: 'setup', testMatch: /auth.setup.ts/ },
    {
      name: 'chromium',
      use: { storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
};` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using page.waitForTimeout() for timing', wrong: 'await page.waitForTimeout(2000); // wait 2s for animation', right: 'await expect(locator).toBeVisible(); // auto-waits until visible', explanation: 'Hard waits make tests slow and flaky. Playwright auto-waits on every action — rely on that instead of arbitrary sleep.' },
    { title: 'Querying by CSS class in E2E tests', wrong: 'page.locator(".btn-primary")', right: 'page.getByRole("button", { name: /submit/i })', explanation: 'CSS classes change during redesigns without breaking functionality. Role + name is stable, accessible, and meaningful.' },
    { title: 'Not reusing auth state', wrong: 'log in at the start of every test', right: 'use storageState to save and restore auth cookies', explanation: 'Login adds 1–2 seconds per test. With 50 tests that is 2 minutes wasted per run. Save auth state once and reuse it.' },
    { title: 'Running E2E tests in headed mode in CI', wrong: 'no --project or DISPLAY env set; tests fail silently', right: 'use headless: true (default) or set DISPLAY=:99 with Xvfb', explanation: 'CI runners have no display. Playwright defaults to headless — only override this explicitly when debugging locally.' },
    { title: 'One giant test for every user journey', wrong: 'test("entire app flow", async () => { /* 200 lines */ })', right: 'one test per scenario — use fixtures and POM to share setup', explanation: 'A 200-line test is impossible to debug. When it fails, you have no idea which step broke. Keep each test focused on one outcome.' },
  ];

  challenge: Challenge = {
    title: 'Write a Playwright E2E test',
    language: 'typescript',
    description: 'Write two Playwright tests for a todo app at /todos: (1) add a new todo by typing in the input and clicking Add — verify it appears in the list, (2) complete a todo by clicking its checkbox — verify it gets a "done" class.',
    hints: [
      'Use page.getByRole("textbox") for the input, page.getByRole("button", { name: "Add" }) to submit.',
      'page.getByRole("checkbox").click() then expect(page.getByRole("listitem")).toHaveClass(/done/).',
    ],
    starterCode:
`import { test, expect } from '@playwright/test';

test('adds a new todo', async ({ page }) => {
  await page.goto('/todos');
  // write test here
});

test('completing a todo marks it done', async ({ page }) => {
  await page.goto('/todos');
  // write test here
});`,
    solution:
`import { test, expect } from '@playwright/test';

test('adds a new todo', async ({ page }) => {
  await page.goto('/todos');
  await page.getByRole('textbox', { name: /new todo/i }).fill('Buy groceries');
  await page.getByRole('button', { name: /add/i }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Buy groceries' })).toBeVisible();
});

test('completing a todo marks it done', async ({ page }) => {
  await page.goto('/todos');
  await page.getByRole('textbox').fill('Write tests');
  await page.getByRole('button', { name: /add/i }).click();
  const item = page.getByRole('listitem').filter({ hasText: 'Write tests' });
  await item.getByRole('checkbox').click();
  await expect(item).toHaveClass(/done/);
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What does Playwright\'s auto-wait mean for test authors?', options: ['Tests run automatically without setup', 'You rarely need explicit sleep() or waitFor() — Playwright waits for elements to be actionable before interacting', 'Playwright runs all tests in parallel automatically', 'Page navigation is instant'], answer: 1, explanation: 'Playwright retries every action and assertion until the element is ready or the timeout expires. This eliminates the most common source of E2E flakiness.' },
    { q: 'What is the purpose of the Page Object Model in Playwright?', options: ['It makes tests run faster', 'It encapsulates page interactions in a class so tests call readable methods instead of raw locators', 'It is required by Playwright — tests won\'t run without it', 'It replaces the need for assertions'], answer: 1, explanation: 'POM is a design pattern. Tests call loginPage.login(email, password) instead of scattering locator logic everywhere. This reduces duplication and makes tests easier to maintain.' },
    { q: 'How do you make Playwright E2E tests deterministic without a seeded backend?', options: ['Use page.waitForTimeout(5000)', 'Use page.route() to intercept and mock API responses', 'Disable JavaScript on the page', 'Use only getByTestId locators'], answer: 1, explanation: 'page.route() intercepts matching requests and returns controlled mock responses. Tests no longer depend on backend data, making them fast and deterministic.' },
  ];

  qna: QnaItem[] = [
    { q: 'How do I debug a failing Playwright test?', a: 'Run with --debug to open Playwright Inspector (pauses before each step). Add await page.pause() in the test to break at a specific point. Use --headed to watch the browser. The trace viewer (npx playwright show-trace) shows a full step-by-step recording with screenshots and network logs.' },
    { q: 'How does Playwright compare to Cypress?', a: 'Playwright: multi-browser (Chromium, Firefox, WebKit), runs out-of-process, supports multiple tabs and frames, better performance in CI. Cypress: in-browser architecture, excellent time-travel debugger, strong community, simpler setup. Both are excellent — Playwright is more capable for complex scenarios; Cypress has a better debugging UX.' },
    { q: 'Can I use Playwright for component testing (not full E2E)?', a: 'Yes — Playwright Component Testing (experimental) mounts components in a real browser using Vite/Webpack. It sits between unit tests and full E2E: real browser rendering without a full app. It competes with Cypress component testing.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Playwright drives real browsers with auto-wait, role-based locators, and network interception — structured with Page Object Model.',
    mustKnow: [
      'Auto-wait: every action retries until element is actionable',
      'Locator priority: getByRole > getByLabel > getByText > getByTestId',
      'page.route() intercepts API calls for deterministic tests',
      'Page Object Model encapsulates interactions in reusable classes',
      'storageState reuses auth across tests — avoid repeated login',
      'Never use waitForTimeout() — use assertions that auto-wait',
    ],
    interviewFocus: [
      'Playwright auto-wait vs explicit sleeps — why it matters',
      'Page Object Model pattern and its benefits',
      'How to make E2E tests deterministic with network mocking',
    ],
  };
}
