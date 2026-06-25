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
  selector: 'app-test-doubles',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './test-doubles.html',
  styleUrl: './test-doubles.scss',
})
export class TestDoubles {
  quickRef: QuickRefItem[] = [
    { name: 'Dummy',   type: 'keyword', desc: 'Passed as a required argument but never used. Satisfies a type signature.' },
    { name: 'Stub',    type: 'keyword', desc: 'Returns canned responses to calls. Doesn\'t assert anything about how it\'s called.' },
    { name: 'Spy',     type: 'keyword', desc: 'Records calls made to it. Can optionally delegate to the real implementation.' },
    { name: 'Mock',    type: 'keyword', desc: 'Pre-programmed with expectations. Verifies interactions — fails if expectations aren\'t met.' },
    { name: 'Fake',    type: 'keyword', desc: 'A working but simplified implementation (e.g. in-memory DB, fake message bus).' },
    { name: 'SUT',     type: 'keyword', desc: 'System Under Test — the class or function being tested.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'The Meszaros Taxonomy', points: [
      'Gerard Meszaros coined "test double" as the umbrella term in "xUnit Test Patterns".',
      'A Dummy is never actually used — just fills a parameter slot the SUT ignores.',
      'A Stub provides controlled indirect inputs — canned return values, no assertions.',
      'A Spy records calls so the test can verify them after the fact.',
      'A Mock is set up with expectations before the call — it self-verifies during the test.',
      'A Fake is a real working (but simplified) implementation — in-memory DB, local file store.',
    ]},
    { heading: 'Stubs vs Mocks', points: [
      'Stubs control STATE: they return preset values so the SUT can proceed.',
      'Mocks verify BEHAVIOUR: they check that specific interactions happened.',
      'Overusing mocks creates brittle tests that break when internal wiring changes, not when behaviour breaks.',
      'Prefer stubs + state assertions (check the output) over mocks (verify internal calls).',
    ]},
    { heading: 'Fakes — the Most Useful Double', points: [
      'A fake has working logic but is simplified (no network, no disk, no latency).',
      'An InMemoryUserRepository that implements IUserRepository is a classic fake.',
      'Fakes are maintained alongside production code — they must stay in sync.',
      'Fakes enable fast integration-style tests without real infrastructure.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Stub & Mock', language: 'typescript', code:
`interface Logger { log(msg: string): void; }
interface PriceService { getPrice(sku: string): number; }

class OrderProcessor {
  constructor(private prices: PriceService, private logger: Logger) {}
  process(sku: string, qty: number): number {
    const price = this.prices.getPrice(sku);
    const total = price * qty;
    this.logger.log(\`Order: \${sku} x\${qty} = \$\{total}\`);
    return total;
  }
}

test('process calculates total (stub for price, dummy for logger)', () => {
  // Stub: returns a canned value, no interaction assertions
  const priceStub: PriceService = { getPrice: () => 10 };
  // Dummy: required by constructor but never meaningfully used here
  const loggerDummy: Logger = { log: () => {} };

  const sut = new OrderProcessor(priceStub, loggerDummy);
  expect(sut.process('WIDGET', 3)).toBe(30);
});

test('process logs order details (mock for logger)', () => {
  const priceStub: PriceService = { getPrice: () => 10 };
  // Mock: pre-programmed expectation
  const loggerMock = { log: jest.fn() };

  new OrderProcessor(priceStub, loggerMock).process('WIDGET', 3);

  expect(loggerMock.log).toHaveBeenCalledWith('Order: WIDGET x3 = 30');
});` },
    { label: 'Fake', language: 'typescript', code:
`interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

// Fake: in-memory implementation — real logic, no database
class InMemoryUserRepository implements UserRepository {
  private store = new Map<string, User>();

  async save(user: User): Promise<void> { this.store.set(user.id, user); }
  async findById(id: string): Promise<User | null> { return this.store.get(id) ?? null; }
}

test('UserService creates and retrieves a user', async () => {
  const repo = new InMemoryUserRepository(); // fake
  const svc  = new UserService(repo);

  await svc.create({ id: '1', name: 'Alice', email: 'alice@example.com' });
  const found = await svc.findById('1');

  expect(found?.name).toBe('Alice');
});` },
    { label: 'Spy', language: 'typescript', code:
`// Spy: records calls, still executes real logic (optional)
const realEmailer = {
  send(to: string, subject: string) { /* would send real email */ },
};

const emailSpy = jest.spyOn(realEmailer, 'send').mockImplementation(() => {});

const notifier = new WelcomeNotifier(realEmailer);
notifier.welcome('alice@example.com');

// Verify interactions after the fact
expect(emailSpy).toHaveBeenCalledTimes(1);
expect(emailSpy).toHaveBeenCalledWith('alice@example.com', 'Welcome!');

emailSpy.mockRestore();` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Using mocks when stubs suffice', wrong: 'verify every internal call with expect(mock).toHaveBeenCalled()', right: 'return a stub value; assert on the output or state', explanation: 'Mocks couple tests to implementation details. If you refactor how a result is produced, mocks break even though behaviour is unchanged.' },
    { title: 'Fake out of sync with production interface', wrong: 'InMemoryRepo implements an old version of IRepository', right: 'update the fake whenever the production interface changes', explanation: 'A stale fake makes tests pass while real code breaks. Keep fakes in the same repository and update them with the interface.' },
    { title: 'Chaining too many doubles', wrong: 'mock A which returns a stub B which has a spy C which calls a fake D', right: 'mock only the direct dependency of the SUT', explanation: 'Deep double chains are a sign the SUT has too many dependencies. Refactor toward smaller units first.' },
    { title: 'Not resetting mocks between tests', wrong: 'const mock = jest.fn(); // shared across tests without reset', right: 'beforeEach(() => { jest.clearAllMocks(); })', explanation: 'Call counts accumulate. A test expecting toHaveBeenCalledTimes(1) fails because a previous test already called it.' },
    { title: 'Confusing a spy with a mock', wrong: 'using jest.spyOn() and then checking mock.calls to verify "pre-programmed expectations"', right: 'spyOn for recording real calls; jest.fn() with expectation for mock behaviour', explanation: 'Spies are observation tools; mocks are verification tools. The terminology matters when explaining test design to a team.' },
  ];

  challenge: Challenge = {
    title: 'Choose and use the right double',
    language: 'typescript',
    description: 'Write tests for `PaymentService.charge(amount, card)` using: (1) a Stub for the payment gateway that returns { success: true }, (2) a Fake for the receipt store that stores in memory, (3) a Spy to verify the receipt was saved.',
    hints: [
      'Stub the gateway with a plain object: { charge: () => ({ success: true }) }.',
      'Implement a tiny InMemoryReceiptStore with save() and getAll() methods.',
    ],
    starterCode:
`interface Gateway { charge(amount: number, card: string): { success: boolean }; }
interface ReceiptStore { save(receipt: object): void; getAll(): object[]; }

class PaymentService {
  constructor(private gw: Gateway, private receipts: ReceiptStore) {}
  charge(amount: number, card: string) {
    const result = this.gw.charge(amount, card);
    if (result.success) this.receipts.save({ amount, card, at: Date.now() });
    return result;
  }
}

// Write tests here`,
    solution:
`interface Gateway { charge(amount: number, card: string): { success: boolean }; }
interface ReceiptStore { save(receipt: object): void; getAll(): object[]; }

class PaymentService {
  constructor(private gw: Gateway, private receipts: ReceiptStore) {}
  charge(amount: number, card: string) {
    const result = this.gw.charge(amount, card);
    if (result.success) this.receipts.save({ amount, card, at: Date.now() });
    return result;
  }
}

class InMemoryReceiptStore implements ReceiptStore {
  private store: object[] = [];
  save(r: object) { this.store.push(r); }
  getAll() { return [...this.store]; }
}

test('charge saves receipt on success', () => {
  const gwStub: Gateway = { charge: jest.fn().mockReturnValue({ success: true }) };
  const fakeStore = new InMemoryReceiptStore();
  const saveSpy = jest.spyOn(fakeStore, 'save');

  const svc = new PaymentService(gwStub, fakeStore);
  svc.charge(50, '4111');

  expect(saveSpy).toHaveBeenCalledTimes(1);
  expect(fakeStore.getAll()).toHaveLength(1);
  expect((fakeStore.getAll()[0] as any).amount).toBe(50);
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What distinguishes a Mock from a Stub?', options: ['Mocks are faster', 'Stubs verify calls; mocks return values', 'Mocks are pre-programmed with expectations and self-verify; stubs only return values', 'They are the same thing'], answer: 2, explanation: 'A stub provides canned return values (controls state). A mock is pre-configured with expectations and fails the test if those expectations are not met (verifies behaviour).' },
    { q: 'When is a Fake the best choice?', options: ['When you need to verify exact call order', 'When a real dependency is expensive but you need realistic behaviour (e.g. in-memory DB)', 'When the dependency has no side effects', 'When you want to suppress all output'], answer: 1, explanation: 'Fakes provide real working logic without the infrastructure cost. An in-memory repository is a classic fake — it behaves like the real thing but stays in-process.' },
    { q: 'Why should you prefer stubs over mocks in most tests?', options: ['Stubs are faster to write', 'Mocks are deprecated in modern testing frameworks', 'Mocks couple tests to implementation; stubs let you assert on observable output instead', 'Stubs provide better type safety'], answer: 2, explanation: 'Mocks verify HOW a result is produced (internal interactions). Stubs let you verify WHAT the result is (output). Tests based on output are more resilient to refactoring.' },
  ];

  qna: QnaItem[] = [
    { q: 'Is jest.fn() a stub, mock, or spy?', a: 'It can be any of them depending on how you use it. As a stub: jest.fn().mockReturnValue(42). As a spy: jest.spyOn(obj, "method"). As a mock: jest.fn() + expect(fn).toHaveBeenCalledWith(x). The Meszaros taxonomy describes intent; jest.fn() is a flexible tool that implements all of them.' },
    { q: 'When should I use a Fake instead of a Mock?', a: 'Use a Fake when you want realistic behaviour without real infrastructure — e.g. an in-memory database. Use a Mock when you specifically need to verify that a particular interaction occurred (e.g. an email was sent with specific arguments). Fakes are more maintainable for integration-style tests; mocks are better for strict interaction verification.' },
    { q: 'What is a Dummy and when do I actually need one?', a: 'A Dummy is an argument that satisfies a constructor parameter but is never called in the test. You need one when a constructor requires a logger, configuration, or other dependency that your test doesn\'t exercise. Pass null or a no-op object. In TypeScript, cast to the interface: `null as unknown as Logger`.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Test doubles replace real dependencies: stubs return values, mocks verify calls, fakes have working logic, spies record calls.',
    mustKnow: [
      'Dummy: fills parameter slots, never used',
      'Stub: canned return values, no assertions',
      'Spy: records calls; may delegate to real implementation',
      'Mock: pre-programmed expectations, self-verifies',
      'Fake: real working logic (in-memory), no infrastructure',
      'Prefer stubs + output assertions over mocks for resilient tests',
    ],
    interviewFocus: [
      'Difference between stub and mock — state vs behaviour verification',
      'When to use a Fake (realistic in-memory replacement)',
      'Why over-mocking leads to brittle tests',
    ],
  };
}
