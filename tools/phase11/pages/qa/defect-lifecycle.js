module.exports = {
  slug: 'defect-lifecycle',
  subtitle: 'Report bugs developers can fix on the first read: the anatomy of a reproducible report, severity versus priority, defect states and triage, duplicates and "cannot reproduce", and the metrics that show where quality is leaking.',
  readingTime: 20,
  apis: ['Bug report template', 'Severity vs priority', 'Defect states', 'Triage', 'Root cause analysis', 'Defect leakage'],
  tip: 'Before filing, reduce the bug to the shortest reliable reproduction and check the most recent build. A five-step report with one screenshot gets fixed faster than a twenty-step story — and minimising often reveals the real trigger.',
  gotchas: [
    'Severity is decided by the technical/user impact (usually QA); priority is the business order of fixing (usually the product owner). A typo in the company name on the home page is low severity but high priority.',
    '"Doesn\'t work" is not an actual result. Write what happened: the exact message, status code, wrong value or missing element.',
    'Closing a defect as "cannot reproduce" without capturing environment details loses the bug; request logs, build number and data first.',
  ],
  quickRef: [
    { name: 'Defect / bug', type: 'keyword', desc: 'A flaw that can cause the system to fail to meet a requirement or expectation' },
    { name: 'Title', type: 'keyword', desc: 'Where + what + condition, e.g. "Checkout: total ignores promo code when cart has 1 item"' },
    { name: 'Steps to reproduce', type: 'keyword', desc: 'Numbered, minimal, with concrete test data' },
    { name: 'Expected vs actual result', type: 'keyword', desc: 'What should happen vs what happened, precisely' },
    { name: 'Environment', type: 'keyword', desc: 'Build/version, URL, browser/device, OS, account, feature flags' },
    { name: 'Severity', type: 'keyword', desc: 'Impact: blocker/critical, major/high, minor/medium, trivial/low' },
    { name: 'Priority', type: 'keyword', desc: 'Urgency to fix: P1 (now) … P4 (when convenient)' },
    { name: 'New → Assigned → Fixed → Retest → Closed', type: 'keyword', desc: 'Typical happy-path lifecycle' },
    { name: 'Reopened / Rejected / Deferred / Duplicate', type: 'keyword', desc: 'Alternative outcomes in the lifecycle' },
    { name: 'Defect leakage', type: 'keyword', desc: 'Share of defects found after a phase (e.g. in production)' },
  ],
  theory: [
    { heading: 'Anatomy of a good bug report', points: [
      'Title: specific and searchable — component, symptom and trigger. "Login broken" is weak; "Login: valid user gets 500 when the email contains a + sign" is strong.',
      'Steps to reproduce: numbered, minimal, starting from a known state, with exact data (account, input values, file used). Note whether it reproduces every time or intermittently (and how often).',
      'Expected result vs actual result: quote messages, status codes and values. Attach evidence — screenshots, screen recordings, HAR files, console and server logs, request IDs.',
      'Environment and context: build or commit, environment URL, browser/device/OS versions, user role, feature flags, time (for log lookup) and whether it is a regression from a previous version.',
      'One defect per report. Two symptoms with different causes need two reports, or neither gets tracked properly.',
    ] },
    { heading: 'Severity versus priority', points: [
      'Severity describes impact on the system and users: blocker (no workaround, testing or usage blocked), critical (major function broken or data loss), major, minor, trivial (cosmetic).',
      'Priority describes how soon the business wants it fixed relative to other work. It depends on release dates, customer commitments and visibility.',
      'They are independent: high severity/low priority (a crash in a rarely used legacy export scheduled for removal) and low severity/high priority (wrong logo before a marketing launch) are both common.',
      'Agree definitions per team and keep them in the test plan so everyone classifies consistently; inconsistent severity makes metrics meaningless.',
    ] },
    { heading: 'Lifecycle and triage', points: [
      'A typical workflow: New → (triage) Assigned/Open → In progress → Fixed/Resolved → Ready for retest → Closed, with Reopened if retest fails.',
      'Alternative resolutions: Duplicate (link the original), Rejected / Not a bug (works as designed — check whether the requirement is wrong), Cannot reproduce, Deferred (accepted risk, fix later), Won\'t fix.',
      'Triage meetings (or async triage) review new defects: confirm reproduction, set severity and priority, assign an owner, and decide whether it blocks the release.',
      'After a fix, the tester performs confirmation testing (retest the exact scenario) and regression testing around the change, then closes or reopens with new evidence.',
    ] },
    { heading: 'Learning from defects', points: [
      'Root cause analysis asks why the defect was introduced and why it was not caught earlier — missing requirement, misunderstanding, untested boundary, environment difference, missing automation.',
      'Defect leakage (or escape rate) = defects found in a later phase ÷ total defects found for that phase and later. High leakage to production signals gaps in test coverage or environments.',
      'Defect density (defects per module or per KLOC) highlights clustering; defect age and reopen rate show process health.',
      'Use metrics to improve the process, never to rank individual developers or testers — that only encourages arguing about classification.',
    ] },
  ],
  codeTabs: [
    { label: 'Bug report template', language: 'yaml', code: `id: BUG-2481
title: "Checkout: order total ignores promo code SAVE10 when the cart has exactly 1 item"
severity: major          # incorrect amount charged, workaround: add a second item
priority: P1             # promo campaign starts Monday
status: new
environment:
  build: web 4.18.0 (commit 9c1e2fa)
  url: https://staging.shop.example
  browser: Chrome 141 / Windows 11
  account: qa_buyer_07 (standard customer)
reproducibility: 5/5
steps:
  1. Log in as qa_buyer_07
  2. Add product SKU-1001 (price 40.00) to an empty cart
  3. Apply promo code SAVE10 on the cart page
  4. Click "Proceed to checkout"
expected: Order summary total is 36.00 and shows "SAVE10 (-4.00)"
actual: Order summary total is 40.00; the cart page showed 36.00 before step 4
evidence: [checkout.mp4, har/checkout-2481.har, request-id 7f3c-91aa]
notes: Works with 2+ items. Regression - passes on 4.17.2.` },
    { label: 'Lifecycle as a state machine', language: 'typescript', code: `type Status = 'new' | 'assigned' | 'fixed' | 'retest' | 'closed' | 'reopened'
  | 'rejected' | 'duplicate' | 'deferred';

const allowed: Record<Status, Status[]> = {
  new: ['assigned', 'rejected', 'duplicate', 'deferred'],
  assigned: ['fixed', 'deferred', 'rejected'],
  fixed: ['retest'],
  retest: ['closed', 'reopened'],
  reopened: ['assigned'],
  deferred: ['assigned'],
  closed: ['reopened'],
  rejected: [], duplicate: [],
};

function move(history: Status[], next: Status): Status[] {
  const current = history[history.length - 1];
  if (!allowed[current].includes(next)) throw new Error(\`cannot go from \${current} to \${next}\`);
  return [...history, next];
}

let h: Status[] = ['new'];
for (const s of ['assigned', 'fixed', 'retest', 'reopened', 'assigned', 'fixed', 'retest', 'closed'] as Status[]) {
  h = move(h, s);
}
console.log(h.join(' -> '));
console.log('reopen count:', h.filter(s => s === 'reopened').length);   // 1
try { move(['new'], 'closed'); } catch (e) { console.log((e as Error).message); }` },
    { label: 'Leakage and density', language: 'typescript', code: `interface Defect { id: string; module: string; foundIn: 'dev' | 'qa' | 'uat' | 'production' }

const defects: Defect[] = [
  ...Array.from({ length: 34 }, (_, i) => ({ id: 'Q' + i, module: i % 3 ? 'checkout' : 'search', foundIn: 'qa' as const })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: 'U' + i, module: 'checkout', foundIn: 'uat' as const })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: 'P' + i, module: 'checkout', foundIn: 'production' as const })),
];

const inQa = defects.filter(d => d.foundIn === 'qa').length;
const after = defects.filter(d => d.foundIn === 'uat' || d.foundIn === 'production').length;
console.log('leakage from QA:', ((after / (inQa + after)) * 100).toFixed(1) + '%'); // 15.0%

const byModule = defects.reduce<Record<string, number>>((m, d) => ({ ...m, [d.module]: (m[d.module] ?? 0) + 1 }), {});
console.log(byModule);   // { search: 12, checkout: 28 } -> checkout clusters most defects -> deepen testing there` },
  ],
  mistakes: [
    { title: 'Vague bug titles and actual results', wrong: `Title: Checkout not working
Actual: It doesn't work`, right: `Title: Checkout: "Pay" button stays disabled after entering a valid Amex card
Actual: Button remains greyed out; console shows "TypeError: luhn is undefined"`, explanation: 'Specific titles make duplicates findable and triage fast. The actual result must be an observable fact, not a judgement.' },
    { title: 'Mixing up severity and priority', wrong: `Severity: low, Priority: low   (wrong company name on the landing page, launch tomorrow)`, right: `Severity: low (cosmetic), Priority: P1 (launch tomorrow, highly visible)`, explanation: 'Severity measures impact; priority measures urgency. Setting them independently lets the team fix the right things first.' },
    { title: 'Missing environment and build details', wrong: `Steps: open the app, upload a file -> error`, right: `Build 4.18.0 (9c1e2fa), staging, Safari 18 on iOS 18.1, user qa_admin,
file: invoice_25MB.pdf (attached), time 10:42 UTC, request-id 1a2b`, explanation: 'Without build, platform and data, developers waste time guessing, and many such bugs end as "cannot reproduce".' },
    { title: 'Closing without regression around the fix', wrong: `Retest: the exact scenario passes -> close`, right: `Retest: exact scenario passes
Regression: related paths (2 items, 0 items, other promo types, guest checkout) pass -> close`, explanation: 'A fix can break nearby behaviour. Confirmation testing plus targeted regression catches side effects before release.' },
  ],
  challenge: {
    title: 'Lint a bug report',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Write lintBug(report) that returns a list of problems: title shorter than 15 characters or containing vague words ("not working", "broken", "issue"); fewer than 2 steps; missing expected or actual result; actual result that is just "doesn\'t work"; missing build or environment; severity "low" with priority "P4" while the title mentions "payment" or "data loss" (suspicious classification). Return an empty array for a good report.',
    hints: ['Lowercase strings once before checks.', 'Use an array of vague phrases and some().', 'Return messages, not booleans, so the reporter knows what to fix.'],
    starterCode: `interface BugReport {
  title: string; steps: string[]; expected?: string; actual?: string;
  build?: string; environment?: string; severity: 'blocker' | 'critical' | 'major' | 'minor' | 'low';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
}

function lintBug(r: BugReport): string[] {
  return []; // TODO
}`,
    solution: `interface BugReport {
  title: string; steps: string[]; expected?: string; actual?: string;
  build?: string; environment?: string; severity: 'blocker' | 'critical' | 'major' | 'minor' | 'low';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
}

const VAGUE = ['not working', 'broken', 'issue'];

function lintBug(r: BugReport): string[] {
  const problems: string[] = [];
  const title = r.title.toLowerCase();
  if (r.title.length < 15) problems.push('title is too short to be specific');
  if (VAGUE.some(v => title.includes(v))) problems.push('title uses vague wording');
  if (r.steps.length < 2) problems.push('add numbered steps to reproduce');
  if (!r.expected) problems.push('missing expected result');
  if (!r.actual) problems.push('missing actual result');
  else if (/^doesn'?t work\\.?$/i.test(r.actual.trim())) problems.push('actual result must describe what happened');
  if (!r.build || !r.environment) problems.push('missing build or environment');
  if (r.severity === 'low' && r.priority === 'P4' && /payment|data loss/.test(title)) {
    problems.push('check classification: payment/data-loss bug marked low/P4');
  }
  return problems;
}

console.log(lintBug({ title: 'Payment broken', steps: ['pay'], actual: "doesn't work",
  severity: 'low', priority: 'P4' }).join('\\n'));
console.log(lintBug({
  title: 'Checkout: promo SAVE10 ignored for single-item carts', steps: ['add 1 item', 'apply SAVE10', 'checkout'],
  expected: 'total 36.00', actual: 'total 40.00', build: '4.18.0', environment: 'staging / Chrome 141',
  severity: 'major', priority: 'P1' }).length);
// title is too short to be specific
// title uses vague wording
// add numbered steps to reproduce
// missing expected result
// actual result must describe what happened
// missing build or environment
// check classification: payment/data-loss bug marked low/P4
// 0`,
  },
  quiz: [
    { q: 'The company logo is wrong on the home page the day before a product launch. Best classification?', options: ['High severity, low priority', 'Low severity, high priority', 'High severity, high priority', 'Low severity, low priority'], answer: 1, explanation: 'Cosmetic impact (low severity) but highly visible and time-critical (high priority).' },
    { q: 'What should happen after a developer marks a defect as fixed?', options: ['It is closed automatically', 'The tester retests the scenario and runs related regression checks', 'The product owner reprioritises it', 'It is deferred'], answer: 1, explanation: 'Confirmation testing verifies the fix; regression testing checks nothing nearby broke.' },
    { q: 'Which is the most useful "actual result"?', options: ['It fails', 'Wrong', 'HTTP 500 and the message "Unexpected error" after clicking Save; no record created', 'Not as expected'], answer: 2, explanation: 'A precise, observable description with status codes and messages lets developers locate the cause.' },
    { q: '30 defects found in QA and 10 more found later in UAT and production. What is the leakage from QA?', options: ['10%', '25%', '33%', '75%'], answer: 1, explanation: 'Leakage = 10 / (30 + 10) = 25%.' },
    { q: 'A defect report describes two unrelated symptoms. What should you do?', options: ['Keep one report to save time', 'Split it into two reports and link them if related', 'Close it', 'Mark it duplicate'], answer: 1, explanation: 'One defect per report keeps tracking, assignment and verification clear.' },
  ],
  qna: [
    { q: 'What makes a good bug report?', a: 'A specific, searchable title; minimal numbered steps from a known starting state with exact test data; precise expected and actual results; evidence such as screenshots, recordings, logs and request IDs; full environment details (build, URL, browser/device, OS, account, flags); reproducibility rate; and severity and priority. A developer who has never seen the feature should reproduce it on the first attempt.' },
    { q: 'Explain severity versus priority with examples.', a: 'Severity is the impact of the defect on the system or users; priority is how urgently the business wants it fixed. A crash in an internal report used once a year may be high severity but low priority; a spelling error in the product name on the landing page before launch is low severity but high priority. Testers usually propose severity, while product owners set priority in triage.' },
    { q: 'What do you do with a defect you cannot reproduce anymore?', a: 'Gather the original evidence (build, environment, time, data, logs, request IDs), try on the reported build and the latest build, vary data and timing for intermittent issues, and check server logs and monitoring for the time of the failure. If it still cannot be reproduced, document what was tried and either keep it open with a monitoring note or close it as cannot-reproduce with a clear reopen condition.' },
    { q: 'Which defect metrics are useful and which are dangerous?', a: 'Useful: open defects by severity and age, defect leakage to later phases, reopen rate, defect density per module to spot clusters, and trends over releases. Dangerous: counting bugs per developer or per tester, or rewarding raw bug counts — it encourages splitting, arguing over classification and hiding issues instead of improving quality.' },
  ],
  revision: {
    oneLiner: 'Write reproducible, evidence-backed bug reports, classify severity and priority independently, and use the lifecycle and defect metrics to improve the process.',
    mustKnow: [
      'Report = specific title, minimal steps, data, expected vs actual, evidence, environment.',
      'Severity = impact; priority = urgency; they are independent.',
      'Lifecycle: new → assigned → fixed → retest → closed (or reopened).',
      'Duplicate, rejected, deferred, cannot reproduce are valid outcomes — document them.',
      'Retest the fix and regression-test around it.',
      'Leakage, density, age and reopen rate guide process improvement.',
    ],
    interviewFocus: [
      'Give examples of high severity/low priority and the reverse.',
      'Walk through the defect lifecycle in your last project.',
      'What would you put in a bug report for an intermittent failure?',
    ],
  },
};
