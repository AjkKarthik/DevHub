module.exports = {
  slug: 'functional-testing',
  subtitle: 'Black-box testing of what the system does: deriving positive and negative scenarios from requirements, end-to-end business flows, input validation, data and integration checks, and writing manual test cases that stay useful.',
  readingTime: 20,
  prerequisites: [{ label: 'Test Case Design Techniques', route: '/qa/test-case-design' }],
  apis: ['Positive / negative tests', 'End-to-end scenario', 'Input validation', 'Data verification', 'Integration points', 'Test oracle'],
  tip: 'For every feature, ask three questions: what should happen with good input, what should happen with bad input, and what should happen when something it depends on fails. Most production defects live in the second and third answers.',
  gotchas: [
    'Checking only what the UI shows misses defects: verify the stored data, emails, audit logs and downstream systems too.',
    'Negative tests need an expected result as well — "an error" is not enough; specify which message, status and side effects (none).',
    'Testing with the same seeded account every time hides data-dependent bugs such as long names, special characters or many records.',
  ],
  quickRef: [
    { name: 'Functional testing', type: 'keyword', desc: 'Verifies features against functional requirements (what the system does)' },
    { name: 'Black-box', type: 'keyword', desc: 'Tests derived from specifications, without knowledge of the code' },
    { name: 'Positive test', type: 'keyword', desc: 'Valid input and conditions; the system should succeed' },
    { name: 'Negative test', type: 'keyword', desc: 'Invalid input or conditions; the system should fail gracefully' },
    { name: 'End-to-end (E2E) scenario', type: 'keyword', desc: 'A complete business flow across screens and systems' },
    { name: 'Test oracle', type: 'keyword', desc: 'The source of the expected result: spec, calculation, comparable product' },
    { name: 'Field validation', type: 'keyword', desc: 'Required, type, length, format, range, uniqueness' },
    { name: 'Integration point', type: 'keyword', desc: 'Payment gateway, email, third-party API, message queue' },
    { name: 'Test data', type: 'keyword', desc: 'Specific, realistic, independent data prepared for each test' },
  ],
  theory: [
    { heading: 'What functional testing covers', points: [
      'Functional testing checks that each function behaves as specified: correct outputs for inputs, correct state changes, correct messages and correct interaction with other systems.',
      'It happens at every level — component, integration, system and acceptance — but QA engineers mostly own system-level and end-to-end functional testing.',
      'Sources of expected results (test oracles) include requirements and acceptance criteria, business rules, calculations done independently (a spreadsheet for tax rules), legacy system behaviour and domain experts.',
      'It is distinct from non-functional testing (performance, security, usability), although a single test session often observes both.',
    ] },
    { heading: 'Positive, negative and alternative flows', points: [
      'Positive (happy path) tests prove the main flow works with valid input. They are necessary but find few defects on their own.',
      'Negative tests feed invalid or unexpected input: wrong types, missing required fields, too long values, expired tokens, duplicate submissions, unauthorised roles. The expected result is graceful handling — clear message, no partial data, no crash.',
      'Alternative flows are valid but less common paths: guest checkout, editing an order before payment, paying with a saved card, cancelling midway.',
      'Exception flows cover dependency failures: the payment gateway times out, the email service is down, the database is read-only. Use stubs or fault injection in test environments to trigger them.',
    ] },
    { heading: 'Verifying beyond the screen', points: [
      'Check persisted data: the database row, the status, timestamps and amounts — through an admin screen, API or a read-only SQL query.',
      'Check side effects: emails and notifications sent (use a test mailbox such as Mailpit), events published, audit logs written, files generated, caches invalidated.',
      'Check integrations: requests sent to third parties with the right payload (via sandbox dashboards or request logs), and correct handling of their responses.',
      'Check that failures leave no trace: a rejected order must not reserve stock or charge the card.',
    ] },
    { heading: 'Writing maintainable manual test cases', points: [
      'Keep steps at the level of user intent ("add any in-stock item to the cart") unless the exact item matters, so cases survive UI changes.',
      'Separate test data from steps and reference it by name; the same case can then run with several data sets.',
      'One objective per test case, with preconditions that set up state explicitly (or a reusable "precondition" case).',
      'Mark cases with priority and requirement IDs so they can be selected for smoke, regression or risk-based runs, and flag good candidates for automation.',
    ] },
  ],
  codeTabs: [
    { label: 'Scenario matrix', language: 'typescript', code: `// Feature: transfer money between own accounts
interface Scenario { id: string; type: 'positive' | 'negative' | 'alternative' | 'exception'; given: string; expect: string }

const scenarios: Scenario[] = [
  { id: 'F1', type: 'positive', given: 'transfer 100.00 from checking (500.00) to savings', expect: 'balances 400.00 / +100.00, confirmation shown, audit entry' },
  { id: 'F2', type: 'negative', given: 'transfer 600.00 from checking (500.00)', expect: '"Insufficient funds", no balance change' },
  { id: 'F3', type: 'negative', given: 'amount 0.00 or -5', expect: 'validation message, transfer button disabled' },
  { id: 'F4', type: 'negative', given: 'same source and target account', expect: '"Choose a different account"' },
  { id: 'F5', type: 'alternative', given: 'schedule transfer for tomorrow', expect: 'pending transfer listed, balance unchanged today' },
  { id: 'F6', type: 'exception', given: 'core banking API times out', expect: 'user told to retry, no double debit when retried' },
  { id: 'F7', type: 'negative', given: 'double-click "Confirm"', expect: 'exactly one transfer created' },
];

const byType = scenarios.reduce<Record<string, number>>((m, s) => ({ ...m, [s.type]: (m[s.type] ?? 0) + 1 }), {});
console.log(byType);
console.log('negative + exception share:',
  (((byType.negative ?? 0) + (byType.exception ?? 0)) / scenarios.length * 100).toFixed(0) + '%');` },
    { label: 'Manual test case', language: 'yaml', code: `id: TC-TRF-002
title: Transfer rejected when amount exceeds available balance
requirement: REQ-TRF-4
priority: high
preconditions:
  - user "qa_bank_03" logged in
  - checking balance 500.00, savings balance 1000.00
data:
  amount: 600.00
steps:
  1. Open "Transfer between my accounts"
  2. Select From: Checking, To: Savings
  3. Enter amount {amount} and click "Continue"
expected:
  - message "Insufficient funds. Available: 500.00" under the amount field
  - "Confirm" is not offered
  - balances unchanged (checking 500.00, savings 1000.00) after page reload
  - no transfer record in Activity
automation_candidate: yes (API level + one UI check)` },
    { label: 'Verify data, not just UI', language: 'sql', code: `-- After TC-TRF-001 (transfer 100.00) verify persistence and side effects
SELECT id, from_account, to_account, amount, status, created_at
FROM transfers
WHERE customer_id = 'qa_bank_03'
ORDER BY created_at DESC
LIMIT 1;
-- expect: amount = 100.00, status = 'COMPLETED'

SELECT account_id, balance FROM accounts WHERE customer_id = 'qa_bank_03';
-- expect: checking 400.00, savings 1100.00

SELECT event_type FROM audit_log
WHERE entity_id = (SELECT id FROM transfers WHERE customer_id = 'qa_bank_03'
                   ORDER BY created_at DESC LIMIT 1);
-- expect: TRANSFER_CREATED, TRANSFER_COMPLETED` },
  ],
  mistakes: [
    { title: 'Only testing the happy path', wrong: `TC-1 valid login -> dashboard
TC-2 valid transfer -> success`, right: `Add: wrong password, locked account, expired session,
insufficient funds, zero/negative amount, double submit, gateway timeout`, explanation: 'Happy paths are usually exercised by developers already. Negative, alternative and exception flows are where functional defects concentrate.' },
    { title: 'Trusting the success message', wrong: `Expected: "Transfer complete" toast is displayed.`, right: `Expected: toast shown AND balances updated AND transfer record = COMPLETED
AND confirmation email received AND audit entry written`, explanation: 'The UI can show success while the backend failed or did something extra. Verify the real outcome where it is stored.' },
    { title: 'Brittle, click-level steps', wrong: `1. Click the 3rd button in the left menu
2. Click the blue button at the bottom right`, right: `1. Open "Transfers" from the main menu
2. Click "Continue"`, explanation: 'Steps tied to layout break on every redesign. Describe controls by their visible names and the user intent.' },
    { title: 'Shared, reused test data', wrong: `All testers use account demo@example.com; balances change unpredictably.`, right: `Each tester/run creates or resets its own accounts via an API or seed script;
data sets include long names, unicode and edge amounts.`, explanation: 'Shared data causes false failures and hides data-dependent bugs. Independent, deliberate test data makes results reliable.' },
  ],
  challenge: {
    title: 'Generate negative cases for a form',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Given a field specification { name, required, type: "text" | "email" | "number", minLength?, maxLength?, min?, max? }, write negativeCases(field) that returns a list of { input, reason } invalid inputs: empty (if required), too short/too long strings (one character beyond each limit), wrong format for email, non-numeric and out-of-range values for numbers. Print the cases for an email field and an age field.',
    hints: ['Build strings with "a".repeat(n).', 'For numbers produce min - 1, max + 1 and a non-numeric string.', 'Only add a case when the corresponding rule exists.'],
    starterCode: `interface Field { name: string; required: boolean; type: 'text' | 'email' | 'number';
  minLength?: number; maxLength?: number; min?: number; max?: number }

function negativeCases(f: Field): { input: string; reason: string }[] {
  return []; // TODO
}`,
    solution: `interface Field { name: string; required: boolean; type: 'text' | 'email' | 'number';
  minLength?: number; maxLength?: number; min?: number; max?: number }

function negativeCases(f: Field): { input: string; reason: string }[] {
  const cases: { input: string; reason: string }[] = [];
  if (f.required) cases.push({ input: '', reason: 'required field left empty' });
  if (f.type !== 'number') {
    if (f.minLength) cases.push({ input: 'a'.repeat(f.minLength - 1), reason: \`shorter than \${f.minLength}\` });
    if (f.maxLength) cases.push({ input: 'a'.repeat(f.maxLength + 1), reason: \`longer than \${f.maxLength}\` });
  }
  if (f.type === 'email') {
    cases.push({ input: 'ada.example.com', reason: 'missing @' });
    cases.push({ input: 'ada@', reason: 'missing domain' });
  }
  if (f.type === 'number') {
    cases.push({ input: 'abc', reason: 'not a number' });
    if (f.min !== undefined) cases.push({ input: String(f.min - 1), reason: \`below \${f.min}\` });
    if (f.max !== undefined) cases.push({ input: String(f.max + 1), reason: \`above \${f.max}\` });
  }
  return cases;
}

const email: Field = { name: 'email', required: true, type: 'email', maxLength: 254 };
const age: Field = { name: 'age', required: false, type: 'number', min: 18, max: 120 };
for (const f of [email, age]) {
  for (const c of negativeCases(f)) console.log(f.name, '|', c.input.length > 20 ? c.input.slice(0, 10) + '...' : c.input, '|', c.reason);
}
// email |  | required field left empty
// email | aaaaaaaaaa... | longer than 254
// email | ada.example.com | missing @
// email | ada@ | missing domain
// age | abc | not a number
// age | 17 | below 18
// age | 121 | above 120`,
  },
  quiz: [
    { q: 'Which is a negative test for a transfer feature?', options: ['Transfer 50.00 with sufficient balance', 'Transfer more than the available balance', 'Schedule a transfer for tomorrow', 'View transfer history'], answer: 1, explanation: 'Negative tests use invalid input or conditions and check graceful handling.' },
    { q: 'What is a test oracle?', options: ['A test automation tool', 'The source used to determine the expected result', 'A database', 'A test manager'], answer: 1, explanation: 'Oracles include specifications, independent calculations, previous versions or domain experts.' },
    { q: 'After a successful order, which check adds the most confidence beyond the confirmation page?', options: ['Taking a screenshot', 'Verifying the stored order, stock reservation and confirmation email', 'Refreshing the page', 'Checking the page title'], answer: 1, explanation: 'Functional correctness includes persisted data and side effects, not only what the UI displays.' },
    { q: 'The payment gateway times out during checkout. This scenario is a...', options: ['Positive flow', 'Exception flow', 'Usability test', 'Smoke test'], answer: 1, explanation: 'Exception flows cover failures of dependencies and the system\'s recovery behaviour.' },
    { q: 'Why describe steps by user intent rather than exact clicks?', options: ['Shorter documents', 'Cases remain valid after UI layout changes', 'Tools require it', 'It hides defects'], answer: 1, explanation: 'Intent-level steps are robust to redesigns while still being reproducible.' },
  ],
  qna: [
    { q: 'How do you derive functional test cases from a user story?', a: 'Read the acceptance criteria and business rules, identify inputs, outputs and state changes, then apply design techniques: equivalence partitions and boundaries for inputs, decision tables for rule combinations, state transitions for workflows. Add negative cases per validation rule, alternative flows, exception flows for each dependency, and authorisation cases per role. Prioritise by risk and link each case to the story.' },
    { q: 'What is the difference between functional and non-functional testing?', a: 'Functional testing checks what the system does — features, rules, data handling — against functional requirements. Non-functional testing checks how well it does it — performance, security, usability, accessibility, reliability, compatibility. Both are needed: a correct checkout that takes 20 seconds or exposes card data still fails.' },
    { q: 'How do you test functionality that depends on a third-party service?', a: 'Use the provider sandbox for realistic happy paths, and stubs or service virtualisation (WireMock, Mockoon, the provider\'s test cards) to trigger declines, timeouts, malformed responses and rate limits. Verify the request payload sent, the handling of every response type, idempotency on retries, and that failures leave no inconsistent data.' },
  ],
  revision: {
    oneLiner: 'Functional testing verifies what the system does through positive, negative, alternative and exception flows — checking stored data and side effects, not only the screen.',
    mustKnow: [
      'Black-box tests derived from requirements and rules.',
      'Positive, negative, alternative and exception flows.',
      'Every negative test needs a specific expected result.',
      'Verify persisted data, emails, events, audit logs and integrations.',
      'Independent, realistic test data per run.',
      'Intent-level steps survive UI changes.',
    ],
    interviewFocus: [
      'Design functional tests for a login, transfer or checkout feature.',
      'Explain how you test failures of external dependencies.',
      'How do you verify results beyond the UI?',
    ],
  },
};
