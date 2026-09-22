import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-sqs-http',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fifo-high-throughput-mode.html',
  styleUrl: './fifo-high-throughput-mode.scss'
})
export class FifoHighThroughputModeSubtopic {
  topicLabel = 'AWS SQS';
  topicRoute = '/messaging/aws-sqs';

  theory: TheoryPoint[] = [
    {
      heading: '3,000 msg/s Is a Default, Not a Ceiling',
      points: [
        'A newly-created FIFO queue starts with the "standard" throughput setting: 300 requests/second without batching, or 3,000 msg/s with batching (up to 10 messages per SendMessageBatch call).',
        'High Throughput Mode is a queue-level setting (no application code changes needed) that removes the per-queue rate limit and lets throughput scale with the number of distinct MessageGroupIds in use.',
        'AWS has raised the High Throughput Mode ceiling repeatedly since its 2021 launch: 6,000 transactions/sec per API action in 2022, then 9,000 (4,500 in some Asia Pacific regions) in mid-2023, then up to 70,000 transactions/sec per API action in several major regions by late 2023 -- with batching, that is up to 700,000 messages/second.'
      ]
    },
    {
      heading: 'Ordering Still Holds Under High Throughput Mode',
      points: [
        'Enabling High Throughput Mode does not weaken FIFO\'s guarantees -- strict ordering and exactly-once processing still apply per MessageGroupId. What changes is how many DIFFERENT message groups can be processed in parallel.',
        'A workload using a single MessageGroupId for everything gets no real benefit from High Throughput Mode, since ordering within one group is still strictly sequential -- the throughput gain comes from spreading work across many groups.',
        'This is the same shape of trade-off as Kafka partition count: more independent ordering keys (message groups, or partitions) is what unlocks more parallelism, not a blanket "faster mode" switch.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Model: default vs. High Throughput Mode ceiling',
      language: 'typescript',
      code: `type ThroughputMode = 'standard' | 'high-throughput';

// Per-API-action ceiling, transactions/sec (batched sends multiply by up to 10)
const TPS_CEILING: Record<ThroughputMode, number> = {
  standard: 300,          // 3,000 msg/s with batching
  'high-throughput': 70_000, // up to 700,000 msg/s with batching, in supported regions
};

function effectiveMsgPerSec(mode: ThroughputMode, batched: boolean): number {
  const tps = TPS_CEILING[mode];
  return batched ? tps * 10 : tps;
}

console.log(effectiveMsgPerSec('standard', false));
// 300 -- the default, unbatched ceiling

console.log(effectiveMsgPerSec('standard', true));
// 3000 -- matches the main page's own "3,000 msg/s with batching" figure

console.log(effectiveMsgPerSec('high-throughput', true));
// 700000 -- over 200x the default, with zero application code change`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s FIFO queue is hitting throttling at ~3,000 messages/second and they conclude "FIFO just cannot go faster than this -- we need to switch to Standard and build our own ordering/dedup logic." Is that the right conclusion?',
    hint: 'Check whether 3,000 msg/s is the queue\'s only setting, or one of two throughput modes.',
    solution: 'No. 3,000 msg/s (with batching) is the DEFAULT throughput setting, not a hard FIFO limit. Enabling High Throughput Mode on the same queue -- a configuration change, not a rewrite -- raises the ceiling to tens of thousands of transactions per second per API action (up to 700,000 msg/s with batching in supported regions), while keeping FIFO\'s exactly-once and per-group ordering guarantees intact. Switching to Standard would throw away those guarantees for a problem that a queue setting already solves.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '3,000 msg/s (with batching) is the maximum a FIFO queue can ever do.',
      reality: 'It is the default throughput setting. High Throughput Mode, a per-queue setting, raises the real ceiling to tens of thousands of transactions per second per API action -- no code change required.'
    },
    {
      thought: 'High Throughput Mode makes FIFO behave like Standard, trading away ordering for speed.',
      reality: 'Ordering and exactly-once processing per MessageGroupId are unchanged. The mode only removes the queue-wide rate limit, letting more DISTINCT message groups be processed in parallel.'
    },
    {
      thought: 'Enabling High Throughput Mode alone will speed up a workload that uses one shared MessageGroupId.',
      reality: 'A single message group is still strictly sequential regardless of mode. The throughput gain only appears when work is spread across many independent message groups.'
    }
  ];
}
