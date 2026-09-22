import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-kafka-order-sqs-dedup',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './random-dedup-id-defeats-sqs-fifo-retry-safety.html',
  styleUrl: './random-dedup-id-defeats-sqs-fifo-retry-safety.scss'
})
export class RandomDedupIdDefeatsSqsFifoRetrySafetySubtopic {
  topicLabel = 'Message Ordering';
  topicRoute = '/messaging/message-ordering';

  theory: TheoryPoint[] = [
    {
      heading: 'Why a Fresh randomUUID() Per Send Is the Wrong Source',
      points: [
        'MessageDeduplicationId exists specifically to protect against a SendMessage call being retried -- either by your own application logic or by the AWS SDK\'s own internal retry behavior after a network timeout.',
        'That protection only works if a genuine retry of the SAME logical send reuses the SAME deduplication ID. Generating it fresh with randomUUID() inside the code that might itself be retried means the retry gets a brand-new, different ID every time.',
        'This is not a hypothetical concern -- it is a documented, real-world bug: a widely used Spring Cloud AWS library (SqsTemplate) shipped exactly this pattern, assigning a random UUID as the deduplication ID on every send, which broke content-based deduplication for anyone relying on it.'
      ]
    },
    {
      heading: 'What a Safe Deduplication ID Looks Like Instead',
      points: [
        'A safe MessageDeduplicationId is derived from the BUSINESS OPERATION being sent, not generated fresh per network call -- exactly the same principle this hub\'s Idempotency & Dedup topic establishes for idempotency keys generally.',
        'For the main page\'s own per-order-event example, orderId + eventType is a natural, stable choice: distinct events for the same order get distinct IDs, but a retried send of the SAME event reuses the SAME ID, letting SQS\'s 5-minute dedup window actually catch it.',
        'The only case where randomUUID() is the right choice is when a message is GENUINELY meant to be treated as unique every single time it is constructed -- which excludes any code path that could itself be retried with the same intended effect.'
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Simulated retry: random vs. stable dedup ID',
      language: 'typescript',
      code: `// A minimal in-memory stand-in for SQS FIFO's 5-minute deduplication
// window, used to demonstrate the difference in behavior.

class FakeFifoQueue {
  private seenDedupIds = new Set<string>();
  private delivered: string[] = [];

  send(dedupId: string, body: string): 'delivered' | 'deduplicated' {
    if (this.seenDedupIds.has(dedupId)) return 'deduplicated';
    this.seenDedupIds.add(dedupId);
    this.delivered.push(body);
    return 'delivered';
  }
}

function simulateRetry(makeDedupId: () => string) {
  const queue = new FakeFifoQueue();
  const dedupId = makeDedupId();

  // Original send -- the request itself succeeds, but the SDK never
  // receives the confirmation (network blip on the way back).
  const first = queue.send(dedupId, 'ORD-001:paid');

  // The SDK's own retry logic resends the SAME logical message.
  // With randomUUID(), makeDedupId() is called AGAIN here and produces
  // a DIFFERENT id than the first attempt used.
  const retryDedupId = makeDedupId.name === 'stableId' ? dedupId : makeDedupId();
  const retry = queue.send(retryDedupId, 'ORD-001:paid');

  return { first, retry };
}

function randomId() { return \`id-\${Math.random().toString(36).slice(2)}\`; }
function stableId() { return 'ORD-001-paid'; }

console.log('Random dedup ID:', simulateRetry(randomId));
// { first: 'delivered', retry: 'delivered' }
// -- the retry is wrongly treated as a brand-new message. Duplicate!

console.log('Stable dedup ID:', simulateRetry(stableId));
// { first: 'delivered', retry: 'deduplicated' }
// -- the retry is correctly recognized and suppressed.`
    }
  ];

  exercise: TryItExercise = {
    prompt: 'A team fixes the random-UUID bug by switching to orderId + eventType as the MessageDeduplicationId. Weeks later, a customer support ticket reports that a legitimate SECOND "paid" event for the same order (a genuine partial-refund-then-repay scenario) never got delivered. What likely broke, and why?',
    hint: 'Think about what makes a dedup ID stable ACROSS retries of the SAME send -- and what happens when that same stability accidentally also collapses two genuinely DIFFERENT events.',
    solution: 'orderId + eventType is stable across retries of the SAME logical send, which is exactly what was needed -- but it is now ALSO stable across two genuinely different "paid" events for the same order, since both produce the identical dedup ID. SQS correctly (from its own point of view) treats the second, legitimate paid event as a duplicate of the first and suppresses it. The fix needs one more piece of specificity -- for example orderId + eventType + a transaction or payment attempt ID -- so retries of the SAME attempt still collapse together, but two genuinely different events do not.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Generating a fresh, guaranteed-unique ID with <code>randomUUID()</code> for every SQS FIFO send is always the safest choice.',
      reality: 'It is the safest choice for guaranteeing uniqueness, but the OPPOSITE of safe for deduplication -- it guarantees a retry of the same send is never recognized as a duplicate, since the retry gets its own fresh, different ID.'
    },
    {
      thought: 'This is a theoretical concern that would not actually happen in a real production codebase.',
      reality: 'A real, publicly filed GitHub issue against a widely used Spring Cloud AWS library reported exactly this bug -- <code>SqsTemplate</code> auto-generating a random deduplication ID on every send, breaking content-based deduplication for its users.'
    },
    {
      thought: 'MessageGroupId and MessageDeduplicationId serve the same purpose, just with different names.',
      reality: 'They are unrelated. MessageGroupId controls ORDERING (all messages in a group are delivered strictly in sequence). MessageDeduplicationId controls DUPLICATE SUPPRESSION within a 5-minute window. A message needs both set correctly, independently.'
    }
  ];
}
