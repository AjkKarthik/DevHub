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
  templateUrl: './archives-default-to-indefinite-retention-not-free.html',
  styleUrl: './archives-default-to-indefinite-retention-not-free.scss'
})
export class ArchivesDefaultToIndefiniteRetentionNotFreeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s only archive example always sets a retention period — never what happens if you don\'t',
      points: [
        'The main page\'s own theory bullet states: "Archives: configure an archive on a bus to store events for a retention period; replay from archive to the bus" — phrased as if a retention period is always something actively configured.',
        'The main page\'s own codeTabs\' only archive example explicitly passes --retention-days 30. Its own audit-system challenge, which needs 90-day retention, deliberately routes through Kinesis Firehose → S3 instead of a native EventBridge Archive — leaving the actual cost tradeoff between the two options, and what an Archive does with NO retention flag at all, unexplained.',
      ]
    },
    {
      heading: 'Archives default to indefinite retention and real, separate billing — with their own replay timing quirks',
      points: [
        'Per AWS\'s own documentation: "You can specify the number of days to retain events in the archive. By default, EventBridge stores events in an archive indefinitely." A catch-all archive created without an explicit retention period accumulates events forever, with storage cost growing without bound.',
        'AWS states directly that this is a separately-billed feature: "EventBridge charges apply to archives." — distinct from, and in addition to, the normal per-event ingestion and rule-matching costs the main page\'s own pricing-adjacent content never separates out.',
        'Two operational quirks worth knowing before relying on archive + replay for anything time-sensitive: "There may be a delay between an event being received on an event bus and the event arriving in the archive. We recommend you delay replaying archived events for 10 minutes to make sure all events are replayed." And: "Events aren\'t necessarily replayed in the same order that they were added to the archive. A replay processes events to replay based on the time in the event, and replays them on one minute intervals." This adds a distinct wrinkle on top of the main page\'s own separate "EventBridge does NOT guarantee ordering" mistake entry — replay introduces its own one-minute-batched reordering behavior, independent of the underlying delivery-ordering issue that entry describes.',
        'AWS automatically creates a managed rule on the source bus specifically to stop replayed events from re-entering the same archive — using an event pattern checking that a replay-name field does NOT exist. This rule exists in the account automatically once an archive is created and shouldn\'t be modified or deleted if archive + replay are both relied on.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing unbounded growth — no retention-days set',
      language: 'bash',
      code: `# A "just archive everything for compliance, we'll set retention
# later" instinct -- matching the main page's own create-archive
# command, but WITHOUT --retention-days:
aws events create-archive \\
  --archive-name compliance-catchall \\
  --event-source-arn arn:aws:events:us-east-1:123:event-bus/platform-events
# (no --retention-days flag at all)

# Publish events over an extended period -- weeks or months of
# normal application traffic:
aws events put-events --entries '[{"Source":"com.platform.orders","DetailType":"Order Placed","Detail":"{...}","EventBusName":"platform-events"}]'
# ... repeated over time ...

# Check the archive's own growth -- per AWS's own docs, EventCount
# and SizeBytes have a 24-hour reconciliation delay, but the trend
# is what matters here:
aws events describe-archive --archive-name compliance-catchall \\
  --query '{EventCount:EventCount,SizeBytes:SizeBytes,RetentionDays:RetentionDays}'
# {
#   "EventCount": 4128390,
#   "SizeBytes": 8912340221,
#   "RetentionDays": 0    <- 0 means indefinite, per AWS's own docs
# }
# -- growing every day, forever, with no automatic expiry -- and
# "EventBridge charges apply to archives" independent of whether
# any rule on the bus ever matched these events at all.`,
    },
    {
      label: 'The replay timing quirks — delay and non-chronological batching',
      language: 'bash',
      code: `# Publish 3 events with distinct "time" values spanning 20 minutes
# of real application activity (simulated here via a short window):
aws events put-events --entries '[{"Source":"com.platform.orders","DetailType":"Order Placed","Detail":"{\"seq\":1}","EventBusName":"platform-events"}]'
# ... a few minutes later ...
aws events put-events --entries '[{"Source":"com.platform.orders","DetailType":"Order Placed","Detail":"{\"seq\":2}","EventBusName":"platform-events"}]'

# Replaying IMMEDIATELY, ignoring AWS's own documented recommendation:
aws events start-replay \\
  --replay-name immediate-test \\
  --event-source-arn arn:aws:events:us-east-1:123:archive/compliance-catchall \\
  --event-start-time 2026-07-22T00:00:00Z \\
  --event-end-time 2026-07-22T00:20:00Z \\
  --destination '{"Arn":"arn:aws:events:us-east-1:123:event-bus/platform-events"}'
# -- per AWS's own docs, "There may be a delay between an event
# being received... and arriving in the archive" -- the most
# recently published event may not have made it into the archive
# yet, and would be silently missing from this replay.

# AWS's own recommended pattern -- wait before replaying:
sleep 600   # 10 minutes, per AWS's own documented recommendation
aws events start-replay \\
  --replay-name reliable-test \\
  --event-source-arn arn:aws:events:us-east-1:123:archive/compliance-catchall \\
  --event-start-time 2026-07-22T00:00:00Z \\
  --event-end-time 2026-07-22T00:20:00Z \\
  --destination '{"Arn":"arn:aws:events:us-east-1:123:event-bus/platform-events"}'
# -- reliably includes both events. Per AWS's own docs, delivery
# during replay is still batched "on one minute intervals" based on
# each event's own timestamp, not strict chronological order within
# that minute -- worth knowing for anything expecting strict ordering
# during a replay.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team creates a catch-all archive on their custom bus "for compliance, we\'ll set a real retention policy later," matching the main page\'s own create-archive command but omitting --retention-days. Eight months later, finance flags an unexpectedly large jump in the EventBridge line item on the AWS bill, with no corresponding increase in application traffic or rule count. Using this subtopic\'s theory, diagnose the likely cause and describe the fix.',
    hint: 'What does AWS\'s own documentation say happens to events in an archive when no retention period is specified — and does that default cost anything?',
    solution: 'Per this subtopic\'s theory, this is very likely the archive\'s own default retention behavior, not a mysterious billing anomaly. AWS\'s own documentation states directly: "By default, EventBridge stores events in an archive indefinitely," and separately, "EventBridge charges apply to archives." Because the team never set --retention-days, every single event published to the bus over those eight months has been accumulating in the archive with no expiry at all, and each of those events contributes to a real, ongoing storage cost — independent of whether any rule on the bus ever matched them, and independent of application traffic volume staying flat (the archive\'s own size just keeps growing regardless). The fix is to set an explicit RetentionDays on the archive matching the team\'s actual compliance requirement (using UpdateArchive to modify the existing archive, since retention can be changed after creation) — and, ideally, to review whether a catch-all archive with no event-pattern filter is even the right scope, since AWS\'s own create-archive API also supports an optional event pattern to limit which events get archived in the first place, further controlling the ongoing cost.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An EventBridge archive automatically expires and stops accumulating events (and cost) after some reasonable default retention period, even if you don\'t explicitly specify one.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the opposite default directly: "By default, EventBridge stores events in an archive indefinitely" — omitting a retention period means events accumulate forever, not that a sensible default kicks in.'
    },
    {
      thought: 'Archiving events is effectively a free side effect of using EventBridge, since the team is already paying for event ingestion and rule evaluation on the bus.',
      reality: 'Per this subtopic\'s theory, AWS states directly that "EventBridge charges apply to archives" — a separate, additional cost from normal event bus usage, that scales with however many events accumulate in the archive over time.'
    },
    {
      thought: 'Replaying an archive delivers events in the exact chronological order they originally occurred, since preserving history faithfully is the whole point of an archive.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states replay events are delivered "on one minute intervals" based on each event\'s own timestamp, not guaranteed strict order — on top of EventBridge\'s own separate, general lack of delivery-ordering guarantees.'
    }
  ];
}
