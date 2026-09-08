import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'What "Atomic, Unlike Pipelining" Actually Means',
    points: [
      'The main page\'s own quiz calls pipelining "not atomic, unlike MULTI/EXEC" — accurate, but easy to misread as "MULTI/EXEC rolls back if one of its commands fails." Verified against Redis\'s own documented transaction semantics: it does not. If a command fails at RUNTIME partway through a MULTI/EXEC block (e.g. an INCR on a non-numeric value), Redis still executes every OTHER queued command — there is no rollback of the ones that already succeeded.',
      'What MULTI/EXEC genuinely guarantees is ISOLATION: once EXEC starts, no OTHER client\'s command can be interleaved between the queued commands — they run back-to-back as a single block from every other client\'s point of view. Pipelining offers no such guarantee — another client\'s command CAN be interleaved between two pipelined commands, even though the client sent them together in one network write.',
      'The one case MULTI/EXEC genuinely aborts entirely is a SYNTAX/queueing-time error (e.g. a typo\'d command name) detected while queueing commands, before EXEC ever runs — that class of error does discard the whole transaction. A runtime error inside an otherwise-valid command is a completely different case, and does not.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'No Rollback on a Runtime Error',
    language: 'typescript',
    code: `// Pure-JS model of Redis's own documented MULTI/EXEC behaviour:
// queued commands ALL run -- no rollback on a runtime error -- but no
// OTHER client's command can interleave between them (isolation).
interface Store { counter: string | number; name: string; city?: string; }

function runMultiExec(store: Store, commands: ((s: Store) => unknown)[]) {
  const results: { ok: boolean; value?: unknown; error?: string }[] = [];
  for (const cmd of commands) {
    try {
      results.push({ ok: true, value: cmd(store) });
    } catch (err) {
      results.push({ ok: false, error: (err as Error).message });
      // Redis does NOT stop or roll back here -- it moves on to the next command.
    }
  }
  return results;
}

const store: Store = { counter: 'not-a-number', name: 'Alice' };

const results = runMultiExec(store, [
  (s) => { s.name = 'Bob'; return s.name; },                 // SET -- succeeds
  (s) => {                                                    // INCR -- fails at runtime
    if (typeof s.counter !== 'number') throw new Error('WRONGTYPE');
    return ++s.counter;
  },
  (s) => { s.city = 'NYC'; return s.city; },                 // SET -- still runs, despite #2 failing
]);

console.log('Results:', JSON.stringify(results));
console.log('Final store:', JSON.stringify(store));
// -> Results: [{"ok":true,...},{"ok":false,"error":"WRONGTYPE"},{"ok":true,...}]
// -> Final store: {"counter":"not-a-number","name":"Bob","city":"NYC"}
// Command 1 and 3 BOTH succeeded and their effects are visible, even
// though command 2 failed -- MULTI/EXEC never rolled anything back.

// The real ioredis equivalent, using .multi() (queues, then runs
// atomically w.r.t. other clients -- not w.r.t. its own errors):
import Redis from 'ioredis';
const redis = new Redis();
const [setResult, incrResult, cityResult] = await redis
  .multi()
  .set('name', 'Bob')
  .incr('counter')   // fails at runtime if 'counter' currently holds a non-numeric string
  .set('city', 'NYC')
  .exec();
// Each result is its own [err, value] tuple -- one command's error
// does not prevent the others from running or being reflected here.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Two clients, A and B, both run a MULTI/EXEC block at roughly the same time on the same key. Using the ISOLATION guarantee (not the no-rollback behaviour) verified above, can client B\'s commands run in between two of client A\'s queued commands?',
  hint: 'This is specifically about the guarantee MULTI/EXEC DOES provide, not the one it doesn\'t.',
  solution: `// No -- this is exactly what MULTI/EXEC's isolation guarantee
// prevents. Once client A's EXEC begins, Redis runs every one of its
// queued commands back-to-back with no other client's command
// interleaved in between -- from client B's perspective, client A's
// entire transaction appears to happen as a single, indivisible
// event.
//
// This is the real "atomic" MULTI/EXEC provides that a pipeline does
// NOT: pipelining sends multiple commands in one network write for
// efficiency, but Redis is still free to interleave a DIFFERENT
// client's command between two pipelined commands from the same
// pipeline, since pipelining carries no isolation guarantee at all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page\'s own quiz statement "pipelining is not atomic, unlike MULTI/EXEC" means MULTI/EXEC rolls back all its queued commands if any single one of them fails.',
    reality: 'Verified against Redis\'s own documented transaction semantics: MULTI/EXEC never rolls back a RUNTIME error in one of its queued commands — every other queued command still executes. The "atomic" guarantee it actually provides is ISOLATION from other clients\' commands, a completely different property from all-or-nothing rollback.',
  },
  {
    thought: 'Since MULTI/EXEC doesn\'t roll back on error, it provides essentially the same guarantees as pipelining and the "atomic" label in the main page\'s quiz is misleading marketing.',
    reality: 'They provide genuinely DIFFERENT guarantees, just not the one commonly assumed. MULTI/EXEC\'s real isolation guarantee (no other client\'s commands can interleave mid-transaction) is something pipelining explicitly does NOT provide — this is a real, meaningful distinction between the two, just not "rollback vs. no rollback."',
  },
];

@Component({
  selector: 'app-redis-fund-multi-exec-atomicity',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './multi-exec-real-atomicity-is-isolation-not-rollback.html',
  styleUrl: './multi-exec-real-atomicity-is-isolation-not-rollback.scss',
})
export class MultiExecRealAtomicityIsIsolationNotRollbackSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
