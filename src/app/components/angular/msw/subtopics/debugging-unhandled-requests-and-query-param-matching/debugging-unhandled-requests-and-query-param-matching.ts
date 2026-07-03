import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-unhandled-requests-and-query-param-matching-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-unhandled-requests-and-query-param-matching.html',
  styleUrl: './debugging-unhandled-requests-and-query-param-matching.scss',
})
export class DebuggingUnhandledRequestsAndQueryParamMatchingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Making onUnhandledRequest: "error" your default during test development',
      points: [
        'The main topic\'s common mistake documents the relative-vs-absolute URL mismatch, but the general FIX for the whole class of "why isn\'t my handler matching" problems is a workflow change: set <code>onUnhandledRequest: \'error\'</code> (not <code>\'warn\'</code>) while actively writing new tests — a thrown error interrupts the test run immediately with the EXACT unmatched URL in the failure message, versus a console warning that is easy to miss buried in test output, especially in a large suite.',
        'Switch back to <code>\'warn\'</code> (or a custom function) for the STABLE test suite running in CI if some genuinely-expected passthrough requests exist (e.g. analytics beacons you intentionally do not mock) — <code>\'error\'</code> everywhere would make those legitimate passthroughs fail the build.',
      ],
    },
    {
      heading: 'MSW matches the PATH exactly, but query parameters need explicit handling',
      points: [
        'A handler registered as <code>http.get(\'/api/products\', ...)</code> matches <code>/api/products?page=2&sort=price</code> just as well as the bare path — MSW\'s URL matching by default ignores the query string entirely. If your handler needs to return DIFFERENT data based on query params (pagination, filtering, sorting), you must parse them yourself inside the resolver: <code>({ request }) =&gt; { const url = new URL(request.url); const page = Number(url.searchParams.get(\'page\') ?? \'1\'); return HttpResponse.json(getPage(page)); }</code>.',
        'A common confusion this causes: a test asserting page-2 content might accidentally pass even with a BROKEN pagination component, if the handler ignores the query string and always returns page-1 data regardless — the test would need to independently verify DIFFERENT handler responses for different query values to actually catch a pagination bug, not just confirm SOME data rendered.',
      ],
    },
    {
      heading: 'A systematic checklist for "my handler is not matching"',
      points: [
        '(1) Run with <code>onUnhandledRequest: \'error\'</code> and read the EXACT URL in the failure — compare it character-by-character against the handler\'s registered URL, including trailing slashes, which MSW treats as significant. (2) Check whether the app\'s actual call uses a RELATIVE URL (<code>/api/x</code>) while the handler is registered with an ABSOLUTE one (<code>https://api.example.com/api/x</code>), or vice versa — this is the single most common real-world cause. (3) Confirm the HTTP METHOD matches (<code>http.get</code> vs <code>http.post</code> for the same path are two entirely separate, non-overlapping handlers). (4) If using an interceptor that PREFIXES all requests with a base URL, verify what the FINAL, post-interceptor URL actually looks like — the handler must match what leaves the browser/Node process, not what the component originally called.',
        'A quick diagnostic technique: temporarily register a catch-all handler — <code>http.get(\'*\", ({ request }) =&gt; { console.log(\'UNHANDLED:\', request.url); return passthrough(); })</code> placed LAST in the handlers array — to log every request URL MSW actually sees, revealing exactly what string your specific handler needs to match.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/product-list.ts',
      content: `import { Component, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Product { id: number; name: string; }

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    <button (click)="loadPage(1)">Page 1</button>
    <button (click)="loadPage(2)">Page 2</button>
    @for (p of products(); track p.id) { <p>{{ p.name }}</p> }
  \`,
})
export class ProductListComponent {
  private http = inject(HttpClient);
  products = signal<Product[]>([]);

  loadPage(page: number) {
    // Query params — MSW ignores these unless the handler parses them itself.
    this.http.get<Product[]>(\`/api/products?page=\${page}\`).subscribe(data => {
      this.products.set(data);
    });
  }
}
`,
    },
    {
      path: 'src/app/product-list.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { render, screen, fireEvent } from '@testing-library/angular';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ProductListComponent } from './product-list';

const PAGE_DATA: Record<number, { id: number; name: string }[]> = {
  1: [{ id: 1, name: 'Widget A' }],
  2: [{ id: 2, name: 'Widget B' }],
};

const server = setupServer(
  // CORRECT: parses the query param explicitly — a bare path handler
  // would return the SAME data regardless of page and mask pagination bugs.
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    return HttpResponse.json(PAGE_DATA[page] ?? []);
  }),
);

describe('ProductListComponent pagination', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('shows page-1-specific data', async () => {
    const { container } = await render(ProductListComponent, {
      providers: [provideHttpClient()],
    });
    fireEvent.click(screen.getByText('Page 1'));
    expect(await screen.findByText('Widget A')).toBeInTheDocument();
  });

  it('shows DIFFERENT data for page 2 — proves query param handling works', async () => {
    await render(ProductListComponent, {
      providers: [provideHttpClient()],
    });
    fireEvent.click(screen.getByText('Page 2'));
    expect(await screen.findByText('Widget B')).toBeInTheDocument();
    expect(screen.queryByText('Widget A')).not.toBeInTheDocument();
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ProductListComponent } from './product-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductListComponent],
  template: \`
    <h3>Debugging unhandled requests and query-param matching</h3>
    <p>The handler parses ?page= explicitly via new URL(request.url).searchParams — a
    bare-path handler would ignore it and return the same data for every page, silently
    masking a real pagination bug.</p>
    <app-product-list />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideHttpClient()] });
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Debugging unhandled requests and query-param matching</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a catch-all diagnostic handler that logs every unhandled request URL MSW sees, placed last in the handlers array.',
    hint: 'Add `http.get(\'*\', ({ request }) => { console.log(\'UNHANDLED:\', request.url); return passthrough(); })` as the LAST entry passed to setupServer, after the specific /api/products handler.',
    solution: `import { http, HttpResponse, passthrough } from 'msw';

const server = setupServer(
  http.get('/api/products', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    return HttpResponse.json(PAGE_DATA[page] ?? []);
  }),
  // Diagnostic catch-all — must be LAST so specific handlers match first
  http.get('*', ({ request }) => {
    console.log('UNHANDLED:', request.url);
    return passthrough();
  }),
);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a handler registered for a bare path automatically ignores unrelated query params but still responds correctly to page-specific requests.',
      reality: 'MSW matches the path only and ignores the query string by default — a bare-path handler returns the SAME response regardless of query params unless the resolver explicitly parses them via new URL(request.url).searchParams.',
    },
    {
      thought: 'onUnhandledRequest: "warn" is sufficient during active test development since it still tells you about mismatches.',
      reality: 'a console warning is easy to miss in a large test suite\'s output — using "error" while actively writing new tests interrupts the run immediately with the exact unmatched URL, catching mismatches far faster.',
    },
    {
      thought: 'a test asserting some content rendered after a paginated fetch proves pagination works correctly.',
      reality: 'if the handler ignores query params and always returns the same data, that test would pass even with a completely broken pagination feature — verifying DIFFERENT responses for different page values is what actually proves it.',
    },
  ];
}
