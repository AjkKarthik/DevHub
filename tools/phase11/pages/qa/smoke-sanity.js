module.exports = {
  slug: 'smoke-sanity',
  subtitle: 'Two quick gatekeeping checks that save hours: smoke testing (build verification) asks "is this build stable enough to test at all?", sanity testing asks "does this specific fix or change make sense?" — what each covers, when to run it and how to keep it fast.',
  readingTime: 16,
  prerequisites: [{ label: 'Regression Testing', route: '/qa/regression-testing' }],
  apis: ['Smoke test (BVT)', 'Sanity test', 'Build acceptance', 'Post-deployment check', 'Health endpoint', 'Fail fast'],
  tip: 'Keep the smoke suite boring and fast: under ten minutes, no flaky tests, only the paths without which nothing else can be tested. Its job is to reject bad builds early, not to find subtle bugs.',
  gotchas: [
    'A smoke suite that grows to an hour is a regression suite with the wrong name — nobody waits for it.',
    'Sanity testing is narrow and deep on the changed area; it does not replace the broader regression run before release.',
    'Terminology varies between companies: some call any quick check "sanity". Agree definitions in the test strategy.',
  ],
  quickRef: [
    { name: 'Smoke testing', type: 'keyword', desc: 'Broad, shallow check that critical functions work on a new build' },
    { name: 'Build verification test (BVT)', type: 'keyword', desc: 'Smoke suite run automatically on every build' },
    { name: 'Sanity testing', type: 'keyword', desc: 'Narrow, focused check that a fix or small change behaves rationally' },
    { name: 'Entry gate', type: 'keyword', desc: 'Failed smoke = build rejected, further testing stops' },
    { name: 'Post-deployment smoke', type: 'keyword', desc: 'Quick checks right after deploying to an environment or production' },
    { name: 'Health check endpoint', type: 'keyword', desc: '/health or /ready used by monitors and smoke scripts' },
    { name: 'Synthetic monitoring', type: 'keyword', desc: 'Scheduled scripted journeys against production' },
  ],
  theory: [
    { heading: 'Smoke testing', points: [
      'Smoke testing is a broad but shallow pass over the most important functions to decide whether a build is stable enough for further testing. The name comes from hardware: power it on and see whether it smokes.',
      'Typical smoke scope: the application starts and is reachable, login works, main navigation loads, the core business transaction completes (search → add to cart → pay), and key integrations respond.',
      'It is usually automated as a build verification test (BVT) in CI and after every deployment. A failure rejects the build and stops further testing, saving the team from testing a broken build.',
      'Smoke tests should be fast (minutes), deterministic and independent of fragile test data.',
    ] },
    { heading: 'Sanity testing', points: [
      'Sanity testing is a narrow, quick check after a small change or bug fix, to confirm the change works and nothing obviously wrong happened in closely related functions.',
      'It is often unscripted or lightly scripted and done by the tester who knows the area, before investing in full regression.',
      'Example: after a fix to discount rounding, check a few totals with different promo codes and currencies, and confirm the cart and invoice still display amounts correctly.',
      'If sanity fails, the build goes back to development immediately; if it passes, broader regression follows.',
    ] },
    { heading: 'Smoke vs sanity at a glance', points: [
      'Scope: smoke is wide and shallow across the system; sanity is narrow and somewhat deeper on the changed area.',
      'Trigger: smoke runs on every new build or deployment; sanity runs after a specific fix or minor change.',
      'Form: smoke is usually scripted and automated; sanity is often manual and unscripted.',
      'Goal: smoke asks "can we test this build?"; sanity asks "does this change look right?". Neither replaces regression testing.',
    ] },
    { heading: 'In production: post-deployment checks', points: [
      'Run a production smoke right after a release: health endpoints, a read-only journey, and if possible a safe transaction using a test account or feature flag.',
      'Synthetic monitoring repeats key journeys on a schedule from several regions and alerts on failure or slow responses.',
      'Combine with canary or blue-green deployments so a failed post-deployment smoke triggers an automatic rollback before most users are affected.',
    ] },
  ],
  codeTabs: [
    { label: 'Post-deploy smoke script', language: 'typescript', run: false, code: `// smoke.ts — run after each deployment: npx tsx smoke.ts https://staging.shop.example
const base = process.argv[2];

async function check(name: string, fn: () => Promise<void>) {
  const t = Date.now();
  try { await fn(); console.log(\`PASS \${name} (\${Date.now() - t} ms)\`); }
  catch (e) { console.error(\`FAIL \${name}: \${(e as Error).message}\`); process.exitCode = 1; }
}

async function expectStatus(path: string, status: number, init?: RequestInit) {
  const res = await fetch(base + path, { ...init, signal: AbortSignal.timeout(5000) });
  if (res.status !== status) throw new Error(\`\${path} returned \${res.status}, expected \${status}\`);
  return res;
}

await check('health endpoint', async () => { await expectStatus('/health', 200); });
await check('home page renders', async () => {
  const html = await (await expectStatus('/', 200)).text();
  if (!html.includes('<title>')) throw new Error('no title tag');
});
await check('login works', async () => {
  await expectStatus('/api/login', 200, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: process.env.SMOKE_USER, password: process.env.SMOKE_PASSWORD }),
  });
});
await check('product search', async () => { await expectStatus('/api/products?q=shirt', 200); });` },
    { label: 'Smoke vs sanity', language: 'typescript', code: `const comparison = [
  ['Aspect', 'Smoke', 'Sanity'],
  ['Scope', 'Broad, shallow - whole system', 'Narrow, deeper - changed area'],
  ['When', 'Every new build / deployment', 'After a fix or small change'],
  ['Form', 'Scripted, usually automated', 'Often manual, unscripted'],
  ['Question', 'Is the build testable?', 'Does this change behave sensibly?'],
  ['On failure', 'Reject build, stop testing', 'Return change to development'],
];
for (const [a, b, c] of comparison) console.log(a.padEnd(11), b.padEnd(30), c);` },
    { label: 'Tagging smoke tests', language: 'typescript', run: false, code: `// Playwright: tag smoke tests and run them first in CI
import { test, expect } from '@playwright/test';

test('user can log in @smoke', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(process.env.SMOKE_USER!);
  await page.getByLabel('Password').fill(process.env.SMOKE_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('guest can search and open a product @smoke', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('shirt');
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: /shirt/i }).first().click();
  await expect(page.getByRole('button', { name: 'Add to cart' })).toBeEnabled();
});

// CI: npx playwright test --grep @smoke   (fail fast before the full suite)` },
  ],
  mistakes: [
    { title: 'A smoke suite that takes an hour', wrong: `Smoke suite: 180 UI tests covering every page, ~60 minutes.`, right: `Smoke suite: 8-12 checks of critical paths, < 10 minutes.
Everything else lives in core/full regression.`, explanation: 'Smoke tests exist to give a go/no-go answer quickly. Long smoke suites delay every build and get skipped.' },
    { title: 'Continuing to test a build that failed smoke', wrong: `Login is broken on build 512, but testers continue with other cases and log 40 "blocked" results.`, right: `Smoke fails -> build rejected -> developers notified -> testing resumes on the next build.`, explanation: 'Testing a fundamentally broken build wastes effort and produces noisy defect reports. Smoke is an entry gate.' },
    { title: 'Treating sanity as regression', wrong: `Fix verified with a quick sanity check -> release.`, right: `Sanity check passes -> run the planned regression around the change -> release.`, explanation: 'Sanity testing is deliberately narrow. Side effects elsewhere require regression testing.' },
    { title: 'No smoke after production deployment', wrong: `Deployment pipeline ends with "deploy succeeded".`, right: `Deploy -> post-deployment smoke (health, login, read-only journey) -> on failure, roll back automatically.`, explanation: 'A successful deployment step only means files were shipped. A production smoke verifies users can actually use the system.' },
  ],
  challenge: {
    title: 'Smoke gate decision',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Write gate(results) that decides whether a build passes smoke. Each result is { name, critical: boolean, passed: boolean, ms }. The build is "REJECT" if any critical check failed; "WARN" if a non-critical check failed or any check took longer than 3000 ms; otherwise "ACCEPT". Return the decision and a list of reasons.',
    hints: ['Check critical failures first — they decide REJECT regardless of anything else.', 'Collect warnings in an array.', 'Return { decision, reasons }.'],
    starterCode: `interface Result { name: string; critical: boolean; passed: boolean; ms: number }

function gate(results: Result[]): { decision: 'ACCEPT' | 'WARN' | 'REJECT'; reasons: string[] } {
  return { decision: 'ACCEPT', reasons: [] }; // TODO
}`,
    solution: `interface Result { name: string; critical: boolean; passed: boolean; ms: number }

function gate(results: Result[]): { decision: 'ACCEPT' | 'WARN' | 'REJECT'; reasons: string[] } {
  const criticalFails = results.filter(r => r.critical && !r.passed);
  if (criticalFails.length) {
    return { decision: 'REJECT', reasons: criticalFails.map(r => \`critical check failed: \${r.name}\`) };
  }
  const reasons = [
    ...results.filter(r => !r.passed).map(r => \`non-critical check failed: \${r.name}\`),
    ...results.filter(r => r.ms > 3000).map(r => \`slow: \${r.name} took \${r.ms} ms\`),
  ];
  return { decision: reasons.length ? 'WARN' : 'ACCEPT', reasons };
}

const build1 = [
  { name: 'health', critical: true, passed: true, ms: 120 },
  { name: 'login', critical: true, passed: true, ms: 900 },
  { name: 'search', critical: false, passed: true, ms: 4200 },
];
const build2 = [...build1, { name: 'checkout', critical: true, passed: false, ms: 1500 }];
console.log(JSON.stringify(gate(build1)));
console.log(JSON.stringify(gate(build2)));
// {"decision":"WARN","reasons":["slow: search took 4200 ms"]}
// {"decision":"REJECT","reasons":["critical check failed: checkout"]}`,
  },
  quiz: [
    { q: 'What is the main purpose of smoke testing?', options: ['Find every defect', 'Decide quickly whether a build is stable enough for further testing', 'Test performance', 'Verify a single bug fix in depth'], answer: 1, explanation: 'Smoke is a broad, shallow build verification gate.' },
    { q: 'After a fix to tax rounding you quickly check several orders with different tax rates. This is...', options: ['Smoke testing', 'Sanity testing', 'Load testing', 'Acceptance testing'], answer: 1, explanation: 'A narrow check focused on the changed area is sanity testing.' },
    { q: 'Which is typically automated and run on every build?', options: ['Sanity testing', 'Exploratory testing', 'Smoke testing (BVT)', 'Usability testing'], answer: 2, explanation: 'Build verification tests are the automated smoke suite in CI.' },
    { q: 'Smoke tests fail on login. What should the team do?', options: ['Continue testing other features', 'Reject the build and fix it before further testing', 'Mark tests as blocked and release', 'Run the full regression anyway'], answer: 1, explanation: 'A failed smoke gate means the build is not testable; further testing wastes effort.' },
  ],
  qna: [
    { q: 'What is the difference between smoke and sanity testing?', a: 'Smoke testing is a broad, shallow check of critical functions on every new build to decide whether it is testable; it is scripted and usually automated. Sanity testing is a narrow check after a specific fix or small change to confirm it behaves sensibly; it is often manual and unscripted. Smoke asks "can we test this build?", sanity asks "does this change look right?" Neither replaces regression testing.' },
    { q: 'What would you include in a smoke suite for an e-commerce site?', a: 'Application and API health endpoints, home page rendering, login, search returning results, product page with add-to-cart, a cart that shows correct totals, a checkout using a sandbox payment, and confirmation of order creation — no more than about ten fast, stable checks, run on every deployment.' },
    { q: 'Should smoke tests run in production?', a: 'Yes, in a safe form. After deployment, run read-only checks (health, page loads, search) and, where possible, a transaction with a dedicated test account or behind a feature flag, then clean up. Schedule the same journeys as synthetic monitoring so production regressions and outages are detected quickly, ideally triggering automatic rollback.' },
  ],
  revision: {
    oneLiner: 'Smoke = broad, shallow, automated gate on every build; sanity = narrow, quick check of a specific change; both precede, never replace, regression.',
    mustKnow: [
      'Smoke (BVT): is this build testable? Fast, critical paths only.',
      'Failed smoke rejects the build and stops testing.',
      'Sanity: focused check of a fix or small change.',
      'Keep smoke under ~10 minutes and free of flaky tests.',
      'Run a smoke after every deployment, including production.',
      'Agree terminology in the test strategy.',
    ],
    interviewFocus: [
      'Compare smoke and sanity testing with examples.',
      'Design a smoke suite for a product you know.',
      'What happens in your process when smoke fails?',
    ],
  },
};
