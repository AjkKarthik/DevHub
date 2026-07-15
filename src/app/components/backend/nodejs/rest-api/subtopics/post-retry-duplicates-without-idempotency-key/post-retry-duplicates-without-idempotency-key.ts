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
  templateUrl: './post-retry-duplicates-without-idempotency-key.html',
  styleUrl: './post-retry-duplicates-without-idempotency-key.scss'
})
export class PostRetryDuplicatesWithoutIdempotencyKeySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quick-ref calls POST "create a new resource" — but it never addresses what happens when the CLIENT doesn\'t know if that creation actually happened',
      points: [
        'HTTP defines PUT and DELETE as idempotent methods — sending the same PUT or DELETE request twice has the same effect as sending it once, so a client can safely retry them blindly after a timeout. POST is explicitly NOT defined as idempotent: two identical POST requests are expected to create two separate resources. This is not a Node.js or Express detail — it is baked into HTTP method semantics itself.',
        'This becomes a real problem the instant a network is involved: a client sends POST /orders, the server creates the order and starts sending the 201 response back, but the connection drops before the client receives it. The client has no way to know whether the order was created or not — from its perspective, "no response" and "the server never got the request" look identical. Blindly retrying the POST risks creating a second, duplicate order for a purchase the client already made once.',
        'The standard fix, used by Stripe\'s API and formalized in the IETF draft "The Idempotency-Key HTTP Header Field," is for the CLIENT to generate a unique key (typically a UUID) once per logical operation and send it as an Idempotency-Key request header on every attempt — including retries. The server stores the key alongside the result of the first successful request it processed for that key. If a second request arrives with the SAME key, the server does not re-run the operation at all — it returns the exact same stored response as the first attempt.',
      ]
    },
    {
      heading: 'Precision points worth being exact about',
      points: [
        'The IETF draft covers both POST and PATCH as the non-idempotent methods this mechanism protects — not POST alone. PATCH inherits the same problem when a partial update has side effects (e.g. "increment a counter") rather than being a pure, safely-repeatable field replacement.',
        'As of this writing, "The Idempotency-Key HTTP Header Field" is an active IETF Internet-Draft under the HTTPAPI working group — it has NOT been published as a numbered RFC. It is safe to treat the pattern itself as an established, widely-adopted industry convention (Stripe has used it for years), but it is not yet a ratified internet standard the way RFC 9110\'s HTTP semantics are.',
        'The key must be scoped to a single LOGICAL operation, not regenerated per HTTP attempt — generating a fresh UUID on every retry defeats the entire mechanism, since the server would see each retry as a brand-new, never-seen-before key and create a new resource every time anyway.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Client: generate the key once, reuse it across retries',
      language: 'typescript',
      code: `import { randomUUID } from 'node:crypto';

async function createOrderWithRetry(orderData, maxAttempts = 3) {
  // Generated ONCE, outside the retry loop — every attempt for this
  // logical "create this order" operation reuses the SAME key.
  const idempotencyKey = randomUUID();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch('https://api.example.com/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey, // same value every attempt
        },
        body: JSON.stringify(orderData),
      });
      return await res.json(); // safe: server dedupes on the key
    } catch (networkErr) {
      if (attempt === maxAttempts) throw networkErr;
      // retry with the SAME idempotencyKey — never regenerate it here
    }
  }
}`,
    },
    {
      label: 'Server: dedupe on the key before running the handler',
      language: 'typescript',
      code: `const idempotencyStore = new Map(); // production: Redis with a TTL

router.post('/orders', async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (!key) {
    return res.status(400).json({ error: 'Idempotency-Key header is required' });
  }

  const cached = idempotencyStore.get(key);
  if (cached) {
    // Same key seen before — return the ORIGINAL result.
    // Do NOT re-run order creation, do NOT charge the card again.
    return res.status(cached.status).json(cached.body);
  }

  const order = await ordersService.create(req.body);
  const responseBody = order;
  const responseStatus = 201;

  idempotencyStore.set(key, { status: responseStatus, body: responseBody });
  res.status(responseStatus).json(responseBody);
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A client calls POST /payments to charge a customer\'s card. The request succeeds server-side and the charge goes through, but the response is lost to a network blip before the client receives it. The client, following a naive "just retry on any error" policy with NO Idempotency-Key header, immediately resends the identical POST /payments request. What happens, and why does adding an Idempotency-Key fix it?',
    hint: 'Is POST defined as idempotent by HTTP semantics? Without a key for the server to recognize "I already processed this exact logical request," what can it tell the second POST apart from a genuinely new, separate charge request?',
    solution: 'Without an Idempotency-Key, the server has no way to distinguish "this is a retry of a request I already fully processed" from "this is a brand-new charge the client actually wants." Since POST is not idempotent by HTTP semantics, the server correctly (from its own point of view) treats the retried request as a new charge and processes it again — the customer gets charged TWICE for one purchase, purely because the client\'s original response was lost in transit, not because anything was wrong with the charge itself. Adding an Idempotency-Key header, generated once per logical charge attempt and reused across retries, fixes this: the server stores the key alongside the result of the first successful charge, and when the retried request arrives carrying that same key, the server recognizes it as a duplicate of an already-completed operation and returns the stored result WITHOUT running the charge logic again — so the customer is charged exactly once, regardless of how many times the client had to retry due to network issues.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'It is always safe for a client to blindly retry any HTTP request — GET, POST, PUT, or DELETE — after a timeout, since retrying just means "try again."',
      reality: 'This subtopic\'s theory shows HTTP explicitly distinguishes idempotent methods (PUT, DELETE, GET) — safe to retry blindly — from non-idempotent ones (POST, and PATCH when it has side effects) where a blind retry can duplicate the original operation\'s effect, such as creating a second order or charging a card twice.'
    },
    {
      thought: 'An Idempotency-Key only needs to be unique per HTTP request sent over the wire — generating a fresh one for each retry attempt is fine as long as each individual attempt has its own key.',
      reality: 'This subtopic\'s theory states the opposite is required: the key must be generated ONCE per logical operation and reused across every retry attempt for that same operation — a fresh key per attempt makes each retry look like a brand-new, never-seen-before request to the server, which defeats the entire deduplication mechanism.'
    },
    {
      thought: 'The Idempotency-Key HTTP Header Field is a finalized, numbered RFC — an official, ratified internet standard, the same status as RFC 9110\'s HTTP semantics.',
      reality: 'This subtopic\'s theory clarifies it remains an active IETF Internet-Draft under the HTTPAPI working group, not yet published as a numbered RFC — a widely-adopted, well-established industry convention (used by Stripe and many others), but not formally ratified the way core HTTP semantics documents are.'
    }
  ];
}
