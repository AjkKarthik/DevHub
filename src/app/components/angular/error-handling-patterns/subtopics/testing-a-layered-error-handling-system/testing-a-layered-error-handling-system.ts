import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-a-layered-error-handling-system-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-a-layered-error-handling-system.html',
  styleUrl: './testing-a-layered-error-handling-system.scss',
})
export class TestingALayeredErrorHandlingSystemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Each layer needs its own isolated test — they should never share a test',
      points: [
        'The main topic\'s three layers (global <code>ErrorHandler</code>, HTTP interceptor, component-level signal) are DELIBERATELY independent — testing them TOGETHER in one integration test makes it hard to tell which layer actually failed when an assertion breaks. Test each layer with the smallest possible harness: the ErrorHandler with a plain instantiation and a mock logger, the interceptor with <code>HttpTestingController</code>, the component with a mocked service that returns a controlled error.',
        'This mirrors the "layers are complementary, not alternatives" theory from the main page — the tests should reflect that architectural separation, not just the code structure.',
      ],
    },
    {
      heading: 'Testing the HTTP interceptor\'s status-code branching with HttpTestingController',
      points: [
        'Register the interceptor via <code>provideHttpClient(withInterceptors([errorInterceptor]))</code> and <code>provideHttpClientTesting()</code> in the TestBed providers, make a request through <code>HttpClient</code>, then use <code>httpTestingController.expectOne(url).flush(body, { status: 401, statusText: \'Unauthorized\' })</code> to simulate each status code branch — 401, 403, 404, 429, and 5xx each need their OWN test asserting the specific side effect (router navigation, notifier call, or silent pass-through) that branch is supposed to trigger.',
        'Crucially, also assert the error was RE-THROWN after interceptor handling — subscribe to the request with an <code>error</code> callback and confirm it fires; a bug where the interceptor accidentally swallows the error (the exact common mistake documented on the main page) would otherwise pass a test that only checks the side effect and never verifies the caller still received the error.',
      ],
    },
    {
      heading: 'Testing the component\'s LoadState transitions, including the retry path',
      points: [
        'Mock the underlying service to return an error Observable on the FIRST call, assert the component\'s <code>state()</code> becomes <code>{ status: \'error\', message: ... }</code>, then reconfigure the mock to return success data, trigger the retry button\'s click handler, and assert <code>state()</code> transitions to <code>{ status: \'success\', data: ... }</code> — this proves the retry path actually re-invokes the load logic and recovers, not just that an error state can be reached.',
        'A useful additional assertion: check the RENDERED error message text matches the friendly, mapped string (e.g. "User not found." for a 404), not the raw <code>HttpErrorResponse</code> — this is a DOM-level regression test for the main page\'s "never show raw error.message" guidance.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/global-error-handler.ts',
      content: `import { ErrorHandler, Injectable } from '@angular/core';

export interface Logger { captureException(error: unknown): void; }

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private logger: Logger) {}

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);
    this.logger.captureException(error);
  }
}
`,
    },
    {
      path: 'src/app/global-error-handler.spec.ts',
      content: `import { GlobalErrorHandler, Logger } from './global-error-handler';

describe('GlobalErrorHandler', () => {
  it('forwards the error to the logging service', () => {
    const mockLogger: Logger = { captureException: jasmine.createSpy('captureException') };
    const handler = new GlobalErrorHandler(mockLogger);

    const err = new Error('boom');
    handler.handleError(err);

    expect(mockLogger.captureException).toHaveBeenCalledWith(err);
  });
});
`,
    },
    {
      path: 'src/app/product-list.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-product-list',
  standalone: true,
  template: \`
    @if (state().status === 'loading') { <p>Loading...</p> }
    @if (state().status === 'error') {
      <p class="error-text">{{ errorMessage() }}</p>
      <button (click)="load()">Retry</button>
    }
    @if (state().status === 'success') { <p>Loaded!</p> }
  \`,
})
export class ProductListComponent {
  private http = inject(HttpClient);
  state = signal<LoadState<unknown[]>>({ status: 'loading' });

  errorMessage = () => {
    const s = this.state();
    return s.status === 'error' ? s.message : '';
  };

  constructor() {
    this.load();
  }

  load() {
    this.state.set({ status: 'loading' });
    this.http.get<unknown[]>('/api/products').subscribe({
      next: data => this.state.set({ status: 'success', data }),
      error: (err: HttpErrorResponse) => this.state.set({
        status: 'error',
        message: err.status === 404 ? 'No products found.' : 'Failed to load products.',
      }),
    });
  }
}
`,
    },
    {
      path: 'src/app/product-list.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductListComponent } from './product-list';

describe('ProductListComponent error → retry cycle', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('shows a friendly message and recovers via retry', () => {
    const fixture = TestBed.createComponent(ProductListComponent);
    fixture.detectChanges();

    httpMock.expectOne('/api/products').flush('not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.componentInstance.state().status).toBe('error');
    const errorEl = fixture.nativeElement.querySelector('.error-text');
    expect(errorEl.textContent).toContain('No products found.');
    // Never the raw HttpErrorResponse text — proves the friendly mapping is used.
    expect(errorEl.textContent).not.toContain('Http failure response');

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    httpMock.expectOne('/api/products').flush([{ id: 1, name: 'Widget' }]);
    fixture.detectChanges();

    expect(fixture.componentInstance.state().status).toBe('success');
  });

  afterEach(() => httpMock.verify());
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
    <h3>Testing a layered error handling system</h3>
    <p>Open global-error-handler.spec.ts (logger forwarding) and
    product-list.spec.ts (error → retry → success cycle via HttpTestingController).</p>
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
  <head><title>Testing a layered error handling system</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving a 500 status maps to a DIFFERENT friendly message than the 404 case, verifying the status-code branching is exhaustive, not just the 404 path.',
    hint: 'Add a "shows a server-error message on 500" test that flushes with status 500 instead of 404, then asserts errorEl.textContent contains "Failed to load products." (the fallback branch) instead of "No products found."',
    solution: `it('shows a fallback message on 500', () => {
  const fixture = TestBed.createComponent(ProductListComponent);
  fixture.detectChanges();

  httpMock.expectOne('/api/products').flush('error', { status: 500, statusText: 'Server Error' });
  fixture.detectChanges();

  const errorEl = fixture.nativeElement.querySelector('.error-text');
  expect(errorEl.textContent).toContain('Failed to load products.');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the global ErrorHandler, HTTP interceptor, and component error state can share a single integration test.',
      reality: 'testing them together makes it hard to tell which layer actually failed when an assertion breaks — each layer\'s independence in the architecture should be reflected by independent, isolated tests.',
    },
    {
      thought: 'testing that an interceptor triggers the right side effect (toast, redirect) for a status code is sufficient coverage.',
      reality: 'also asserting the error was RE-THROWN afterward catches the documented common mistake of accidentally swallowing it — a side-effect-only test would miss that regression entirely.',
    },
    {
      thought: 'testing that a component reaches an error state is enough to verify the error handling UI works.',
      reality: 'testing the RETRY path back to success proves the recovery flow actually works, and asserting the rendered text is the FRIENDLY message (not the raw HttpErrorResponse) is a real regression test for the "never show raw error.message" guidance.',
    },
  ];
}
