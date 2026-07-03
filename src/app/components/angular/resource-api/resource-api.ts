import { Component, signal, resource } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

interface Post { id: number; title: string; body: string; }

@Component({
  selector: 'app-resource-api',
  standalone: true,
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
    QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
    BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent,
    RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './resource-api.html',
  styleUrl: './resource-api.scss',
})
export class ResourceApiDemo {
  selectedId = signal(1);

  postResource = resource<Post, number>({
    params: () => this.selectedId(),
    loader: ({ params: id, abortSignal }) =>
      fetch(`https://jsonplaceholder.typicode.com/posts/${id}`, { signal: abortSignal })
        .then(r => r.json() as Promise<Post>),
  });

  prerequisites: Prerequisite[] = [
    { label: 'Signal Effects', route: '/angular/signal-effects' },
    { label: 'HTTP Client', route: '/angular/http-demo' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'resource()',       type: 'function', desc: 'Creates a signal-aware async data primitive that reactively re-fetches whenever its params signal changes.', since: '19' },
    { name: 'httpResource()',   type: 'function', desc: "Variant of resource() that uses Angular's HttpClient under the hood, integrating with DI interceptors and auto-cancelling stale requests.", since: '19' },
    { name: 'ResourceStatus',   type: 'interface', desc: 'Enum-like type describing the current state: idle, loading, reloading, resolved, error, or local.', since: '19' },
    { name: '.value()',         type: 'function', desc: 'Signal accessor returning the resolved data, or undefined while loading or on error.', since: '19' },
    { name: '.isLoading()',     type: 'function', desc: 'Signal accessor returning true while the loader is executing (covers both initial load and reloads).', since: '19' },
    { name: '.error()',         type: 'function', desc: 'Signal accessor holding the thrown error value if the loader rejected, otherwise undefined.', since: '19' },
    { name: '.reload()',        type: 'function', desc: 'Imperatively triggers the loader with the current params — no signal mutation needed; useful for refresh buttons.', since: '19' },
    { name: '.set()',           type: 'function', desc: "Locally overrides the resource value without triggering the loader; status becomes 'local' until the next params change.", since: '19' },
    { name: 'abortSignal',      type: 'token', desc: 'An AbortSignal provided to the resource loader that cancels the in-flight fetch when params change.', since: '19' },
    { name: 'params',           type: 'function', desc: 'The reactive function inside resource() that reads signals; when any read signal changes, Angular re-runs the loader.', since: '19' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is resource() and why it exists',
      points: [
        '<code>resource()</code> is Angular\'s built-in signal-native async data primitive (Angular 19+). It replaces the common pattern of <code>toObservable(signal).pipe(switchMap(…))</code> with a declarative, reactive alternative that never requires manual subscriptions.',
        'It takes two things: a <code>params</code> function that reads signals synchronously, and an async <code>loader</code> function. When any signal read inside <code>params</code> changes, Angular automatically re-runs the loader with the new value.',
        'The resource exposes its state entirely as signals: <code>value()</code>, <code>error()</code>, <code>isLoading()</code>, and <code>status()</code>. Your template reacts to changes in these signals the same way it reacts to any other signal — no <code>async</code> pipe, no loading-flag management.',
        'Status values convey the full lifecycle: <code>idle</code> (no params), <code>loading</code> (initial fetch), <code>reloading</code> (refetch with same params), <code>resolved</code> (data available), <code>error</code> (loader threw), and <code>local</code> (value was set manually with <code>.set()</code>).',
        'Before <code>resource()</code>, the equivalent in Angular required: a separate <code>loading</code> signal, a <code>data</code> signal, an <code>error</code> signal, a <code>toObservable</code> call, a <code>switchMap</code> and a <code>takeUntilDestroyed</code> subscription. <code>resource()</code> eliminates all of that boilerplate.',
      ],
    },
    {
      heading: 'The params function — reactivity and edge cases',
      points: [
        'The <code>params</code> function must be <strong>synchronous</strong>. It reads signals — never calls <code>await</code> or any async API. Angular\'s reactivity system tracks signal reads during <code>params()</code> execution; async calls would break that tracking.',
        'When <code>params()</code> returns <code>undefined</code>, the resource goes to <code>idle</code> status and the loader is not called. This is the idiomatic way to "pause" a resource conditionally: <code>params: () => this.userId() ?? undefined</code>.',
        'Each time <code>params</code> produces a new value, Angular compares it by reference (for objects/arrays) or by value (for primitives). If the value is reference-equal to the previous one, the loader does not re-run — preventing unnecessary fetches.',
        'You can read multiple signals in one <code>params</code> function: <code>params: () => ({ userId: this.userId(), tab: this.tab() })</code>. The loader re-runs whenever either signal changes.',
        'A change in a signal read inside the <code>loader</code> (not <code>params</code>) does NOT trigger a re-fetch. Only signals read in <code>params</code> drive reactivity. This is a deliberate design: <code>params</code> is the reactive gate; <code>loader</code> is the async operation.',
      ],
    },
    {
      heading: 'The loader function — async, cancellation, and errors',
      points: [
        'The loader receives <code>{ params, abortSignal }</code>. Pass <code>abortSignal</code> to <code>fetch(url, { signal: abortSignal })</code> so that when params change while a fetch is in flight, the stale request is aborted and Angular starts a new one. Without this, you risk race conditions where a slower old response overwrites a faster new one.',
        'The loader must return a <code>Promise</code>. For RxJS Observables, wrap with <code>lastValueFrom(observable, { defaultValue: null })</code>. For Angular\'s <code>HttpClient</code>, use <code>httpResource()</code> instead which handles this automatically.',
        'If the loader throws or the Promise rejects, <code>resource.error()</code> is populated, <code>resource.value()</code> becomes <code>undefined</code>, and <code>resource.status()</code> becomes <code>error</code>. The error is retained until a successful reload.',
        'There is no built-in retry. For retry-on-error, implement it in the loader itself: <code>loader: async ({ params }) => { for (let i = 0; i < 3; i++) { try { return await fetch(…); } catch {} } throw new Error(\'max retries\'); }</code>.',
        'The loader runs inside an injection context, so you can use <code>inject()</code> inside it. This means you can inject <code>HttpClient</code>, services, or tokens directly in the loader body.',
      ],
    },
    {
      heading: 'httpResource() — HttpClient integration',
      points: [
        '<code>httpResource()</code> from <code>@angular/common/http</code> is a convenience wrapper over <code>resource()</code> that uses Angular\'s <code>HttpClient</code> internally. It participates in the DI interceptor chain — auth tokens, error-logging interceptors, and testing with <code>HttpClientTestingModule</code> all work as expected.',
        'Pass a signal-returning URL function: <code>httpResource&lt;Post[]&gt;(() =&gt; \`/api/posts?page=\${this.page()}\`)</code>. When <code>page()</code> changes, the previous request is automatically cancelled and a new one starts.',
        'It accepts an optional options object as the second argument: <code>httpResource(urlFn, { method: \'POST\', body: this.formData() })</code>. You can also set response type: <code>{ responseType: \'text\' }</code> for plain-text responses.',
        'The main reason to use <code>httpResource()</code> over raw <code>resource()</code> with <code>fetch()</code>: interceptors. Auth token injection, global error handling, and XSRF protection are implemented as HTTP interceptors — <code>fetch()</code> bypasses all of them.',
        '<code>httpResource()</code> produces a <code>HttpResourceRef</code> which extends the normal resource interface with an <code>headers()</code> signal that exposes the response headers after resolution.',
      ],
    },
    {
      heading: 'Local state, optimistic updates, and resource() vs alternatives',
      points: [
        '<code>resource.set(newValue)</code> overwrites the resource value immediately (status → <code>local</code>) without running the loader. This is used for optimistic UI updates: set the expected result immediately, then let a side effect confirm or revert it after the server responds.',
        '<code>resource.update(fn)</code> is the same as <code>set</code> but derives the new value from the existing one: <code>r.update(old =&gt; ({ ...old!, count: old!.count + 1 }))</code>. Any subsequent params change discards the local value and triggers a real fetch.',
        'For a resource that depends on another resource\'s value, use <code>params: () => this.userResource.value()?.id</code>. The undefined-pausing behaviour ensures the dependent resource stays idle until the upstream resolves.',
        '<code>resource()</code> has no built-in cache layer. If the user navigates away and back, the loader re-runs. For request deduplication and stale-while-revalidate caching across components, consider TanStack Query (<code>@tanstack/angular-query-experimental</code>) which wraps <code>resource()</code> or <code>signal()</code> with a cache.',
        'Choose <code>resource()</code> for simple single-component data fetching; choose TanStack Query when you need cross-component cache sharing, background refetch, or stale-time control. The two are complementary, not competing.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'resource() basics',
      language: 'typescript',
      code: `import { Component, signal, resource } from '@angular/core';

@Component({ standalone: true, template: \`
  @if (userResource.isLoading()) { <p>Loading...</p> }
  @if (userResource.error()) { <p>Error: {{ userResource.error() }}</p> }
  @if (userResource.value(); as user) { <p>{{ user.name }}</p> }
\` })
export class UserComponent {
  userId = signal(1);

  userResource = resource({
    params: () => this.userId(),          // reactive — re-runs loader when userId changes
    loader: ({ params: id, abortSignal }) =>
      fetch(\`/api/users/\${id}\`, { signal: abortSignal })
        .then(r => r.json()),             // pass abortSignal to avoid race conditions
  });
}

// Useful status checks:
// userResource.isLoading()  → boolean (true while loading OR reloading)
// userResource.value()      → User | undefined
// userResource.error()      → unknown
// userResource.status()     → idle | loading | reloading | resolved | error | local`,
    },
    {
      label: 'httpResource()',
      language: 'typescript',
      code: `import { Component, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

interface Post { id: number; title: string; body: string; }

@Component({ standalone: true, template: \`
  @if (posts.isLoading()) { <p>Loading posts...</p> }
  @for (post of posts.value() ?? []; track post.id) {
    <li>{{ post.title }}</li>
  }
  <button (click)="page.update(p => p + 1)">Next page</button>
\` })
export class PostListComponent {
  page = signal(1);

  // httpResource() uses Angular's HttpClient → participates in interceptors
  posts = httpResource<Post[]>(
    () => \`https://jsonplaceholder.typicode.com/posts?_page=\${this.page()}&_limit=5\`
  );
  // Auto-cancels the previous request when page() changes.
  // Headers are accessible via: posts.headers()?.get('X-Total-Count')
}`,
    },
    {
      label: 'Reload, set & optimistic',
      language: 'typescript',
      code: `// ── Reload — refetch without changing params ─────────────────────
// Useful for a manual refresh button:
refreshBtn() { this.userResource.reload(); }

// ── Optimistic update ─────────────────────────────────────────────
async likePost() {
  // Immediately update the UI (status → 'local')
  this.postResource.update(p => ({ ...p!, likes: p!.likes + 1 }));
  try {
    await fetch(\`/api/posts/\${this.postId()}/like\`, { method: 'POST' });
    // Server confirmed — reload to get the authoritative value
    this.postResource.reload();
  } catch {
    // Revert by reloading from server
    this.postResource.reload();
  }
}

// ── Conditional fetch (undefined params → idle) ────────────────────
// Resource stays idle until both are set:
detailResource = resource({
  params: () => {
    const user = this.userResource.value();
    const tab  = this.selectedTab();
    if (!user || tab === 'summary') return undefined; // pause fetch
    return { userId: user.id, tab };
  },
  loader: ({ params }) => fetch(\`/api/details/\${params.userId}?tab=\${params.tab}\`)
    .then(r => r.json()),
});`,
    },
    {
      label: 'Dependent resources',
      language: 'typescript',
      code: `// ── Resource B depends on Resource A's resolved value ────────────
// The key: undefined params → idle (no fetch until upstream resolves)

@Component({ standalone: true, template: \`
  @if (orders.isLoading()) { <p>Loading orders...</p> }
  @for (o of orders.value() ?? []; track o.id) { <li>{{ o.name }}</li> }
\` })
export class DependentResourceDemo {
  userId = signal(1);

  // ── Resource A: fetch the user ─────────────────────────────────
  user = resource({
    params: () => this.userId(),
    loader: ({ params: id }) =>
      fetch(\`/api/users/\${id}\`).then(r => r.json()),
  });

  // ── Resource B: fetch orders only after user resolves ──────────
  orders = resource({
    params: () => this.user.value()?.id,  // undefined while user is loading
    loader: ({ params: userId }) =>
      fetch(\`/api/orders?userId=\${userId}\`).then(r => r.json()),
  });
}

// orders.status() progression:
// 1. idle    — user is still loading
// 2. loading — user resolved, orders fetch started
// 3. resolved — orders data available`,
    },
    {
      label: 'Error handling',
      language: 'typescript',
      code: `// ── Pattern 1: Display error in template ──────────────────────────
@Component({ standalone: true, template: \`
  @if (data.error()) {
    <div class="error-banner">
      Failed to load: {{ data.error() }}
      <button (click)="data.reload()">Retry</button>
    </div>
  }
  @if (data.value(); as result) {
    <pre>{{ result | json }}</pre>
  }
\` })
export class ErrorExampleComponent {
  data = resource({
    params: () => true,   // always fetch
    loader: async ({ abortSignal }) => {
      const r = await fetch('/api/data', { signal: abortSignal });
      if (!r.ok) throw new Error(\`HTTP \${r.status} \${r.statusText}\`);
      return r.json();
    },
  });
}

// ── Pattern 2: Retry logic inside loader ────────────────────────────
function withRetry<T>(loader: () => Promise<T>, retries = 3): Promise<T> {
  return loader().catch(err =>
    retries > 0 ? withRetry(loader, retries - 1) : Promise.reject(err)
  );
}

data = resource({
  params: () => this.id(),
  loader: ({ params: id }) =>
    withRetry(() => fetch(\`/api/items/\${id}\`).then(r => r.json())),
});`,
    },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Manual HTTP + toSignal() vs resource()',
      before: `// Old: manual subscription chain, loading flag, error tracking
const userId$ = toObservable(this.userId);
this.user$ = userId$.pipe(
  switchMap(id => this.http.get('/api/users/' + id))
);
// Still need: isLoading signal, error signal, async pipe in template`,
      after: `// New: resource() handles reactivity and all state signals
userResource = resource({
  params: () => this.userId(),
  loader: ({ params: id, abortSignal }) =>
    fetch('/api/users/' + id, { signal: abortSignal }).then(r => r.json()),
});
// Template: userResource.value(), .isLoading(), .error() — no async pipe`,
      note: 'resource() replaces toObservable + switchMap + toSignal + manual loading/error tracking with a single, unified reactive primitive.',
    },
    {
      title: 'Manual loading flag vs resource.isLoading()',
      before: `// Old: manually track loading state
isLoading = signal(false);
loadUser() {
  this.isLoading.set(true);
  fetch('/api/user')
    .then(() => this.isLoading.set(false))
    .catch(() => this.isLoading.set(false));
}`,
      after: `// New: resource exposes isLoading() as a built-in signal
userResource = resource({
  params: () => this.userId(),
  loader: ({ params: id }) => fetch('/api/users/' + id).then(r => r.json()),
});
// Template: @if (userResource.isLoading()) { <p>Loading...</p> }`,
      note: 'resource() exposes isLoading(), value(), error(), and status() as signals — no manual state management needed.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling async code inside params()',
      wrong: `userResource = resource({
  params: async () => await this.getId(), // WRONG: async in params
  loader: ({ params: id }) => fetch('/api/' + id),
});`,
      right: `userId = signal(1);
userResource = resource({
  params: () => this.userId(), // synchronous signal read only
  loader: ({ params: id }) => fetch('/api/' + id),
});`,
      explanation: 'The params function must be synchronous — it reads signals for reactivity tracking. Async code inside params breaks Angular\'s signal-tracking. Put all async logic in the loader instead.',
    },
    {
      title: 'Forgetting to pass abortSignal to fetch()',
      wrong: `loader: ({ params: id }) =>
  fetch('/api/users/' + id).then(r => r.json())
// If params change while this fetch is in-flight, the stale request
// still completes and may overwrite the newer response`,
      right: `loader: ({ params: id, abortSignal }) =>
  fetch('/api/users/' + id, { signal: abortSignal })
    .then(r => r.json())
// Stale request is aborted when params change — no race condition`,
      explanation: 'Without abortSignal, stale in-flight requests are not cancelled. When params change rapidly (e.g., a search input), you can end up with out-of-order responses overwriting the correct data. Always forward abortSignal to fetch().',
    },
    {
      title: 'Using resource() when httpResource() is more appropriate',
      wrong: `// Bypasses Angular's interceptor chain (auth, XSRF, error handling)
userResource = resource({
  params: () => this.userId(),
  loader: ({ params: id }) =>
    fetch('/api/users/' + id).then(r => r.json()),
});`,
      right: `// httpResource() uses HttpClient → interceptors work
userResource = httpResource<User>(
  () => \`/api/users/\${this.userId()}\`
);`,
      explanation: 'fetch() bypasses Angular\'s HTTP interceptor chain. auth-token injection, XSRF protection, global error-logging interceptors, and HttpClientTestingModule all rely on HttpClient. For standard Angular HTTP calls, httpResource() is the right choice.',
    },
    {
      title: 'Expecting .set() changes to persist after params change',
      wrong: `// Sets local value — assumes it persists indefinitely
this.userResource.set({ name: 'Optimistic Name' });
// Later, userId signal changes — local value is silently discarded
// and loader re-runs, overwriting the "optimistic" data`,
      right: `// After optimistic .set(), call reload() once the server confirms
this.userResource.set({ name: 'Optimistic Name' });
await saveToServer(newName);
this.userResource.reload(); // sync back with server truth`,
      explanation: '.set() sets status to "local", but any params change discards the local value and re-runs the loader. .set() is for temporary optimistic UI; always reload from the server to confirm or revert. Do not rely on .set() for persistent state.',
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does the `params` function in `resource()` do when a signal it reads changes?',
      options: [
        'It emits a new Observable value that the loader subscribes to',
        'It automatically re-runs the loader with the new params value',
        'It dispatches a custom DOM event that triggers change detection',
        'It calls reload() internally after a 300ms debounce',
      ],
      answer: 1,
      explanation: 'The params function is a reactive computation. When any signal it reads changes, Angular detects the new params value and automatically re-runs the loader — no manual subscription or switchMap is needed.',
    },
    {
      q: 'Which of the following is a valid status value for an Angular resource()?',
      options: ['pending', 'fetching', 'reloading', 'stale'],
      answer: 2,
      explanation: 'Angular resource() uses: idle, loading, reloading, resolved, error, and local as its status values. "reloading" occurs when the resource is refetching with the same params (e.g., after calling reload()).',
    },
    {
      q: 'What is the primary difference between resource() and httpResource()?',
      options: [
        'resource() only works with WebSockets; httpResource() works with REST APIs',
        'httpResource() returns an Observable while resource() returns a Promise',
        "resource() works with any async source (fetch, custom Promise), while httpResource() wraps Angular's HttpClient and integrates with DI interceptors",
        'resource() requires Zone.js but httpResource() is zoneless',
      ],
      answer: 2,
      explanation: 'resource() is general-purpose and works with any Promise-returning async source. httpResource() specifically uses HttpClient, meaning it participates in the interceptor chain and DI system. Prefer httpResource() for standard HTTP calls.',
    },
    {
      q: 'How do you force a resource to refetch data without changing the params signal?',
      options: [
        'Set the params signal to undefined then back to its original value',
        'Call myResource.reload()',
        'Call myResource.set(undefined) to clear it',
        'Inject ResourceManager and call refresh(myResource)',
      ],
      answer: 1,
      explanation: 'Calling myResource.reload() triggers the loader again with the current params value without mutating any signal. This is useful for implementing a manual refresh button.',
    },
    {
      q: 'What is the purpose of the abortSignal provided to the resource loader?',
      options: [
        'It is used to cancel the resource entirely and free its memory',
        'It is passed to fetch() so that stale in-flight requests are cancelled when params change, preventing race conditions',
        'It resets the resource status to idle when triggered',
        'It prevents the loader from running if another signal has an error',
      ],
      answer: 1,
      explanation: 'When params change while a fetch is still in-flight, Angular provides a new abortSignal. Passing it to fetch(url, { signal: abortSignal }) cancels the stale request automatically, preventing race conditions where an older response arrives after a newer one.',
    },
    {
      q: 'What happens when the params() function returns undefined?',
      options: [
        'The resource throws an error and goes to error status',
        'The resource stays in idle status and the loader is not called',
        'The loader is called with undefined as the params argument',
        'The resource uses the previous params value and keeps the last resolved data',
      ],
      answer: 1,
      explanation: 'Returning undefined from params() is the idiomatic way to pause a resource. The status becomes "idle" and the loader is not invoked. This is useful for dependent resources: params: () => this.user.value()?.id stays idle until the upstream resolves.',
    },
    {
      q: 'What status does a resource have after calling resource.set(someValue)?',
      options: [
        'resolved — because a value is now available',
        'local — signalling that the value was set manually, not by the loader',
        'reloading — because the resource will sync with the server next tick',
        'idle — the loader is paused when a local value is provided',
      ],
      answer: 1,
      explanation: "resource.set() puts the resource into 'local' status, distinct from 'resolved'. This signals that the value was set manually (e.g., optimistically) rather than loaded from the async source. The next params change discards the local value and triggers the loader.",
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'A team uses resource() with a loader that calls fetch() directly instead of using httpResource(), specifically to make an HTTP call. In a component test, HttpTestingController.expectOne() is used to assert the request was made — does this work?',
      a: "No — HttpTestingController only intercepts requests made through Angular's HttpClient (and its HTTP_INTERCEPTORS chain); a resource() loader calling the browser's native fetch() directly bypasses HttpClient entirely, so HttpTestingController never sees that request and expectOne() will fail to find any matching request, even though a real HTTP call is genuinely happening. This is a concrete, practical reason to prefer httpResource() (or a loader that calls HttpClient internally) over raw fetch() inside resource() for anything HTTP-related: it isn't just about getting interceptors for auth/XSRF, it's also about staying testable with Angular's standard HTTP testing utilities — a fetch()-based resource loader needs to be tested by mocking the global fetch function instead, a different and less Angular-idiomatic testing pattern.",
    },
    {
      q: 'How does the params() function make resource() reactive?',
      a: '<code>params: () => this.userId()</code> reads a signal inside a reactive computation. Angular tracks which signals are read during <code>params()</code> execution. When any of those signals change, Angular detects the new <code>params</code> value and re-runs the <code>loader</code> automatically — no manual subscription, switchMap, or toSignal needed.',
    },
    {
      q: 'What are the status values of a resource?',
      a: '<strong>idle</strong> — no params (params returned undefined), no fetch.<br><strong>loading</strong> — initial fetch in progress.<br><strong>reloading</strong> — refetching with the same params (after <code>.reload()</code> or a reactive re-trigger).<br><strong>resolved</strong> — loader completed successfully, data is available.<br><strong>error</strong> — loader threw or the Promise rejected.<br><strong>local</strong> — value was set directly with <code>.set()</code> or <code>.update()</code>.',
    },
    {
      q: 'How do you force a resource to refetch without changing params?',
      a: 'Call <code>myResource.reload()</code>. It triggers the loader again with the current params — status transitions to <code>reloading</code> (not <code>loading</code>), and the previous value remains accessible via <code>.value()</code> while the new fetch is in progress. This is useful for a manual "Refresh" button that does not mutate the underlying signal.',
    },
    {
      q: 'Can you set the resource value locally without fetching?',
      a: 'Yes — <code>myResource.set(localValue)</code> sets the value directly (status becomes <code>local</code>). <code>myResource.update(old =&gt; ...)</code> derives from the current value. Both are used for optimistic UI: update the view immediately, then <code>reload()</code> after the server confirms. The next params change discards the local value and triggers a real fetch.',
    },
    {
      q: 'How does abortSignal in the loader help?',
      a: 'When params change while a fetch is in flight, Angular triggers a new load and provides a new <code>abortSignal</code> to the loader. Pass it to <code>fetch(url, { signal: abortSignal })</code> to cancel the stale request. Without it, both the old and new requests complete, and whichever finishes last wins — causing a race condition where the UI shows stale data.',
    },
    {
      q: 'How do you implement a dependent resource — one that needs another resource\'s resolved value?',
      a: 'Use the undefined-pausing behaviour: <code>params: () => this.userResource.value()?.id</code>. While the upstream resource is loading, <code>.value()</code> returns <code>undefined</code>, so <code>params</code> returns <code>undefined</code> too — keeping the dependent resource in <code>idle</code> status. Once the upstream resolves, <code>.value()?.id</code> returns a real value and the dependent resource starts fetching automatically. No manual coordination needed.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'resource() (Angular 19+) is a signal-native async data primitive: it reactively re-fetches when its params signal changes and exposes value(), isLoading(), error(), and status() as signals — replacing the toObservable + switchMap + manual loading-flag pattern.',
    mustKnow: [
      '<code>params</code> must be a synchronous signal read — async code inside params breaks reactivity tracking',
      'Returning <code>undefined</code> from <code>params()</code> puts the resource in <code>idle</code> status — the loader is not called. Use this to pause dependent resources',
      'Always forward <code>abortSignal</code> to <code>fetch()</code> to cancel stale in-flight requests when params change',
      '<code>httpResource()</code> uses Angular\'s <code>HttpClient</code> — interceptors, XSRF, and testing utilities work; raw <code>fetch()</code> in <code>resource()</code> bypasses all of them',
      '<code>.set()</code> / <code>.update()</code> set status to <code>local</code> for optimistic UI — the next params change discards the local value and re-triggers the loader',
      '<code>.reload()</code> refetches without mutating any signal — status becomes <code>reloading</code> and the previous value remains visible while loading',
      '<code>resource()</code> has no built-in cache layer — for cross-component cache sharing and stale-while-revalidate, use TanStack Query',
    ],
    interviewFocus: [
      'What are the status values of a resource and when does each apply?',
      'Why must the params function be synchronous, and what happens if you return undefined from it?',
      'How does resource() compare to the RxJS toObservable + switchMap pattern?',
      'When should you use httpResource() vs resource() with fetch()?',
      'How do you implement optimistic updates with resource() and what are the pitfalls?',
    ],
  };

  challenge: Challenge = {
    title: 'Build a reactive user lookup with resource()',
    language: 'typescript',
    description: "Create a component that lets the user pick a user ID (1–5) and displays that user's name, email, and company fetched from the JSONPlaceholder API using Angular's resource() API. Show a loading indicator while fetching, an error message if the request fails, and the user card once resolved. Add a Reload button that refetches without changing the selected ID.",
    hints: [
      'Define a signal for the selected user ID, then pass it as the params function: params: () => this.userId()',
      'Use fetch() in the loader and forward abortSignal: loader: ({ params: id, abortSignal }) => fetch(url, { signal: abortSignal }).then(r => r.json() as Promise<User>)',
      'Check postResource.isLoading(), postResource.error(), and postResource.value() in the template using @if blocks',
      'Call this.userResource.reload() in the button\'s click handler to trigger a fresh fetch without changing userId',
    ],
    starterCode: `import { Component, signal, resource } from '@angular/core';

interface User {
  id: number; name: string; email: string; company: { name: string };
}

@Component({
  selector: 'app-user-lookup',
  standalone: true,
  template: \`
    <!-- 1. Render buttons for IDs 1-5 that set userId signal -->
    <!-- 2. Show status badge -->
    <!-- 3. Show loading message while isLoading() is true -->
    <!-- 4. Show error message if error() is truthy -->
    <!-- 5. Show user card (name, email, company) when value() resolves -->
    <!-- 6. Add a Reload button that calls userResource.reload() -->
  \`,
})
export class UserLookupComponent {
  // TODO: create userId signal (initial value: 1)
  // TODO: create userResource with resource<User, number>()
}`,
    solution: `import { Component, signal, resource } from '@angular/core';

interface User {
  id: number; name: string; email: string; company: { name: string };
}

@Component({
  selector: 'app-user-lookup',
  standalone: true,
  template: \`
    <div>
      @for (id of [1,2,3,4,5]; track id) {
        <button [style.fontWeight]="userId() === id ? 'bold' : 'normal'"
                (click)="userId.set(id)">User {{ id }}</button>
      }
    </div>
    <p>Status: <strong>{{ userResource.status() }}</strong></p>
    @if (userResource.isLoading()) { <p>Loading user data…</p> }
    @if (userResource.error()) { <p style="color:red">Error: {{ userResource.error() }}</p> }
    @if (userResource.value(); as user) {
      <div>
        <strong>{{ user.name }}</strong><br/>
        Email: {{ user.email }}<br/>
        Company: {{ user.company.name }}
      </div>
    }
    <button (click)="userResource.reload()">Reload</button>
  \`,
})
export class UserLookupComponent {
  userId = signal(1);

  userResource = resource<User, number>({
    params: () => this.userId(),
    loader: ({ params: id, abortSignal }) =>
      fetch(\`https://jsonplaceholder.typicode.com/users/\${id}\`, { signal: abortSignal })
        .then(r => r.json() as Promise<User>),
  });
}`,
  };
}
