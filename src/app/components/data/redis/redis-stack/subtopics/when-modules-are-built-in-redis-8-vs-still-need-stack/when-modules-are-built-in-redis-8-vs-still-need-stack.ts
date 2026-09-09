import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-when-modules-are-built-in-redis-8-vs-still-need-stack',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './when-modules-are-built-in-redis-8-vs-still-need-stack.html',
  styleUrl: './when-modules-are-built-in-redis-8-vs-still-need-stack.scss',
})
export class WhenModulesAreBuiltInRedis8VsStillNeedStackSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The main page had the wrong version number',
      points: [
        'The main page originally said "In Redis 7.4+ (Cloud), many Stack capabilities are available as part of Redis Community Edition" — verified directly against Redis\'s own official 8.0 release notes that this is off by a full major version: the actual merge of RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom directly into core Redis happened at Redis 8.0 (GA May 2025), not 7.4.',
        'The SAME 8.0 release notes also state, in the very same section: "Redis Community Edition is now Redis Open Source" — the terminology itself changed at the identical version boundary, so a claim naming "Community Edition" as the current target of the merge was doubly stale.',
      ],
    },
    {
      heading: 'What actually determines whether Stack is needed',
      points: [
        'The one thing that matters is the CORE REDIS VERSION, not whether you happen to be using Redis Cloud vs. self-hosted — Redis 8.0+ ships RediSearch, JSON, time series, and five probabilistic data structures built in on every distribution (Docker, apt, brew, RPM), with no separate module loading step at all.',
        'Anything running Redis below 8.0 — including a self-hosted 7.x instance, or an older managed Cloud database still pinned to 7.x — genuinely needs the Redis Stack package (or manually loading each module) to get these capabilities, exactly as the main page\'s original theory bullet described, just at the wrong version boundary.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Version check, verified against the real release notes',
      language: 'typescript',
      code: `interface RedisVersion { major: number; minor: number }

function needsRedisStackPackage(version: RedisVersion): boolean {
  // Verified against Redis's own 8.0 release notes: the merge landed at 8.0.0.
  return version.major < 8;
}

console.log(needsRedisStackPackage({ major: 7, minor: 4 }));
// true -- 7.4 still needs the separate Stack package or individually loaded modules

console.log(needsRedisStackPackage({ major: 7, minor: 2 }));
// true -- same story for 7.2

console.log(needsRedisStackPackage({ major: 8, minor: 0 }));
// false -- RediSearch, JSON, time series, and the probabilistic types are built in

console.log(needsRedisStackPackage({ major: 8, minor: 6 }));
// false -- still built in on every later 8.x release`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team reads an older tutorial that says "run <code>docker pull redis/redis-stack</code> to get RedisJSON and RediSearch" and applies this advice to a fresh Redis 8.2 deployment. Does this actually cause a problem, and why or why not?',
    hint: 'The Redis 8.0 release notes describe supported UPGRADE paths — what do they say about coming FROM a Redis Stack image?',
    solution: `It does not cause a functional problem, but it is unnecessary -- Redis's own 8.0 release notes explicitly list "From Redis Stack 7.2 or 7.4" as a SUPPORTED upgrade path, meaning the redis-stack image itself was never removed or broken by the 8.0 merge. The team would simply be running a Stack-flavored image on top of a Redis 8.2 core that ALREADY has RediSearch and RedisJSON built in natively -- effectively redundant, not broken.

The real cost is just an unnecessarily larger image and a slightly confusing mental model (implying the modules are still a separate add-on when the plain redis:8.2 image would provide the exact same capabilities). For a genuinely new deployment on Redis 8.0+, pulling the plain, non-Stack image is both simpler and gives identical functionality.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since the modules merged into core Redis, the separate redis/redis-stack Docker image must have been discontinued."',
      reality: 'Verified above: Redis\'s own 8.0 release notes list upgrading FROM a Redis Stack 7.2 or 7.4 image as an officially supported path — the Stack image line was not discontinued by the merge, it simply became redundant for anyone starting a brand-new deployment on 8.0 or later.',
    },
    {
      thought: '"\'Redis Community Edition\' and \'Redis Open Source\' are two different products with different feature sets."',
      reality: 'They are the SAME product under two different names at two points in time — verified above that Redis\'s own 8.0 release notes state directly "Redis Community Edition is now Redis Open Source," a rename that happened at the identical version boundary as the modules-into-core merge, not a separate product split.',
    },
  ];

  topicLabel = 'Redis Stack';
  topicRoute = '/redis/redis-stack';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'The FT.INFO indexing Field Is a Truthy String, Not a Boolean',
    route: '/redis/redis-stack/the-ft-info-indexing-field-is-a-truthy-string-not-a-boolean',
  };
}
