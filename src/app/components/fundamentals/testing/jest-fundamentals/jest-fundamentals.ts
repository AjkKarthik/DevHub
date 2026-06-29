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
  selector: 'app-jest-fundamentals',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './jest-fundamentals.html',
  styleUrl: './jest-fundamentals.scss',
})
export class JestFundamentals {
  quickRef: QuickRefItem[] = [
    { name: 'describe()',     type: 'function', desc: 'Groups related tests into a suite. Can be nested.' },
    { name: 'test() / it()', type: 'function', desc: 'Defines a single test case. `it` is an alias for `test`.' },
    { name: 'expect()',       type: 'function', desc: 'Creates an assertion. Chain matchers like `.toBe()`, `.toEqual()`.' },
    { name: 'beforeEach()',   type: 'function', desc: 'Runs a setup function before each test in the current describe block.' },
    { name: 'afterEach()',    type: 'function', desc: 'Runs a teardown function after each test.' },
    { name: 'beforeAll()',    type: 'function', desc: 'Runs once before all tests in the describe block — expensive setup.' },
    { name: 'jest.config.ts',type: 'keyword',  desc: 'Config file for transforms, coverage, testEnvironment, moduleNameMapper.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Test Structure: describe → test → expect', points: [
      'describe() groups related tests. Nesting describes creates a hierarchical test name.',
      'test() (or it()) defines one test case with a description and a callback.',
      'expect(value).matcher() asserts something about the value.',
      'A test passes if no assertion throws. Any thrown error is a failure.',
    ]},
    { heading: 'Core Matchers', points: [
      'toBe(x): strict equality (===). Use for primitives.',
      'toEqual(x): deep equality for objects and arrays.',
      'toBeTruthy() / toBeFalsy(): loose boolean check.',
      'toContain(item): checks array or string contains the value.',
      'toThrow(): asserts the function throws (wrap in another function).',
      'toHaveBeenCalledWith(args): checks a mock was called correctly.',
    ]},
    { heading: 'Lifecycle Hooks', points: [
      'beforeEach: reset state, create a fresh instance, re-mock modules.',
      'afterEach: clean up side effects — close connections, restore mocks.',
      'beforeAll / afterAll: for expensive one-time setup like starting a server.',
      'Hooks in a describe only apply to tests in that describe — useful for isolation.',
    ]},
    { heading: 'Jest Configuration', points: [
      'testEnvironment: "node" (default) or "jsdom" (for DOM APIs in browser-like tests).',
      'transform: maps file extensions to transformers (ts-jest, babel-jest).',
      'moduleNameMapper: alias paths, e.g. "@/components/*" → "<rootDir>/src/components/$1".',
      'coverage.provider: "babel" or "v8". v8 is faster; babel gives branch coverage for non-ESM.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Basic Suite', language: 'typescript', code:
`import { describe, test, expect, beforeEach } from '@jest/globals';

class Calculator {
  add(a: number, b: number) { return a + b; }
  divide(a: number, b: number) {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
}

describe('Calculator', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator(); // fresh instance per test
  });

  test('adds two numbers', () => {
    expect(calc.add(2, 3)).toBe(5);
  });

  test('throws on divide by zero', () => {
    expect(() => calc.divide(10, 0)).toThrow('Division by zero');
  });

  test('divides correctly', () => {
    expect(calc.divide(10, 2)).toBe(5);
  });
});` },
    { label: 'Matchers', language: 'typescript', code:
`test('toBe vs toEqual', () => {
  expect(1 + 1).toBe(2);                    // strict ===
  expect({ a: 1 }).toEqual({ a: 1 });       // deep equal
  expect([1, 2, 3]).toContain(2);            // array contains
  expect('hello world').toContain('world');  // string contains
});

test('truthiness matchers', () => {
  expect('hello').toBeTruthy();
  expect('').toBeFalsy();
  expect(null).toBeNull();
  expect(undefined).toBeUndefined();
});

test('number matchers', () => {
  expect(0.1 + 0.2).toBeCloseTo(0.3);   // floating point
  expect(5).toBeGreaterThan(3);
  expect(5).toBeLessThanOrEqual(5);
});` },
    { label: 'Async Tests', language: 'typescript', code:
`// Return promise
test('async with return', () => {
  return fetchUser(1).then(user => {
    expect(user.name).toBe('Alice');
  });
});

// async/await (preferred)
test('async/await', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('Alice');
});

// Test that a promise rejects
test('handles fetch error', async () => {
  await expect(fetchUser(-1)).rejects.toThrow('Not found');
});` },
    { label: 'Jest Config', language: 'typescript', code:
`// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80 },
  },
};

export default config;` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'toBe on objects', wrong: "expect({ a: 1 }).toBe({ a: 1 })", right: "expect({ a: 1 }).toEqual({ a: 1 })", explanation: 'toBe uses === (reference equality). Two different object literals are never ===. Use toEqual for deep comparison.' },
    { title: 'Forgetting to return or await async assertions', wrong: "test('async', () => { fetchUser().then(u => expect(u.name).toBe('Alice')); })", right: "test('async', async () => { const u = await fetchUser(); expect(u.name).toBe('Alice'); })", explanation: 'Without await/return, Jest finishes the test before the assertion runs — the test passes vacuously.' },
    { title: 'Asserting in catch without expect.assertions', wrong: "test('throws', async () => { try { await badFn(); } catch(e) { expect(e.message).toBe('fail'); } })", right: "test('throws', async () => { expect.assertions(1); try { await badFn(); } catch(e) { expect(e.message).toBe('fail'); } })", explanation: 'If badFn() never throws, the catch block is skipped and the test passes. expect.assertions(1) ensures at least one assertion ran.' },
    { title: 'Mutating state between tests', wrong: "const arr = []; test('push', () => { arr.push(1); expect(arr).toEqual([1]); }); test('length', () => { expect(arr.length).toBe(0); });", right: "let arr: number[]; beforeEach(() => { arr = []; }); test('push', () => { arr.push(1); expect(arr).toEqual([1]); });", explanation: 'Shared mutable state makes tests order-dependent and fragile. Reset in beforeEach.' },
    { title: 'Using .toContain on deep objects', wrong: "expect([{ id: 1 }]).toContain({ id: 1 })", right: "expect([{ id: 1 }]).toContainEqual({ id: 1 })", explanation: 'toContain uses strict equality. For objects inside arrays, use toContainEqual which performs deep equality.' },
  ];

  challenge: Challenge = {
    title: 'Write a full Jest test suite',
    language: 'typescript',
    description: 'Write a Jest test suite for the `clamp(value, min, max)` function that returns value clamped between min and max. Include at least 4 tests covering: normal range, below min, above max, and edge case (value === min).',
    hints: [
      'clamp(5, 0, 10) → 5; clamp(-5, 0, 10) → 0; clamp(15, 0, 10) → 10',
      'Use describe() to group tests and beforeEach if you need shared setup.',
    ],
    starterCode:
`function clamp(value: number, min: number, max: number): number {
  // implement me
  return value;
}

describe('clamp', () => {
  // write your tests here
});`,
    solution:
`function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

describe('clamp', () => {
  test('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  test('clamps to min when below range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  test('clamps to max when above range', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  test('returns min when value equals min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between toBe() and toEqual() in Jest?', options: ['toBe is for numbers; toEqual is for strings', 'toBe uses strict reference equality; toEqual uses deep equality', 'They are identical', 'toEqual is deprecated in Jest 29+'], answer: 1, explanation: 'toBe uses === (reference/primitive equality). toEqual recursively checks object/array structure.' },
    { q: 'When should you use beforeAll() instead of beforeEach()?', options: ['Always — beforeAll is faster', 'When setup is stateless and expensive (e.g. starting a server)', 'When you want to reset state between tests', 'Never — it causes test pollution'], answer: 1, explanation: 'beforeAll runs once for the describe block. Use it for expensive, stateless setup (server start, DB seed). For mutable state, prefer beforeEach.' },
    { q: 'What does expect.assertions(2) do in a test?', options: ['Runs the test twice', 'Fails if fewer than 2 assertions ran', 'Limits the test to 2 expect calls', 'It has no effect'], answer: 1, explanation: 'expect.assertions(n) fails the test if exactly n assertions didn\'t run — critical for async/conditional assertion paths.' },
  { q: 'What is jest.fn() used for?', options: ['Running test suites', 'Creating mock functions that track calls and can return custom values', 'Skipping test files', 'Generating test data'], answer: 1, explanation: 'jest.fn() creates a mock function. It records calls: mockFn.mock.calls, .mock.instances, .mock.results. Configure return values: mockFn.mockReturnValue(42) or mockFn.mockResolvedValue(data).' },
  { q: 'How do you mock an entire module in Jest?', options: ['jest.fn() on the import', 'jest.mock(\'module-path\') at the top of the test file', 'require.mock() in beforeEach', 'Using jest.spyOn only'], answer: 1, explanation: 'jest.mock(\'./path/to/module\') replaces the entire module with an auto-mock before the test runs. Jest hoists this call to the top of the file. Use jest.mock(\'./module\', () => ({ fn: jest.fn() })) for custom implementations.' },
  { q: 'What is the purpose of jest.useFakeTimers()?', options: ['Pause test execution', 'Replace setTimeout/setInterval/Date with controllable fake implementations', 'Increase test timeout', 'Disable async tests'], answer: 1, explanation: 'jest.useFakeTimers() replaces timer functions with fakes. Advance time with jest.advanceTimersByTime(ms) or jest.runAllTimers(). Essential for testing debounce, throttle, polling, or setTimeout-based logic.' },
  ];

  qna: QnaItem[] = [
    { q: 'What\'s the difference between test() and it() in Jest?', a: 'They are identical aliases. `it` reads more naturally for BDD style ("it should...") while `test` is more explicit. Use whichever your team prefers — Jest treats them the same.' },
    { q: 'How do I run only one test while debugging?', a: 'Use `test.only()` or `it.only()` (shortcut: `fit()`). Jest skips all other tests in the file. Similarly `describe.only()` runs only that suite. Remember to remove `.only` before committing.' },
    { q: 'How do I skip a test temporarily?', a: 'Use `test.skip()` or `xtest()`. The test is reported as skipped rather than deleted — useful for known failures you plan to fix later.' },
  { q: 'How do you test code that uses setTimeout or setInterval?', a: 'Use jest.useFakeTimers() in beforeEach and jest.useRealTimers() in afterEach. After calling the function under test, call jest.advanceTimersByTime(1000) or jest.runAllTimers() to advance time synchronously. Useful for debounce: call the debounced function, then advance time by the debounce delay, then assert the mock was called.' },
  { q: 'How do you test that a function throws in Jest?', a: 'Wrap in an arrow function: expect(() => dangerousCall()).toThrow(Expected error message). For async: await expect(asyncFn()).rejects.toThrow(error). Use .toThrowError(ErrorClass) to check the error type. Never call the dangerous function directly inside expect() — it throws before expect can catch it.' },
  { q: 'What is the Jest coverage threshold and how do you configure it?', a: 'In jest.config.js: coverageThreshold: { global: { branches: 80, functions: 80, lines: 80, statements: 80 } }. Run with jest --coverage. Thresholds cause jest to exit with code 1 if coverage drops below — useful in CI to enforce minimum coverage requirements.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Jest: describe groups, test defines, expect asserts — plus lifecycle hooks and a rich matcher API.',
    mustKnow: [
      'describe() groups tests; test()/it() defines one case',
      'expect(value).matcher() — the core assertion pattern',
      'toBe for primitives; toEqual for deep object comparison',
      'beforeEach for state reset; beforeAll for expensive one-time setup',
      'Always await or return promises in async tests',
      'expect.assertions(n) guards conditional assertion paths',
    ],
    interviewFocus: [
      'Difference between toBe and toEqual',
      'Why beforeEach > beforeAll for mutable state',
      'How to test async code with Jest',
    ],
  };
}
