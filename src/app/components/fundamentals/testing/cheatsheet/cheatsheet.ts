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
  ];

  qna: QnaItem[] = [
    { q: 'What is the rule of thumb for when to mock vs use real dependencies?', a: 'Mock external I/O (HTTP calls, databases, email services) in unit tests to keep them fast and isolated. Use real dependencies in integration tests to catch wiring bugs. In E2E tests, only mock third-party services you do not control (payment gateways, external auth providers).' },
    { q: 'What does vi.restoreAllMocks() do that vi.clearAllMocks() does not?', a: 'clearAllMocks: resets recorded calls and return values but leaves mock implementations in place. resetAllMocks: also removes the mock implementations (returns undefined by default). restoreAllMocks: additionally restores the original implementation for any spy created with vi.spyOn — so the real method runs again after the test.' },
  ];
}
