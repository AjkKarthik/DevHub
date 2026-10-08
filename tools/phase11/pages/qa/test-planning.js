module.exports = {
  slug: 'test-planning',
  subtitle: 'Decide what to test, how much and when: test strategy vs test plan, scope, approach, entry and exit criteria, risk-based prioritisation, estimation techniques, and keeping the plan alive in Agile teams.',
  readingTime: 22,
  prerequisites: [{ label: 'QA Fundamentals & SDLC/STLC', route: '/qa/qa-fundamentals' }],
  apis: ['Test strategy', 'Test plan (IEEE 829 / ISO 29119-3)', 'Entry & exit criteria', 'Risk = likelihood × impact', 'Three-point estimation', 'Test approach'],
  tip: 'A test plan is a communication tool, not a document to file. If stakeholders cannot answer "what is out of scope?" and "what risks remain at release?" after reading it, the plan has failed whatever its length.',
  gotchas: [
    'Exit criteria that nobody can measure ("sufficient testing done") cannot stop a risky release. Use countable criteria.',
    'Out-of-scope items must be written down explicitly; silence is read as "covered".',
    'A risk register that is never updated after kickoff is decoration — re-score risks when requirements or architecture change.',
  ],
  quickRef: [
    { name: 'Test strategy', type: 'keyword', desc: 'Organisation- or product-level approach: levels, types, tools, standards' },
    { name: 'Test plan', type: 'keyword', desc: 'Project/release level: scope, approach, schedule, resources, risks, criteria' },
    { name: 'Scope (in / out)', type: 'keyword', desc: 'Features and quality characteristics that will and will not be tested' },
    { name: 'Entry criteria', type: 'keyword', desc: 'Conditions that must hold before a test activity starts' },
    { name: 'Exit criteria', type: 'keyword', desc: 'Measurable conditions to finish a test activity (definition of done)' },
    { name: 'Product risk', type: 'keyword', desc: 'Risk to the product quality, e.g. payment double charge' },
    { name: 'Project risk', type: 'keyword', desc: 'Risk to the testing project, e.g. late environment, staff shortage' },
    { name: 'Risk score = likelihood × impact', type: 'keyword', desc: 'Prioritises test depth and order' },
    { name: 'Three-point estimate (E = (O + 4M + P) / 6)', type: 'keyword', desc: 'PERT-weighted estimate from optimistic, most likely, pessimistic' },
    { name: 'Suspension / resumption criteria', type: 'keyword', desc: 'When to pause testing (e.g. blocking defect) and when to restart' },
  ],
  theory: [
    { heading: 'Strategy versus plan', points: [
      'A test strategy describes the general approach for a product or organisation: which test levels and types apply, automation approach, environments, tools, defect management and standards. It changes rarely.',
      'A test plan applies that strategy to a specific release or project: what is in and out of scope, schedule, people, environments, risks, deliverables and entry/exit criteria.',
      'Standard templates (IEEE 829, now ISO/IEC/IEEE 29119-3) list sections such as test items, features to test, approach, pass/fail criteria, suspension criteria, deliverables, responsibilities and risks. Use them as a checklist, not as a form to fill blindly.',
      'In Agile teams the "plan" is often lightweight: a one-page test approach per epic, acceptance criteria per story, and the definition of done — but the same questions still need answers.',
    ] },
    { heading: 'Scope and approach', points: [
      'Scope lists features, integrations and quality characteristics (functionality, performance, security, accessibility, compatibility) in scope, and explicitly what is out of scope and why.',
      'The approach states test levels, which techniques apply to which areas, manual vs automated split, test data strategy, environments and how defects are managed.',
      'Include the support matrix (browsers, devices, OS versions, locales), third-party dependencies and what will be stubbed or mocked.',
      'List assumptions and dependencies — environment availability dates, test data from another team, stable builds — because many plans fail on these rather than on testing itself.',
    ] },
    { heading: 'Entry, exit and suspension criteria', points: [
      'Entry criteria prevent wasted effort: for example, build deployed, smoke test passed, test data available, requirements signed off for the scope.',
      'Exit criteria define done in measurable terms: planned tests executed (e.g. 100% of high priority, 90% overall), no open critical/high defects, coverage of all high-risk requirements, performance targets met.',
      'Suspension criteria say when to stop testing (a blocker that breaks most tests, an unstable environment) and resumption criteria say what must be fixed before continuing.',
      'When exit criteria are not met, stakeholders may accept the risk explicitly — record the waiver, the open defects and the residual risk in the test summary.',
    ] },
    { heading: 'Risk-based testing', points: [
      'Identify product risks with stakeholders: what could go wrong, for whom, and how badly. Typical high risks: money movement, security, data loss, legal/compliance, high-traffic paths.',
      'Score each risk by likelihood (complexity, change frequency, team experience, defect history) and impact (financial, reputational, safety, number of users affected).',
      'Higher scores get earlier, deeper and more varied testing; low scores may get only smoke or exploratory coverage. Communicate the remaining (residual) risk at release.',
      'Project risks (staff, schedule, tool or environment problems) are tracked separately and handled with mitigation and contingency plans.',
    ] },
    { heading: 'Estimation', points: [
      'Techniques: work breakdown (estimate each task), analogy with similar past releases, metrics-based (test cases × average execution time) and three-point PERT estimates for uncertain tasks.',
      'Three-point: E = (O + 4M + P) / 6 with standard deviation ≈ (P − O) / 6. It makes uncertainty visible instead of hiding it in a single number.',
      'Remember work that is easy to forget: test data preparation, environment issues, defect retesting and regression cycles, reporting and reviews. Retest/regression is often 20–40% of execution effort.',
      'In Scrum, testing effort is part of story points; the team, not QA alone, estimates and owns it.',
    ] },
  ],
  codeTabs: [
    { label: 'Risk register', language: 'typescript', code: `type Level = 1 | 2 | 3 | 4 | 5;
interface Risk { id: string; area: string; likelihood: Level; impact: Level }

const risks: Risk[] = [
  { id: 'R1', area: 'Card payment double charge', likelihood: 2, impact: 5 },
  { id: 'R2', area: 'Search relevance',           likelihood: 4, impact: 2 },
  { id: 'R3', area: 'Password reset email',       likelihood: 3, impact: 4 },
  { id: 'R4', area: 'Profile avatar upload',      likelihood: 3, impact: 1 },
  { id: 'R5', area: 'GDPR data export',           likelihood: 2, impact: 4 },
];

// Plain scores can under-rate rare catastrophes, so many teams add an override:
// any impact-5 risk gets extensive testing regardless of likelihood.
const depth = (score: number, impact: Level) =>
  impact === 5 || score >= 12 ? 'extensive: scripted + exploratory + automated regression'
  : score >= 8 ? 'thorough: scripted cases on all partitions'
  : score >= 4 ? 'standard: key scenarios'
  : 'light: smoke / exploratory only';

risks
  .map(r => ({ ...r, score: r.likelihood * r.impact }))
  .sort((a, b) => b.score - a.score)
  .forEach(r => console.log(\`\${r.id} \${String(r.score).padStart(2)} \${r.area.padEnd(28)} \${depth(r.score, r.impact)}\`));
// R1 is ranked below R3 by score but still gets extensive testing via the impact override` },
    { label: 'Three-point estimate', language: 'typescript', code: `interface Task { name: string; o: number; m: number; p: number } // hours

const tasks: Task[] = [
  { name: 'Test design',        o: 16, m: 24, p: 40 },
  { name: 'Test data setup',    o: 4,  m: 8,  p: 20 },
  { name: 'Execution cycle 1',  o: 24, m: 32, p: 56 },
  { name: 'Retest + regression',o: 8,  m: 16, p: 32 },
  { name: 'Reporting',          o: 2,  m: 4,  p: 6 },
];

let total = 0, variance = 0;
for (const t of tasks) {
  const e = (t.o + 4 * t.m + t.p) / 6;
  const sd = (t.p - t.o) / 6;
  total += e; variance += sd * sd;
  console.log(\`\${t.name.padEnd(20)} E=\${e.toFixed(1)}h  sd=\${sd.toFixed(1)}\`);
}
const sd = Math.sqrt(variance);
console.log(\`Total \${total.toFixed(1)}h, ~84% confidence <= \${(total + sd).toFixed(1)}h\`);` },
    { label: 'One-page test plan', language: 'yaml', code: `release: "Checkout v2 (2026-Q4)"
scope:
  in:  [cart, promo codes, card + PayPal payment, order confirmation email]
  out: [loyalty points (unchanged), admin refunds (next release)]
  quality: [functional, accessibility WCAG 2.2 AA, performance p95 < 800 ms, security basics]
approach:
  levels: [API tests (automated), UI end-to-end (critical paths), exploratory sessions]
  techniques: [boundary values on totals, decision table for promos, state model for order status]
  environments: [staging with payment sandbox]
  matrix: [Chrome, Firefox, Safari latest; iOS 18 Safari; Android 15 Chrome]
entry_criteria:
  - build on staging, smoke suite green
  - payment sandbox credentials available
exit_criteria:
  - 100% high-priority tests executed and passed
  - no open critical/high defects; mediums triaged
  - p95 checkout latency < 800 ms at 200 concurrent users
suspension: blocker defect preventing checkout for all users
risks:
  - {id: R1, risk: double charge on retry, mitigation: idempotency tests + payment logs review}
  - {id: P1, risk: sandbox outages, mitigation: stub provider for non-payment tests}` },
  ],
  mistakes: [
    { title: 'Unmeasurable exit criteria', wrong: `Exit criteria: testing is sufficiently complete and quality is acceptable.`, right: `Exit criteria:
- 100% of P1 test cases executed, 0 failing
- 0 open critical/high defects; all mediums triaged
- every high-risk requirement covered by at least one passing test`, explanation: 'Vague criteria cannot be checked, so they never stop a release. Use numbers and named conditions everyone can verify.' },
    { title: 'No explicit out-of-scope section', wrong: `Scope: test the new checkout.`, right: `In scope: cart, promo codes, card/PayPal, confirmation email
Out of scope: loyalty points (unchanged), refunds (next release), IE11`, explanation: 'Stakeholders assume anything not excluded is tested. Writing exclusions down — with reasons — avoids false confidence and arguments after release.' },
    { title: 'Spreading test effort evenly', wrong: `Every feature gets 10 test cases and the same regression depth.`, right: `Score risks (likelihood × impact):
payment & auth -> deep + automated; avatar upload -> smoke only`, explanation: 'Equal effort over-tests trivial areas and under-tests critical ones. Risk-based testing puts depth where failure hurts most.' },
    { title: 'Estimating execution only', wrong: `Estimate = 200 test cases × 10 minutes = 33 hours`, right: `Estimate = design + data + environment checks + execution
         + defect retests + regression cycles + reporting (+ buffer for unknowns)`, explanation: 'Retesting fixes and regression often add a third or more to execution effort. Estimates that ignore them are consistently late.' },
  ],
  challenge: {
    title: 'Check exit criteria automatically',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Write evaluateExit(stats) that returns { ready: boolean, reasons: string[] } for these exit criteria: at least 95% of planned tests executed, pass rate of executed tests at least 98%, zero open critical or high defects, and every high-risk requirement covered. Return one human-readable reason per failed criterion.',
    hints: ['executed / planned for execution rate; passed / executed for pass rate.', 'Collect reasons in an array; ready is reasons.length === 0.', 'Format percentages with toFixed(1).'],
    starterCode: `interface Stats {
  planned: number; executed: number; passed: number;
  openDefects: { critical: number; high: number; medium: number };
  highRiskRequirements: string[]; coveredRequirements: string[];
}

function evaluateExit(s: Stats): { ready: boolean; reasons: string[] } {
  // TODO
  return { ready: false, reasons: [] };
}`,
    solution: `interface Stats {
  planned: number; executed: number; passed: number;
  openDefects: { critical: number; high: number; medium: number };
  highRiskRequirements: string[]; coveredRequirements: string[];
}

function evaluateExit(s: Stats): { ready: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const execRate = (s.executed / s.planned) * 100;
  const passRate = s.executed ? (s.passed / s.executed) * 100 : 0;
  if (execRate < 95) reasons.push(\`only \${execRate.toFixed(1)}% of planned tests executed (need 95%)\`);
  if (passRate < 98) reasons.push(\`pass rate \${passRate.toFixed(1)}% is below 98%\`);
  const blocking = s.openDefects.critical + s.openDefects.high;
  if (blocking > 0) reasons.push(\`\${blocking} open critical/high defect(s)\`);
  const uncovered = s.highRiskRequirements.filter(r => !s.coveredRequirements.includes(r));
  if (uncovered.length) reasons.push(\`high-risk requirements without coverage: \${uncovered.join(', ')}\`);
  return { ready: reasons.length === 0, reasons };
}

const result = evaluateExit({
  planned: 400, executed: 372, passed: 368,
  openDefects: { critical: 0, high: 1, medium: 7 },
  highRiskRequirements: ['REQ-PAY-1', 'REQ-PAY-2', 'REQ-AUTH-3'],
  coveredRequirements: ['REQ-PAY-1', 'REQ-AUTH-3'],
});
console.log(result.ready);
result.reasons.forEach(r => console.log('-', r));
// false
// - only 93.0% of planned tests executed (need 95%)
// - 1 open critical/high defect(s)
// - high-risk requirements without coverage: REQ-PAY-2`,
  },
  quiz: [
    { q: 'What is the main difference between a test strategy and a test plan?', options: ['They are identical', 'The strategy is the general approach for a product or organisation; the plan applies it to a specific release with scope, schedule and criteria', 'The plan is written by developers', 'The strategy lists test cases'], answer: 1, explanation: 'Strategy is long-lived and general; the plan is specific to a project or release.' },
    { q: 'Which is a good exit criterion?', options: ['Testers feel confident', 'All bugs fixed', 'No open critical or high defects and 100% of priority-1 tests passed', 'Testing time is used up'], answer: 2, explanation: 'Exit criteria must be measurable and agreed. "All bugs fixed" is usually unrealistic; severity-based thresholds are common.' },
    { q: 'A risk with likelihood 4 and impact 5 on a 1–5 scale scores...', options: ['9', '20', '1.25', '45'], answer: 1, explanation: 'Risk score = likelihood × impact = 20 — a high priority for early and deep testing.' },
    { q: 'Using three-point estimation with O=4, M=6, P=14 hours, the expected effort is...', options: ['6 h', '7 h', '8 h', '24 h'], answer: 1, explanation: 'E = (4 + 4×6 + 14) / 6 = 42 / 6 = 7 hours.' },
    { q: '"The staging environment may not be ready until two days before release" is a...', options: ['Product risk', 'Project risk', 'Defect', 'Exit criterion'], answer: 1, explanation: 'It threatens the testing project (schedule, resources), not the quality of the product itself.' },
  ],
  qna: [
    { q: 'What goes into a test plan?', a: 'Scope (what is in and out, including quality characteristics), test approach (levels, types, techniques, automation, test data), environments and support matrix, schedule and milestones, roles and responsibilities, entry/exit/suspension criteria, deliverables (test cases, reports), product and project risks with mitigation, assumptions and dependencies, and how defects and changes are managed.' },
    { q: 'How do you do risk-based testing in practice?', a: 'Run a short risk workshop with product, development and operations, list what could fail and its consequences, score likelihood and impact, and agree a test depth per risk band. Plan high-risk areas first and with multiple techniques, track coverage per risk, re-score when things change, and report residual risk at release — what is untested or failing and how serious that is.' },
    { q: 'What do you do when exit criteria are not met near the release date?', a: 'Report facts early: which criteria are unmet, which defects are open and what the user impact is. Offer options — fix and retest the blockers, release with a feature flag off, release with known issues and a workaround, or delay. The release decision belongs to the business; QA makes the risk visible and records any waiver.' },
    { q: 'How do you estimate testing effort for a new feature?', a: 'Break the work into tasks (analysis, test design, data, environment, execution, retest and regression, automation, reporting), estimate each with analogy or three-point estimation, add known overheads and a buffer for uncertainty, and validate against historical data from similar features. In Scrum, estimate together with the team as part of the story so testing is not an afterthought.' },
  ],
  revision: {
    oneLiner: 'Plan testing around risk: define scope in and out, approach, measurable entry/exit criteria and realistic estimates, and keep the plan updated.',
    mustKnow: [
      'Strategy = general approach; plan = specific release.',
      'Write out-of-scope explicitly.',
      'Entry, exit, suspension and resumption criteria must be measurable.',
      'Risk score = likelihood × impact; product vs project risk.',
      'Three-point estimate E = (O + 4M + P) / 6.',
      'Include retest and regression effort in estimates.',
    ],
    interviewFocus: [
      'Outline a test plan for a feature you know.',
      'Explain risk-based testing and residual risk.',
      'What happens when exit criteria are not met?',
    ],
  },
};
