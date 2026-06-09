import { Component, signal, resource } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

interface Post { id: number; title: string; body: string; }

@Component({
  selector: 'app-resource-api',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './resource-api.html',
  styleUrl: './resource-api.scss',
})
export class ResourceApiDemo {
  selectedId = signal(1);

  postResource = resource<Post, number>({
    params: () => this.selectedId(),
    loader: ({ params: id }) =>
      fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then(r => r.json() as Promise<Post>),
  });

  qna: QnaItem[] = [
    { q: 'What is resource() and how does it differ from httpResource()?', a: '<code>resource()</code> works with any async source — <code>fetch()</code>, a custom promise, etc. <code>httpResource()</code> specifically wraps Angular\'s <code>HttpClient</code> and integrates with interceptors and the DI system. Prefer <code>httpResource()</code> for HTTP calls.' },
    { q: 'How does the params() function make resource() reactive?', a: '<code>params: () => this.userId()</code> reads a signal. When <code>userId()</code> changes, Angular detects the new params value and re-runs the <code>loader</code> automatically — no manual subscription or switchMap needed.' },
    { q: 'What are the status values of a resource?', a: '<code>idle</code> — no params, no load. <code>loading</code> — initial fetch in progress. <code>reloading</code> — refetching same params. <code>resolved</code> — data available. <code>error</code> — load failed. <code>local</code> — value was set locally with <code>.set()</code>.' },
    { q: 'How do you force a resource to refetch without changing params?', a: 'Call <code>myResource.reload()</code>. It triggers the loader again with the current params — useful for a manual refresh button.' },
    { q: 'Can you set the resource value locally without fetching?', a: 'Yes — <code>myResource.set(localValue)</code> sets the value directly (status becomes <code>local</code>). <code>myResource.update(old => ...)</code> derives from the current value. The next params change will reset this and trigger a real fetch.' },
    { q: 'How does abortSignal in the loader help?', a: 'When params change while a fetch is in flight, Angular triggers a new load and provides a new <code>abortSignal</code>. Pass it to <code>fetch(url, { signal: abortSignal })</code> to cancel the stale request — prevents race conditions.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is resource()?',
      points: [
        'resource() is Angular\'s built-in async data primitive — a signal-aware alternative to manual HTTP + toSignal() chains.',
        'It takes a reactive request() function and an async loader() — when the request signal changes, it re-fetches automatically.',
        'Exposes: value(), status(), error(), isLoading() as signals — no manual loading boolean needed.',
        'status values: Idle | Loading | Refreshing | Resolved | Error | Local.',
      ],
    },
    {
      heading: 'request + loader pattern',
      points: [
        'request() is a reactive function — it reads signals. When any read signal changes, the loader re-runs with the new value.',
        'loader receives { request, abortSignal } — use abortSignal to cancel in-flight fetch calls.',
        'The loader must return a Promise. For Observables wrap with lastValueFrom().',
        'Set resource.value locally with resource.set() or resource.update() — skips the loader entirely.',
      ],
    },
    {
      heading: 'httpResource() — HttpClient variant',
      points: [
        'httpResource() from @angular/common/http accepts a URL signal and returns the same signal interface.',
        'It automatically cancels the previous request on new emissions — no switchMap boilerplate.',
        'Supports typed responses: httpResource<Post[]>(() => \'/api/posts?page=\' + page()).',
        'Unlike resource(), httpResource() integrates with Angular\'s DI interceptor chain.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'resource() is available from Angular 19+ — check your version before using.',
        'Never call async code directly inside request() — it must be synchronous signal reads only.',
        'Use resource.reload() to force a fresh fetch without changing the request value.',
        'Combine with TanStack Query for advanced caching — resource() has no built-in cache layer.',
      ],
    },
  ];

  tabs: CodeTab[] = [
    {
      label: 'resource() basics',
      language: 'typescript',
      code: `import { signal, resource } from '@angular/core';

export class MyComponent {
  userId = signal(1);

  userResource = resource({
    params: () => this.userId(),   // reactive — re-runs loader when userId changes
    loader: ({ params: id, abortSignal }) =>
      fetch(\`/api/users/\${id}\`, { signal: abortSignal })
        .then(r => r.json()),
  });
}

// Template:
// userResource.isLoading()  → boolean
// userResource.value()      → User | undefined
// userResource.error()      → unknown
// userResource.status()     → ResourceStatus`,
    },
    {
      label: 'httpResource()',
      language: 'typescript',
      code: `import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';

export class PostsComponent {
  page = signal(1);

  posts = httpResource<Post[]>(
    () => \`https://jsonplaceholder.typicode.com/posts?_page=\${this.page()}&_limit=5\`
  );
}

// Auto-cancels in-flight request when page() changes.
// Uses Angular's HttpClient + interceptors under the hood.`,
    },
    {
      label: 'Local set + reload',
      language: 'typescript',
      code: `// Optimistic update — set locally, reload from server later
this.userResource.set({ ...this.userResource.value()!, name: 'New Name' });

// Force refresh without changing request signal
this.userResource.reload();

// Update locally (like signal.update())
this.userResource.update(old => ({ ...old!, score: old!.score + 1 }));`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does the `params` function in `resource()` do when a signal it reads changes?', options: ['It emits a new Observable value that the loader subscribes to', 'It automatically re-runs the loader with the new params value', 'It dispatches a custom DOM event that triggers change detection', 'It calls reload() internally after a 300ms debounce'], answer: 1, explanation: 'The params function is a reactive computation. When any signal it reads changes, Angular detects the new params value and automatically re-runs the loader — no manual subscription or switchMap is needed.' },
    { q: 'Which of the following is a valid status value for an Angular `resource()`?', options: ['pending', 'fetching', 'reloading', 'stale'], answer: 2, explanation: 'Angular resource() uses: idle, loading, reloading, resolved, error, and local as its status values. \'reloading\' occurs when the resource is refetching with the same params (e.g., after calling reload()).' },
    { q: 'What is the primary difference between `resource()` and `httpResource()`?', options: ['resource() only works with WebSockets; httpResource() works with REST APIs', 'httpResource() returns an Observable while resource() returns a Promise', 'resource() works with any async source (fetch, custom Promise), while httpResource() wraps Angular\'s HttpClient and integrates with DI interceptors', 'resource() requires Zone.js but httpResource() is zoneless'], answer: 2, explanation: 'resource() is general-purpose and works with any Promise-returning async source. httpResource() specifically uses Angular\'s HttpClient, meaning it participates in the interceptor chain and DI system. Prefer httpResource() for standard HTTP calls.' },
    { q: 'How do you force a resource to refetch data without changing the params signal?', options: ['Set the params signal to undefined then back to its original value', 'Call myResource.reload()', 'Call myResource.set(undefined) to clear it', 'Inject ResourceManager and call refresh(myResource)'], answer: 1, explanation: 'Calling myResource.reload() triggers the loader again with the current params value. This is useful for implementing a manual refresh button without mutating the underlying signal.' },
    { q: 'What is the purpose of the `abortSignal` provided to the resource loader, and how should it be used?', options: ['It is used to cancel the resource entirely and free its memory', 'It is passed to fetch() so that stale in-flight requests are cancelled when params change, preventing race conditions', 'It resets the resource status to idle when triggered', 'It prevents the loader from running if another signal has an error'], answer: 1, explanation: 'When params change while a fetch is still in-flight, Angular provides a new abortSignal. Passing it to fetch(url, { signal: abortSignal }) cancels the stale request automatically, preventing race conditions where an older response arrives after a newer one.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'resource()', type: 'function', desc: 'Creates a signal-aware async data primitive that reactively re-fetches whenever its params signal changes.' , since: '19'},
    { name: 'httpResource()', type: 'function', desc: 'A variant of resource() that uses Angular\'s HttpClient under the hood, integrating with DI interceptors and auto-cancelling stale requests.' , since: '19'},
    { name: 'ResourceStatus', type: 'interface', desc: 'Enum-like type describing the current state of a resource: idle, loading, reloading, resolved, error, or local.' , since: '19'},
    { name: '.value()', type: 'function', desc: 'Signal accessor on a resource that returns the resolved data, or undefined while loading or on error.' , since: '19'},
    { name: '.isLoading()', type: 'function', desc: 'Signal accessor that returns true while the resource loader is executing (covers both initial load and reloads).' , since: '19'},
    { name: '.error()', type: 'function', desc: 'Signal accessor on a resource that holds the thrown error value if the loader rejected, otherwise undefined.' , since: '19'},
    { name: '.reload()', type: 'function', desc: 'Imperatively triggers the loader again with the current params without mutating any signal, useful for manual refresh buttons.' , since: '19'},
    { name: '.set()', type: 'function', desc: 'Locally overrides the resource value without triggering the loader; status becomes \'local\' until the next params change.' , since: '19'},
    { name: 'abortSignal', type: 'token', desc: 'An AbortSignal provided to the resource loader that cancels the in-flight fetch when params change, preventing race conditions.' , since: '19'},
    { name: 'params', type: 'function', desc: 'The reactive function inside resource() that reads signals; when any read signal changes, Angular re-runs the loader automatically.' , since: '19'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Manual HTTP + toSignal() vs resource()', before: '// Old: manual subscription chain\nconst userId$ = toObservable(this.userId);\nthis.user$ = userId$.pipe(\n  switchMap(id => this.http.get(\'/api/users/\' + id))\n);', after: '// New: resource() handles reactivity automatically\nuserResource = resource({\n  params: () => this.userId(),\n  loader: ({ params: id }) =>\n    fetch(\'/api/users/\' + id).then(r => r.json()),\n});',
      note: 'resource() replaces the toObservable + switchMap pattern with a signal-native API that auto-cancels stale requests.' },
    { title: 'Manual loading flag vs resource.isLoading()', before: '// Old: manually track loading state\nisLoading = signal(false);\nloadUser() {\n  this.isLoading.set(true);\n  fetch(\'/api/user\').then(() => this.isLoading.set(false));\n}', after: '// New: resource exposes isLoading() as a built-in signal\nuserResource = resource({\n  params: () => this.userId(),\n  loader: ({ params: id }) => fetch(\'/api/users/\' + id).then(r => r.json()),\n});\n// Template: @if (userResource.isLoading()) { <p>Loading...</p> }',
      note: 'resource() exposes isLoading(), value(), error(), and status() signals — no manual state management needed.' },
    { title: 'switchMap Observable vs httpResource()', before: '// Old: HttpClient + switchMap\nposts$ = toObservable(this.page).pipe(\n  switchMap(p => this.http.get(\'/api/posts?page=\' + p))\n);', after: '// New: httpResource() with signal URL\nposts = httpResource(\n  () => \'/api/posts?page=\' + this.page()\n);',
      note: 'httpResource() accepts a signal-returning URL function and integrates with Angular\'s HttpClient interceptor chain automatically.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Calling async code inside params()', wrong: 'userResource = resource({\n  params: async () => await this.getId(), // WRONG\n  loader: ({ params: id }) => fetch(\'/api/\' + id),\n});', right: 'userId = signal(1);\nuserResource = resource({\n  params: () => this.userId(), // synchronous signal read only\n  loader: ({ params: id }) => fetch(\'/api/\' + id),\n});', explanation: 'The params function must be a synchronous signal read. Async code inside it breaks Angular\'s reactivity tracking. Put async logic in the loader instead.'  },
    { title: 'Forgetting to pass abortSignal to fetch()', wrong: 'loader: ({ params: id }) =>\n  fetch(\'/api/users/\' + id).then(r => r.json())', right: 'loader: ({ params: id, abortSignal }) =>\n  fetch(\'/api/users/\' + id, { signal: abortSignal })\n    .then(r => r.json())', explanation: 'Without passing abortSignal, stale in-flight requests are not cancelled when params change, causing race conditions where an older response can overwrite a newer one.'  },
    { title: 'Using resource() when httpResource() is more appropriate', wrong: '// Using raw fetch for a standard HTTP call\nloader: ({ params: id }) =>\n  fetch(\'/api/users/\' + id).then(r => r.json())', right: '// Prefer httpResource() for Angular HttpClient integration\nposts = httpResource<Post[]>(() => \'/api/posts?id=\' + this.id());', explanation: 'For standard HTTP calls, httpResource() is preferred because it uses Angular\'s HttpClient, supports interceptors (auth tokens, error handling), and auto-cancels stale requests.'  },
    { title: 'Expecting .set() changes to persist after params change', wrong: '// Assumes local value persists indefinitely\nthis.userResource.set({ name: \'Override\' });\n// Later, userId changes — override is silently lost', right: '// .set() is temporary; next params change triggers a real fetch\n// Use a separate signal if you need persistent local overrides\nthis.localOverride = signal<User | null>(null);', explanation: 'resource.set() sets status to \'local\', but any params signal change will discard the local value and re-run the loader. Do not rely on it for persistent state.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: '19', label: 'Angular 19 — resource() and httpResource() introduced', features: ['resource() added as a signal-native async data primitive replacing toSignal + switchMap patterns', 'httpResource() introduced as an HttpClient-integrated variant with interceptor support', 'Built-in status signals: value(), error(), isLoading(), status() — no manual loading flags', 'abortSignal support in the loader for automatic cancellation of stale requests'] },
  ];

  challenge: Challenge = {
    title: 'Build a reactive user lookup with resource()',
    description: 'Create a component that lets the user pick a user ID (1–5) and displays that user\'s name, email, and company fetched from the JSONPlaceholder API using Angular\'s resource() API. Show a loading indicator while fetching, an error message if the request fails, and the user card once resolved. Add a Reload button that refetches without changing the selected ID.',
    language: 'typescript',
    hints: [
      'Define a signal for the selected user ID, then pass it as the params function: params: () => this.userId()',
      'Use fetch() in the loader and cast the result: .then(r => r.json() as Promise<User>). Pass abortSignal to avoid race conditions.',
      'Check postResource.isLoading(), postResource.error(), and postResource.value() in the template using @if blocks.',
      'Call this.userResource.reload() in the button\'s click handler to trigger a fresh fetch without changing userId.',
    ],
    starterCode: `import { Component, signal, resource } from '@angular/core';

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

@Component({
  selector: 'app-user-lookup',
  standalone: true,
  template: \`
    <h2>User Lookup</h2>

    <!-- 1. Render buttons for IDs 1-5 that set userId signal -->

    <!-- 2. Show current resource status -->

    <!-- 3. Show a loading message while isLoading() is true -->

    <!-- 4. Show an error message if error() is truthy -->

    <!-- 5. Show the user card (name, email, company) when value() resolves -->

    <!-- 6. Add a Reload button that calls userResource.reload() -->
  \`,
})
export class UserLookupComponent {
  // TODO: create a userId signal with initial value 1

  // TODO: create userResource using resource<User, number>()
  //       params: read userId signal
  //       loader: fetch from https://jsonplaceholder.typicode.com/users/{id}
  //               use abortSignal, cast result to Promise<User>
}`,
    solution: `import { Component, signal, resource } from '@angular/core';

interface User {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

@Component({
  selector: 'app-user-lookup',
  standalone: true,
  template: \`
    <h2>User Lookup</h2>

    <div>
      @for (id of [1,2,3,4,5]; track id) {
        <button
          type="button"
          [style.fontWeight]="userId() === id ? 'bold' : 'normal'"
          (click)="userId.set(id)">
          User {{ id }}
        </button>
      }
    </div>

    <p>Status: <strong>{{ userResource.status() }}</strong></p>

    @if (userResource.isLoading()) {
      <p>Loading user data...</p>
    }

    @if (userResource.error()) {
      <p style="color: red;">Error: {{ userResource.error() }}</p>
    }

    @if (userResource.value(); as user) {
      <div style="border: 1px solid #ccc; padding: 12px; margin-top: 8px;">
        <strong>{{ user.name }}</strong><br />
        Email: {{ user.email }}<br />
        Company: {{ user.company.name }}
      </div>
    }

    <button type="button" (click)="userResource.reload()" style="margin-top: 12px;">
      Reload
    </button>
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
