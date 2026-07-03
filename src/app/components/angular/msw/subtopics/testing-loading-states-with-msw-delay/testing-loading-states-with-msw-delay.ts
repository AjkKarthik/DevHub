import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-loading-states-with-msw-delay-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-loading-states-with-msw-delay.html',
  styleUrl: './testing-loading-states-with-msw-delay.scss',
})
export class TestingLoadingStatesWithMswDelaySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Most MSW examples skip the loading state entirely — an easy gap to miss',
      points: [
        'The main topic\'s own component test examples jump straight from render to <code>screen.findByText(\'Alice\')</code> — which WAITS for the async resolution automatically, meaning the test never actually observes or asserts anything about the INTERIM loading UI (a spinner, a skeleton) that renders while the request is still pending. If that loading UI has a bug (wrong CSS class, missing ARIA attribute, or simply never renders at all because of a state-management mistake), a suite full of only "final state" assertions would never catch it.',
        'MSW\'s <code>delay()</code> function (imported from the <code>msw</code> package) artificially slows down a handler\'s response, creating a reliable WINDOW during which the loading state is guaranteed to be visible — without it, a fast enough test environment might resolve the mocked request before the test framework even gets a chance to assert on the loading UI.',
      ],
    },
    {
      heading: 'Asserting the loading state appears, THEN the final state replaces it',
      points: [
        'The pattern: <code>server.use(http.get(\'/api/products\', async () =&gt; { await delay(300); return HttpResponse.json([...]); }))</code>, render the component, IMMEDIATELY assert the loading indicator is present (<code>screen.getByRole(\'status\')</code> or similar — no <code>await</code>/<code>find</code>, since it should already be there synchronously after the initial render), THEN <code>await screen.findByText(\'Widget A\')</code> to wait for the delayed response, and finally assert the loading indicator is GONE (<code>expect(screen.queryByRole(\'status\')).not.toBeInTheDocument()</code>).',
        'This three-part assertion — present, then resolved, then absent — is a stronger test than either half alone: a component that shows the spinner forever (never clearing it) would pass a "loading state appears" check but fail the final "spinner gone" check; a component that never shows a spinner at all would fail the first check even if the final content eventually renders correctly.',
      ],
    },
    {
      heading: 'Testing a debounced or race-prone loading indicator',
      points: [
        'For a component that DEBOUNCES rapid successive requests (e.g. a search-as-you-type feature), a fixed <code>delay()</code> lets you construct a specific race scenario: fire two requests close together where the SECOND resolves before the first (by giving the first a longer delay), and assert the component displays results from the request that was started LAST (the current user intent), not whichever one happened to resolve first — a common bug class in components without proper request cancellation (e.g. missing <code>switchMap</code> in favor of <code>mergeMap</code>).',
        'This kind of test is only possible because MSW lets you control response TIMING precisely per-handler, per-test — something that is much harder to construct reliably with a real backend or with generic promise-based mocks that resolve in call order regardless of configured delay.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/product-list.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

interface Product { id: number; name: string; }

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    @if (loading()) {
      <p role="status">Loading products...</p>
    }
    @for (p of products(); track p.id) {
      <p>{{ p.name }}</p>
    }
  \`,
})
export class ProductListComponent {
  private http = inject(HttpClient);
  loading = signal(true);
  products = signal<Product[]>([]);

  constructor() {
    this.http.get<Product[]>('/api/products').subscribe(data => {
      this.products.set(data);
      this.loading.set(false);
    });
  }
}
`,
    },
    {
      path: 'src/app/product-list.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { render, screen } from '@testing-library/angular';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { ProductListComponent } from './product-list';

const server = setupServer();

describe('ProductListComponent loading state', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('shows loading, then content, then clears loading', async () => {
    server.use(
      http.get('/api/products', async () => {
        await delay(300); // guarantees a window where loading is visible
        return HttpResponse.json([{ id: 1, name: 'Widget A' }]);
      }),
    );

    await render(ProductListComponent, {
      providers: [provideHttpClient()],
    });

    // 1. Loading indicator present immediately (no await — synchronous check)
    expect(screen.getByRole('status')).toBeInTheDocument();

    // 2. Wait for the delayed response to resolve
    expect(await screen.findByText('Widget A')).toBeInTheDocument();

    // 3. Loading indicator is now gone
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
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
    <h3>Testing loading states with MSW delay()</h3>
    <p>Open product-list.spec.ts — delay(300) guarantees the loading indicator has a
    real window to be visible in, and the test asserts it appears, resolves, then
    disappears, not just the final content.</p>
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
  <head><title>Testing loading states with MSW delay()</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving a component that never clears its loading flag would fail — simulate the bug and confirm the third assertion (loading gone) fails.',
    hint: 'Temporarily remove `this.loading.set(false)` from the component\'s subscribe callback, re-run the test, and observe that `expect(screen.queryByRole(\'status\')).not.toBeInTheDocument()` now fails — this proves the third assertion is load-bearing, not redundant.',
    solution: `// product-list.ts — introduce the bug intentionally to observe the test catch it
constructor() {
  this.http.get<Product[]>('/api/products').subscribe(data => {
    this.products.set(data);
    // this.loading.set(false);  <-- removed, simulating the bug
  });
}

// Re-running the existing test now fails at:
// expect(screen.queryByRole('status')).not.toBeInTheDocument();
// confirming the third assertion is genuinely load-bearing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that waits for the final resolved content (via findByText) also implicitly verifies the loading state worked correctly.',
      reality: 'findByText only cares about the eventual result — it never observes whether a loading indicator appeared or was properly cleared; those need their own explicit assertions.',
    },
    {
      thought: 'without an artificial delay, a component\'s loading state can still be reliably tested in a fast test environment.',
      reality: 'a sufficiently fast mock response can resolve before the test framework even gets a chance to assert on the loading UI — MSW\'s delay() creates a guaranteed window during which the loading state is genuinely observable.',
    },
    {
      thought: 'testing that a loading indicator appears is sufficient — checking that it later disappears is redundant.',
      reality: 'a component that shows a spinner forever (never clearing it) would pass an "appears" check but fail a separate "spinner gone after resolution" check — the two assertions catch different bugs.',
    },
  ];
}
