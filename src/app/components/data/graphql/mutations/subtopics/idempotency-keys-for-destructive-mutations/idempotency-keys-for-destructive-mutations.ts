import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-idempotency-keys-for-destructive-mutations',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './idempotency-keys-for-destructive-mutations.html',
  styleUrl: './idempotency-keys-for-destructive-mutations.scss',
})
export class IdempotencyKeysForDestructiveMutationsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The QnA names the fix, but never builds it',
      points: [
        'The main page\'s own QnA says destructive or side-effectful mutations "should be guarded with deduplication tokens" — in one sentence, with no code anywhere on the page showing what that actually looks like.',
        'The problem it solves: a client sends <code>processPayment</code>, the server charges the card successfully, but the response is lost to a network timeout before the client sees it. The client\'s retry logic — reasonably — sends the exact same mutation again. Without a guard, that is a second, real charge.',
        'An idempotency key is a client-generated identifier (typically a UUID) sent as part of the mutation input, unique per LOGICAL operation attempt — not per HTTP request. The client generates it once and reuses the SAME key on every retry of that same logical attempt.',
      ],
    },
    {
      heading: 'What the server actually does with it',
      points: [
        'Before doing the real side effect, the resolver checks whether that key has already been processed. If it has, it returns the STORED result from the first attempt — with no second charge, no second email, no second anything.',
        'If it has not been seen before, the resolver performs the real work, then stores the key alongside the result before returning, so a future retry with the same key hits the cached branch.',
        'This is a different mechanism from the "not a transaction" gap covered in the previous subtopic. Serial execution controls the ORDER of independent root fields; an idempotency key controls REPEATED execution of the SAME logical mutation call across retries. They solve two different problems.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Schema + guarded resolver',
      language: 'typescript',
      code: `# Schema -- idempotencyKey travels inside the input, like any other field
input ProcessPaymentInput {
  idempotencyKey: ID!
  amount: Int!
  orderId: ID!
}
type ProcessPaymentPayload { paymentId: ID!; status: String!; replayed: Boolean! }
type Mutation { processPayment(input: ProcessPaymentInput!): ProcessPaymentPayload! }

// Resolver
const processedKeys = new Map<string, { paymentId: string; status: string }>();

async function processPayment(
  _: unknown,
  { input }: { input: { idempotencyKey: string; amount: number; orderId: string } },
  { paymentGateway }: { paymentGateway: (amount: number, orderId: string) => Promise<{ id: string }> },
) {
  const cached = processedKeys.get(input.idempotencyKey);
  if (cached) {
    return { ...cached, replayed: true };
  }

  const charge = await paymentGateway(input.amount, input.orderId);
  const result = { paymentId: charge.id, status: 'succeeded' };
  processedKeys.set(input.idempotencyKey, result);
  return { ...result, replayed: false };
}`,
    },
    {
      label: 'A real retry, traced',
      language: 'typescript',
      code: `let realChargeCalls = 0;
const fakeGateway = async (amount: number, orderId: string) => {
  realChargeCalls++;
  return { id: \`ch_\${realChargeCalls}\` };
};

// First attempt: real charge.
const r1 = await processPayment(null,
  { input: { idempotencyKey: 'key-1', amount: 5000, orderId: 'o1' } },
  { paymentGateway: fakeGateway });
console.log(r1, 'realChargeCalls:', realChargeCalls);
// { paymentId: 'ch_1', status: 'succeeded', replayed: false }  realChargeCalls: 1

// Client's network timed out and it retries with the SAME idempotencyKey.
const r2 = await processPayment(null,
  { input: { idempotencyKey: 'key-1', amount: 5000, orderId: 'o1' } },
  { paymentGateway: fakeGateway });
console.log(r2, 'realChargeCalls:', realChargeCalls);
// { paymentId: 'ch_1', status: 'succeeded', replayed: true }  realChargeCalls: 1 -- NOT charged again

// A genuinely different payment (new key) still charges for real.
const r3 = await processPayment(null,
  { input: { idempotencyKey: 'key-2', amount: 2000, orderId: 'o2' } },
  { paymentGateway: fakeGateway });
console.log(r3, 'realChargeCalls:', realChargeCalls);
// { paymentId: 'ch_2', status: 'succeeded', replayed: false }  realChargeCalls: 2`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team implements idempotency by keying the cache on <code>orderId</code> instead of a client-generated <code>idempotencyKey</code>. What real scenario does this break that a proper idempotency key would not?',
    hint: 'What if a customer genuinely wants to retry a DIFFERENT payment attempt for the same order — after correcting a declined card, say?',
    solution: `Keying on orderId conflates "this is a retry of the exact same attempt" with "this is a new attempt against the same order" -- the two are not the same thing. If a customer's card is declined and they correct it and try again for the SAME order, an orderId-keyed guard would incorrectly treat the second, genuinely different attempt as a duplicate and return the (failed or stale) cached result instead of actually processing the new charge.

A client-generated idempotencyKey avoids this because the CLIENT decides what counts as "the same logical attempt" -- it generates one key when the user clicks "Pay" and reuses that exact key only for retries of that specific click (network timeout, 5xx, etc.). A second, deliberate retry after fixing the card is a NEW user action, so the client generates a NEW key, and the server correctly processes it as a fresh charge rather than replaying the old failure.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Idempotency keys and serial mutation execution solve the same problem."',
      reality: 'They solve different problems. Serial execution controls the ORDER independent root mutation fields run in, within one request. An idempotency key prevents the SAME logical mutation attempt from being executed twice across separate retried requests.',
    },
    {
      thought: '"Any unique-ish identifier, like orderId, works fine as the idempotency key."',
      reality: 'orderId identifies the ENTITY, not the ATTEMPT. Using it as the key conflates a genuine retry of the same click with a deliberate new attempt against the same order — the client-generated key exists specifically to distinguish those two cases.',
    },
    {
      thought: '"Storing the idempotency key result in memory (a Map) is fine for production."',
      reality: 'It is fine for a demo. A real deployment needs the key store to survive a server restart and be shared across every server instance handling retries — typically a database row or a Redis key with a TTL, not process memory.',
    },
  ];

  topicLabel = 'Mutations';
  topicRoute = '/graphql/mutations';
  prev: SubtopicLink | null = {
    label: 'Serial Execution Is Not a Transaction',
    route: '/graphql/mutations/serial-execution-is-not-a-transaction',
  };
  next: SubtopicLink | null = null;
}
