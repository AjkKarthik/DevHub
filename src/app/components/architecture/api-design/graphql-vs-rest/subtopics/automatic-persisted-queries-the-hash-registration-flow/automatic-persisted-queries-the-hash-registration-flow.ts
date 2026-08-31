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
    heading: 'The Hash-First, Register-on-Miss Flow — Explained, Never Built',
    points: [
      'A quiz explanation on the main page describes Automatic Persisted Queries (APQ) precisely: "the client first sends just the hash via GET... only sends the full query text... the one time that hash is not yet recognized — subsequent requests for that same query, from any client, reuse the cached hash-keyed GET response." No codeTab on the page shows this exchange actually happening.',
      'This directly addresses the main page’s OWN caching theory bullet from earlier on the SAME page — "REST responses are cacheable by URL... GraphQL uses POST to /graphql — caching is harder" — APQ is precisely the mechanism that recovers GET-based, URL-cacheable requests for GraphQL without giving up per-client field flexibility.',
      'The server side needs a registry keyed by hash. On a request carrying ONLY a hash (no query text), a registry miss must return a distinct, recognizable signal (<code>PersistedQueryNotFound</code>) — not a generic error — so the client knows exactly when to retry with the full query attached.',
      'A hash is computed from the query TEXT itself (SHA-256), so any client sending the identical query text always computes the identical hash — meaning the FIRST client to register a given query effectively "pre-warms" the cache for every OTHER client that later sends the same query, even one that has never talked to this server before.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'APQ Hash Registration and Cache Hits',
    language: 'typescript',
    code: `import { createHash } from 'crypto';

const registry = new Map<string, string>(); // hash -> full query text

function hashQuery(query: string): string {
  return createHash('sha256').update(query).digest('hex');
}

interface ApqResult {
  status: number;
  source?: 'cache-hit' | 'registered-now';
  data?: string;
  error?: string;
}

// Mirrors the GraphQL server's own APQ handling: a request can arrive
// with JUST a hash (the client's fast path) or a hash plus the full
// query text (the client's fallback, sent only after a registry miss).
function serverHandleApq(hash: string, fullQuery: string | null): ApqResult {
  if (registry.has(hash)) {
    return { status: 200, source: 'cache-hit', data: 'executed:' + registry.get(hash) };
  }
  if (fullQuery) {
    if (hashQuery(fullQuery) !== hash) {
      return { status: 400, error: 'provided sha256Hash does not match query' };
    }
    registry.set(hash, fullQuery);
    return { status: 200, source: 'registered-now', data: 'executed:' + fullQuery };
  }
  return { status: 200, error: 'PersistedQueryNotFound' };
}

// Client-side flow: always try the hash-only GET first; only fall back
// to sending the full query text on a registry miss.
function clientRequest(query: string): ApqResult {
  const hash = hashQuery(query);
  let response = serverHandleApq(hash, null); // fast path: hash only
  if (response.error === 'PersistedQueryNotFound') {
    response = serverHandleApq(hash, query); // fallback: register it
  }
  return response;
}

const query = 'query GetUser { user { id email } }';

console.log('First request (registers on miss):', clientRequest(query));
// { status: 200, source: 'registered-now', data: 'executed:query GetUser...' }

console.log('Second request, same client (cache hit):', clientRequest(query));
// { status: 200, source: 'cache-hit', data: 'executed:query GetUser...' }

console.log('A DIFFERENT client, same query text (cache hit):', clientRequest(query));
// { status: 200, source: 'cache-hit', ... } -- reuses the FIRST client's
// registration; this client never had to send the full query at all.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The codeTab’s <code>serverHandleApq</code> checks <code>hashQuery(fullQuery) !== hash</code> and returns a <code>400</code> error if they don’t match, whenever a client sends BOTH a hash and the full query text. Why does the server bother re-computing the hash itself instead of simply trusting whatever hash value the client claims to have sent?',
  hint: 'What could a malicious or buggy client do if the server registered ANY <code>(hash, query)</code> pair the client claimed, without independently verifying the hash actually corresponds to that specific query text?',
  solution: `// If the server trusted a client-supplied hash without recomputing it,
// a client could register an ARBITRARY, attacker-chosen hash value
// pointing at ANY query text it wants -- including overwriting an
// EXISTING, legitimate hash-to-query mapping that other clients are
// already relying on.

// Concretely: if client A had already registered hash "abc123" for a
// safe, expected query, a malicious client B could send hash "abc123"
// paired with a COMPLETELY DIFFERENT, more expensive or more sensitive
// query. If the server accepted this without verification, every
// FUTURE client sending just the hash "abc123" (expecting the original
// safe query) would unknowingly have client B's substituted query
// executed instead.

// Recomputing the hash server-side from the actual query text closes
// this gap entirely: the hash a client claims is only ever accepted if
// it's the server's OWN independently-computed SHA-256 of that exact
// query text -- a client has no way to make an arbitrary hash point at
// arbitrary content, since the mapping is derived, not asserted.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Automatic Persisted Queries require the server to pre-register every allowed query in advance, similar to a strict allowlist.',
    reality: 'The codeTab above demonstrates the opposite — the registry starts completely EMPTY, and the FIRST client to send any given query registers it automatically, on the fly, the first time a hash miss occurs. This is a genuinely different mechanism from a manually curated allowlist (which the main page’s own theory separately names as a STRONGER, more restrictive security option for public APIs).',
  },
  {
    thought: 'Since APQ makes GraphQL requests cacheable via GET, it eliminates GraphQL’s POST-based caching problem entirely, for every kind of query.',
    reality: 'APQ recovers CACHEABILITY specifically for queries whose RESPONSE is safe to share across requests/clients — the main page’s own theory distinguishes "public data" (good candidate for GET/CDN caching) from "authenticated, personalised queries" (which still typically need POST). APQ solves the URL/method problem, not the question of whether a given response is actually safe to cache and reuse across different users.',
  },
  {
    thought: 'A different client sending the identical query text as an earlier client must independently register that query — the registration is per-client.',
    reality: 'The codeTab’s third example directly demonstrates the opposite: because the hash is derived purely from the query TEXT (not from any client identity), a second, entirely unrelated client sending the identical query text gets an immediate cache hit — it never needs to register anything itself, since the first client already did.',
  },
];

@Component({
  selector: 'app-api-graphql-vs-rest-apq',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './automatic-persisted-queries-the-hash-registration-flow.html',
  styleUrl: './automatic-persisted-queries-the-hash-registration-flow.scss',
})
export class AutomaticPersistedQueriesTheHashRegistrationFlowSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
