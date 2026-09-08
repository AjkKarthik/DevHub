import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-shared-connection-breaks-watch-under-concurrency',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './shared-connection-breaks-watch-under-concurrency.html',
  styleUrl: './shared-connection-breaks-watch-under-concurrency.scss',
})
export class SharedConnectionBreaksWatchUnderConcurrencySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The bug the main page\'s own examples originally committed',
      points: [
        'The main page\'s own third mistake block explains it precisely: "WATCH state is per-connection. If multiple concurrent requests share the same connection, their WATCH states will interfere." — but the "WATCH / CAS" codeTab and the Atomic Inventory Decrement Challenge both called <code>redis.watch(key)</code> directly on the SAME module-level, shared <code>const redis = new Redis()</code> instance.',
        'A single connection\'s watch set is a single accumulating collection of keys — it is not scoped per logical operation, per function call, or per HTTP request. Two concurrent callers sharing one connection add their watched keys to the SAME set.',
        'The moment EITHER caller\'s EXEC (or DISCARD, or UNWATCH) runs, Redis clears the ENTIRE watch set for that connection — including keys the OTHER caller is still relying on to detect a conflict.',
      ],
    },
    {
      heading: 'Two different failure shapes, one worse than the other',
      points: [
        'Verified via direct simulation: an unrelated concurrent transaction sharing the connection can suffer a FALSE ABORT — its own EXEC incorrectly returns null because it now shares the watch set with a completely different operation\'s watched key, which changed for unrelated reasons.',
        'The more dangerous failure, also verified: a transaction whose OWN watched key genuinely changed underneath it can still return a SUCCESSFUL EXEC — because a different concurrent caller\'s EXEC already cleared the shared watch set moments earlier. This is a silent correctness bug, not a visible error: the caller believes its compare-and-swap succeeded when the value it read is already stale.',
        'A false abort just costs an unnecessary retry. A false success corrupts data silently — exactly the failure mode a CAS mechanism exists to prevent.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the interference',
      language: 'typescript',
      code: `// Models the real per-connection semantics: WATCH accumulates keys on the
// connection; the NEXT EXEC/DISCARD/UNWATCH on THAT connection clears ALL of them.
class SharedConnection {
  private data = new Map<string, string>();
  private watchedKeys = new Set<string>();
  private watchedSnapshot = new Map<string, string | undefined>();

  get(key: string) { return this.data.get(key) ?? null; }
  set(key: string, val: string) { this.data.set(key, val); } // another client's write
  watch(key: string) {
    this.watchedKeys.add(key);
    this.watchedSnapshot.set(key, this.data.get(key));
  }
  multiExec(writeFn: () => void): 'OK' | null {
    for (const key of this.watchedKeys) {
      if (this.data.get(key) !== this.watchedSnapshot.get(key)) {
        this.watchedKeys.clear();
        this.watchedSnapshot.clear();
        return null; // conflict correctly detected
      }
    }
    writeFn();
    this.watchedKeys.clear(); // clears EVERY watched key on this connection, not just this caller's
    this.watchedSnapshot.clear();
    return 'OK';
  }
}

const conn = new SharedConnection();
conn.set('inventory:item1', '10');

// Request A watches item1, reads stock=10, plans to reserve 3.
conn.watch('inventory:item1');
const stockA = parseInt(conn.get('inventory:item1')!, 10);

// Concurrently, another process changes item1's real value.
conn.set('inventory:item1', '999');

// Request B watches a DIFFERENT key on the SAME shared connection, then EXECs first.
conn.watch('inventory:other-key');
const resultB = conn.multiExec(() => conn.set('inventory:other-key', 'updated-by-B'));
console.log('Request B result (own key untouched, should succeed):', resultB);

// Request A now EXECs its own reservation -- but B's EXEC already cleared the
// WHOLE connection's watch set, including A's watch on item1.
const resultA = conn.multiExec(() => conn.set('inventory:item1', String(stockA - 3)));
console.log('Request A result (item1 changed underneath it, should be null):', resultA);
console.log('Final inventory:item1:', conn.get('inventory:item1'));
// Request B result (own key untouched, should succeed): null        <- false abort
// Request A result (item1 changed underneath it, should be null): OK <- false success
// Final inventory:item1: 7   <- stockA(10) - 3, silently overwriting the real value 999`,
    },
    {
      label: 'The fix: redis.duplicate() per call',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

async function reserveItem(itemId: string, qty: number): Promise<boolean> {
  const key = \`inventory:\${itemId}\`;
  // A dedicated connection per call -- its watch set can never be touched by any
  // OTHER concurrent caller's own EXEC/DISCARD/UNWATCH.
  const conn = redis.duplicate();
  try {
    for (let i = 0; i < 3; i++) {
      await conn.watch(key);
      const stock = parseInt(await conn.get(key) ?? '0', 10);
      if (stock < qty) { await conn.unwatch(); return false; }
      const result = await conn.multi().decrby(key, qty).exec();
      if (result !== null) return true;
      await new Promise(r => setTimeout(r, 10 * (i + 1)));
    }
    return false;
  } finally {
    conn.disconnect();
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate suggests a cheaper fix: instead of a new connection per call, keep ONE dedicated connection per HTTP request (created once when the request starts, reused for every WATCH-based operation during that request, disconnected when the request finishes). Does this avoid the interference bug?',
    hint: 'The bug happens when TWO DIFFERENT logical operations share a connection at the same time. Does "per-request" change how many logical operations can be concurrently active on one connection?',
    solution: `Yes -- as long as a single HTTP request never runs two WATCH-based operations on the SAME connection AT THE SAME TIME. The root cause isn't "reusing a connection across TIME", it's "two logical operations sharing a connection's watch set SIMULTANEOUSLY". A connection created once per request and used sequentially within that request has only ever one watch cycle active on it at once, which is safe.

The risk reappears the moment a single request kicks off two WATCH-based operations concurrently (e.g. via Promise.all on the SAME per-request connection) -- that reintroduces exactly the shared-watch-set interference demonstrated above, just scoped to one request's own two concurrent sub-operations instead of two different requests. The safe rule is really "one connection per concurrently-active WATCH cycle", not literally "one connection per request" -- per-call duplication (as the fix does) is the simplest way to guarantee that without having to reason about what else might run concurrently on the same connection.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If a shared connection\'s WATCH interferes with a concurrent transaction, Redis will at least return an error I can detect and handle."',
      reality: 'Verified above: the WORSE outcome is a SILENT SUCCESS -- a transaction\'s EXEC returns OK even though the value it read has already changed, because a different concurrent caller\'s own EXEC cleared the shared watch set first. There is no error to catch; the caller has no way to tell its compare-and-swap actually succeeded correctly.',
    },
    {
      thought: '"This only matters at very high concurrency — a typical web app rarely has two requests hitting the exact same connection\'s WATCH at once."',
      reality: 'A single shared, module-level Redis client instance (exactly the pattern shown in the ORIGINAL version of this hub\'s own WATCH/CAS example) is used by every concurrent request in a typical Node.js server by default — this is not a rare edge case, it is the default shape of a naive implementation under any real production traffic.',
    },
  ];

  topicLabel = 'Transactions (MULTI/EXEC)';
  topicRoute = '/redis/transactions';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'WATCH Inside MULTI Is Not Allowed',
    route: '/redis/transactions/watch-inside-multi-is-not-allowed',
  };
}
