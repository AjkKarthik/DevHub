import { Component } from '@angular/core';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';

@Component({
  selector: 'app-react-tanstack-query',
  standalone: true,
  imports: [
    TheoryBlockComponent, CodeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, PageMetaComponent, PageCompleteComponent,
    CommonMistakesComponent, RevisionCardComponent,
  ],
  templateUrl: './tanstack-query.html',
  styleUrl: './tanstack-query.scss',
})
export class ReactTanstackQuery {
  quickRef: QuickRefItem[] = [
    { name: 'QueryClient',                   type: 'class',    desc: 'Central cache manager. Create once, wrap app in QueryClientProvider.' },
    { name: 'useQuery({ queryKey, queryFn })',type: 'hook',     desc: 'Fetch and cache data. Returns { data, isLoading, isError, error, refetch }.' },
    { name: 'useMutation({ mutationFn })',    type: 'hook',     desc: 'Trigger writes (POST/PATCH/DELETE). Returns { mutate, isPending, isError }.' },
    { name: 'queryKey: [...]',               type: 'syntax',   desc: 'Array identifier for a query. Same key = shared cache. Include all params that affect the result.' },
    { name: 'staleTime',                     type: 'keyword',  desc: 'How long data is considered fresh (no background refetch). Default: 0ms.' },
    { name: 'gcTime (was cacheTime)',        type: 'keyword',  desc: 'How long unused cache entries are kept before garbage collection. Default: 5min.' },
    { name: 'queryClient.invalidateQueries', type: 'method',   desc: 'Mark queries as stale and trigger background refetch. Call in onSuccess.' },
    { name: 'queryClient.setQueryData',      type: 'method',   desc: 'Directly update cache — used for optimistic updates.' },
    { name: 'useInfiniteQuery',              type: 'hook',     desc: 'Paginated/infinite scroll queries. Returns pages array + fetchNextPage.' },
    { name: 'prefetchQuery',                 type: 'method',   desc: 'Pre-populate cache before component mounts — e.g. on hover.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What TanStack Query solves',
      points: [
        '<strong>Server state has a different lifecycle than client state.</strong> It lives on the server, can become stale, needs background refresh, and must handle loading/error states. useState + useEffect cannot cache, deduplicate, or background-refresh.',
        '<strong>TanStack Query provides:</strong> automatic caching keyed by queryKey; stale-while-revalidate (return stale data immediately, fetch fresh in background); request deduplication (multiple components requesting the same key trigger one fetch); automatic retry on error; background refetch on window focus and network reconnect.',
        '<strong>QueryClient</strong> is the central cache. Create one instance, wrap your app in <code>&lt;QueryClientProvider client={queryClient}&gt;</code>. Every useQuery/useMutation in the tree shares this cache.',
        '<strong>When NOT to use TanStack Query:</strong> client-only state (cart items, UI state, form values) — use useState/Zustand. TanStack Query is exclusively for server-side data.',
      ],
    },
    {
      heading: 'useQuery — fetching and caching',
      points: [
        '<strong>queryKey</strong> is a serializable array that uniquely identifies a query. Include every value the queryFn depends on: <code>["users", userId]</code>. When userId changes, TanStack Query automatically refetches.',
        '<strong>queryFn</strong> must return a Promise. Throw an error (or reject) to trigger the error state — TanStack Query catches it. The function receives <code>{ queryKey, signal }</code> — use signal to cancel requests on cleanup.',
        '<strong>Staleness vs Cache:</strong> <code>staleTime</code> (default 0ms) = how long data is fresh before TanStack Query refetches in the background. <code>gcTime</code> (default 5 min) = how long unused data stays in cache. Data can be stale but still in cache.',
        '<strong>Return values:</strong> <code>isLoading</code> = first load with no cached data; <code>isFetching</code> = any background fetch (including refetch of cached data); <code>isError</code> + <code>error</code>; <code>data</code> = latest successful response.',
      ],
    },
    {
      heading: 'useMutation — writes and cache invalidation',
      points: [
        '<strong>useMutation</strong> is for POST, PATCH, PUT, DELETE. It does not run automatically — call <code>mutate(variables)</code> or <code>mutateAsync(variables)</code> to trigger it.',
        '<strong>onSuccess callback</strong> is the right place to invalidate related queries: <code>queryClient.invalidateQueries({ queryKey: ["todos"] })</code>. This marks matching queries as stale and triggers a background refetch — the list updates automatically.',
        '<strong>onMutate + onError</strong> enable optimistic updates: update the cache immediately in onMutate, roll back in onError if the server returns an error.',
        '<strong>mutate vs mutateAsync:</strong> mutate is fire-and-forget; mutateAsync returns a Promise so you can await it and handle errors with try/catch in the component.',
      ],
    },
    {
      heading: 'Query keys and cache design',
      points: [
        '<strong>Query key conventions:</strong> use a consistent shape — <code>["resource"]</code> for lists, <code>["resource", id]</code> for details. This makes invalidation easy: <code>invalidateQueries({ queryKey: ["todos"] })</code> invalidates both <code>["todos"]</code> and <code>["todos", 1]</code>.',
        '<strong>Query key factories</strong> are a pattern to centralise key construction: <code>const todoKeys = { all: ["todos"] as const, detail: (id: number) =&gt; [...todoKeys.all, id] as const }</code>.',
        '<strong>Dependent queries:</strong> use the <code>enabled</code> option — <code>enabled: !!userId</code> — to prevent a query from running until a prerequisite value is available.',
        '<strong>Parallel queries:</strong> multiple useQuery calls in the same component fire in parallel. For dynamic parallelism (unknown number of queries), use <code>useQueries([...])</code>.',
      ],
    },
    {
      heading: 'Optimistic updates and prefetching',
      points: [
        '<strong>Optimistic update pattern:</strong> (1) onMutate: snapshot current cache with <code>getQueryData</code>, update cache with <code>setQueryData</code>; (2) onError: roll back with the snapshot; (3) onSettled: invalidate to sync with server truth.',
        '<strong>Prefetching:</strong> call <code>queryClient.prefetchQuery({ queryKey, queryFn })</code> on hover to populate the cache before the user navigates. The component that renders next will get data instantly.',
        '<strong>Initial data vs placeholder data:</strong> <code>initialData</code> is treated as real cached data (subject to staleTime); <code>placeholderData</code> is shown immediately but triggers a fetch right away and does not pollute the cache.',
        '<strong>Suspense mode:</strong> set <code>suspense: true</code> (or use <code>useSuspenseQuery</code>) to integrate with React Suspense — the query suspends the component until data is ready, simplifying loading state management.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup + useQuery',
      language: 'typescript',
      code: `import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,   // 1 minute — don't refetch if data is < 1 min old
      retry:     1,            // retry once on error before showing error state
    },
  },
});

// Root — wrap app in provider
function Root() {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

interface Post { id: number; title: string; userId: number; }

// Query key factory — centralises key construction
const postKeys = {
  all:    ()         => ['posts']           as const,
  list:   (filter?: string) => [...postKeys.all(), { filter }] as const,
  detail: (id: number)      => [...postKeys.all(), id]         as const,
};

function PostList() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: postKeys.list(),
    queryFn:  ({ signal }) =>
      fetch('https://jsonplaceholder.typicode.com/posts?_limit=10', { signal })
        .then(r => { if (!r.ok) throw new Error('Failed'); return r.json() as Promise<Post[]>; }),
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError)   return <p>Error: {(error as Error).message}</p>;

  return <ul>{data?.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}`,
    },
    {
      label: 'useMutation + invalidate',
      language: 'typescript',
      code: `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo { id: number; text: string; done: boolean; }

function TodoApp() {
  const queryClient = useQueryClient();

  const { data: todos = [] } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn:  () => fetch('/api/todos').then(r => r.json()),
  });

  const addMutation = useMutation({
    mutationFn: (text: string) =>
      fetch('/api/todos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, done: false }),
      }).then(r => r.json()),
    onSuccess: () => {
      // Invalidate — marks ['todos'] stale → background refetch → list updates
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (todo: Todo) =>
      fetch(\`/api/todos/\${todo.id}\`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ done: !todo.done }),
      }).then(r => r.json()),
    onSuccess: (updated: Todo) => {
      // Precise update — replace just this item in cache
      queryClient.setQueryData<Todo[]>(['todos'], prev =>
        prev?.map(t => t.id === updated.id ? updated : t) ?? []
      );
    },
  });

  return (
    <div>
      <button onClick={() => addMutation.mutate('New task')} disabled={addMutation.isPending}>
        {addMutation.isPending ? 'Adding…' : '+ Add'}
      </button>
      <ul>
        {todos.map(t => (
          <li key={t.id} onClick={() => toggleMutation.mutate(t)} style={{ textDecoration: t.done ? 'line-through' : 'none' }}>
            {t.text}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
    },
    {
      label: 'Optimistic update',
      language: 'typescript',
      code: `import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo { id: number; text: string; done: boolean; }

function useToggleTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todo: Todo) =>
      fetch(\`/api/todos/\${todo.id}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: !todo.done }),
      }).then(r => r.json()),

    onMutate: async (todo) => {
      // Cancel any in-flight refetch (to avoid overwriting optimistic update)
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      // Snapshot current data for rollback
      const snapshot = queryClient.getQueryData<Todo[]>(['todos']);
      // Optimistically update cache
      queryClient.setQueryData<Todo[]>(['todos'], prev =>
        prev?.map(t => t.id === todo.id ? { ...t, done: !t.done } : t) ?? []
      );
      return { snapshot };    // returned as context
    },

    onError: (_err, _todo, context) => {
      // Rollback to snapshot if mutation fails
      if (context?.snapshot) {
        queryClient.setQueryData(['todos'], context.snapshot);
      }
    },

    onSettled: () => {
      // Always refetch to sync with server truth
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}`,
    },
    {
      label: 'Dependent + parallel queries',
      language: 'typescript',
      code: `import { useQuery, useQueries } from '@tanstack/react-query';

// Dependent query — waits for userId before fetching posts
function UserPosts({ userId }: { userId: number | null }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn:  () => fetch(\`/api/users/\${userId}\`).then(r => r.json()),
    enabled:  !!userId,          // only runs when userId is truthy
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', { userId }],
    queryFn:  () => fetch(\`/api/posts?userId=\${userId}\`).then(r => r.json()),
    enabled:  !!user,            // only runs after user is loaded
  });

  return <div>{posts?.map((p: any) => <p key={p.id}>{p.title}</p>)}</div>;
}

// Parallel queries — static, fire simultaneously
function Dashboard() {
  const statsQ  = useQuery({ queryKey: ['stats'],        queryFn: () => fetch('/api/stats').then(r => r.json()) });
  const notifQ  = useQuery({ queryKey: ['notifications'], queryFn: () => fetch('/api/notif').then(r => r.json()) });
  return <div>{statsQ.data?.total} — {notifQ.data?.count} notifications</div>;
}

// Dynamic parallel queries — useQueries for unknown count
function MultiUserAvatars({ ids }: { ids: number[] }) {
  const results = useQueries({
    queries: ids.map(id => ({
      queryKey: ['user', id],
      queryFn:  () => fetch(\`/api/users/\${id}\`).then(r => r.json()),
    })),
  });
  return <>{results.map((r, i) => r.data && <img key={ids[i]} src={r.data.avatar} />)}</>;
}`,
    },
    {
      label: 'useInfiniteQuery',
      language: 'typescript',
      code: `import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { useRef, useCallback, useEffect } from 'react';

interface Page { posts: Post[]; nextCursor: number | null; }
interface Post  { id: number; title: string; }

function InfinitePostList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<Page>({
    queryKey:              ['posts', 'infinite'],
    queryFn:               ({ pageParam, signal }) =>
      fetch(\`/api/posts?cursor=\${pageParam}&limit=10\`, { signal }).then(r => r.json()),
    initialPageParam:      0,
    getNextPageParam:      lastPage => lastPage.nextCursor ?? undefined,
  });

  // Intersection observer — auto-fetch when sentinel div enters viewport
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observe = useCallback(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasNextPage) fetchNextPage();
    });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasNextPage, fetchNextPage]);

  useEffect(observe, [observe]);

  const allPosts = data?.pages.flatMap(p => p.posts) ?? [];

  return (
    <div>
      <ul>{allPosts.map(p => <li key={p.id}>{p.title}</li>)}</ul>
      <div ref={sentinelRef} />
      {isFetchingNextPage && <p>Loading more…</p>}
      {!hasNextPage && <p>No more posts</p>}
    </div>
  );
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Including unstable values in queryKey',
      wrong: `// Object literal creates new reference on every render → refetches on every render
useQuery({
  queryKey: ['user', { filter: { active: true } }],
  queryFn: fetchUsers,
});`,
      right: `// Primitive values or stable references only
useQuery({
  queryKey: ['user', 'active'],        // string is stable
  queryFn: fetchActiveUsers,
});
// Or: sort/stringify the filter deterministically before including
useQuery({
  queryKey: ['user', JSON.stringify(sortedFilter)],
  queryFn: () => fetchUsers(filter),
});`,
      explanation: 'TanStack Query serializes the queryKey to detect changes. Object literals in the key are not equal on subsequent renders — this triggers a refetch every time the component renders.',
    },
    {
      title: 'Calling invalidateQueries with wrong key scope',
      wrong: `// Invalidates ONLY ['todos', 1] — the list ['todos'] is not refreshed
queryClient.invalidateQueries({ queryKey: ['todos', 1] });`,
      right: `// Invalidate the whole 'todos' namespace — all matching queries refetch
queryClient.invalidateQueries({ queryKey: ['todos'] });
// TanStack Query uses prefix matching: ['todos'] matches ['todos'], ['todos', 1], etc.`,
      explanation: 'invalidateQueries uses prefix matching. If you only invalidate a specific key, sibling queries (e.g. the list) are not refreshed. Invalidate the parent key to refresh all related queries.',
    },
    {
      title: 'Forgetting enabled option for dependent queries',
      wrong: `function UserPosts({ userId }: { userId: string | null }) {
  const { data } = useQuery({
    queryKey: ['posts', userId],
    queryFn:  () => fetch(\`/api/posts?userId=\${userId}\`).then(r => r.json()),
    // userId may be null — fetch runs with null, returns wrong data or errors
  });
}`,
      right: `function UserPosts({ userId }: { userId: string | null }) {
  const { data } = useQuery({
    queryKey: ['posts', userId],
    queryFn:  () => fetch(\`/api/posts?userId=\${userId}\`).then(r => r.json()),
    enabled:  !!userId,   // query is paused until userId is truthy
  });
}`,
      explanation: 'Without enabled, queries fire immediately even when required values are not yet available. enabled: !!userId pauses the query until userId has a real value.',
    },
    {
      title: 'Not using mutateAsync for sequential operations',
      wrong: `const save = () => {
  mutation.mutate(data);
  // mutate is fire-and-forget — code after this runs immediately, not after mutation
  showSuccessToast();  // always shows, even on error
};`,
      right: `const save = async () => {
  try {
    await mutation.mutateAsync(data);   // awaitable — throws on error
    showSuccessToast();                 // only runs on success
  } catch (err) {
    showErrorToast((err as Error).message);
  }
};`,
      explanation: 'mutate() is fire-and-forget — it does not return a Promise. Use mutateAsync() when you need to await the result, chain operations after success, or handle errors with try/catch.',
    },
    {
      title: 'Setting staleTime to Infinity without gcTime consideration',
      wrong: `useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity,    // never refetch in background — OK
  // gcTime defaults to 5min — cache removed 5min after component unmounts
  // If user navigates back, fresh fetch required despite staleTime: Infinity
});`,
      right: `useQuery({
  queryKey: ['config'],
  queryFn: fetchConfig,
  staleTime: Infinity,
  gcTime:    Infinity,   // keep in cache forever — no re-fetch even after unmount
});`,
      explanation: 'staleTime controls when background refetch triggers; gcTime controls how long unused data stays in cache. For truly static data, set both to Infinity.',
    },
    {
      title: 'Using TanStack Query for client state',
      wrong: `// Managing UI state (modal open, selected tab) in TanStack Query
const { data: isModalOpen } = useQuery({
  queryKey: ['ui', 'modal'],
  queryFn: () => false,
  staleTime: Infinity,
});`,
      right: `// Client state belongs in useState or Zustand
const [isModalOpen, setModalOpen] = useState(false);
// TanStack Query is exclusively for server/async data`,
      explanation: 'TanStack Query is designed for server state — async data with a remote source of truth. Using it for UI state (booleans, selected items) adds unnecessary complexity. Use useState or Zustand instead.',
    },
  ];

  challenge: Challenge = {
    title: 'GitHub Repo Explorer with TanStack Query',
    language: 'typescript',
    description: `Build a GitHub repository explorer using TanStack Query v5:

1. Search field: debounce 400ms, then fetch https://api.github.com/search/repositories?q={query}&per_page=10
2. Use useQuery with queryKey: ['repos', query] — refetch when query changes
3. Show total_count and list of repos (name, description, stargazerCount, language)
4. On click: show repo details — fetch https://api.github.com/repos/{owner}/{repo}
   Use a dependent query: enabled only when a repo is selected
5. Star button: useMutation that POSTs a fake "star" action (mock API call)
   - Optimistically increment the stargazerCount in the detail query cache
   - Roll back on error
6. Use staleTime: 60_000 (1 minute) — GitHub rate limits are strict`,
    hints: [
      'queryKey: ["repos", debouncedQuery] — use a useDebounce custom hook or useRef+useEffect for debouncing',
      'enabled: debouncedQuery.length >= 2 — do not fetch for very short queries',
      'For the detail query: enabled: !!selectedRepo — only fetch when a repo is selected',
      'Optimistic update: onMutate → getQueryData(["repo", owner, name]) → setQueryData with incremented stars → return snapshot for rollback',
    ],
    starterCode: `import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });

interface Repo { id: number; name: string; full_name: string; description: string; stargazers_count: number; language: string; owner: { login: string }; }

// TODO: useDebounce hook
// TODO: RepoSearch component (useQuery with debounced key)
// TODO: RepoDetail component (dependent useQuery)
// TODO: StarButton (useMutation with optimistic update)

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* TODO: wire together */}
    </QueryClientProvider>
  );
}`,
    solution: `import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });

interface Repo { id: number; name: string; full_name: string; description: string | null; stargazers_count: number; language: string | null; owner: { login: string }; }
interface SearchResult { total_count: number; items: Repo[]; }

function useDebounce<T>(value: T, ms: number): T {
  const [dv, setDv] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDv(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return dv;
}

function RepoSearch({ onSelect }: { onSelect: (r: Repo) => void }) {
  const [q, setQ] = useState('');
  const dq = useDebounce(q, 400);

  const { data, isLoading, isError } = useQuery<SearchResult>({
    queryKey: ['repos', dq],
    queryFn:  ({ signal }) => fetch(\`https://api.github.com/search/repositories?q=\${dq}&per_page=10\`, { signal }).then(r => { if (!r.ok) throw new Error(\`\${r.status}\`); return r.json(); }),
    enabled:  dq.length >= 2,
  });

  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search GitHub repos…" />
      {isLoading && <p>Searching…</p>}
      {isError   && <p>API error — check rate limit</p>}
      {data && <p>{data.total_count} results</p>}
      <ul>{data?.items.map(r => <li key={r.id} style={{ cursor:'pointer' }} onClick={() => onSelect(r)}>{r.full_name} ⭐{r.stargazers_count} {r.language}</li>)}</ul>
    </div>
  );
}

function StarButton({ repo }: { repo: Repo }) {
  const qc = useQueryClient();
  const key = ['repo', repo.owner.login, repo.name];

  const star = useMutation({
    mutationFn: () => new Promise(r => setTimeout(r, 500)),  // mock
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const snap = qc.getQueryData<Repo>(key);
      qc.setQueryData<Repo>(key, r => r ? { ...r, stargazers_count: r.stargazers_count + 1 } : r);
      return { snap };
    },
    onError: (_, __, ctx) => { if (ctx?.snap) qc.setQueryData(key, ctx.snap); },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  return <button onClick={() => star.mutate()} disabled={star.isPending}>{star.isPending ? 'Starring…' : '⭐ Star'}</button>;
}

function RepoDetail({ repo }: { repo: Repo }) {
  const { data, isLoading } = useQuery<Repo>({
    queryKey: ['repo', repo.owner.login, repo.name],
    queryFn: ({ signal }) => fetch(\`https://api.github.com/repos/\${repo.full_name}\`, { signal }).then(r => r.json()),
    enabled: !!repo,
    initialData: repo,
  });
  if (isLoading) return <p>Loading detail…</p>;
  return (
    <div>
      <h2>{data?.full_name}</h2>
      <p>{data?.description}</p>
      <p>⭐ {data?.stargazers_count} | {data?.language}</p>
      <StarButton repo={data!} />
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState<Repo | null>(null);
  return (
    <QueryClientProvider client={queryClient}>
      <RepoSearch onSelect={setSelected} />
      {selected && <RepoDetail repo={selected} />}
    </QueryClientProvider>
  );
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between isLoading and isFetching in TanStack Query?',
      options: ['They are identical', 'isLoading is true only on the first load with no cached data; isFetching is true during any fetch including background refetches', 'isFetching is only true during mutations', 'isLoading is only for mutations'],
      answer: 1,
      explanation: 'isLoading = no cached data AND a fetch is in progress (first load). isFetching = any fetch in progress, including background refetches of cached data. For showing a skeleton use isLoading; for a spinner on background refresh use isFetching.',
    },
    {
      q: 'What does staleTime control?',
      options: ['How long before the data is removed from cache', 'How long data is considered fresh before TanStack Query triggers a background refetch', 'How many retries before showing an error', 'The timeout for individual fetch requests'],
      answer: 1,
      explanation: 'staleTime sets the freshness window. During this period, no background refetch triggers. After it expires, the next mount/focus/reconnect triggers a background refetch. Default is 0ms — always stale.',
    },
    {
      q: 'How does invalidateQueries({ queryKey: ["todos"] }) affect ["todos", 1]?',
      options: ['It does not affect ["todos", 1]', 'It marks ["todos", 1] as stale and triggers a background refetch', 'It deletes ["todos", 1] from the cache', 'It throws an error — keys must match exactly'],
      answer: 1,
      explanation: 'invalidateQueries uses prefix matching. ["todos"] is a prefix of ["todos", 1], so the invalidation cascades to all queries whose key starts with "todos". This makes namespace-based invalidation easy.',
    },
    {
      q: 'When should you use mutateAsync instead of mutate?',
      options: ['Always — mutateAsync is the preferred API', 'When you need to await the result, chain operations after success, or handle errors with try/catch in the component', 'When the mutation has optimistic updates', 'When the server returns data you need to display'],
      answer: 1,
      explanation: 'mutate is fire-and-forget — code after it runs immediately. mutateAsync returns a Promise that resolves with the mutation result or rejects on error, so you can await it and write sequential logic.',
    },
    {
      q: 'What is the purpose of the onMutate callback in an optimistic update?',
      options: ['To cancel the mutation if data is already in cache', 'To snapshot current cache data and update the cache optimistically before the server responds', 'To retry the mutation on failure', 'To invalidate related queries before the mutation runs'],
      answer: 1,
      explanation: 'onMutate runs before the mutation reaches the server. Use it to: (1) cancel in-flight refetches; (2) snapshot current cache; (3) optimistically update cache. The snapshot is returned as context for rollback in onError.',
    },
    {
      q: 'How do you prevent a query from running until a prerequisite value is available?',
      options: ['Set staleTime: Infinity', 'Use the enabled option — enabled: !!requiredValue', 'Wrap the query in an if statement', 'Set retry: 0'],
      answer: 1,
      explanation: 'enabled: false pauses the query — it will not fetch until enabled becomes true. This is the standard pattern for dependent queries (fetch user details only after the user ID is loaded).',
    },
    {
      q: 'What does gcTime (formerly cacheTime) control?',
      options: ['How long before stale data is refetched', 'How long unused cache entries are kept in memory before being garbage-collected', 'The maximum time a query can take before being cancelled', 'How long mutations are kept in the mutation cache'],
      answer: 1,
      explanation: 'gcTime (default 5 minutes) controls how long an entry stays in the cache after all components that use it have unmounted. After this time, the cache entry is removed. On next mount, a fresh fetch is required.',
    },
    {
      q: 'What does useInfiniteQuery\'s getNextPageParam function return?',
      options: ['The total number of pages', 'The pageParam to pass to the next queryFn call, or undefined to signal no more pages', 'The data from the next page', 'The URL for the next API request'],
      answer: 1,
      explanation: 'getNextPageParam receives the last page data and all pages, then returns the cursor/page number for the next request. Return undefined (or null) to signal that there are no more pages — hasNextPage becomes false.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I use TanStack Query with React Router loaders?',
      a: 'Inside the loader, call queryClient.ensureQueryData({ queryKey, queryFn }). This checks the cache first and only fetches if stale. The component then calls useQuery with the same key — it gets the cached data instantly, with background refresh managed by TanStack Query.',
    },
    {
      q: 'Should I use TanStack Query or RTK Query?',
      a: 'Both solve the same server-state problem. TanStack Query is framework-agnostic, has a simpler API, and works great with any state manager. RTK Query is built into Redux Toolkit — if your app already uses Redux, RTK Query integrates cleanly. For new greenfield projects, TanStack Query is the more popular choice.',
    },
    {
      q: 'How do I cancel a pending query when a component unmounts?',
      a: 'TanStack Query automatically passes an AbortSignal to queryFn as { signal }. Pass it to fetch: fetch(url, { signal }). When the component unmounts or the queryKey changes, TanStack Query calls signal.abort() — the fetch is cancelled and the AbortError is swallowed automatically.',
    },
    {
      q: 'Can I use TanStack Query without React?',
      a: 'Yes — TanStack Query v5 has adapters for Vue, Solid, Svelte, and vanilla JS. The core QueryClient is framework-agnostic. The React-specific parts are in @tanstack/react-query.',
    },
    {
      q: 'How do I show a toast after a successful mutation?',
      a: 'Add an onSuccess callback in useMutation — it runs after the mutation completes successfully. For a global approach, pass onSuccess to queryClient\'s MutationCache: new QueryClient({ mutationCache: new MutationCache({ onError: (err) => toast.error(err.message) }) }).',
    },
    {
      q: 'How do I prefetch data on the server with TanStack Query in Next.js?',
      a: 'Use the HydrationBoundary pattern (TanStack Query v5): in a Server Component, create a queryClient, call `await queryClient.prefetchQuery(...)`, then pass `<HydrationBoundary state={dehydrate(queryClient)}>` as a wrapper around the Client Component tree. The client picks up the pre-fetched cache and useQuery() returns data immediately without a loading state.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'TanStack Query is the standard for server state — automatic caching, stale-while-revalidate, and cache invalidation after mutations.',
    mustKnow: [
      'queryKey must include all values the queryFn depends on — changes trigger a refetch',
      'isLoading = first load, no cache; isFetching = any fetch including background',
      'staleTime = freshness window; gcTime = how long unused cache survives after unmount',
      'useMutation onSuccess: invalidateQueries to refresh list; setQueryData for precise cache update',
      'Optimistic update: snapshot in onMutate, rollback in onError, invalidate in onSettled',
      'enabled: !!dep for dependent queries; useInfiniteQuery + getNextPageParam for pagination',
    ],
    interviewFocus: [
      'What does stale-while-revalidate mean in TanStack Query — and why is it better than manual useEffect fetch?',
      'Walk through an optimistic update — what happens in onMutate, onError, and onSettled?',
      'Difference between invalidateQueries and setQueryData — when would you use each?',
      'How does TanStack Query integrate with React Router loaders?',
    ],
  };
}
