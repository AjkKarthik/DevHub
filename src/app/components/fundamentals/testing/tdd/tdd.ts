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
  selector: 'app-tdd-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './tdd.html',
  styleUrl: './tdd.scss',
})
export class TddTesting {
  quickRef: QuickRefItem[] = [
    { name: 'Red',          type: 'keyword', desc: 'Write a failing test for the next small piece of behaviour.' },
    { name: 'Green',        type: 'keyword', desc: 'Write the minimum code needed to make the test pass.' },
    { name: 'Refactor',     type: 'keyword', desc: 'Improve code structure while keeping all tests green.' },
    { name: 'YAGNI',        type: 'keyword', desc: 'You Aren\'t Gonna Need It — TDD discourages speculative code.' },
    { name: 'Outside-in',   type: 'keyword', desc: 'Start with acceptance/E2E test, then unit tests for inner layers.' },
    { name: 'Inside-out',   type: 'keyword', desc: 'Start with unit tests for core logic, then integrate outward.' },
    { name: 'Test list',    type: 'keyword', desc: 'Write all scenarios you need to handle before starting the first Red step.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'The Red-Green-Refactor Cycle', points: [
      'Red: write a test that describes the next behaviour. It must fail — if it passes, the behaviour already exists.',
      'Green: write the MINIMUM code to make the test pass. Hardcode if necessary — correctness comes later.',
      'Refactor: clean up duplication, improve names, extract methods — without changing behaviour (tests protect you).',
      'Each cycle is tiny — minutes, not hours. Small cycles give fast feedback and force incremental design.',
    ]},
    { heading: 'TDD Shapes Design', points: [
      'Writing tests first forces you to design the API from the caller\'s perspective.',
      'Hard-to-test code is hard-to-use code — TDD surfaces coupling and complexity early.',
      'Injecting dependencies becomes natural because you need to substitute them in tests.',
      'Functions tend to be smaller and more focused — each test targets one responsibility.',
    ]},
    { heading: 'Outside-in vs Inside-out TDD', points: [
      'Outside-in (London school): start with a failing acceptance test, mock collaborators, then unit-test each collaborator.',
      'Inside-out (Chicago school): start with the core domain logic, build up without mocks, integrate at the end.',
      'Outside-in produces mock-heavy tests that document intent. Inside-out produces tests that rely on real collaborators.',
      'Both are valid — choose based on whether you know the domain logic or the user journey first.',
    ]},
    { heading: 'When to Apply TDD', points: [
      'Best for: business logic, algorithms, parsers, state machines — any well-defined behaviour.',
      'Harder for: UI components (use testing-library after-the-fact), infrastructure glue code.',
      'TDD is most valuable when the problem is not yet fully understood — tests become the specification.',
      'Even without strict TDD, writing a test before debugging a bug (regression test) is always worthwhile.',
    ]},
    { heading: 'Why Red-Green-Refactor Order Matters', points: [
      'Writing the test first (red) forces thinking about the desired behavior and API shape before implementation exists, often producing cleaner, more usable interfaces than designing the implementation first and retrofitting tests.',
      'Watching a new test actually fail (red) before making it pass confirms the test is genuinely exercising the intended code path — a test that passes immediately without any implementation change may be silently testing nothing.',
      'The refactor step (cleaning up code while tests stay green) is not optional — skipping it accumulates technical debt just as surely as skipping tests entirely, since TDD\'s safety net only pays off if refactoring actually happens.',
      'TDD\'s tight feedback loop (seconds between writing code and knowing if it works) catches mistakes immediately, while writing tests after the fact loses this immediacy and often results in tests that merely confirm existing behavior rather than driving design.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Red Step', language: 'typescript', code:
`// Step 1: RED — write a failing test
// We want a StringCalculator.add() that sums comma-separated numbers

test('add returns 0 for empty string', () => {
  const calc = new StringCalculator();
  expect(calc.add('')).toBe(0);
});

// This fails: StringCalculator does not exist yet.
// DO NOT write StringCalculator before this test.` },
    { label: 'Green Step', language: 'typescript', code:
`// Step 2: GREEN — write the minimum code to pass

class StringCalculator {
  add(numbers: string): number {
    if (numbers === '') return 0;     // hardcoded — that is fine for now
    return 0;
  }
}

// Test passes. Now write the next failing test:
test('add returns number for single value', () => {
  expect(new StringCalculator().add('5')).toBe(5);
});

// Fails again — extend the implementation minimally:
class StringCalculator2 {
  add(numbers: string): number {
    if (numbers === '') return 0;
    return parseInt(numbers, 10);    // handles single number
  }
}` },
    { label: 'Refactor Step', language: 'typescript', code:
`// After Green for: '', '5', '1,2', '1,2,3'
// Full passing implementation — still minimal:

class StringCalculator {
  add(numbers: string): number {
    if (numbers === '') return 0;
    return numbers.split(',').reduce((sum, n) => sum + parseInt(n, 10), 0);
  }
}

// Refactor: extract a parse helper — tests still pass
class StringCalculatorRefactored {
  add(numbers: string): number {
    if (numbers === '') return 0;
    return this.parse(numbers).reduce((a, b) => a + b, 0);
  }

  private parse(numbers: string): number[] {
    return numbers.split(',').map(n => parseInt(n, 10));
  }
}

// Tests are the safety net for this refactor — run them after every change.` },
    { label: 'Outside-in', language: 'typescript', code:
`// Outside-in: start with the acceptance test
test('user can register and receive welcome email', async () => {
  const emailSpy = jest.fn();
  const app = new App({ emailClient: { send: emailSpy } });

  await app.register({ email: 'alice@example.com', password: 'secret' });

  expect(emailSpy).toHaveBeenCalledWith(
    'alice@example.com',
    'Welcome!',
    expect.stringContaining('Alice')
  );
});

// This test drives you to build App → UserService → EmailService
// each with their own unit tests, collaborators mocked` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Writing multiple tests before any code', wrong: 'write 10 failing tests then implement', right: 'one failing test → pass it → refactor → next test', explanation: 'TDD works in tiny cycles. Writing many tests first turns it into test-last with extra steps and a large compilation backlog.' },
    { title: 'Skipping the refactor step', wrong: 'Red → Green → Red → Green (never refactor)', right: 'Red → Green → Refactor before the next Red', explanation: 'Without refactoring, TDD produces test-driven spaghetti. The refactor step is not optional — it is what keeps the design clean.' },
    { title: 'Writing too-large tests', wrong: 'test("user registration flow", () => { /* 50 lines */ })', right: 'one assertion per test; one behaviour per test', explanation: 'A large test that tests multiple behaviours makes it hard to identify which behaviour broke. Each test should have one reason to fail.' },
    { title: 'Not running tests after each change', wrong: 'write 5 lines then run tests', right: 'run after every one-line change during the Green step', explanation: 'The cycle only gives fast feedback if you run tests constantly. Many IDEs support auto-run on save.' },
    { title: 'Hardcoding forever', wrong: 'return 5; // hardcoded, never generalised', right: 'hardcode to go Green, then write the NEXT test that forces generalisation', explanation: 'Hardcoding is correct in the Green step — but you must write the next test that forces real implementation. Hardcoding is a temporary scaffold, not a destination.' },
  ];

  challenge: Challenge = {
    title: 'TDD a FizzBuzz function',
    language: 'typescript',
    description: 'Use TDD (one test at a time) to build fizzBuzz(n): returns "Fizz" for multiples of 3, "Buzz" for multiples of 5, "FizzBuzz" for multiples of both, and the number as a string otherwise. Write tests one at a time in the Red-Green-Refactor cycle.',
    hints: [
      'Start with the simplest case: fizzBuzz(1) === "1".',
      'Add tests one at a time: divisible by 3, then by 5, then by 15.',
    ],
    starterCode:
`function fizzBuzz(n: number): string {
  // implement via TDD — add tests one at a time below
  return '';
}

test('returns number as string for 1', () => {
  expect(fizzBuzz(1)).toBe('1');
});`,
    solution:
`function fizzBuzz(n: number): string {
  if (n % 15 === 0) return 'FizzBuzz';
  if (n % 3 === 0) return 'Fizz';
  if (n % 5 === 0) return 'Buzz';
  return String(n);
}

test('returns number as string for 1', () => { expect(fizzBuzz(1)).toBe('1'); });
test('returns Fizz for 3', () => { expect(fizzBuzz(3)).toBe('Fizz'); });
test('returns Buzz for 5', () => { expect(fizzBuzz(5)).toBe('Buzz'); });
test('returns FizzBuzz for 15', () => { expect(fizzBuzz(15)).toBe('FizzBuzz'); });
test('returns Fizz for 9', () => { expect(fizzBuzz(9)).toBe('Fizz'); });
test('returns Buzz for 10', () => { expect(fizzBuzz(10)).toBe('Buzz'); });`,
  };

  quiz: QuizQuestion[] = [
    { q: 'In TDD, what should you do in the "Green" step?', options: ['Write the cleanest possible implementation', 'Write the minimum code to make the test pass — even if hardcoded', 'Refactor the existing code', 'Write additional tests to increase coverage'], answer: 1, explanation: 'Green means "make the test pass by any means." Hardcoding is acceptable. The next test will force you to generalise.' },
    { q: 'What is the primary design benefit of TDD?', options: ['100% test coverage', 'Designing APIs from the caller\'s perspective, which naturally reduces coupling', 'Eliminates the need for code review', 'Produces documentation automatically'], answer: 1, explanation: 'Writing a test before the code forces you to think about how the API will be used. This leads to simpler, less coupled designs.' },
    { q: 'What is "outside-in" TDD?', options: ['Starting with unit tests for core domain logic', 'Starting with an acceptance/E2E test and mocking collaborators, then working inward', 'Running tests from the command line', 'Testing external dependencies first'], answer: 1, explanation: 'Outside-in starts with a high-level acceptance test that drives the design top-down. Collaborators are mocked until they are implemented with their own unit tests.' },
  { q: 'What are the three phases of the TDD cycle?', options: ['Plan, Code, Test', 'Red (failing test), Green (minimal code to pass), Refactor', 'Design, Implement, Deploy', 'Write, Run, Debug'], answer: 1, explanation: 'Red-Green-Refactor: (1) Write a failing test (Red); (2) Write the minimum code to make it pass (Green); (3) Clean up the code without breaking tests (Refactor). This short cycle drives incremental, test-driven design.' },
  { q: 'What is the "transformation priority premise" in TDD?', options: ['A rule for prioritizing which tests to write first', 'A guideline that when making a failing test pass, you should prefer the SIMPLEST code transformation available (e.g. constant→variable before adding a conditional), reserving more complex transformations for when simpler ones no longer satisfy new tests', 'A checklist for prioritizing refactoring tasks', 'A rule about test file naming order'], answer: 1, explanation: 'Proposed by Robert C. Martin, the transformation priority premise orders code transformations from simplest (ungeneralize a constant into a variable) to most complex (introduce recursion or iteration), arguing that jumping straight to a complex, general solution before a test forces it produces harder-to-follow, prematurely-generalized code — the TDD cycle should earn each transformation via a genuinely new failing test case.' },
  { q: 'What is the triangulation principle in TDD?', options: ['Using three test frameworks together', 'Adding more specific test cases to drive out the correct general implementation', 'Running tests in three environments', 'Testing three layers simultaneously'], answer: 1, explanation: 'Triangulation: when a test passes with a hardcoded return value, add more test cases with different inputs. This forces generalisation of the implementation — the code must handle all cases, not just the first one.' },
  ];

  qna: QnaItem[] = [
    { q: 'Is TDD always worth the overhead?', a: 'For business logic, parsers, and algorithms — yes, the upfront cost pays off quickly in fewer bugs and easier refactoring. For glue code, configuration, or simple CRUD with no logic, the overhead may exceed the benefit. Apply TDD where behaviour is complex or critical.' },
    { q: 'What is the difference between TDD and BDD?', a: 'TDD focuses on the developer\'s view of correctness (unit tests). BDD (Behaviour-Driven Development) extends TDD toward a shared language with stakeholders — tests are written in Given/When/Then format (e.g. Cucumber, SpecFlow). BDD is TDD with a stakeholder-readable layer on top.' },
    { q: 'Can I do TDD with existing untested code?', a: 'Yes — the approach is called "characterisation testing." Write tests that document the current (possibly buggy) behaviour, then refactor. This is safer than changing untested legacy code blind. Michael Feathers\' "Working Effectively with Legacy Code" covers this in depth.' },
  { q: 'How do you apply TDD to a new feature?', a: 'Process: (1) Understand the requirement; (2) Write the simplest failing test: it(\'returns empty array when no items\', () => expect(cart.items()).toEqual([])); (3) Write minimum code to pass; (4) Add next failing test for the next behaviour; (5) Refactor after green. Never write implementation without a failing test first — each test drives one behaviour.' },
  { q: 'What is the difference between TDD and testing-after-the-fact?', a: 'TDD drives design — tests are written before implementation, forcing you to think about the public API. Testing after-the-fact verifies existing code — often reveals that code is hard to test (tightly coupled, hidden dependencies), but the design is already done. TDD prevents this by making testability a first-class concern from the start. Tests also serve as living documentation of intended behaviour.' },
  { q: 'How do you handle database or external service dependencies in TDD?', a: 'Inject dependencies and mock them in unit tests: class OrderService { constructor(private db: OrderRepository) {} }. In tests: pass a mock/stub. This keeps the TDD cycle fast (no I/O). Write integration tests separately to verify the real repository works. The TDD cycle (Red-Green-Refactor) must stay under 30 seconds to maintain flow.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TDD: Red (write failing test) → Green (minimum code to pass) → Refactor — repeated in tiny cycles.',
    mustKnow: [
      'Red: write one failing test for one behaviour',
      'Green: write the minimum code to pass — hardcoding is ok',
      'Refactor: clean up while tests stay green',
      'TDD forces API design from the caller\'s perspective',
      'Outside-in: acceptance test first, mock collaborators',
      'Inside-out: domain logic first, integrate later',
    ],
    interviewFocus: [
      'The Red-Green-Refactor cycle and why each step matters',
      'Design benefits of TDD beyond test coverage',
      'Outside-in vs inside-out TDD trade-offs',
    ],
  };
}
