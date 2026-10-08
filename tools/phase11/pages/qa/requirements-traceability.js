module.exports = {
  slug: 'requirements-traceability',
  subtitle: 'Find defects before code exists: review requirements for testability, turn them into acceptance criteria, and keep a requirements traceability matrix (RTM) that links each requirement to tests, results and defects in both directions.',
  readingTime: 20,
  prerequisites: [{ label: 'Test Case Design Techniques', route: '/qa/test-case-design' }],
  apis: ['Testable requirement', 'Acceptance criteria', 'Given / When / Then', 'Forward traceability', 'Backward traceability', 'RTM coverage'],
  tip: 'In refinement, ask for one concrete example per rule ("what exactly happens for a 499.99 order?"). Examples expose ambiguity faster than any review checklist and become your first test cases.',
  gotchas: [
    'Words like "fast", "user-friendly", "secure" or "etc." are not testable until they are quantified or listed.',
    'A requirement with no linked test is a coverage gap; a test with no linked requirement may be testing something nobody asked for — or a missing requirement.',
    'An RTM maintained by hand in a spreadsheet goes stale within weeks. Link tests to requirement IDs in the tool where tests live.',
  ],
  quickRef: [
    { name: 'Functional requirement', type: 'keyword', desc: 'What the system must do (e.g. send a reset email)' },
    { name: 'Non-functional requirement', type: 'keyword', desc: 'How well it must do it (performance, security, usability, accessibility)' },
    { name: 'Testability', type: 'keyword', desc: 'Clear, unambiguous, measurable, consistent, feasible' },
    { name: 'Acceptance criteria', type: 'keyword', desc: 'Conditions a story must satisfy to be accepted' },
    { name: 'Given / When / Then', type: 'syntax', desc: 'Scenario format for examples (context, action, outcome)' },
    { name: 'Static testing (review)', type: 'keyword', desc: 'Informal review, walkthrough, technical review, inspection' },
    { name: 'RTM', type: 'keyword', desc: 'Requirements traceability matrix linking requirements, tests, results, defects' },
    { name: 'Forward traceability', type: 'keyword', desc: 'Requirement → test cases (is everything tested?)' },
    { name: 'Backward traceability', type: 'keyword', desc: 'Test case → requirement (why does this test exist?)' },
    { name: 'Bidirectional traceability', type: 'keyword', desc: 'Both directions; needed for impact analysis and audits' },
  ],
  theory: [
    { heading: 'What makes a requirement testable', points: [
      'A testable requirement is unambiguous (one interpretation), complete (covers errors and edge cases), consistent (no contradictions), measurable (a pass/fail decision is possible) and feasible.',
      'Rewrite vague words into numbers or lists: "the page loads fast" becomes "the search results page reaches Largest Contentful Paint within 2.5 s at the 75th percentile on a mid-range phone".',
      'Every rule needs its negative and boundary cases spelled out: what happens on invalid input, at the limit, when a dependency is down, for an unauthorised user.',
      'Non-functional requirements (performance, security, accessibility, compatibility) are frequently forgotten. Ask for them explicitly; they drive environments, tools and effort.',
    ] },
    { heading: 'Reviewing requirements (static testing)', points: [
      'Static testing finds defects in work products without executing code. Requirement defects found in a review are among the cheapest to fix.',
      'Review types range from informal (a quick read-through or pair review) through walkthroughs (author leads) and technical reviews (peers) to formal inspections with roles, entry/exit criteria and defect logs.',
      'A checklist helps: ambiguous terms, missing error handling, undefined data formats, conflicting rules, missing roles/permissions, missing non-functional targets, unclear dependencies.',
      'In Agile teams, the "three amigos" (product owner, developer, tester) review each story before development, agree acceptance criteria and capture examples.',
    ] },
    { heading: 'Acceptance criteria and examples', points: [
      'Acceptance criteria are the conditions a story must meet to be accepted. Write them as rules ("password must be 12–64 characters") or as scenarios.',
      'Scenario style uses Given (context) / When (action) / Then (observable outcome). Concrete examples with real values reveal edge cases and double as test cases or automated BDD specifications.',
      'Good criteria describe behaviour, not implementation ("the user sees an error and stays on the form", not "the frontend validates with a regex").',
      'Keep criteria small and independent; if a story needs fifteen criteria it is probably several stories.',
    ] },
    { heading: 'The requirements traceability matrix', points: [
      'An RTM links each requirement ID to its test cases, execution status and related defects. Forward traceability shows whether every requirement is tested; backward traceability shows why each test exists.',
      'It enables impact analysis: when a requirement changes, you know exactly which tests to update and rerun.',
      'Coverage reports from the RTM tell stakeholders which requirements are untested, failing or blocked — far more useful than a raw count of passed tests.',
      'Regulated domains (medical, automotive, aviation, finance) often require documented bidirectional traceability for audits. Test management tools (Jira with Xray/Zephyr, TestRail, Azure Test Plans) maintain it automatically when tests are linked to requirement IDs.',
    ] },
  ],
  codeTabs: [
    { label: 'Vague vs testable', language: 'yaml', code: `# Vague requirement
- id: REQ-12
  text: "Password reset should be secure and fast."

# Testable rewrite (agreed with the product owner)
- id: REQ-12.1
  text: "A reset link is emailed within 60 seconds of a valid request."
- id: REQ-12.2
  text: "The reset link expires 30 minutes after it is sent and can be used once."
- id: REQ-12.3
  text: "For an unknown email the UI shows the same confirmation message as for a known one."
- id: REQ-12.4
  text: "More than 5 reset requests per email per hour are rejected with HTTP 429."` },
    { label: 'Acceptance criteria (Gherkin)', language: 'gherkin', code: `Feature: Password reset

  Scenario: Reset link expires after 30 minutes
    Given a reset link was sent to "ada@example.com" at 10:00
    When the user opens the link at 10:31
    Then the page says "This link has expired"
    And the user can request a new link

  Scenario: Same message for unknown emails
    When a reset is requested for "nobody@example.com"
    Then the confirmation "If an account exists, we sent an email" is shown
    And no email is sent

  Scenario Outline: Rate limit on reset requests
    Given <count> reset requests for "ada@example.com" in the last hour
    When another reset is requested
    Then the response status is <status>

    Examples:
      | count | status |
      | 4     | 200    |
      | 5     | 429    |` },
    { label: 'RTM coverage report', language: 'typescript', code: `interface TestCase { id: string; requirements: string[]; status: 'pass' | 'fail' | 'blocked' | 'not run' }

const requirements = ['REQ-12.1', 'REQ-12.2', 'REQ-12.3', 'REQ-12.4', 'REQ-13'];
const tests: TestCase[] = [
  { id: 'TC-101', requirements: ['REQ-12.1'], status: 'pass' },
  { id: 'TC-102', requirements: ['REQ-12.2'], status: 'fail' },
  { id: 'TC-103', requirements: ['REQ-12.2'], status: 'pass' },
  { id: 'TC-104', requirements: ['REQ-12.3'], status: 'not run' },
  { id: 'TC-199', requirements: [], status: 'pass' },               // orphan test
];

// Forward: requirement -> tests
for (const req of requirements) {
  const linked = tests.filter(t => t.requirements.includes(req));
  const verdict = linked.length === 0 ? 'NOT COVERED'
    : linked.some(t => t.status === 'fail') ? 'FAILING'
    : linked.every(t => t.status === 'pass') ? 'covered + passing'
    : 'covered, incomplete';
  console.log(req.padEnd(9), linked.map(t => t.id).join(',').padEnd(15), verdict);
}
// Backward: tests that trace to no requirement
console.log('orphan tests:', tests.filter(t => t.requirements.length === 0).map(t => t.id).join(', ')); // TC-199` },
  ],
  mistakes: [
    { title: 'Accepting untestable wording', wrong: `REQ: "The dashboard should load quickly for all users."`, right: `REQ: "The dashboard renders its first chart within 2 s (p95)
for an account with 10,000 transactions, on the staging environment."`, explanation: 'You cannot pass or fail "quickly". Push back during review until the requirement states a measurable target, conditions and scope.' },
    { title: 'Writing acceptance criteria about implementation', wrong: `AC: The React component calls validateEmail() with a regex.`, right: `AC: Given an email without "@", when the user submits,
then "Enter a valid email" is shown and no account is created.`, explanation: 'Criteria describe observable behaviour. Implementation-specific criteria break on refactoring and do not tell the tester what the user should experience.' },
    { title: 'Measuring progress by passed tests only', wrong: `Status: 480 of 500 tests passed (96%).`, right: `Status by requirement:
  42 covered + passing, 3 failing (REQ-31, REQ-40, REQ-41),
  2 not covered (REQ-50 export, REQ-51 audit log)`, explanation: 'Many tests can pass while a critical requirement has no tests at all. Requirement-based coverage from the RTM shows real gaps.' },
    { title: 'Letting the RTM drift from reality', wrong: `RTM.xlsx last updated at project kickoff; tests renamed and requirements changed since.`, right: `Requirement IDs are linked from each test case in the test management tool;
the coverage report is generated from those links on every run.`, explanation: 'A manually maintained matrix becomes fiction quickly. Generate traceability from links that are part of the normal workflow.' },
  ],
  challenge: {
    title: 'Find coverage gaps and impact',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Given requirements and test cases (each linking to one or more requirement IDs), write two functions: gaps(reqs, tests) returning requirement IDs with no linked test, and impacted(changedReq, tests) returning the test IDs to rerun when a requirement changes. Print both for the sample data.',
    hints: ['A Set of all linked requirement IDs makes gaps() a simple filter.', 'impacted is a filter on tests whose requirements include the changed ID.', 'Sort results for stable output.'],
    starterCode: `interface TestCase { id: string; requirements: string[] }

function gaps(reqs: string[], tests: TestCase[]): string[] {
  return []; // TODO
}

function impacted(changedReq: string, tests: TestCase[]): string[] {
  return []; // TODO
}`,
    solution: `interface TestCase { id: string; requirements: string[] }

function gaps(reqs: string[], tests: TestCase[]): string[] {
  const linked = new Set(tests.flatMap(t => t.requirements));
  return reqs.filter(r => !linked.has(r)).sort();
}

function impacted(changedReq: string, tests: TestCase[]): string[] {
  return tests.filter(t => t.requirements.includes(changedReq)).map(t => t.id).sort();
}

const reqs = ['REQ-1', 'REQ-2', 'REQ-3', 'REQ-4'];
const tests: TestCase[] = [
  { id: 'TC-3', requirements: ['REQ-1', 'REQ-2'] },
  { id: 'TC-1', requirements: ['REQ-1'] },
  { id: 'TC-2', requirements: ['REQ-2'] },
];
console.log('gaps:', gaps(reqs, tests).join(', '));                 // gaps: REQ-3, REQ-4
console.log('rerun for REQ-1:', impacted('REQ-1', tests).join(', ')); // rerun for REQ-1: TC-1, TC-3`,
  },
  quiz: [
    { q: 'Which requirement is testable?', options: ['The app should be user friendly', 'Search returns results within 1 second at p95 for 10,000 products', 'Payments must be secure', 'The UI should look modern'], answer: 1, explanation: 'Only the second states a measurable target and conditions, so a test can pass or fail it objectively.' },
    { q: 'Backward traceability answers which question?', options: ['Is every requirement tested?', 'Which requirement does this test exist for?', 'Who wrote the requirement?', 'When was the test last run?'], answer: 1, explanation: 'Backward traceability goes from test to requirement; forward goes from requirement to tests.' },
    { q: 'Reviewing a requirements document without running code is an example of...', options: ['Dynamic testing', 'Static testing', 'Regression testing', 'Smoke testing'], answer: 1, explanation: 'Static testing examines work products such as requirements, designs and code without executing them.' },
    { q: 'In Given/When/Then, the "Then" part describes...', options: ['Preconditions', 'The user action', 'The observable expected outcome', 'The test data source'], answer: 2, explanation: 'Given sets the context, When is the action, Then is the expected, observable result.' },
    { q: 'A requirement changes. What does the RTM let you do immediately?', options: ['Delete all tests', 'Identify which test cases to update and rerun (impact analysis)', 'Estimate the release date', 'Close all defects'], answer: 1, explanation: 'Tests linked to the changed requirement are exactly the ones affected.' },
  ],
  qna: [
    { q: 'How do you review a requirement for testability?', a: 'Check that each statement has one interpretation, measurable targets instead of adjectives, defined behaviour for invalid input and edge cases, clear roles and permissions, data formats, dependencies and non-functional expectations. Ask for concrete examples of each rule, log open questions with the product owner, and convert the agreed examples into acceptance criteria and first test cases.' },
    { q: 'What is a requirements traceability matrix and why is it useful?', a: 'It is a mapping from requirement IDs to test cases, their latest results and related defects. Forward traceability proves every requirement is tested; backward traceability explains why each test exists; together they enable impact analysis when requirements change, coverage reporting by requirement instead of by test count, and audit evidence in regulated industries.' },
    { q: 'What is the role of a tester in story refinement?', a: 'To ask "how will we know this works?": challenge vague wording, propose examples and edge cases, identify risks, test data and environment needs, and help write acceptance criteria so the team shares one understanding before coding starts. This prevents defects rather than finding them later.' },
    { q: 'What is the difference between acceptance criteria and a definition of done?', a: 'Acceptance criteria are specific to one story and describe the behaviour that story must have. The definition of done applies to every story and lists the quality steps the team always completes — code reviewed, tests automated and passing, documentation updated, deployed to staging, no open high-severity defects.' },
  ],
  revision: {
    oneLiner: 'Test requirements before code: make them measurable, capture acceptance criteria as examples, and trace requirements to tests both ways.',
    mustKnow: [
      'Testable = unambiguous, complete, consistent, measurable, feasible.',
      'Requirement reviews are static testing and find the cheapest defects.',
      'Acceptance criteria describe behaviour; Given/When/Then for examples.',
      'Forward traceability: requirement → tests; backward: test → requirement.',
      'RTM enables coverage reporting and impact analysis.',
      'Generate traceability from tool links, not a stale spreadsheet.',
    ],
    interviewFocus: [
      'Rewrite a vague requirement into testable form.',
      'Explain the RTM and how you use it for impact analysis.',
      'Describe your role in refinement / three amigos sessions.',
    ],
  },
};
