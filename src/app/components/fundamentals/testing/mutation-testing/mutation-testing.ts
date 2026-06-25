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
  ];

  qna: QnaItem[] = [
    { q: 'How long does mutation testing take?', a: 'Potentially hours on a large project — Stryker runs your entire test suite once per mutant. Mitigate with: coverageAnalysis: "perTest" (only runs tests that cover the mutated line), --mutate on a specific file or changed files only in CI, and running full mutation testing nightly rather than on every commit.' },
    { q: 'What mutation score should I target?', a: '70–85% is a healthy target for most projects. Below 60% indicates significant gaps. 100% is rarely achievable (equivalent mutants exist) and chasing it can lead to over-testing trivial code. Focus on killing survived mutants in business-critical paths first.' },
    { q: 'Can I run Stryker only on changed files in a PR?', a: 'Yes — use --mutate "$(git diff --name-only origin/main HEAD | grep .ts$)" to restrict mutation to files changed in the PR. This makes CI fast and still catches regressions in the modified code. Run full mutation testing on a schedule (nightly) for the whole codebase.' },
  ];
}
