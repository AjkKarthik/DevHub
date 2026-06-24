import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-redis-transactions',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
            RevisionCardComponent, PageCompleteComponent],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss',
})
export class RedisTransactions {
  quickRef: QuickRefItem[] = [
    { name: 'MULTI', type: 'keyword', desc: 'Begin a transaction block — queue subsequent commands' },
    { name: 'EXEC', type: 'keyword', desc: 'Execute all queued commands atomically; returns array of replies' },
    { name: 'DISCARD', type: 'keyword', desc: 'Discard the queued transaction and exit MULTI block' },
    { name: 'WATCH key [key...]', type: 'keyword', desc: 'Optimistic lock — EXEC returns nil if any watched key changed' },
    { name: 'UNWATCH', type: 'keyword', desc: 'Cancel all watches (called automatically after EXEC/DISCARD)' },
    { name: 'QUEUED', type: 'keyword', desc: 'Reply returned for each command queued inside MULTI block' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'MULTI / EXEC — Batched Atomicity',
      points: [
        'MULTI marks the start of a transaction. Every command sent afterwards is queued (Redis replies QUEUED) and not executed immediately.',
        'EXEC executes all queued commands atomically — no other client can interleave commands between them. Redis returns an array of replies, one per queued command.',
        'DISCARD empties the queue and exits the transaction, returning to normal operation.',
        'Redis transactions are NOT rollback-capable. If one command in the queue fails at execution time (e.g. INCR on a string value), the others still run. Only syntax errors at queue time abort the entire transaction.',
        'Pipeline + MULTI: most client libraries pipeline the MULTI…EXEC block in a single network round-trip for efficiency.',
      ],
    },
    {
      heading: 'WATCH — Optimistic Locking (Check-Then-Set)',
      points: [
        'WATCH key sets an optimistic lock. If any watched key is modified by another client between WATCH and EXEC, the transaction is aborted — EXEC returns nil instead of an array.',
        'The pattern is: WATCH → read value → MULTI → modify → EXEC. If nil is returned, retry the entire cycle.',
        'WATCH is automatically cleared after EXEC (whether it aborts or succeeds) and after DISCARD. Call UNWATCH to cancel all watches manually.',
        'WATCH enables CAS (Compare-And-Swap) patterns without server-side locking, unlike traditional database locks that hold across round trips.',
        'Retry loops must include a back-off strategy under heavy contention; otherwise, thundering-herd effects can starve all clients simultaneously.',
      ],
    },
    {
      heading: 'Transactions vs Lua Scripts',
      points: [
        'Lua scripts (EVAL) are also atomic and can embed conditional logic inside the script — something MULTI/EXEC cannot do since commands are queued blind.',
        'MULTI/EXEC is simpler and widely supported. Lua is more powerful but adds scripting overhead and is harder to debug.',
        'For simple "do these N commands atomically", MULTI/EXEC is sufficient. For "read a value and conditionally write based on it in one roundtrip", use Lua.',
        'Redis pipelines (not transactions) send multiple commands in bulk but do NOT guarantee atomicity — they only reduce round-trip latency.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MULTI/EXEC',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Basic transaction
async function transferPoints(fromUser: string, toUser: string, points: number) {
  const pipeline = redis.multi();
  pipeline.decrby(\`user:\${fromUser}:points\`, points);
  pipeline.incrby(\`user:\${toUser}:points\`, points);
  pipeline.set(\`transfer:log:\${Date.now()}\`, JSON.stringify({ from: fromUser, to: toUser, points }), 'EX', 86400);
  const results = await pipeline.exec();
  // results: [[null, newFrom], [null, newTo], [null, 'OK']]
  if (!results) throw new Error('Transaction aborted');
  return results;
}`,
    },
    {
      label: 'WATCH / CAS',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Optimistic locking: increment only if below limit
async function incrementWithLimit(key: string, limit: number): Promise<number | null> {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await redis.watch(key);
    const current = parseInt(await redis.get(key) ?? '0', 10);
    if (current >= limit) {
      await redis.unwatch();
      return null; // limit reached
    }
    const result = await redis
      .multi()
      .set(key, current + 1)
      .exec();
    if (result !== null) return current + 1; // success
    // result === null means WATCH detected a conflict — retry
    await new Promise(r => setTimeout(r, Math.random() * 50));
  }
  throw new Error('Transaction aborted after retries');
}`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Expecting transaction rollback on runtime errors',
      wrong: `MULTI
SET counter "not-a-number"
INCR counter        ← this will error at EXEC
SET flag "done"
EXEC                ← flag IS still set; only INCR fails`,
      right: 'Use Lua scripts for conditional abort. MULTI/EXEC does not roll back on runtime command errors.',
      explanation: 'Redis transactions are "all queued, some may fail at exec time". A runtime error (wrong type, etc.) only fails that command — the rest still execute.',
    },
    {
      title: 'Using WATCH but not retrying on nil EXEC',
      wrong: `const result = await redis.multi().incr('counter').exec();
// ignoring whether result is null`,
      right: `const result = await redis.multi().incr('counter').exec();
if (result === null) { /* retry the entire WATCH → read → MULTI → EXEC cycle */ }`,
      explanation: 'When EXEC returns null after a WATCH conflict, the transaction was NOT executed. Failing to retry means silently losing the update.',
    },
    {
      title: 'Sharing a Redis connection for WATCH across concurrent requests',
      wrong: 'const shared = new Redis(); // used by all HTTP handlers concurrently',
      right: 'const perRequest = redis.duplicate(); // isolated connection for WATCH',
      explanation: 'WATCH state is per-connection. If multiple concurrent requests share the same connection, their WATCH states will interfere. Use a dedicated connection (or connection from a pool) per optimistic-lock operation.',
    },
  ];

  challenge: Challenge = {
    title: 'Atomic Inventory Decrement',
    language: 'typescript',
    description: 'Write `reserveItem(itemId, qty)` using WATCH + MULTI/EXEC that decrements the stock of an item by `qty` only if current stock >= qty. Return true on success, false if stock is insufficient. Retry up to 3 times on WATCH conflict.',
    hints: [
      'WATCH the stock key before reading its value',
      'EXEC returns null on conflict; retry from WATCH',
    ],
    starterCode: `import Redis from 'ioredis';
const redis = new Redis();

async function reserveItem(itemId: string, qty: number): Promise<boolean> {
  // implement here
}`,
    solution: `import Redis from 'ioredis';
const redis = new Redis();

async function reserveItem(itemId: string, qty: number): Promise<boolean> {
  const key = \`inventory:\${itemId}\`;
  for (let i = 0; i < 3; i++) {
    await redis.watch(key);
    const stock = parseInt(await redis.get(key) ?? '0', 10);
    if (stock < qty) { await redis.unwatch(); return false; }
    const result = await redis.multi().decrby(key, qty).exec();
    if (result !== null) return true;
    await new Promise(r => setTimeout(r, 10 * (i + 1)));
  }
  return false;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does EXEC return when a WATCHed key was modified before EXEC?',
      options: ['An empty array []', 'An error', 'null', '"ABORTED"'],
      answer: 2,
      explanation: 'EXEC returns null (nil) when any WATCHed key was modified by another client, indicating the transaction was aborted. An empty array means the MULTI block had no commands.',
    },
    {
      q: 'If command 3 of 5 queued in MULTI fails at execution time, what happens to commands 4 and 5?',
      options: ['They are skipped', 'The whole transaction rolls back', 'They still execute', 'EXEC throws an exception'],
      answer: 2,
      explanation: 'Redis does NOT roll back on runtime errors. Commands 4 and 5 still execute. Only syntax errors at queue time abort the entire transaction.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use conditional logic inside a MULTI/EXEC transaction?',
      a: 'No — commands inside MULTI are queued and executed later, so you cannot read a value mid-transaction and branch on it. Use WATCH for optimistic CAS patterns or Lua scripts (EVAL) for richer conditional logic within a single atomic operation.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'MULTI/EXEC batches commands atomically (no interleaving); WATCH adds optimistic locking (EXEC returns nil on conflict) — no rollback on runtime errors.',
    mustKnow: [
      'MULTI queues commands; EXEC runs all atomically (no interleave possible)',
      'Runtime errors in one command don\'t abort others — no rollback',
      'WATCH key: EXEC returns nil if any watched key changed → retry the whole cycle',
      'WATCH is per-connection — use isolated connections for concurrent optimistic locks',
      'MULTI/EXEC for simple atomic batches; Lua (EVAL) for conditional atomic logic',
      'Pipeline ≠ transaction: pipeline reduces round-trips but is NOT atomic',
    ],
    interviewFocus: [
      'How does WATCH implement optimistic locking?',
      'Why does Redis not roll back failed commands in a transaction?',
      'When would you use Lua over MULTI/EXEC?',
      'Why must each HTTP request use its own connection for WATCH?',
    ],
  };
}
