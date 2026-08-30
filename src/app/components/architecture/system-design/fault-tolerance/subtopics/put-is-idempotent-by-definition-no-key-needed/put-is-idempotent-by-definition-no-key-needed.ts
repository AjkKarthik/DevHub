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
  templateUrl: './put-is-idempotent-by-definition-no-key-needed.html',
  styleUrl: './put-is-idempotent-by-definition-no-key-needed.scss'
})
export class PutIsIdempotentByDefinitionNoKeyNeededSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A grouping that quietly implied PUT needs the same fix POST does',
      points: [
        'The main page originally listed retry-safe operations as "GET, PUT with idempotency key" and, in a code comment, "Safe to retry: GET, PUT (with idempotency key), DELETE." Grouping PUT alongside an idempotency-key requirement implies PUT needs the same workaround POST does. Checking this against HTTP\'s own specification (RFC 7231) shows PUT does not need that workaround at all — the page has been corrected.',
        'This is a precision issue, not a safety issue: the original phrasing does not make retries LESS safe (adding an idempotency key to a PUT call is harmless), but it does misrepresent WHY PUT is safe to retry, and could lead a reader to think an idempotency key is a general requirement for retry-safety rather than a workaround specific to non-idempotent methods.',
      ]
    },
    {
      heading: 'What RFC 7231 actually says about idempotent methods',
      points: [
        'RFC 7231 (the HTTP/1.1 semantics specification) explicitly defines idempotency: "the intended effect on the server of multiple identical requests with that method is the same as the effect for a single such request." It goes on to name the idempotent methods directly: PUT, DELETE, and the "safe" methods (GET, HEAD, OPTIONS, TRACE) are all idempotent BY DEFINITION.',
        'This means a client can safely retry any of these methods after a network failure or ambiguous response — the protocol itself guarantees that repeating the request has the same intended effect as sending it once, with no additional application-level mechanism required.',
        'POST is the odd one out: RFC 7231 does NOT classify POST as idempotent, because a POST\'s defining use case (e.g. "create a new resource") naturally produces a DIFFERENT effect each time it is repeated (a second POST typically creates a second resource) — which is exactly why POST specifically needs an idempotency-key workaround to become safely retryable, a need that does not exist for PUT/DELETE/GET.',
      ]
    },
    {
      heading: 'Why this distinction is worth knowing beyond RFC trivia',
      points: [
        'For a PUT-based API (e.g. PUT /users/42 replacing the full user record), retry-safety comes for free from the correct implementation of the endpoint itself — as long as the server genuinely implements PUT\'s "full replace" semantics, no additional idempotency-key infrastructure needs to be built or maintained for that endpoint\'s retries.',
        'This distinguishes a genuinely different engineering cost: building and maintaining an idempotency-key store (the mechanism the main page\'s own "Idempotency Key" code sample from a related page implements) is real, ongoing infrastructure — worth reserving for the methods that actually need it (POST), rather than assuming every retried request needs that same mechanism regardless of HTTP method.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Which methods need which retry-safety mechanism',
      language: 'typescript',
      code: `interface HttpMethodRetrySafety {
  method: string;
  idempotentByRfc7231: boolean;
  needsIdempotencyKeyToRetrySafely: boolean;
}

const methods: HttpMethodRetrySafety[] = [
  { method: 'GET',    idempotentByRfc7231: true,  needsIdempotencyKeyToRetrySafely: false },
  { method: 'PUT',    idempotentByRfc7231: true,  needsIdempotencyKeyToRetrySafely: false },
  { method: 'DELETE', idempotentByRfc7231: true,  needsIdempotencyKeyToRetrySafely: false },
  { method: 'POST',   idempotentByRfc7231: false, needsIdempotencyKeyToRetrySafely: true },
];

// Retrying a correctly-implemented PUT is safe because the HTTP
// spec's own definition of PUT guarantees repeating it has the
// SAME intended effect -- no idempotency-key store required.

// A correctly-implemented PUT /users/42 replacing the full record:
async function updateUser(id: string, fullUserRecord: User) {
  // Retrying this after a network timeout is safe on its own --
  // sending the identical PUT twice produces the identical end state.
  return withRetry(() => api.put(\`/users/\${id}\`, fullUserRecord));
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team building a PUT /accounts/:id/settings endpoint (replacing the full settings object) debates whether they need to build an idempotency-key store for it before adding automatic retry logic, since "the fault-tolerance page said PUT needs an idempotency key." Do they need one?',
    hint: 'Is PUT idempotent by the HTTP specification\'s own definition, independent of any application-level mechanism — and if so, what does that guarantee about retrying it?',
    solution: 'No, they do not need an idempotency-key store for this endpoint. PUT is classified as idempotent directly by RFC 7231 — repeating an identical PUT request is guaranteed by the HTTP specification itself to produce the same intended effect as sending it once, PROVIDED the endpoint is correctly implemented as a full replace (which "replacing the full settings object" describes). An idempotency-key store is a workaround specifically needed for methods that are NOT idempotent by definition — POST is the standard example, since repeating a POST naturally creates a second resource rather than replacing the first. Building idempotency-key infrastructure for this PUT endpoint would be unnecessary engineering effort for a retry-safety guarantee the HTTP method already provides for free.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PUT needs an idempotency key to be safely retried, the same way POST does.',
      reality: 'Per this subtopic\'s theory, PUT is classified as idempotent directly by RFC 7231 — repeating a correctly-implemented PUT is guaranteed to have the same effect as sending it once, with no additional idempotency-key mechanism required. That workaround is specifically for POST, which the spec does NOT classify as idempotent.'
    },
    {
      thought: 'Idempotency keys are a general best practice that should be added to every retried HTTP request, regardless of method.',
      reality: 'Per this subtopic\'s theory, idempotency keys solve a problem specific to non-idempotent methods (POST) — adding one to an already-idempotent method (GET, PUT, DELETE) is not harmful, but it is unnecessary engineering effort for a guarantee the HTTP method already provides.'
    },
    {
      thought: 'Whether a method is "idempotent" is a design choice each API makes per-endpoint, not something HTTP itself defines.',
      reality: 'Per this subtopic\'s theory, RFC 7231 defines idempotency at the METHOD level as part of the HTTP specification itself — PUT, DELETE, and the safe methods are idempotent by definition, independent of what any specific API implementation chooses to do (though a BROKEN implementation could still violate that expectation).'
    }
  ];
}
