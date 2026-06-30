import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-mutation-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            QuizBlockComponent, QnaBlockComponent],
  templateUrl: './mutation-testing.html',
  styleUrl: './mutation-testing.scss',
})
export class MutationTesting {
  quickRef: QuickRefItem[] = [
    { name: 'Mutant',          type: 'keyword',  desc: 'A copy of your code with a small deliberate change (e.g. > changed to >=).' },
    { name: 'Killed mutant',   type: 'keyword',  desc: 'A mutant that caused at least one test to fail — good, your tests caught the change.' },
    { name: 'Survived mutant', type: 'keyword',  desc: 'A mutant that passed all tests — your test suite missed this code change.' },
    { name: 'Mutation score',  type: 'keyword',  desc: 'killed / (killed + survived) × 100 — higher is better; aim for 70–85%.' },
    { name: 'Stryker',         type: 'keyword',  desc: 'Leading mutation testing framework for JavaScript/TypeScript. Also Stryker.NET for C#.' },
    { name: 'Equivalent mutant',type:'keyword',  desc: 'A mutation that does not change observable behaviour — cannot be killed; ignore these.' },
    { name: 'stryker.config.js',type:'keyword',  desc: 'Stryker configuration: mutate globs, thresholds, reporters, test runner.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'What Mutation Testing Measures', points: [
      'Code coverage tells you which lines ran during tests — not whether the tests would catch a bug.',
      'Mutation testing answers: "if I break this code, do the tests fail?"',
      'Stryker creates hundreds of mutants (changed copies of your code) and runs your suite against each.',
      'If a mutant is killed (tests fail), your suite is effective. If it survives, the tests are weak.',
      'Mutation score is a better quality metric than line coverage alone.',
    ]},
    { heading: 'Common Mutator Types', points: [
      'ArithmeticOperator: + → -, * → / etc.',
      'ConditionalExpression: true → false, existing condition → true/false.',
      'EqualityOperator: === → !==, > → >=, < → <=.',
      'LogicalOperator: && → ||, || → &&.',
      'StringLiteral: replace string with empty string.',
      'ArrayDeclaration: replace initializer with empty array [].',
    ]},
    { heading: 'Interpreting Results', points: [
      'Killed: good — your tests detected the change.',
      'Survived: add or strengthen a test that explicitly asserts the mutated line\'s behaviour.',
      'Timeout: mutant created an infinite loop — counts as killed (harmless).',
      'No coverage: the mutant was never even executed — fix code coverage first.',
      'Equivalent: genuinely cannot affect output — Stryker lets you mark these to ignore.',
    ]},
    { heading: 'Stryker.NET for C#', points: [
      'dotnet tool install -g dotnet-stryker — runs on top of xUnit/NUnit/MSTest.',
      'Config in stryker-config.json — same concepts: mutators, thresholds, reporters.',
      'Dashboard reporter integrates with the Stryker Dashboard at dashboard.stryker-mutator.io.',
      'Run per project: dotnet stryker --project MyProject.csproj.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Stryker Setup (JS/TS)', language: 'typescript', code:
`# Install
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner

# Initialise config
npx stryker init

# Run
npx stryker run` },
    { label: 'stryker.config.js', language: 'typescript', code:
`// stryker.config.js
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: 'npm',
  reporters:      ['html', 'clear-text', 'progress'],
  testRunner:     'jest',
  coverageAnalysis: 'perTest',

  // Only mutate source files, not tests
  mutate: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
  ],

  // Pass/warn/break thresholds
  thresholds: {
    high:   80,   // score ≥ 80 → green
    low:    60,   // score 60–79 → yellow
    break:  50,   // score < 50 → exit code 1 (fail CI)
  },

  // Specific mutators to enable/disable
  mutator: {
    excludedMutations: ['StringLiteral'],  // too many equivalent mutants in this project
  },
};` },
    { label: 'Understanding Output', language: 'typescript', code:
`# Stryker HTML report summary
Mutation score: 73.12% (goal: 80%)

All mutants: 412
  ✓ Killed:     301  (73.1%)
  ✗ Survived:    89  (21.6%)
  ⏱ Timeout:      8  (1.9%)
  - No coverage: 14  (3.4%)

# Example survived mutant — Stryker shows you the diff:
# src/cart/discount.ts line 12
# Original:  if (total > 100) {
# Mutant:    if (total >= 100) {
# → No test asserts behaviour exactly AT the boundary (total === 100)

# Fix: add a boundary test
test('applies discount when total is exactly 100', () => {
  expect(applyDiscount(100)).toBe(10);   // now kills the >= mutant
});` },
    { label: 'Stryker.NET (C#)', language: 'csharp', code:
`// Install
dotnet tool install -g dotnet-stryker

// stryker-config.json
{
  "stryker-config": {
    "project": "MyLib/MyLib.csproj",
    "test-projects": [ "MyLib.Tests/MyLib.Tests.csproj" ],
    "reporters": [ "html", "progress" ],
    "threshold-high": 80,
    "threshold-low":  60,
    "threshold-break": 50,
    "mutate": [ "src/**/*.cs", "!src/**/Migrations/*.cs" ]
  }
}

// Run
dotnet stryker --config-file stryker-config.json

// Typical HTML report opens automatically in browser
// Review survived mutants and add targeted tests` },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does a "survived" mutant tell you?', options: ['Your tests passed — everything is fine', 'A code change was not detected by any test — your test suite has a gap here', 'The mutant was an equivalent mutation', 'Stryker could not parse the file'], answer: 1, explanation: 'A survived mutant means Stryker changed your code (e.g. flipped > to >=) and all your tests still passed. This indicates your tests do not verify the specific behaviour that was mutated — you need a stronger or more targeted test.' },
    { q: 'Why is mutation score a better quality metric than line coverage?', options: ['Mutation score is easier to calculate', 'Line coverage only measures which code ran — not whether the tests would catch a bug in that code', 'Mutation testing runs faster', 'Line coverage requires 100% to be meaningful'], answer: 1, explanation: 'You can achieve 100% line coverage with assertions like expect(true).toBe(true) — the lines ran but the tests would not catch bugs. Mutation score checks whether your tests actually detect changes to logic.' },
    { q: 'What should you do when a mutant is "equivalent"?', options: ['Add a test to kill it', 'Delete the production code line', 'Mark it as ignored — it cannot change observable behaviour and cannot be killed', 'It means your test runner is broken'], answer: 2, explanation: 'An equivalent mutant is one where the mutated code produces the same observable output as the original (e.g. i++ vs ++i in a context where the return value is discarded). No test can kill it because the behaviour is identical. Stryker lets you mark these with a comment to exclude them from the score.' },
    { q: 'What is the difference between a "killed" mutant and a "timeout" mutant?', options: ['They are the same outcome reported differently', 'A killed mutant means a test failed against it (good); a timeout mutant means the mutated code caused an infinite loop or excessive runtime, also counted as killed since the original behavior changed detectably', 'A timeout mutant always indicates a bug in the test runner', 'Killed mutants count against your score; timeout mutants do not'], answer: 1, explanation: 'A mutant is "killed" when at least one test fails after the mutation is applied — proving the test suite detects that change. A "timeout" mutant occurs when the mutation causes the code to hang (e.g., flipping a loop\'s exit condition to never be true) — Stryker treats this as killed too, since the mutated behavior is clearly different from the original, just manifesting as a hang rather than a failed assertion.' },
    { q: 'Why does mutation testing typically run in CI on a schedule rather than on every single commit?', options: ['Mutation testing requires a paid license incompatible with most CI providers', 'Running the full test suite once per mutant across the whole codebase is computationally expensive, often taking far longer than a normal CI run', 'Mutation testing only works with specific cloud providers', 'It produces non-deterministic results that vary commit to commit'], answer: 1, explanation: 'Because mutation testing reruns relevant tests for every single mutant generated (potentially thousands across a real codebase), full-project mutation testing can take significantly longer than a normal test run. Most teams run a fast, scoped mutation check on changed files only during PR CI, reserving full-codebase mutation testing for a nightly or weekly scheduled job where longer runtimes are acceptable.' },
    { q: 'What types of mutations does a typical mutation testing tool like Stryker apply to source code?', options: ['Only renaming variables to confuse the reader', 'Operator mutations (> to >=), boundary mutations, conditional negation, literal value changes, and removing statements entirely', 'Only adding comments to the code', 'Converting the entire codebase to a different programming language'], answer: 1, explanation: 'Mutation tools apply a catalog of small, targeted code transformations: arithmetic/comparison operator swaps (> to >=, + to -), boundary value changes (incrementing/decrementing literals), conditional negation (flipping if/else logic), removing method calls or statements entirely, and string/literal value substitutions. Each mutation represents a plausible real-world bug pattern, which is why a test suite that kills most mutants is meaningfully more trustworthy than one that does not.' },
  ];

  qna: QnaItem[] = [
    { q: 'How long does mutation testing take?', a: 'Potentially hours on a large project — Stryker runs your entire test suite once per mutant. Mitigate with: coverageAnalysis: "perTest" (only runs tests that cover the mutated line), --mutate on a specific file or changed files only in CI, and running full mutation testing nightly rather than on every commit.' },
    { q: 'What mutation score should I target?', a: '70–85% is a healthy target for most projects. Below 60% indicates significant gaps. 100% is rarely achievable (equivalent mutants exist) and chasing it can lead to over-testing trivial code. Focus on killing survived mutants in business-critical paths first.' },
    { q: 'Can I run Stryker only on changed files in a PR?', a: 'Yes — use --mutate "$(git diff --name-only origin/main HEAD | grep .ts$)" to restrict mutation to files changed in the PR. This makes CI fast and still catches regressions in the modified code. Run full mutation testing on a schedule (nightly) for the whole codebase.' },
    { q: 'How does mutation testing differ from fuzz testing, since both involve automated test generation?', a: 'Mutation testing modifies your PRODUCTION code (introducing small, deliberate bugs) and checks whether your EXISTING tests catch the change — it evaluates the quality of tests you already have. Fuzz testing generates random or semi-random INPUT data to feed into your code, looking for crashes, exceptions, or invariant violations — it tests the robustness of the code itself against unexpected input, not the quality of an existing test suite. They are complementary: mutation testing improves confidence in your test suite; fuzzing finds bugs your test suite never thought to check for.' },
    { q: 'Should mutation testing replace code coverage reporting entirely?', a: 'No — they answer different questions and work well together. Coverage tells you WHICH lines executed during tests (a necessary but not sufficient condition for good tests). Mutation score tells you whether the tests that DID run would actually catch a real bug in that code. Use coverage as a fast, cheap first filter to find completely untested code, then use mutation testing on the covered code to verify the tests are actually meaningful rather than just exercising the lines without real assertions.' },
    { q: 'What is a practical strategy for introducing mutation testing into a legacy codebase with low existing test quality?', a: 'Do not attempt to mutation-test the entire legacy codebase at once — the initial mutation score will likely be very low and overwhelming, producing thousands of survived mutants with no clear prioritization. Instead, scope mutation testing to new and recently-changed files only (similar to incremental coverage requirements), gradually improving test quality for code that is actively being touched, while leaving untouched legacy code unmeasured until it too needs modification — this avoids a large, demoralizing backlog while still raising the bar going forward.' },
  ];
}
