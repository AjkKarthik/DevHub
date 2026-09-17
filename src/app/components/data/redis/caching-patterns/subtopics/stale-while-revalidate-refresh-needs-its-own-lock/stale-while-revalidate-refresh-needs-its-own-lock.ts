import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-stale-while-revalidate-refresh-needs-its-own-lock',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './stale-while-revalidate-refresh-needs-its-own-lock.html',
  styleUrl: './stale-while-revalidate-refresh-needs-its-own-lock.scss',
})
export class StaleWhileRevalidateRefreshNeedsItsOwnLockSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The bug: an unlocked refresh reintroduces the exact stampede this page is about',
      points: [
        'The main page\'s own <code>getWithSWR</code> function serves a stale value immediately and calls <code>refreshInBackground(key, fetcher)</code> to repopulate the cache — but the original <code>refreshInBackground</code> called <code>fetcher()</code> unconditionally, with no lock or coordination between concurrent callers at all.',
        'When a hot key\'s freshness window expires, every concurrent request that reads it in that same brief window sees the identical stale value and independently calls <code>refreshInBackground</code> — each one running its OWN copy of <code>fetcher()</code> against the origin database.',
        'This is the same failure mode the page\'s own "Cache Stampede Prevention" theory section exists to explain, just relocated: instead of a hard TTL cliff causing N simultaneous DB hits, an unlocked background-refresh path causes N simultaneous DB hits during the stale window instead. The mechanism differs; the outcome — many redundant concurrent queries against the same data — is identical.',
      ],
    },
    {
      heading: 'The fix reuses a pattern already on the same page',
      points: [
        'The main page\'s own "Stampede Prevention" codeTab already demonstrates a mutex lock via <code>SET lockKey 1 NX EX ttl</code> for the mutex-lock cache-aside pattern — the SAME technique applies directly inside <code>refreshInBackground</code>: acquire a short-lived lock keyed to the cache key before calling <code>fetcher()</code>, and skip the refresh entirely if the lock is already held.',
        'A request that fails to acquire the refresh lock does not need to wait or retry at all — it already has a perfectly good stale value to return immediately, which is the whole point of stale-while-revalidate. The lock only needs to gate the SIDE EFFECT (the background refresh), never the response returned to the caller.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the stampede, then locking it',
      language: 'typescript',
      code: `// Stand-in for the origin DB call every concurrent request would otherwise duplicate.
let dbCallCount = 0;
async function fetcher(): Promise<{ value: string }> {
  dbCallCount++;
  await new Promise(r => setTimeout(r, 10));
  return { value: 'fresh-' + Date.now() };
}

// --- BUGGY: the main page's original refreshInBackground, no lock at all ---
async function refreshInBackgroundBuggy(fetcher: () => Promise<object>) {
  await fetcher(); // every caller runs this independently
}

async function simulateBuggy(concurrentRequests: number) {
  dbCallCount = 0;
  await Promise.all(
    Array.from({ length: concurrentRequests }, () => refreshInBackgroundBuggy(fetcher)),
  );
  return dbCallCount;
}

// --- FIXED: gate the refresh itself with the same SET NX pattern already
// shown for the mutex-lock cache-aside pattern earlier on this page ---
const locks = new Set<string>(); // stand-in for Redis SET key 1 NX EX ttl

async function refreshInBackgroundFixed(key: string, fetcher: () => Promise<object>) {
  if (locks.has(key)) return; // another request is already refreshing this key
  locks.add(key);
  try {
    await fetcher();
  } finally {
    locks.delete(key);
  }
}

async function simulateFixed(concurrentRequests: number) {
  dbCallCount = 0;
  await Promise.all(
    Array.from({ length: concurrentRequests }, () => refreshInBackgroundFixed('v1:user:42', fetcher)),
  );
  return dbCallCount;
}

simulateBuggy(20).then(n => console.log('Buggy: 20 concurrent stale hits ->', n, 'DB calls'));
simulateFixed(20).then(n => console.log('Fixed: 20 concurrent stale hits ->', n, 'DB call'));
// Buggy: 20 concurrent stale hits -> 20 DB calls
// Fixed: 20 concurrent stale hits -> 1 DB call`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The fixed <code>refreshInBackground</code> uses a 10-second lock TTL as a crash-safety net (in case the process refreshing the cache dies before releasing the lock). Suppose the lock TTL were set to 10 <em>milliseconds</em> instead, and <code>fetcher()</code> genuinely takes 200ms to complete. What would happen to the stampede-prevention guarantee?',
    hint: 'The lock is only held for as long as its TTL says, regardless of whether the work it is protecting has actually finished.',
    solution: `The lock would expire (auto-delete) after 10ms, but fetcher() would still be running for another ~190ms. Any request that checks the lock after it expires -- but before the original refresh finishes -- would see no lock, acquire a NEW one, and start a SECOND concurrent call to fetcher(). This defeats the fix entirely: the stampede would return, just with fewer duplicate calls than the fully-unlocked version (bounded by how many lock-expiry windows fit inside fetcher()'s real duration) rather than zero.

The lock TTL must always be set comfortably longer than the slowest realistic fetcher() call -- it exists purely as a safety net for a crashed process, not as the primary mechanism keeping the lock held. This is exactly why the main page's own mutex-lock example uses a 5-second TTL for a presumably-fast DB lookup, not a value close to the expected call duration.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Stale-while-revalidate already solves cache stampedes — that\'s the whole reason the page introduces it right after the mutex-lock and probabilistic-expiration techniques."',
      reality: 'SWR solves the LATENCY problem of a stampede (no request ever blocks waiting for a fresh fetch) but does nothing on its own about the DUPLICATE-WORK problem — without its own lock, it still lets every concurrent stale-hit request independently hit the database, verified above producing 20 DB calls for 20 concurrent requests.',
    },
    {
      thought: '"Adding a lock to the background refresh will make stale responses slower, since now they have to wait for a lock check."',
      reality: 'The lock only gates whether <code>fetcher()</code> runs — it never delays the RESPONSE. A request that already has a stale value returns it immediately regardless of whether it acquires the refresh lock; the lock check and the (fire-and-forget) refresh both happen after the stale value has already been returned to the caller.',
    },
  ];

  topicLabel = 'Caching Patterns';
  topicRoute = '/redis/caching-patterns';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'Implementing Read-Through in Application Code',
    route: '/redis/caching-patterns/implementing-read-through-in-application-code',
  };
}
