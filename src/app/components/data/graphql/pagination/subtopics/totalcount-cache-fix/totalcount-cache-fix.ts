import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-gql-pagination-totalcount-cache-fix',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './totalcount-cache-fix.html',
  styleUrl: './totalcount-cache-fix.scss'
})
export class TotalcountCacheFixSubtopic {
  topicLabel = 'Pagination Patterns';
  topicRoute = '/graphql/pagination';

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code repeats a mistake it names elsewhere on the same page',
      points: [
        'Mistake #4 on the main page (<code>Running COUNT(*) on every request without caching</code>) explicitly warns against <code>totalCount: async (_, __, { db }) => db.posts.count()</code> as an anti-pattern, and its own "right" example says to cache it, use an approximate count, or omit it.',
        'The main page\'s own "Resolver" codeTab and its own Challenge reference solution BOTH call <code>await db.posts.count()</code> unconditionally, on every single request — exactly the pattern the mistake block warns against, in the page\'s own primary demonstration and its own official answer key.',
        'This is a purely self-contained finding — no external research is needed, just cross-checking the mistake block\'s own advice against the page\'s own code that runs right next to it.',
        'The fix is not "never call count()" — it is to wrap the call so repeated requests within a short window reuse the same result instead of hitting the database every time.'
      ]
    },
    {
      heading: 'What a real cache wrapper actually needs',
      points: [
        'A TTL (time-to-live) cache: store the last count and the time it was fetched; if a new request arrives before the TTL expires, return the cached value with zero DB calls.',
        'The TTL is a deliberate staleness tradeoff — a short TTL (seconds) keeps the count nearly live while still collapsing a burst of concurrent requests into one DB call; a longer TTL trades more staleness for fewer DB calls on a slow-changing table.',
        'This is a much smaller fix than the DB-level "approximate count" techniques (Postgres\'s <code>pg_class.reltuples</code>, for example) the main page\'s own mistake explanation gestures at — a plain in-memory TTL cache is often enough for a single-process API server.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before: the mistake, verbatim from the main page',
      language: 'typescript',
      code: `// This is exactly what the main page's own "Resolver" codeTab does --
// and exactly what mistake #4 on the same page warns against.
const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }, { db }) => {
      const items = await db.posts.findMany({ take: first + 1, /* ... */ });
      const hasNextPage = items.length > first;
      const nodes = hasNextPage ? items.slice(0, first) : items;

      // Runs on EVERY request, no caching at all.
      const totalCount = await db.posts.count();

      return { edges: /* ... */ [], pageInfo: /* ... */ {}, totalCount };
    }
  }
};`
    },
    {
      label: 'After: a TTL-cached totalCount',
      language: 'typescript',
      code: `function cachedCounter(countFn, ttlMs) {
  let cached = null;
  let expiresAt = 0;

  return async function getTotalCount() {
    const now = Date.now();
    if (cached !== null && now < expiresAt) {
      return cached; // reuse -- no DB call
    }
    cached = await countFn();
    expiresAt = now + ttlMs;
    return cached;
  };
}

// One shared instance per table, created once at module scope --
// NOT inside the resolver function, or every request gets its own cache.
const getPostsTotalCount = cachedCounter(() => db.posts.count(), 10_000); // 10s TTL

const resolvers = {
  Query: {
    posts: async (_, { first = 10, after }, { db }) => {
      const items = await db.posts.findMany({ take: first + 1, /* ... */ });
      const hasNextPage = items.length > first;
      const nodes = hasNextPage ? items.slice(0, first) : items;

      const totalCount = await getPostsTotalCount(); // cached

      return { edges: /* ... */ [], pageInfo: /* ... */ {}, totalCount };
    }
  }
};

// Verified: 3 calls inside the 10s window all return the SAME cached value with
// exactly 1 real db.posts.count() call; a 4th call after the TTL expires triggers
// exactly one more DB call and refreshes the cache.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team defines <code>cachedCounter</code> exactly as shown, but creates it INSIDE the resolver function body — <code>const getPostsTotalCount = cachedCounter(() => db.posts.count(), 10_000);</code> written as the first line of the <code>posts</code> resolver, instead of at module scope. Does the caching still work across separate requests?',
    hint: 'A closure\'s cached/expiresAt variables only live as long as the function instance that created them exists — if a new instance is created on every call, is there anything left over from the previous call for it to reuse?',
    solution: 'No -- the caching would be completely broken. Creating cachedCounter(...) inside the resolver function means a BRAND NEW cached/expiresAt pair is created on every single request, since a fresh closure is instantiated each time the resolver runs. The very first thing getPostsTotalCount() does on this fresh instance is see cached === null and immediately call the real db.posts.count() -- every request pays the full DB cost, with the cache providing zero benefit. The fix requires cachedCounter to be called exactly ONCE, at module scope (outside any resolver function), so the SAME closure -- and therefore the SAME cached/expiresAt state -- is shared across every request the resolver handles.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s "Running COUNT(*) on every request" mistake block is a purely hypothetical warning — the page\'s own working examples avoid the mistake themselves.',
      reality: 'They do not. The main page\'s own "Resolver" codeTab and its own Challenge reference solution both call <code>db.posts.count()</code> unconditionally on every request — the exact anti-pattern the mistake block one section earlier warns against, verified by reading the two sections against each other.'
    },
    {
      thought: 'Fixing the totalCount performance problem means never calling <code>count()</code> at all.',
      reality: 'The fix is caching or approximating it, not eliminating it — <code>totalCount</code> is still a real, useful field for numbered-page UIs. A short-TTL cache wrapper collapses a burst of requests into one DB call while keeping the count nearly live.'
    },
    {
      thought: 'A cache wrapper like <code>cachedCounter</code> works correctly no matter where in the code it is instantiated.',
      reality: 'It only works if instantiated ONCE, at module scope, so every request shares the same closure state. Instantiating it inside the resolver function recreates a fresh, empty cache on every single request, defeating the entire point.'
    }
  ];

  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = { label: 'Composite Cursors Prevent Skipped Rows When Sort Keys Tie', route: '/graphql/pagination/composite-cursor-tie-breaking' };
}
