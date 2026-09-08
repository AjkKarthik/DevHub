import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-aof-use-rdb-preamble-default-since-redis-5-0',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './aof-use-rdb-preamble-default-since-redis-5-0.html',
  styleUrl: './aof-use-rdb-preamble-default-since-redis-5-0.scss',
})
export class AofUseRdbPreambleDefaultSinceRedis50Subtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'A three-stage version history, verified directly against Redis\'s own config files',
      points: [
        'The main page originally attributed <code>aof-use-rdb-preamble yes</code> as "default in Redis 7+" — checked directly against Redis\'s own <code>redis.conf</code> template at two specific tagged versions on GitHub, not a secondary summary.',
        'At Redis 4.0 (the version that INTRODUCED the option): the shipped default was <code>aof-use-rdb-preamble no</code>, with the config file\'s own comment stating "this is currently turned off by default in order to avoid the surprise of a format change, but will at some point be used as the default."',
        'At Redis 5.0: the shipped default flipped to <code>aof-use-rdb-preamble yes</code> — two full major versions before the "7+" the page originally claimed. It has stayed the default ever since, including in every 7.x release.',
      ],
    },
    {
      heading: 'Why this class of mistake is worth watching for specifically',
      points: [
        'This hub has now found the identical failure pattern multiple times: a feature\'s introduction version, its eventual default-flip version, and "whatever version feels current" all get conflated into one wrong number.',
        'The fix here wasn\'t "the feature is newer than claimed" or "older than claimed" in a simple sense — it required distinguishing THREE separate facts (introduced in 4.0, opt-in only; defaulted to yes starting at 5.0; still the default through 7.x) that a single "(default in Redis 7+)" parenthetical collapsed into one wrong claim.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The verified version timeline',
      language: 'typescript',
      code: `// Verified directly against Redis's own redis.conf template at each tagged
// GitHub release -- not a secondary summary.
interface ConfigDefaultAtVersion {
  version: string;
  defaultValue: 'yes' | 'no';
  note: string;
}

const aofUseRdbPreambleHistory: ConfigDefaultAtVersion[] = [
  { version: '4.0', defaultValue: 'no', note: 'option introduced; opt-in only, per the config file\\'s own comment' },
  { version: '5.0', defaultValue: 'yes', note: 'default flipped to yes -- this is the real turning point' },
  { version: '7.0', defaultValue: 'yes', note: 'still the default -- but NOT where the default first appeared' },
];

function defaultAsOfVersion(major: number, minor: number): 'yes' | 'no' {
  // Find the most recent history entry at or before the given version.
  const target = major + minor / 10;
  const applicable = aofUseRdbPreambleHistory
    .filter(h => {
      const [hMajor, hMinor] = h.version.split('.').map(Number);
      return (hMajor + hMinor / 10) <= target;
    })
    .at(-1);
  return applicable?.defaultValue ?? 'no';
}

console.log('Default at Redis 4.0:', defaultAsOfVersion(4, 0));
console.log('Default at Redis 4.9 (still pre-5.0):', defaultAsOfVersion(4, 9));
console.log('Default at Redis 5.0:', defaultAsOfVersion(5, 0));
console.log('Default at Redis 7.0:', defaultAsOfVersion(7, 0));
// Default at Redis 4.0: no
// Default at Redis 4.9 (still pre-5.0): no
// Default at Redis 5.0: yes
// Default at Redis 7.0: yes`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team running Redis 4.9 (a hypothetical late 4.x patch, before 5.0) reads the CORRECTED claim ("default since Redis 5.0") and assumes their own instance already has hybrid persistence enabled by default. Are they right?',
    hint: 'The corrected claim states a MINIMUM version where the default flipped — what does that imply about every version strictly BEFORE that minimum?',
    solution: `No -- they are not right. "Default since Redis 5.0" is a floor, not a blanket statement about every past version. Any Redis instance strictly older than 5.0 (including a hypothetical 4.9) still ships with the ORIGINAL, opt-in default from 4.0: aof-use-rdb-preamble no.

This is exactly the kind of assumption the corrected claim is written specifically to prevent -- a version-scoped fact needs its scope taken seriously, not read as "this is just how Redis has always worked." A team on pre-5.0 Redis genuinely needs to set aof-use-rdb-preamble yes explicitly in their own redis.conf if they want hybrid persistence; relying on the default would silently leave them on the old, non-hybrid rewrite format.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Since aof-use-rdb-preamble was introduced in Redis 4.0, it must have defaulted to yes from that same version — why would Redis add a feature and not turn it on?"',
      reality: 'Verified directly against Redis 4.0\'s own shipped config file: the default was explicitly no, with the config comment itself explaining why — to avoid an unannounced format change surprising existing deployments. A conservative opt-in-first rollout, then a later default flip once the format was proven, is a common and deliberate pattern for changes that alter an on-disk file format.',
    },
    {
      thought: '"A single version number like \'7+\' in documentation is usually safe to trust without double-checking, since it\'s just describing when a feature became current."',
      reality: 'This hub has now found the identical class of mistake several times on this exact main page\'s own content — a specific-sounding version attribution is not automatically more trustworthy than a vague one, and is worth checking against the actual shipped config/source at the claimed version before repeating it.',
    },
  ];

  topicLabel = 'Persistence: RDB & AOF';
  topicRoute = '/redis/persistence';
  prev: SubtopicLink | null = null;
  next: SubtopicLink | null = {
    label: 'DEBUG SLEEP vs. SAVE: Two Completely Different Commands',
    route: '/redis/persistence/debug-sleep-vs-save-two-different-commands',
  };
}
