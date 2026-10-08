module.exports = {
  slug: 'qa-fundamentals',
  subtitle: 'What quality assurance actually is: QA vs QC vs testing, verification vs validation, the seven testing principles, where testing sits in Waterfall, V-model and Agile SDLCs, and the phases of the software testing lifecycle (STLC).',
  readingTime: 20,
  apis: ['QA vs QC vs testing', 'Verification vs validation', 'Seven testing principles', 'STLC phases', 'Static vs dynamic testing', 'Shift-left'],
  tip: 'When someone says "QA will catch it", reframe: testing finds defects, but quality is built by the whole team through clear requirements, reviews and fast feedback. QA engineers make quality visible and improve the process that produces it.',
  gotchas: [
    '"Exhaustive testing" is impossible for any real system — prioritise by risk instead of trying to test every input.',
    'A test pass rate of 100% does not mean the product is good; it means the tests that exist passed (absence-of-errors fallacy).',
    'Verification (did we build it right?) and validation (did we build the right thing?) are different questions; a feature can pass every spec check and still fail users.',
  ],
  quickRef: [
    { name: 'Quality Assurance (QA)', type: 'keyword', desc: 'Process-oriented: prevent defects by improving how software is built' },
    { name: 'Quality Control (QC)', type: 'keyword', desc: 'Product-oriented: detect defects in what was built' },
    { name: 'Testing', type: 'keyword', desc: 'Activities that evaluate a product to find defects and give confidence (part of QC)' },
    { name: 'Error → Defect → Failure', type: 'keyword', desc: 'A human mistake introduces a defect in code, which may cause a visible failure' },
    { name: 'Verification', type: 'keyword', desc: '"Are we building the product right?" — conformance to specs (reviews, tests)' },
    { name: 'Validation', type: 'keyword', desc: '"Are we building the right product?" — fit for user needs (UAT, usability)' },
    { name: 'Static testing', type: 'keyword', desc: 'Examining work products without running code: reviews, walkthroughs, static analysis' },
    { name: 'Dynamic testing', type: 'keyword', desc: 'Executing the software and comparing actual with expected results' },
    { name: 'STLC', type: 'keyword', desc: 'Requirement analysis → planning → design → environment → execution → closure' },
    { name: 'Shift-left / shift-right', type: 'keyword', desc: 'Test earlier in the lifecycle / learn from production monitoring' },
  ],
  theory: [
    { heading: 'QA, QC and testing', points: [
      'Quality assurance is about the process: defining standards, reviews, definitions of done and feedback loops so fewer defects are created in the first place.',
      'Quality control is about the product: inspecting and testing what was built to detect defects before users do. Testing is the main QC activity.',
      'A human error (a misunderstood requirement, a typo) introduces a defect (bug, fault) into a work product; when the defective code runs under certain conditions it produces a failure. Not every defect causes a failure, and failures can also come from the environment.',
      'Testing has several objectives: find defects, build confidence, provide information for release decisions, prevent defects (through early reviews) and verify compliance with contracts or regulations.',
    ] },
    { heading: 'The seven testing principles (ISTQB)', points: [
      'Testing shows the presence of defects, not their absence — no amount of passing tests proves correctness.',
      'Exhaustive testing is impossible — use risk and prioritisation to choose what to test.',
      'Early testing saves time and money — a defect found in a requirements review costs far less than one found in production (shift-left).',
      'Defects cluster together — a small number of modules usually contains most defects; focus effort there.',
      'Tests wear out (the "pesticide paradox") — repeating the same tests finds fewer new defects, so tests must be reviewed and new ones added.',
      'Testing is context dependent — a banking app, a game and a medical device need different approaches.',
      'Absence-of-errors is a fallacy — a defect-free system that does not meet user needs is still a failure.',
    ] },
    { heading: 'Testing in different SDLC models', points: [
      'Waterfall runs phases in sequence with testing near the end, so defects in requirements surface late and are expensive to fix.',
      'The V-model pairs each development phase with a test level: requirements ↔ acceptance testing, system design ↔ system testing, architecture ↔ integration testing, detailed design ↔ unit (component) testing. Test design starts as soon as each development artefact exists.',
      'Iterative and Agile models (Scrum, Kanban) deliver small increments; testing is continuous inside each iteration, testers work with developers and product owners from refinement onwards, and automation provides fast regression feedback.',
      'DevOps extends this with continuous integration and delivery: automated checks in pipelines, plus shift-right practices such as monitoring, canary releases and A/B tests in production.',
    ] },
    { heading: 'The software testing lifecycle (STLC)', points: [
      'Requirement analysis: study requirements for testability, ask questions, identify what can be tested and at which level.',
      'Test planning: define scope, approach, resources, schedule, risks, entry and exit criteria — documented in a test plan.',
      'Test design (analysis and design): derive test conditions and test cases using design techniques, prepare test data and the traceability matrix.',
      'Test environment setup: prepare hardware, software, data and access; run a smoke test to confirm the environment is usable.',
      'Test execution: run tests, compare actual with expected results, log defects, retest fixes and run regression tests.',
      'Test closure: check exit criteria, report results and metrics, archive testware and hold a retrospective on lessons learned.',
    ] },
    { heading: 'Test levels and types', points: [
      'Test levels describe what is tested: component (unit), integration, system and acceptance testing (UAT, operational, contractual, alpha/beta).',
      'Test types describe why: functional (what the system does), non-functional (how well: performance, security, usability, accessibility), white-box (based on structure) and change-related (confirmation testing of fixes and regression testing).',
      'Any test type can appear at any level — for example, performance testing of a single component or of the whole system.',
      'A QA engineer usually owns system-level and end-to-end quality, collaborates on integration testing, and advises on acceptance criteria and unit-test coverage written by developers.',
    ] },
  ],
  codeTabs: [
    { label: 'Defect cost model', language: 'typescript', code: `// A simple illustration of why early testing pays off.
// Relative fix-cost multipliers are commonly cited rules of thumb, not exact constants.
type Phase = 'requirements' | 'design' | 'coding' | 'system test' | 'production';

const relativeCost: Record<Phase, number> = {
  requirements: 1, design: 3, coding: 5, 'system test': 15, production: 50,
};

function costOfDefects(found: Partial<Record<Phase, number>>, baseHours = 1): number {
  return (Object.entries(found) as [Phase, number][])
    .reduce((sum, [phase, count]) => sum + count * relativeCost[phase] * baseHours, 0);
}

// The same 20 defects, found early vs late
const shiftLeft = { requirements: 8, design: 4, coding: 6, 'system test': 2 };
const lateTesting = { coding: 2, 'system test': 12, production: 6 };

console.log('shift-left hours:', costOfDefects(shiftLeft));   // 8 + 12 + 30 + 30 = 80
console.log('late testing hours:', costOfDefects(lateTesting)); // 10 + 180 + 300 = 490` },
    { label: 'STLC checklist', language: 'bash', code: `# STLC phase            Key outputs                                   Exit signal
# --------------------  --------------------------------------------  -----------------------------------
# Requirement analysis  Questions log, testable requirements list     Ambiguities resolved or logged
# Test planning         Test plan, risk register, estimates           Plan reviewed and approved
# Test design           Test cases, test data, traceability matrix    Every requirement mapped to tests
# Environment setup     Ready environment, accounts, seeded data      Smoke test passes on the build
# Test execution        Results, defect reports, regression runs      Exit criteria met (or waiver)
# Test closure          Summary report, metrics, lessons learned      Sign-off, testware archived

# Example entry criteria for test execution
#  - build deployed to QA environment and smoke test green
#  - test cases for the sprint scope reviewed
#  - no open blocker defects from the previous build

# Example exit criteria
#  - 100% of planned high-priority tests executed
#  - no open critical or high severity defects
#  - all medium defects triaged with an agreed fix or deferral` },
    { label: 'V-model mapping', language: 'typescript', code: `// Each development phase has a matching test level whose tests can be designed early.
const vModel = [
  { develop: 'Business requirements', test: 'Acceptance testing', designedFrom: 'user needs, acceptance criteria' },
  { develop: 'System requirements',   test: 'System testing',     designedFrom: 'functional + non-functional specs' },
  { develop: 'Architecture design',   test: 'Integration testing', designedFrom: 'interfaces between components' },
  { develop: 'Detailed design',       test: 'Component testing',  designedFrom: 'module design, code' },
];

for (const row of vModel) {
  console.log(\`\${row.develop.padEnd(22)} <-> \${row.test.padEnd(20)} (from \${row.designedFrom})\`);
}` },
  ],
  mistakes: [
    { title: 'Treating QA as a phase at the end', wrong: `Sprint plan:
  Days 1-8  developers build features
  Days 9-10 "QA phase": testers receive everything at once`, right: `Sprint plan:
  Refinement  testers review stories, add acceptance criteria and risks
  Daily       features tested as soon as they are done; bugs fixed in-sprint
  Continuous  automated regression runs on every merge`, explanation: 'Testing squeezed into the last days becomes a bottleneck and finds requirement problems too late. Involving QA from refinement onwards prevents defects and spreads the work.' },
    { title: 'Equating "all tests pass" with "good quality"', wrong: `Release report: 412/412 tests passed -> quality is excellent, ship it`, right: `Release report:
  412/412 planned tests passed
  Coverage: 38 of 40 requirements (2 untested: export, audit log)
  Open defects: 0 critical, 3 medium (deferred with PO approval)
  Residual risk: payment provider timeout behaviour not tested`, explanation: 'Testing shows the presence of defects, not their absence. Report what was and was not tested and the remaining risk, so stakeholders make an informed decision.' },
    { title: 'Running the same regression suite forever', wrong: `The same 200 manual regression cases have run every release for two years.
They pass every time, while production bugs come from new areas.`, right: `Review the suite each release:
  - retire tests for removed or low-risk features
  - add tests for recent production defects and new features
  - rotate exploratory sessions into high-change areas`, explanation: 'The pesticide paradox: unchanged tests stop finding new defects. Keep the suite aligned with current risk.' },
    { title: 'Confusing verification with validation', wrong: `"The feature matches the spec exactly, so users will be happy."`, right: `Verification: does it match the spec? (reviews, system tests)
Validation:   does it solve the user problem? (UAT, usability tests, beta feedback)`, explanation: 'A product can satisfy every documented requirement and still be wrong for users if the requirement itself was wrong. Plan validation activities explicitly.' },
  ],
  challenge: {
    title: 'Classify the STLC artefacts',
    language: 'typescript',
    playgroundUrl: 'https://www.typescriptlang.org/play',
    description: 'Write classify(artifact: string) that returns the STLC phase producing it: "requirement analysis", "test planning", "test design", "environment setup", "test execution" or "test closure". Use a lookup table of keywords (for example "plan", "risk", "estimate" → test planning; "test case", "traceability", "test data" → test design; "defect", "result", "retest" → test execution; "summary report", "lessons learned", "metrics" → test closure; "smoke", "environment" → environment setup; "question", "testability" → requirement analysis). Return "unknown" if nothing matches.',
    hints: ['Lowercase the input first.', 'Check more specific phrases (like "summary report") before short ones.', 'An array of [keywords, phase] pairs keeps the order explicit.'],
    starterCode: `type StlcPhase = 'requirement analysis' | 'test planning' | 'test design'
  | 'environment setup' | 'test execution' | 'test closure' | 'unknown';

function classify(artifact: string): StlcPhase {
  // TODO
  return 'unknown';
}

console.log(classify('Traceability matrix'));`,
    solution: `type StlcPhase = 'requirement analysis' | 'test planning' | 'test design'
  | 'environment setup' | 'test execution' | 'test closure' | 'unknown';

const RULES: [string[], StlcPhase][] = [
  [['summary report', 'lessons learned', 'metrics'], 'test closure'],
  [['test case', 'traceability', 'test data'], 'test design'],
  [['plan', 'risk', 'estimate'], 'test planning'],
  [['defect', 'result', 'retest', 'regression run'], 'test execution'],
  [['smoke', 'environment'], 'environment setup'],
  [['question', 'testability'], 'requirement analysis'],
];

function classify(artifact: string): StlcPhase {
  const a = artifact.toLowerCase();
  for (const [keywords, phase] of RULES) {
    if (keywords.some(k => a.includes(k))) return phase;
  }
  return 'unknown';
}

for (const item of ['Traceability matrix', 'Risk register', 'Defect report #42',
                    'Test summary report', 'Smoke test log', 'Testability questions', 'Team photo']) {
  console.log(item, '->', classify(item));
}
// Traceability matrix -> test design
// Risk register -> test planning
// Defect report #42 -> test execution
// Test summary report -> test closure
// Smoke test log -> environment setup
// Testability questions -> requirement analysis
// Team photo -> unknown`,
  },
  quiz: [
    { q: 'Which statement best describes the difference between QA and QC?', options: ['QA is manual, QC is automated', 'QA improves the process to prevent defects; QC inspects the product to detect them', 'They are synonyms', 'QC happens before development, QA after'], answer: 1, explanation: 'Quality assurance is process-oriented and preventive; quality control is product-oriented and detective. Testing is part of QC.' },
    { q: 'A spec-compliant feature that users cannot use effectively passed which activity but failed which?', options: ['Validation passed, verification failed', 'Verification passed, validation failed', 'Both passed', 'Neither applies'], answer: 1, explanation: 'Verification checks conformance to specifications; validation checks the product meets real user needs.' },
    { q: 'Which testing principle explains why an unchanged regression suite finds fewer new bugs over time?', options: ['Defect clustering', 'Pesticide paradox (tests wear out)', 'Early testing', 'Context dependence'], answer: 1, explanation: 'Repeating the same tests stops finding new defects; tests must be reviewed and new ones added.' },
    { q: 'In the V-model, which test level corresponds to the system requirements specification?', options: ['Component testing', 'Integration testing', 'System testing', 'Acceptance testing'], answer: 2, explanation: 'System requirements map to system testing; business requirements map to acceptance testing.' },
    { q: 'Which STLC phase produces the requirements traceability matrix?', options: ['Test planning', 'Test design', 'Test execution', 'Test closure'], answer: 1, explanation: 'During test design, test conditions and cases are derived and mapped to requirements in the traceability matrix.' },
    { q: 'A code review that finds an off-by-one error before execution is an example of...', options: ['Dynamic testing', 'Static testing', 'Regression testing', 'Acceptance testing'], answer: 1, explanation: 'Static testing examines work products (code, requirements, designs) without executing them.' },
  ],
  qna: [
    { q: 'What is the difference between QA, QC and testing?', a: 'QA is a set of process activities that aim to prevent defects — standards, reviews, definitions of done, process improvements. QC is product-focused and aims to detect defects in what has been built. Testing is the main QC activity: executing (dynamic) or examining (static) the product to find defects and provide information about quality. In practice a QA engineer does both: tests the product and improves the process.' },
    { q: 'Explain the seven testing principles with an example of each in practice.', a: 'Testing shows presence not absence of defects (report residual risk, not "bug-free"); exhaustive testing is impossible (choose tests by risk); early testing saves money (review requirements in refinement); defects cluster (spend more time on the module with most past bugs); the pesticide paradox (refresh the regression suite); testing is context dependent (a medical device needs formal traceability, a prototype does not); and the absence-of-errors fallacy (validate with real users, not only specs).' },
    { q: 'What are the phases of the STLC and what are their deliverables?', a: 'Requirement analysis (questions, testable requirements list), test planning (test plan, risks, estimates, entry/exit criteria), test design (test cases, test data, traceability matrix), environment setup (configured environment, smoke test), test execution (results, defect reports, retests and regression runs) and test closure (summary report, metrics, lessons learned, archived testware).' },
    { q: 'What is the difference between an error, a defect and a failure?', a: 'An error is a human mistake, such as misreading a requirement. It can introduce a defect — a flaw in a work product such as code or a specification. When defective code is executed under certain conditions it may produce a failure: an observable deviation from expected behaviour. Not every defect leads to a failure, and environmental issues (bad configuration, hardware faults) can cause failures without a code defect.' },
    { q: 'What does shift-left mean for a QA engineer day to day?', a: 'Getting involved before code exists: reviewing stories and acceptance criteria in refinement, asking "how will we test this?", identifying risks and test data needs, pairing with developers on unit and API tests, and running checks in CI so feedback arrives in minutes. It is complemented by shift-right: learning from production monitoring, logs and user feedback.' },
  ],
  revision: {
    oneLiner: 'QA improves the process, QC and testing evaluate the product; follow the STLC, apply the seven principles and test early and by risk.',
    mustKnow: [
      'QA = process/prevention; QC = product/detection; testing is part of QC.',
      'Error → defect → failure.',
      'Verification = built right; validation = right product.',
      'Seven principles: presence not absence, no exhaustive testing, early testing, clustering, pesticide paradox, context, absence-of-errors fallacy.',
      'STLC: requirement analysis, planning, design, environment, execution, closure.',
      'V-model pairs each development phase with a test level.',
    ],
    interviewFocus: [
      'Explain QA vs QC vs testing with examples.',
      'Walk through the STLC and its deliverables.',
      'Give a real example of shifting testing left.',
    ],
  },
};
