import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-scripts-no-longer-need-to-be-deterministic',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './scripts-no-longer-need-to-be-deterministic.html',
  styleUrl: './scripts-no-longer-need-to-be-deterministic.scss',
})
export class ScriptsNoLongerNeedToBeDeterministicSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The QnA\'s original claim was true once — not anymore',
      points: [
        'The main page\'s own QnA listed "Deterministic required (no math.random without seed)... Scripts must be deterministic for AOF/replication" as a standing limitation. Verified directly against Redis\'s own docs: this described VERBATIM script replication — sending the script\'s SOURCE CODE to replicas/AOF, which required every run to produce identical writes.',
        'Verbatim replication was replaced as the default by EFFECTS replication in Redis 5.0 (only the script\'s resulting WRITE COMMANDS are replicated, never the script text) — and as of Redis 7.0, verbatim replication was removed from Redis ENTIRELY. There is no way to opt back into the old restricted mode on a current Redis version.',
        'Per Redis\'s own Lua API reference, stated directly: "When script effects replication is enabled, the restrictions on non-deterministic functions are removed. You can, for example, use the TIME or SRANDMEMBER commands inside your scripts freely at any place. The Lua PRNG in this mode is seeded randomly on every call."',
      ],
    },
    {
      heading: 'What this actually unlocks',
      points: [
        'A script can now call <code>redis.call(\'TIME\')</code>, <code>SRANDMEMBER</code>, or use Lua\'s own <code>math.random()</code> and get a genuinely different result on every invocation — no seeding workaround, no RANDOM-command substitution trick needed.',
        'Only what the script actually WRITES gets replicated — the non-deterministic READS and any Lua-internal computation never need to match between the primary and its replicas, since replicas never re-run the script\'s logic at all under effects replication.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The old constraint vs. today\'s default',
      language: 'typescript',
      code: `// Models the historical (pre-5.0-default, removed entirely in 7.0) verbatim
// replication constraint vs. today's effects replication (default since 5.0,
// the ONLY supported mode since 7.0), per Redis's own documented rules.

function verbatimModeRandomCall(seedFixedPerReplay: number): number {
  // Under verbatim replication, the SCRIPT SOURCE is re-run on replicas/AOF
  // reload -- any "random" call had to be forced deterministic (same seed
  // every time), or the primary and replicas would silently diverge.
  return seedFixedPerReplay;
}

function effectsModeRandomCall(): number {
  // Under effects replication (default since Redis 5.0, the only mode since
  // Redis 7.0), only the WRITE COMMANDS a script issues are replicated --
  // never the script source -- so the script itself can call genuinely
  // non-deterministic functions freely.
  return Math.random();
}

console.log('Verbatim-mode call 1:', verbatimModeRandomCall(0.42));
console.log('Verbatim-mode call 2 (same seed, forced identical):', verbatimModeRandomCall(0.42));

const a = effectsModeRandomCall();
const b = effectsModeRandomCall();
console.log('Effects-mode call 1:', a);
console.log('Effects-mode call 2:', b);
console.log('Effects-mode calls differ (expected under the current default):', a !== b);
// Verbatim-mode call 1: 0.42
// Verbatim-mode call 2 (same seed, forced identical): 0.42
// Effects-mode call 1: 0.7755625406662...
// Effects-mode call 2: 0.0007783270716...
// Effects-mode calls differ (expected under the current default): true`,
    },
    {
      label: 'A real script using TIME freely',
      language: 'typescript',
      code: `import Redis from 'ioredis';
const redis = new Redis();

// Under effects replication, calling TIME (or SRANDMEMBER, or math.random) is
// completely safe -- only the write this script makes gets replicated.
const timestampedTokenScript = \`
local ts = redis.call('TIME')  -- {seconds, microseconds} -- genuinely non-deterministic
local token = ts[1] .. '-' .. ts[2] .. '-' .. KEYS[1]
redis.call('SET', KEYS[1], token, 'EX', 60)
return token
\`;

async function issueTimestampedToken(key: string): Promise<string> {
  return await redis.eval(timestampedTokenScript, 1, key) as string;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A script calls both <code>math.random()</code> AND a write command (<code>SET</code>) based on that random value. Under effects replication, does the REPLICA ever need to independently call <code>math.random()</code> and get the SAME value the primary got?',
    hint: 'Effects replication sends the script\'s WRITE COMMANDS to the replica, not the script\'s source code. What does the replica actually receive and apply?',
    solution: `No. The replica never re-runs the script's Lua source at all under effects replication -- it only receives and applies the concrete write commands the PRIMARY's execution produced (e.g. the literal "SET mykey some-value" the primary's math.random()-influenced logic decided on). The replica has no reason to ever call math.random() itself, so there is no possibility of it computing a DIFFERENT random value and diverging from the primary.

This is precisely why the old verbatim-replication restriction existed in the first place, and precisely why it's gone now: verbatim mode needed every random call to be forced deterministic because the REPLICA re-ran the same script text and had to reach the identical result independently. Effects replication sidesteps the entire problem by never asking the replica to compute anything at all -- it just applies whatever writes the primary already decided on.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Redis Lua scripts must always be deterministic — this is a fundamental, permanent property of how Redis scripting works, not something tied to a specific version or configuration."',
      reality: 'Verified directly against Redis\'s own docs: this was true for VERBATIM replication specifically, not scripting in general — and verbatim replication has been removed entirely as of Redis 7.0. On any current Redis version, effects replication is the only mode, and non-deterministic functions are explicitly unrestricted.',
    },
    {
      thought: '"If determinism is no longer required, redis.replicate_commands() must still be called to opt into the safer mode."',
      reality: 'Verified directly against the function\'s own docs: redis.replicate_commands() is documented "Until version: 7.0.0" — as of Redis 7.0, effects replication is the default AND ONLY mode, so the function still exists for backward compatibility but calling it does nothing meaningful on a current server; there is no longer a verbatim mode to opt out of.',
    },
  ];

  topicLabel = 'Lua Scripting';
  topicRoute = '/redis/lua-scripting';
  prev: SubtopicLink | null = {
    label: 'Redis Rejects Global Variables — It Doesn\'t Leak Them',
    route: '/redis/lua-scripting/redis-rejects-global-variables-it-doesnt-leak-them',
  };
  next: SubtopicLink | null = {
    label: 'redis.set_repl(): Skipping Replication for Throwaway Writes',
    route: '/redis/lua-scripting/set-repl-skipping-replication-for-throwaway-writes',
  };
}
