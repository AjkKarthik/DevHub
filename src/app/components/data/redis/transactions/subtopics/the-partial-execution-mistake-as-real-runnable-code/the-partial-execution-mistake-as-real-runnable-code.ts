import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-the-partial-execution-mistake-as-real-runnable-code',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-partial-execution-mistake-as-real-runnable-code.html',
  styleUrl: './the-partial-execution-mistake-as-real-runnable-code.scss',
})
export class ThePartialExecutionMistakeAsRealRunnableCodeSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'What the main page shows vs. what a client library actually returns',
      points: [
        'The main page\'s own first mistake block illustrates the "no rollback" behavior with raw Redis CLI-style pseudocode — <code>MULTI / SET counter "not-a-number" / INCR counter / SET flag "done" / EXEC</code> — with a comment saying "flag IS still set; only INCR fails." This is accurate, but it is not something a reader can paste into a real codebase and run.',
        'ioredis (the client library used throughout every other codeTab on this page) represents a MULTI/EXEC result as <code>Array&lt;[Error | null, result]&gt;</code> — one tuple per queued command, checked and confirmed against ioredis\'s own documented reply shape.',
        'Verified via direct execution of a model reproducing that exact reply shape: the failing INCR\'s own tuple carries the error object in its FIRST slot with <code>null</code> in the second; every OTHER command\'s tuple carries <code>null</code> in the first slot and its real result in the second — in the SAME array, at the SAME positions they were queued in.',
      ],
    },
    {
      heading: 'The one thing the pseudocode leaves ambiguous that real code cannot',
      points: [
        'The CLI-style pseudocode never has to answer: does the reply array even HAVE an entry for the failing command, or is it simply skipped? Verified via the reply-shape model: it HAS an entry — position 2 of 3 — it is simply an entry whose result is an error rather than a value. The array length always equals the number of queued commands, success or failure.',
        'This matters for real code: a caller who writes <code>results.map(([err, res]) => res)</code> without checking <code>err</code> first will happily "succeed" with a mix of real values and <code>null</code> placeholders where a command actually failed — the array shape alone gives no visual warning that something went wrong.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The mistake block, made runnable',
      language: 'typescript',
      code: `// Models ioredis's own documented .exec() reply shape:
// Array<[Error | null, result]>, one tuple per queued command.
class FakeRedis {
  private store = new Map<string, string>();
  set(key: string, val: string) { this.store.set(key, String(val)); return 'OK'; }
  get(key: string): string | null { return this.store.get(key) ?? null; }
  incr(key: string): number {
    const val = this.store.get(key);
    const n = Number(val);
    if (val !== undefined && !Number.isInteger(n)) {
      throw new Error('ERR value is not an integer or out of range');
    }
    const next = (n || 0) + 1;
    this.store.set(key, String(next));
    return next;
  }
}

function multiExec(redis: FakeRedis, commands: [string, ...unknown[]][]): [Error | null, unknown][] {
  return commands.map(([op, ...args]) => {
    try {
      // @ts-expect-error -- simplified dynamic dispatch for demonstration
      const result = redis[op](...args);
      return [null, result];
    } catch (err) {
      return [err as Error, null];
    }
  });
}

const redis = new FakeRedis();
const results = multiExec(redis, [
  ['set', 'counter', 'not-a-number'],
  ['incr', 'counter'],          // runtime error: not an integer
  ['set', 'flag', 'done'],
]);

console.log(results.map(([err, res]) => err ? [err.message, null] : [null, res]));
console.log('flag after EXEC:', redis.get('flag'));
console.log('counter after EXEC (unchanged, INCR never applied):', redis.get('counter'));
// [ [ null, 'OK' ], [ 'ERR value is not an integer or out of range', null ], [ null, 'OK' ] ]
// flag after EXEC: done
// counter after EXEC (unchanged, INCR never applied): not-a-number`,
    },
    {
      label: 'The unsafe way to consume the result',
      language: 'typescript',
      code: `// A caller that forgets to check err per-tuple:
const values = results.map(([_err, res]) => res);
console.log(values);
// [ 'OK', null, 'OK' ]
//
// The SECOND entry is silently null -- indistinguishable, by looking at "values"
// alone, from a command that legitimately returned null (e.g. GET on a missing key).
// The error message ("ERR value is not an integer...") is gone the moment you
// discard err without checking it first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given the verified reply shape <code>[Error | null, result][]</code>, write the condition a caller should check to detect that AT LEAST ONE queued command failed at runtime, without needing to know in advance which position it might be at.',
    hint: 'You need to look across every tuple in the array, not just check whether the whole array itself is null (that only detects a WATCH conflict, a completely different failure mode covered elsewhere on this page).',
    solution: `results.some(([err]) => err !== null)

This checks every tuple's own error slot, regardless of how many commands were queued or which position the failure landed at. It is a genuinely different check from "results === null" (which only detects the WATCH-conflict case, where EXEC itself returns null and the array of tuples never exists at all) -- a transaction can return a real, non-null array of tuples and STILL contain one or more per-command runtime failures inside it. Checking both is necessary for a caller that wants to reliably detect every failure mode this page describes: (1) results === null means WATCH detected a conflict, nothing ran; (2) results.some(([err]) => err) means EXEC ran everything, but at least one queued command failed at runtime.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"If EXEC returns a non-null array, every queued command inside it succeeded."',
      reality: 'Verified above: a non-null array only means the transaction was not aborted by a WATCH conflict. Individual commands inside that array can still have failed at runtime — each tuple\'s own first slot must be checked to know for sure.',
    },
    {
      thought: '"A failed command inside a MULTI/EXEC block leaves a gap in the results array — you can tell something failed just by counting entries."',
      reality: 'Verified above: the array length always equals the number of queued commands, whether they succeeded or failed. A failed command still occupies its own position — it just carries an error object instead of a value there.',
    },
  ];

  topicLabel = 'Transactions (MULTI/EXEC)';
  topicRoute = '/redis/transactions';
  prev: SubtopicLink | null = {
    label: 'WATCH Inside MULTI Is Not Allowed',
    route: '/redis/transactions/watch-inside-multi-is-not-allowed',
  };
  next: SubtopicLink | null = null;
}
