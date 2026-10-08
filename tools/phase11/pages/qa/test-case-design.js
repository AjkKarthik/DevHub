module.exports = {
  slug: 'test-case-design',
  subtitle: 'Black-box techniques that turn a requirement into a small, strong set of test cases: equivalence partitioning, two- and three-value boundary value analysis, decision tables, state transition testing, pairwise combinations and error guessing.',
  readingTime: 24,
  apis: ['Equivalence partitioning', 'Boundary value analysis', 'Decision table', 'State transition', 'Pairwise (all-pairs)', 'Error guessing'],
  tip: 'Write down the partitions and boundaries before writing a single test case. Most missed bugs in reviews are not wrong test cases — they are partitions nobody listed, such as empty input, the value exactly on a limit, or an invalid type.',
  gotchas: [
    'Boundaries exist on both sides of every valid range: an age field valid from 18 to 65 has boundaries at 17/18 and 65/66.',
    'Invalid partitions should be tested one at a time; combining two invalid values in one test hides which validation actually rejected it.',
    'Pairwise testing finds interaction bugs between two parameters; it does not guarantee coverage of three-way interactions.',
  ],
  quickRef: [
    { name: 'Equivalence partitioning (EP)', type: 'keyword', desc: 'Split inputs into classes the system should treat the same; one test per class' },
    { name: 'Valid / invalid partitions', type: 'keyword', desc: 'Test each valid class, and each invalid class on its own' },
    { name: 'Boundary value analysis (BVA)', type: 'keyword', desc: 'Test the edges of ordered partitions, where off-by-one bugs live' },
    { name: '2-value BVA', type: 'keyword', desc: 'Boundary value and its nearest neighbour in the adjacent partition' },
    { name: '3-value BVA', type: 'keyword', desc: 'The boundary plus both neighbours (min-1, min, min+1)' },
    { name: 'Decision table', type: 'keyword', desc: 'Conditions × actions; one rule (column) per combination' },
    { name: 'State transition testing', type: 'keyword', desc: 'States, events, transitions and invalid transitions' },
    { name: 'Pairwise / all-pairs', type: 'keyword', desc: 'Cover every pair of parameter values with far fewer tests than all combinations' },
    { name: 'Error guessing', type: 'keyword', desc: 'Experience-based: nulls, empty, unicode, max length, double submit' },
    { name: 'Test case', type: 'keyword', desc: 'ID, preconditions, steps, test data, expected result, postconditions' },
  ],
  theory: [
    { heading: 'Anatomy of a good test case', points: [
      'A test case has an ID and title, a link to the requirement, preconditions, precise steps, concrete test data, an expected result and (optionally) postconditions or cleanup.',
      'The expected result must be decidable: "the user sees an error" is weak; "the message `Password must be at least 8 characters` appears under the field and the account is not created" is testable.',
      'Each test case should check one condition or a small coherent behaviour, so a failure points at the cause.',
      'Black-box (specification-based) techniques derive tests from requirements without looking at code; white-box techniques (statement, branch coverage) derive them from the code structure; experience-based techniques use tester knowledge.',
    ] },
    { heading: 'Equivalence partitioning and boundary values', points: [
      'Equivalence partitioning divides the input (or output) domain into classes the system should handle identically, then picks one representative per class. If one value in a class works, the others are assumed to work too.',
      'Always include invalid partitions: below the minimum, above the maximum, wrong type, empty, null. Test invalid partitions one at a time, keeping every other input valid.',
      'Boundary value analysis targets the edges of ordered partitions because off-by-one mistakes (`<` instead of `<=`) cluster there. For a valid range 18–65: 2-value BVA tests 17, 18, 65, 66; 3-value BVA tests 17, 18, 19, 64, 65, 66.',
      'Boundaries also apply to lengths (0, 1, max, max+1 characters), collection sizes, dates (end of month, leap day, time zones) and money (0.00, 0.01, maximum transaction).',
    ] },
    { heading: 'Decision tables', points: [
      'Decision tables model business rules with several conditions: list conditions as rows, actions as rows below, and one column (rule) per combination of condition values.',
      'n boolean conditions give up to 2^n rules. Collapse rules whose outcome does not depend on a condition (mark it "–", don\'t care) to reach the minimal set.',
      'Each remaining rule becomes at least one test case. The table also exposes missing or contradictory requirements — a column with no defined action is a question for the product owner.',
    ] },
    { heading: 'State transition testing', points: [
      'Use it when behaviour depends on history: order status, login lockouts, subscriptions, workflows. Model states, events (inputs), transitions and actions.',
      'Coverage levels: every state visited, every valid transition exercised (0-switch coverage), and sequences of two transitions (1-switch coverage) for higher rigour.',
      'Test invalid transitions too: what happens when a shipped order receives "cancel", or a locked account receives a correct password? The state table makes these cells visible.',
    ] },
    { heading: 'Combinations: pairwise and beyond', points: [
      'With several parameters (browser × OS × language × payment method) the full combination count explodes. Pairwise testing covers every pair of values at least once, typically with a tiny fraction of the full set.',
      'Research on real systems shows most interaction defects involve one or two parameters, which is why pairwise is a good default; raise to 3-way for critical areas.',
      'Tools such as PICT or allpairspy generate pairwise sets and support constraints (for example "Safari only on macOS/iOS").',
      'Finish with error guessing and checklists: empty strings, whitespace, very long input, special characters and emoji, leading zeros, copy-pasted data, double clicks, back button, expired sessions.',
    ] },
  ],
  codeTabs: [
    { label: 'EP + BVA generator', language: 'typescript', code: `// Requirement: age must be an integer from 18 to 65 inclusive.
interface Range { min: number; max: number }

function boundaryValues({ min, max }: Range, threeValue = false): number[] {
  const two = [min - 1, min, max, max + 1];
  const three = [min - 1, min, min + 1, max - 1, max, max + 1];
  return threeValue ? three : two;
}

function partitions({ min, max }: Range) {
  return [
    { name: 'below range (invalid)', sample: min - 10, valid: false },
    { name: 'in range (valid)', sample: Math.floor((min + max) / 2), valid: true },
    { name: 'above range (invalid)', sample: max + 10, valid: false },
  ];
}

const age = { min: 18, max: 65 };
console.log('2-value BVA:', boundaryValues(age));        // [17, 18, 65, 66]
console.log('3-value BVA:', boundaryValues(age, true));  // [17, 18, 19, 64, 65, 66]
for (const p of partitions(age)) console.log(p.name, p.sample);

// System under test with a classic off-by-one bug
const isEligible = (a: number) => a > 18 && a <= 65;  // should be >= 18
for (const v of boundaryValues(age)) {
  const expected = v >= age.min && v <= age.max;
  if (isEligible(v) !== expected) console.log('BUG found at', v);
}
// BUG found at 18` },
    { label: 'Decision table', language: 'typescript', code: `// Rule: free shipping if the customer is a member OR the order total >= 50,
// unless the destination is international (never free).
type Rule = { member: boolean; total50: boolean; international: boolean; freeShipping: boolean };

const rules: Rule[] = [];
for (const member of [true, false])
  for (const total50 of [true, false])
    for (const international of [true, false])
      rules.push({ member, total50, international,
        freeShipping: !international && (member || total50) });

console.table(rules);           // 2^3 = 8 rules

// Collapse: when international is true, member and total50 do not matter ("-")
const minimal = [
  { member: '-', total50: '-', international: true,  freeShipping: false },
  { member: true, total50: '-', international: false, freeShipping: true },
  { member: false, total50: true, international: false, freeShipping: true },
  { member: false, total50: false, international: false, freeShipping: false },
];
console.log('minimal rules:', minimal.length); // 4 test cases instead of 8` },
    { label: 'State transitions', language: 'typescript', code: `// Login lockout: 3 consecutive wrong passwords lock the account.
type State = 'Active' | 'Warned1' | 'Warned2' | 'Locked';
type Event = 'wrong' | 'correct' | 'adminUnlock';

const table: Record<State, Partial<Record<Event, State>>> = {
  Active:  { wrong: 'Warned1', correct: 'Active' },
  Warned1: { wrong: 'Warned2', correct: 'Active' },
  Warned2: { wrong: 'Locked',  correct: 'Active' },
  Locked:  { adminUnlock: 'Active' },   // 'correct' and 'wrong' are INVALID here
};

function run(events: Event[], start: State = 'Active'): State {
  return events.reduce<State>((s, e) => {
    const next = table[s][e];
    if (!next) throw new Error(\`invalid transition: \${e} in \${s}\`);
    return next;
  }, start);
}

console.log(run(['wrong', 'wrong', 'correct']));          // Active (counter resets)
console.log(run(['wrong', 'wrong', 'wrong']));            // Locked
try { run(['wrong', 'wrong', 'wrong', 'correct']); }
catch (e) { console.log((e as Error).message); }          // invalid transition: correct in Locked

// 0-switch coverage: every valid transition at least once
const transitions = Object.entries(table).flatMap(([s, ev]) => Object.keys(ev).map(e => \`\${s} --\${e}-->\`));
console.log(transitions.length, 'valid transitions to cover'); // 7` },
    { label: 'Pairwise vs exhaustive', language: 'typescript', code: `// 4 parameters with 3, 3, 2, 2 values -> 36 full combinations.
const params = {
  browser: ['Chrome', 'Firefox', 'Safari'],
  os: ['Windows', 'macOS', 'Linux'],
  locale: ['en', 'de'],
  payment: ['card', 'paypal'],
};

// A greedy all-pairs generator (tools like PICT do this better, with constraints)
type Combo = Record<string, string>;
const keys = Object.keys(params) as (keyof typeof params)[];
const all: Combo[] = keys.reduce<Combo[]>((acc, k) =>
  acc.flatMap(c => params[k].map(v => ({ ...c, [k]: v }))), [{}]);

const pairKey = (c: Combo, a: string, b: string) => \`\${a}=\${c[a]}|\${b}=\${c[b]}\`;
const needed = new Set<string>();
for (const c of all) for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++)
  needed.add(pairKey(c, keys[i], keys[j]));

const chosen: Combo[] = [];
while (needed.size) {
  let best = all[0], bestGain = -1;
  for (const c of all) {
    let gain = 0;
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++)
      if (needed.has(pairKey(c, keys[i], keys[j]))) gain++;
    if (gain > bestGain) { best = c; bestGain = gain; }
  }
  chosen.push(best);
  for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++)
    needed.delete(pairKey(best, keys[i], keys[j]));
}
console.log('exhaustive:', all.length, 'pairwise:', chosen.length); // exhaustive: 36 pairwise: 9` },
  ],
  mistakes: [
    { title: 'Testing only the happy path value', wrong: `TC-01  Enter age 30  -> accepted`, right: `TC-01  age 17  -> rejected  (below boundary)
TC-02  age 18  -> accepted  (lower boundary)
TC-03  age 65  -> accepted  (upper boundary)
TC-04  age 66  -> rejected  (above boundary)
TC-05  age "abc" / empty -> rejected with a validation message`, explanation: 'A single mid-range value cannot catch off-by-one comparisons or missing validation. Cover every partition and both sides of each boundary.' },
    { title: 'Combining several invalid inputs in one test', wrong: `Signup with email "x", password "1", age -5  -> expect an error`, right: `TC-A  invalid email only          -> "Enter a valid email"
TC-B  short password only         -> "Password must be at least 8 characters"
TC-C  negative age only           -> "Age must be 18 or older"`, explanation: 'When several inputs are invalid at once, the first validation masks the others. Isolate each invalid partition with all other fields valid.' },
    { title: 'Vague expected results', wrong: `Expected: system works correctly / error is shown`, right: `Expected: HTTP 422; message "Card expired" shown under the expiry field;
no order is created; the cart still contains 2 items`, explanation: 'An expected result must be specific enough that two testers reach the same pass/fail verdict independently.' },
    { title: 'Ignoring invalid state transitions', wrong: `Tests: Pending -> Paid -> Shipped -> Delivered (happy path only)`, right: `Also test: cancel a Shipped order, pay a Cancelled order,
deliver a Pending order -> each must be rejected with no state change`, explanation: 'Many production bugs come from events arriving in an unexpected state (double clicks, retries, race conditions). State tables make invalid transitions explicit.' },
    { title: 'Writing all combinations by hand', wrong: `5 browsers × 3 OS × 4 locales × 3 payment methods = 180 manual test runs`, right: `Generate a pairwise set (PICT, allpairspy) with constraints:
~20 runs cover every pair; add 3-way coverage only for payment × locale × browser`, explanation: 'Exhaustive combination testing does not scale. Pairwise testing catches most interaction defects at a fraction of the cost.' },
  ],
  challenge: {
    title: 'Generate tests for a discount rule',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Requirement: orders of 100.00 or more get 10% off; orders of 500.00 or more get 15% off; totals must be between 0.01 and 10000.00, otherwise the order is rejected. Write designTests() returning test cases { total, expected } where expected is "reject", 0, 10 or 15, covering every partition and 2-value boundaries with a precision of 0.01. Then check them against discountPercent(), which contains a bug, and print the failing cases.',
    hints: ['Partitions: invalid low, 0%, 10%, 15%, invalid high.', 'Boundaries: 0.00/0.01, 99.99/100.00, 499.99/500.00, 10000.00/10000.01.', 'Work in cents to avoid floating-point surprises.'],
    starterCode: `type Expected = 'reject' | 0 | 10 | 15;

function discountPercent(total: number): Expected {
  if (total <= 0 || total > 10000) return 'reject';
  if (total > 500) return 15;
  if (total >= 100) return 10;
  return 0;
}

function designTests(): { total: number; expected: Expected }[] {
  // TODO
  return [];
}`,
    solution: `type Expected = 'reject' | 0 | 10 | 15;

function discountPercent(total: number): Expected {
  if (total <= 0 || total > 10000) return 'reject';
  if (total > 500) return 15;           // BUG: should be >= 500
  if (total >= 100) return 10;
  return 0;
}

function designTests(): { total: number; expected: Expected }[] {
  const c = (cents: number) => cents / 100;
  return [
    { total: c(0), expected: 'reject' },       // invalid low boundary
    { total: c(1), expected: 0 },               // lowest valid
    { total: c(5000), expected: 0 },            // 0% partition representative
    { total: c(9999), expected: 0 },            // just below 100
    { total: c(10000), expected: 10 },          // 100.00 boundary
    { total: c(30000), expected: 10 },          // 10% representative
    { total: c(49999), expected: 10 },          // just below 500
    { total: c(50000), expected: 15 },          // 500.00 boundary
    { total: c(1000000), expected: 15 },        // 10000.00 upper valid
    { total: c(1000001), expected: 'reject' },  // above max
  ];
}

const failures = designTests().filter(t => discountPercent(t.total) !== t.expected);
for (const f of failures) {
  console.log(\`FAIL total=\${f.total} expected=\${f.expected} actual=\${discountPercent(f.total)}\`);
}
console.log(\`\${designTests().length} tests, \${failures.length} failed\`);
// FAIL total=500 expected=15 actual=10
// 10 tests, 1 failed`,
  },
  quiz: [
    { q: 'A field accepts 1–100. Which set is 2-value boundary value analysis?', options: ['1, 50, 100', '0, 1, 100, 101', '0, 1, 2, 99, 100, 101', '-1, 0, 101, 102'], answer: 1, explanation: '2-value BVA tests each boundary and its closest neighbour in the adjacent partition: 0/1 and 100/101. Adding 2 and 99 gives 3-value BVA.' },
    { q: 'How many rules does a full decision table with 4 boolean conditions have before collapsing?', options: ['4', '8', '16', '32'], answer: 2, explanation: 'Each boolean condition doubles the combinations: 2^4 = 16.' },
    { q: 'Why test invalid partitions one at a time?', options: ['It is faster', 'So one validation failure does not mask another', 'Tools require it', 'Invalid partitions never interact'], answer: 1, explanation: 'If several inputs are invalid, the system may reject on the first check only, leaving the other validations untested.' },
    { q: 'Which technique fits a feature whose behaviour depends on previous events, like an account lockout?', options: ['Equivalence partitioning', 'State transition testing', 'Pairwise testing', 'Statement coverage'], answer: 1, explanation: 'State transition testing models states, events and transitions, including invalid transitions.' },
    { q: 'What does pairwise testing guarantee?', options: ['Every combination of all parameters is tested', 'Every pair of parameter values appears in at least one test', 'Every parameter is tested alone', 'No defects remain'], answer: 1, explanation: 'All-pairs covers every two-way interaction. Three-way and higher interactions may be missed.' },
    { q: 'Which is an experience-based technique?', options: ['Decision tables', 'Boundary value analysis', 'Error guessing', 'Branch coverage'], answer: 2, explanation: 'Error guessing uses tester knowledge of typical failures (empty input, special characters, double submit).' },
  ],
  qna: [
    { q: 'Explain equivalence partitioning and boundary value analysis with an example.', a: 'For a password length rule of 8–64 characters, equivalence partitioning gives three classes: too short (0–7), valid (8–64) and too long (65+), plus invalid types such as empty or null. One representative per class (say 4, 20, 80 characters) covers the classes. Boundary value analysis adds the edges where off-by-one errors occur: 7, 8, 64 and 65 characters (and 9 and 63 with 3-value BVA). Together they give a small set with high defect-finding power.' },
    { q: 'When would you use a decision table instead of boundary values?', a: 'When the behaviour depends on combinations of conditions rather than ranges of one input — for example eligibility for a loan based on income band, credit score status and existing customer flag. A decision table lists every combination as a rule with its expected action, exposes gaps or contradictions in the requirement, and gives a clear minimum set of test cases after collapsing "don\'t care" conditions.' },
    { q: 'How do you design tests for a workflow such as order status?', a: 'Draw a state diagram or state table: states (Pending, Paid, Shipped, Delivered, Cancelled), events (pay, ship, deliver, cancel, refund) and the resulting transitions. Cover every state and every valid transition (0-switch), important sequences (1-switch) and invalid transitions such as cancelling a delivered order. Then add boundary checks for time-based events like payment timeouts.' },
    { q: 'How do you keep the number of combination tests manageable?', a: 'Identify parameters and their values, apply equivalence partitioning to each so values are representatives, add constraints for impossible combinations, and generate a pairwise set with a tool such as PICT. Raise the strength to three-way only for high-risk parameter groups, and complement with risk-based selection of a few full end-to-end combinations that real customers use most.' },
  ],
  revision: {
    oneLiner: 'Partition inputs, test both sides of every boundary, use decision tables for rule combinations, state tables for workflows and pairwise sets for configuration combinations.',
    mustKnow: [
      'Equivalence partitioning: one test per valid and per invalid class.',
      '2-value BVA: boundary + neighbour; 3-value adds the inner neighbour.',
      'Test invalid partitions one at a time.',
      'Decision table: 2^n rules, collapse don\'t-care conditions.',
      'State transitions: cover states, valid transitions and invalid transitions.',
      'Pairwise covers all value pairs with far fewer tests than exhaustive.',
    ],
    interviewFocus: [
      'Design test cases for a login or signup form on the spot.',
      'Explain the difference between 2-value and 3-value BVA.',
      'Show a decision table for a business rule and collapse it.',
    ],
  },
};
