import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-set-repl-skipping-replication-for-throwaway-writes',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './set-repl-skipping-replication-for-throwaway-writes.html',
  styleUrl: './set-repl-skipping-replication-for-throwaway-writes.scss',
})
export class SetReplSkippingReplicationForThrowawayWritesSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A real feature the main page never mentions at all',
      points: [
        'The main page discusses effects replication (only a script\'s WRITE commands are replicated, never its source) but never mentions that a script can take fine-grained control over WHICH of its own writes actually get replicated at all.',
        'Verified directly against Redis\'s own Lua API reference: <code>redis.set_repl(mode)</code> lets a script mark subsequent write commands with one of five modes — <code>redis.REPL_ALL</code> (the default: replicate to AOF and replicas), <code>redis.REPL_AOF</code>, <code>redis.REPL_REPLICA</code>, <code>redis.REPL_SLAVE</code> (same as REPL_REPLICA, kept for backward compatibility), and <code>redis.REPL_NONE</code> (disable replication for these writes entirely).',
        'This exists specifically for scripts that compute genuinely throwaway INTERMEDIATE state — data written purely to get to a final result, never meant to be part of the persisted, replicated dataset on its own.',
      ],
    },
    {
      heading: 'The worked example, straight from Redis\'s own docs',
      points: [
        'Redis\'s own docs give this exact scenario: a script intersects two sets (<code>SUNIONSTORE</code> into a temporary key), picks five random elements from the intersection (<code>SRANDMEMBER</code>), stores just those five in a new set (<code>SADD</code>), then deletes the temporary intersection key (<code>DEL</code>) before returning.',
        'Of those four write-touching steps, only the final <code>SADD</code> represents something a replica or the AOF genuinely needs to know about — the temporary intersection and its later deletion are purely internal scaffolding the script used to compute that one real result.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The worked example, verified',
      language: 'typescript',
      code: `// Models the exact scenario from Redis's own docs: only the final SADD
// should actually be replicated -- the temp intersection and its cleanup
// are throwaway scaffolding.
class ReplicationTracker {
  private mode: 'REPL_ALL' | 'REPL_NONE' = 'REPL_ALL';
  replicatedCommands: string[] = [];

  setRepl(mode: 'REPL_ALL' | 'REPL_NONE') { this.mode = mode; }
  call(cmd: string, ...args: string[]): string {
    if (this.mode !== 'REPL_NONE') {
      this.replicatedCommands.push(\`\${cmd} \${args.join(' ')}\`);
    }
    return \`executed: \${cmd}\`;
  }
}

const redis = new ReplicationTracker();

redis.setRepl('REPL_NONE');
redis.call('SUNIONSTORE', 'tmp:intersection', 'setA', 'setB'); // throwaway
redis.call('SRANDMEMBER', 'tmp:intersection', '5');            // pure read, no write

redis.setRepl('REPL_ALL');
redis.call('SADD', 'final:picks', 'el1', 'el2', 'el3', 'el4', 'el5'); // the real result

redis.setRepl('REPL_NONE');
redis.call('DEL', 'tmp:intersection'); // cleanup, also throwaway

console.log('Commands actually replicated to AOF/replicas:', redis.replicatedCommands);
// Commands actually replicated to AOF/replicas: [ 'SADD final:picks el1 el2 el3 el4 el5' ]`,
    },
    {
      label: 'The equivalent real Lua script',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

const pickRandomIntersectionScript = \`
redis.set_repl(redis.REPL_NONE)
redis.call('SUNIONSTORE', KEYS[3], KEYS[1], KEYS[2])
local picked = redis.call('SRANDMEMBER', KEYS[3], 5)

redis.set_repl(redis.REPL_ALL)
redis.call('SADD', KEYS[4], unpack(picked))

redis.set_repl(redis.REPL_NONE)
redis.call('DEL', KEYS[3])

redis.set_repl(redis.REPL_ALL)
return picked
\`;

async function pickFiveFromIntersection(setA: string, setB: string, tmpKey: string, destKey: string) {
  return await redis.eval(pickRandomIntersectionScript, 4, setA, setB, tmpKey, destKey);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A script calls <code>redis.set_repl(redis.REPL_NONE)</code>, then <code>redis.call(\'SET\', KEYS[1], \'temp-value\')</code>, and NEVER calls <code>redis.set_repl(redis.REPL_ALL)</code> again before the script ends. What happens to a write issued by the NEXT, completely separate EVAL call on the same connection?',
    hint: 'Does redis.set_repl() persist ACROSS separate script executions, or does it reset at the start of every new script?',
    solution: `Nothing unexpected happens to it -- the next script starts fresh. Per Redis's own docs: "the scripting engine is initialized to the redis.REPL_ALL setting when a script begins its execution." Every new EVAL/EVALSHA call starts back at REPL_ALL regardless of what the PREVIOUS script's own calls to redis.set_repl() left it at.

This matters because it means redis.set_repl() is scoped entirely to a single script's own execution -- there is no risk of a forgotten "set back to REPL_ALL" call at the end of one script silently disabling replication for an unrelated script that happens to run afterward on the same connection. The safety net is automatic, not something the script author has to remember to restore themselves (though restoring it partway THROUGH a single script, as the worked example does, is still the caller's own responsibility).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"redis.set_repl(redis.REPL_NONE) means the write never actually happens on the primary — it\'s purely a local, in-memory operation."',
      reality: 'It still runs and takes effect on the PRIMARY exactly like any other write — REPL_NONE only controls whether that write is also sent onward to the AOF file and/or replicas. The primary\'s own dataset is affected identically either way.',
    },
    {
      thought: '"Since REPL_NONE writes never reach the replicas, a replica\'s copy of the data will be permanently missing the temporary intersection key the script created."',
      reality: 'That is exactly the intended, harmless outcome — the temporary key was only ever meant to exist transiently on the primary to compute the final result. The replica never needing to store or clean up that scaffolding key is the whole point of marking it REPL_NONE in the first place.',
    },
  ];

  topicLabel = 'Lua Scripting';
  topicRoute = '/redis/lua-scripting';
  prev: SubtopicLink | null = {
    label: 'Since Redis 7.0, Scripts No Longer Need to Be Deterministic',
    route: '/redis/lua-scripting/scripts-no-longer-need-to-be-deterministic',
  };
  next: SubtopicLink | null = null;
}
