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
    heading: 'Two Separate Version Lines, Conflated Into One',
    points: [
      'The main page\'s own QnA on running out of memory used to say "Redis 7.x introduced Redis on Flash (enterprise) for tiered storage" — verified via Redis\'s own 2016 press materials that Redis on Flash was announced in 2016, roughly six years before open-source Redis reached version 7.0 at all.',
      'The confusion comes from conflating two genuinely separate version lines: open-source Redis (the version numbers this whole hub uses — Redis 6, Redis 7, etc.) and Redis Enterprise Software (a commercial product with its OWN release/version numbering, unrelated to the open-source line). Redis on Flash — since rebranded Auto Tiering — belongs entirely to the Enterprise line and was never tied to an open-source Redis version milestone.',
      'The underlying FACT the QnA was trying to convey is still accurate: this tiered-storage capability is real, Enterprise-only, and lets frequently-accessed data stay in RAM while colder data moves to local SSD/flash — only the specific "Redis 7.x introduced it" attribution was wrong.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Real Timeline',
    language: 'typescript',
    code: `// Two independent version lines -- confirmed via Redis's own
// published history -- with no shared numbering at all.
interface VersionEvent { year: number; line: 'open-source' | 'enterprise'; event: string; }

const timeline: VersionEvent[] = [
  { year: 2016, line: 'enterprise',  event: 'Redis on Flash announced (Redis Labs + Intel, AWS Summit NY)' },
  { year: 2020, line: 'open-source', event: 'Redis 6.0 released -- introduces optional I/O threading' },
  { year: 2022, line: 'open-source', event: 'Redis 7.0 released' },
  { year: 2024, line: 'enterprise',  event: 'Auto Tiering / Flex (the current name for the same capability)' },
];

const sortedByYear = [...timeline].sort((a, b) => a.year - b.year);
console.log(sortedByYear.map(e => \`\${e.year} (\${e.line}): \${e.event}\`).join('\\n'));
// -> Confirms Redis on Flash existed a full 6 years BEFORE open-source
// Redis 7.0 was ever released -- "Redis 7.x introduced it" gets the
// causality backwards, since the two lines don't share a clock at all.

// The reliable way to tell the two lines apart when reading Redis
// docs/marketing: open-source Redis version numbers appear in the
// CHANGELOG for the redis/redis GitHub repo itself; Redis Enterprise
// Software version numbers appear in Redis's own separate "Redis
// Enterprise Software" release notes -- a "7.x" or "8.x" in one is not
// the same axis as a "7.x" or "8.x" in the other.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A blog post says "Auto Tiering became generally available in Redis Software 8.0.2." Given everything verified above, is "Redis Software 8.0.2" referring to the same version line as the open-source "Redis 8.0" release, or something else?',
  hint: 'Think about which of the two independent version lines the phrase "Redis Software" (as opposed to just "Redis") is naming.',
  solution: `// "Redis Software" here refers to Redis ENTERPRISE Software's own
// version line, not the open-source Redis release line -- the same
// distinction the main page's original QnA conflated.
//
// The two numbers happening to both read "8.x" at some point in time
// is coincidental, not evidence they share a version line -- exactly
// as the verified 2016-vs-2022 timeline above shows for Redis on
// Flash (2016) and open-source Redis 7.0 (2022), where "7.x" from the
// original QnA never lined up with anything real in either line at
// all.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'When Redis marketing or documentation cites a version number like "7.x" or "8.x" for a feature, it always refers to the same open-source Redis version line this whole hub\'s content is versioned against.',
    reality: 'Verified via Redis\'s own history: Redis Enterprise Software maintains a COMPLETELY SEPARATE version/release line from open-source Redis. A version number cited for an Enterprise-only feature (like tiered storage) needs to be checked against the ENTERPRISE release notes specifically, not assumed to align with the open-source Redis version number of the same digits.',
  },
  {
    thought: 'Since Redis on Flash / Auto Tiering is Enterprise-only, it has no relevance to anyone working with open-source Redis and can be treated as out of scope entirely.',
    reality: 'The main page\'s own QnA raises it specifically to answer "can Redis hold more data than available RAM?" — a real, common question open-source Redis users also ask (and for which the honest open-source answer is "no, not without a completely separate storage-tiering approach at the application level"). Knowing the Enterprise-only capability exists, and that it is NOT something open-source Redis gained in any specific open-source version, is directly useful context for that question.',
  },
];

@Component({
  selector: 'app-redis-fund-on-flash-timeline',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './redis-on-flash-predates-oss-redis-7-by-years.html',
  styleUrl: './redis-on-flash-predates-oss-redis-7-by-years.scss',
})
export class RedisOnFlashPredatesOssRedis7ByYearsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
