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
  selector: 'app-mocking-spies',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './mocking-spies.html',
  styleUrl: './mocking-spies.scss',
})
export class MockingSpies {
  quickRef: QuickRefItem[] = [
    { name: 'jest.fn()',               type: 'function', desc: 'Creates a standalone mock function that records all calls.' },
    { name: 'jest.spyOn(obj, method)', type: 'function', desc: 'Replaces obj.method with a spy — retains original implementation unless overridden.' },
    { name: 'mockReturnValue(v)',       type: 'method',   desc: 'Makes the mock always return v synchronously.' },
    { name: 'mockResolvedValue(v)',     type: 'method',   desc: 'Makes the mock return Promise.resolve(v) — for async functions.' },
    { name: 'mockRejectedValue(e)',     type: 'method',   desc: 'Makes the mock return Promise.reject(e) — for testing error paths.' },
    { name: 'jest.mock(\'module\')',    type: 'function', desc: 'Auto-mocks an entire module — all exports become jest.fn().' },
    { name: 'jest.clearAllMocks()',     type: 'function', desc: 'Resets call history and return values on all mocks. Call in afterEach.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'jest.fn() — Standalone Mocks', points: [
      'jest.fn() creates a function that records every call, argument, and return value.',
      'Use it to replace dependencies passed into the unit under test.',
      'Inspect calls via mock.calls (array of argument arrays) and mock.results.',
      'mockReturnValueOnce() returns a value for the first call only — useful for sequencing.',
    ]},
    { heading: 'jest.spyOn() — Spy on Real Objects', points: [
      'spyOn wraps an existing method so you can observe calls without fully replacing it.',
      'The original implementation still runs unless you chain .mockImplementation().',
      'Always restore with jest.restoreAllMocks() in afterEach to prevent bleed between tests.',
      'Useful for spying on built-ins like console.log or Date.now.',
    ]},
    { heading: 'jest.mock() — Module-Level Mocking', points: [
      'jest.mock("./userService") replaces the entire module with auto-mocked jest.fn() exports.',
      'Call it at the top of the file — Jest hoists it above imports automatically.',
      'Use jest.mocked(fn) for TypeScript type inference on the mock.',
      'jest.resetModules() clears the module registry — needed for per-test module isolation.',
    ]},
    { heading: 'Clearing, Resetting, Restoring', points: [
      'clearAllMocks(): clears call history and instances. Does NOT reset implementation.',
      'resetAllMocks(): clears call history AND resets return values / implementations.',
      'restoreAllMocks(): restores all spyOn mocks to their original implementations.',
      'Configure clearMocks: true in jest.config.ts to auto-clear after each test.',
    ]},
    { heading: 'Overmocking as an Anti-Pattern', points: [
      'Mocking every single dependency of the unit under test can produce tests that pass even when the real integration between components is broken, since mocks never verify the real contract between collaborators actually holds.',
      'A test suite with excessive mocking often needs to be rewritten whenever internal implementation details change, even if the externally observable behavior stayed the same — a sign the tests are too tightly coupled to implementation.',
      'Spies (which wrap a real implementation while still recording calls) preserve real behavior while adding observability, making them preferable to full mocks when the real logic is cheap and deterministic enough to safely execute in a test.',
      'A useful rule of thumb: mock at architectural boundaries (network calls, database access, time) but let real internal logic run, since that internal logic is exactly what the test should be verifying.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'jest.fn()', language: 'typescript', code:
`// Injecting a mock dependency
class OrderService {
  constructor(private notify: (msg: string) => void) {}
  place(item: string) { this.notify(\`Ordered: \${item}\`); return { item, status: 'placed' }; }
}

test('place calls notify with the item name', () => {
  const mockNotify = jest.fn();
  const svc = new OrderService(mockNotify);

  const result = svc.place('Widget');

  expect(mockNotify).toHaveBeenCalledTimes(1);
  expect(mockNotify).toHaveBeenCalledWith('Ordered: Widget');
  expect(result.status).toBe('placed');
});` },
    { label: 'mockReturnValue', language: 'typescript', code:
`// Controlling what a mock returns
const mockFetch = jest.fn();

test('returns cached user on second call', () => {
  mockFetch
    .mockReturnValueOnce({ id: 1, name: 'Alice' })  // first call
    .mockReturnValueOnce({ id: 1, name: 'Alice' }); // second call

  expect(mockFetch()).toEqual({ id: 1, name: 'Alice' });
  expect(mockFetch()).toEqual({ id: 1, name: 'Alice' });
  expect(mockFetch).toHaveBeenCalledTimes(2);
});

// Async: mockResolvedValue
const mockApiCall = jest.fn().mockResolvedValue({ status: 200, body: 'OK' });

test('handles resolved promise', async () => {
  const res = await mockApiCall('/api/users');
  expect(res.status).toBe(200);
});` },
    { label: 'jest.spyOn()', language: 'typescript', code:
`const mathUtils = {
  random: () => Math.random(),
};

test('uses spied random value', () => {
  const spy = jest.spyOn(mathUtils, 'random').mockReturnValue(0.5);

  expect(mathUtils.random()).toBe(0.5);
  expect(spy).toHaveBeenCalledTimes(1);

  spy.mockRestore(); // put original Math.random back
});

// Spy on console to suppress noise in tests
test('logs error on failure', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  triggerError();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('failed'));
  consoleSpy.mockRestore();
});` },
    { label: 'jest.mock()', language: 'typescript', code:
`// userService.ts
export const getUser = async (id: number) => ({ id, name: 'Alice' });

// userService.test.ts
import { getUser } from './userService';
import { ProfileComponent } from './profile';

jest.mock('./userService'); // hoisted — auto-mocks all exports

const mockGetUser = jest.mocked(getUser);

beforeEach(() => {
  mockGetUser.mockResolvedValue({ id: 1, name: 'Bob' }); // controlled response
});

test('profile displays user name', async () => {
  const profile = new ProfileComponent();
  await profile.load(1);
  expect(profile.userName).toBe('Bob');
  expect(mockGetUser).toHaveBeenCalledWith(1);
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Not clearing mocks between tests', wrong: 'const mock = jest.fn(); // module-level, never reset', right: 'beforeEach(() => { jest.clearAllMocks(); })', explanation: 'Mock call history accumulates across tests. A test that checks toHaveBeenCalledTimes(1) will fail on the second run.' },
    { title: 'Forgetting to restore spies', wrong: 'jest.spyOn(Date, "now").mockReturnValue(1000)', right: 'afterEach(() => { jest.restoreAllMocks(); })', explanation: 'Without restore, a spy on Date.now bleeds into other tests making them non-deterministic.' },
    { title: 'Using jest.mock() inside a test', wrong: "test('...', () => { jest.mock('./module'); })", right: "jest.mock('./module'); // at module top level", explanation: 'jest.mock() is hoisted to the top by Babel. Inside a test callback it runs too late — the real module has already been imported.' },
    { title: 'Mocking too deeply', wrong: 'mock the network AND the database AND the logger in a single unit test', right: 'mock only the direct dependency of the unit under test', explanation: 'Over-mocking couples tests to implementation details. Mock the boundary (the direct collaborator), not the whole call stack.' },
    { title: 'Checking calls but not order', wrong: "expect(mockA).toHaveBeenCalled(); expect(mockB).toHaveBeenCalled();", right: "const order = jest.fn(); mockA.mockImplementation(() => order('A')); mockB.mockImplementation(() => order('B')); expect(order.mock.calls).toEqual([['A'], ['B']]);", explanation: 'toHaveBeenCalled() does not verify call order. Use a shared call-order mock when sequence matters.' },
  ];

  challenge: Challenge = {
    title: 'Mock an email service',
    language: 'typescript',
    description: 'Write tests for `NotificationService.sendWelcome(email)` which calls `emailClient.send(to, subject, body)`. Mock the emailClient, verify send is called with the correct arguments, and test that errors from emailClient propagate.',
    hints: [
      'Use jest.fn() to create a mock emailClient with a send method.',
      'mockRejectedValue(new Error("SMTP failure")) to test the error path.',
    ],
    starterCode:
`interface EmailClient {
  send: (to: string, subject: string, body: string) => Promise<void>;
}

class NotificationService {
  constructor(private email: EmailClient) {}
  async sendWelcome(to: string) {
    await this.email.send(to, 'Welcome!', 'Thanks for joining.');
  }
}

// Write tests below`,
    solution:
`interface EmailClient {
  send: (to: string, subject: string, body: string) => Promise<void>;
}

class NotificationService {
  constructor(private email: EmailClient) {}
  async sendWelcome(to: string) {
    await this.email.send(to, 'Welcome!', 'Thanks for joining.');
  }
}

describe('NotificationService', () => {
  let mockEmail: { send: jest.Mock };
  let svc: NotificationService;

  beforeEach(() => {
    mockEmail = { send: jest.fn().mockResolvedValue(undefined) };
    svc = new NotificationService(mockEmail);
  });

  test('sends welcome email with correct args', async () => {
    await svc.sendWelcome('user@example.com');
    expect(mockEmail.send).toHaveBeenCalledWith(
      'user@example.com', 'Welcome!', 'Thanks for joining.'
    );
  });

  test('propagates email send errors', async () => {
    mockEmail.send.mockRejectedValue(new Error('SMTP failure'));
    await expect(svc.sendWelcome('user@example.com')).rejects.toThrow('SMTP failure');
  });
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What is the difference between jest.fn() and jest.spyOn()?', options: ['jest.fn() is for classes; spyOn is for functions', 'jest.fn() creates a new standalone mock; spyOn wraps an existing method on an object', 'spyOn is deprecated', 'They are identical'], answer: 1, explanation: 'jest.fn() creates a fresh mock function. jest.spyOn(obj, method) replaces obj.method with a spy that can optionally delegate to the real implementation.' },
    { q: 'How do you make a mock function return a Promise that resolves with { id: 1 }?', options: ['mockReturnValue(Promise.resolve({ id: 1 }))', 'mockResolvedValue({ id: 1 })', 'mockAsync({ id: 1 })', 'Both A and B are correct'], answer: 3, explanation: 'Both work. mockResolvedValue is shorthand for mockReturnValue(Promise.resolve(v)) — prefer it for clarity.' },
    { q: 'What does jest.clearAllMocks() reset?', options: ['Call history only — implementations stay', 'Call history AND implementations', 'It removes all mock functions from memory', 'Nothing — it is a no-op'], answer: 0, explanation: 'clearAllMocks() resets call counts and call arguments but leaves mockReturnValue implementations in place. Use resetAllMocks() to also clear implementations.' },
  { q: 'What is the difference between a stub and a mock?', options: ['They are identical', 'Stubs provide canned responses; mocks also verify interactions occurred', 'Mocks are for async, stubs for sync', 'Stubs are only for databases'], answer: 1, explanation: 'Stubs replace a dependency with a fixed response — no verification. Mocks also verify that specific calls happened (call count, arguments). In Jest: jest.fn() can serve as both.' },
  { q: 'How do you spy on an object method without replacing it?', options: ['jest.fn()', 'jest.spyOn(obj, \'methodName\')', 'jest.mock()', 'jest.stub()'], answer: 1, explanation: 'jest.spyOn(obj, \'method\') wraps the real method to track calls. The original implementation runs unless you chain .mockImplementation(). Restore with jest.restoreAllMocks() in afterEach.' },
  { q: 'When should you use a mock vs a real implementation in tests?', options: ['Always use mocks for speed', 'Use real implementations for core business logic; mock external services and slow I/O', 'Use real implementations only in E2E tests', 'Always prefer mocks over real implementations'], answer: 1, explanation: 'Mock slow or unpredictable dependencies (HTTP, filesystem, DB). Use real implementations for the logic under test — mocking your own code hides bugs. The tradeoff: fast isolation vs realistic behavior.' },
  ];

  qna: QnaItem[] = [
    { q: 'When should I use a spy vs a full mock?', a: 'Use jest.spyOn() when you want to observe calls to a real implementation (e.g. console.error, a utility method). Use jest.fn() when you want full control over the dependency and don\'t want any real code to run.' },
    { q: 'How do I mock only one export from a module?', a: 'After jest.mock("./module"), import the specific export and use jest.mocked() to get typed access. For a partial mock, use jest.mock("./module", () => ({ ...jest.requireActual("./module"), myFn: jest.fn() })) to keep real implementations for everything except myFn.' },
    { q: 'Why does my mock return undefined even though I set mockReturnValue?', a: 'Common causes: (1) You set the return value after the mock was already called, (2) The module was not correctly auto-mocked — check jest.mock() is at the top of the file, (3) The function under test imports the module differently (default vs named export mismatch).' },
  { q: 'How do you reset mock state between tests?', a: 'Options: (1) jest.clearAllMocks(): clears call history, instances, results but keeps mock implementation; (2) jest.resetAllMocks(): also removes mock implementations; (3) jest.restoreAllMocks(): restores spies to original implementations. Configure globally: clearMocks: true in jest.config.js runs clearAllMocks() automatically between tests.' },
  { q: 'How do you mock a module default export?', a: 'jest.mock(\'./module\', () => ({ __esModule: true, default: jest.fn().mockReturnValue(\'mocked\') })). The __esModule: true flag is required for ES module default exports. For named + default: () => ({ __esModule: true, default: jest.fn(), namedExport: jest.fn() }). Without __esModule: true, the default import gets the entire module object.' },
  { q: 'What is the difference between mockReturnValue and mockImplementation?', a: 'mockReturnValue(value): always returns the given value, regardless of arguments. mockResolvedValue(value): returns a resolved Promise. mockImplementation(fn): replaces the mock body with a real function — receives the call arguments and can compute a dynamic return. mockImplementationOnce(fn): returns the custom implementation only for the next call.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Mocking isolates the unit under test — jest.fn() for new mocks, spyOn for existing methods, jest.mock() for whole modules.',
    mustKnow: [
      'jest.fn() creates a standalone mock that records all calls',
      'mockReturnValue/mockResolvedValue controls what the mock returns',
      'jest.spyOn() wraps real methods; always restore with restoreAllMocks()',
      'jest.mock() hoists to the top — cannot be called inside test callbacks',
      'clearAllMocks() resets call history; resetAllMocks() also resets implementations',
      'Mock the direct dependency — not the whole call stack',
    ],
    interviewFocus: [
      'jest.fn() vs jest.spyOn() — when to use each',
      'How to test error paths with mockRejectedValue',
      'Why over-mocking hurts test maintainability',
    ],
  };
}
