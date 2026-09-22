import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sns-fifo-tps',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sns-fifo-throughput-was-raised-10x.html',
  styleUrl: './sns-fifo-throughput-was-raised-10x.scss'
})
export class SnsFifoThroughputWasRaised10xSubtopic {
  topicLabel = 'AWS SNS & EventBridge';
  topicRoute = '/messaging/aws-sns-eventbridge';

  theory: TheoryPoint[] = [
    {
      heading: 'The 300 msg/s Figure Is From Before November 2023',
      points: [
        '"300 messages/second" for a FIFO SNS topic was accurate once, but it stopped being the default in November 2023, when AWS raised the default FIFO topic throughput 10x, to 3,000 messages/second per topic.',
        'The change applied automatically to every existing FIFO topic as well as new ones -- no migration, no opt-in setting, no application code change.',
        'The same shape of stale-default trap already caught once on the sibling SQS topic (FIFO SQS queues defaulting to 3,000 msg/s, not a hard ceiling) recurs here -- a specific-sounding number from an older doc or blog post keeps circulating well after the underlying default changed.'
      ]
    },
    {
      heading: 'High Throughput Mode Trades Topic-Wide Dedup for Even More Speed',
      points: [
        'Since January 2025, FIFO topics also support a High Throughput mode, set via the FifoThroughputScope topic attribute -- the default value is Topic; setting it to MessageGroup unlocks the higher throughput tier.',
        'That higher tier is genuinely region-dependent: up to 30,000 msg/s in us-east-1, and up to 9,000 msg/s in several other major regions -- there is no single number that applies everywhere.',
        'The trade-off is real, not free: MessageGroup scope means SNS deduplicates within EACH message group independently, rather than across the whole topic. The same MessageDeduplicationId reused in two different message groups is treated as two distinct messages under MessageGroup scope, where Topic scope would have caught it as a duplicate.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: default vs. High Throughput Mode ceiling',
      language: 'typescript',
      code: `type Region = 'us-east-1' | 'us-west-2' | 'eu-west-1' | 'other';
type ThroughputScope = 'Topic' | 'MessageGroup';

const DEFAULT_TPS = 3000; // per topic, all regions, since Nov 2023

const HIGH_THROUGHPUT_TPS: Record<Region, number> = {
  'us-east-1': 30_000,
  'us-west-2': 9_000,
  'eu-west-1': 9_000,
  other: DEFAULT_TPS, // not a supported HT region -- falls back to the default
};

function effectiveTopicTps(region: Region, scope: ThroughputScope): number {
  return scope === 'MessageGroup' ? HIGH_THROUGHPUT_TPS[region] : DEFAULT_TPS;
}

console.log(effectiveTopicTps('us-east-1', 'Topic'));
// 3000 -- the current default, already 10x the stale "300" figure

console.log(effectiveTopicTps('us-east-1', 'MessageGroup'));
// 30000 -- High Throughput mode in the best-supported region

console.log(effectiveTopicTps('us-west-2', 'MessageGroup'));
// 9000 -- a different region, genuinely lower ceiling`
    },
    {
      label: 'Model: Topic-scoped vs. MessageGroup-scoped deduplication',
      language: 'typescript',
      code: `type DedupScope = 'Topic' | 'MessageGroup';

function checkDuplicate(
  seen: Set<string>,
  scope: DedupScope,
  groupId: string,
  dedupId: string
): { accepted: boolean; reason?: string } {
  const key = scope === 'MessageGroup' ? \`\${groupId}:\${dedupId}\` : dedupId;
  if (seen.has(key)) return { accepted: false, reason: 'duplicate' };
  seen.add(key);
  return { accepted: true };
}

// Default (Topic scope): the SAME dedup ID in a DIFFERENT group is still caught.
const seenTopic = new Set<string>();
console.log(checkDuplicate(seenTopic, 'Topic', 'orderA', 'X'));
// { accepted: true }
console.log(checkDuplicate(seenTopic, 'Topic', 'orderB', 'X'));
// { accepted: false, reason: 'duplicate' } -- rejected, even though it's a different group

// High Throughput mode (MessageGroup scope): now it is NOT caught.
const seenGroup = new Set<string>();
console.log(checkDuplicate(seenGroup, 'MessageGroup', 'orderA', 'X'));
// { accepted: true }
console.log(checkDuplicate(seenGroup, 'MessageGroup', 'orderB', 'X'));
// { accepted: true } -- accepted, since dedup is now scoped per group`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team is designing a MessageDeduplicationId strategy for a FIFO SNS topic and decides to just use a global, app-wide incrementing counter (not scoped to any particular order or entity) as the dedup ID, reasoning "SNS handles deduplication for us regardless of scope." They plan to enable High Throughput mode for the extra speed. Is that dedup strategy still safe?',
    hint: 'Check what MessageGroup-scoped deduplication actually catches, versus what a Topic-scoped one would have caught.',
    solution: 'It depends on the mode, which is exactly the trap. Under the default Topic scope, a global counter is safe -- SNS checks it across the whole topic. Under High Throughput mode (MessageGroup scope), that same counter is checked only WITHIN each message group -- if the app ever sends the identical dedup ID value to two different message groups (a real risk for a naive global counter that does not also factor in the group), SNS will no longer catch it as a duplicate. The dedup ID needs to be unique within its own message group specifically, not just globally, once MessageGroup scope is in play.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'FIFO SNS topics are capped at 300 messages/second.',
      reality: 'That was the default before November 2023. The current default is 3,000 msg/s per topic, applied automatically with no migration needed, and High Throughput mode raises it further still.'
    },
    {
      thought: 'High Throughput mode is just a faster version of the same deduplication behavior.',
      reality: 'It changes the deduplication SCOPE from the whole topic down to each individual message group -- a real behavioral difference, not just a speed increase.'
    },
    {
      thought: 'The FIFO throughput ceiling is the same number in every AWS region.',
      reality: 'High Throughput mode\'s ceiling is region-dependent -- up to 30,000 msg/s in us-east-1, but lower (around 9,000 msg/s) in several other major regions.'
    }
  ];
}
