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
  templateUrl: './fifo-deduplication-silently-drops-not-just-blocks.html',
  styleUrl: './fifo-deduplication-silently-drops-not-just-blocks.scss'
})
export class FifoDeduplicationSilentlyDropsNotJustBlocksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames FIFO dedup as a clean guarantee — never what actually happens to a "duplicate" SendMessage call',
      points: [
        'The main page\'s own quickRef states: "SQS FIFO Queue: Exactly-once processing, strict ordering per message group ID; 300 TPS..." The main page\'s own codeTabs create a FIFO queue with ContentBasedDeduplication=true and, separately, send a message with an explicit --message-deduplication-id — two real mechanisms shown side by side, with no explanation of what SQS actually does when it detects a duplicate.',
        'The main page\'s own mistake entry on idempotency frames FIFO purely as the alternative to Standard queues\' at-least-once duplicate-delivery problem — implicitly treating FIFO dedup as something that fully "solves" duplicates, never covering FIFO\'s own distinct failure mode: unintentionally deduplicating two genuinely DIFFERENT logical messages.',
      ]
    },
    {
      heading: 'A "duplicate" SendMessage call succeeds silently — and tracking outlives the original message\'s own lifecycle',
      points: [
        'Per AWS\'s own documentation: "If Amazon SQS has already accepted a message with a specific deduplication ID, any subsequent messages with the same ID will be acknowledged but not delivered to consumers." The SendMessage API call for the "duplicate" still returns success — a valid MessageId, no error, no warning — with nothing in the API response itself indicating the message was silently dropped.',
        'AWS states directly that this isn\'t scoped to messages currently in the queue: "Amazon SQS continues tracking the deduplication ID even after the message has been received and deleted." The 5-minute deduplication window is measured from the ORIGINAL message\'s acceptance time, not from when it was processed — a second, genuinely distinct message sent with the same dedup ID (or, under ContentBasedDeduplication, the same body) minutes after the first was already fully processed and gone from the queue is still silently dropped if it falls inside that window.',
        'This is a real risk specifically for ContentBasedDeduplication (a SHA-256 hash of the message body, used as the dedup ID automatically) — two DIFFERENT logical events that happen to produce byte-identical JSON bodies within the same 5-minute window (e.g. two separate, intentional "retry this exact order" events with identical fields) hash to the same dedup ID, and the second is silently discarded exactly as if it were a genuine accidental duplicate.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing a silent drop on the main page\'s own payments.fifo queue',
      language: 'bash',
      code: `# The main page's own FIFO queue, unchanged:
aws sqs create-queue \\
  --queue-name payments.fifo \\
  --attributes FifoQueue=true,ContentBasedDeduplication=true,VisibilityTimeout=30

# A genuine, intentional order-retry event -- body content matters
# here, since ContentBasedDeduplication hashes it:
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --message-body '{"customerId":"cust1","amount":50,"reason":"retry"}' \\
  --message-group-id cust1
# {
#   "MessageId": "aaa-111",
#   "SequenceNumber": "..."
# }
# -- accepted normally.

# 3 minutes later: a SEPARATE, also-intentional retry event with the
# EXACT SAME body content (same customer, same amount, same reason)
# -- a real scenario if a customer cancels and re-triggers an
# identical retry through a UI within a few minutes:
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --message-body '{"customerId":"cust1","amount":50,"reason":"retry"}' \\
  --message-group-id cust1
# {
#   "MessageId": "bbb-222",   <- a DIFFERENT MessageId, still "success"
#   "SequenceNumber": "..."
# }
# -- per AWS's own docs, this is "acknowledged but not delivered" --
# nothing in this response indicates the message was dropped.

# Confirm only ONE message was ever actually delivered:
aws sqs receive-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --max-number-of-messages 10 --wait-time-seconds 5
# -- only 1 message returned, even though BOTH send-message calls
# reported success with distinct MessageIds.`,
    },
    {
      label: 'Tracking outlives the original — and the fix',
      language: 'bash',
      code: `# Fully process and delete the first message:
aws sqs delete-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --receipt-handle "<receipt-handle-from-receive>"

# STILL within the original 5-minute window (measured from the
# FIRST message's acceptance, not from this deletion) -- send a
# third, again-intentional retry with the identical body:
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --message-body '{"customerId":"cust1","amount":50,"reason":"retry"}' \\
  --message-group-id cust1
# -- still "acknowledged but not delivered" per AWS's own docs:
# "Amazon SQS continues tracking the deduplication ID even after the
# message has been received and deleted." The original message being
# long gone from the queue does not reset or shorten the window.

# The fix -- stop relying on ContentBasedDeduplication for events
# that could legitimately repeat with identical content; use an
# explicit MessageDeduplicationId built from something that DOES
# vary per logical event, not per content:
aws sqs send-message \\
  --queue-url https://sqs.us-east-1.amazonaws.com/123/payments.fifo \\
  --message-body '{"customerId":"cust1","amount":50,"reason":"retry"}' \\
  --message-group-id cust1 \\
  --message-deduplication-id "cust1-retry-$(uuidgen)"
# -- a fresh UUID per logical retry event means two intentionally
# separate retries with identical bodies are no longer conflated,
# while accidental network-level re-sends (which would resubmit the
# SAME dedup ID) are still correctly deduplicated.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own FIFO pattern, a payments team relies on ContentBasedDeduplication to naturally absorb accidental double-submissions from network retries and double-clicks at the API layer — reasoning that "exactly-once" FIFO handles this for free. Weeks later, a support ticket reports that a customer\'s SECOND, entirely intentional retry of an identical order (cancelled, then re-placed with the exact same items and amount, four minutes later) never reached fulfillment — with no error anywhere in the application or infrastructure logs. Using this subtopic\'s theory, diagnose the cause.',
    hint: 'The two orders had identical bodies. What does ContentBasedDeduplication actually use as the deduplication ID, and does SQS distinguish "this is the SAME logical event resent" from "this is a DIFFERENT event that happens to look identical"?',
    solution: 'Per this subtopic\'s theory, this is exactly the ContentBasedDeduplication risk: SQS hashes the message BODY to derive the deduplication ID, with no way to know that two identical-looking messages actually represent two separate, intentional customer actions rather than one accidental resend. Because the customer\'s second order had byte-identical content (same customer, same items, same amount) to the first, and was sent within the same 5-minute deduplication window, SQS treated it as a duplicate of the first — per AWS\'s own documentation, it was "acknowledged but not delivered." The SendMessage call for the second order succeeded normally from the application\'s point of view (a valid MessageId was returned), which is exactly why no error appeared anywhere — there was nothing to log, since nothing failed from the API\'s perspective. The fix is to stop relying purely on ContentBasedDeduplication for this event type and instead supply an explicit MessageDeduplicationId that incorporates something which genuinely varies per logical event (a fresh UUID generated at the moment of each customer action, for example) — this still correctly deduplicates true accidental resends (which would reuse the exact same generated ID) while no longer conflating two separate, intentional events that simply happen to share identical content.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A "duplicate" SendMessage call to a FIFO queue with a matching deduplication ID fails or returns an error, so the calling application immediately knows the message wasn\'t delivered.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation states the SendMessage call for a duplicate "will be acknowledged but not delivered to consumers" — it returns success with a valid MessageId, with nothing in the response indicating the message was silently dropped.'
    },
    {
      thought: 'FIFO deduplication is scoped only to messages currently sitting in the queue — once the original message has been received and deleted, the same deduplication ID becomes safe to reuse.',
      reality: 'Per this subtopic\'s theory, AWS explicitly states "Amazon SQS continues tracking the deduplication ID even after the message has been received and deleted" — the 5-minute window is measured from original acceptance, independent of whether the message has already been fully processed and removed.'
    },
    {
      thought: 'ContentBasedDeduplication is purely a convenience with no downside compared to explicit deduplication IDs — it can never cause a deduplication problem that explicit IDs wouldn\'t also have.',
      reality: 'Per this subtopic\'s exercise, ContentBasedDeduplication introduces a distinct risk explicit IDs don\'t automatically share — two genuinely different logical events with identical message bodies collide on the same content-derived hash, silently dropping the second one, unless the application deliberately varies the body or supplies its own explicit ID instead.'
    }
  ];
}
