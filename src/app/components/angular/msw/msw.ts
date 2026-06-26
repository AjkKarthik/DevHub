import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';

@Component({
  selector: 'app-msw',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
    CommonMistakesComponent, PrerequisitesComponent, BeforeAfterComponent,
  ],
  templateUrl: './msw.html',
  styleUrl: './msw.scss',
})
export class MswDemo {

  prerequisites: Prerequisite[] = [
    { label: 'HTTP Client',    route: '/angular/http' },
    { label: 'Testing',        route: '/angular/testing' },
    { label: 'HTTP Interceptors', route: '/angular/http-interceptors' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'setupServer(...handlers)',   type: 'function', desc: 'Node.js / Jest / Vitest: intercepts fetch/XHR at the network layer without a browser', since: 'MSW 2' },
    { name: 'setupWorker(...handlers)',   type: 'function', desc: 'Browser: registers a Service Worker that intercepts real network requests in dev/Storybook', since: 'MSW 1' },
    { name: 'http.get(url, resolver)',    type: 'method',   desc: 'Declare a handler for GET requests — resolver receives { request } and returns a Response', since: 'MSW 2' },
    { name: 'http.post(url, resolver)',   type: 'method',   desc: 'Declare a handler for POST requests', since: 'MSW 2' },
    { name: 'HttpResponse.json(body)',    type: 'method',   desc: 'Return a typed JSON response from a handler — shorthand for new Response(JSON.stringify(body))', since: 'MSW 2' },
    { name: 'server.use(...handlers)',    type: 'method',   desc: 'Override handlers for a single test — overrides are applied on top of the default handler list', since: 'MSW 1' },
    { name: 'server.resetHandlers()',     type: 'method',   desc: 'Remove handlers added via server.use() — call in afterEach to restore defaults', since: 'MSW 1' },
    { name: 'passthrough()',             type: 'function', desc: 'Skip the handler and let the real network request through', since: 'MSW 2' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is MSW and why use it in Angular tests?',
      points: [
        'Mock Service Worker (MSW) intercepts HTTP requests at the network layer — not by patching <code>HttpClient</code> or injecting a mock. This means your tests exercise the full Angular HTTP stack (interceptors, serialization, error handling) with zero changes to production code.',
        'Unlike <code>HttpClientTestingModule + HttpTestingController</code>, MSW handlers are defined once and shared across unit tests, integration tests, Storybook stories, and even the running dev app. A single source of truth for your API contract.',
        'MSW 2 switched from Service Worker semantics in Node to a pure fetch-interception approach. In a JSDOM environment (Jest/Vitest), it intercepts XMLHttpRequest and fetch natively — Angular\'s HttpClient uses fetch by default in modern versions.',
        'The key mental model: MSW sits between your app and the network. Your production code never knows requests are being intercepted — there\'s no injection, no spy, no <code>TestBed.overrideProvider</code>.',
      ],
    },
    {
      heading: 'setupServer vs setupWorker',
      points: [
        '<code>setupServer(...handlers)</code> is for Node.js environments — Jest, Vitest, and any server-side rendering test. It patches global <code>fetch</code> and <code>XMLHttpRequest</code> in the Node process.',
        '<code>setupWorker(...handlers)</code> runs in the browser and registers a Service Worker that intercepts real network traffic. Use it in Storybook, Cypress, or the live dev app for API mocking without a running backend.',
        'For Angular unit/integration tests written with Jest or Vitest: use <code>setupServer</code> in a setup file. For Cypress component tests or Storybook: use <code>setupWorker</code>.',
        'Both take the same handler array — you can export your handlers from a shared file and import them in both configurations. The handlers themselves are identical.',
      ],
    },
    {
      heading: 'Writing handlers for Angular APIs',
      points: [
        'An MSW 2 handler is <code>http.get(\'https://api.example.com/users\', () => HttpResponse.json([...]))</code>. The URL can be an exact string, a glob pattern, or a URL with path params (<code>/users/:id</code>).',
        'The resolver receives a <code>{ request, params, cookies }</code> object. <code>params</code> contains URL path parameters. <code>request</code> is a standard Web API <code>Request</code> — you can call <code>await request.json()</code> to parse the body.',
        'To simulate errors: return <code>new HttpResponse(null, { status: 500 })</code> or <code>HttpResponse.json({ detail: \'Server error\' }, { status: 500 })</code>. Angular\'s <code>HttpClient</code> will emit an <code>HttpErrorResponse</code> as normal.',
        'For per-test overrides: call <code>server.use(http.get(\'/api/users\', () => HttpResponse.json([])))</code> inside the test. This overrides just for that test; <code>afterEach(() => server.resetHandlers())</code> restores the defaults.',
      ],
    },
    {
      heading: 'Integrating MSW with Angular TestBed',
      points: [
        'MSW needs to be started before tests run. In Jest, call <code>server.listen()</code> in <code>beforeAll</code> (or in a global setup file) and <code>server.close()</code> in <code>afterAll</code>.',
        'Angular\'s <code>TestBed</code> needs <code>provideHttpClient()</code> — do NOT import <code>HttpClientTestingModule</code> when using MSW; they conflict because both try to intercept HTTP requests differently.',
        'Angular 17+ default HttpClient uses fetch. If your test environment doesn\'t support fetch (older Jest with JSDOM), add <code>provideHttpClient(withFetch())</code> and make sure MSW 2 is configured to intercept fetch.',
        'Component tests with MSW are close to integration tests — they render the real component, make real HTTP calls (intercepted by MSW), and verify the DOM. This gives much higher confidence than mocking at the service layer.',
      ],
    },
    {
      heading: 'Handler patterns and test isolation',
      points: [
        'Organise handlers by feature in separate files: <code>src/mocks/handlers/users.ts</code>, <code>src/mocks/handlers/products.ts</code>. Combine them in <code>src/mocks/handlers/index.ts</code> and import into both <code>browser.ts</code> (setupWorker) and <code>server.ts</code> (setupServer).',
        'Use <code>server.use()</code> within individual tests to override the default happy-path handlers with error scenarios. This is far cleaner than having a mock service with a configurable error flag.',
        'For async handlers that simulate latency: <code>await delay(500)</code> from the MSW package. Useful for testing loading states without actual network overhead.',
        'MSW captures the request body, headers, and params — you can write assertions on what was sent: <code>const body = await request.json(); expect(body.name).toBe(\'test\')</code>.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup & server config',
      language: 'typescript',
      code: `// src/mocks/handlers/users.ts
import { http, HttpResponse } from 'msw';

export const userHandlers = [
  http.get('/api/users', () =>
    HttpResponse.json([
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob',   email: 'bob@example.com' },
    ])
  ),

  http.get('/api/users/:id', ({ params }) => {
    const id = Number(params['id']);
    if (id === 999) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ id, name: \`User \${id}\`, email: \`user\${id}@example.com\` });
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json() as { name: string; email: string };
    return HttpResponse.json({ id: Math.floor(Math.random() * 1000), ...body }, { status: 201 });
  }),
];

// src/mocks/server.ts (used in Jest/Vitest)
import { setupServer } from 'msw/node';
import { userHandlers } from './handlers/users';

export const server = setupServer(...userHandlers);

// src/mocks/browser.ts (used in Storybook / dev app)
import { setupWorker } from 'msw/browser';
import { userHandlers } from './handlers/users';

export const worker = setupWorker(...userHandlers);`,
    },
    {
      label: 'Jest global setup',
      language: 'typescript',
      code: `// src/setupTests.ts (referenced in jest.config.ts → setupFilesAfterFramework)
import { server } from './mocks/server';
import 'whatwg-fetch'; // polyfill if using older JSDOM

// Start server before ALL tests
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));

// Reset per-test overrides so they don't bleed into the next test
afterEach(() => server.resetHandlers());

// Shut down after all tests complete
afterAll(() => server.close());

// jest.config.ts
export default {
  preset: 'jest-preset-angular',
  setupFilesAfterFramework: ['<rootDir>/src/setupTests.ts'],
  testEnvironment: 'jsdom',
};`,
    },
    {
      label: 'Component test with TestBed',
      language: 'typescript',
      code: `import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { screen } from '@testing-library/angular';
import { render } from '@testing-library/angular';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

// Component under test
import { UserListComponent } from './user-list.component';

describe('UserListComponent', () => {
  // Default handlers (from server setup) return Alice + Bob

  it('displays users from the API', async () => {
    await render(UserListComponent, {
      providers: [provideHttpClient()],
    });

    // Wait for async HTTP call to resolve
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });

  it('shows an error message when the API fails', async () => {
    // Override the default handler to return a 500 for this test only
    server.use(
      http.get('/api/users', () =>
        new HttpResponse(null, { status: 500 })
      )
    );

    await render(UserListComponent, {
      providers: [provideHttpClient()],
    });

    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });

  it('shows empty state when no users', async () => {
    server.use(
      http.get('/api/users', () => HttpResponse.json([]))
    );

    await render(UserListComponent, {
      providers: [provideHttpClient()],
    });

    expect(await screen.findByText(/no users found/i)).toBeInTheDocument();
  });
});`,
    },
    {
      label: 'Asserting request payloads',
      language: 'typescript',
      code: `import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

describe('UserFormComponent — create user', () => {
  it('sends the correct payload to the API', async () => {
    let capturedBody: unknown;

    // Override handler to capture the request body
    server.use(
      http.post('/api/users', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ id: 42, name: 'Test' }, { status: 201 });
      })
    );

    const { getByLabelText, getByRole } = await render(UserFormComponent, {
      providers: [provideHttpClient()],
    });

    await userEvent.type(getByLabelText('Name'), 'Test User');
    await userEvent.type(getByLabelText('Email'), 'test@example.com');
    await userEvent.click(getByRole('button', { name: /save/i }));

    // Wait for the async submission
    await waitFor(() => {
      expect(capturedBody).toEqual({
        name: 'Test User',
        email: 'test@example.com',
      });
    });
  });
});`,
    },
    {
      label: 'Dev app mock setup',
      language: 'typescript',
      code: `// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { userHandlers } from './handlers/users';

export const worker = setupWorker(...userHandlers);

// main.ts — only start MSW in development
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { appConfig } from './app/app.config';

async function bootstrap() {
  if (typeof window !== 'undefined' && location.hostname === 'localhost') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',  // let real requests through
    });
  }
  return bootstrapApplication(AppComponent, appConfig);
}

bootstrap().catch(console.error);

// angular.json — register the service worker asset
// "assets": ["src/mockServiceWorker.js"]
// Generate: npx msw init src --save`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'HTTP testing: HttpTestingController vs MSW',
      before: `// Old approach — HttpClientTestingModule
// Doesn't test interceptors, error handling, or serialization
TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],
  declarations: [UserListComponent],
});
const http = TestBed.inject(HttpTestingController);

// Must manually flush — imperative and fragile
component.loadUsers();
http.expectOne('/api/users').flush([{ id: 1, name: 'Alice' }]);
fixture.detectChanges();
expect(component.users()).toHaveLength(1);`,
      after: `// MSW approach — real HTTP stack, declarative
// TestBed with real HttpClient
await render(UserListComponent, {
  providers: [provideHttpClient()],
});
// Default handler returns Alice + Bob
expect(await screen.findByText('Alice')).toBeInTheDocument();
// Error scenario: one line to override
server.use(http.get('/api/users', () => new HttpResponse(null, { status: 500 })));`,
      note: 'MSW exercises the full HTTP pipeline including interceptors. No manual flush, no assertions on request objects — the test reads like usage.',
      language: 'typescript',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using HttpClientTestingModule alongside MSW',
      wrong: `TestBed.configureTestingModule({
  imports: [HttpClientTestingModule],  // conflicts with MSW
  providers: [provideHttpClient()],    // both trying to intercept
});`,
      right: `TestBed.configureTestingModule({
  providers: [provideHttpClient()],  // real HttpClient — MSW handles interception
});
// HttpClientTestingModule is only for HttpTestingController-style tests`,
      explanation: 'HttpClientTestingModule replaces HttpClient with a test implementation. MSW needs the real HttpClient. Mixing them means MSW\'s interceptor fires but the test HttpClient discards responses, or vice versa.',
    },
    {
      title: 'Not resetting handlers between tests',
      wrong: `// test-A adds a per-test override
server.use(http.get('/api/users', () => HttpResponse.json([])));

// test-B assumes the default handler (Alice + Bob) — but gets the empty response
it('should show user count', async () => { ... }); // FAILS unexpectedly`,
      right: `// In global setup (setupTests.ts)
afterEach(() => server.resetHandlers());
// Now each test starts fresh with only the default handlers`,
      explanation: 'server.use() adds handlers that stack on top of defaults until resetHandlers() is called. Without resetting, test-A\'s override bleeds into test-B, causing order-dependent failures that are hard to debug.',
    },
    {
      title: 'URL mismatch between handler and HttpClient call',
      wrong: `// Handler registered with absolute URL
http.get('https://api.example.com/users', ...)

// But HttpClient uses a relative URL
this.http.get('/users')  // MSW never matches — makes real request`,
      right: `// Option A: match the exact URL the app uses
http.get('/users', ...)  // relative URL matches relative call

// Option B: use a URL pattern
http.get('https://api.example.com/users', ...)
// AND configure HttpClient base URL or use an interceptor to prefix`,
      explanation: 'MSW matches the exact URL string. If your handler uses an absolute URL but the app call is relative (or vice versa), there is no match and MSW logs an unhandled request warning. Use onUnhandledRequest: "error" during tests to catch this early.',
    },
    {
      title: 'Forgetting to call server.listen() before tests',
      wrong: `// Just imports the server, never starts it
import { server } from '../mocks/server';

// Requests go through to real network (or fail in JSDOM)
it('loads users', async () => { ... });`,
      right: `// In a global setup file OR beforeAll in the test file
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());`,
      explanation: 'Importing the server does not start it. Without server.listen(), MSW does not intercept anything. Tests that seem to pass locally may actually be hitting real endpoints or timing out silently.',
    },
  ];

  challenge: Challenge = {
    title: 'Wire MSW into an Angular product feature test',
    language: 'typescript',
    description: `Set up MSW for a ProductListComponent test suite:
1. Define handlers for GET /api/products (returns 3 products) and GET /api/products/:id (returns single or 404)
2. Set up a Jest test file with correct server lifecycle calls
3. Write 3 tests: happy path (shows product names), empty state (server returns []), and error state (server returns 500 with a message)
4. Ensure per-test overrides don't bleed between tests`,
    hints: [
      'setupServer from "msw/node" for Jest',
      'beforeAll(() => server.listen()), afterEach(() => server.resetHandlers()), afterAll(() => server.close())',
      'server.use() inside a test for per-test overrides',
      'Use provideHttpClient() in TestBed — NOT HttpClientTestingModule',
      'screen.findByText() waits for async rendering; prefer it over getByText for HTTP data',
    ],
    starterCode: `import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/angular';
import { provideHttpClient } from '@angular/common/http';
import { ProductListComponent } from './product-list.component';

// TODO: 1. Define default handlers
const server = setupServer(/* handlers */);

describe('ProductListComponent', () => {
  // TODO: 2. Server lifecycle

  it('shows product names', async () => {
    // TODO: render + findByText
  });

  it('shows empty state', async () => {
    // TODO: override handler to return []
  });

  it('shows error message on 500', async () => {
    // TODO: override handler to return 500
  });
});`,
    solution: `import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { render, screen } from '@testing-library/angular';
import { provideHttpClient } from '@angular/common/http';
import { ProductListComponent } from './product-list.component';

const defaultHandlers = [
  http.get('/api/products', () =>
    HttpResponse.json([
      { id: 1, name: 'Widget A', price: 9.99 },
      { id: 2, name: 'Widget B', price: 14.99 },
      { id: 3, name: 'Widget C', price: 4.99 },
    ])
  ),
  http.get('/api/products/:id', ({ params }) => {
    const id = Number(params['id']);
    if (id === 999) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ id, name: \`Widget \${id}\`, price: 9.99 });
  }),
];

const server = setupServer(...defaultHandlers);

describe('ProductListComponent', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('shows product names from the API', async () => {
    await render(ProductListComponent, {
      providers: [provideHttpClient()],
    });
    expect(await screen.findByText('Widget A')).toBeInTheDocument();
    expect(await screen.findByText('Widget B')).toBeInTheDocument();
    expect(await screen.findByText('Widget C')).toBeInTheDocument();
  });

  it('shows empty state when no products', async () => {
    server.use(http.get('/api/products', () => HttpResponse.json([])));
    await render(ProductListComponent, {
      providers: [provideHttpClient()],
    });
    expect(await screen.findByText(/no products/i)).toBeInTheDocument();
  });

  it('shows error message on 500', async () => {
    server.use(
      http.get('/api/products', () =>
        HttpResponse.json({ detail: 'Database error' }, { status: 500 })
      )
    );
    await render(ProductListComponent, {
      providers: [provideHttpClient()],
    });
    expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
  });
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between MSW and HttpClientTestingModule?',
      options: [
        'MSW only works in the browser; HttpClientTestingModule works in Node',
        'MSW intercepts at the network layer — the full HTTP stack (interceptors, serialization) runs; HttpClientTestingModule replaces HttpClient entirely',
        'MSW requires a running backend; HttpClientTestingModule does not',
        'They are equivalent — MSW is just a newer API for the same thing',
      ],
      answer: 1,
      explanation: 'MSW intercepts at the network layer, so Angular\'s full HTTP pipeline (interceptors, error handling, response parsing) runs in tests. HttpClientTestingModule replaces the HttpClient with a test double — interceptors do not run.',
    },
    {
      q: 'In a Jest test file, where should server.listen() be called?',
      options: [
        'Inside each individual it() test',
        'In beforeEach() to restart the server before each test',
        'In beforeAll() once before the describe block runs',
        'At module level, directly after import',
      ],
      answer: 2,
      explanation: 'server.listen() starts the request interception. Call it once in beforeAll() — starting and stopping the server per test adds unnecessary overhead. Use afterEach(() => server.resetHandlers()) for test isolation and afterAll(() => server.close()) to clean up.',
    },
    {
      q: 'How do you simulate an API error for a single test without affecting other tests?',
      options: [
        'Modify the default handler in the handlers file',
        'Call server.use() inside the test with an error-returning handler',
        'Catch the error in the component and return a test-only flag',
        'Override HttpClient with TestBed.overrideProvider',
      ],
      answer: 1,
      explanation: 'server.use() adds a handler that overrides the defaults for the current test. Combined with afterEach(() => server.resetHandlers()), the override is automatically removed after the test — other tests are unaffected.',
    },
    {
      q: 'Which MSW setup function is used in a Jest/Node.js test environment?',
      options: [
        'setupWorker — for both browser and Node',
        'setupServer from "msw/node"',
        'setupHandler from "msw"',
        'setupMocks from "msw/jest"',
      ],
      answer: 1,
      explanation: 'setupServer from "msw/node" patches the Node.js global fetch and XMLHttpRequest. setupWorker is for browsers and registers a real Service Worker. They accept the same handlers but are started differently.',
    },
    {
      q: 'What does onUnhandledRequest: "warn" do in server.listen()?',
      options: [
        'Throws an error and fails the test on any unhandled request',
        'Logs a console warning when a request is made with no matching handler',
        'Automatically creates a passthrough handler for all unhandled requests',
        'Prevents any real network requests from being made',
      ],
      answer: 1,
      explanation: '"warn" prints a console warning for unhandled requests. Use "error" in tests to fail fast when a request has no handler (catches URL mismatches early). Use "bypass" to silently forward unhandled requests to the real network.',
    },
    {
      q: 'How do you write an MSW handler that returns a specific HTTP status code and JSON body?',
      options: [
        'http.get("/api/users", () => new Response(null, { status: 404 }))',
        'http.get("/api/users", () => HttpResponse.json({ error: "Not found" }, { status: 404 }))',
        'http.get("/api/users", { status: 404, body: { error: "Not found" } })',
        'handler.respondWith(404, { error: "Not found" })',
      ],
      answer: 1,
      explanation: 'MSW 2.x uses HttpResponse.json(body, options) to create typed JSON responses. The first argument is the response body; the second is an options object with status, headers etc. This produces a properly-typed Response with Content-Type: application/json set automatically.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use MSW with Vitest instead of Jest?',
      a: 'Yes — MSW 2 works with any test runner that runs in a Node.js environment. In Vitest, the setup is identical: import setupServer from "msw/node", call server.listen() in beforeAll, server.resetHandlers() in afterEach, and server.close() in afterAll. Vitest config uses setupFiles for the global setup file — equivalent to Jest\'s setupFilesAfterFramework.',
    },
    {
      q: 'Do Angular HTTP interceptors run when MSW is used?',
      a: 'Yes — this is the main advantage of MSW. Because it intercepts at the network layer and you use a real HttpClient, all interceptors (auth, logging, error handling) run in tests just as they do in production. This gives you much higher test confidence than HttpClientTestingModule which bypasses the entire interceptor chain.',
    },
    {
      q: 'How do I handle requests that need authentication headers in MSW tests?',
      a: 'Two approaches: (1) In the handler, read request.headers.get("Authorization") and conditionally return a 401 or the normal response — this lets you test your auth interceptor behavior. (2) Provide a mock for your auth service so it returns a fake token, then your auth interceptor adds it, and the MSW handler verifies it was present.',
    },
    {
      q: 'What is the mockServiceWorker.js file and where does it go?',
      a: 'It is the actual Service Worker script that MSW registers in the browser. Generate it once with: npx msw init src --save (for Angular projects, put it in the src/ folder). Then add "src/mockServiceWorker.js" to the assets array in angular.json so it is copied to the build output. This file only needs to be regenerated when you upgrade MSW.',
    },
    {
      q: 'What does passthrough() do in an MSW handler?',
      a: 'passthrough() tells MSW to let the request proceed to the real network without intercepting it. Use it inside a handler when you want to mock most endpoints but allow specific ones to hit the real API: if (request.url.includes("/analytics")) return passthrough(). It is especially useful in Storybook setups where you want real image/font requests to succeed but API calls to be mocked. In tests, prefer explicit 200 responses over passthrough — real network calls make tests slow and flaky.',
    },
    {
      q: 'How do I use MSW with Angular\'s HTTP testing controller at the same time?',
      a: 'You cannot — HttpClientTestingModule replaces the HTTP backend with a test controller that intercepts before requests leave Angular. MSW intercepts at the fetch/XHR layer after the request leaves Angular. If you use both in the same test, MSW never sees the requests because HttpClientTestingModule swallowed them. Choose one approach per test suite: MSW for high-fidelity integration tests with real HTTP stacks; HttpClientTestingModule for unit tests that need precise request inspection without a service worker.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MSW intercepts HTTP at the network layer — your full Angular HTTP stack (interceptors, error handling) runs in tests; handlers are shared across unit tests, Storybook, and dev. <code>setupServer</code> for Node/Jest, <code>setupWorker</code> for the browser.',
    mustKnow: [
      '<code>setupServer</code> (msw/node) for Jest/Vitest; <code>setupWorker</code> (msw/browser) for Storybook/dev',
      'Server lifecycle: <code>beforeAll(server.listen)</code> → <code>afterEach(server.resetHandlers)</code> → <code>afterAll(server.close)</code>',
      'Use <code>provideHttpClient()</code> in TestBed — NOT <code>HttpClientTestingModule</code> (they conflict)',
      '<code>server.use()</code> inside a test overrides defaults for that test only; <code>resetHandlers()</code> cleans up',
      'Handlers match the exact URL — relative vs absolute mismatch is a common bug; use <code>onUnhandledRequest: "error"</code> to catch it',
      'Request body available in handlers: <code>const body = await request.json()</code> — assert what was sent',
    ],
    interviewFocus: [
      '<strong>MSW vs HttpClientTestingModule?</strong> — MSW runs the full HTTP stack; HttpClientTestingModule replaces the client entirely (interceptors skipped)',
      '<strong>Per-test error simulation?</strong> — <code>server.use()</code> inside the test + <code>afterEach(server.resetHandlers())</code>',
      '<strong>Why prefer MSW for integration tests?</strong> — interceptors, serialization, and error handling all run; same handlers shared with Storybook and dev',
    ],
  };
}
