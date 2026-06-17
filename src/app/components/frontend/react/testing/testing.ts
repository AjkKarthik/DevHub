import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-testing',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './testing.html',
  styleUrl: './testing.scss',
})
export class ReactTesting {
  quickRef: QuickRefItem[] = [
    { name: 'render(<Comp />)',               type: 'function', desc: 'Mount a component into a test DOM. Returns queries bound to the rendered output.' },
    { name: 'screen.getByRole(role, opts)',   type: 'function', desc: 'Find element by ARIA role. Most resilient query — use as default. Fails if not found.' },
    { name: 'screen.queryByRole(role)',       type: 'function', desc: 'Like getBy but returns null instead of throwing. Use to assert absence.' },
    { name: 'screen.findByRole(role)',        type: 'function', desc: 'Async version — polls until found or times out. Use after user events that trigger async updates.' },
    { name: 'userEvent.click(element)',       type: 'function', desc: 'Simulates a real click with pointer events, focus, and keyboard. Prefer over fireEvent.click.' },
    { name: 'userEvent.type(el, text)',       type: 'function', desc: 'Types text character-by-character, triggering real keyboard events.' },
    { name: 'waitFor(() => assertion)',       type: 'function', desc: 'Retry assertion until it passes or times out. Use for async state updates.' },
    { name: 'vi.fn() / jest.fn()',            type: 'function', desc: 'Create a spy function. Use .mockResolvedValue() for async, .mockReturnValue() for sync.' },
    { name: 'msw http.get(url, resolver)',    type: 'function', desc: 'Intercept a fetch/axios request at the network level. No module mocking needed.' },
    { name: 'describe / it / expect',        type: 'function', desc: 'Test structure: describe groups, it describes one behaviour, expect asserts outcome.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Testing philosophy — behaviour, not implementation',
      points: [
        '<strong>Test what the user sees and does, not how the component is implemented.</strong> Query by role, label, or text — not by class name, data-testid, or component structure. Tests written this way survive refactors.',
        '<strong>React Testing Library (RTL)</strong> is the standard for component tests. It renders into a real DOM (jsdom) and provides human-centric queries. It intentionally does not expose component internals — no instance, no state access.',
        '<strong>Vitest</strong> is the modern test runner for Vite-based projects (Vite + React). Jest is the classic alternative for CRA/Next.js. Both work with RTL; the APIs are nearly identical. Vitest is significantly faster.',
        '<strong>Test pyramid for React:</strong> unit tests for pure functions and hooks (use renderHook); component tests for individual components with RTL; integration tests for multi-component flows; minimal E2E with Playwright or Cypress for critical paths.',
      ],
    },
    {
      heading: 'Queries — choosing the right one',
      points: [
        '<strong>Priority order (RTL docs):</strong> getByRole > getByLabelText > getByPlaceholderText > getByText > getByDisplayValue > getByAltText > getByTitle > getByTestId. Use getByRole as the default — it tests accessibility too.',
        '<strong>getBy vs queryBy vs findBy:</strong> getBy throws if not found (good for assertions that something IS there); queryBy returns null (use for assertions something is NOT there); findBy is async/awaitable (use after async operations).',
        '<strong>within(element)</strong> scopes queries to a subtree: <code>const row = screen.getByRole("row", { name: /Alice/ }); within(row).getByRole("button", { name: "Delete" })</code>. Avoids ambiguous matches in complex UIs.',
        '<strong>data-testid as last resort.</strong> Use when there is genuinely no accessible query — e.g., a decorative icon with no text or role. Remove it as soon as accessible markup is added. Never use class names or component names as selectors.',
      ],
    },
    {
      heading: 'userEvent — simulating real user interactions',
      points: [
        '<strong>userEvent.setup()</strong> creates a user session that persists across interactions: <code>const user = userEvent.setup()</code>, then <code>await user.click(button)</code>. This is the v14 API — prefer over the old static userEvent.click().',
        '<strong>userEvent vs fireEvent:</strong> userEvent simulates the full browser event sequence — pointer events, focus, keydown/up, input, change, blur. fireEvent dispatches a single synthetic event. Always prefer userEvent for realistic tests.',
        '<strong>Async by default:</strong> userEvent methods return Promises. Always await them: <code>await user.type(input, "hello")</code>. Not awaiting leads to flaky tests where assertions run before the DOM updates.',
        '<strong>Common user actions:</strong> click, dblClick, type, clear, selectOptions, upload (file inputs), keyboard (special keys like Tab/Enter/Escape), hover, paste.',
      ],
    },
    {
      heading: 'MSW — mocking APIs at the network layer',
      points: [
        '<strong>MSW (Mock Service Worker)</strong> intercepts fetch and XHR at the network level using a Service Worker in the browser and a Node.js interceptor in tests. Your component code is unchanged — no module mocking, no jest.mock("axios").',
        '<strong>Setup:</strong> define handlers with <code>http.get(url, resolver)</code> or <code>http.post</code>; create a server with <code>setupServer(...handlers)</code>; call <code>server.listen()</code> in beforeAll and <code>server.resetHandlers()</code> in afterEach.',
        '<strong>Per-test overrides:</strong> use <code>server.use(http.get(url, resolver))</code> inside a test to temporarily override the default handler — e.g., to test error states. The override is reset by resetHandlers() in afterEach.',
        '<strong>MSW vs jest.mock:</strong> MSW tests the actual fetch call made by your code (correct URL, method, body). jest.mock replaces a module — it tests that a specific function was called, but cannot catch URL typos or wrong HTTP methods.',
      ],
    },
    {
      heading: 'Testing hooks with renderHook',
      points: [
        '<strong>renderHook</strong> mounts a hook in a minimal wrapper and gives you access to its return value: <code>const { result } = renderHook(() => useCounter(0))</code>. Access the return value via <code>result.current</code>.',
        '<strong>act() for state updates:</strong> when calling a hook function that triggers state changes, wrap in <code>act()</code>: <code>act(() => result.current.increment())</code>. RTL\'s userEvent and most RTL utilities wrap act() automatically.',
        '<strong>Wrapper prop for context-dependent hooks:</strong> pass a <code>wrapper</code> component to renderHook to provide context: <code>renderHook(() => useUser(), { wrapper: UserProvider })</code>.',
        '<strong>Testing async hooks:</strong> use <code>await waitFor(() => expect(result.current.data).toBeDefined())</code> to poll until the hook\'s async operation completes. Never set arbitrary timeouts.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Component test (RTL)',
      language: 'typescript',
      code: `// src/components/SearchBox.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
  it('calls onSearch with trimmed query when form is submitted', async () => {
    const user    = userEvent.setup();
    const onSearch = vi.fn();

    render(<SearchBox onSearch={onSearch} placeholder="Search products…" />);

    const input  = screen.getByRole('textbox');          // accessible role query
    const button = screen.getByRole('button', { name: /search/i });

    await user.type(input, '  react hooks  ');           // includes spaces
    await user.click(button);

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('react hooks'); // trimmed
  });

  it('clears input when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<SearchBox onSearch={vi.fn()} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');

    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('does not call onSearch with empty query', async () => {
    const user    = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBox onSearch={onSearch} />);

    await user.click(screen.getByRole('button', { name: /search/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });
});`,
    },
    {
      label: 'Async component + MSW',
      language: 'typescript',
      code: `// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () =>
    HttpResponse.json([
      { id: 1, name: 'Alice', role: 'admin' },
      { id: 2, name: 'Bob',   role: 'user'  },
    ])
  ),
  http.delete('/api/users/:id', ({ params }) =>
    HttpResponse.json({ deleted: params['id'] })
  ),
];

// src/setup.ts (vitest setup file)
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';
export const server = setupServer(...handlers);
beforeAll(()  => server.listen());
afterEach(()  => server.resetHandlers());
afterAll(()   => server.close());

// src/components/UserList.test.tsx
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../setup';
import { http, HttpResponse } from 'msw';
import { UserList } from './UserList';

describe('UserList', () => {
  it('loads and displays users', async () => {
    render(<UserList />);

    // Loading state visible initially
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for async data
    await screen.findByRole('listitem', { name: /alice/i });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    // Override handler for this test only
    server.use(
      http.get('/api/users', () => HttpResponse.json({ error: 'Server error' }, { status: 500 }))
    );

    render(<UserList />);
    await screen.findByText(/failed to load/i);
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
  });

  it('removes a user after clicking Delete', async () => {
    const user = userEvent.setup();
    render(<UserList />);

    // Wait for list to load
    await screen.findByText('Alice');

    // Scope query to Alice's row
    const rows   = screen.getAllByRole('listitem');
    const aliceRow = rows.find(r => within(r).queryByText('Alice'));
    await user.click(within(aliceRow!).getByRole('button', { name: /delete/i }));

    await waitFor(() => expect(screen.queryByText('Alice')).not.toBeInTheDocument());
  });
});`,
    },
    {
      label: 'renderHook',
      language: 'typescript',
      code: `// src/hooks/useCounter.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('initialises with the provided value', () => {
    const { result } = renderHook(() => useCounter(5));
    expect(result.current.count).toBe(5);
  });

  it('increments the count', () => {
    const { result } = renderHook(() => useCounter(0));
    act(() => result.current.increment());
    expect(result.current.count).toBe(1);
  });

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10));
    act(() => { result.current.increment(); result.current.increment(); });
    expect(result.current.count).toBe(12);
    act(() => result.current.reset());
    expect(result.current.count).toBe(10);  // back to initial, not 0
  });
});

// ──── Hook that needs context ──────────────────────────────────
// src/hooks/useUser.test.tsx
import { renderHook } from '@testing-library/react';
import { UserProvider } from '../context/UserContext';
import { useUser } from './useUser';

it('reads user from context', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <UserProvider value={{ name: 'Alice', role: 'admin' }}>{children}</UserProvider>
  );
  const { result } = renderHook(() => useUser(), { wrapper });
  expect(result.current.name).toBe('Alice');
});

// ──── Async hook ───────────────────────────────────────────────
// src/hooks/useProducts.test.tsx
import { waitFor } from '@testing-library/react';
import { useProducts } from './useProducts';

it('fetches products and returns them', async () => {
  const { result } = renderHook(() => useProducts());
  expect(result.current.loading).toBe(true);

  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.products).toHaveLength(2);
  expect(result.current.products[0].name).toBe('Widget');
});`,
    },
    {
      label: 'Form testing',
      language: 'typescript',
      code: `// src/components/LoginForm.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  async function fillAndSubmit(email: string, password: string) {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), email);
    await user.type(screen.getByLabelText(/password/i), password);
    await user.click(screen.getByRole('button', { name: /sign in/i }));
  }

  it('submits with valid credentials', async () => {
    const onSubmit = vi.fn();
    render(<LoginForm onSubmit={onSubmit} />);
    await fillAndSubmit('alice@example.com', 'correct-password');
    expect(onSubmit).toHaveBeenCalledWith({ email: 'alice@example.com', password: 'correct-password' });
  });

  it('shows validation error for invalid email', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    await fillAndSubmit('not-an-email', 'password123');
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    render(<LoginForm onSubmit={vi.fn()} />);
    await fillAndSubmit('alice@example.com', '123');
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('disables submit button while loading', async () => {
    const onSubmit = vi.fn(() => new Promise<void>(res => setTimeout(res, 500)));
    render(<LoginForm onSubmit={onSubmit} />);
    await fillAndSubmit('alice@example.com', 'password123');
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });
});`,
    },
    {
      label: 'Vitest setup & config',
      language: 'typescript',
      code: `// vite.config.ts (Vitest config co-located with Vite)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,                          // no need to import describe/it/expect
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});

// src/test/setup.ts
import '@testing-library/jest-dom';         // adds .toBeInTheDocument(), .toHaveValue() etc.
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => cleanup());                 // unmount components after each test

// ──── package.json scripts ────────────────────────────────────
// "test":          "vitest",
// "test:run":      "vitest run",
// "test:coverage": "vitest run --coverage",
// "test:ui":       "vitest --ui"          ← browser-based test runner UI

// ──── Install ─────────────────────────────────────────────────
// npm install -D vitest @testing-library/react @testing-library/user-event
//               @testing-library/jest-dom jsdom
//               msw @types/jest
// # Optional: coverage
// npm install -D @vitest/coverage-v8
// # Optional: Vitest UI
// npm install -D @vitest/ui`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Querying by class name or testId when roles exist',
      wrong: `// Brittle — breaks on refactor; tests implementation not behaviour
const button = container.querySelector('.submit-btn');
const input  = screen.getByTestId('email-input');`,
      right: `// Resilient — tests accessible behaviour, survives CSS/markup refactors
const button = screen.getByRole('button', { name: /submit/i });
const input  = screen.getByLabelText(/email/i);`,
      explanation: 'Class names and test IDs test implementation details — they change when you refactor CSS or rename components. Role and label queries test what users actually see and interact with, making tests more resilient and double as accessibility audits.',
    },
    {
      title: 'Not awaiting userEvent actions',
      wrong: `it('types in the search box', () => {
  const user = userEvent.setup();
  user.type(screen.getByRole('textbox'), 'hello');   // not awaited!
  expect(screen.getByRole('textbox')).toHaveValue('hello');  // flaky
});`,
      right: `it('types in the search box', async () => {
  const user = userEvent.setup();
  await user.type(screen.getByRole('textbox'), 'hello');
  expect(screen.getByRole('textbox')).toHaveValue('hello');
});`,
      explanation: 'userEvent methods return Promises — they simulate real browser events asynchronously. Not awaiting them means assertions run before the DOM updates, leading to intermittently failing tests.',
    },
    {
      title: 'Using queryBy to assert something IS present',
      wrong: `// queryBy returns null if not found — this silently passes even if missing
expect(screen.queryByText('Welcome')).toBeTruthy();`,
      right: `// getBy throws a descriptive error if not found — much better failure message
expect(screen.getByText('Welcome')).toBeInTheDocument();`,
      explanation: 'Use getBy to assert something is present — it throws with a helpful message when the element is missing. queryBy is for asserting something is absent: expect(screen.queryByText("Error")).not.toBeInTheDocument().',
    },
    {
      title: 'Mocking modules instead of using MSW for API calls',
      wrong: `// Mocking axios — tests that a function was called, not that the URL is right
vi.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
mockedAxios.get.mockResolvedValueOnce({ data: [{ id: 1 }] });`,
      right: `// MSW intercepts the actual network request — catches URL typos, wrong methods
server.use(
  http.get('/api/products', () => HttpResponse.json([{ id: 1 }]))
);
render(<ProductList />);
await screen.findByText('Product 1');`,
      explanation: 'Module mocking replaces your HTTP client with a fake — a URL typo in your component still passes. MSW intercepts at the network layer, so your component\'s actual fetch call must match the intercepted URL and method.',
    },
    {
      title: 'Testing implementation details (state, refs, methods)',
      wrong: `// Accessing component internals — breaks on any refactor
const { result } = renderHook(() => useCounter());
expect(result.current.__internalState).toBe(0);   // private internal`,
      right: `// Test observable behaviour only
const { result } = renderHook(() => useCounter());
expect(result.current.count).toBe(0);              // public API
act(() => result.current.increment());
expect(result.current.count).toBe(1);`,
      explanation: 'Tests that access private state, implementation details, or component internals become maintenance burdens — any internal refactor breaks them even if behaviour is unchanged. Only test the public API: return values, rendered output, and side effects.',
    },
    {
      title: 'Forgetting to wrap state updates in act()',
      wrong: `it('increments', () => {
  const { result } = renderHook(() => useCounter());
  result.current.increment();    // triggers state update outside act()
  expect(result.current.count).toBe(1);  // warning + potentially stale value
});`,
      right: `it('increments', () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});`,
      explanation: 'React state updates triggered outside act() produce a "not wrapped in act()" warning and may read stale state. Wrap synchronous hook calls that trigger state in act(). For async updates, use await waitFor() — it wraps act() internally.',
    },
  ];

  challenge: Challenge = {
    title: 'Test a Shopping Cart Hook',
    language: 'typescript',
    description: `Write tests for a useCart hook using renderHook. The hook has this API:
- addItem(item: { id: string; name: string; price: number; qty: number }): void
- removeItem(id: string): void
- updateQty(id: string, qty: number): void
- clearCart(): void
- items: CartItem[]
- total: number (sum of price * qty)

Write tests for all these scenarios:
1. Cart starts empty
2. addItem adds an item and updates total
3. Adding an existing item increases its qty
4. removeItem removes the item from items
5. updateQty changes qty and recalculates total
6. clearCart empties the cart
7. total is 0 when cart is empty`,
    hints: [
      'Import renderHook and act from @testing-library/react',
      'Wrap all calls that mutate state in act(() => result.current.methodName(...))',
      'Use result.current.items and result.current.total to read hook state after each action',
      'For "adding existing item increases qty", call addItem twice with the same id',
    ],
    starterCode: `import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

describe('useCart', () => {
  it('starts with empty cart', () => {
    // TODO: renderHook useCart, expect items empty and total 0
  });

  it('adds an item to the cart', () => {
    // TODO: add { id: '1', name: 'Widget', price: 9.99, qty: 1 }
    // expect items.length === 1 and total === 9.99
  });

  it('increases qty when same item is added again', () => {
    // TODO: add item with id '1' twice
    // expect items.length === 1 and items[0].qty === 2
  });

  it('removes an item from the cart', () => {
    // TODO: add item then removeItem
    // expect items is empty
  });

  it('updates qty and recalculates total', () => {
    // TODO: add item with price 10, updateQty to 3
    // expect total === 30
  });

  it('clears all items from the cart', () => {
    // TODO: add items, clearCart, expect empty
  });

  it('returns 0 total for empty cart', () => {
    // TODO: total should be 0 with no items
  });
});`,
    solution: `import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

const WIDGET = { id: '1', name: 'Widget', price: 9.99, qty: 1 };
const GADGET = { id: '2', name: 'Gadget', price: 24.99, qty: 1 };

describe('useCart', () => {
  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('adds an item to the cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem(WIDGET));
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Widget');
    expect(result.current.total).toBeCloseTo(9.99);
  });

  it('increases qty when same item is added again', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(WIDGET); result.current.addItem(WIDGET); });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].qty).toBe(2);
    expect(result.current.total).toBeCloseTo(19.98);
  });

  it('removes an item from the cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem(WIDGET));
    act(() => result.current.removeItem('1'));
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('updates qty and recalculates total', () => {
    const { result } = renderHook(() => useCart());
    act(() => result.current.addItem({ ...WIDGET, price: 10 }));
    act(() => result.current.updateQty('1', 3));
    expect(result.current.items[0].qty).toBe(3);
    expect(result.current.total).toBeCloseTo(30);
  });

  it('clears all items from the cart', () => {
    const { result } = renderHook(() => useCart());
    act(() => { result.current.addItem(WIDGET); result.current.addItem(GADGET); });
    expect(result.current.items).toHaveLength(2);
    act(() => result.current.clearCart());
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
  });

  it('returns 0 total for empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.total).toBe(0);
  });
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the recommended first query to try when writing a React Testing Library test?',
      options: ['getByTestId', 'getByClassName', 'getByRole — most resilient, tests accessibility too', 'getByText'],
      answer: 2,
      explanation: 'RTL\'s query priority: getByRole > getByLabelText > getByPlaceholderText > getByText > ... > getByTestId. getByRole is preferred because it tests accessible behaviour — if your role query works, the component is accessible to screen-reader users.',
    },
    {
      q: 'When should you use queryBy instead of getBy?',
      options: ['Always — queryBy is safer', 'When asserting an element is NOT present (queryBy returns null; getBy throws)', 'For async elements', 'queryBy is deprecated'],
      answer: 1,
      explanation: 'getBy throws a descriptive error when the element is missing — ideal for asserting presence. queryBy returns null — use it for: expect(screen.queryByText("Error")).not.toBeInTheDocument(). If you use queryBy to assert presence, a missing element gives a confusing "cannot read property of null" error.',
    },
    {
      q: 'What is the key advantage of MSW over jest.mock for API testing?',
      options: ['MSW is faster', 'MSW intercepts at the network layer — it catches URL typos, wrong HTTP methods, and missing headers that module mocking cannot', 'MSW works without any setup', 'jest.mock is deprecated'],
      answer: 1,
      explanation: 'jest.mock replaces your HTTP client module with a fake — a URL typo in the component still passes. MSW intercepts the actual network request, so the component\'s fetch call must match the real URL, method, and body structure.',
    },
    {
      q: 'Why must userEvent actions be awaited?',
      options: ['They are synchronous but RTL requires await syntax', 'userEvent simulates real browser event sequences asynchronously — not awaiting causes assertions to run before the DOM updates', 'They modify the component state directly', 'Await is only needed for findBy queries'],
      answer: 1,
      explanation: 'userEvent v14 methods return Promises. Each action (type, click, etc.) fires multiple events sequentially. Not awaiting means the assertion runs before the full event sequence completes, leading to flaky tests that sometimes pass and sometimes fail.',
    },
    {
      q: 'What does the wrapper option in renderHook do?',
      options: ['It wraps the test in a try/catch', 'It provides a React wrapper component (e.g., a Context Provider) that the hook is rendered inside', 'It wraps the hook in a memo', 'It is used for async hooks only'],
      answer: 1,
      explanation: 'When a hook depends on Context, pass a wrapper: renderHook(() => useUser(), { wrapper: UserProvider }). The hook is mounted inside the wrapper, giving it access to the context value.',
    },
    {
      q: 'What does act() do in hook tests?',
      options: ['It logs test activity', 'It wraps state updates so React can process them synchronously before assertions run', 'It mocks async operations', 'It is the same as await'],
      answer: 1,
      explanation: 'act() tells React to process all pending state updates and effects before the function returns. Without it, setState calls inside the function are batched but not flushed — assertions see stale state and React logs a warning.',
    },
    {
      q: 'Which query should you use for elements that appear asynchronously (after a fetch)?',
      options: ['getByRole — it is always preferred', 'queryByRole — it returns null while loading', 'findByRole — it polls until the element appears or times out', 'waitFor with getByRole inside'],
      answer: 2,
      explanation: 'findByRole (and all findBy queries) return a Promise that resolves when the element appears. It polls the DOM repeatedly until found or until the timeout (default 1000ms). waitFor(() => screen.getByRole(...)) is equivalent but more verbose.',
    },
    {
      q: 'What does server.resetHandlers() in afterEach do in MSW tests?',
      options: ['Restarts the MSW server', 'Removes any per-test handler overrides added with server.use(), restoring the default handlers', 'Clears all handlers permanently', 'Resets the response delay to 0'],
      answer: 1,
      explanation: 'server.use() adds temporary handlers that override defaults for one test (e.g., to simulate a 500 error). resetHandlers() removes those temporary overrides in afterEach so each test starts with the default handlers. Without it, one test\'s error override would bleed into subsequent tests.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I test every component?',
      a: 'No — test behaviour, not coverage percentage. Focus tests on: components with complex conditional rendering, multi-step user flows, form validation, error states, and custom hooks with business logic. Skip testing simple wrappers, pure presentational components that only render props, and third-party component usage.',
    },
    {
      q: 'What is the difference between Vitest and Jest?',
      a: 'Vitest is built on Vite — it reuses your Vite config, runs tests via native ES modules, and is typically 2-5x faster than Jest for Vite-based projects. The API is Jest-compatible (same describe/it/expect). Jest is more mature with a larger ecosystem. Use Vitest for new Vite/React projects; Jest for Create React App, Next.js, or when the ecosystem requires it.',
    },
    {
      q: 'When should I write E2E tests vs component tests?',
      a: 'E2E tests (Playwright, Cypress) cover full user journeys across multiple pages with a real browser — checkout flow, login + redirect, multi-step form. Component tests cover individual component behaviour in isolation. Rule of thumb: E2E for the 3-5 most critical user paths; component tests for everything else. E2E is slow and brittle — use sparingly.',
    },
    {
      q: 'How do I test a component that uses TanStack Query?',
      a: 'Wrap the rendered component in a QueryClientProvider with a fresh QueryClient per test (avoid sharing cache between tests). Use MSW to mock the server responses. After render, await findBy... to wait for the loading state to resolve. Set retry: false in the QueryClient config for tests to prevent retries on MSW error responses.',
    },
    {
      q: 'How do I test custom hooks that use Context?',
      a: 'Pass a wrapper to renderHook: const wrapper = ({ children }) => <MyProvider>{children}</MyProvider>; then renderHook(() => useMyHook(), { wrapper }). The hook runs inside the provider and receives the context value. To test different context values, create different wrappers for different scenarios.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Test behaviour not implementation — getByRole first, userEvent always awaited, MSW for APIs, renderHook + act for hooks.',
    mustKnow: [
      'Query priority: getByRole > getByLabelText > getByText > getByTestId — role queries test accessibility too',
      'getBy for "element IS present" (throws on miss); queryBy for "element is NOT present" (returns null)',
      'findBy (async) for elements that appear after fetch/effect; always await',
      'userEvent.setup() + await user.click/type — simulates full browser event sequence',
      'MSW intercepts at the network layer — catches URL typos; jest.mock cannot',
      'renderHook + act() for hook tests; wrapper option for context-dependent hooks',
    ],
    interviewFocus: [
      'Why do we prefer getByRole over getByTestId — what does this buy us?',
      'Difference between getBy, queryBy, and findBy — when do you use each?',
      'Why MSW over jest.mock for API testing — what does MSW catch that mocking cannot?',
      'What does act() do and when is it required in hook tests?',
    ],
  };
}
