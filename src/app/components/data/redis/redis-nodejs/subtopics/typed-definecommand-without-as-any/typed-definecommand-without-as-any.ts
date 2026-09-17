import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-typed-definecommand-without-as-any',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './typed-definecommand-without-as-any.html',
  styleUrl: './typed-definecommand-without-as-any.scss',
})
export class TypedDefineCommandWithoutAsAnySubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code violates its own advice',
      points: [
        'This page\'s own theory bullet on TypeScript type safety says wrapping Redis access in a typed layer "avoids scattering unsafe type assertions throughout the codebase." The main page\'s own <code>defineCommand()</code> example does exactly the opposite — it registers <code>rateLimit</code> and can only call it via <code>(redis as any).rateLimit(...)</code>, since ioredis has no way to know that method exists without help.',
        'ioredis solves this properly with TypeScript declaration merging: extending the library\'s own <code>RedisCommander&lt;Context&gt;</code> interface with the new method\'s real signature, confirmed against ioredis\'s own official TypeScript example. Once declared, the custom command gets full type checking and autocomplete, with zero runtime code change.',
      ],
    },
    {
      heading: 'Why the interface has to be RedisCommander, not Redis',
      points: [
        'ioredis\'s <code>Redis</code> class (and its <code>Cluster</code> class) both mix in <code>RedisCommander&lt;Context&gt;</code> for their built-in command methods (<code>get</code>, <code>set</code>, <code>incr</code>, ...) — augmenting that SAME interface is what makes a custom command appear on both classes with identical typing, matching how the built-in commands already work.',
        'The <code>Context</code> generic is preserved from the interface it is declared on, not hardcoded — this is what lets the same declaration correctly type the command whether it is called directly, inside a pipeline, or inside a MULTI transaction, without three separate declarations.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Main page\'s own defineCommand (untyped)',
      language: 'typescript',
      code: `redis.defineCommand('rateLimit', {
  numberOfKeys: 1,
  lua: \`
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
    return count
  \`,
});

// (redis as any) -- ioredis has no idea "rateLimit" exists as a real method
const count = await (redis as any).rateLimit('rl:user:42', '60');
// count is typed as "any" -- a typo in the method name, or passing the
// wrong argument types, compiles fine and only fails at runtime.`,
    },
    {
      label: 'Fixed: declaration merging',
      language: 'typescript',
      code: `import Redis, { Callback, Result } from 'ioredis';

redis.defineCommand('rateLimit', {
  numberOfKeys: 1,
  lua: \`
    local count = redis.call('INCR', KEYS[1])
    if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
    return count
  \`,
});

// Extend ioredis's OWN interface -- the same one Redis/Cluster already
// mix in for get/set/incr -- rather than casting the client instance.
declare module 'ioredis' {
  interface RedisCommander<Context> {
    rateLimit(
      key: string,
      ttlSeconds: string,
      callback?: Callback<number>,
    ): Result<number, Context>;
  }
}

// No cast needed -- fully typed, autocompletes, and a typo'd method
// name or wrong argument type is now a compile error, not a 2am page.
const count = await redis.rateLimit('rl:user:42', '60');
//    ^? number`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The declared signature is <code>rateLimit(key: string, ttlSeconds: string, ...)</code> — note <code>ttlSeconds</code> is typed as a <code>string</code>, not a <code>number</code>, even though it represents a number of seconds. Why does that match the underlying Lua script, and what would go wrong if the declaration used <code>number</code> instead?',
    hint: 'Look at how ARGV[1] is used inside the Lua script, and what type ioredis actually sends command arguments as over the wire.',
    solution: `Every argument ioredis sends to Redis over the wire is serialized to a string (or Buffer) -- that is simply how the Redis protocol works, regardless of what JS type the caller passed in. The Lua script reads it back as ARGV[1] and passes it straight to EXPIRE, which itself expects a string-encoded integer.

Declaring the parameter as string is the ACCURATE type for what actually crosses the wire -- it is not a limitation of this particular command, it reflects how every ioredis command argument behaves. Declaring it as number instead would still compile and still work at runtime (ioredis stringifies numbers automatically), but it would be documenting a promise the underlying protocol never actually made -- a caller building a value with string-specific logic (padStart, string interpolation) would get no warning that a number was equally acceptable, and vice versa.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since defineCommand() is an ioredis-only feature, this fix is the last piece needed to make the whole rate-limit function fully type-safe end to end."',
      reality: 'The declaration only types the CALL SITE\'s method signature — it says nothing about what the Lua script itself actually does. If the Lua script is later edited to return something other than a plain integer (say, a table), the declared <code>Result&lt;number, Context&gt;</code> return type becomes silently wrong with no compiler warning at all, since TypeScript has no way to check Lua source. The declaration is a contract the developer is responsible for keeping in sync with the script, not something the compiler verifies against it.',
    },
    {
      thought: '"declare module \'ioredis\' { ... } needs to be repeated in every file that calls redis.rateLimit()."',
      reality: 'TypeScript module augmentation is GLOBAL to the whole compiled project once the file containing it is included in compilation — declaring it once, anywhere in the project (commonly right next to the <code>defineCommand()</code> call itself), makes the typed method available on every <code>Redis</code>/<code>Cluster</code> instance in every file, with no import of the augmentation itself required.',
    },
  ];

  topicLabel = 'Redis with Node.js';
  topicRoute = '/redis/redis-nodejs';
  prev: SubtopicLink | null = {
    label: 'WATCH Retry Loops Need a Dedicated Connection',
    route: '/redis/redis-nodejs/watch-retry-loops-need-a-dedicated-connection',
  };
  next: SubtopicLink | null = {
    label: 'A Real Health-Check Endpoint with a PING Timeout',
    route: '/redis/redis-nodejs/a-real-health-check-endpoint-with-ping-timeout',
  };
}
