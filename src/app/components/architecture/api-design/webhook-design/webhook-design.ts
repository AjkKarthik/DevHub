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
  {
    heading: 'Designing Webhooks for a Trustworthy Developer Experience',
    points: [
      'Webhook consumers are trusting your service to reliably deliver events to their endpoint — this trust relationship means webhook reliability (retry logic, delivery guarantees, clear failure communication) deserves the same engineering rigor as any core API functionality, not an afterthought bolted onto the main product.',
      'Providing a webhook testing/replay tool (letting developers trigger test events and replay past deliveries against their endpoint) dramatically improves the integration experience — without it, developers must trigger real production events just to test their webhook handler, which is often impractical or risky.',
      'Clear documentation of webhook payload schemas (with versioning) and delivery semantics (at-least-once, ordering guarantees or lack thereof) sets correct expectations upfront — ambiguity here leads directly to consumer bugs when their assumptions about delivery guarantees turn out to be wrong.',
      'A webhook management dashboard (showing delivery history, success/failure rates, and easy resend capability) is genuinely valuable operational tooling for consumers — building this well is a meaningful differentiator between a webhook system developers trust and one they are constantly anxious about.',
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
  { q: 'What is the primary difference between webhooks and polling for receiving event notifications?', options: ['Webhooks are faster because they use UDP instead of TCP for reduced overhead', 'With webhooks the server pushes events to the client immediately when they occur; with polling the client repeatedly requests the server to check for new events', 'Webhooks require a persistent WebSocket connection while polling uses standard stateless HTTP', 'Polling is always less efficient than webhooks regardless of how frequently events occur'], answer: 1, explanation: 'Webhooks (push model): when an event occurs the source system makes an HTTP POST to your registered endpoint immediately. Low latency and no wasted requests when no events occur. Polling (pull model): your system calls the source API repeatedly (every N seconds) to check for changes. Choose polling when: event frequency is high and consistent, or the source does not support webhooks. Choose webhooks when: low latency matters, events are infrequent, and you want to eliminate wasted API calls.' },
  { q: 'How should a webhook receiver verify that a payload came from the expected sender?', options: ['Check that the sender IP address matches the known sender IP address range', 'Compute an HMAC signature of the raw payload using a shared secret and compare it to the signature in the request header', 'Verify the TLS certificate of the sender to confirm their server identity', 'Require Basic Authentication credentials embedded directly in the webhook URL'], answer: 1, explanation: 'HMAC signature verification: the sender computes HMAC-SHA256(sharedSecret, rawPayload) and includes it in a header like X-Signature: sha256=abc123. The receiver independently computes HMAC-SHA256(sharedSecret, rawBody) using the stored shared secret and compares using constant-time comparison to prevent timing attacks. Always compute HMAC over raw body bytes not parsed JSON since serialization differences change byte representation. GitHub uses X-Hub-Signature-256, Stripe uses Stripe-Signature.' },
  { q: 'Why is idempotency critical for webhook handlers and how is it implemented?', options: ['To prevent duplicate events from accumulating in the sender delivery queue', 'Because webhook deliveries may be retried on failure; idempotent handlers process duplicate events safely by checking if the event ID was already processed', 'To ensure webhooks are always delivered in strict chronological order', 'To allow the handler to reject invalid payloads without producing any side effects'], answer: 1, explanation: 'Webhook retry problem: if your endpoint returns non-2xx or times out, the sender retries the delivery. You may receive the same event multiple times. Idempotent handler: use the unique event ID from the payload (Stripe uses evt_123 format, GitHub sends X-GitHub-Delivery header). Before processing, check if this event ID exists in your processed-events store (Redis SET or database table). If already processed, return 200 immediately. If not, process and store the event ID. Store event IDs for at least the sender retry window (typically 72 hours).' },
  { q: 'What is the recommended response strategy for a webhook receiver to ensure reliable delivery?', options: ['Process the event fully before returning a 200 response to ensure data consistency', 'Return a 200 response immediately to acknowledge receipt then process the event asynchronously in a background job', 'Return 202 Accepted and notify the sender when processing is complete via a callback URL', 'Buffer all incoming webhooks in memory and batch-process them every 5 minutes for efficiency'], answer: 1, explanation: 'Acknowledge immediately, process asynchronously. Webhook senders have short timeouts (5-30 seconds). If processing takes longer the sender times out and retries causing duplicate deliveries. Pattern: 1. Receive webhook. 2. Validate signature. 3. Push raw payload to a queue (Redis, SQS, RabbitMQ). 4. Return 200 under 1 second. 5. Background worker processes the event. Never perform database writes or external API calls synchronously in the webhook handler. This decouples processing failures from delivery acknowledgment.' },
  { q: 'What is the primary difference between webhooks and polling for receiving event notifications?', options: ['Webhooks are faster because they use UDP instead of TCP for reduced overhead', 'With webhooks the server pushes events to the client immediately when they occur; with polling the client repeatedly requests the server to check for new events', 'Webhooks require a persistent WebSocket connection while polling uses standard stateless HTTP', 'Polling is always less efficient than webhooks regardless of how frequently events occur'], answer: 1, explanation: 'Webhooks (push model): when an event occurs the source system makes an HTTP POST to your registered endpoint immediately. Low latency and no wasted requests when no events occur. Polling (pull model): your system calls the source API repeatedly (every N seconds) to check for changes. Choose polling when: event frequency is high and consistent, or the source does not support webhooks. Choose webhooks when: low latency matters, events are infrequent, and you want to eliminate wasted API calls.' },
  { q: 'How should a webhook receiver verify that a payload came from the expected sender?', options: ['Check that the sender IP address matches the known sender IP address range', 'Compute an HMAC signature of the raw payload using a shared secret and compare it to the signature in the request header', 'Verify the TLS certificate of the sender to confirm their server identity', 'Require Basic Authentication credentials embedded directly in the webhook URL'], answer: 1, explanation: 'HMAC signature verification: the sender computes HMAC-SHA256(sharedSecret, rawPayload) and includes it in a header like X-Signature: sha256=abc123. The receiver independently computes HMAC-SHA256(sharedSecret, rawBody) using the stored shared secret and compares using constant-time comparison to prevent timing attacks. Always compute HMAC over raw body bytes not parsed JSON since serialization differences change byte representation. GitHub uses X-Hub-Signature-256, Stripe uses Stripe-Signature.' },
  { q: 'Why is idempotency critical for webhook handlers and how is it implemented?', options: ['To prevent duplicate events from accumulating in the sender delivery queue', 'Because webhook deliveries may be retried on failure; idempotent handlers process duplicate events safely by checking if the event ID was already processed', 'To ensure webhooks are always delivered in strict chronological order', 'To allow the handler to reject invalid payloads without producing any side effects'], answer: 1, explanation: 'Webhook retry problem: if your endpoint returns non-2xx or times out, the sender retries the delivery. You may receive the same event multiple times. Idempotent handler: use the unique event ID from the payload (Stripe uses evt_123 format, GitHub sends X-GitHub-Delivery header). Before processing, check if this event ID exists in your processed-events store (Redis SET or database table). If already processed, return 200 immediately. If not, process and store the event ID. Store event IDs for at least the sender retry window (typically 72 hours).' },
  { q: 'What is the recommended response strategy for a webhook receiver to ensure reliable delivery?', options: ['Process the event fully before returning a 200 response to ensure data consistency', 'Return a 200 response immediately to acknowledge receipt then process the event asynchronously in a background job', 'Return 202 Accepted and notify the sender when processing is complete via a callback URL', 'Buffer all incoming webhooks in memory and batch-process them every 5 minutes for efficiency'], answer: 1, explanation: 'Acknowledge immediately, process asynchronously. Webhook senders have short timeouts (5-30 seconds). If processing takes longer the sender times out and retries causing duplicate deliveries. Pattern: 1. Receive webhook. 2. Validate signature. 3. Push raw payload to a queue (Redis, SQS, RabbitMQ). 4. Return 200 under 1 second. 5. Background worker processes the event. Never perform database writes or external API calls synchronously in the webhook handler. This decouples processing failures from delivery acknowledgment.' },
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
  { q: 'What are the key security practices for webhook implementations?', a: 'Signature verification: always verify HMAC signatures before processing; use constant-time string comparison to prevent timing attacks. HTTPS only: reject HTTP (non-TLS) webhook endpoints. Secret rotation: support rotating shared secrets by accepting both old and new secret during a transition window. Timestamp validation: include a timestamp in the signed payload and reject payloads older than 5 minutes to prevent replay attacks (Stripe includes the timestamp in the signed content). IP allowlisting: optionally restrict to known sender IP ranges as defense-in-depth but never as a substitute for signature verification. Always validate payload schema before executing business logic.' },
  { q: 'How should webhook payload structures be designed?', a: 'Include a unique event ID (UUID) for idempotency tracking. Include event type (user.created, order.completed) to route handling logic. Include a timestamp in ISO 8601 format. Include API version so consumers know which schema to expect. Include resource data inline to avoid requiring a follow-up API call for the data. Standard structure: { id, type, created, apiVersion, data: { object: { resource fields } } }. Stripe and GitHub follow this pattern. Avoid payloads that require receivers to call back for data - this increases latency and coupling. Keep payloads under a few KB; use a reference for large data.' },
  { q: 'What is exponential backoff in webhook retry logic and why does it matter?', a: 'When a webhook delivery fails (non-2xx response or timeout) the sender retries with increasing delays. Linear backoff: retry after 1 min, 1 min, 1 min - risky because it hammers an already struggling receiver. Exponential backoff: retry after 1 min, 2 min, 4 min, 8 min, 16 min - gentle on the receiver and gives it time to recover. Exponential backoff with jitter adds randomness (e.g. 1 min plus or minus 30 sec) so multiple failing receivers do not all retry simultaneously and overwhelm the sender. Dead letter queue: events that exhaust all retries go to a DLQ for manual inspection and reprocessing.' },
  { q: 'How do you test webhooks during local development when your server is not publicly accessible?', a: 'Use tunneling tools: ngrok (ngrok http 3000) gives a public HTTPS URL that tunnels to localhost:3000. Register the ngrok URL as the webhook endpoint in the third-party dashboard. Limitation: ngrok URL changes on restart (paid plan provides static URLs). Use provider replay features: Stripe Dashboard and GitHub both have a Redeliver button to resend specific past events to your current endpoint. Build a local simulator: a test script that posts the same JSON payload structure your handler expects. Use RequestBin or webhook.site to capture and inspect raw payloads before writing handler code. Always mock signature verification in unit tests for fast iteration.' },
  { q: 'What are the key security practices for webhook implementations?', a: 'Signature verification: always verify HMAC signatures before processing; use constant-time string comparison to prevent timing attacks. HTTPS only: reject HTTP (non-TLS) webhook endpoints. Secret rotation: support rotating shared secrets by accepting both old and new secret during a transition window. Timestamp validation: include a timestamp in the signed payload and reject payloads older than 5 minutes to prevent replay attacks (Stripe includes the timestamp in the signed content). IP allowlisting: optionally restrict to known sender IP ranges as defense-in-depth but never as a substitute for signature verification. Always validate payload schema before executing business logic.' },
  { q: 'How should webhook payload structures be designed?', a: 'Include a unique event ID (UUID) for idempotency tracking. Include event type (user.created, order.completed) to route handling logic. Include a timestamp in ISO 8601 format. Include API version so consumers know which schema to expect. Include resource data inline to avoid requiring a follow-up API call for the data. Standard structure: { id, type, created, apiVersion, data: { object: { resource fields } } }. Stripe and GitHub follow this pattern. Avoid payloads that require receivers to call back for data - this increases latency and coupling. Keep payloads under a few KB; use a reference for large data.' },
  { q: 'What is exponential backoff in webhook retry logic and why does it matter?', a: 'When a webhook delivery fails (non-2xx response or timeout) the sender retries with increasing delays. Linear backoff: retry after 1 min, 1 min, 1 min - risky because it hammers an already struggling receiver. Exponential backoff: retry after 1 min, 2 min, 4 min, 8 min, 16 min - gentle on the receiver and gives it time to recover. Exponential backoff with jitter adds randomness (e.g. 1 min plus or minus 30 sec) so multiple failing receivers do not all retry simultaneously and overwhelm the sender. Dead letter queue: events that exhaust all retries go to a DLQ for manual inspection and reprocessing.' },
  { q: 'How do you test webhooks during local development when your server is not publicly accessible?', a: 'Use tunneling tools: ngrok (ngrok http 3000) gives a public HTTPS URL that tunnels to localhost:3000. Register the ngrok URL as the webhook endpoint in the third-party dashboard. Limitation: ngrok URL changes on restart (paid plan provides static URLs). Use provider replay features: Stripe Dashboard and GitHub both have a Redeliver button to resend specific past events to your current endpoint. Build a local simulator: a test script that posts the same JSON payload structure your handler expects. Use RequestBin or webhook.site to capture and inspect raw payloads before writing handler code. Always mock signature verification in unit tests for fast iteration.' },
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
