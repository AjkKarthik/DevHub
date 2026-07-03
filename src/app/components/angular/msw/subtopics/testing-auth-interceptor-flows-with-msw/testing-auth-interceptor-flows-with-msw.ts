import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-auth-interceptor-flows-with-msw-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-auth-interceptor-flows-with-msw.html',
  styleUrl: './testing-auth-interceptor-flows-with-msw.scss',
})
export class TestingAuthInterceptorFlowsWithMswSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The claim "interceptors run" needs a test that would fail if they did not',
      points: [
        'The main topic\'s QnA states "Angular HTTP interceptors run when MSW is used" — but a test suite that never actually EXERCISES the interceptor\'s behavior doesn\'t prove this. A meaningful test: the MSW handler itself reads <code>request.headers.get(\'Authorization\')</code> and returns a DIFFERENT response depending on whether it is present and valid — if the auth interceptor were accidentally disabled or broken, this specific test would fail, unlike a generic "shows Alice" test which would pass whether or not the interceptor ran at all.',
        'This is the same "would this test actually catch the regression it claims to guard against" discipline used throughout this site\'s testing subtopics — a test asserting final UI content is necessary but not SUFFICIENT to prove interceptor behavior specifically.',
      ],
    },
    {
      heading: 'Testing the full 401 → redirect chain, not just the header presence',
      points: [
        'Beyond confirming the token reaches the request, test the CONSEQUENCE of a missing/expired token: configure the MSW handler to return 401 unconditionally for this one test, render the component, and assert the router navigated to <code>/login</code> — this exercises the SAME error-handling-patterns interceptor chain covered in an earlier topic, now proven end-to-end through MSW\'s real network-layer interception instead of a manually-triggered <code>HttpTestingController.flush()</code>.',
        'Use a mock <code>Router</code> (via <code>RouterTestingHarness</code> or a spy on <code>Router.navigate</code>) alongside MSW — MSW handles the HTTP layer, the router mock/spy handles asserting the SIDE EFFECT of the interceptor\'s response to that HTTP layer. The two are complementary testing tools operating at different layers of the same flow.',
      ],
    },
    {
      heading: 'Simulating token refresh with sequential handler overrides',
      points: [
        'A realistic auth flow: the first request fails with 401 (expired token), the app calls a refresh endpoint, then RETRIES the original request with a new token. Test this by configuring the MSW handler to inspect the SPECIFIC token value in the Authorization header — return 401 for the old token, 200 for the new one — rather than unconditionally failing; this proves the retry-with-refreshed-token logic, not just that SOME request eventually succeeds.',
        'MSW handlers can maintain simple in-memory state across requests WITHIN a single test (a closure variable incremented on each call) to simulate "the third attempt succeeds" scenarios — useful for testing retry logic (like the exponential-backoff pattern from the error-handling-patterns topic) end-to-end through the real HTTP layer instead of mocking the retry operator\'s behavior directly.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/auth.interceptor.ts',
      content: `import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  if (!token) return next(req);

  return next(req.clone({
    setHeaders: { Authorization: \`Bearer \${token}\` },
  }));
};
`,
    },
    {
      path: 'src/app/auth.service.ts',
      content: `import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = 'valid-token-123';

  getToken(): string | null { return this.token; }
  setToken(token: string | null) { this.token = token; }
}
`,
    },
    {
      path: 'src/app/profile.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { render, screen } from '@testing-library/angular';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { authInterceptor } from './auth.interceptor';
import { ProfileComponent } from './profile';

const server = setupServer(
  // Handler reads the Authorization header itself — this is what actually
  // proves the interceptor ran, not just that SOME response was returned.
  http.get('/api/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== 'Bearer valid-token-123') {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json({ name: 'Ada Lovelace' });
  }),
);

describe('ProfileComponent + authInterceptor via MSW', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('succeeds when the interceptor attaches a valid token', async () => {
    await render(ProfileComponent, {
      providers: [provideHttpClient(withInterceptors([authInterceptor]))],
    });

    // This assertion is ONLY possible if authInterceptor actually ran —
    // the handler would return 401 otherwise.
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('shows the login prompt when the token is missing (interceptor sends no header)', async () => {
    server.use(
      http.get('/api/profile', ({ request }) => {
        return request.headers.get('Authorization')
          ? HttpResponse.json({ name: 'Ada Lovelace' })
          : new HttpResponse(null, { status: 401 });
      }),
    );

    await render(ProfileComponent, {
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        // AuthService with no token — interceptor sends the request unmodified
      ],
    });

    expect(await screen.findByText(/please log in/i)).toBeInTheDocument();
  });
});
`,
    },
    {
      path: 'src/app/profile.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: \`
    @if (name()) { <p>{{ name() }}</p> }
    @if (needsLogin()) { <p>Please log in to view your profile.</p> }
  \`,
})
export class ProfileComponent {
  private http = inject(HttpClient);
  name = signal<string | null>(null);
  needsLogin = signal(false);

  constructor() {
    this.http.get<{ name: string }>('/api/profile').subscribe({
      next: data => this.name.set(data.name),
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) this.needsLogin.set(true);
      },
    });
  }
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ProfileComponent } from './profile';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProfileComponent],
  template: \`
    <h3>Testing auth interceptor flows with MSW</h3>
    <p>Open profile.spec.ts — the MSW handler itself reads the Authorization header,
    proving the interceptor genuinely ran rather than just checking final UI content.</p>
    <app-profile />
  \`,
})
export class App {}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { App } from './app/app';
import { authInterceptor } from './app/auth.interceptor';

bootstrapApplication(App, {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Testing auth interceptor flows with MSW</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test simulating a token refresh: the handler rejects "old-token" with 401 but accepts "new-token" with 200, proving retry-after-refresh logic works end to end.',
    hint: 'Configure the handler to inspect the exact Authorization header value, returning 401 for "Bearer old-token" and 200 for "Bearer new-token" — then simulate AuthService swapping tokens mid-test before the retry fires.',
    solution: `server.use(
  http.get('/api/profile', ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth === 'Bearer old-token') {
      return new HttpResponse(null, { status: 401 });
    }
    if (auth === 'Bearer new-token') {
      return HttpResponse.json({ name: 'Ada Lovelace' });
    }
    return new HttpResponse(null, { status: 401 });
  }),
);

// Test would then trigger AuthService.setToken('new-token') as part of
// simulating the refresh flow, and assert the retried request succeeds.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test asserting the final UI content ("shows Alice") is enough to prove an HTTP interceptor ran correctly.',
      reality: 'that assertion would pass whether or not the interceptor ran, if the handler does not actually depend on interceptor behavior — the handler itself must inspect the request (e.g. read the Authorization header) for the test to genuinely prove the interceptor\'s effect.',
    },
    {
      thought: 'testing MSW-backed auth flows requires mocking the router or the HTTP client separately from MSW.',
      reality: 'MSW handles the HTTP layer (via the real HttpClient) while a router mock/spy handles asserting the interceptor\'s side effect (navigation) — they are complementary tools operating at different layers of the same flow, not alternatives.',
    },
    {
      thought: 'simulating a token-refresh retry flow requires mocking the RxJS retry operator directly.',
      reality: 'an MSW handler can inspect the SPECIFIC token value sent with each request and respond differently per attempt, testing the real retry-with-refreshed-token behavior through the actual HTTP layer instead of mocking the retry logic.',
    },
  ];
}
