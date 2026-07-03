import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-reusing-authentication-state-across-tests-with-storagestate-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './reusing-authentication-state-across-tests-with-storagestate.html',
  styleUrl: './reusing-authentication-state-across-tests-with-storagestate.scss',
})
export class ReusingAuthenticationStateAcrossTestsWithStoragestateSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic logs in through the UI, every single test',
      points: [
        'The main E2E page\'s login example (and its POM challenge) performs a FULL UI login — fill email, fill password, click submit — inside every individual test that needs to be authenticated. For a suite with dozens of tests behind a login wall (a dashboard, an admin panel, a checkout flow), repeating the full UI login in each one adds real time (form fills + a mocked or real network round trip) multiplied across every test, and couples every unrelated test to the login form\'s own stability.',
        'Playwright\'s <code>storageState</code> mechanism solves this: authenticate ONCE (in a setup step), save the resulting cookies/localStorage to a file, then have every other test START already logged in by loading that saved state — the login UI itself is only exercised by the tests that are actually ABOUT login.',
      ],
    },
    {
      heading: 'Project-level setup — an explicit dependency, not a beforeEach',
      points: [
        'Playwright\'s recommended pattern uses a <code>setup</code> PROJECT that other projects declare as a <code>dependencies</code>: a dedicated <code>auth.setup.ts</code> file (matched by a <code>testMatch</code> pattern) performs the UI login exactly once per full test run and calls <code>page.context().storageState(&#123; path: authFile &#125;)</code> to persist the result.',
        'Every other project (e.g. <code>chromium</code>) declares <code>dependencies: [\'setup\']</code> in <code>playwright.config.ts</code> and sets <code>use: &#123; storageState: authFile &#125;</code> — Playwright then GUARANTEES the setup project runs first, and every test in the dependent project starts its browser context with the saved cookies/localStorage already applied, with zero explicit login code inside the test itself.',
        'This is DIFFERENT from a plain <code>test.beforeEach()</code> UI login: <code>beforeEach</code> still re-runs the full login flow before every single test (same cost as the main topic\'s pattern, just moved to a hook); <code>storageState</code> runs it ONCE for the whole suite and every test simply inherits the already-authenticated browser context.',
      ],
    },
    {
      heading: 'Testing multiple user roles without re-authenticating per test',
      points: [
        'For apps with distinct roles (admin vs regular user), create ONE storage-state file PER role — <code>admin.json</code> and <code>user.json</code> — each produced by its own setup test that logs in as that role. Define separate Playwright PROJECTS, each pointing <code>storageState</code> at its own file, so an admin-only test suite and a regular-user test suite both start pre-authenticated as the correct role with no per-test login code in either.',
        'Storage state files can also be crafted WITHOUT going through the UI at all, when the app supports it — writing a valid session cookie or JWT directly into the saved state (matching exactly what a real login would produce) skips even the ONE-TIME UI login cost, useful when the login form itself involves something slow or flaky to automate (an external SSO redirect, a CAPTCHA in non-production environments).',
      ],
    },
    {
      heading: 'Expiry and staleness — the trade-off storageState introduces',
      points: [
        'A saved storage state is a SNAPSHOT — if the app\'s session tokens expire during a long test run, or if the backend enforces short-lived tokens for security, tests relying on stale storage state can start failing with authentication errors that have NOTHING to do with the actual feature under test, which is confusing to diagnose if you don\'t know storageState is in play.',
        'Common mitigations: regenerate the storage state file on every CI run (the setup project already does this automatically, since it runs fresh each time); for long-lived local development, periodically re-run just the setup project (<code>npx playwright test --project=setup</code>) rather than the full suite when you start seeing unexplained 401s.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'e2e/auth.setup.ts',
      content: `import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate as a regular user', async ({ page }) => {
  await page.route('**/api/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'abc123' }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/dashboard');

  // Persist cookies + localStorage — every dependent test starts already
  // logged in by loading this file, no UI login inside the test itself.
  await page.context().storageState({ path: authFile });
});
`,
    },
    {
      path: 'e2e/dashboard.spec.ts',
      content: `import { test, expect } from '@playwright/test';

// No login code here at all — this test's browser context is created
// with the saved storageState already applied (wired via playwright.config.ts's
// "dependencies: ['setup']" + "use: { storageState: authFile }" on this project).
test('dashboard shows the welcome message for a logged-in user', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  await expect(page.getByText(/welcome/i)).toBeVisible();
});

test('logged-in user can navigate to settings without re-authenticating', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Settings' }).click();

  await expect(page).toHaveURL('/settings');
});
`,
    },
    {
      path: 'playwright.config.ts',
      content: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,

  projects: [
    // Runs first — performs the UI login once and writes playwright/.auth/user.json
    { name: 'setup', testMatch: /auth\\.setup\\.ts/ },

    // Depends on 'setup' — Playwright guarantees it runs after, and every
    // test in this project's browser context starts pre-authenticated.
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
  },
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Reusing authentication state across tests with storageState</h3>
    <p>
      This demo shows the Playwright CONFIG side of storageState — auth.setup.ts,
      dashboard.spec.ts, and playwright.config.ts. There is no live browser
      interaction to click through here; open those three files to see how a
      dedicated setup project authenticates once and every dependent test starts
      already logged in.
    </p>
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
  <head><title>Reusing Authentication State Across Tests</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a second role — an "admin" setup project and storage-state file — so admin-only tests can start pre-authenticated as an admin, separate from the regular user in the existing setup.',
    hint: 'Create e2e/admin.setup.ts (mirroring auth.setup.ts but logging in with admin credentials and saving to playwright/.auth/admin.json). Add a new "setup-admin" project with that testMatch, then a new "chromium-admin" project with storageState pointing at admin.json and dependencies: [\'setup-admin\'].',
    solution: `// e2e/admin.setup.ts
import { test as setup, expect } from '@playwright/test';

const adminAuthFile = 'playwright/.auth/admin.json';

setup('authenticate as an admin', async ({ page }) => {
  await page.route('**/api/login', route =>
    route.fulfill({ status: 200, body: JSON.stringify({ token: 'admin-token', role: 'admin' }) })
  );

  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('adminpass123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL('/dashboard');
  await page.context().storageState({ path: adminAuthFile });
});

// playwright.config.ts — add alongside the existing projects:
{
  name: 'setup-admin',
  testMatch: /admin\\.setup\\.ts/,
},
{
  name: 'chromium-admin',
  use: {
    ...devices['Desktop Chrome'],
    storageState: 'playwright/.auth/admin.json',
  },
  dependencies: ['setup-admin'],
  testMatch: /admin-.*\\.spec\\.ts/,
},`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>test.beforeEach()</code> logging in via the UI and Playwright\'s <code>storageState</code> mechanism achieve the same thing.',
      reality: 'beforeEach still re-runs the full UI login before EVERY test — same cost as doing it inline, just relocated. storageState authenticates ONCE for the whole suite via a dedicated setup project, and every dependent test simply inherits the already-authenticated browser context with zero login code.',
    },
    {
      thought: 'storageState only supports a single logged-in user for the whole test suite.',
      reality: 'you can produce one storage-state file PER ROLE (admin, regular user, etc.), each from its own setup test, and define separate Playwright projects pointing at different files — letting admin-only and user-only test suites both start pre-authenticated as the correct role.',
    },
    {
      thought: 'a test failing with an authentication error always means the feature under test has an auth bug.',
      reality: 'a saved storageState is a snapshot that can go stale if the app enforces short-lived session tokens — unexplained 401s in a long-running or old CI cache can mean the saved auth state simply expired, unrelated to the actual feature being tested.',
    },
  ];
}
