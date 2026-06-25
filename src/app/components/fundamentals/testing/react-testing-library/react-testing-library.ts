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
  selector: 'app-react-testing-library',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './react-testing-library.html',
  styleUrl: './react-testing-library.scss',
})
export class ReactTestingLibrary {
  quickRef: QuickRefItem[] = [
    { name: 'render()',          type: 'function', desc: 'Renders a React component into a jsdom container and returns query helpers.' },
    { name: 'getByRole()',       type: 'function', desc: 'Queries by ARIA role — the most accessible and recommended query.' },
    { name: 'getByText()',       type: 'function', desc: 'Queries by visible text content.' },
    { name: 'getByLabelText()',  type: 'function', desc: 'Queries a form control by its label — mirrors how users find inputs.' },
    { name: 'findBy*()',         type: 'function', desc: 'Async version of getBy — waits for element to appear (returns Promise).' },
    { name: 'userEvent',        type: 'keyword',  desc: 'Simulates real user interactions (click, type, tab) — preferred over fireEvent.' },
    { name: 'screen',           type: 'keyword',  desc: 'Global query object — screen.getByRole() reads from the rendered document.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'The Core Philosophy', points: [
      'Test what the user sees and does — not internal state or implementation details.',
      '"The more your tests resemble the way your software is used, the more confidence they give you." — Kent C. Dodds',
      'Query by role and label (accessibility-first) — not by className or component internals.',
      'If a test breaks on refactoring without a real regression, the test was wrong.',
    ]},
    { heading: 'Query Priority', points: [
      '1. getByRole() — mirrors accessibility tree; works for buttons, headings, inputs, checkboxes.',
      '2. getByLabelText() — for form fields; queries by the associated <label>.',
      '3. getByPlaceholderText() — only if label is absent.',
      '4. getByText() — for non-interactive elements like paragraphs.',
      '5. getByTestId() — last resort; add data-testid when no semantic query works.',
    ]},
    { heading: 'Synchronous vs Async Queries', points: [
      'getBy*: throws immediately if not found — for elements that must be in the DOM already.',
      'queryBy*: returns null if not found — use for asserting absence.',
      'findBy*: returns a Promise — waits up to 1 second for the element to appear.',
      'waitFor(() => ...): retries until the assertion passes or timeout — for side effects.',
    ]},
    { heading: 'userEvent vs fireEvent', points: [
      'userEvent simulates real browser interactions: focus, keydown, input, keyup, blur in sequence.',
      'fireEvent dispatches a single synthetic DOM event — no browser-like side effects.',
      'Always prefer userEvent — it catches bugs fireEvent misses (e.g. validation triggered by blur).',
      'Setup with userEvent.setup() in beforeEach for accuracy with pointers and timers.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Basic Render', language: 'typescript', code:
`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Counter } from './Counter';

test('counter increments on click', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  // Query by accessible role
  const button = screen.getByRole('button', { name: /increment/i });
  const count  = screen.getByRole('status');

  expect(count).toHaveTextContent('0');

  await user.click(button);

  expect(count).toHaveTextContent('1');
});` },
    { label: 'Form Testing', language: 'typescript', code:
`import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

test('submits with email and password', async () => {
  const onSubmit = jest.fn();
  const user     = userEvent.setup();
  render(<LoginForm onSubmit={onSubmit} />);

  // Query by label — mirrors how users find inputs
  await user.type(screen.getByLabelText(/email/i), 'alice@example.com');
  await user.type(screen.getByLabelText(/password/i), 'secret');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'alice@example.com',
    password: 'secret',
  });
});

test('shows error when email is blank', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={jest.fn()} />);

  await user.click(screen.getByRole('button', { name: /sign in/i }));

  expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
});` },
    { label: 'Async / findBy', language: 'typescript', code:
`import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from './UserProfile';
import * as api from './api';

jest.mock('./api');
const mockGetUser = jest.mocked(api.getUser);

test('displays user name after fetch', async () => {
  mockGetUser.mockResolvedValue({ id: 1, name: 'Alice' });
  render(<UserProfile userId={1} />);

  // findByRole waits for the element to appear
  const heading = await screen.findByRole('heading', { name: /alice/i });
  expect(heading).toBeInTheDocument();
});

test('shows loading state initially', () => {
  mockGetUser.mockResolvedValue({ id: 1, name: 'Alice' });
  render(<UserProfile userId={1} />);

  expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
});` },
    { label: 'Asserting Absence', language: 'typescript', code:
`import { render, screen } from '@testing-library/react';
import { Modal } from './Modal';

test('modal is not shown by default', () => {
  render(<Modal />);
  // queryBy returns null instead of throwing
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('modal appears on open', async () => {
  const user = userEvent.setup();
  render(<Modal />);

  await user.click(screen.getByRole('button', { name: /open/i }));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Querying by className or test-id first', wrong: 'screen.getByClassName("submit-btn")', right: 'screen.getByRole("button", { name: /submit/i })', explanation: 'Class names change during refactoring without breaking user behaviour. Role-based queries match what the accessibility tree exposes — more stable and more meaningful.' },
    { title: 'Using getBy* for async elements', wrong: 'render(<Async />); screen.getByText("Loaded")', right: 'render(<Async />); await screen.findByText("Loaded")', explanation: 'getBy throws immediately. For elements that appear after a fetch or timer, use findBy which polls until the element appears.' },
    { title: 'Using fireEvent instead of userEvent', wrong: 'fireEvent.click(button)', right: 'const user = userEvent.setup(); await user.click(button)', explanation: 'fireEvent dispatches one event. userEvent simulates the full interaction chain (focus, pointer, click, blur) — tests are more realistic.' },
    { title: 'Testing implementation (props / state) not behaviour', wrong: 'expect(wrapper.state().isOpen).toBe(true)', right: 'expect(screen.getByRole("dialog")).toBeInTheDocument()', explanation: 'Internal state changes without breaking user experience. Test the visible outcome, not how the component stores it.' },
    { title: 'Not wrapping state updates in act()', wrong: 'button.click(); expect(screen.getByText("1"))', right: 'await user.click(button); expect(screen.getByText("1"))', explanation: 'userEvent methods are async and wrap state updates in act() automatically. Skipping await can cause act() warnings and flaky assertions.' },
  ];

  challenge: Challenge = {
    title: 'Test a search input component',
    language: 'typescript',
    description: 'Write RTL tests for a SearchBox component with an input and a results list. Test: (1) input accepts text, (2) results appear after typing, (3) clearing the input hides results.',
    hints: [
      'Use getByRole("searchbox") or getByLabelText() to find the input.',
      'Use findByRole("listitem") for async results, queryByRole() to assert absence.',
    ],
    starterCode:
`// SearchBox renders: <input type="search" aria-label="Search" />
// After typing 2+ chars it shows <ul role="list"><li>...</li></ul>
// Clearing input removes the list

test('shows results after typing', async () => {
  const user = userEvent.setup();
  render(<SearchBox items={['Apple', 'Apricot', 'Banana']} />);
  // write assertions here
});

test('hides results when input is cleared', async () => {
  const user = userEvent.setup();
  render(<SearchBox items={['Apple', 'Apricot']} />);
  // write assertions here
});`,
    solution:
`test('shows results after typing', async () => {
  const user = userEvent.setup();
  render(<SearchBox items={['Apple', 'Apricot', 'Banana']} />);

  await user.type(screen.getByLabelText(/search/i), 'ap');

  const items = await screen.findAllByRole('listitem');
  expect(items.length).toBe(2); // Apple, Apricot
});

test('hides results when input is cleared', async () => {
  const user = userEvent.setup();
  render(<SearchBox items={['Apple', 'Apricot']} />);

  await user.type(screen.getByLabelText(/search/i), 'ap');
  await screen.findAllByRole('listitem'); // wait for results

  await user.clear(screen.getByLabelText(/search/i));

  expect(screen.queryByRole('list')).not.toBeInTheDocument();
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'Which query should you prefer when testing a submit button?', options: ['getByClassName("submit-btn")', 'getByTestId("submit")', 'getByRole("button", { name: /submit/i })', 'getBySelector("button[type=submit]")'], answer: 2, explanation: 'getByRole mirrors the accessibility tree and matches how screen readers find the element. It is more stable than class names and more meaningful than test IDs.' },
    { q: 'When should you use findBy* instead of getBy*?', options: ['When querying by role', 'When the element appears asynchronously (after a fetch or timer)', 'When the element might not exist', 'When you need case-insensitive matching'], answer: 1, explanation: 'findBy* returns a Promise and retries until the element appears or times out. Use it for elements that load after async operations. Use queryBy* to assert an element is absent.' },
    { q: 'Why is userEvent preferred over fireEvent?', options: ['userEvent is faster', 'userEvent simulates real browser interaction sequences including focus, input, and blur events', 'fireEvent does not work with React 18', 'They are equivalent — preference is stylistic'], answer: 1, explanation: 'fireEvent dispatches a single synthetic event. userEvent simulates the full sequence of events a real user triggers, catching bugs that fireEvent misses (e.g. validation on blur).' },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between screen.getByRole and within(element).getByRole?', a: 'screen queries the entire rendered document. within(element) scopes queries to a specific container — useful when the same role appears multiple times and you need to query inside a specific section (e.g. inside a modal or a table row).' },
    { q: 'How do I mock a fetch/API call in RTL tests?', a: 'Use jest.mock() to mock the fetch module or service, or use MSW (Mock Service Worker) to intercept HTTP at the network level. MSW is preferred — it works identically in tests, browser, and E2E, and you mock the API contract rather than the implementation.' },
    { q: 'Should I use React Testing Library with Vitest or Jest?', a: 'RTL works with both. Vitest is faster (native ESM, no transpilation) and Jest-compatible (same describe/it/expect API). For new projects, Vitest + RTL is the modern choice. For existing Jest projects, keep Jest — the migration cost rarely pays off immediately.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'React Testing Library: render components, query by role/label, interact with userEvent, assert on DOM — test behaviour, not internals.',
    mustKnow: [
      'render() renders the component; screen.* queries the document',
      'Query priority: getByRole > getByLabelText > getByText > getByTestId',
      'getBy throws; queryBy returns null; findBy is async (Promise)',
      'userEvent.setup() + await user.click/type — always prefer over fireEvent',
      'Test what the user sees — never test internal state or className',
      'findBy* for elements that appear after async operations',
    ],
    interviewFocus: [
      'Why role-based queries produce more resilient tests',
      'userEvent vs fireEvent — interaction realism',
      'getBy vs findBy vs queryBy — when to use each',
    ],
  };
}
