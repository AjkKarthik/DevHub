import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-flaky-tests-isolation-retries-and-sharding-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-flaky-tests-isolation-retries-and-sharding.html',
  styleUrl: './debugging-flaky-tests-isolation-retries-and-sharding.scss',
})
export class DebuggingFlakyTestsIsolationRetriesAndShardingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic mentions retries — this page covers what actually causes flakiness',
      points: [
        'The main E2E page\'s config example sets <code>retries: process.env[\'CI\'] ? 2 : 0</code> with a one-line comment ("retry flaky tests in CI") but never explains WHY tests become flaky in the first place, or that retries are a mitigation for symptoms, not a fix for root causes. A suite that "passes" only because of retries is hiding real bugs — either in the app, or in the test\'s own isolation.',
        'The single most common root cause of E2E flakiness that has NOTHING to do with timing: tests that share and mutate STATE — a shared backend database row, a shared localStorage key, a shared file on disk — run correctly in isolation but fail unpredictably when run in PARALLEL or in a different order, because one test\'s mutation affects another\'s expected starting state.',
      ],
    },
    {
      heading: 'Test isolation — the real fix, not a workaround',
      points: [
        'Playwright creates a FRESH BROWSER CONTEXT per test by default (separate cookies, localStorage, cache) — this already isolates CLIENT-side state automatically. The isolation gap that causes real flakiness is almost always on the SERVER/backend side: two parallel tests both create a user named <code>"Test User"</code> and one\'s cleanup deletes the other\'s row, or two tests both assume they\'re the only item in a list and assert on a specific index that shifts based on execution order.',
        'The fix is to make test DATA unique per test run — generate a UNIQUE identifier (a UUID, a timestamp-based suffix) for anything a test creates (usernames, list items, uploaded file names) instead of hardcoding a shared literal like <code>"Test User"</code> across multiple tests. This alone eliminates a large fraction of "randomly fails in CI, never locally" flakiness, since local runs are usually sequential (no parallel collision) while CI runs in parallel by default.',
        'For tests that must share a fixture (a pre-seeded database state), use Playwright\'s <code>test.describe.serial()</code> to force that specific describe block\'s tests to run in ORDER and never in parallel with each other — reserve this for cases where true isolation genuinely isn\'t achievable, since serial tests lose the speed benefit of parallelization and a failure in an earlier test skips the rest.',
      ],
    },
    {
      heading: 'When retries are legitimate — and how to tell the difference',
      points: [
        'A test that fails ONCE and then passes on retry with NO code change is exhibiting genuine environmental flakiness (a slow CI runner occasionally missing Playwright\'s action-timeout window, a genuinely-intermittent third-party API call not fully mocked) — <code>retries: 2</code> is a reasonable, honest mitigation for this class of problem specifically.',
        'A test that fails CONSISTENTLY in one order/parallel configuration but passes in another is a state-isolation bug being MASKED by retries, not a timing issue — <code>trace: \'on-first-retry\'</code> (from the main topic) is exactly the tool to distinguish the two: open the trace of a retry-recovered failure and check whether the DOM state at failure time reflects another test\'s leftover data, which points to isolation, not timing.',
        'A useful CI discipline: track and alert on the RETRY RATE itself (what fraction of test runs required at least one retry to pass), not just the final pass/fail — a rising retry rate over time, even while the suite is "green," is an early warning sign of accumulating flakiness that a binary pass/fail metric hides completely.',
      ],
    },
    {
      heading: 'Sharding — splitting the suite across CI machines',
      points: [
        'Playwright\'s built-in sharding (<code>--shard=1/4</code>, <code>--shard=2/4</code>, etc.) splits the FULL test suite across N separate CI machines/jobs running in parallel, each executing roughly <code>1/N</code> of the tests — this reduces WALL-CLOCK CI time for a large suite without reducing total test coverage, since every shard covers a distinct, non-overlapping subset.',
        'Sharding interacts with the isolation discipline above in a specific way: since each shard runs on a SEPARATE machine/process, any test relying on IN-MEMORY state shared across tests within the same process (a module-level counter, a singleton mock server) breaks silently once sharded — this is a strong argument for keeping tests fully self-contained (via unique-per-test data, not shared in-process state) even in a suite small enough to not need sharding YET, since adding sharding later becomes much harder to retrofit onto a suite with hidden cross-test dependencies.',
        'Combine sharding with Playwright\'s <code>--reporter=blob</code> and <code>npx playwright merge-reports</code> to produce ONE combined HTML report from all shards\' results — without merging, each shard\'s failures are scattered across N separate CI job logs, making triage significantly harder than reviewing a single unified report.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'e2e/create-item.spec.ts',
      content: `import { test, expect } from '@playwright/test';

// FLAKY VERSION — commented out — kept here to show the exact bug pattern:
// test('creates an item', async ({ page }) => {
//   await page.goto('/items');
//   await page.getByLabel('Item name').fill('Test Item'); // hardcoded, shared literal
//   await page.getByRole('button', { name: 'Create' }).click();
//   await expect(page.getByText('Test Item')).toBeVisible();
// });
// Running this in parallel with ANY other test that also creates "Test Item"
// (or with itself across retries, if the backend isn't cleaned between runs)
// intermittently fails — a second row with the same name breaks a strict
// getByText() match, or an assertion on list position shifts.

test('creates an item with a unique name — safe under parallel execution', async ({ page }) => {
  // Unique per test RUN, not just per test file — safe even if this same
  // test is retried, or run concurrently in a sharded CI matrix.
  const uniqueName = \`Test Item \${test.info().testId}-\${Date.now()}\`;

  await page.goto('/items');
  await page.getByLabel('Item name').fill(uniqueName);
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText(uniqueName)).toBeVisible();
});
`,
    },
    {
      path: 'e2e/serial-onboarding.spec.ts',
      content: `import { test, expect } from '@playwright/test';

// Use serial mode ONLY when tests genuinely depend on a shared prior step —
// e.g. an onboarding wizard where step 2 requires step 1's state to exist.
// Serial tests never run in parallel with each other, and a failure in an
// earlier test SKIPS the rest of the block (rather than running them anyway
// against a state they can no longer assume is valid).
test.describe.serial('onboarding wizard — sequential steps', () => {
  test('step 1: create account', async ({ page }) => {
    await page.goto('/onboarding/step1');
    await page.getByLabel('Email').fill('new-user@example.com');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/onboarding/step2');
  });

  test('step 2: choose plan (depends on step 1 having run)', async ({ page }) => {
    await page.goto('/onboarding/step2');
    await page.getByRole('button', { name: 'Free plan' }).click();
    await expect(page).toHaveURL('/onboarding/step3');
  });
});
`,
    },
    {
      path: 'playwright.config.ts',
      content: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  retries: process.env['CI'] ? 2 : 0,
  reporter: process.env['CI'] ? [['blob']] : [['html']],

  use: {
    trace: 'on-first-retry', // open this trace to tell timing-flake vs isolation-bug apart
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  webServer: {
    command: 'ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env['CI'],
  },
});

// CI sharding — split the suite across 4 parallel jobs (run once per shard):
//   npx playwright test --shard=1/4
//   npx playwright test --shard=2/4
//   npx playwright test --shard=3/4
//   npx playwright test --shard=4/4
//
// Merge each shard's blob report into one unified HTML report:
//   npx playwright merge-reports --reporter html ./all-blob-reports
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Debugging flaky tests: isolation, retries, and sharding</h3>
    <p>
      Open create-item.spec.ts — the commented-out version shows the exact shared-literal
      bug pattern that causes "randomly fails in CI, never locally" flakiness, and the
      active test shows the unique-per-run fix. serial-onboarding.spec.ts shows when
      test.describe.serial() is the right tool instead.
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
  <head><title>Debugging Flaky Tests</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The onboarding wizard\'s serial test block currently has no cleanup — if step 1 succeeds but step 2 fails, the created account (<code>new-user@example.com</code>) is left behind and could collide with a re-run. Add a <code>test.afterAll()</code> hook to the describe block that deletes it via a mocked or real API call, and explain in a comment why this specific fixture needed a hardcoded email despite the general "use unique names" guidance from the theory section.',
    hint: 'Add test.afterAll(async ({ request }) => { await request.delete(\'/api/users/new-user@example.com\'); }) inside the describe.serial block. In a comment, note that a hardcoded email is acceptable here specifically BECAUSE describe.serial forces this block to run alone (never in parallel with a copy of itself), so the collision risk unique-naming protects against elsewhere doesn\'t apply within a serial block.',
    solution: `test.describe.serial('onboarding wizard — sequential steps', () => {
  // A hardcoded email is acceptable here — unlike the parallel create-item
  // test, describe.serial() guarantees this block never runs concurrently
  // with another copy of itself, so there's no cross-test collision risk
  // to protect against with a unique name. Cleanup below still matters so
  // a RE-RUN (not a parallel run) doesn't collide with a leftover account.
  test.afterAll(async ({ request }) => {
    await request.delete('/api/users/new-user@example.com');
  });

  test('step 1: create account', async ({ page }) => {
    // ...unchanged
  });

  test('step 2: choose plan (depends on step 1 having run)', async ({ page }) => {
    // ...unchanged
  });
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that passes on retry (retries: 2) is fine to leave as-is — the suite is green, that\'s what matters.',
      reality: 'a test failing once and passing on retry with no code change often indicates a real state-isolation bug being masked, not genuine timing flakiness — check the trace from the failed attempt to see if another test\'s leftover data caused it, rather than treating the retry as a fix.',
    },
    {
      thought: 'since Playwright creates a fresh browser context per test automatically, tests are fully isolated from each other by default.',
      reality: 'fresh browser contexts isolate CLIENT-side state (cookies, localStorage) — the far more common flakiness source is SERVER-side shared state: two parallel tests creating rows with the same hardcoded name, or asserting on a list position that shifts based on execution order.',
    },
    {
      thought: 'sharding a test suite across CI machines is purely a performance optimization with no other implications.',
      reality: 'sharding runs each shard on a SEPARATE process/machine — any test that (incorrectly) relies on in-memory state shared with another test in the same process breaks silently once sharded, making pre-existing hidden cross-test dependencies a much harder problem to retrofit-fix after the fact.',
    },
  ];
}
