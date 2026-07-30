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
  templateUrl: './inbox-table-needs-cleanup-too.html',
  styleUrl: './inbox-table-needs-cleanup-too.scss'
})
export class InboxTableNeedsCleanupTooSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Outbox gets a cleanup mistake block; the Inbox gets one sentence',
      points: [
        'The page\'s "Growing the Outbox table indefinitely" mistake block gives the Outbox side a full wrong/right code example and explanation for cleanup. The Inbox side gets exactly one line, buried in a theory bullet: "The inbox table needs a retention/cleanup policy just like idempotency keys generally do." No code, no discussion of HOW LONG to retain rows.',
        'The retention window matters more for the Inbox than a casual reading suggests: delete an inbox row TOO EARLY, and a legitimately-late broker redelivery (still within the broker\'s normal at-least-once delivery window) would find no matching row, treat the redelivered message as brand-new, and reprocess it — silently reintroducing the exact duplicate-processing bug the Inbox pattern exists to prevent.',
        'This is a genuinely different risk profile from the Outbox cleanup mistake, where deleting a row too early after a successful publish has no correctness consequence at all (the event already reached the broker) — Inbox cleanup timing is a real correctness parameter, not just a table-size housekeeping concern.',
      ]
    },
    {
      heading: 'What actually determines a safe retention window',
      points: [
        'The safe retention window has to exceed the maximum time the message broker could plausibly still redeliver a message that was already processed — for most brokers this is governed by consumer visibility timeout / redelivery settings, retry policies, and how long a consumer might realistically be down before restarting and triggering redelivery.',
        'A conservative, common choice is retaining inbox rows for several days (well beyond any normal broker redelivery window, which is usually measured in minutes to low hours) — erring toward "too long" costs a bit of table size; erring toward "too short" risks the correctness failure described above.',
        'Just like the Outbox\'s own cleanup job, this needs to run as a genuinely separate, periodic background process — bolting cleanup logic directly into the hot request-processing path (the same transaction that does the inbox INSERT and business logic) would add latency to every single message processed, for a maintenance task that doesn\'t need to happen synchronously.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A periodic inbox cleanup job, with a safety-first retention window',
      language: 'typescript',
      code: `// Run as a separate scheduled job (cron, background worker) --
// NOT inside the hot path that processes incoming messages.

// A retention window must safely exceed the broker's own maximum
// plausible redelivery window. Check your specific broker's actual
// configured values (visibility timeout, max receive count, retry
// policy) before picking a number -- this is illustrative, not a
// universal constant.
const INBOX_RETENTION_DAYS = 7;

async function cleanupInboxTable(): Promise<void> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - INBOX_RETENTION_DAYS);

  const result = await db.query(
    'DELETE FROM inbox WHERE processed_at < $1',
    [cutoff.toISOString()]
  );

  console.log(\`Inbox cleanup: removed \${result.rowCount} rows older than \${INBOX_RETENTION_DAYS} days\`);
}

// Deleting TOO EARLY is a correctness bug, not just a housekeeping
// choice -- if a legitimately-late redelivery arrives for an event
// whose inbox row was already cleaned up, the consumer sees no
// matching row, treats it as brand new, and reprocesses it:
//
//   Day 0:  event processed, inbox row inserted, processed_at = Day 0
//   Day 1:  (too-aggressive) cleanup job deletes rows older than 12 hours
//   Day 1:  broker redelivers the SAME event (still within its own
//           normal at-least-once window) -- inbox INSERT succeeds
//           again because the old row is gone -- DUPLICATE PROCESSING`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team sets their inbox cleanup job to delete rows older than 1 hour, reasoning that "our broker almost always redelivers within a few minutes if it redelivers at all." Their broker\'s documented configuration allows a consumer to be marked unavailable and have its unacknowledged messages redelivered up to 4 hours after the original delivery attempt. What risk does the 1-hour retention window create?',
    hint: 'Compare the cleanup window (1 hour) against the broker\'s actual documented maximum redelivery window (4 hours) -- what happens to an inbox row for a message that gets redelivered somewhere in that gap?',
    solution: 'A genuine correctness bug: any message the broker redelivers between 1 and 4 hours after original processing arrives to find its inbox row already deleted by the overly-aggressive cleanup job. The consumer\'s duplicate-check INSERT succeeds (there\'s no conflicting row anymore), so the consumer treats this LEGITIMATE, still-within-the-broker\'s-own-normal-window redelivery as a brand-new message and reprocesses it -- exactly the duplicate-processing outcome the Inbox pattern exists to prevent. The retention window must safely exceed the broker\'s actual maximum plausible redelivery window (4 hours here, so 1 hour is unsafe) -- "how quickly does redelivery USUALLY happen" is the wrong question; "what is the documented WORST CASE" is the one that determines a safe cleanup window.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Cleaning up old inbox rows is purely a table-size housekeeping concern, similar to cleaning up old Outbox rows.',
      reality: 'Per this subtopic\'s theory, Inbox cleanup timing is a genuine correctness parameter — deleting a row before the broker\'s maximum redelivery window has passed can cause a legitimate late redelivery to be silently reprocessed as if it were new, unlike Outbox cleanup, which has no correctness consequence once a row has been successfully published.'
    },
    {
      thought: 'A retention window should be based on how quickly redelivery usually happens in practice, to avoid keeping the table larger than necessary.',
      reality: 'Per this subtopic\'s theory, the safe retention window must be based on the broker\'s documented WORST CASE redelivery window, not the typical/common case — an occasional slow redelivery that falls just outside a "usually fast enough" retention window still triggers the exact duplicate-processing bug the Inbox pattern exists to prevent.'
    },
    {
      thought: 'Since the Inbox check happens in the same transaction as message processing, it makes sense to run cleanup in that same transaction too, for consistency.',
      reality: 'Per this subtopic\'s theory, cleanup should run as a genuinely separate, periodic background job — folding it into the hot per-message processing path would add unnecessary latency to every single message for a maintenance task with no need to run synchronously.'
    }
  ];
}
