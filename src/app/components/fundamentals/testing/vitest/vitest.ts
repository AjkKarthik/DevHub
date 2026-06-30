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
  selector: 'app-vitest-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './vitest.html',
  styleUrl: './vitest.scss',
})
export class VitestTesting {
  quickRef: QuickRefItem[] = [
    { name: 'vitest',           type: 'keyword',  desc: 'Vite-native test runner — ESM-first, Jest-compatible API, fast HMR watch mode.' },
    { name: 'describe/it/test', type: 'function', desc: 'Same API as Jest — zero learning curve when migrating.' },
    { name: 'vi.fn()',          type: 'function', desc: 'Vitest\'s equivalent of jest.fn() — creates a mock function.' },
    { name: 'vi.spyOn()',       type: 'function', desc: 'Spy on an existing method — equivalent to jest.spyOn().' },
    { name: 'vi.mock()',        type: 'function', desc: 'Module mock — hoisted like jest.mock().' },
    { name: 'import.meta.vitest', type: 'keyword', desc: 'Enables in-source tests — define tests in the same file as your code.' },
    { name: 'vitest.config.ts', type: 'keyword',  desc: 'Config file — or extend from vite.config.ts with test: {} block.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Why Vitest Is Fast', points: [
      'Vitest reuses Vite\'s module graph — no separate transpilation step for TypeScript or JSX.',
      'Tests run as native ESM — no CommonJS transform overhead.',
      'Worker threads run test files in parallel by default.',
      'Watch mode uses Vite\'s HMR to re-run only tests affected by a changed file.',
    ]},
    { heading: 'Jest-Compatible API', points: [
      'describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll — identical to Jest.',
      'vi.fn(), vi.spyOn(), vi.mock() replace jest.fn(), jest.spyOn(), jest.mock().',
      'Most Jest tests run under Vitest with only a globals: true config change.',
      'Migration path: replace jest with vitest in package.json scripts; update imports from "jest" to "vitest".',
    ]},
    { heading: 'In-Source Tests', points: [
      'Vitest lets you write tests inside the source file using if (import.meta.vitest) { ... }.',
      'Tests are tree-shaken out of production builds — zero bundle impact.',
      'Useful for utility functions where the test lives right next to the code it tests.',
      'Can be disabled per environment with includeSource: [] config.',
    ]},
    { heading: 'Configuration', points: [
      'Add test: { ... } block to vite.config.ts — no separate config file needed.',
      'environment: "jsdom" for browser-like DOM testing; "node" for server-side.',
      'globals: true makes describe/it/expect global — no explicit imports needed.',
      'coverage.provider: "v8" (fast, no transform) or "istanbul" (detailed branch coverage).',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Basic Vitest Test', language: 'typescript', code:
`// math.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { add, divide } from './math';

describe('math utilities', () => {
  it('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('throws on divide by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
});` },
    { label: 'Mocking with vi', language: 'typescript', code:
`import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let mockSend: ReturnType<typeof vi.fn>;
  let svc: NotificationService;

  beforeEach(() => {
    mockSend = vi.fn().mockResolvedValue(undefined);
    svc = new NotificationService({ send: mockSend });
    vi.clearAllMocks();
  });

  it('sends a welcome email', async () => {
    await svc.sendWelcome('alice@example.com');
    expect(mockSend).toHaveBeenCalledWith(
      'alice@example.com', 'Welcome!', expect.any(String)
    );
  });
});` },
    { label: 'In-Source Tests', language: 'typescript', code:
`// math.ts — source file with embedded tests
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

// Tests live in the same file — tree-shaken in production
if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;

  it('clamps value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
}` },
    { label: 'vitest.config.ts', language: 'typescript', code:
`// Option 1: extend from vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    globals:     true,          // no need to import describe/it/expect
    environment: 'jsdom',       // browser-like DOM
    setupFiles:  ['./src/test/setup.ts'],
    coverage: {
      provider:  'v8',
      reporter:  ['text', 'lcov'],
      include:   ['src/**/*.ts'],
      exclude:   ['src/**/*.d.ts', 'src/test/**'],
      thresholds: { lines: 80, branches: 70 },
    },
    // In-source tests
    includeSource: ['src/**/*.ts'],
  },
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Importing from "jest" in Vitest tests', wrong: 'import { jest } from "@jest/globals"', right: 'import { vi } from "vitest"', explanation: 'Vitest uses vi, not jest. With globals: true, vi is available globally. If you import from @jest/globals, you\'ll get a module-not-found error.' },
    { title: 'Missing globals: true when migrating from Jest', wrong: 'test("...", () => {}) // ReferenceError: test is not defined', right: 'add globals: true in vitest.config.ts test block', explanation: 'Unlike Jest which globally injects describe/it/expect by default, Vitest requires globals: true or explicit imports from "vitest".' },
    { title: 'Using jest.config.ts alongside Vitest', wrong: 'both jest.config.ts and vitest.config.ts present', right: 'remove jest.config.ts; configure everything in vite.config.ts test block', explanation: 'Having both configs confuses the toolchain. Vitest reads its config from vite.config.ts or vitest.config.ts — not jest.config.ts.' },
    { title: 'Not tree-shaking in-source tests', wrong: 'if (import.meta.vitest) { /* test code */ } // but includeSource not set', right: 'set includeSource: ["src/**/*.ts"] in config and use define: { "import.meta.vitest": undefined } for production builds', explanation: 'Without the build-time define override, import.meta.vitest remains truthy in production and test code is bundled into your app.' },
    { title: 'Expecting Jest coverage setup to work unchanged', wrong: 'jest --coverage // same as before', right: 'vitest run --coverage // and install @vitest/coverage-v8 or @vitest/coverage-istanbul', explanation: 'Vitest coverage requires a separate package. Install @vitest/coverage-v8 for fast coverage or @vitest/coverage-istanbul for detailed branch reporting.' },
  ];

  challenge: Challenge = {
    title: 'Migrate a Jest test to Vitest',
    language: 'typescript',
    description: 'Convert the given Jest test to Vitest syntax. Replace jest.fn() with vi.fn(), update imports, and add globals: true to the config so describe/it/expect are global without imports.',
    hints: [
      'Replace jest.fn() → vi.fn(), jest.spyOn() → vi.spyOn(), jest.clearAllMocks() → vi.clearAllMocks().',
      'Import from "vitest" instead of "@jest/globals".',
    ],
    starterCode:
`// Jest test (to be converted)
import { jest } from '@jest/globals';
import { UserService } from './user.service';

const mockRepo = { findById: jest.fn() };

beforeEach(() => { jest.clearAllMocks(); });

test('returns user by ID', async () => {
  mockRepo.findById.mockResolvedValue({ id: 1, name: 'Alice' });
  const svc = new UserService(mockRepo);
  const user = await svc.getUser(1);
  expect(user.name).toBe('Alice');
});`,
    solution:
`// Vitest equivalent
import { vi, beforeEach, test, expect } from 'vitest';
import { UserService } from './user.service';

const mockRepo = { findById: vi.fn() };

beforeEach(() => { vi.clearAllMocks(); });

test('returns user by ID', async () => {
  mockRepo.findById.mockResolvedValue({ id: 1, name: 'Alice' });
  const svc = new UserService(mockRepo);
  const user = await svc.getUser(1);
  expect(user.name).toBe('Alice');
});

// vitest.config.ts:
// test: { globals: true } — then you can omit the imports above`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Why is Vitest faster than Jest for TypeScript projects?', options: ['Vitest skips assertions to run faster', 'Vitest reuses Vite\'s module graph and runs native ESM — no separate transpilation step', 'Vitest runs tests sequentially which is faster', 'Vitest has fewer features so it has less overhead'], answer: 1, explanation: 'Jest needs to transform TypeScript via Babel or ts-jest before running. Vitest reuses Vite\'s already-running transform pipeline, eliminating the cold-start transpilation cost.' },
    { q: 'What is the Vitest equivalent of jest.fn()?', options: ['mock.fn()', 'vitest.fn()', 'vi.fn()', 'test.fn()'], answer: 2, explanation: 'vi is Vitest\'s utility namespace, equivalent to jest in Jest. vi.fn() creates a mock function, vi.spyOn() spies on methods, vi.mock() mocks modules.' },
    { q: 'What does import.meta.vitest enable?', options: ['Faster test execution', 'In-source tests that are tree-shaken out of production builds', 'TypeScript support', 'Coverage reporting'], answer: 1, explanation: 'import.meta.vitest is truthy only in Vitest runs. Tests inside if (import.meta.vitest) are excluded from production builds when you set define: { "import.meta.vitest": undefined } in Vite.' },
  { q: 'What is Vitest and how does it differ from Jest?', options: ['Vitest is only for Vue projects', 'Vitest is a Vite-native test runner with Jest-compatible API — faster HMR and native ESM support', 'Vitest requires TypeScript', 'Vitest does not support mocking'], answer: 1, explanation: 'Vitest runs in the Vite build pipeline — native ESM, instant HMR for tests, no transpilation overhead. API is Jest-compatible (describe, it, expect, vi.*). Faster startup than Jest in Vite projects.' },
  { q: 'What replaces jest.fn() and jest.spyOn() in Vitest?', options: ['vi.fake() and vi.watch()', 'vi.fn() and vi.spyOn()', 'vitest.mock() and vitest.spy()', 'test.fn() and test.spy()'], answer: 1, explanation: 'Vitest uses the i object: i.fn() for mock functions, i.spyOn(obj, \'method\') for spies, i.mock(\'module\') for module mocking, i.useFakeTimers() for timer control.' },
  { q: 'How does Vitest handle test isolation differently from Jest?', options: ['It does not — they are identical', 'Vitest shares module state across tests by default in the same file; use vi.resetModules() or isolate: true for per-test module isolation', 'Vitest creates a new VM context per test', 'Vitest runs all tests in a single process'], answer: 1, explanation: 'Vitest\'s module mocking is per-test-file by default. For strict per-test isolation (fresh module instances each test), configure pool threads and use vi.resetModules() in beforeEach or isolate: true in config.' },
  ];

  qna: QnaItem[] = [
    { q: 'Should I migrate from Jest to Vitest?', a: 'For projects already using Vite (React, Vue, SvelteKit): yes — the migration is usually under an hour and you get significantly faster test runs. For non-Vite projects (Angular with Jest, NestJS): the benefit is smaller and the migration cost is higher. Evaluate based on your actual test suite speed.' },
    { q: 'Can Vitest and Jest coexist in a monorepo?', a: 'Yes — different packages can use different test runners. A shared library might use Vitest while a NestJS backend uses Jest. Just ensure each package has its own config and the scripts are scoped correctly.' },
    { q: 'Does Vitest support watch mode?', a: 'Yes — run vitest (without "run") to enter watch mode. Vitest\'s HMR-aware watch mode only re-runs tests whose module graph was touched by the file change — dramatically faster than Jest\'s watch mode which re-runs all tests matching the changed file.' },
  { q: 'How do you configure Vitest in a Vite project?', a: 'Add to vite.config.ts: test: { globals: true, environment: jsdom, setupFiles: [./src/test-setup.ts] }. Or use a separate vitest.config.ts. Enable globals to avoid importing describe/it/expect in every file. Install: npm i -D vitest @vitest/ui @testing-library/react. Run: vitest (watch) or vitest run (CI).' },
  { q: 'How do you run only a subset of Vitest tests?', a: 'Options: (1) it.only() or describe.only() to run only these; (2) vitest run src/utils.test.ts for a specific file; (3) vitest -t should calculate to filter by test name; (4) vitest --reporter=verbose to see all test names. In watch mode: press p to filter by filename, t to filter by test name, h for full help.' },
  { q: 'What is the Vitest UI and how do you access it?', a: 'Vitest UI is a browser-based test dashboard. Install with npm i -D @vitest/ui. Run: vitest --ui. Opens at localhost:51204. Features: test tree with pass/fail status, inline test source, module graph, coverage report. Great for debugging failing tests during development without switching between terminal and editor.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Vitest: Vite-native, Jest-compatible, ESM-first test runner — vi.fn() replaces jest.fn(), in-source tests via import.meta.vitest.',
    mustKnow: [
      'Vitest reuses Vite\'s transform — no separate TS transpilation',
      'Same API as Jest: describe/it/expect/beforeEach',
      'vi.fn() / vi.spyOn() / vi.mock() replace jest.* equivalents',
      'globals: true makes describe/it/expect global without imports',
      'In-source tests: if (import.meta.vitest) { ... } — tree-shaken in prod',
      'Install @vitest/coverage-v8 for coverage support',
    ],
    interviewFocus: [
      'Why Vitest is faster than Jest for Vite projects',
      'API differences: vi vs jest namespace',
      'In-source testing pattern and production tree-shaking',
    ],
  };
}
