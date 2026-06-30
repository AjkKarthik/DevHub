import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';

@Component({
  selector: 'app-testing-cheatsheet',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            QuizBlockComponent, QnaBlockComponent],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class TestingCheatsheet {
  quickRef: QuickRefItem[] = [
    { name: 'describe / it / test', type: 'keyword', desc: 'Group and name test cases in Jest/Vitest.' },
    { name: 'expect().toBe()',       type: 'method',  desc: 'Strict equality matcher (===). Use toEqual for deep object comparison.' },
    { name: 'beforeEach / afterEach',type: 'keyword', desc: 'Setup and teardown hooks that run before/after every test in the describe block.' },
    { name: 'vi.fn() / jest.fn()',   type: 'function',desc: 'Create a mock function that records calls and can return configured values.' },
    { name: 'await page.goto()',     type: 'method',  desc: 'Playwright: navigate to a URL in the test browser.' },
    { name: 'getByRole()',           type: 'method',  desc: 'Playwright/RTL: locate element by ARIA role — the preferred accessibility-first locator.' },
    { name: 'screen.getByText()',    type: 'method',  desc: 'React Testing Library: find an element by its visible text content.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'Testing Pyramid Quick Reference', points: [
      'Unit (many): fast, isolated, no I/O — test a single function or class.',
      'Integration (some): multiple units together, real dependencies (DB, HTTP).',
      'E2E (few): full user journey in a real browser — Playwright, Cypress.',
      'Guideline: 70% unit / 20% integration / 10% E2E — adjust to your risk profile.',
    ]},
    { heading: 'Jest/Vitest Matcher Cheat Sheet', points: [
      'toBe(x) — strict ===; toEqual(x) — deep equality; toStrictEqual — also checks undefined props.',
      'toBeNull() / toBeUndefined() / toBeDefined() / toBeTruthy() / toBeFalsy()',
      'toContain(item) — array or string contains; toHaveLength(n) — array/string length.',
      'toThrow() / toThrowError("message") — assert function throws.',
      'toHaveBeenCalled() / toHaveBeenCalledWith(args) / toHaveBeenCalledTimes(n) — spy assertions.',
    ]},
    { heading: 'Playwright Locator Priority', points: [
      '1st: getByRole() — mirrors what screen readers see; most resilient to change.',
      '2nd: getByLabel() — form fields by their visible label.',
      '3rd: getByText() — visible text content; getByPlaceholder() for input placeholders.',
      '4th: getByTestId() — data-testid attribute — use only when no semantic alternative exists.',
      'Avoid: CSS selectors and XPath — they couple tests to implementation detail.',
    ]},
    { heading: 'TDD Quick Cycle', points: [
      'Red: write a failing test for the next small piece of behaviour.',
      'Green: write the minimum code to make it pass — no more.',
      'Refactor: clean up duplication/naming — tests must still be green.',
      'Commit when green; never commit red tests to main.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Jest Matchers', language: 'typescript', code:
`// Equality
expect(2 + 2).toBe(4);
expect({ a: 1 }).toEqual({ a: 1 });

// Truthiness
expect(null).toBeNull();
expect(undefined).toBeUndefined();
expect('hello').toBeTruthy();
expect(0).toBeFalsy();

// Strings / Arrays
expect('Hello World').toContain('World');
expect([1, 2, 3]).toHaveLength(3);
expect([1, 2, 3]).toContain(2);

// Exceptions
expect(() => JSON.parse('{bad}')).toThrow();
expect(() => fn()).toThrowError('Expected message');

// Async
await expect(fetchUser(1)).resolves.toEqual({ id: 1 });
await expect(fetchUser(-1)).rejects.toThrow('Not found');` },
    { label: 'Mock Functions', language: 'typescript', code:
`import { vi, expect, test } from 'vitest';

const mockFn = vi.fn();
mockFn.mockReturnValue(42);
mockFn.mockResolvedValue({ data: 'ok' });      // async
mockFn.mockRejectedValue(new Error('oops'));   // async failure

// Spy on existing method
const spy = vi.spyOn(emailService, 'send').mockResolvedValue(undefined);

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith('arg1', 42);
expect(mockFn).toHaveBeenLastCalledWith('last-arg');

// Reset between tests
vi.clearAllMocks();   // clears calls/instances/results
vi.resetAllMocks();   // + resets implementations
vi.restoreAllMocks(); // + restores original implementations (spies)` },
    { label: 'Playwright Locators', language: 'typescript', code:
`import { test, expect } from '@playwright/test';

test('checkout flow', async ({ page }) => {
  await page.goto('/shop');

  // Preferred: role-based locators
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'Checkout' }).click();

  // Form fields
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByPlaceholder('Card number').fill('4242424242424242');

  // Text content
  await expect(page.getByText('Order confirmed')).toBeVisible();

  // By test id (last resort)
  await page.getByTestId('order-total').click();

  // Assertions
  await expect(page).toHaveURL('/confirmation');
  await expect(page.getByRole('heading')).toHaveText('Thank you!');
});` },
    { label: 'React Testing Library', language: 'typescript', code:
`import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('login form submits', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={mockSubmit} />);

  // Query hierarchy: getBy (throws) > queryBy (null) > findBy (async)
  const email = screen.getByLabelText('Email');
  const password = screen.getByLabelText('Password');
  const button = screen.getByRole('button', { name: /sign in/i });

  await user.type(email, 'user@test.com');
  await user.type(password, 'secret');
  await user.click(button);

  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'user@test.com',
      password: 'secret',
    });
  });
  expect(screen.queryByText('Error')).not.toBeInTheDocument();
});` },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between toBe() and toEqual() in Jest?', options: ['toBe is for numbers, toEqual is for strings', 'toBe uses strict === (same reference for objects); toEqual does deep structural comparison', 'toBe is async-safe, toEqual is not', 'They are identical'], answer: 1, explanation: 'toBe(x) uses === — it will fail for two different objects with the same shape. toEqual(x) recursively checks that all fields match, making it correct for comparing value objects.' },
    { q: 'Which Playwright locator is preferred for accessibility and resilience?', options: ['getByTestId()', 'CSS selector', 'getByRole()', 'XPath'], answer: 2, explanation: 'getByRole() mirrors what assistive technologies see. It is resilient to CSS class changes and implementation details, and it doubles as an accessibility check.' },
    { q: 'In React Testing Library, when should you use findBy* instead of getBy*?', options: ['When the element is hidden', 'When the element appears asynchronously after an API call or state update', 'When querying by text', 'findBy is always the right choice'], answer: 1, explanation: 'findBy* returns a Promise and waits (default 1 second) for the element to appear — use it when the element appears after an async action. getBy* is synchronous and throws immediately if not found.' },
    { q: 'What is the difference between queryBy* and getBy* in React Testing Library?', options: ['They are identical aliases', 'getBy* throws an error if the element is not found; queryBy* returns null instead, making it the correct choice for asserting an element is absent', 'queryBy* is async and getBy* is synchronous', 'queryBy* only works with role-based queries'], answer: 1, explanation: 'getBy* throws immediately if no matching element exists, which is useful for asserting presence but crashes your test if you actually expect absence. queryBy* returns null instead of throwing, making it the correct choice for assertions like expect(screen.queryByText("Error")).not.toBeInTheDocument().' },
    { q: 'What does Jest/Vitest\'s toMatchSnapshot() do, and what is the main risk of overusing it?', options: ['It compares two numbers for approximate equality', 'It serializes a value (often rendered component output) and compares it against a stored snapshot file, flagging any difference', 'It only works for testing API response status codes', 'It automatically generates new test cases'], answer: 1, explanation: 'Snapshot testing captures a serialized representation of output and saves it to a file; subsequent runs compare against this saved snapshot, failing on any difference. The main risk: developers often blindly run --updateSnapshot to "fix" a failing test without reviewing whether the change was actually correct, turning the tests from a meaningful safety net into rubber-stamped approval of any change.' },
    { q: 'What is the difference between a test double, a stub, and a mock?', options: ['They are all exactly the same concept with different names', 'Test double is the umbrella term; a stub returns canned responses with no behavior verification; a mock additionally records and verifies HOW it was called (call count, arguments)', 'Stubs are only usable in Python; mocks are only usable in JavaScript', 'A mock is a real implementation; a stub is always fake'], answer: 1, explanation: '"Test double" is the general term (analogous to a movie stunt double) for any fake object replacing a real dependency in a test. A stub simply returns pre-configured values when called, with no assertion on how it was used. A mock goes further — it also records interactions, letting you assert the dependency was called the expected number of times with the expected arguments, useful for verifying side-effecting behavior (e.g., asserting an email-sending function was called exactly once).' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the rule of thumb for when to mock vs use real dependencies?', a: 'Mock external I/O (HTTP calls, databases, email services) in unit tests to keep them fast and isolated. Use real dependencies in integration tests to catch wiring bugs. In E2E tests, only mock third-party services you do not control (payment gateways, external auth providers).' },
    { q: 'What does vi.restoreAllMocks() do that vi.clearAllMocks() does not?', a: 'clearAllMocks: resets recorded calls and return values but leaves mock implementations in place. resetAllMocks: also removes the mock implementations (returns undefined by default). restoreAllMocks: additionally restores the original implementation for any spy created with vi.spyOn — so the real method runs again after the test.' },
    { q: 'What is the testing pyramid, and why do most teams aim for many unit tests but few E2E tests?', a: 'The testing pyramid describes a recommended distribution: many fast, cheap unit tests at the base; fewer integration tests in the middle; very few slow, expensive end-to-end tests at the top. E2E tests are valuable for catching real cross-system issues but are slow to run, expensive to maintain (brittle selectors, flaky timing), and slow to debug when they fail (the failure could be anywhere in the stack). Unit tests are fast, isolated, and pinpoint failures precisely — maximizing unit test coverage while reserving E2E tests for critical user journeys gives the best balance of confidence and maintainability.' },
    { q: 'What is test flakiness, and what are the most common causes in browser-based E2E tests?', a: 'A flaky test is one that sometimes passes and sometimes fails without any change to the code being tested — undermining trust in the test suite (a failure is often dismissed as "probably just flaky" even when it is a real bug). Common causes in E2E tests: race conditions where the test asserts on an element before an async operation (API call, animation) has completed; relying on fixed sleep/wait times instead of waiting for a specific condition; tests that depend on shared, mutable state (a database row another test also modifies); and timing-sensitive CSS animations or transitions. Fix by using explicit wait conditions (waitFor, auto-retrying assertions) instead of fixed delays, and ensuring test data isolation between test runs.' },
    { q: 'What is the Arrange-Act-Assert (AAA) pattern, and why is it considered a best practice for structuring individual tests?', a: 'AAA structures a test into three clear sections: Arrange (set up test data, mocks, and initial state), Act (execute the single behavior being tested), and Assert (verify the expected outcome). Following this consistent structure makes tests easier to read and review at a glance — a reviewer can quickly identify what is being set up versus what is actually being tested versus what is being verified, rather than parsing an unstructured mix of setup, action, and assertions interleaved throughout the test body. It also discourages testing multiple unrelated behaviors in a single test, since each test naturally centers on one Act step.' },
    { q: 'Why is it considered an anti-pattern to share mutable state between test cases via beforeAll instead of beforeEach?', a: 'beforeAll runs once before all tests in a suite, while beforeEach runs before every individual test. If a beforeAll hook creates a shared object (a database record, an in-memory object) that a test then mutates, that mutation persists and leaks into subsequent tests in the same suite — creating order-dependent tests where running them individually behaves differently than running the full suite, and where the failure of one test can cause cascading, confusing failures in unrelated tests that happen to run afterward. Using beforeEach to create fresh state for every test eliminates this entire class of bugs, at the cost of slightly more setup overhead per test.' },
  ];
}
