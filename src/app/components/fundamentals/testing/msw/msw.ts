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
  selector: 'app-msw-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './msw.html',
  styleUrl: './msw.scss',
})
export class MswTesting {
  quickRef: QuickRefItem[] = [
    { name: 'http.get/post/put/delete', type: 'function', desc: 'Define request handlers that intercept matching HTTP requests.' },
    { name: 'HttpResponse.json()',      type: 'function', desc: 'Return a JSON response from a handler.' },
    { name: 'setupServer()',            type: 'function', desc: 'Create a Node.js server for use in Jest/Vitest tests.' },
    { name: 'server.use()',             type: 'method',   desc: 'Add per-test handler overrides — reverted after server.resetHandlers().' },
    { name: 'server.resetHandlers()',   type: 'method',   desc: 'Remove per-test overrides, restoring the default handlers.' },
    { name: 'passthrough()',            type: 'function', desc: 'Let a specific request pass through to the real network.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'What MSW Does', points: [
      'MSW intercepts HTTP requests at the network level — not by mocking fetch or axios.',
      'In the browser: a Service Worker intercepts requests before they leave the browser.',
      'In Node.js (tests): a lightweight HTTP interceptor wraps fetch/XMLHttpRequest.',
      'The same handler definitions work in browser dev, unit tests, and E2E tests.',
    ]},
    { heading: 'One Mock Layer for Everything', points: [
      'Define handlers once in src/mocks/handlers.ts.',
      'Tests use setupServer(handlers) in Node.js.',
      'Browser dev uses setupWorker(handlers) with a registered service worker.',
      'This eliminates the "mocks in tests differ from mocks in dev" problem.',
    ]},
    { heading: 'Per-Test Overrides', points: [
      'server.use(http.get("/api/users", errorHandler)) overrides the default for one test.',
      'Call server.resetHandlers() in afterEach to restore defaults.',
      'Per-test overrides let you test error states without changing global handlers.',
      'server.restoreAllMocks() is not needed — MSW manages handler lifecycle separately.',
    ]},
    { heading: 'MSW vs jest.mock() for HTTP', points: [
      'jest.mock("./api") mocks the module — tightly coupled to the implementation file.',
      'MSW mocks the network — works regardless of what library makes the HTTP call.',
      'MSW tests work even if you swap fetch for axios or a GraphQL client.',
      'MSW is the recommended approach for testing components that fetch data.',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Handler Setup', language: 'typescript', code:
`// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob',   email: 'bob@example.com'   },
    ]);
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string; email: string };
    return HttpResponse.json({ id: 3, ...body }, { status: 201 });
  }),

  http.get('/api/users/:id', ({ params }) => {
    const { id } = params;
    if (id === '999') return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ id: Number(id), name: 'Alice' });
  }),
];` },
    { label: 'Jest/Vitest Setup', language: 'typescript', code:
`// src/test/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(()  => server.listen({ onUnhandledRequest: 'warn' }));
// Reset per-test overrides after each test
afterEach(()  => server.resetHandlers());
// Stop server after all tests
afterAll(()   => server.close());` },
    { label: 'Component Test with MSW', language: 'typescript', code:
`import { render, screen } from '@testing-library/react';
import { UserList } from './UserList';

// Default handlers from setup.ts return Alice and Bob

test('displays user list', async () => {
  render(<UserList />);

  // findBy waits for the async fetch to complete
  expect(await screen.findByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
});

test('shows error when API fails', async () => {
  // Per-test override — only for this test
  server.use(
    http.get('/api/users', () =>
      HttpResponse.json({ message: 'Server error' }, { status: 500 })
    )
  );

  render(<UserList />);

  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load');
});` },
    { label: 'Browser Dev Setup', language: 'typescript', code:
`// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/main.ts — start in development only
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') return;
  const { worker } = await import('./mocks/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Not calling server.resetHandlers() in afterEach', wrong: '// afterEach omitted — per-test overrides bleed into next test', right: 'afterEach(() => server.resetHandlers())', explanation: 'server.use() overrides persist until reset. Without resetHandlers(), an error override from one test affects all subsequent tests.' },
    { title: 'Using onUnhandledRequest: "error" in tests carelessly', wrong: 'server.listen({ onUnhandledRequest: "error" }) and test makes unknown request → suite crashes', right: 'use "warn" during development, "error" only when all handlers are known', explanation: '"error" is strict — any unhandled request throws. Useful for final CI runs but painful during development when you add new API calls.' },
    { title: 'Defining handlers inside test files', wrong: 'const handler = http.get("/api", ...) // defined per-test file', right: 'define shared handlers in src/mocks/handlers.ts; use server.use() for per-test overrides', explanation: 'Duplicated handlers across test files drift out of sync with each other and with the browser dev mock.' },
    { title: 'Mocking the fetch module instead of using MSW', wrong: 'global.fetch = jest.fn().mockResolvedValue({ json: () => [] })', right: 'use MSW handlers — they work with any HTTP client and are more realistic', explanation: 'Mocking fetch directly breaks if the component switches from fetch to axios. MSW intercepts at the network level regardless of the HTTP client used.' },
    { title: 'Forgetting to register the service worker for browser dev', wrong: 'worker.start() called but mockServiceWorker.js not in public/', right: 'run npx msw init public/ to generate the service worker file', explanation: 'MSW\'s browser mode requires a service worker file in the public directory. Without it, the browser cannot intercept requests and all mocks are silently ignored.' },
  ];

  challenge: Challenge = {
    title: 'Add a per-test error override with MSW',
    language: 'typescript',
    description: 'Given a default handler that returns a product, write two tests: (1) the happy path showing the product name, (2) an error path using server.use() to return 500 — verify an error message appears.',
    hints: [
      'Import { server } from your test setup and call server.use(http.get("/api/product", () => HttpResponse.json({}, { status: 500 }))) in the error test.',
      'Use await screen.findByRole("alert") to wait for the error state.',
    ],
    starterCode:
`// handlers.ts: http.get("/api/product", () => HttpResponse.json({ name: "Widget" }))
// server is set up in beforeAll/afterEach/afterAll

import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/setup';
import { ProductCard } from './ProductCard';

test('displays product name', async () => {
  render(<ProductCard />);
  // write assertion
});

test('shows error when API fails', async () => {
  // add per-test override
  render(<ProductCard />);
  // write assertion
});`,
    solution:
`test('displays product name', async () => {
  render(<ProductCard />);
  expect(await screen.findByText('Widget')).toBeInTheDocument();
});

test('shows error when API fails', async () => {
  server.use(
    http.get('/api/product', () =>
      HttpResponse.json({ message: 'error' }, { status: 500 })
    )
  );
  render(<ProductCard />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Failed');
});`,
  };

  quiz: QuizQuestion[] = [
    { q: 'What makes MSW different from mocking the fetch module directly?', options: ['MSW is faster', 'MSW intercepts at the network level — works with any HTTP client, not just fetch', 'MSW only works in the browser', 'They are identical'], answer: 1, explanation: 'jest.mock("fetch") ties your mock to a specific implementation. MSW intercepts at the transport level — swap fetch for axios and the same handlers still work.' },
    { q: 'Why must you call server.resetHandlers() in afterEach?', options: ['To stop the server between tests', 'To remove per-test overrides so they do not bleed into subsequent tests', 'To clear the default handlers permanently', 'It is optional — MSW resets automatically'], answer: 1, explanation: 'server.use() adds overrides on top of the default handlers. Without resetHandlers(), those overrides stay active for all subsequent tests, causing false failures.' },
    { q: 'What is the benefit of defining MSW handlers in a shared handlers.ts file?', options: ['Tests run faster', 'The same mock definitions are used in tests and browser development — eliminating drift between environments', 'It is required by MSW', 'It reduces bundle size'], answer: 1, explanation: 'A shared handlers.ts means your test mocks and dev-server mocks are identical. You cannot have a situation where tests pass with a mock but dev fails against the real API.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can MSW mock GraphQL requests?', a: 'Yes — use graphql.query("GetUser", resolver) and graphql.mutation("CreateUser", resolver) from msw. MSW parses the GraphQL operation name from the request body and routes it to the correct handler.' },
    { q: 'How do I use MSW with Vitest?', a: 'Identical to Jest. Import setupServer from "msw/node", call server.listen() in beforeAll, server.resetHandlers() in afterEach, and server.close() in afterAll. Add the setup file to vitest.config.ts setupFiles array.' },
    { q: 'Does MSW work with React Query, SWR, or Apollo?', a: 'Yes — because MSW intercepts at the network level, it works with any data-fetching library. React Query, SWR, RTK Query, and Apollo all make real HTTP calls under the hood that MSW intercepts transparently.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MSW intercepts HTTP at the network level — define handlers once, use them in tests, dev, and browser with no library coupling.',
    mustKnow: [
      'MSW intercepts at the network — works with fetch, axios, any HTTP client',
      'http.get/post/put/delete() define handlers in handlers.ts',
      'setupServer(...handlers) for Node.js; setupWorker() for browser',
      'server.use() for per-test overrides; server.resetHandlers() in afterEach',
      'Same handlers.ts used in tests AND browser dev mode',
      'Run npx msw init public/ to register the browser service worker',
    ],
    interviewFocus: [
      'MSW vs jest.mock() for HTTP — network-level vs module-level',
      'Why shared handlers eliminate test/dev mock drift',
      'Per-test error overrides with server.use() + resetHandlers()',
    ],
  };
}
