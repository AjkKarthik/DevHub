import { Component, signal } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

interface Post { id: number; title: string; body: string; userId: number; }

const fetchPosts = (): Promise<Post[]> =>
  fetch('https://jsonplaceholder.typicode.com/posts?_limit=8').then(r => r.json());

const fetchPost = (id: number): Promise<Post> =>
  fetch(`https://jsonplaceholder.typicode.com/posts/${id}`).then(r => r.json());

const createPost = (data: Partial<Post>): Promise<Post> =>
  fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-type': 'application/json' },
  }).then(r => r.json());

@Component({
  selector: 'app-tanstack-query',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './tanstack-query.html',
  styleUrl: './tanstack-query.scss',
})
export class TanstackQueryDemo {
  private qc = injectQueryClient();

  postsQuery = injectQuery(() => ({ queryKey: ['posts'], queryFn: fetchPosts, staleTime: 30_000 }));

  selectedId = signal<number | null>(null);

  detailQuery = injectQuery(() => ({
    queryKey: ['post', this.selectedId()],
    queryFn:  () => fetchPost(this.selectedId()!),
    enabled:  this.selectedId() !== null,
  }));

  createMutation = injectMutation(() => ({
    mutationFn: createPost,
    onSuccess: (data: Post) => {
      console.log('Created:', data);
      this.qc.invalidateQueries({ queryKey: ['posts'] });
    },
  }));

  newTitle = signal('');

  submitPost() {
    if (!this.newTitle().trim()) return;
    this.createMutation.mutate({ title: this.newTitle(), body: 'Draft', userId: 1 });
    this.newTitle.set('');
  }

  qna: QnaItem[] = [
    { q: 'What problem does TanStack Query solve that Angular\'s HttpClient does not?', a: 'TanStack Query adds a <strong>caching layer</strong>. Multiple components using the same <code>queryKey</code> share one cached response — no duplicate API calls. It also handles background refetching, stale-while-revalidate, and mutation invalidation.' },
    { q: 'What is a queryKey and why does it matter?', a: 'The queryKey uniquely identifies a query. Same key = shared cache. <code>[\'posts\']</code> caches all posts. <code>[\'posts\', id]</code> caches per-post. When the key changes (e.g. id signal changes), TanStack Query fetches the new data automatically.' },
    { q: 'What does invalidateQueries() do?', a: 'It marks cached queries as stale, triggering an immediate background refetch. Call it after a successful mutation: <code>client.invalidateQueries({ queryKey: [\'posts\'] })</code>. All components showing that data will update automatically.' },
    { q: 'How do you pause a query until a condition is met?', a: 'Use <code>enabled: signal_or_boolean</code>: <code>injectQuery(() => ({ queryKey: [\'user\', id()], queryFn: ..., enabled: !!id() }))</code>. The query is idle until <code>enabled</code> becomes truthy — e.g. until a user ID is selected.' },
    { q: 'What is the difference between isLoading and isFetching?', a: '<code>isLoading</code> is true only on the <strong>first</strong> fetch (no cached data yet). <code>isFetching</code> is true whenever a fetch is in flight — including background refetches when stale data is being refreshed.' },
    { q: 'How do you optimistically update the UI before a mutation completes?', a: 'In <code>onMutate</code>: cancel outgoing queries, snapshot old data, update the cache optimistically. In <code>onError</code>: roll back the snapshot. In <code>onSettled</code>: invalidate and refetch. This gives instant UI feedback.' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'What problem does TanStack Query solve?',
    points: [
      'Server state (API data) is fundamentally different from client state — it is async, stale, shared, and owned remotely.',
      'Without a query library you manually manage loading/error booleans, caching, refetching, and cache invalidation.',
      'TanStack Query gives you: automatic caching, background refetch, stale-while-revalidate, deduplication, and mutations.',
      'It replaces ad-hoc RxJS HTTP chains with a declarative <code>injectQuery()</code> call — far less boilerplate.',
    ],
  },
  {
    heading: 'injectQuery fundamentals',
    points: [
      '<code>queryKey</code> is the cache key — an array. Same key = same cache entry, deduplicated across components.',
      '<code>queryFn</code> is a function that returns a Promise. Angular Query calls it and manages the lifecycle.',
      'The options callback is reactive: it reads signals, so changing <code>selectedId()</code> triggers a new fetch automatically.',
      '<code>enabled: false</code> (or a signal-based boolean) pauses the query — Angular Query will not fetch until it is truthy.',
      '<code>staleTime</code>: how long cached data is considered fresh. After that, a background refetch happens on next mount.',
    ],
  },
  {
    heading: 'Mutations',
    points: [
      '<code>injectMutation()</code> wraps a write operation (POST/PUT/DELETE). Unlike queries, it does not run automatically.',
      'Call <code>mutation.mutate(payload)</code> to trigger it. Access state via <code>mutation.isPending()</code>, <code>isSuccess()</code>, <code>isError()</code>.',
      '<code>onSuccess</code> is the right place to call <code>queryClient.invalidateQueries()</code> to refetch stale list data.',
      'Use <code>injectQueryClient()</code> (not <code>inject(QueryClient)</code>) to get the client inside a component.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Register <code>provideTanStackQuery(new QueryClient(...))</code> once in <code>app.config.ts</code> — not per-component.',
      'The query cache is global — two components with the same <code>queryKey</code> share one fetch and one cache entry.',
      'Avoid putting server state in signals or services — let the query cache be the single source of truth.',
      'Use <code>placeholderData: keepPreviousData</code> to avoid layout shift while paginating.',
    ],
  },
];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// app.config.ts
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTanStackQuery(new QueryClient({
      defaultOptions: {
        queries: { staleTime: 60_000, retry: 2 },
      },
    })),
  ],
};`,
    },
    {
      label: 'injectQuery',
      language: 'typescript',
      code: `import { injectQuery } from '@tanstack/angular-query-experimental';
import { signal } from '@angular/core';

export class PostsComponent {
  // Reactive — re-fetches automatically when selectedId changes
  selectedId = signal<number | null>(null);

  query = injectQuery(() => ({
    queryKey: ['post', this.selectedId()],   // ← signal read
    queryFn:  () => fetchPost(this.selectedId()!),
    enabled:  this.selectedId() !== null,    // ← disabled until id set
    staleTime: 30_000,                       // 30s before refetch
  }));
}

// Template usage:
// query.isLoading()  → boolean
// query.isError()    → boolean
// query.error()      → Error | null
// query.data()       → T | undefined`,
    },
    {
      label: 'injectMutation',
      language: 'typescript',
      code: `import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';

export class CreatePostComponent {
  private qc = injectQueryClient();

  mutation = injectMutation(() => ({
    mutationFn: (data: Partial<Post>) => createPost(data),
    onSuccess: () => {
      // Invalidate cache so list re-fetches
      this.qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (err) => console.error(err),
  }));

  // Call with:
  // this.mutation.mutate({ title: '...', body: '...' })
  // this.mutation.isPending()   → loading state
  // this.mutation.isSuccess()
  // this.mutation.isError()`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What is the primary purpose of the `queryKey` array in `injectQuery`?', options: ['It defines the HTTP method used for the fetch request', 'It uniquely identifies a cache entry so components sharing the same key share one cached response', 'It sets the order in which queries are executed', 'It specifies which Angular service should handle the request'], answer: 1, explanation: 'The queryKey is the cache key. Two components using [\'posts\'] share the same cache entry and the same fetch — no duplicate API calls. Changing the key (e.g. adding a signal value like [\'post\', id()]) creates a separate cache entry and triggers a new fetch.' },
    { q: 'In the component, `detailQuery` has `enabled: this.selectedId() !== null`. What happens when `selectedId()` returns `null`?', options: ['The query throws a runtime error because queryFn would receive null', 'The query is idle — TanStack Query will not call queryFn until enabled becomes truthy', 'The query fetches all posts instead of a single post', 'The query uses the cached value from postsQuery as a fallback'], answer: 1, explanation: 'When `enabled` is false (or a falsy signal value), TanStack Query puts the query in an \'idle\' state and never calls queryFn. This is the standard pattern for dependent queries — wait for a required value before fetching.' },
    { q: 'The `postsQuery` is configured with `staleTime: 30_000`. What does this mean?', options: ['The query will automatically cancel and retry after 30 seconds', 'The cached data is considered fresh for 30 seconds; after that, a background refetch happens on next mount or focus', 'The query will be removed from the cache after 30 seconds', 'A loading spinner will be shown for at most 30 seconds before an error is thrown'], answer: 1, explanation: 'staleTime controls how long data is considered \'fresh\'. Within that window, navigating back to the same queryKey returns cached data immediately with no refetch. After it expires the cache entry is \'stale\' and a background refetch is triggered on the next mount or window focus.' },
    { q: 'After `createMutation` succeeds, the component calls `this.qc.invalidateQueries({ queryKey: [\'posts\'] })`. What is the effect?', options: ['The [\'posts\'] cache entry is deleted and all components lose their data', 'The mutation is rolled back and the original posts list is restored', 'The [\'posts\'] cache entry is marked stale, triggering an immediate background refetch so the list stays in sync', 'All active queries across the app are paused until the next user interaction'], answer: 2, explanation: 'invalidateQueries marks matching cache entries as stale and triggers an immediate background refetch for any currently-mounted observers. This is the recommended way to keep list data in sync after a successful mutation without manually updating the cache.' },
    { q: 'What is the difference between `query.isLoading()` and `query.isFetching()` in TanStack Query?', options: ['isLoading applies to mutations; isFetching applies to queries', 'isLoading is true only on the first fetch when there is no cached data yet; isFetching is true whenever a fetch is in flight, including background refetches', 'They are identical — both return true whenever the network request is pending', 'isLoading reflects HTTP request state; isFetching reflects Angular\'s change detection cycle'], answer: 1, explanation: 'isLoading (also called isPending in v5) is true only when there is no cached data and a fetch is in progress — the classic \'first load\' spinner scenario. isFetching is true any time a fetch is in flight, including background refetches of already-cached stale data.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'injectQuery', type: 'function', desc: 'Creates a reactive query that fetches and caches server data; re-fetches automatically when signal-based options change.' , since: '17'},
    { name: 'injectMutation', type: 'function', desc: 'Creates a mutation handle for write operations (POST/PUT/DELETE) with isPending, isSuccess, isError signals and lifecycle callbacks.' , since: '17'},
    { name: 'injectQueryClient', type: 'function', desc: 'Returns the global QueryClient instance so you can imperatively invalidate, prefetch, or update cached queries.' , since: '17'},
    { name: 'provideTanStackQuery', type: 'function', desc: 'Registers the QueryClient and its providers in app.config.ts; must be called once at the application root.' , since: '17'},
    { name: 'QueryClient', type: 'class', desc: 'Holds the in-memory query cache and default options (staleTime, retry, etc.) shared across the entire application.' , since: '17'},
    { name: 'queryKey', type: 'interface', desc: 'An array that uniquely identifies a cache entry; two components using the same key share one fetch and one cached response.' },
    { name: 'enabled', type: 'interface', desc: 'Boolean or signal-derived boolean option on injectQuery that suspends fetching until truthy — used for dependent queries.' },
    { name: 'staleTime', type: 'interface', desc: 'Milliseconds a cached response is considered fresh; after expiry a background refetch is triggered on the next mount or focus.' },
    { name: 'invalidateQueries', type: 'function', desc: 'Marks matching cache entries as stale and triggers an immediate background refetch for all active observers.' },
    { name: 'keepPreviousData', type: 'function', desc: 'placeholderData helper that returns the previous page\'s data while the next page loads, preventing layout shift during pagination.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Manual HTTP + loading state vs injectQuery', before: '// Old: manual RxJS + booleans in a service\nisLoading = false;\nposts: Post[] = [];\nngOnInit() {\n  this.isLoading = true;\n  this.http.get<Post[]>(\'/api/posts\')\n    .subscribe(data => { this.posts = data; this.isLoading = false; });\n}', after: '// New: injectQuery handles cache, loading, errors\npostsQuery = injectQuery(() => ({\n  queryKey: [\'posts\'],\n  queryFn: fetchPosts,\n  staleTime: 30_000,\n}));\n// Template: postsQuery.isLoading() / postsQuery.data()',
      note: 'injectQuery replaces manual loading flags, subscriptions, and ad-hoc caching with a single declarative call.' },
    { title: 'RxJS switchMap dependent query vs enabled option', before: '// Old: switchMap chain to wait for an id\nselectedId$ = new Subject<number>();\ndetail$ = this.selectedId$.pipe(\n  switchMap(id => this.http.get<Post>(\'/api/posts/\' + id))\n);', after: '// New: enabled option pauses until signal is set\nselectedId = signal<number | null>(null);\ndetailQuery = injectQuery(() => ({\n  queryKey: [\'post\', this.selectedId()],\n  queryFn: () => fetchPost(this.selectedId()!),\n  enabled: this.selectedId() !== null,\n}));',
      note: 'The enabled flag replaces filter/switchMap chains; the query stays idle until the condition is truthy.' },
    { title: 'Manual cache busting after POST vs invalidateQueries', before: '// Old: manually push into array after create\ncreatePost(data).subscribe(newPost => {\n  this.posts = [...this.posts, newPost];\n});', after: '// New: invalidate cache, TanStack refetches automatically\nmutation = injectMutation(() => ({\n  mutationFn: createPost,\n  onSuccess: () =>\n    this.qc.invalidateQueries({ queryKey: [\'posts\'] }),\n}));',
      note: 'invalidateQueries lets the cache be the single source of truth — no manual array splicing needed.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Calling inject(QueryClient) instead of injectQueryClient()', wrong: '// Wrong — bypasses Angular Query\'s provider setup\nimport { inject } from \'@angular/core\';\nimport { QueryClient } from \'@tanstack/angular-query-experimental\';\nprivate qc = inject(QueryClient);', right: '// Correct — use the dedicated injection helper\nimport { injectQueryClient } from \'@tanstack/angular-query-experimental\';\nprivate qc = injectQueryClient();', explanation: 'injectQueryClient() is the officially supported way to access the client inside components; inject(QueryClient) may not resolve the same instance registered by provideTanStackQuery.'  },
    { title: 'Forgetting to wrap injectQuery options in a callback (breaking reactivity)', wrong: '// Wrong — options object evaluated once, signals never tracked\npostsQuery = injectQuery({\n  queryKey: [\'post\', this.selectedId()],\n  queryFn: fetchPost,\n});', right: '// Correct — arrow function lets Angular track signal reads\npostsQuery = injectQuery(() => ({\n  queryKey: [\'post\', this.selectedId()],\n  queryFn: () => fetchPost(this.selectedId()!),\n}));', explanation: 'The options must be a callback so Angular\'s reactive context can track signal reads and re-run when they change.'  },
    { title: 'Conflating isLoading with isFetching and showing wrong spinners', wrong: '// Wrong — spinner shows on every background refetch\n@if (query.isFetching()) {\n  <app-spinner />\n}', right: '// Correct — isLoading only on first fetch (no cache yet)\n@if (query.isLoading()) {\n  <app-spinner />\n}\n// Use isFetching for a subtle top-bar indicator instead', explanation: 'isLoading is true only when there is no cached data; isFetching is true on every in-flight request including silent background refetches.'  },
    { title: 'Registering provideTanStackQuery per component instead of at the root', wrong: '// Wrong — each component gets its own isolated cache\n@Component({\n  providers: [provideTanStackQuery(new QueryClient())],\n})', right: '// Correct — register once in app.config.ts providers array\nexport const appConfig: ApplicationConfig = {\n  providers: [provideTanStackQuery(new QueryClient())],\n};', explanation: 'The query cache must be a single global instance; scoping it per-component creates isolated caches that cannot deduplicate or share data.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 17 + @tanstack/angular-query-experimental', label: 'Signal-based Angular Query API', features: ['injectQuery(), injectMutation(), injectQueryClient() all return signal-based result objects', 'Options callback is evaluated in a reactive context — signal reads inside it are tracked automatically', 'query.data(), query.isLoading(), mutation.isPending() are signals, not Observables — no pipe/subscribe needed', 'Compatible with Angular\'s new @if/@for control flow and the standalone component model'] },
    { version: 'TanStack Query v5', label: 'Breaking changes from v4', features: ['isPending replaces isLoading as the primary loading state name for consistency across queries and mutations', 'The status: \'loading\' string value is renamed to status: \'pending\'', 'Removed the cacheTime option — use gcTime (garbage collection time) instead'] },
  ];

  challenge: Challenge = {
    title: 'Build a Reactive User Detail Viewer with injectQuery',
    description: 'Create a component that fetches a list of users from JSONPlaceholder, displays them as a clickable list, and shows a detail panel for the selected user using a conditional (enabled) query. Add a refresh button that manually invalidates the users cache.',
    language: 'typescript',
    hints: [
      'Use injectQuery with queryKey: [\'users\'] and staleTime: 20_000 for the list query. The URL is https://jsonplaceholder.typicode.com/users.',
      'For the detail query use queryKey: [\'user\', this.selectedId()] and set enabled: this.selectedId() !== null so it only fires when a user is selected.',
      'Use injectQueryClient() to get the query client, then call qc.invalidateQueries({ queryKey: [\'users\'] }) inside the refresh() method.',
      'In the template, use @if (usersQuery.data(); as users) with @for to render the list, and bind (click) to selectedId.set(u.id) on each item.',
    ],
    starterCode: `import { Component, signal } from '@angular/core';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';

interface User { id: number; name: string; email: string; phone: string; }

const fetchUsers = (): Promise<User[]> =>
  fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json());

const fetchUser = (id: number): Promise<User> =>
  fetch(\`https://jsonplaceholder.typicode.com/users/\${id}\`).then(r => r.json());

@Component({
  selector: 'app-user-viewer',
  standalone: true,
  template: \`
    <h2>Users</h2>
    <button (click)="refresh()">Refresh List</button>

    <!-- TODO: Show loading state from usersQuery -->
    <!-- TODO: Render the user list; clicking a name selects it -->
    <!-- TODO: When a user is selected, show detail panel with name, email, phone -->
    <!-- TODO: Show a loading indicator while detailQuery is fetching -->
  \`,
})
export class UserViewerComponent {
  private qc = injectQueryClient();

  selectedId = signal<number | null>(null);

  // TODO: define usersQuery using injectQuery
  // queryKey: ['users'], staleTime: 20_000

  // TODO: define detailQuery using injectQuery
  // queryKey: ['user', this.selectedId()]
  // enabled: this.selectedId() !== null

  refresh() {
    // TODO: invalidate the ['users'] cache entry
  }
}`,
    solution: `import { Component, signal } from '@angular/core';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';

interface User { id: number; name: string; email: string; phone: string; }

const fetchUsers = (): Promise<User[]> =>
  fetch('https://jsonplaceholder.typicode.com/users').then(r => r.json());

const fetchUser = (id: number): Promise<User> =>
  fetch(\`https://jsonplaceholder.typicode.com/users/\${id}\`).then(r => r.json());

@Component({
  selector: 'app-user-viewer',
  standalone: true,
  template: \`
    <h2>Users</h2>
    <button (click)="refresh()">Refresh List</button>

    @if (usersQuery.isLoading()) {
      <p>Loading users...</p>
    }
    @if (usersQuery.data(); as users) {
      <ul>
        @for (u of users; track u.id) {
          <li
            [style.font-weight]="selectedId() === u.id ? 'bold' : 'normal'"
            (click)="selectedId.set(u.id)"
            style="cursor:pointer">
            {{ u.name }}
          </li>
        }
      </ul>
    }

    @if (selectedId() !== null) {
      <div style="margin-top:1rem; padding:1rem; border:1px solid #ccc; border-radius:6px">
        @if (detailQuery.isLoading()) {
          <p>Fetching user {{ selectedId() }}...</p>
        }
        @if (detailQuery.data(); as user) {
          <h3>{{ user.name }}</h3>
          <p>Email: {{ user.email }}</p>
          <p>Phone: {{ user.phone }}</p>
          <button (click)="selectedId.set(null)">Close</button>
        }
      </div>
    }
  \`,
})
export class UserViewerComponent {
  private qc = injectQueryClient();

  selectedId = signal<number | null>(null);

  usersQuery = injectQuery(() => ({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 20_000,
  }));

  detailQuery = injectQuery(() => ({
    queryKey: ['user', this.selectedId()],
    queryFn: () => fetchUser(this.selectedId()!),
    enabled: this.selectedId() !== null,
  }));

  refresh() {
    this.qc.invalidateQueries({ queryKey: ['users'] });
  }
}`,
  };
}
