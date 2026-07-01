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
    {
      heading: 'MULTI/EXEC Transactions and Optimistic Locking with WATCH',
      points: [
        'MULTI begins queuing subsequent commands rather than executing them immediately; EXEC then executes the entire queued batch atomically as a single unit — no other client\'s commands can interleave between the queued commands during execution, though Redis transactions do not support rolling back individual commands within the batch.',
        'Redis transactions differ from traditional ACID database transactions in an important way — if a queued command has a runtime error (like calling a list operation on a string key), the transaction still executes and other commands in the batch still run; only commands with syntax errors detected at queue time abort the entire transaction before EXEC.',
        'WATCH implements optimistic locking — watching a key before MULTI causes the subsequent EXEC to fail (returning nil) if the watched key was modified by another client between the WATCH and the EXEC, letting the application detect the conflict and retry rather than silently proceeding with stale assumptions.',
        'The WATCH/MULTI/EXEC pattern is commonly used to implement compare-and-swap style logic — read a value, decide on an update based on that value, WATCH the key, then MULTI/EXEC the update, retrying the entire sequence if EXEC indicates the value changed concurrently.',
      ],
    },
    {
      heading: 'When to Use Transactions vs Lua Scripts for Atomicity',
      points: [
        'MULTI/EXEC transactions are appropriate for straightforward batches of commands that do not depend on intermediate results — queuing several independent SET operations to execute together atomically, for example.',
        'Lua scripts are necessary when the atomic operation requires CONDITIONAL logic based on intermediate results — a transaction cannot read a value and then decide what to do based on that value within the same atomic unit, since all transaction commands are queued blindly before any of them execute; Lua scripts can freely read, branch, and write within one atomic script execution.',
        'DISCARD aborts a transaction that has been started with MULTI but not yet executed, clearing the queued commands without running any of them — useful for handling client-side logic errors detected after MULTI but before EXEC, without leaving a half-formed transaction pending.',
        'For genuinely complex atomic multi-step logic, Lua scripting is generally the more powerful and flexible tool — MULTI/EXEC transactions remain valuable for their simplicity when the use case is a straightforward "run these N commands together as one unit" without conditional branching.',
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
    {
      q: 'What does WATCH do in a Redis transaction?',
      options: ['Monitors transaction execution time', 'Marks keys for optimistic locking — if any watched key changes before EXEC, the transaction is aborted', 'Watches the AOF file for changes', 'Enables transaction logging'],
      answer: 1,
      explanation: 'WATCH key1 key2... marks keys for optimistic locking. If any watched key is modified between WATCH and EXEC, EXEC returns nil (aborts). Client must retry. Use for check-and-set (CAS) operations without pessimistic locks.',
    },
    {
      q: 'What happens if a command in a MULTI/EXEC block fails at execution time?',
      options: ['The entire transaction is rolled back', 'Only the failed command is rejected; other commands in the block still execute', 'Redis rolls back all commands after the failure', 'EXEC returns an error and aborts all commands'],
      answer: 1,
      explanation: 'Redis transactions do NOT have rollback. If a command fails during EXEC (e.g., INCR on a string), other commands still execute. Only syntax errors (queued before EXEC) abort the entire transaction. This is a key difference from SQL transactions.',
    },
    {
      q: 'What does DISCARD do in a Redis transaction?',
      options: ['Discards all keys in the transaction', 'Cancels the queued transaction, flushing the command queue and unwatching all watched keys', 'Rollbacks completed commands', 'Disconnects from Redis'],
      answer: 1,
      explanation: 'DISCARD abandons the current MULTI block, discarding all queued commands and unwatching WATCH keys. Use it when your application detects it cannot proceed with the transaction (e.g., business logic check fails after MULTI).',
    },
    {
      q: 'Can you use Redis MULTI/EXEC inside a Lua script?',
      options: ['Yes, Lua fully supports MULTI/EXEC', 'No, Lua scripts are already atomic — MULTI/EXEC is not allowed inside Lua', 'Yes, but only in cluster mode', 'Only MULTI is allowed; EXEC is implicit at script end'],
      answer: 1,
      explanation: 'Lua scripts are inherently atomic in Redis — using MULTI/EXEC inside a Lua script is redundant and not allowed. Use redis.call(). For the same atomicity reason, you also cannot use WATCH inside Lua scripts.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Can I use conditional logic inside a MULTI/EXEC transaction?',
      a: 'No — commands inside MULTI are queued and executed later, so you cannot read a value mid-transaction and branch on it. Use WATCH for optimistic CAS patterns or Lua scripts (EVAL) for richer conditional logic within a single atomic operation.',
    },
    {
      q: 'How does WATCH implement optimistic locking in Redis?',
      a: 'WATCH key1 key2... marks keys to monitor. If any watched key is modified before EXEC is called (by any client), EXEC returns nil (transaction aborted) instead of executing commands. Pattern: WATCH key, GET key, compute new value, MULTI, SET key newvalue, EXEC — retry loop if EXEC returns nil. CAS (check-and-set) without locks.',
    },
    {
      q: 'Why does Redis MULTI not support rollback?',
      a: 'Redis transactions do not support rollback because: (1) command errors (wrong type) indicate programmer bugs, not runtime conditions; (2) rollback would sacrifice performance (Redis is optimised for simplicity and speed). If a command in MULTI/EXEC fails, other commands still execute. Only syntax errors at queue time abort the whole transaction.',
    },
    {
      q: 'What is the DISCARD command?',
      a: 'DISCARD aborts a MULTI/EXEC transaction — flushes the queued commands and exits transaction mode. Also unWATCHes all watched keys. Use when you detect a condition mid-queue that means the transaction should not proceed. After DISCARD, the connection returns to normal command mode.',
    },
    {
      q: 'How does Lua scripting compare to MULTI/EXEC for atomic operations?',
      a: 'Both are atomic. <strong>MULTI/EXEC</strong>: queues commands, executes atomically — but no conditional logic (cannot branch on intermediate values during execution). <strong>Lua</strong>: full scripting — can read a value, compute, and conditionally write, all atomically. Use Lua when you need if/else or loops across commands. Lua has higher complexity but more power.',
    },
    {
      q: 'What happens to a MULTI/EXEC transaction if a command has a syntax error?',
      a: 'If a command has a <strong>syntax error at queue time</strong> (e.g., wrong number of args), Redis returns an error immediately and the entire transaction is aborted on EXEC — no commands execute. If a command has a <strong>runtime error</strong> (e.g., wrong type at execution time), other commands in the queue still run — partial execution. This differs from SQL transactions.',
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
