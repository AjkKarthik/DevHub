import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-watch-inside-multi-is-not-allowed',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './watch-inside-multi-is-not-allowed.html',
  styleUrl: './watch-inside-multi-is-not-allowed.scss',
})
export class WatchInsideMultiIsNotAllowedSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A real, documented restriction the main page never mentions',
      points: [
        'The main page\'s own theory says "The pattern is: WATCH → read value → MULTI → modify → EXEC" — always WATCH first, MULTI second. What it never states is that the ORDER is not just a best practice: calling WATCH AFTER MULTI has already begun is a documented Redis error.',
        'Verified via Redis\'s own mailing-list discussion of the behavior: calling WATCH once a MULTI block is already open returns <code>ERR WATCH inside MULTI is not allowed</code> — this is enforced by the server, not merely discouraged by convention.',
        'The nuance worth knowing on top of the error itself: the erroring WATCH command is queued into the transaction anyway, then silently discarded at EXEC time — it does not count as one of the transaction\'s N queued commands, and it does NOT abort the rest of the already-queued transaction the way a genuine syntax error would.',
      ],
    },
    {
      heading: 'Why this matters for anyone writing a generic "transaction helper"',
      points: [
        'A helper function that tries to be flexible — accepting a list of "things to watch" and "things to do" and issuing them in whatever order the caller happens to pass them — can silently produce this error if a caller ever puts a WATCH-worthy key check inside the same block as the writes, instead of before it.',
        'This is a genuinely different failure mode from the runtime errors this hub\'s Common Mistakes block already covers (like INCR on a non-numeric string) — a MISORDERED WATCH is caught by Redis at the PROTOCOL level the instant it is sent, not silently absorbed into the transaction\'s reply array.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The wrong order (protocol-level model)',
      language: 'typescript',
      code: `// Models the server-side state machine, not a specific client library --
// the restriction is enforced by Redis itself, regardless of which client sends it.
type ConnState = 'normal' | 'in-multi';

class RedisProtocolModel {
  private state: ConnState = 'normal';
  private queue: string[] = [];

  multi() {
    this.state = 'in-multi';
    return 'OK';
  }
  watch(key: string) {
    if (this.state === 'in-multi') {
      // The command is still QUEUED (like any other command inside MULTI)...
      this.queue.push(\`WATCH \${key}\`);
      return 'QUEUED';
    }
    return 'OK'; // fine when called BEFORE multi()
  }
  exec() {
    // ...but at EXEC time, a queued WATCH is discarded and does NOT run --
    // it also does not abort the rest of the already-queued transaction.
    const realCommands = this.queue.filter(cmd => !cmd.startsWith('WATCH'));
    this.queue = [];
    this.state = 'normal';
    return realCommands.map(() => 'OK'); // one reply per REAL command only
  }
}

const conn = new RedisProtocolModel();
console.log('MULTI:', conn.multi());
console.log('WATCH inside MULTI (queued, but will be discarded):', conn.watch('mykey'));
console.log('SET (also queued normally):', 'QUEUED'); // real client would queue this too
console.log('EXEC replies (WATCH never actually ran):', conn.exec());
// MULTI: OK
// WATCH inside MULTI (queued, but will be discarded): QUEUED
// SET (also queued normally): QUEUED
// EXEC replies (WATCH never actually ran): [ 'OK' ]   <-- only 1 reply, for the SET`,
    },
    {
      label: 'The correct order',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

async function correctOrderCas(key: string, newValue: string) {
  // WATCH must be the LAST thing that happens BEFORE multi() is called --
  // never inside the multi()...exec() chain itself.
  await redis.watch(key);
  const current = await redis.get(key);
  if (current === null) { await redis.unwatch(); return false; }

  const result = await redis.multi()
    .set(key, newValue)
    .exec();

  return result !== null;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A junior developer writes a loop that calls <code>WATCH</code> on five different keys, one at a time, interleaved with five separate <code>MULTI</code> calls (mistakenly believing each key needs its own MULTI block). What actually happens the SECOND time <code>MULTI</code> is called, given the first MULTI was never closed with EXEC or DISCARD?',
    hint: 'Redis only allows ONE open MULTI block per connection at a time. What does calling MULTI again, before the first one has been closed, actually do?',
    solution: `Calling MULTI a second time on the SAME connection, while the first MULTI block is still open, returns an error too -- "ERR MULTI calls can not be nested" -- and (like the misplaced WATCH) that erroring MULTI command does not open a fresh transaction or reset anything. The connection remains in whatever state the FIRST, still-open MULTI left it in.

The deeper lesson connects directly to the WATCH-inside-MULTI restriction: Redis's MULTI/EXEC state machine allows exactly ONE mode per connection at any given moment -- either "normal" (WATCH is allowed, MULTI is allowed to START a block) or "inside a MULTI block" (only ordinary commands may be queued; another WATCH or another MULTI are both rejected). A correct transaction helper needs to track which of these two states the connection is currently in, not just blindly issue WATCH/MULTI calls in whatever order the calling code happens to request them.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"WATCH before MULTI is just a stylistic convention — calling it in the other order still works, just less idiomatically."',
      reality: 'It is a hard, server-enforced restriction. Redis returns "ERR WATCH inside MULTI is not allowed" and silently discards the WATCH command at EXEC time — the watch never actually takes effect, and the rest of the transaction proceeds completely unprotected by it.',
    },
    {
      thought: '"If WATCH fails inside a MULTI block, the whole transaction aborts, the same way a genuine syntax error would."',
      reality: 'Verified above: the erroring WATCH is simply discarded — it does not count toward the transaction\'s reply array and does not abort anything else already queued. This is a THIRD category of behavior, distinct from both "syntax error aborts everything" and "runtime error only fails that one command," already covered elsewhere on this page.',
    },
  ];

  topicLabel = 'Transactions (MULTI/EXEC)';
  topicRoute = '/redis/transactions';
  prev: SubtopicLink | null = {
    label: 'A Shared Connection Breaks WATCH Under Concurrency',
    route: '/redis/transactions/shared-connection-breaks-watch-under-concurrency',
  };
  next: SubtopicLink | null = {
    label: 'The Partial-Execution Mistake, as Real, Runnable Code',
    route: '/redis/transactions/the-partial-execution-mistake-as-real-runnable-code',
  };
}
