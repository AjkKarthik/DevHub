import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './duplicate-detection-is-off-by-default-10-minute-window-when-on.html',
  styleUrl: './duplicate-detection-is-off-by-default-10-minute-window-when-on.scss'
})
export class DuplicateDetectionIsOffByDefault10MinuteWindowWhenOnSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions duplicate detection as an available strategy without saying it has to be turned on, or what it defaults to',
      points: [
        'The main page\'s own QnA on idempotent processing states: "MessageId deduplication: enable duplicate detection on the queue (deduplication window 10 seconds–7 days) — Service Bus discards messages with the same MessageId within the window." This gives the configurable RANGE, but never states what the feature\'s own default state is, or what window applies once it\'s turned on without an explicit value.',
        'A reader could reasonably assume duplicate detection is either always on, or that leaving the window unspecified after enabling it means "as long as possible" (the 7-day maximum) rather than a specific, much shorter default.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own duplicate detection reference: off by default, and a 10-minute default window once enabled',
      points: [
        'Per Microsoft\'s own documentation, duplicate detection is not automatic — it requires explicit configuration, and once enabled, "this value defaults to 10 minutes for queues and topics, with a minimum value of 20 seconds and a maximum value of 7 days." A queue with duplicate detection turned on but no explicit window value only protects against duplicates sent within a 10-minute span, not the 7-day ceiling that might be assumed.',
        'The tier matters too: "The basic tier of Service Bus doesn\'t support duplicate detection. The standard and premium tiers support duplicate detection." A namespace on Basic tier cannot use this feature at all, regardless of configuration attempts.',
        'What actually gets compared is narrower than it might sound: "No other parts of the message other than the MessageId are considered." Two messages with identical bodies but different MessageIds are NOT treated as duplicates — the application is entirely responsible for constructing a MessageId that reliably represents "this exact logical operation," per the main page\'s own guidance to anchor it to a business process identifier.',
      ]
    },
    {
      heading: 'A partitioning interaction the main page\'s idempotency QnA doesn\'t mention at all',
      points: [
        'Per Microsoft\'s own docs: "When partitioning is enabled, MessageId+PartitionKey is used to determine uniqueness... When partitioning is disabled (default), only MessageId is used to determine uniqueness." On a partitioned entity, two messages with the same MessageId but different PartitionKey values are NOT considered duplicates of each other — a real, easy-to-miss gap if an application assumes MessageId alone is always sufficient.',
        'Microsoft\'s own docs go further and actively discourage combining features here: "it isn\'t recommended to use deduplication and batching together with partitioning" — a specific combination the main page\'s own batch-processing coverage and idempotency coverage never cross-reference against each other.',
        'Scheduled messages are explicitly included in the same duplicate-detection pool as regular messages: sending a scheduled message and then a duplicate non-scheduled one (or vice versa) results in the second one being silently dropped — worth knowing before assuming scheduled and immediate sends are tracked separately.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Enabling duplicate detection with an explicit window',
      language: 'bash',
      code: `# Duplicate detection is OFF by default -- must be explicitly
# enabled at queue/topic CREATION time (cannot be added later to
# an existing queue without recreating it):
az servicebus queue create \\
  --namespace-name my-sb-ns --resource-group my-rg \\
  --name orders-queue \\
  --enable-duplicate-detection true \\
  --duplicate-detection-history-time-window PT10M
# PT10M = 10 minutes, matching the documented default -- explicit
# here for clarity, but this IS what you'd get by omitting the
# parameter entirely once duplicate detection itself is enabled.

# Widening the window for a business process where retries could
# plausibly happen hours later, not just seconds later:
az servicebus queue create \\
  --namespace-name my-sb-ns --resource-group my-rg \\
  --name payment-events-queue \\
  --enable-duplicate-detection true \\
  --duplicate-detection-history-time-window PT2H
# Wider windows cost more: "all recorded message IDs must be
# matched against the newly submitted message identifier" for
# every send -- keep the window as small as the actual retry
# scenario genuinely requires.`,
    },
    {
      label: 'Constructing a MessageId that survives the partitioning gotcha',
      language: 'typescript',
      code: `// Per Microsoft's own docs: "When partitioning is disabled
// (default), only MessageId is used to determine uniqueness" --
// but if partitioning IS enabled, PartitionKey is folded into the
// uniqueness check too, so a retry MUST use the same PartitionKey
// as the original send, not just the same MessageId, or dedup
// silently fails to catch it.

await sender.sendMessages({
  body: { orderId: 'ord-123', action: 'payment' },
  messageId: 'ord-123.payment',        // business-anchored, per the
                                         // main page's own guidance
  partitionKey: 'ord-123',              // MUST match on retry if
                                         // partitioning is enabled --
                                         // easy to accidentally omit
                                         // or vary on a retry path
});

// A retry attempt that reuses messageId but generates a NEW,
// different partitionKey (e.g. derived from a retry-attempt
// timestamp by mistake) will NOT be caught as a duplicate on a
// partitioned entity -- it will be delivered a second time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables duplicate detection on a Service Bus queue to guard against a known retry scenario where their sender occasionally resends the same order confirmation up to 30 minutes after the original send, due to a slow downstream acknowledgment. They configure duplicate detection with no explicit window value, assuming the 7-day maximum applies as a safe, generous default. Six months later, a batch of 30-minute-delayed retries all get delivered as duplicates. What went wrong?',
    hint: 'Check what the actual default duplicate detection window is when none is explicitly specified, versus the maximum value the feature supports.',
    solution: 'The assumption that omitting the window defaults to the 7-day maximum was wrong. Per Microsoft\'s own documentation, "this value defaults to 10 minutes for queues and topics" when duplicate detection is enabled without an explicit window — not 7 days. A retry arriving 30 minutes after the original send falls well outside that 10-minute default window, so it is treated as a brand-new message rather than a duplicate. The fix is explicitly setting the duplicate detection history window to a value that comfortably covers the known 30-minute retry scenario (e.g. 1 hour), rather than relying on an assumed default that was actually much shorter than needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Service Bus duplicate detection is enabled by default on every queue and topic, silently protecting against accidental duplicate sends.',
      reality: 'Per this subtopic\'s theory, duplicate detection is off by default and must be explicitly enabled at queue or topic creation time — it also isn\'t available at all on the Basic tier.'
    },
    {
      thought: 'If duplicate detection is enabled without specifying an explicit history window, the maximum 7-day window applies as a safe default.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states the default is 10 minutes, not 7 days — a much shorter window than the maximum the feature supports.'
    },
    {
      thought: 'On a partitioned Service Bus entity, sending two messages with the identical MessageId is always caught as a duplicate, exactly as it would be on a non-partitioned entity.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states that when partitioning is enabled, uniqueness is determined by MessageId PLUS PartitionKey together — two messages sharing a MessageId but with different PartitionKey values are not treated as duplicates of each other.'
    }
  ];
}
