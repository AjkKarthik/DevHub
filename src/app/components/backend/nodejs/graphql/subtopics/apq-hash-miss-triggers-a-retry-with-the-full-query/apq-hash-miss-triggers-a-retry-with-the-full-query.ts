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
  templateUrl: './apq-hash-miss-triggers-a-retry-with-the-full-query.html',
  styleUrl: './apq-hash-miss-triggers-a-retry-with-the-full-query.scss'
})
export class ApqHashMissTriggersARetryWithTheFullQuerySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s quick-ref describes persisted queries as "clients register queries by SHA-256 hash in advance" — that phrasing makes registration sound like a separate, out-of-band step, but Apollo\'s Automatic Persisted Queries (APQ) actually does it inline, via a specific two-round-trip protocol',
      points: [
        'On the FIRST attempt to run a given query, the client sends ONLY the query\'s SHA-256 hash — via an extensions.persistedQuery field — deliberately withholding the full query text, on the optimistic assumption the server might already have it cached from a previous client.',
        'If the server does NOT recognize that hash (first time ever seeing it, or its persisted-query cache was evicted or the server restarted), it responds with a specific, structured error whose message is exactly the string "PersistedQueryNotFound" — this is not a generic failure, it is a precise signal telling the client exactly what to do next.',
        'Upon receiving that specific error, the CLIENT automatically retries the SAME logical request — but this time includes the FULL query text alongside the hash. The server then registers (caches) that hash-to-query mapping, so every future request using just the hash will succeed on the first attempt.',
      ]
    },
    {
      heading: 'The precise error signal, and why this matters for how you write custom APQ-aware client code',
      points: [
        'The "PersistedQueryNotFound" error carries TWO representations that don\'t exactly match in format: the human-readable errors[].message is the string "PersistedQueryNotFound", while the machine-readable errors[].extensions.code is the differently-formatted "PERSISTED_QUERY_NOT_FOUND". Client code checking for this specific condition should prefer matching on extensions.code, since matching on the free-text message string is more fragile.',
        'This means a genuinely NEW query, run for the very first time ever against a fresh server, always costs an extra round trip compared to a cache hit — the client sends hash-only, gets PersistedQueryNotFound back, then must resend with the full query. Only the SECOND and all subsequent runs of that same query benefit from the smaller hash-only payload the main page\'s quick-ref describes.',
        'Apollo Client\'s built-in APQ link handles this entire negotiation transparently — an application developer using it does not write this retry logic by hand. Understanding the underlying two-step protocol matters most when debugging an unexpected extra round trip in network traces, or when implementing APQ support for a non-Apollo client.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The two-round-trip negotiation, made explicit',
      language: 'typescript',
      code: `// Round 1: client sends ONLY the hash, hoping for a cache hit.
const hash = sha256Hex(queryText); // e.g. computed client-side once

let response = await fetch('/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    operationName: 'GetPost',
    variables: { id: '1' },
    extensions: {
      persistedQuery: { version: 1, sha256Hash: hash },
    },
    // NOTE: no "query" field sent at all on this first attempt.
  }),
});

let json = await response.json();

// Round 2: only runs if the server didn't recognize the hash.
const notFound = json.errors?.some(
  e => e.extensions?.code === 'PERSISTED_QUERY_NOT_FOUND'
);

if (notFound) {
  response = await fetch('/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationName: 'GetPost',
      variables: { id: '1' },
      query: queryText, // NOW include the full query text
      extensions: {
        persistedQuery: { version: 1, sha256Hash: hash },
      },
    }),
  });
  json = await response.json();
  // Server now caches hash -> queryText. Every future request for
  // this exact query, from ANY client, can succeed hash-only.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices that the very FIRST time each of their app\'s GraphQL queries runs after a server redeploy, the network tab shows two round trips to /graphql instead of one — but every subsequent run of the same query only shows one. They assume this means APQ is broken and falls back to sending the full query every time. Is this diagnosis correct?',
    hint: 'What happens to a server\'s persisted-query cache when the server process restarts (as happens during a redeploy)? Is seeing exactly two round trips on the FIRST run after that, followed by one round trip on every subsequent run, consistent with APQ working correctly, or with it failing?',
    solution: 'The diagnosis is incorrect — this is APQ working exactly as designed, not a sign of it being broken. A server restart (from a redeploy) clears its in-memory persisted-query cache, so the server no longer recognizes any previously-registered hashes. The first time each query runs after that: round 1 sends hash-only, the server responds with PersistedQueryNotFound (since its cache was just cleared), and round 2 resends with the full query text, which the server then re-caches. Every subsequent run of that same query, for the rest of that server\'s uptime, correctly goes back to a single hash-only round trip — which is exactly the "two round trips only on first-ever-or-first-after-cache-loss, one round trip on every run after that" pattern the team observed. Falling back to always sending the full query would defeat the entire benefit of APQ (smaller payloads and GET-cacheability) for the vast majority of requests, to avoid an extra round trip that only ever happens once per query per server restart.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Automatic Persisted Queries work by the client sending only a query hash on every single request, with the server having somehow already learned the corresponding query text through a separate, out-of-band registration step before any of this happens.',
      reality: 'This subtopic\'s theory shows registration is NOT a separate out-of-band step — it happens inline, automatically, the very first time a query is ever run: the client\'s hash-only attempt gets a PersistedQueryNotFound error, triggering an automatic retry that includes the full query text for the server to cache.'
    },
    {
      thought: 'Seeing two network round trips for a GraphQL query the very first time it ever runs against a server means Automatic Persisted Queries is misconfigured or broken.',
      reality: 'This subtopic\'s exercise shows two round trips on a genuinely first-ever (or first-after-cache-loss) run is the CORRECT, expected behavior of the APQ protocol — the extra round trip is what registers the query for every subsequent single-round-trip request.'
    },
    {
      thought: 'The PersistedQueryNotFound error is identified the same way in both its human-readable message and its machine-readable extensions.code field.',
      reality: 'This subtopic\'s theory notes these two representations actually use different formats — the message is the string "PersistedQueryNotFound" while extensions.code is "PERSISTED_QUERY_NOT_FOUND" — and client code should prefer matching on extensions.code since it is the more stable, machine-readable signal.'
    }
  ];
}
