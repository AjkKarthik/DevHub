import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Webhook',            type: 'keyword', desc: 'Outbound HTTP POST callback from your API to a consumer-registered endpoint when an event occurs.' },
  { name: 'HMAC Signature',     type: 'keyword', desc: 'X-Signature header: HMAC-SHA256 of the payload with a shared secret — proves authenticity.' },
  { name: 'Idempotency Key',    type: 'keyword', desc: 'Unique event ID in the payload — consumer deduplicates retried deliveries with this key.' },
  { name: 'Exponential Backoff', type: 'keyword', desc: 'Retry delays: 1m, 5m, 30m, 2h, ... — reduces load on failing consumer endpoints.' },
  { name: 'Event Envelope',     type: 'keyword', desc: 'Consistent wrapper: { id, type, created, data: {...} } — same shape for all event types.' },
  { name: 'Dead Letter Queue',  type: 'keyword', desc: 'Store undeliverable webhooks after all retries fail — allows manual replay or alerting.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What are Webhooks?',
    points: [
      'A webhook is an outbound HTTP POST request from your server to a URL registered by the consumer — triggered when an event occurs in your system.',
      'Pattern: consumer registers a URL (e.g., https://consumer.com/webhooks); your server POSTs event payloads to it when something happens (order created, payment succeeded).',
      'Webhooks are "reverse APIs" — instead of the consumer polling your API, your API calls the consumer. More efficient for event-driven integrations.',
      'Consumers must expose a public HTTPS endpoint to receive webhooks. This makes local development harder (use ngrok, webhook.site, or Svix CLI for testing).',
    ],
  },
  {
    heading: 'Webhook Security — HMAC Signatures',
    points: [
      'Without authentication, anyone can POST to your consumer\'s webhook URL with a fake payload. HMAC signatures prove the request came from your server.',
      'Pattern: compute HMAC-SHA256 of the raw request body using a per-consumer secret. Send as X-Signature-256: sha256=<hex> header.',
      'Consumer verifies: compute HMAC-SHA256 of the received body using the shared secret; compare with the header value using a timing-safe comparison (not ===).',
      'Use a timing-safe comparison (crypto.timingSafeEqual) — regular === is vulnerable to timing attacks that reveal how many characters matched.',
    ],
  },
  {
    heading: 'Reliable Delivery — Retry Strategy',
    points: [
      'Network failures, consumer downtime, and transient errors mean webhook deliveries fail. Implement retry with exponential backoff: 1m, 5m, 30m, 2h, 12h.',
      'Any non-2xx response is a delivery failure. Even if the consumer processes the event, returning 500 causes a retry — consumers must return 200 quickly (under 5 seconds).',
      'Idempotency: retries mean the same event is delivered multiple times. Consumers MUST be idempotent — use the event ID to check if the event was already processed.',
      'After all retries fail, move to a Dead Letter Queue (DLQ) — log for manual inspection, alerting, and optional manual replay.',
    ],
  },
  {
    heading: 'Payload Design',
    points: [
      'Use a consistent event envelope for all event types: `{ id, type, created, data: { ... } }`. Consumers can write generic handling logic.',
      'Include the full resource in data (not just the ID). Consumers should not need to call your API back to get the data they need — that defeats the purpose of the webhook.',
      'Timestamp in ISO 8601 / Unix epoch. Version the event type: `order.created.v2`. The event type is the primary routing mechanism for consumer processing.',
      'Include the API version or schema version in the payload so consumers can adapt as your schema evolves.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Webhook Sender',
    language: 'typescript',
    code: `import crypto from 'crypto';
import { Queue } from 'bullmq';

const webhookQueue = new Queue('webhooks');

// Dispatch a webhook event — queued for reliable delivery
async function dispatchWebhook(event: WebhookEvent, subscriptions: Subscription[]) {
  for (const sub of subscriptions) {
    await webhookQueue.add('deliver', {
      url: sub.url,
      secret: sub.secret,
      payload: {
        id: crypto.randomUUID(),   // idempotency key
        type: event.type,          // 'order.created', 'payment.succeeded'
        created: Math.floor(Date.now() / 1000), // Unix timestamp
        data: event.data,          // full resource — not just an ID
        apiVersion: '2024-01-15',
      },
    }, {
      attempts: 6,
      backoff: { type: 'exponential', delay: 60_000 }, // 1m, 2m, 4m, 8m, 16m, 32m
    });
  }
}

// Worker: deliver one webhook with HMAC signature
async function deliverWebhook({ url, secret, payload }: DeliveryJob) {
  const body = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Id': payload.id,
      'X-Webhook-Timestamp': String(payload.created),
      'X-Signature-256': \`sha256=\${sig}\`,
    },
    body,
    signal: AbortSignal.timeout(10_000), // 10s timeout
  });

  if (!response.ok) {
    throw new Error(\`Webhook delivery failed: \${response.status}\`);
    // BullMQ retries with exponential backoff on throw
  }

  await db.webhookLogs.create({
    eventId: payload.id, url, statusCode: response.status, delivered: true,
  });
}`,
  },
  {
    label: 'Webhook Receiver',
    language: 'typescript',
    code: `import crypto from 'crypto';
import express from 'express';
const app = express();

// IMPORTANT: use raw body for HMAC verification (not parsed JSON)
app.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
  // 1. Verify HMAC signature
  const sigHeader = req.headers['x-signature-256'] as string;
  const expectedSig = 'sha256=' + crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(req.body)  // raw Buffer — NOT req.body after JSON.parse
    .digest('hex');

  // Timing-safe comparison — prevents timing attacks
  if (!sigHeader || !crypto.timingSafeEqual(
    Buffer.from(sigHeader), Buffer.from(expectedSig)
  )) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Parse payload
  const event = JSON.parse(req.body.toString());

  // 3. Verify timestamp to prevent replay attacks (reject events older than 5 minutes)
  const fiveMinutes = 5 * 60;
  if (Math.floor(Date.now() / 1000) - event.created > fiveMinutes) {
    return res.status(400).json({ error: 'Stale event' });
  }

  // 4. Return 200 IMMEDIATELY — process asynchronously
  res.status(200).json({ received: true });

  // 5. Idempotency check — did we already process this event?
  const alreadyProcessed = await db.processedEvents.findById(event.id);
  if (alreadyProcessed) return; // duplicate delivery — skip

  // 6. Mark as processed BEFORE handling (prevents double-processing on crash)
  await db.processedEvents.create({ id: event.id, type: event.type });

  // 7. Route to handler
  switch (event.type) {
    case 'order.created':    await handleOrderCreated(event.data); break;
    case 'payment.succeeded': await handlePaymentSucceeded(event.data); break;
    default: console.warn('Unknown event type:', event.type);
  }
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not verifying the HMAC signature on incoming webhooks',
    wrong: `app.post('/webhooks', (req, res) => {
  // Anyone can POST here with a fake payload — no authentication!
  processEvent(req.body);
  res.sendStatus(200);
});`,
    right: `// Verify HMAC-SHA256 signature using timing-safe comparison
const expectedSig = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
if (!crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expectedSig))) {
  return res.status(401).end();
}`,
    explanation: 'Without HMAC verification, anyone who discovers your webhook URL can POST fake events. HMAC proves the payload was signed with the shared secret — only your webhook sender knows it. Use timingSafeEqual, not ===, to prevent timing attacks.',
  },
  {
    title: 'Doing heavy processing before returning 200',
    wrong: `app.post('/webhooks', async (req, res) => {
  await processOrderPayment(req.body); // takes 10 seconds
  res.sendStatus(200); // sender times out (usually 5-10s limit) → retries
});`,
    right: `app.post('/webhooks', async (req, res) => {
  res.status(200).json({ received: true }); // respond IMMEDIATELY
  // Then process asynchronously — queue job, spawn task, etc.
  await jobQueue.add('process-webhook', req.body);
});`,
    explanation: 'Webhook senders time out quickly (typically 5-10 seconds). If your processing takes longer, the sender receives a timeout, assumes delivery failed, and retries — potentially processing the event twice. Always return 200 immediately and process asynchronously.',
  },
  {
    title: 'Not making webhook consumers idempotent',
    wrong: `case 'order.paid':
  await chargeCustomer(event.data.amount); // if delivered twice → charged twice!`,
    right: `case 'order.paid':
  const alreadyProcessed = await db.events.findById(event.id);
  if (alreadyProcessed) return; // duplicate — skip
  await db.events.create({ id: event.id });
  await chargeCustomer(event.data.amount); // safe — runs once`,
    explanation: 'Webhooks are delivered at least once — network failures cause retries even after successful processing. Consumers MUST be idempotent. Record processed event IDs and check before handling. The event.id (UUID) is the idempotency key.',
  },
  {
    title: 'Sending only the resource ID instead of the full payload',
    wrong: `// Consumer must call back to get the data — unnecessary round trip
{ type: 'order.created', data: { orderId: '42' } }`,
    right: `// Include the full resource — consumer has everything they need
{ type: 'order.created', data: { id: '42', status: 'pending', total: 99.99, customer: {...}, items: [...] } }`,
    explanation: 'Sending only an ID forces consumers to call your API back to get the data they need. This is an extra round trip under your API\'s load. Include the full resource in the webhook payload — consumers process it immediately without additional API calls.',
  },
];

const challenge: Challenge = {
  title: 'HMAC Signature Verifier',
  language: 'typescript',
  description: `Implement verifyWebhookSignature(payload: string, secret: string, signatureHeader: string): boolean that:
1. Computes HMAC-SHA256 of payload using secret
2. Formats as 'sha256=' + hexDigest
3. Compares with signatureHeader (timing-safe: compare lengths first, then use a character-by-character match)
Return true if signatures match, false otherwise.
Note: In real code use crypto.timingSafeEqual — here simulate with a character loop.`,
  hints: [
    'Use a simple HMAC simulation: sum of charCodes XOR secret charCodes',
    'Compare character by character to simulate timing-safe comparison',
  ],
  starterCode: `function verifyWebhookSignature(payload: string, secret: string, signatureHeader: string): boolean {
  // Simulate HMAC: sum of (payload[i].charCodeAt XOR secret[i % secret.length].charCodeAt)
  // Format as 'sha256=' + sum.toString(16)
  // Compare with signatureHeader
  return false;
}`,
  solution: `function verifyWebhookSignature(payload: string, secret: string, signatureHeader: string): boolean {
  // Simulate HMAC (simplified for the challenge)
  let sum = 0;
  for (let i = 0; i < payload.length; i++) {
    sum += payload.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
  }
  const expected = 'sha256=' + sum.toString(16);

  // Timing-safe comparison — check every character regardless of early mismatch
  if (expected.length !== signatureHeader.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signatureHeader.charCodeAt(i);
  }
  return diff === 0;
}

const payload = 'hello world';
const secret = 'mysecret';
const sig = verifyWebhookSignature(payload, secret, 'sha256=invalid');
console.log(sig); // false`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Why must webhook consumers return 200 immediately and process asynchronously?',
    options: [
      'Webhook senders enforce a maximum response body size',
      'Webhook senders time out quickly (5-10s) — a timeout is treated as failure and triggers a retry',
      'HTTP/1.1 does not allow response bodies on POST endpoints',
      'Asynchronous processing is required for HMAC signature verification',
    ],
    answer: 1,
    explanation: 'Webhook senders enforce a timeout (typically 5-10 seconds). If your processing takes longer, the sender receives a timeout, marks the delivery as failed, and retries — potentially processing the event twice. Return 200 immediately to acknowledge receipt, then process via a background job queue.',
  },
  {
    q: 'What is the purpose of the idempotency key (event ID) in webhook payloads?',
    options: [
      'To encrypt the webhook payload for security',
      'To allow consumers to detect and skip duplicate deliveries caused by retries',
      'To correlate the webhook with the original API request',
      'To identify which webhook endpoint should receive the event',
    ],
    answer: 1,
    explanation: 'Webhooks are delivered "at least once" — retries mean the same event may be delivered multiple times. The idempotency key (a unique UUID per event) lets consumers check "have I already processed this event?" before handling it. Without idempotency, retried deliveries cause duplicate processing (e.g., charging a customer twice).',
  },
];

const qna: QnaItem[] = [
  {
    q: 'How do you test webhooks during local development?',
    a: 'Several options: <ol><li><strong>ngrok</strong>: <code>ngrok http 3000</code> creates a public HTTPS URL that tunnels to your local port. Use the ngrok URL as your webhook endpoint in the provider\'s dashboard</li><li><strong>webhook.site</strong>: a free service that gives you a public URL and shows all received requests in a browser dashboard — great for inspecting webhook payloads</li><li><strong>Stripe CLI / GitHub CLI</strong>: provider-specific CLIs that forward webhooks to localhost: <code>stripe listen --forward-to localhost:3000/webhooks</code></li><li><strong>Svix CLI</strong>: open-source webhook infrastructure with local forwarding support</li></ol>For CI/testing: use a mock/stub webhook receiver that asserts payloads, or test the HMAC verification and event handling logic unit-test style without needing a real incoming request.',
  },
  {
    q: 'How do you implement webhook fan-out to thousands of subscribers?',
    a: 'Don\'t deliver webhooks synchronously in the request handler — that blocks and creates a thundering herd. Use a job queue: <ol><li>On event: insert one job per subscriber into a distributed queue (BullMQ/Redis, SQS, RabbitMQ)</li><li>Worker pool processes delivery jobs concurrently with rate-limiting per subscriber</li><li>Failed deliveries retry with exponential backoff</li><li>After max retries, move to Dead Letter Queue</li></ol>For very high fan-out (millions of subscribers), use a stream like Kafka: publish one event, consumers groups process their subscriptions independently. Services like Svix, Hookdeck, or AWS EventBridge handle this infrastructure for you.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Webhooks are outbound HTTP POSTs triggered by events — verify with HMAC-SHA256, return 200 immediately, process async, deduplicate with event ID.',
  mustKnow: [
    'Webhook: server POSTs to consumer URL on event — reverse API, no polling needed',
    'HMAC-SHA256 signature in X-Signature-256 header — verify with timingSafeEqual()',
    'Return 200 immediately — queue heavy processing; senders retry on non-2xx or timeout',
    'Idempotency: check event.id before processing — retries deliver same event multiple times',
    'Include full resource in payload — consumers should not need to call back for data',
    'Retry strategy: exponential backoff (1m → 5m → 30m → 2h); DLQ after max retries',
  ],
  interviewFocus: [
    'How do you verify that a webhook came from a trusted source?',
    'Why must webhook consumers be idempotent?',
    'How do you ensure reliable webhook delivery with retries?',
  ],
};

@Component({
  selector: 'app-api-webhook-design',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './webhook-design.html',
  styleUrl: './webhook-design.scss',
})
export class ApiWebhookDesign {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
