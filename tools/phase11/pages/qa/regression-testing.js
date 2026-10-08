module.exports = {
  slug: 'regression-testing',
  subtitle: 'Make sure changes did not break what already worked: confirmation vs regression testing, building and pruning a regression suite, selecting tests by change impact and risk, prioritisation, and keeping regression fast enough to run every build.',
  readingTime: 20,
  prerequisites: [{ label: 'Functional Testing', route: '/qa/functional-testing' }],
  apis: ['Confirmation testing (retest)', 'Regression testing', 'Impact analysis', 'Test selection', 'Test prioritisation', 'Suite maintenance'],
  tip: 'Every escaped production bug should leave a test behind. Adding a regression test for each real defect turns your suite into a record of where this product actually breaks.',
  gotchas: [
    'Retesting a fix (confirmation testing) is not regression testing; you also need to check what the fix might have broken around it.',
    'A regression suite that only grows becomes too slow to run and gets skipped. Prune obsolete and duplicate tests as deliberately as you add new ones.',
    'Flaky regression tests train the team to ignore red builds — quarantine and fix them quickly.',
  ],
  quickRef: [
    { name: 'Confirmation testing', type: 'keyword', desc: 'Re-run the failed test to verify a defect fix' },
    { name: 'Regression testing', type: 'keyword', desc: 'Re-run tests to detect side effects of changes in unchanged areas' },
    { name: 'Regression suite', type: 'keyword', desc: 'Curated tests run after changes; usually heavily automated' },
    { name: 'Retest-all', type: 'keyword', desc: 'Run everything: safest, slowest' },
    { name: 'Regression test selection', type: 'keyword', desc: 'Choose tests based on the change (impact analysis)' },
    { name: 'Test prioritisation', type: 'keyword', desc: 'Order tests so the most valuable run first' },
    { name: 'Tiered suites', type: 'keyword', desc: 'Smoke on every commit, core regression nightly, full before release' },
    { name: 'Flaky test', type: 'keyword', desc: 'Passes and fails on the same code; destroys trust in results' },
  ],
  theory: [
    { heading: 'Why regression happens', points: [
      'Any change — new features, bug fixes, refactoring, dependency upgrades, configuration or infrastructure changes — can break behaviour that previously worked.',
      'Shared code (utility libraries, CSS, data models, APIs used by several clients) spreads the blast radius far beyond the area that changed.',
      'Confirmation testing verifies that a specific defect is fixed; regression testing looks for unintended side effects elsewhere. Both are change-related testing.',
      'Because regression testing repeats, it is the prime candidate for automation, with manual and exploratory regression focused on high-risk changes.',
    ] },
    { heading: 'Building and maintaining the suite', points: [
      'Start from critical business flows, high-risk areas, frequently changed modules and every defect that escaped to production.',
      'Organise into tiers: a smoke tier (minutes, every build), a core regression tier (critical paths, every merge or nightly) and an extended tier (broader coverage, before release).',
      'Review the suite each release: remove tests for retired features, merge duplicates, update tests for changed behaviour, and replace low-value UI tests with faster API-level checks.',
      'Track execution time, failure causes and flakiness; a suite nobody trusts or waits for has no value.',
    ] },
    { heading: 'Selecting and prioritising tests', points: [
      'Retest-all is safest but slow. Regression test selection runs only tests affected by the change, using traceability (requirements → tests), code-to-test mapping or component dependencies.',
      'Impact analysis questions: which components changed, who calls them, which requirements and user journeys touch them, and what changed in configuration or data.',
      'Prioritise the selected tests by risk and value: business-critical flows first, then recently failing tests, then areas with defect history.',
      'Combine selection with a small always-run core so that broad breakages (login, navigation, payment) are never missed by an incomplete dependency map.',
    ] },
    { heading: 'Regression in CI/CD', points: [
      'Run fast automated checks on every pull request, a broader suite after merge, and the full regression before a release or on a schedule.',
      'Parallelise and shard long suites; keep UI end-to-end tests few and focused, with most regression coverage at the API and unit levels.',
      'Gate releases on regression results, but treat failures carefully: product bug, test bug, environment issue or flaky test each need different handling.',
      'Visual regression (screenshot comparison) and contract tests catch classes of regressions that functional assertions miss.',
    ] },
  ],
  codeTabs: [
    { label: 'Impact-based selection', language: 'typescript', code: `interface Test { id: string; components: string[]; priority: 1 | 2 | 3; core?: boolean; failedRecently?: boolean }

const dependsOn: Record<string, string[]> = {          // component -> components that use it
  pricing: ['cart', 'checkout', 'invoice'],
  cart: ['checkout'],
  auth: ['cart', 'checkout', 'profile'],
};

function affected(changed: string[]): Set<string> {
  const result = new Set(changed);
  const queue = [...changed];
  while (queue.length) {
    const c = queue.shift()!;
    for (const user of dependsOn[c] ?? []) if (!result.has(user)) { result.add(user); queue.push(user); }
  }
  return result;
}

const tests: Test[] = [
  { id: 'T-login', components: ['auth'], priority: 1, core: true },
  { id: 'T-cart-add', components: ['cart'], priority: 2 },
  { id: 'T-checkout-card', components: ['checkout'], priority: 1, failedRecently: true },
  { id: 'T-invoice-pdf', components: ['invoice'], priority: 3 },
  { id: 'T-profile-edit', components: ['profile'], priority: 3 },
  { id: 'T-search', components: ['search'], priority: 2 },
];

const impact = affected(['pricing']);
const selected = tests
  .filter(t => t.core || t.components.some(c => impact.has(c)))
  .sort((a, b) => a.priority - b.priority || Number(!!b.failedRecently) - Number(!!a.failedRecently));

console.log('affected:', [...impact].join(', '));       // pricing, cart, checkout, invoice
console.log('run order:', selected.map(t => t.id).join(' > '));
// T-checkout-card > T-login > T-cart-add > T-invoice-pdf` },
    { label: 'Tiered pipeline', language: 'yaml', code: `# Regression tiers in CI (illustrative GitHub Actions layout)
on:
  pull_request:
  push:
    branches: [main]
  schedule:
    - cron: "0 2 * * *"        # nightly full run

jobs:
  smoke:          # ~5 min, every PR
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:api -- --grep @smoke
  core-regression:  # ~20 min, after merge to main
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    strategy:
      matrix: { shard: [1, 2, 3, 4] }
    steps:
      - run: npx playwright test --grep @core --shard=\${{ matrix.shard }}/4
  full-regression:  # nightly, all browsers
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --project=chromium --project=firefox --project=webkit` },
    { label: 'Suite health report', language: 'typescript', code: `interface Run { test: string; passed: boolean; durationMs: number; commit: string }

const runs: Run[] = [
  { test: 'T-login', passed: true, durationMs: 4200, commit: 'a1' },
  { test: 'T-login', passed: true, durationMs: 4100, commit: 'a2' },
  { test: 'T-search', passed: false, durationMs: 9000, commit: 'a1' },
  { test: 'T-search', passed: true, durationMs: 8800, commit: 'a1' },   // same commit, different result
  { test: 'T-export', passed: true, durationMs: 61000, commit: 'a2' },
];

const byTest = new Map<string, Run[]>();
for (const r of runs) byTest.set(r.test, [...(byTest.get(r.test) ?? []), r]);

for (const [test, rs] of byTest) {
  const flaky = rs.some(a => rs.some(b => a.commit === b.commit && a.passed !== b.passed));
  const avg = rs.reduce((s, r) => s + r.durationMs, 0) / rs.length;
  const flags = [flaky && 'FLAKY - quarantine', avg > 30000 && 'SLOW - move to API level?'].filter(Boolean);
  console.log(test.padEnd(9), (avg / 1000).toFixed(1) + 's', flags.join(', '));
}` },
  ],
  mistakes: [
    { title: 'Only retesting the fixed bug', wrong: `Fix for BUG-311 (promo rounding) -> rerun BUG-311 steps -> close`, right: `Rerun BUG-311 steps (confirmation)
+ regression: all promo types, cart totals, invoices, refunds (shared pricing code)`, explanation: 'Fixes often touch shared code. Use impact analysis to choose regression tests around the change, not just the original scenario.' },
    { title: 'A suite that only grows', wrong: `Regression suite: 2,400 manual cases, takes 3 weeks, last pruned 2 years ago.`, right: `Quarterly review: retire obsolete cases, merge duplicates, automate stable high-value ones,
keep a 1-day manual pack for risky areas.`, explanation: 'An oversized suite cannot run often enough to give feedback. Curate it continuously.' },
    { title: 'Ignoring flaky tests', wrong: `"That test always fails sometimes, just rerun the pipeline."`, right: `Quarantine the flaky test (tagged, tracked ticket), fix the root cause
(waits, shared data, order dependence), then return it to the gating suite.`, explanation: 'Accepting flakiness teaches the team to ignore red builds, so real regressions slip through.' },
    { title: 'Selection without a safety net', wrong: `Changed file: pricing.ts -> run only tests tagged "pricing"`, right: `Run tests mapped to pricing AND its dependants (cart, checkout, invoice)
AND the always-run core smoke pack`, explanation: 'Dependency maps are never perfect. A small core suite on every change catches breakages the selection logic missed.' },
  ],
  challenge: {
    title: 'Pick a regression set within a time budget',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Each test has { id, minutes, risk (1-5), covers: string[] }. Write chooseTests(tests, changedAreas, budgetMinutes) that first takes every test covering a changed area, ordered by risk descending, while it fits the budget, then fills the remaining time with other tests by risk. Return the chosen ids and the total minutes.',
    hints: ['Split tests into impacted and others with filter.', 'Sort each group by risk descending, then by minutes ascending.', 'Skip a test that does not fit, but keep checking smaller ones.'],
    starterCode: `interface T { id: string; minutes: number; risk: number; covers: string[] }

function chooseTests(tests: T[], changed: string[], budget: number) {
  return { ids: [] as string[], minutes: 0 }; // TODO
}`,
    solution: `interface T { id: string; minutes: number; risk: number; covers: string[] }

function chooseTests(tests: T[], changed: string[], budget: number) {
  const byRisk = (a: T, b: T) => b.risk - a.risk || a.minutes - b.minutes;
  const impacted = tests.filter(t => t.covers.some(c => changed.includes(c))).sort(byRisk);
  const others = tests.filter(t => !impacted.includes(t)).sort(byRisk);
  const ids: string[] = [];
  let minutes = 0;
  for (const t of [...impacted, ...others]) {
    if (minutes + t.minutes <= budget) { ids.push(t.id); minutes += t.minutes; }
  }
  return { ids, minutes };
}

const suite: T[] = [
  { id: 'checkout-card', minutes: 12, risk: 5, covers: ['checkout', 'pricing'] },
  { id: 'promo-codes', minutes: 8, risk: 4, covers: ['pricing'] },
  { id: 'login', minutes: 3, risk: 5, covers: ['auth'] },
  { id: 'search', minutes: 6, risk: 3, covers: ['search'] },
  { id: 'invoice-pdf', minutes: 15, risk: 2, covers: ['pricing', 'invoice'] },
  { id: 'profile', minutes: 4, risk: 1, covers: ['profile'] },
];
console.log(chooseTests(suite, ['pricing'], 30));
// { ids: [ 'checkout-card', 'promo-codes', 'login', 'search' ], minutes: 29 }`,
  },
  quiz: [
    { q: 'What is the difference between confirmation testing and regression testing?', options: ['None', 'Confirmation verifies a fix; regression checks for side effects in unchanged areas', 'Regression is manual, confirmation automated', 'Confirmation is done by developers only'], answer: 1, explanation: 'Both are change-related, but they answer different questions.' },
    { q: 'Which change can cause a regression?', options: ['Only new features', 'Only bug fixes', 'Any change: code, configuration, dependencies or infrastructure', 'Only database changes'], answer: 2, explanation: 'Any modification can have unintended effects, including library upgrades and config changes.' },
    { q: 'Why keep an always-run core suite when using test selection?', options: ['Tools require it', 'Dependency mapping is imperfect, so broad critical breakages could otherwise be missed', 'It is cheaper', 'To increase test counts'], answer: 1, explanation: 'Selection relies on an impact map; a small core pack protects critical flows regardless.' },
    { q: 'A regression test passes and fails on the same commit. What is the right action?', options: ['Delete it', 'Rerun until green', 'Quarantine it, track it and fix the cause', 'Ignore failures from it'], answer: 2, explanation: 'Flaky tests must be isolated and fixed so they do not erode trust in the suite.' },
    { q: 'Which tests are the best candidates for automation?', options: ['One-off exploratory sessions', 'Stable, repeated regression checks of critical flows', 'Usability evaluations', 'Tests of features that change daily'], answer: 1, explanation: 'Regression checks repeat often and their expected results are stable — ideal for automation.' },
  ],
  qna: [
    { q: 'How do you decide what to include in a regression suite?', a: 'Critical business flows, high-risk and frequently changed areas, integrations, and a test for every escaped production defect, prioritised by risk. Keep fast smoke and core tiers for frequent runs and an extended tier for releases, and push coverage down to API and unit levels where possible so the UI suite stays small and stable.' },
    { q: 'How do you choose regression tests for a specific change?', a: 'Perform impact analysis: identify changed components, their dependants, related requirements and user journeys (using the traceability matrix and architecture knowledge), select tests covering them, prioritise by risk, and always add the core smoke pack. When the change is broad or poorly understood, run more or all of the suite.' },
    { q: 'How do you keep a regression suite healthy?', a: 'Measure duration, pass rate and flakiness; quarantine and fix flaky tests quickly; review the suite periodically to remove obsolete or duplicate tests and update changed behaviour; parallelise long runs; and treat test code with the same quality standards as product code.' },
  ],
  revision: {
    oneLiner: 'Regression testing guards existing behaviour after any change: curate tiered suites, select by impact, prioritise by risk, and keep them fast and trustworthy.',
    mustKnow: [
      'Confirmation testing verifies a fix; regression testing finds side effects.',
      'Any change can regress behaviour, including config and dependencies.',
      'Tiered suites: smoke per build, core per merge/nightly, full before release.',
      'Select by impact analysis plus an always-run core.',
      'Add a regression test for every escaped defect.',
      'Prune the suite and fix flaky tests promptly.',
    ],
    interviewFocus: [
      'How would you build a regression suite for a new team?',
      'Explain regression test selection and prioritisation.',
      'How do you deal with flaky tests?',
    ],
  },
};
