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
  templateUrl: './exactly-once-vs-at-least-once.html',
  styleUrl: './exactly-once-vs-at-least-once.scss'
})
export class ExactlyOnceContradictsPagesOwnAtLeastOnceTheorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Challenge requirement that contradicts the page\'s own Theory section',
      points: [
        'The main page\'s Challenge originally asked to design for "Exactly-once delivery (no duplicates on retry)." The SAME page\'s own Theory section, in "Message Delivery Guarantees and Ordering," states: "At-least-once delivery (the common default for chat systems)... requires the client to deduplicate messages by a unique message ID." These two statements describe different delivery models — the Challenge asked for one thing while the Theory section (correctly) says the actual default approach is something else. The page has been corrected to ask for "effectively-once" delivery, matching its own Theory section.',
        'This is catchable purely by reading the page\'s own two claims against each other — no distributed-systems research needed to spot the inconsistency, just noticing "exactly-once" and "at-least-once + dedup" are being used to describe the same system in two different places.',
      ]
    },
    {
      heading: 'Why "exactly-once" and "at-least-once + dedup" are genuinely different guarantees',
      points: [
        'True exactly-once delivery means a message is delivered to the recipient exactly one time, with no possibility of either loss OR duplication, and the SENDING system itself never needs to retry or the recipient never needs to deduplicate anything — the guarantee holds at the transport/protocol level.',
        'At-least-once delivery + idempotency-key deduplication (often called "effectively-once" from the end user\'s perspective) is a different, more achievable design: the SAME message may genuinely be delivered more than once (e.g. a retry after a network timeout where the first attempt actually succeeded), but the recipient discards duplicates it has already seen by checking each message\'s unique ID against ones it has already processed.',
        'The architecture the main page\'s own code samples actually describe — persist to DB, then publish to Redis, with a client-side idempotency key on retries — is the at-least-once + dedup pattern, not true exactly-once. A crash between the persist step and the publish step (or a client retry after a timed-out request that actually succeeded server-side) can produce exactly the duplicate-delivery scenario that "exactly-once" claims cannot happen.',
      ]
    },
    {
      heading: 'Why this distinction matters beyond terminology',
      points: [
        'True exactly-once delivery across an unreliable network is a famously difficult (and in the fully general case, provably impossible without additional constraints) distributed-systems problem — claiming it as a requirement sets an unrealistic bar that the rest of the page\'s own design doesn\'t actually meet.',
        'Naming the guarantee correctly ("effectively-once" via at-least-once + idempotency key) is not just more accurate — it also correctly signals to whoever implements the client that duplicate messages CAN arrive over the wire and MUST be deduplicated locally, rather than assuming the transport layer already guarantees uniqueness.',
        'This same distinction appears constantly in interview settings: being asked to design "exactly-once" messaging is a common trap, since the interviewer is usually testing whether the candidate reaches for the achievable at-least-once + idempotent-consumer pattern rather than promising a guarantee the underlying network can\'t actually provide.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Idempotency-key dedup — the mechanism behind "effectively-once"',
      language: 'typescript',
      code: `interface IncomingMessage {
  idempotencyKey: string; // client-generated, stable across retries
  convId: string;
  content: string;
}

// A durable set of recently-seen idempotency keys (Redis, TTL'd)
async function handleSendWithDedup(msg: IncomingMessage): Promise<void> {
  const alreadySeen = await redis.set(
    \`dedup:\${msg.idempotencyKey}\`,
    '1',
    { NX: true, EX: 86_400 } // NX: only set if not already present
  );

  if (!alreadySeen) {
    // This exact idempotencyKey was already processed -- this is a
    // RETRY of a message that was already persisted and delivered.
    // Silently succeed without re-persisting or re-delivering.
    return;
  }

  // First time seeing this idempotencyKey -- persist + deliver as normal.
  await persistAndDeliver(msg);
}

// Note what this DOESN'T do: it doesn't prevent the message from ever
// being sent twice over the network (a retry can still happen) -- it
// prevents a duplicate from being processed TWICE. That's "effectively
// once" from the recipient's point of view, not true exactly-once.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A system design write-up asks a candidate to design "exactly-once message delivery," then in its own theory notes elsewhere states that the actual architecture uses "at-least-once delivery... requires the client to deduplicate messages by a unique message ID." What is inconsistent here, and what should the requirement actually say?',
    hint: 'If a client sometimes needs to deduplicate messages by ID, does that mean the network/server layer ever delivers the same message more than once?',
    solution: 'The requirement should say "effectively-once delivery" (at-least-once delivery + idempotency-key deduplication), not "exactly-once." If deduplication is needed at all, that is proof duplicates CAN occur at the transport/server layer — true exactly-once delivery would mean duplicates never happen in the first place, making client-side dedup logic unnecessary. The architecture described (persist message, then publish; client retries with an idempotency key on timeout) is the standard at-least-once + dedup pattern: a message actually CAN be delivered twice over the wire (e.g. after a retried request that had actually already succeeded), but the recipient discards the second copy by checking its idempotency key against ones already seen — producing a system that behaves as if each message arrived exactly once, without literally guaranteeing that at the network level.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Exactly-once delivery" and "at-least-once delivery with client-side deduplication" describe the same underlying guarantee, just with different names.',
      reality: 'Per this subtopic\'s theory, they are genuinely different: exactly-once means a duplicate can never occur at all, while at-least-once + dedup means duplicates CAN occur over the wire but are filtered out before being processed twice — the end result looks similar to the user, but the underlying guarantee (and what can go wrong) is different.'
    },
    {
      thought: 'Since idempotency keys successfully prevent a user from ever seeing a duplicate message, the system can accurately be described as providing exactly-once delivery.',
      reality: 'Per this subtopic\'s theory, idempotency-key dedup produces what is precisely termed "effectively-once" behavior from the end user\'s perspective — the more precise and universally understood term for the underlying guarantee is at-least-once delivery plus deduplication, not exactly-once, which describes a stronger and much harder-to-achieve property.'
    },
    {
      thought: 'True exactly-once delivery is a solved, commonly-implemented feature in real-world messaging and chat systems.',
      reality: 'Per this subtopic\'s theory, true exactly-once delivery across an unreliable network is a famously difficult distributed-systems problem — most production chat/messaging systems (including the architecture this very page describes) actually implement the achievable at-least-once + idempotent-consumer pattern instead, not literal exactly-once semantics.'
    }
  ];
}
