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
    heading: 'The Idempotency-Key Header Only Works If Something Actually Deduplicates',
    points: [
      'The main page’s theory and quiz both describe the Idempotency-Key pattern in real detail: the client generates a UUID per logical operation, sends it in a header, and "the server deduplicates requests with the same key within a time window (e.g., 24h)." That deduplication logic — the part that actually makes the pattern work — is never shown as working code anywhere on the page.',
      'The mechanism has three parts: a store keyed by the idempotency key (holding the ORIGINAL response, not just a flag that the key was seen); an expiry window (so keys don’t accumulate forever, and so the SAME key can safely be reused after enough time has passed); and a check that runs BEFORE any real work happens, so a duplicate request never re-executes the underlying operation at all.',
      'A response is stored in full — not just recomputed on the fly — because the whole point of the pattern is that a retry gets back EXACTLY what the original request would have returned (the same order ID, same status code), even if the underlying operation would behave differently if run a second time.',
      'Within the expiry window, a retry with the same key returns a <code>200 OK</code> replay of the ORIGINAL response — not a fresh <code>201 Created</code> — since nothing new was actually created. Past the window, the same key is treated as a brand-new operation.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Idempotency-Key Store',
    language: 'typescript',
    code: `interface CachedResponse {
  status: number;
  body: unknown;
  expiresAt: number;
}

const WINDOW_MS = 24 * 60 * 60 * 1000; // 24h, matching the main page's own stated window
const store = new Map<string, CachedResponse>();

interface PostResult {
  status: number;
  body: unknown;
  replayed: boolean;
}

function handleCreateOrder(
  idempotencyKey: string | undefined,
  body: { total: number },
  now: number
): PostResult {
  // Check for a cached, still-valid response BEFORE doing any real work --
  // this is what makes the operation retry-safe: a duplicate request
  // never re-executes order creation at all.
  if (idempotencyKey) {
    const cached = store.get(idempotencyKey);
    if (cached && cached.expiresAt > now) {
      return { status: 200, body: cached.body, replayed: true };
    }
  }

  // No valid cached entry -- this is a genuinely new operation.
  const created = { id: 'order-' + (store.size + 1), ...body };

  if (idempotencyKey) {
    store.set(idempotencyKey, {
      status: 201,
      body: created,
      expiresAt: now + WINDOW_MS,
    });
  }

  return { status: 201, body: created, replayed: false };
}

// ── Demonstration ─────────────────────────────────────────────────────────
const now = 1_700_000_000_000;

console.log(handleCreateOrder('client-uuid-xyz', { total: 42 }, now));
// { status: 201, body: { id: 'order-1', total: 42 }, replayed: false }

console.log(handleCreateOrder('client-uuid-xyz', { total: 42 }, now + 5_000));
// same key, 5 seconds later (a genuine retry, well within the window)
// { status: 200, body: { id: 'order-1', total: 42 }, replayed: true }
// -- SAME order id returned. No second order was created.

console.log(handleCreateOrder('client-uuid-xyz', { total: 42 }, now + WINDOW_MS + 1));
// same key, one millisecond PAST the 24h window
// { status: 201, body: { id: 'order-2', total: 42 }, replayed: false }
// -- window expired, so this key is now treated as a new operation.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The store above caches the response BODY (<code>{ id: \'order-1\', total: 42 }</code>) keyed by the idempotency key. A teammate proposes a simpler version: instead of storing the response, just store a <code>Set&lt;string&gt;</code> of keys already seen, and return a generic <code>{ status: 409, body: { error: \'duplicate request\' } }</code> for any repeated key. What real capability does this simpler version give up?',
  hint: 'A retrying CLIENT typically has no way to look up "what did my original request actually create" other than the response to its retry — what does the client get back under each version?',
  solution: `// The Set<string> version can correctly detect that a key was already
// used -- but it cannot tell the retrying client WHAT the original
// operation actually did. A client that legitimately lost the network
// response to its first request (the entire reason it's retrying in the
// first place) gets back a generic 409 "duplicate request" error instead
// of the order it successfully created -- it has no way to recover the
// real order ID from that response.

// This defeats the actual purpose of the Idempotency-Key pattern. The
// point isn't just "detect and reject duplicates" (a Set can do that) --
// it's "let a client that legitimately doesn't know whether its first
// request succeeded safely retry and get back the SAME successful result
// it would have gotten the first time." That requires caching the full
// original response, not just a boolean "have I seen this key" flag.

// The Set<string> approach is the right tool for a DIFFERENT problem --
// rejecting outright duplicate submissions where any repeat should
// always be treated as an error (e.g. a one-time-use invite code) -- but
// it is the wrong tool for retry-safety, which is what the main page's
// own Idempotency-Key theory is actually describing.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Sending an <code>Idempotency-Key</code> header is itself what makes a POST request idempotent — the client-side behavior is the whole mechanism.',
    reality: 'The header is only half the pattern. Sending a key that the SERVER never checks against a store accomplishes nothing — a server that ignores the header and creates a new order on every request is exactly as unsafe to retry as one with no Idempotency-Key support at all. The deduplication has to happen server-side, which is the part this subtopic’s codeTab actually builds.',
  },
  {
    thought: 'A duplicate request (same key, within the window) should return the SAME status code, <code>201 Created</code>, as the original — since nothing about the operation itself changed.',
    reality: 'The codeTab above returns <code>200 OK</code> for a replayed response, not <code>201 Created</code> — the second call did not create anything, it retrieved an already-existing result. Returning <code>201</code> again would (incorrectly) signal to the client that a SECOND resource was created, when in fact zero new resources exist beyond the original.',
  },
  {
    thought: 'The expiry window exists purely as a memory-cleanup mechanism — to stop the store from growing forever.',
    reality: 'Memory cleanup is a real secondary benefit, but the window’s PRIMARY purpose is correctness: it defines how long the SAME key is guaranteed to mean "the same logical operation." Past the window, reusing a key is treated as a legitimately new operation (as the codeTab’s third call demonstrates) — without a window, a client accidentally reusing an old key years later would incorrectly get back a years-old cached response instead of creating what it actually intended.',
  },
];

@Component({
  selector: 'app-api-principles-idempotency-key',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './implementing-idempotency-key-deduplication.html',
  styleUrl: './implementing-idempotency-key-deduplication.scss',
})
export class ImplementingIdempotencyKeyDeduplicationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
