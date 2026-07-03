import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-dependent-and-parallel-queries-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './dependent-and-parallel-queries.html',
  styleUrl: './dependent-and-parallel-queries.scss',
})
export class DependentAndParallelQueriesSubtopic {

  tsqDeps = { '@tanstack/angular-query-experimental': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Dependent queries — chaining with enabled',
      points: [
        'A dependent query needs data from a PREVIOUS query before it can run — e.g. fetch a user by username, then fetch that user\'s posts using the returned <code>userId</code>. Express this with <code>enabled: !!userQuery.data()?.id</code> on the second <code>injectQuery()</code> call — the query stays IDLE (queryFn never called) until the condition becomes true.',
        'Because the <code>enabled</code> option (and the whole options object) is a REACTIVE callback function, TanStack Query automatically re-evaluates it whenever <code>userQuery.data()</code> changes — no manual subscription or effect needed to "unlock" the dependent query once the first one resolves.',
        'Reading <code>userQuery.data()?.id</code> directly inside the second query\'s <code>queryKey</code> AND <code>queryFn</code> means the postsQuery automatically re-keys and re-fetches if the user ID ever changes — the dependency is expressed entirely through signal reads, not imperative wiring.',
      ],
    },
    {
      heading: 'injectQueries() — a dynamic, variable-length array of parallel queries',
      points: [
        '<code>injectQueries()</code> (plural) runs a VARIABLE number of queries in parallel, generated from a reactive array — unlike calling <code>injectQuery()</code> multiple times by hand (which only works for a FIXED, known-at-compile-time number of queries), this handles "fetch details for however many IDs are in this array right now."',
        'The signature takes a callback returning <code>{ queries: ids().map(id => ({ queryKey: [\'item\', id], queryFn: () =&gt; fetchItem(id) })) }</code> — each entry becomes an independent query sharing the SAME cache as any other query with a matching key, so an item already cached from elsewhere in the app is reused instantly.',
        'The combined RESULT is an array of individual query result objects, in the same order as the input array — check <code>results().every(r =&gt; r.isSuccess)</code> to know when ALL of them have resolved, similar in spirit to <code>Promise.all</code> but with each query independently cached and retried.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { injectQuery, injectQueries } from '@tanstack/angular-query-experimental';

interface User { id: number; username: string; }
interface Post { id: number; title: string; }

function fetchUser(username: string): Promise<User> {
  return new Promise(resolve => setTimeout(() => resolve({ id: 42, username }), 400));
}

function fetchPostsForUser(userId: number): Promise<Post[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve([{ id: 1, title: 'First post' }, { id: 2, title: 'Second post' }]), 400),
  );
}

function fetchTag(id: number): Promise<{ id: number; name: string }> {
  return new Promise(resolve => setTimeout(() => resolve({ id, name: 'tag-' + id }), 300 + id * 100));
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonPipe],
  template: \`
    <h3>Dependent query — posts wait for the user query to resolve</h3>
    <p>User: {{ userQuery.isLoading() ? 'loading...' : userQuery.data()?.username }}</p>
    <p>Posts: {{ postsQuery.isLoading() ? 'waiting for user...' : (postsQuery.data() | json) }}</p>

    <h3>injectQueries — a dynamic parallel array of tag queries</h3>
    <button (click)="addTagId()">Add another tag ID</button>
    <ul>
      @for (result of tagQueries.result(); track $index) {
        <li>{{ result.isLoading() ? 'loading...' : result.data()?.name }}</li>
      }
    </ul>
  \`,
})
export class App {
  userQuery = injectQuery(() => ({
    queryKey: ['user', 'alice'],
    queryFn: () => fetchUser('alice'),
  }));

  postsQuery = injectQuery(() => ({
    queryKey: ['posts', this.userQuery.data()?.id],
    queryFn: () => fetchPostsForUser(this.userQuery.data()!.id),
    enabled: !!this.userQuery.data()?.id,
  }));

  tagIds = signal([1, 2]);

  tagQueries = injectQueries(() => ({
    queries: this.tagIds().map(id => ({
      queryKey: ['tag', id],
      queryFn: () => fetchTag(id),
    })),
  }));

  addTagId() {
    this.tagIds.update(ids => [...ids, ids.length + 1]);
  }
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { App } from './app/app';

bootstrapApplication(App, {
  providers: [provideTanStackQuery(new QueryClient())],
});
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Dependent and parallel queries</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change postsQuery to also depend on the username being non-empty (e.g. enabled: !!this.userQuery.data()?.id && this.userQuery.data()!.username.length > 0), and explain why this extra condition is redundant given the mock data.',
    hint: 'The extra condition is logically redundant here because fetchUser always resolves with a non-empty hardcoded username — but the pattern (combining multiple readiness conditions with &&) is the correct general approach for real dependent-query chains with multiple prerequisites.',
    solution: `postsQuery = injectQuery(() => ({
  queryKey: ['posts', this.userQuery.data()?.id],
  queryFn: () => fetchPostsForUser(this.userQuery.data()!.id),
  enabled: !!this.userQuery.data()?.id && this.userQuery.data()!.username.length > 0,
}));`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a dependent query needs a manual effect() or subscription to "unlock" once its prerequisite query resolves.',
      reality: 'because the enabled option (and the whole options callback) is reactive, TanStack Query automatically re-evaluates it whenever a signal read inside it changes — no manual wiring is needed to unlock a dependent query.',
    },
    {
      thought: 'injectQueries() and calling injectQuery() multiple times by hand accomplish the same thing.',
      reality: 'injectQuery() calls must be a FIXED number known at compile time — injectQueries() specifically handles a VARIABLE, runtime-determined array of queries (e.g. "fetch details for however many IDs are currently selected"), which injectQuery() cannot express.',
    },
    {
      thought: 'each query inside injectQueries() gets its own isolated cache, separate from queries created elsewhere with injectQuery().',
      reality: 'every query inside injectQueries() shares the SAME global query cache as any other query with a matching queryKey — an item already cached elsewhere in the app is reused instantly rather than re-fetched.',
    },
  ];
}
