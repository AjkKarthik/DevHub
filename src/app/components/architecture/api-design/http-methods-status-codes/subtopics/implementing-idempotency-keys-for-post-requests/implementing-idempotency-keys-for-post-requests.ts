import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Named in the QnA’s Own Idempotency Explanation — Never Actually Built',
    points: [
      'The main page’s own QnA states the mechanism precisely: "Idempotency keys: clients include a unique X-Idempotency-Key header with POST requests. The server stores the key and returns the same response for duplicate requests with the same key." No codeTab on the page ever implements this — every POST example just creates a resource unconditionally.',
      'The QnA also names WHY this matters, distinct from idempotent HTTP methods: "A POST that times out cannot be safely retried without idempotency keys (retrying might create a duplicate order)." POST is fundamentally not idempotent by the HTTP spec — an idempotency key is an APPLICATION-LEVEL mechanism layered on top to make retrying one SPECIFIC POST safe, without changing what POST means for every OTHER request.',
      'The key insight this subtopic builds concretely: the server must store and REPLAY the exact same response for a repeated key — not just prevent a second resource from being created. A client retrying after a timeout needs the SAME <code>201 Created</code> body it would have gotten the first time, so it can proceed as if the first request had simply succeeded slowly.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Idempotency-Key Middleware',
    language: 'typescript',
    code: `interface StoredResponse {
  statusCode: number;
  body: unknown;
  requestBodyHash: string; // to detect a key REUSED with a different payload
}

// In-memory for illustration -- a real implementation uses Redis or
// a database table with a TTL, since keys should expire eventually.
const idempotencyStore = new Map<string, StoredResponse>();

function hashBody(body: unknown): string {
  return require('crypto').createHash('sha256').update(JSON.stringify(body)).digest('hex');
}

function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['idempotency-key'] as string | undefined;
  if (!key) return next(); // idempotency key is optional -- proceed normally

  const bodyHash = hashBody(req.body);
  const existing = idempotencyStore.get(key);

  if (existing) {
    if (existing.requestBodyHash !== bodyHash) {
      // Same key, DIFFERENT payload -- this is a client bug (reusing
      // a key across genuinely different requests), not a safe retry.
      return res.status(422).json({
        error: 'Idempotency key was previously used with a different request body',
      });
    }
    // Genuine retry -- replay the EXACT original response, without
    // re-running any of the actual creation logic at all.
    return res.status(existing.statusCode).json(existing.body);
  }

  // First time seeing this key -- let the real handler run, then
  // capture whatever it responds with for future replays.
  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    idempotencyStore.set(key, { statusCode: res.statusCode, body, requestBodyHash: bodyHash });
    return originalJson(body);
  };
  next();
}

app.post('/orders', idempotencyMiddleware, async (req, res) => {
  const order = await db.orders.create(req.body);
  res.status(201).header('Location', \`/orders/\${order.id}\`).json(order);
});

// Client-side: a POST that times out (response never arrived, but
// the server-side creation may or may not have succeeded) retries
// with the SAME Idempotency-Key. If the original request had
// actually succeeded, the retry gets back the SAME order, not a
// second one -- the middleware short-circuits before db.orders.create()
// ever runs again.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client POSTs to <code>/orders</code> with <code>Idempotency-Key: abc123</code> and body <code>{ productId: 1, qty: 2 }</code>, gets a <code>201</code> back successfully. Later, a COMPLETELY different feature in the same client codebase reuses the string <code>"abc123"</code> as an idempotency key for an unrelated order — <code>{ productId: 9, qty: 1 }</code>. What does the middleware above do, and is that the right behavior?',
  hint: 'Look at what the middleware compares BEFORE deciding whether to replay a stored response — is it just the key, or something else too?',
  solution: `// The middleware checks existing.requestBodyHash !== bodyHash --
// the SECOND request's body hashes to something different than the
// FIRST request's stored hash, since the payloads are genuinely
// different ({ productId: 1, qty: 2 } vs { productId: 9, qty: 1 }).
// This returns 422 with "Idempotency key was previously used with a
// different request body" -- it does NOT silently replay the first
// order's response for a completely unrelated request, and it does
// NOT silently create a second order under the reused key either.

// This is the correct behavior, and it's a real safety property a
// naive "just check if the key exists" implementation would miss --
// without the body-hash comparison, a key COLLISION (accidental
// reuse, or even a deliberate attack trying to trigger someone else's
// cached response) would either return the WRONG resource to the
// client, or silently swallow a legitimate new request under an
// already-used key.

// The fix for the client bug itself is separate: idempotency keys
// should be generated per LOGICAL operation (e.g. a UUID generated
// once when the user clicks "place order," reused only for retries
// of THAT specific click) -- never a fixed, hard-coded, or otherwise
// reusable string.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'An idempotency key just prevents a duplicate resource from being created — any stored response is fine.',
    reality: 'It specifically needs to replay the EXACT ORIGINAL response — the codeTab above stores and returns the same <code>statusCode</code> and <code>body</code> the first request produced, including the original resource’s <code>id</code>. A client retrying after a timeout needs to know WHICH resource its request actually resulted in, not just that duplication was avoided.',
  },
  {
    thought: 'Idempotency keys make POST an idempotent HTTP method, the same way GET or PUT are.',
    reality: 'POST remains non-idempotent by the HTTP specification — sending a NEW request without a previously-used idempotency key still creates a new resource every time. An idempotency key only makes ONE SPECIFIC logical request safe to retry; it is an application-level mechanism layered on top of POST, not a change to what POST means in general.',
  },
  {
    thought: 'If the same idempotency key is ever seen twice, it’s always safe to assume it’s a legitimate retry and replay the stored response.',
    reality: 'The codeTab above deliberately compares the request BODY too (<code>requestBodyHash</code>), not just the key — a key reused with a genuinely different payload is a client bug (or a key collision), and the middleware correctly rejects it with <code>422</code> rather than silently replaying an unrelated response or creating a duplicate resource under a stale key.',
  },
];

@Component({
  selector: 'app-api-http-methods-idempotency',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-idempotency-keys-for-post-requests.html',
  styleUrl: './implementing-idempotency-keys-for-post-requests.scss',
})
export class ImplementingIdempotencyKeysForPostRequestsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
