import { Component, signal } from '@angular/core';
import { injectQuery, injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
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
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

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
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent],
  templateUrl: './tanstack-query.html',
  styleUrl: './tanstack-query.scss',
})
export class TanstackQueryDemo {
  private qc = injectQueryClient();

  prerequisites: Prerequisite[] = [
    { label: 'RxJS Patterns', route: '/angular/rxjs-demo' },
    { label: 'Signals', route: '/angular/signals' },
  ];

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

  theory: TheoryPoint[] = [
    {
      heading: 'Server state vs client state — why you need a query library',
      points: [
        'Server state (API data) is fundamentally different from client state — it is async, potentially stale, shared across components, and owned remotely rather than in your app.',
        'Without a query library you manually manage loading/error booleans per component, implement ad-hoc caching (or none), handle refetching on focus/mount, and bust caches after mutations — all duplicated across every service.',
        'TanStack Query provides: automatic caching, background refetch, stale-while-revalidate, request deduplication (two components with the same queryKey share one fetch), and mutation lifecycle hooks.',
        'It replaces ad-hoc RxJS HTTP chains with a declarative <code>injectQuery()</code> call — far less boilerplate and far more capability out of the box.',
        'The query cache is the single source of truth for server data — no need to copy API responses into component state, services, or NgRx slices.',
      ],
    },
    {
      heading: 'injectQuery() fundamentals',
      points: [
        '<code>queryKey</code> is the cache key — an array. Same key = same cache entry. <code>[\'posts\']</code> caches all posts; <code>[\'post\', id]</code> caches per-post, creating a separate entry per id.',
        '<code>queryFn</code> is any function that returns a <code>Promise&lt;T&gt;</code>. TanStack Query calls it, manages retries, and exposes the result via the returned object.',
        'The options argument must be a <strong>callback function</strong> (arrow function), not a plain object — this allows Angular\'s reactive context to track signal reads inside it and re-run the query when they change.',
        '<code>enabled: false</code> (or a signal-derived boolean) puts the query in an <em>idle</em> state — queryFn is never called until enabled becomes truthy. Essential for dependent queries.',
        '<code>staleTime</code>: milliseconds a cache entry is considered fresh. Within that window, navigating back shows cached data instantly with no refetch. After expiry the data is stale and a background refetch is triggered on next mount.',
      ],
    },
    {
      heading: 'Query result shape and status signals',
      points: [
        '<code>query.data()</code> returns the cached value or <code>undefined</code> on first load — use <code>@if (query.data(); as posts)</code> to safely unwrap.',
        '<code>query.isLoading()</code> is true only on the <em>first</em> fetch when there is no cached data yet — use this to render the initial loading skeleton.',
        '<code>query.isFetching()</code> is true whenever a fetch is in flight, including background refetches of stale data — use this for a subtle progress indicator, not a full loading state.',
        '<code>query.isError()</code> and <code>query.error()</code> expose the failure; the query retries automatically (default 3 times with exponential backoff) before entering error state.',
        '<code>query.status()</code> returns <code>\'pending\' | \'error\' | \'success\'</code> — equivalent to <code>isLoading/isError/data</code> but as a discriminated union useful in switch blocks.',
      ],
    },
    {
      heading: 'Mutations with injectMutation()',
      points: [
        '<code>injectMutation()</code> wraps a write operation (POST/PUT/DELETE). Unlike queries, it does not run automatically — you call <code>mutation.mutate(payload)</code> imperatively.',
        'Access mutation state via signals: <code>mutation.isPending()</code>, <code>mutation.isSuccess()</code>, <code>mutation.isError()</code>, <code>mutation.data()</code> for the response.',
        '<code>onSuccess</code> is the right place to call <code>queryClient.invalidateQueries()</code> to mark list queries stale and trigger a background refetch — keeping the UI in sync without manual state updates.',
        '<code>onMutate</code> fires synchronously before the mutation runs — use it for optimistic updates: snapshot old data, update the cache instantly, then roll back in <code>onError</code> if the request fails.',
        'Use <code>injectQueryClient()</code> (not <code>inject(QueryClient)</code>) to obtain the client inside components — this resolves the same instance registered by <code>provideTanStackQuery()</code>.',
      ],
    },
    {
      heading: 'Cache invalidation and prefetching',
      points: [
        '<code>queryClient.invalidateQueries({ queryKey: [\'posts\'] })</code> marks all cache entries whose key starts with <code>\'posts\'</code> as stale and triggers an immediate background refetch for any active observers.',
        'Partial key matching: <code>{ queryKey: [\'posts\'] }</code> invalidates <code>[\'posts\']</code> and <code>[\'posts\', 1]</code> — use this to invalidate an entire collection after any mutation.',
        '<code>queryClient.prefetchQuery()</code> fires a fetch and populates the cache before the component that needs it mounts — ideal for hover-to-prefetch patterns.',
        '<code>queryClient.setQueryData([\'post\', id], updater)</code> updates the cache directly for optimistic UI — the change is instant; invalidation + refetch happens asynchronously in the background.',
        'Use <code>placeholderData: keepPreviousData</code> (imported from TanStack Query) to show the previous page\'s data while a new page loads — eliminates layout shift during pagination.',
      ],
    },
    {
      heading: 'Setup, configuration, and global defaults',
      points: [
        'Register <code>provideTanStackQuery(new QueryClient(...))</code> once in <code>app.config.ts</code> providers — never per-component, or each component gets its own isolated cache with no sharing.',
        'Global defaults in <code>QueryClient</code>: <code>defaultOptions: { queries: { staleTime: 60_000, retry: 2, refetchOnWindowFocus: true } }</code> — override per-query by passing the option directly to <code>injectQuery()</code>.',
        'Install: <code>npm install @tanstack/angular-query-experimental</code>. Import <code>withDevtools()</code> from <code>@tanstack/angular-query-devtools-experimental</code> for the query cache inspector.',
        'For SSR (Angular Universal): use <code>dehydrate(queryClient)</code> server-side and <code>HydrationBoundary</code> client-side to transfer prefetched data without a second round-trip.',
        'Avoid duplicating server state in signals or NgRx — let the query cache be the single source of truth. Feeding API data into a separate signal store doubles your sync burden.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
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
    {
      label: 'Optimistic updates',
      language: 'typescript',
      code: `import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';

export class TodosComponent {
  private qc = injectQueryClient();

  toggleMutation = injectMutation(() => ({
    mutationFn: (todo: Todo) =>
      fetch(\`/api/todos/\${todo.id}\`, {
        method: 'PATCH',
        body: JSON.stringify({ done: !todo.done }),
      }).then(r => r.json()),

    onMutate: async (todo) => {
      // 1. Cancel outgoing refetches (avoid overwriting optimistic update)
      await this.qc.cancelQueries({ queryKey: ['todos'] });
      // 2. Snapshot current value for rollback
      const previous = this.qc.getQueryData<Todo[]>(['todos']);
      // 3. Optimistically update the cache
      this.qc.setQueryData<Todo[]>(['todos'], old =>
        old?.map(t => t.id === todo.id ? { ...t, done: !t.done } : t)
      );
      return { previous };  // returned as context to onError
    },

    onError: (_err, _todo, context) => {
      // Roll back on failure
      this.qc.setQueryData(['todos'], context?.previous);
    },

    onSettled: () => {
      // Always refetch after success or error to stay in sync
      this.qc.invalidateQueries({ queryKey: ['todos'] });
    },
  }));
}`,
    },
    {
      label: 'Pagination',
      language: 'typescript',
      code: `import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { signal } from '@angular/core';

export class UsersTableComponent {
  page = signal(1);

  usersQuery = injectQuery(() => ({
    queryKey: ['users', this.page()],
    queryFn: () => fetchUsers(this.page()),
    placeholderData: keepPreviousData,  // show previous page while loading next
    staleTime: 30_000,
  }));

  nextPage() { this.page.update(p => p + 1); }
  prevPage() { this.page.update(p => Math.max(1, p - 1)); }
}

// Template:
// @if (usersQuery.isPlaceholderData()) { <div class="stale-overlay">Loading...</div> }
// @for (u of usersQuery.data()?.users; track u.id) { ... }
// <button [disabled]="usersQuery.isPlaceholderData()">Next →</button>`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What is the primary purpose of the `queryKey` array in `injectQuery`?',
      options: [
        'It defines the HTTP method used for the fetch request',
        'It uniquely identifies a cache entry so components sharing the same key share one cached response',
        'It sets the order in which queries are executed',
        'It specifies which Angular service should handle the request',
      ],
      answer: 1,
      explanation: 'The queryKey is the cache key. Two components using [\'posts\'] share the same cache entry and the same fetch — no duplicate API calls. Changing the key (e.g. adding a signal value like [\'post\', id()]) creates a separate cache entry and triggers a new fetch.',
    },
    {
      q: 'A query has `enabled: this.selectedId() !== null`. What happens when `selectedId()` returns `null`?',
      options: [
        'The query throws a runtime error because queryFn would receive null',
        'The query is idle — TanStack Query will not call queryFn until enabled becomes truthy',
        'The query fetches all posts instead of a single post',
        'The query uses the cached value from postsQuery as a fallback',
      ],
      answer: 1,
      explanation: 'When enabled is false (or a falsy signal value), TanStack Query puts the query in an idle state and never calls queryFn. This is the standard pattern for dependent queries — wait for a required value before fetching.',
    },
    {
      q: 'A query is configured with `staleTime: 30_000`. What does this mean?',
      options: [
        'The query will automatically cancel and retry after 30 seconds',
        'The cached data is considered fresh for 30 seconds; after that, a background refetch happens on next mount or focus',
        'The query will be removed from the cache after 30 seconds',
        'A loading spinner will be shown for at most 30 seconds before an error is thrown',
      ],
      answer: 1,
      explanation: 'staleTime controls how long data is considered fresh. Within that window, navigating back to the same queryKey returns cached data immediately with no refetch. After it expires the cache entry is stale and a background refetch is triggered on the next mount or window focus.',
    },
    {
      q: 'After a mutation succeeds, the component calls `qc.invalidateQueries({ queryKey: [\'posts\'] })`. What is the effect?',
      options: [
        'The [\'posts\'] cache entry is deleted and all components lose their data',
        'The mutation is rolled back and the original posts list is restored',
        'The [\'posts\'] cache entry is marked stale, triggering an immediate background refetch so the list stays in sync',
        'All active queries across the app are paused until the next user interaction',
      ],
      answer: 2,
      explanation: 'invalidateQueries marks matching cache entries as stale and triggers an immediate background refetch for any currently-mounted observers. This is the recommended way to keep list data in sync after a successful mutation without manually updating the cache.',
    },
    {
      q: 'What is the difference between `query.isLoading()` and `query.isFetching()` in TanStack Query?',
      options: [
        'isLoading applies to mutations; isFetching applies to queries',
        'isLoading is true only on the first fetch when there is no cached data yet; isFetching is true whenever a fetch is in flight, including background refetches',
        'They are identical — both return true whenever the network request is pending',
        'isLoading reflects HTTP request state; isFetching reflects Angular\'s change detection cycle',
      ],
      answer: 1,
      explanation: 'isLoading is true only when there is no cached data and a fetch is in progress — the classic first-load spinner scenario. isFetching is true any time a fetch is in flight, including background refetches of already-cached stale data.',
    },
    {
      q: 'Why must the `injectQuery` options be passed as a callback function `() => ({ ... })` rather than a plain object `{ ... }`?',
      options: [
        'It is just a style preference — both forms work identically',
        'A plain object causes the queryFn to fire twice on startup',
        'The callback runs inside Angular\'s reactive context so signal reads inside it are tracked; changing a signal re-runs the query',
        'Without a callback the queryKey is serialized incorrectly',
      ],
      answer: 2,
      explanation: 'Angular\'s reactivity system tracks signal reads only during a reactive computation. Wrapping the options in a callback makes the whole options expression reactive — changing any signal read inside (like selectedId()) causes TanStack Query to re-run the query with updated options.',
    },
    {
      q: 'During an optimistic update, what should `onMutate` return so that `onError` can roll back on failure?',
      options: [
        'The mutation payload',
        'A context object containing the snapshotted old cache data',
        'The new optimistic value',
        'Nothing — onError automatically captures the previous state',
      ],
      answer: 1,
      explanation: 'onMutate should return a context object (e.g. { previous: oldData }) that is passed as the third argument to onError. onError then calls setQueryData(key, context.previous) to restore the cache to its pre-mutation state if the request fails.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What problem does TanStack Query solve that Angular\'s HttpClient does not?', a: 'TanStack Query adds a <strong>caching layer</strong>. Multiple components using the same <code>queryKey</code> share one cached response — no duplicate API calls. It also handles background refetching, stale-while-revalidate, and mutation invalidation, all of which require significant manual work with HttpClient alone.' },
    { q: 'What is a queryKey and why does it matter?', a: 'The queryKey uniquely identifies a query. Same key = shared cache. <code>[\'posts\']</code> caches all posts. <code>[\'posts\', id]</code> caches per-post. When the key changes (e.g. id signal changes), TanStack Query fetches the new data automatically — reactive queries with no subscription management.' },
    { q: 'What does invalidateQueries() do?', a: 'It marks cached queries as stale, triggering an immediate background refetch. Call it after a successful mutation: <code>client.invalidateQueries({ queryKey: [\'posts\'] })</code>. All components showing that data will update automatically. Partial key matching means <code>[\'posts\']</code> also invalidates <code>[\'posts\', 1]</code>, <code>[\'posts\', 2]</code>, etc.' },
    { q: 'How do you pause a query until a condition is met?', a: 'Use <code>enabled: signal_or_boolean</code>: <code>injectQuery(() => ({ queryKey: [\'user\', id()], queryFn: ..., enabled: !!id() }))</code>. The query is idle until <code>enabled</code> becomes truthy — e.g. until a user ID is selected or a prior query has returned data.' },
    { q: 'What is the difference between isLoading and isFetching?', a: '<code>isLoading</code> is true only on the <strong>first</strong> fetch (no cached data yet). <code>isFetching</code> is true whenever a fetch is in flight — including background refetches when stale data is being refreshed. Show a full skeleton on isLoading; show a subtle top-bar indicator on isFetching.' },
    { q: 'How do you optimistically update the UI before a mutation completes?', a: 'In <code>onMutate</code>: cancel outgoing queries, snapshot old data with <code>getQueryData()</code>, update the cache optimistically with <code>setQueryData()</code>. Return the snapshot as context. In <code>onError</code>: call <code>setQueryData(key, context.previous)</code> to roll back. In <code>onSettled</code>: call <code>invalidateQueries()</code> to refetch and confirm server state.' },
    { q: 'How does TanStack Query handle request deduplication when two components mount at the same time with the same queryKey?', a: 'TanStack Query batches them into a <strong>single network request</strong>. Both components subscribe to the same cache entry. When the first fetch resolves, both components receive the data simultaneously. This is automatic — no extra configuration needed and no RxJS shareReplay is required.' },
    { q: 'When should you use setQueryData() vs invalidateQueries() after a mutation?', a: '<code>setQueryData()</code> is for <strong>optimistic updates</strong> — you know the result before the server responds, so you update the cache directly for instant feedback. <code>invalidateQueries()</code> is for <strong>pessimistic updates</strong> — let the server be the source of truth, mark stale, and refetch. Use setQueryData in onMutate with a rollback in onError; use invalidateQueries in onSuccess.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'injectQuery', type: 'function', desc: 'Creates a reactive query that fetches and caches server data; re-fetches automatically when signal-based options change.' , since: '17'},
    { name: 'injectMutation', type: 'function', desc: 'Creates a mutation handle for write operations (POST/PUT/DELETE) with isPending, isSuccess, isError signals and lifecycle callbacks.' , since: '17'},
    { name: 'injectQueryClient', type: 'function', desc: 'Returns the global QueryClient instance so you can imperatively invalidate, prefetch, or update cached queries.' , since: '17'},
    { name: 'provideTanStackQuery', type: 'function', desc: 'Registers the QueryClient and its providers in app.config.ts; must be called once at the application root.' , since: '17'},
    { name: 'QueryClient', type: 'class', desc: 'Holds the in-memory query cache and default options (staleTime, retry, etc.) shared across the entire application.' , since: '17'},
    { name: 'queryKey', type: 'type', desc: 'An array that uniquely identifies a cache entry; two components using the same key share one fetch and one cached response.' },
    { name: 'enabled', type: 'type', desc: 'Boolean or signal-derived boolean option on injectQuery that suspends fetching until truthy — used for dependent queries.' },
    { name: 'staleTime', type: 'type', desc: 'Milliseconds a cached response is considered fresh; after expiry a background refetch is triggered on the next mount or focus.' },
    { name: 'invalidateQueries', type: 'method', desc: 'Marks matching cache entries as stale and triggers an immediate background refetch for all active observers.' },
    { name: 'keepPreviousData', type: 'function', desc: 'placeholderData helper that returns the previous page\'s data while the next page loads, preventing layout shift during pagination.' },
    { name: 'setQueryData', type: 'method', desc: 'Directly updates a cache entry — used for optimistic updates. Pair with getQueryData() snapshot and onError rollback.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Manual HTTP + loading state vs injectQuery',
      before: '// Old: manual RxJS + booleans in a service\nisLoading = false;\nposts: Post[] = [];\nngOnInit() {\n  this.isLoading = true;\n  this.http.get<Post[]>(\'/api/posts\')\n    .subscribe(data => { this.posts = data; this.isLoading = false; });\n}',
      after: '// New: injectQuery handles cache, loading, errors\npostsQuery = injectQuery(() => ({\n  queryKey: [\'posts\'],\n  queryFn: fetchPosts,\n  staleTime: 30_000,\n}));\n// Template: postsQuery.isLoading() / postsQuery.data()',
      note: 'injectQuery replaces manual loading flags, subscriptions, and ad-hoc caching with a single declarative call.',
    },
    {
      title: 'RxJS switchMap dependent query vs enabled option',
      before: '// Old: switchMap chain to wait for an id\nselectedId$ = new Subject<number>();\ndetail$ = this.selectedId$.pipe(\n  switchMap(id => this.http.get<Post>(\'/api/posts/\' + id))\n);',
      after: '// New: enabled option pauses until signal is set\nselectedId = signal<number | null>(null);\ndetailQuery = injectQuery(() => ({\n  queryKey: [\'post\', this.selectedId()],\n  queryFn: () => fetchPost(this.selectedId()!),\n  enabled: this.selectedId() !== null,\n}));',
      note: 'The enabled flag replaces filter/switchMap chains; the query stays idle until the condition is truthy.',
    },
    {
      title: 'Manual cache busting after POST vs invalidateQueries',
      before: '// Old: manually push into array after create\ncreatePost(data).subscribe(newPost => {\n  this.posts = [...this.posts, newPost];\n});',
      after: '// New: invalidate cache, TanStack refetches automatically\nmutation = injectMutation(() => ({\n  mutationFn: createPost,\n  onSuccess: () =>\n    this.qc.invalidateQueries({ queryKey: [\'posts\'] }),\n}));',
      note: 'invalidateQueries lets the cache be the single source of truth — no manual array splicing needed.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling inject(QueryClient) instead of injectQueryClient()',
      wrong: '// Bypasses Angular Query\'s provider setup\nimport { inject } from \'@angular/core\';\nimport { QueryClient } from \'@tanstack/angular-query-experimental\';\nprivate qc = inject(QueryClient);',
      right: '// Use the dedicated injection helper\nimport { injectQueryClient } from \'@tanstack/angular-query-experimental\';\nprivate qc = injectQueryClient();',
      explanation: 'injectQueryClient() is the officially supported way to access the client inside components; inject(QueryClient) may not resolve the same instance registered by provideTanStackQuery.',
    },
    {
      title: 'Passing options as a plain object instead of a callback (breaking reactivity)',
      wrong: '// Options evaluated once — signal changes ignored!\npostsQuery = injectQuery({\n  queryKey: [\'post\', this.selectedId()],\n  queryFn: fetchPost,\n});',
      right: '// Arrow function lets Angular track signal reads\npostsQuery = injectQuery(() => ({\n  queryKey: [\'post\', this.selectedId()],\n  queryFn: () => fetchPost(this.selectedId()!),\n}));',
      explanation: 'The options must be a callback so Angular\'s reactive context can track signal reads and re-run the query when they change. A plain object is evaluated only once at component construction.',
    },
    {
      title: 'Conflating isLoading with isFetching and showing wrong spinners',
      wrong: '// Shows a full-page spinner on every background refetch\n@if (query.isFetching()) {\n  <app-full-page-spinner />\n}',
      right: '// isLoading: initial skeleton; isFetching: subtle indicator\n@if (query.isLoading()) { <app-skeleton /> }\n@if (query.isFetching() && !query.isLoading()) {\n  <div class="top-bar-progress"></div>\n}',
      explanation: 'isLoading is true only when there is no cached data; isFetching is true on every in-flight request including silent background refetches. A full spinner on isFetching would flash on every window focus.',
    },
    {
      title: 'Registering provideTanStackQuery per component instead of at the root',
      wrong: '// Each component gets its own isolated cache — no sharing!\n@Component({\n  providers: [provideTanStackQuery(new QueryClient())],\n})',
      right: '// Register once in app.config.ts providers array\nexport const appConfig: ApplicationConfig = {\n  providers: [provideTanStackQuery(new QueryClient())],\n};',
      explanation: 'The query cache must be a single global instance; scoping it per-component creates isolated caches that cannot deduplicate requests or share data across the component tree.',
    },
    {
      title: 'Duplicating server state in a signal or service after fetching',
      wrong: '// Copying query data into a separate signal loses cache benefits\nposts = signal<Post[]>([]);\nnginit() {\n  effect(() => { if (this.query.data()) this.posts.set(this.query.data()!) });\n}',
      right: '// Use query.data() directly everywhere — it IS the state\npostsQuery = injectQuery(() => ({ queryKey: [\'posts\'], queryFn: fetchPosts }));\n// template: @for (p of postsQuery.data(); track p.id)',
      explanation: 'Copying query data into a separate signal creates two sources of truth that can drift. The query cache is already reactive — read query.data() directly in templates and computed signals.',
    },
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

  revision: RevisionSummary = {
    oneLiner: 'TanStack Query adds a reactive cache layer for server state in Angular — one queryKey, one fetch, shared across all components with automatic background refetching and mutation invalidation.',
    mustKnow: [
      'queryKey is the cache key — same key = shared fetch and shared response; reactive signal reads inside the callback trigger re-fetches when changed',
      'injectQuery options must be a callback function (arrow fn), not a plain object, so Angular tracks signal reads and reacts to changes',
      'enabled: false pauses the query (idle state) — use it for dependent queries that need a prior value before they can fetch',
      'isLoading is true only on first fetch (no cache); isFetching is true on any in-flight request including background refetches',
      'After a successful mutation call invalidateQueries() — marks cache stale and triggers background refetch; never manually update array state',
      'Optimistic updates: onMutate → snapshot → setQueryData → return context; onError → setQueryData(context.previous) to roll back',
      'Register provideTanStackQuery(new QueryClient()) once in app.config.ts — never per component or you get isolated caches',
    ],
    interviewFocus: [
      'How does TanStack Query differ from just using HttpClient + RxJS? What does it add?',
      'Explain queryKey structure — why is [\'posts\'] different from [\'posts\', 1]?',
      'What is the difference between isLoading and isFetching, and when do you use each in the template?',
      'Walk through an optimistic update: what do onMutate, onError, and onSettled each do?',
      'Why must you pass injectQuery options as a callback? What breaks if you use a plain object?',
    ],
  };
}
