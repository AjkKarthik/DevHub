import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-testing-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './testing-fundamentals.html',
  styleUrl: './testing-fundamentals.scss',
})
export class TestingFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'Unit Test',        type: 'keyword', desc: 'Tests a single function or class in isolation — fast, focused, no I/O.' },
    { name: 'Integration Test', type: 'keyword', desc: 'Tests multiple units together, often with a real DB or HTTP call.' },
    { name: 'E2E Test',         type: 'keyword', desc: 'Drives a real browser end-to-end — slowest, highest confidence.' },
    { name: 'Test Coverage',    type: 'keyword', desc: 'Percentage of code executed by tests — line, branch, or mutation coverage.' },
    { name: 'Test Double',      type: 'keyword', desc: 'Generic term for stubs, mocks, spies, fakes used in place of real dependencies.' },
    { name: 'Shift-Left',       type: 'keyword', desc: 'Finding bugs earlier in the pipeline — write tests alongside or before code.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'The Testing Pyramid', points: [
      'Unit tests form the base: many, fast, cheap to run and maintain.',
      'Integration tests sit in the middle: fewer, test real collaborations.',
      'E2E tests are at the top: few, slow, but validate the whole system.',
      'The pyramid ratio is a guide — not a rule — but violating it (too many E2E) makes suites slow and brittle.',
    ]},
    { heading: 'Test Coverage Types', points: [
      'Line coverage: which lines were executed. Easy to achieve, easy to game.',
      'Branch coverage: both sides of every if/else. More meaningful than line coverage.',
      'Mutation coverage: how many artificially introduced bugs your tests catch. The gold standard.',
      '80% line coverage is a common target but low mutation score means weak tests.',
    ]},
    { heading: 'Why Automated Testing Matters', points: [
      'Tests catch regressions when you change code — safety net for refactoring.',
      'Tests document expected behaviour better than prose comments.',
      'Automated CI runs tests on every commit — bugs never reach production silently.',
      'A good test suite makes developers confident to move fast without fear.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Unit Test', language: 'typescript', code:
`// Pure function — easiest to unit test
function add(a: number, b: number): number {
  return a + b;
}

// Jest test
test('add returns sum of two numbers', () => {
  expect(add(2, 3)).toBe(5);
  expect(add(-1, 1)).toBe(0);
});` },
    { label: 'Integration Test', language: 'typescript', code:
`// Integration test: service + real database via Testcontainers
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;
let service: UserService;

beforeAll(async () => {
  prisma = new PrismaClient(); // connected to test DB
  service = new UserService(prisma);
});

test('creates and retrieves a user', async () => {
  const user = await service.create({ name: 'Alice', email: 'alice@example.com' });
  const found = await service.findById(user.id);
  expect(found?.name).toBe('Alice');
});` },
    { label: 'E2E Test', language: 'typescript', code:
`// Playwright E2E — drives a real browser
import { test, expect } from '@playwright/test';

test('user can log in and see dashboard', async ({ page }) => {
  await page.goto('https://myapp.com/login');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Testing too much through E2E', wrong: 'every feature has a Cypress E2E test', right: 'unit test the logic; E2E only the critical user flow', explanation: 'E2E tests are 100x slower than unit tests. Testing everything through the browser makes the suite painful to run.' },
    { title: 'Asserting implementation details', wrong: 'expect(component.state).toBe("loading")', right: 'expect(screen.getByRole("status")).toHaveText("Loading…")', explanation: 'Internal state changes break tests without real bugs. Test what the user sees.' },
    { title: 'Shared mutable state between tests', wrong: 'let db: Database; // initialised once', right: 'beforeEach(() => { db = createFreshDb(); })', explanation: 'Tests that rely on order or shared state pass alone but fail in parallel or shuffled runs.' },
    { title: 'Targeting 100% coverage', wrong: 'cover every getter and constructor', right: 'cover critical paths; use mutation score to find weak tests', explanation: '100% line coverage is trivially achievable without meaningful assertions. Mutation score is the real quality signal.' },
    { title: 'No test isolation', wrong: 'test reads from a file created by a previous test', right: 'each test creates and cleans up its own fixtures', explanation: 'Tests must be independent so they can run in any order or in parallel.' },
  ];

  challenge: Challenge = {
    title: 'Classify and write your first tests',
    language: 'typescript',
    description: 'Write three tests for the `multiply(a, b)` function: one unit test, one edge-case test for zero, and one for negative numbers. All three should pass.',
    hints: [
      'Use Jest: `test("description", () => { expect(...).toBe(...); })`',
      'Edge cases: multiply(5, 0) should be 0; multiply(-2, 3) should be -6.',
    ],
    starterCode:
`function multiply(a: number, b: number): number {
  return a * b;
}

// Write three tests below
test('multiply returns correct product', () => {

});`,
    solution:
`function multiply(a: number, b: number): number {
  return a * b;
}

test('multiply returns correct product', () => {
  expect(multiply(3, 4)).toBe(12);
});

test('multiply by zero returns zero', () => {
  expect(multiply(5, 0)).toBe(0);
});

test('multiply with negative numbers', () => {
  expect(multiply(-2, 3)).toBe(-6);
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Which test type is fastest and should make up the majority of a test suite?', options: ['E2E tests', 'Integration tests', 'Unit tests', 'Smoke tests'], answer: 2, explanation: 'Unit tests run in milliseconds with no I/O. They should form the wide base of the testing pyramid.' },
    { q: 'What does "branch coverage" measure?', options: ['How many files are tested', 'Whether both true and false paths of conditionals are executed', 'The number of test cases', 'How many functions are called'], answer: 1, explanation: 'Branch coverage checks that both sides of every if/else/ternary are exercised — more meaningful than line coverage.' },
    { q: 'What is "shift-left" testing?', options: ['Writing tests after deployment', 'Testing only in production', 'Finding bugs earlier in the development cycle', 'Moving tests to a separate team'], answer: 2, explanation: 'Shift-left means writing and running tests earlier — ideally alongside or before code — so bugs are caught cheaply.' },
  { q: 'What is the Test Pyramid and what does each layer represent?', options: ['Unit, Component, System', 'Unit (many, fast), Integration (fewer), E2E (few, slow)', 'Fast, Medium, Slow tests', 'Mocked, Partial, Real tests'], answer: 1, explanation: 'The Test Pyramid (Mike Cohn): broad base of unit tests (many, fast, cheap), middle layer of integration tests, narrow top of E2E tests (few, slow, expensive). Inverted pyramids with many E2E and few unit tests are fragile and slow.' },
  { q: 'What is the FIRST principle for good unit tests?', options: ['FIRST stands for: Functional, Isolated, Repeatable, Structured, Tested', 'Fast, Independent, Repeatable, Self-validating, Timely', 'Focused, Idempotent, Realistic, Stateless, Typed', 'None of the above — it is not a real principle'], answer: 1, explanation: 'FIRST: Fast (run in ms), Independent (no ordering dependency), Repeatable (same result every run), Self-validating (pass/fail without manual inspection), Timely (written before or with the code, not months later).' },
  { q: 'What is code coverage and what are its limitations?', options: ['The only measure of test quality', 'A metric showing which lines/branches are executed, but not whether assertions are correct', 'A requirement to have 100% for production code', 'Only measurable by CI tools'], answer: 1, explanation: 'Coverage measures which code is executed by tests, not whether tests make correct assertions. 100% coverage with weak assertions is worse than 80% coverage with strong assertions. Coverage is a floor, not a ceiling for quality.' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the testing pyramid and why does it matter?', a: 'A model with many unit tests at the base, fewer integration tests in the middle, and a small number of E2E tests at the top. It matters because inverting it (testing-trophy or testing ice-cream-cone anti-patterns) makes suites slow, brittle, and expensive to maintain.' },
    { q: 'When should I write tests first (TDD) vs after?', a: 'TDD (Red-Green-Refactor) is most valuable for business logic and algorithms — writing the test first shapes the API. For exploratory or UI work, writing tests after is often more pragmatic. The goal is testable, well-designed code, not strict ceremony.' },
    { q: 'How much test coverage is "enough"?', a: '80% line coverage is a common target, but it\'s not the right metric alone. Aim for high branch coverage on business-critical paths and use mutation testing to measure whether your assertions actually catch bugs — a well-tested 60% is better than a superficially covered 95%.' },
  { q: 'What is the Arrange-Act-Assert (AAA) pattern?', a: 'AAA structures test readability: <strong>Arrange</strong>: set up the system under test and its dependencies; <strong>Act</strong>: execute the behaviour under test; <strong>Assert</strong>: verify the expected outcome. Example: const cart = new Cart(); // Arrange then cart.addItem(item); // Act then xpect(cart.total()).toBe(10); // Assert. One Act per test.' },
  { q: 'What is the difference between unit, integration, and E2E tests?', a: '<strong>Unit tests</strong>: test one function/class in isolation — all dependencies mocked, milliseconds to run. <strong>Integration tests</strong>: test multiple components together with real or near-real dependencies (real DB, real HTTP) — seconds. <strong>E2E tests</strong>: test the full system through the UI — minutes. Use mostly unit, some integration, few E2E.' },
  { q: 'What makes a test a good test?', a: 'Good tests are: (1) <strong>Fast</strong>: run in milliseconds; (2) <strong>Deterministic</strong>: same result every run, no flakiness; (3) <strong>Meaningful</strong>: tests behaviour, not implementation; (4) <strong>Clear on failure</strong>: failing test reveals exactly what is wrong; (5) <strong>Independent</strong>: no shared mutable state between tests; (6) <strong>Minimal</strong>: one concept per test.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Automated tests are a safety net: unit tests for speed, integration for collaboration, E2E for user flows.',
    mustKnow: [
      'Testing pyramid: many units, fewer integration, few E2E',
      'Unit tests: isolated, no I/O, run in milliseconds',
      'Integration tests: test real collaborations (DB, HTTP)',
      'E2E tests: real browser, validates the whole system',
      'Branch coverage > line coverage > no coverage',
      'Mutation score reveals whether assertions actually catch bugs',
    ],
    interviewFocus: [
      'Explain the testing pyramid and when each layer is appropriate',
      'Trade-off between test confidence and test speed',
      'What makes a test brittle vs. maintainable',
    ],
  };
}
