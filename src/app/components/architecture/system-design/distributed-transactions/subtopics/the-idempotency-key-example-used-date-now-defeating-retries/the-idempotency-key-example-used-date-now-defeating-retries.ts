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
  templateUrl: './the-idempotency-key-example-used-date-now-defeating-retries.html',
  styleUrl: './the-idempotency-key-example-used-date-now-defeating-retries.scss'
})
export class TheIdempotencyKeyExampleUsedDateNowDefeatingRetriesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A code sample that contradicted its own walkthrough, catchable with zero external research',
      points: [
        'The main page\'s "Idempotency Key" code sample generated the key with const idempotencyKey = `pay-${orderId}-${Date.now()}`. Reading the SAME code sample\'s own follow-up walkthrough — which shows two POST requests using the IDENTICAL literal key value on both the original attempt and the retry — the two do not match: Date.now() called again on a retry would produce a DIFFERENT timestamp, hence a different key, on every attempt. The code has been corrected.',
        'This is exactly the kind of bug that survives a first read because both halves LOOK reasonable in isolation — a timestamp-based key generation function reads as sensible, and a retry walkthrough showing "the same key sent twice" also reads as sensible. It is only checking them AGAINST EACH OTHER that reveals they cannot both be true of the same code.',
      ]
    },
    {
      heading: 'Why regenerating the key per attempt defeats the entire pattern',
      points: [
        'The whole point of an idempotency key is that the SERVER can recognize "I have already handled this exact logical operation" when a retry arrives — which only works if the retry carries the SAME key as the original attempt.',
        'If the client code that builds the key runs again on every retry attempt (as calling Date.now() inside the key-generation line implies), each retry produces a NEW, never-before-seen key. The server has no way to link it to the earlier attempt — it looks like a brand-new payment request, and the safeguard the whole pattern exists to provide (no double charge on retry) silently does not apply.',
        'This is a genuinely dangerous category of bug specifically because the code LOOKS like it implements idempotency (an idempotencyKey variable exists, gets sent to the server, gets checked server-side) while quietly not delivering the actual guarantee — a much harder bug to catch in code review than an idempotency check that is simply missing altogether.',
      ]
    },
    {
      heading: 'What Stripe\'s own documented practice confirms is the correct pattern',
      points: [
        'Stripe — whose idempotency-key API is the most widely cited real-world reference for this exact pattern — documents the practice explicitly: generate the key ONCE per logical operation, store it (client-side, before the first attempt), and reuse that exact same value for every subsequent retry of that operation. The key must never be regenerated per HTTP attempt.',
        'A client-generated UUID (crypto.randomUUID() in the browser/Node, or an equivalent UUID library) is the standard way to generate a key that is unique PER OPERATION while remaining perfectly stable across as many retries of that same operation as needed — unlike a timestamp, which is guaranteed to differ between calls.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug, isolated',
      language: 'typescript',
      code: `// BUGGY: key regenerates on every call -- including every retry
function getIdempotencyKeyBuggy(orderId: string): string {
  return \`pay-\${orderId}-\${Date.now()}\`;
  // Call this twice, 50ms apart (e.g. once per retry attempt):
  // "pay-42-1732000000123"
  // "pay-42-1732000000171"  <-- DIFFERENT key, same logical payment!
}

// FIXED: generate once, store, and pass the SAME value on every retry
function getIdempotencyKeyOnce(): string {
  return crypto.randomUUID();
  // Generated a single time when the operation first begins.
  // The CALLER is responsible for storing this value and reusing
  // it for every retry of the SAME logical operation -- the
  // function itself does not need to be deterministic, because
  // it is only ever called once per operation, not once per attempt.
}

// A client-side sketch of correct reuse across retries:
async function payWithRetry(orderId: string, amount: number) {
  const idempotencyKey = crypto.randomUUID(); // generated ONCE, outside the retry loop
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fetch('/payments', {
        method: 'POST',
        body: JSON.stringify({ idempotencyKey, orderId, amount }), // SAME key every attempt
      });
    } catch (networkError) {
      // retry loop continues -- idempotencyKey is untouched, not regenerated
    }
  }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A payment client library computes its idempotency key as `pay-${orderId}-${Date.now()}` inside the function that actually sends the HTTP request, and that function is what the retry loop calls again on each attempt. A customer\'s network drops right after their card is charged but before the response arrives, triggering an automatic retry. What happens?',
    hint: 'Does the retry loop call the same function that computes the key again — and if so, does Date.now() return the same value both times?',
    solution: 'Because the key-generating function is called again inside the retry loop, and it derives the key from Date.now() (which advances on every call), the retry sends a DIFFERENT idempotency key than the original attempt did. The server has no record of ever seeing this new key before, so it treats the retry as a brand-new payment request and processes it — charging the customer a second time. This is exactly the double-charge scenario idempotency keys exist to prevent, defeated by generating the key inside the retried code path instead of once, outside the retry loop, before the first attempt.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Including a timestamp in an idempotency key is a reasonable way to make it unique, similar to including a UUID.',
      reality: 'Per this subtopic\'s theory, a timestamp captured fresh on every function call is exactly the wrong property for an idempotency key — the key needs to stay IDENTICAL across retries of the same operation, and a timestamp guarantees the opposite by changing on every call.'
    },
    {
      thought: 'As long as an idempotencyKey field exists in the request and the server checks it, the retry-safety guarantee is working correctly.',
      reality: 'Per this subtopic\'s theory, the presence of an idempotencyKey field says nothing about whether it is being generated correctly — a key that changes on every retry defeats the pattern just as completely as having no idempotency check at all, while looking, at a glance, like the pattern is implemented.'
    },
    {
      thought: 'This kind of bug would be obvious and caught immediately in code review or testing.',
      reality: 'Per this subtopic\'s theory, this bug is specifically dangerous because both halves of the code (the key generator and the retry-handling logic) look correct in isolation — it only surfaces when checking the key-generation code against how it actually behaves across repeated calls, which a quick review of either piece alone would miss.'
    }
  ];
}
