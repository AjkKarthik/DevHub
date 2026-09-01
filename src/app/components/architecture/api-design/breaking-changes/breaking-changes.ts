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
  { name: 'Breaking Change',      type: 'keyword', desc: 'Any change that requires consumers to update their code to continue working — requires a version bump.' },
  { name: 'Non-Breaking Change',  type: 'keyword', desc: 'Adding optional fields, new endpoints, new enum values that existing consumers can safely ignore.' },
  { name: 'Deprecation',          type: 'keyword', desc: 'Announce intent to remove a feature; keep it working for a sunset period (typically 6–12 months).' },
  { name: 'Sunset Header',        type: 'keyword', desc: 'Sunset: Sat, 31 Dec 2025 00:00:00 GMT — RFC 8594 header; signals the endpoint removal date to clients.' },
  { name: 'Additive Evolution',   type: 'keyword', desc: 'Strategy: only ever ADD to the API — new endpoints, new optional response fields; never remove or rename.' },
  { name: 'Consumer-Driven Tests', type: 'keyword', desc: 'Pact tests from consumers verify the provider does not introduce unexpected breaking changes.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is a Breaking Change?',
    points: [
      'A breaking change is any modification that requires consumers to update their code or break silently. Common examples: removing a response field, renaming a field, changing a field type, making an optional field required, removing an endpoint or HTTP method.',
      'Non-breaking (safe) changes: adding new optional response fields, adding new endpoints, adding new optional request parameters, adding new enum values (with care — clients must handle unknown values).',
      'The Postel\'s Law principle applied to APIs: "Be conservative in what you send, liberal in what you accept." Require less, return more.',
      'Treat your public API like a public function signature in a library — changing it breaks everyone who depends on it without warning.',
    ],
  },
  {
    heading: 'Additive Evolution Strategy',
    points: [
      'The safest way to evolve an API: only add, never remove or rename. Add new optional fields to responses; keep old fields. Add new endpoints; keep old ones.',
      'Rename a field by adding the new name alongside the old one for a sunset period, then removing the old one in v2.',
      'Field type changes are always breaking (string → number). Expand the type to accept both (using JSON Schema anyOf) during transition, then remove the old type in v2.',
      'Never change the meaning of an existing field — this is a breaking change even if the type stays the same. Add a new field with the new meaning instead.',
    ],
  },
  {
    heading: 'Deprecation Process',
    points: [
      'Step 1: Announce deprecation — in docs, in release notes, in the response header: `Deprecation: true`, `Sunset: <date>`.',
      'Step 2: Log usage of deprecated endpoints by consumer — helps prioritize migration support and reach out to teams still using the old endpoint.',
      'Step 3: Allow adequate sunset period — public APIs: 6–12+ months. Internal APIs: 1–3 months if you can drive migration. Never remove without notice.',
      'Step 4: Send deprecation warnings in API responses during the sunset period — consumers who check logs will see them.',
    ],
  },
  {
    heading: 'Detecting Breaking Changes Automatically',
    points: [
      'Manual review of API diffs misses subtle changes (making an optional field required, narrowing a type\'s allowed values).',
      'Tools: openapi-diff/oasdiff or Bump.sh — diff two OpenAPI spec versions and classify each change as breaking or non-breaking. (Optic, once a common choice here, was archived by its own maintainers on GitHub in January 2026 — verify a diff tool is still actively maintained before adopting it, the same way you\'d check any other dependency.)',
      'Run in CI: any PR that changes the API spec gets an automated breaking-change report. Reviewers must explicitly approve breaking changes.',
      'Consumer-driven contract tests (Pact): consumers write expectations; providers run them. A breaking change fails the provider\'s Pact tests before deployment.',
    ],
  },
  {
    heading: 'Building Organizational Discipline Around Breaking Changes',
    points: [
      'A formal breaking-change review process (requiring explicit sign-off before any breaking change ships) creates a deliberate checkpoint that catches accidental breaking changes before they reach consumers — many breaking changes are unintentional side effects of an otherwise unrelated change, not deliberate API redesigns.',
      'Automated breaking-change detection in CI (comparing the API spec on every pull request against the currently deployed spec) catches breaking changes at the moment they are introduced, when they are cheapest to fix, rather than after they have already been deployed and consumers have started encountering failures.',
      'Consumer-driven contract tests (where each known consumer publishes example requests/responses they depend on) provide the strongest safety net — a proposed change that would violate an actual consumer\'s recorded expectations fails CI before deployment, rather than being caught only after real consumers start reporting errors.',
      'Building institutional muscle memory around the Expand-Contract pattern (treating every "breaking" change as a series of non-breaking steps) turns breaking changes from a rare, high-risk, high-coordination event into a routine, well-understood, low-risk engineering practice.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Safe vs Breaking Changes',
    language: 'typescript',
    code: `// ✅ SAFE: adding new optional response fields (old consumers ignore them)
// v1 response:
{ "id": "42", "name": "John" }

// v1.1 response (backward compatible):
{ "id": "42", "name": "John", "email": "john@example.com", "createdAt": "2024-01-15T10:30:00Z" }

// ❌ BREAKING: removing or renaming a required response field
// v1: { "id": "42", "name": "John" }
// v2: { "id": "42", "fullName": "John" }  ← consumers reading .name get undefined

// ❌ BREAKING: changing a field type
// v1: { "price": 9.99 }   (number)
// v2: { "price": "999" }  (string — consumer code breaks on price * 2)

// ❌ BREAKING: making an optional field required in a request
// v1 request: { items: [...] }  (address was optional)
// v2 request: { items: [...], address: {...} }  (address now required — old clients fail)

// ✅ SAFE: adding a new optional request parameter
// v1: POST /orders body: { items: [...] }
// v2: POST /orders body: { items: [...], note?: string }  // optional — old clients still work

// ✅ SAFE: adding new enum VALUES is usually safe IF consumers handle unknown values
// v1 enum: ['pending', 'confirmed', 'delivered']
// v2 enum: ['pending', 'confirmed', 'shipped', 'delivered']  // 'shipped' is new
// But: if consumer switch-statements throw on unknown enum values → BREAKING for them

// ADDITIVE RENAME PATTERN: add new + keep old during sunset
// During transition period:
{ "name": "John", "fullName": "John" }  // both present
// After sunset period:
{ "fullName": "John" }                  // old field removed`,
  },
  {
    label: 'Deprecation Headers',
    language: 'typescript',
    code: `import { Request, Response, NextFunction } from 'express';

// Middleware to mark deprecated endpoints
function deprecated(sunsetDate: Date, alternativeUrl?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // RFC 8594 Sunset header — signals removal date
    res.setHeader('Sunset', sunsetDate.toUTCString());
    res.setHeader('Deprecation', 'true');

    if (alternativeUrl) {
      // Link header with deprecation rel — tooling can surface this
      res.setHeader('Link', \`<\${alternativeUrl}>; rel="successor-version"\`);
    }

    // Log which consumer is using the deprecated endpoint
    const consumer = req.headers['x-api-key'] ?? req.user?.sub ?? 'unknown';
    console.warn(\`[DEPRECATED] \${req.method} \${req.path} used by \${consumer}\`);

    next();
  };
}

// Apply to deprecated endpoints
app.get('/v1/orders',
  deprecated(new Date('2025-12-31'), '/v2/orders'),
  handleListOrdersV1
);

// Tip: track usage in a DB to know which consumers still use deprecated endpoints
async function trackDeprecatedUsage(endpoint: string, consumer: string) {
  await db.deprecatedUsage.upsert({
    endpoint,
    consumer,
    lastSeen: new Date(),
    count: { increment: 1 },
  });
}

// openapi-diff in CI: compare specs and fail on breaking changes
// package.json script:
// "check:breaking": "openapi-diff api-v1.yaml api-v2.yaml --fail-on-incompatible"`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Removing or renaming response fields without a deprecation period',
    wrong: `// v1: { "id": "42", "user_name": "John" }
// v2 (released Monday): { "id": "42", "userName": "John" }
// All consumers reading user_name get undefined — silent data bug`,
    right: `// Transition: both names present for 6+ months
// v1.5: { "id": "42", "user_name": "John", "userName": "John" }
// Announce: user_name is deprecated, use userName, sunset: 2025-12-31
// v2 (after sunset): { "id": "42", "userName": "John" }`,
    explanation: 'Consumers cache field names in models, types, and databases. Removing or renaming a field without a transition period causes silent null/undefined bugs — often only caught in production when data is missing. Always add the new name first, then remove the old after the documented sunset date.',
  },
  {
    title: 'Adding a required field to an existing request schema',
    wrong: `// v1: POST /orders body: { items: [...] }
// v2: POST /orders body: { items: [...], deliveryAddress: {...} }  ← now required
// Old clients sending { items: [...] } get 400 errors immediately`,
    right: `// Make new fields optional with a sensible default, or version the endpoint
// Option A: optional with default
// v2: POST /orders body: { items: [...], deliveryAddress?: {...} }
// Option B: add /v2/orders with required address; keep /v1/orders working`,
    explanation: 'Making a previously optional request field required is one of the most common breaking changes. Old clients do not know to include the new field and immediately start getting 400 errors. Either make new fields optional, provide a default, or version the endpoint.',
  },
  {
    title: 'Not running automated breaking-change detection in CI',
    wrong: `# Changes to openapi.yaml are reviewed manually
# Reviewer missed that a field was made required
# Deployed — consumers start failing`,
    right: `# .github/workflows/api-check.yml
- name: Check for breaking changes
  run: npx openapi-diff api-prev.yaml api-new.yaml --fail-on-incompatible
# CI fails on any breaking change — requires explicit approval to merge`,
    explanation: 'Manual review of API diffs misses subtle breaking changes. Automated tools (openapi-diff/oasdiff, Bump.sh) classify every change as breaking or non-breaking and fail CI. This forces breaking changes to be deliberate, documented decisions — not accidental typos in a YAML file.',
  },
  {
    title: 'Treating enum additions as always safe',
    wrong: `// Added 'shipped' to order status enum without notice
// Consumer code:
switch (order.status) {
  case 'pending': ...; break;
  case 'confirmed': ...; break;
  case 'delivered': ...; break;
  default: throw new Error('Unknown status'); // ← crashes on 'shipped'
}`,
    right: `// Design consumers to handle unknown enum values gracefully
switch (order.status) {
  case 'pending': ...; break;
  case 'confirmed': ...; break;
  case 'delivered': ...; break;
  default: console.warn('Unhandled status:', order.status); // graceful degradation
}
// AND: document that consumers should handle unknown values; announce in changelog`,
    explanation: 'Adding enum values looks non-breaking but breaks consumers with exhaustive switch statements that throw on unknown values. Document that consumers must handle unknown enum values gracefully. Still announce new values in release notes to give consumers time to handle them intentionally.',
  },
];

const challenge: Challenge = {
  title: 'Classify API Changes',
  language: 'typescript',
  description: `Implement classifyChange(before: any, after: any): 'breaking' | 'non-breaking' | 'safe' that:
- 'breaking': a field present in before is missing in after (removed)
- 'non-breaking': after has fields not in before (added)
- 'safe': both have identical field sets
Compare only top-level field names.`,
  hints: [
    'Object.keys(before) to get field names',
    'Check if any before field is missing from after for breaking',
  ],
  starterCode: `function classifyChange(before: any, after: any): 'breaking' | 'non-breaking' | 'safe' {
  // Classify based on field additions/removals
  return 'safe';
}

const v1 = { id: '', name: '', email: '' };
const v2add = { id: '', name: '', email: '', phone: '' };
const v2remove = { id: '', name: '' };

console.log(classifyChange(v1, v2add));    // non-breaking
console.log(classifyChange(v1, v2remove)); // breaking
console.log(classifyChange(v1, v1));       // safe`,
  solution: `function classifyChange(before: any, after: any): 'breaking' | 'non-breaking' | 'safe' {
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = new Set(Object.keys(after));

  const removed = [...beforeKeys].filter(k => !afterKeys.has(k));
  const added = [...afterKeys].filter(k => !beforeKeys.has(k));

  if (removed.length > 0) return 'breaking';
  if (added.length > 0) return 'non-breaking';
  return 'safe';
}

const v1 = { id: '', name: '', email: '' };
const v2add = { id: '', name: '', email: '', phone: '' };
const v2remove = { id: '', name: '' };

console.log(classifyChange(v1, v2add));    // non-breaking
console.log(classifyChange(v1, v2remove)); // breaking
console.log(classifyChange(v1, v1));       // safe`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which of the following is a NON-breaking API change?',
    options: [
      'Removing a required field from the response body',
      'Renaming a request body field from "userId" to "user_id"',
      'Adding a new optional field to the response body that old consumers will ignore',
      'Changing a field type from string to number',
    ],
    answer: 2,
    explanation: 'Adding new optional response fields is non-breaking — old consumers that do not know about the field simply ignore it. This is the foundation of additive API evolution. Removing fields, renaming fields, and changing types are all breaking changes because they require existing consumer code to be updated.',
  },
  {
    q: 'What is the RFC 8594 Sunset header used for?',
    options: [
      'To specify the cache expiry time for an API response',
      'To signal the date on which a deprecated endpoint will be removed',
      'To indicate that the server is shutting down for maintenance',
      'To set the session timeout for authenticated users',
    ],
    answer: 1,
    explanation: 'The Sunset header (RFC 8594) carries a date-time value indicating when the endpoint will be decommissioned: Sunset: Sat, 31 Dec 2025 00:00:00 GMT. Tooling and API gateways can read this header to warn consumers. It is sent alongside Deprecation: true during the sunset period.',
  },
  { q: 'Which of the following changes to an API response is a breaking change?', options: ['Adding a new optional field to the response body', 'Removing a field from the response body that clients currently read', 'Adding a new HTTP endpoint that did not previously exist', 'Reducing the maximum response time from 2 seconds to 1 second'], answer: 1, explanation: 'Breaking changes to response bodies: removing a field — clients that read the field will get undefined/null/error. Renaming a field (user_id to userId) — same as removing the old field from the client perspective. Changing field type (string to number) — clients that treat the value as a string will fail. Making a previously optional field required in the request — existing clients that omit the field will get 400 errors. Changing enum values or removing enum options. Non-breaking changes: adding new optional response fields (clients using strict deserialization may reject them — document this). Adding new optional request parameters with defaults. Adding new endpoints. Changing documentation without changing behavior. Adding new HTTP methods to an existing endpoint.' },
  { q: 'What is a breaking change in terms of HTTP status codes?', options: ['Changing a 201 Created to a 200 OK is not a breaking change because both indicate success', 'Changing the HTTP status code returned for an operation is a breaking change if clients branch on status codes; changing 200 to 201, or 400 to 422, can break error handling logic', 'Only changing 2xx to 4xx or 5xx codes constitutes a breaking change', 'HTTP status code changes are never breaking because clients should only check success vs failure'], answer: 1, explanation: 'Status code changes as breaking: clients that check for specific status codes will break if the code changes. Example: a client that checks if response.status === 200 and does nothing for 201 will miss successful creations if the API changes from 200 to 201. Changing 400 to 422: a client that handles 400 (bad request) might not handle 422 (unprocessable entity) the same way. Changing a success code to a client error: always breaking. Even 200 to 201: technically breaking for strict equality checks. Best practice: once a status code is established for an endpoint, do not change it. If the HTTP semantics were wrong originally, the fix must be in the next major version with documentation of the change.' },
  { q: 'What is the tolerant reader pattern and how does it reduce the impact of API changes?', options: ['A pattern where the API tolerates invalid input by silently ignoring it', 'A pattern where API clients are designed to ignore unexpected fields, tolerate missing optional fields, and not break when the API evolves', 'A caching pattern that tolerates stale responses during high load', 'A server-side pattern that provides default values for all missing fields'], answer: 1, explanation: 'Tolerant reader (Martin Fowler): design your API clients to be resilient to changes. Ignore unknown fields: do not use strict deserialization that throws on unknown fields. When the API adds a new field, existing clients should not fail. Accept optional missing fields: treat absent fields as null or use defaults. Do not reject a response because an optional field is missing. Be flexible about field types: if a field is defined as a string but might evolve to number, accept both. Use message or data formats that support extensibility (JSON, Protobuf with reserved fields). Apply in practice: configure your JSON deserializer to ignore unknown properties (Jackson DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES = false in Java). This allows the API to add fields without the client breaking.' },
  { q: 'What is the strangler fig pattern and how does it apply to API migration?', options: ['A pattern for gradually replacing legacy APIs by routing new clients to the new API while old clients continue using the old one', 'A pattern for strangling noisy API consumers using rate limiting', 'A deployment pattern for gradually rolling out a new API version using traffic splitting', 'A pattern where old API endpoints are gradually removed to force clients to migrate'], answer: 0, explanation: 'Strangler fig pattern (Martin Fowler): inspired by how strangler figs grow around a host tree and gradually replace it. Applied to API migration: deploy the new API alongside the old one. Route new consumers to the new API. Gradually migrate existing consumers from the old to the new API. Once all consumers have migrated, decommission the old API. The old API is slowly strangled by the new one. Implementation: an API gateway or reverse proxy routes requests: by URL version prefix (/v1/ vs /v2/). By consumer ID (legacy consumer IDs go to the old API). By feature flag. Benefits: no big-bang cutover. Risk is reduced because both systems run simultaneously. Rollback is possible by re-routing to the old API.' },
  { q: 'Why is adding a required field to a request body a breaking change?', options: ['Adding required fields is never breaking — clients that omit them get validation errors which is expected behavior', 'Adding a required field is breaking because all existing clients that do not send it receive 400 or 422 errors on previously valid requests until they update their code', 'Adding required fields is only breaking for JSON clients — XML and gRPC clients handle new required fields transparently', 'Required fields are only breaking when added to GET endpoints — POST and PUT endpoints can always add required fields'], answer: 1, explanation: 'Adding a required field is always a breaking change: existing clients that do not send the new field receive validation errors. Previously valid requests now fail. Why this matters: a client may be in production, unable to update immediately. Even an internal client (another microservice) may have a separate deployment schedule. The time window between deploying the API change and updating all clients causes real service disruption. Safe evolution: always add new fields as optional with sensible defaults. After clients have migrated to send the new field, monitor request logs to confirm all active clients send it before considering making it required. Even making an already-optional field required is a breaking change — clients that omit it will break. Never make fields required without a major version change.' },
  { q: 'What is the Expand-Contract pattern for zero-downtime API evolution?', options: ['Adding new endpoints before removing old ones with a 24-hour waiting period between operations', 'Expand-Contract first expands the API to support both old and new formats simultaneously, then contracts by removing the old format after all clients migrate — turning breaking changes into a series of non-breaking steps', 'A database migration pattern that only applies when the API and database deploy simultaneously', 'Maintaining two separate API servers in parallel, routing clients based on a version header'], answer: 1, explanation: 'Expand-Contract (Parallel Change): Phase 1 — Expand: add the new field alongside the old. Accept both old and new formats on input. Return both old and new fields in responses. Nothing breaks — old clients use the old field; new clients use the new one. Phase 2 — Migrate clients: update all consumers to use the new field. Monitor response logs to confirm no active consumers still use the old field. Phase 3 — Contract: remove the old field from responses. This step is now non-breaking because no active client uses the old field. Example — renaming "userName" to "fullName": Expand: return both { "userName": "Alice", "fullName": "Alice" }. All clients migrate to fullName. Contract: return only { "fullName": "Alice" }. Timeline: the expand phase can last as long as needed — 30-90 days gives slow consumers time to migrate. This pattern makes every breaking change achievable without a version increment, though it requires discipline and monitoring.' },
  { q: 'How do automated tools detect breaking changes in OpenAPI specifications?', options: ['Breaking change detection requires manual review — no automated tool can reliably detect semantic breaking changes', 'Tools like openapi-diff/oasdiff compare two OpenAPI spec versions and flag breaking changes such as removed paths, added required fields, changed types, and modified response schemas', 'Breaking changes can only be detected at runtime via consumer error monitoring — static spec analysis misses too many cases', 'Only major version increments trigger breaking change detection — minor changes are assumed non-breaking by all tooling'], answer: 1, explanation: 'Automated breaking change detection: openapi-diff/oasdiff — compares two OpenAPI specs and classifies changes as breaking, potentially breaking, or non-breaking. Breaking: path removed, required parameter added, response field removed or type changed, security scheme removed. Potentially breaking: new required response field (strict clients may fail). Non-breaking: new optional parameter, new path, new optional response field. Spectral is a DIFFERENT kind of tool -- a linter that validates a SINGLE spec against a style ruleset (naming conventions, required descriptions); it has no way to compare two spec versions against each other and cannot detect breaking changes on its own. buf breaking: detects breaking changes in Protocol Buffer schemas. graphql-inspector: compares two GraphQL schemas. CI integration: on every PR, compare the PR spec against the production spec. Fail the PR if breaking changes are detected and the branch is not a new major version branch. Limitation: tools detect structural breaking changes, not semantic ones. Changing the meaning of a field value (status "1" was "active" now means "inactive") is not detectable by tooling.' },
  { q: 'How does removing an enum value differ from adding one in terms of breaking changes?', options: ['Both adding and removing enum values are breaking — any enum change requires a major version increment', 'Removing an enum value is always breaking (clients that send or expect it fail); adding a new value is potentially breaking for strict clients that do exhaustive pattern matching', 'Enum changes are non-breaking because enums are treated as strings and clients handle any string gracefully', 'Removing a value is non-breaking because clients stop seeing it; adding a value is always breaking'], answer: 1, explanation: 'Removing an enum value is always a breaking change: clients that send the removed value receive validation errors. Clients that receive the value in responses may crash on unhandled enum cases if they use exhaustive switch/match. Adding a new enum value is potentially breaking: clients using exhaustive pattern matching (TypeScript discriminated unions, switch without a default case) may fail at runtime when they receive an unexpected value. Best practice for client developers: always include a default/unknown handler for any enum from an external API — never assume an enum is closed. Best practice for API providers: document enums as either closed (stable — new values require a major version) or open (new values may be added — clients must handle unknown values). String extensibility: use a string with documented valid values rather than a strict enum type when the set of values is expected to grow. If the enum is closed, any addition or removal requires a major version.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you handle breaking changes that are unavoidable?',
    a: 'When a breaking change is genuinely unavoidable (security fix, fundamental design flaw, legal requirement): <ol><li><strong>Version the API</strong> — introduce /v2 with the breaking change; keep /v1 running</li><li><strong>Announce early</strong> — minimum 6 months notice for public APIs, 1–3 months for internal</li><li><strong>Add Deprecation + Sunset headers</strong> on v1 responses immediately</li><li><strong>Migration guide</strong> — document exactly what changed and how to update</li><li><strong>Reach out to high-traffic consumers</strong> — check your usage logs for the deprecated endpoint; contact those teams directly</li><li><strong>Provide a migration tool or adapter</strong> if the change is complex (e.g., a compatibility shim that translates v1 requests to v2 format)</li><li><strong>Track migration progress</strong> — deprecation usage logs show remaining consumers; send reminders as sunset date approaches</li></ol>Never remove a version while consumers are actively using it — "sunset date" is a commitment, not a suggestion.',
  },
  {
    q: 'Should you version every change or use a version-free evolutionary approach?',
    a: 'Both approaches work — the tradeoff is between stability and simplicity: <ul><li><strong>Additive evolution (version-free)</strong>: only ever add; never remove or rename. Works long-term if you have discipline. Stripe has used this since 2011 — one URL, backwards-compatible forever. Requires strong governance and design discipline to avoid a messy schema. Best for APIs with many diverse consumers where version migration is painful.</li><li><strong>URL versioning (/v1, /v2)</strong>: explicit; consumers opt into new versions; old versions kept running for a sunset period. Simpler to reason about. Requires maintaining two versions simultaneously. Best for APIs where breaking changes are occasional but inevitable (major product pivots, security overhauls).</li></ul>Most teams use a hybrid: additive evolution as the default, URL versioning for genuine breaking changes. The wrong choice is neither — randomly changing your API without a strategy.',
  },
  { q: 'How do you communicate breaking changes to API consumers?', a: 'Breaking change communication strategy: API changelog: maintain a public changelog with full details of each change: date, type (breaking/non-breaking), affected endpoints, migration steps, before/after examples. Email notification: notify all registered API consumers via email well in advance (6-12 months for external consumers). HTTP headers in responses: add Deprecation: date and Sunset: date headers to deprecated endpoints months before removal. Developer portal: post prominent migration guides with code examples. Major version badge: increment the major version number (v1 to v2) so the change is obvious in URLs. SDK updates: release new SDK versions that support both old and new behavior during the migration period. Beta programs: invite consumers to test the new version before it is stable and provide feedback.' },
  { q: 'What are the most common sources of unintentional breaking changes?', a: 'Unintentional breaking changes: changing JSON serialization library defaults — a library update might change how null fields are serialized (null vs omitted). Changing ORM behavior — an ORM update might change the date format in responses. Adding stricter input validation — your new validation rejects inputs that old clients send (they were technically invalid but accepted). Changing default sort order — responses now return records in a different order, breaking clients that relied on the ordering. Changing database schema — a column renamed or split causes different values in the API response. Timezone handling changes — dates that were local time are now UTC. Changing how errors are serialized — error object structure changes break client error handling. Prevention: contract testing (consumer-driven contracts), automated backward compatibility checks (openapi-diff, spectral), comprehensive API test suites that run on each deployment.' },
  { q: 'How do you detect when a proposed change is a breaking change?', a: 'Automated breaking change detection: OpenAPI diff tools: compare the old and new OpenAPI (swagger) specifications. Tools: openapi-diff/oasdiff, Redocly CLI. Report removed fields, changed types, and removed endpoints automatically. Contract tests: Pact (consumer-driven contracts) — consumer-side tests define what the API must provide. If a proposed change would fail a consumer contract test, it is breaking. Database diff: if the ORM schema changes in a way that affects serialized output, detect it via schema migration diff. Manual review checklist: for each changed endpoint, ask: could existing clients still send the same request? Could existing clients still parse the response without code changes? Do any HTTP status codes change? Do any required fields change? Are any endpoints renamed or removed? Run the checklist in code review for every API change.' },
  { q: 'What is the Postel law and how does it apply to API design?', a: 'Postel law (Jon Postel, RFC 793): be conservative in what you do, be liberal in what you accept from others. Applied to APIs: liberal input processing: accept minor variations in input format (extra whitespace, field order, additional unknown fields, slightly wrong case in enum values). This allows clients to evolve without strict synchronization. Conservative output production: always return exactly the documented schema. Never add undocumented fields silently. Always use exactly the documented status codes. Do not rely on clients being tolerant readers. Tension: liberal input acceptance can hide client bugs (a misspelled field name is silently ignored instead of returning a 400 error). Strict input validation is better for development-time error detection. Resolution: use strict validation in non-production environments to catch client bugs during development. Consider using liberal acceptance in production to reduce the impact of minor client issues.' },
  { q: 'Why is measuring deprecated-endpoint traffic AFTER an announcement more important than the announcement itself for a safe migration?', a: 'An announcement (changelog, email, SDK warning) only proves the message was SENT — it says nothing about whether anyone actually read it, understood it, or acted on it. Monitoring actual traffic to the deprecated endpoint over time is the only real signal of whether consumers are genuinely migrating: if traffic isn\'t declining weeks after the announcement, that tells you concretely which specific callers (via API key or client identifier) still need direct outreach, long before the sunset date arrives — waiting until the sunset date to discover active traffic is still flowing means finding out about a problem only when it becomes a production outage, instead of catching it early enough to intervene.' },
  { q: 'What is the difference between a breaking change and a behavior change?', a: 'Breaking change: alters the API interface in an incompatible way — clients must update their code to keep working. Examples: removed field, changed type, added required field. Detected by schema comparison tools (openapi-diff/oasdiff). Clearly versioned and announced. Behavior change: the API interface remains identical but the behavior changes. Examples: changing sort order of results (ascending to descending). Changing precision of floating-point calculations. Fixing a bug that clients depended on as a feature. Changing time zone handling for date calculations. NOT detected by schema comparison tools. NOT caught by contract tests unless they verify the specific behavior. Risk: behavior changes can be equally impactful as structural breaking changes. A client that depends on a specific sort order will silently produce wrong results after a sort order change — no validation error, just wrong behavior. Process for behavior changes: document existing behavior explicitly in prose documentation, not just the schema. Write behavioral tests that capture documented semantics. Treat any change to documented behavior as a breaking change requiring versioning and announcement.' },
  { q: 'How do you handle breaking changes specifically for mobile app clients?', a: 'Mobile challenge: mobile apps are distributed to millions of devices via app stores. Users do not always update. A breaking API change can affect an app version still running on user devices — sometimes years after the release. The long tail of old app versions is a real production constraint. Strategies: never remove endpoints prematurely — keep old endpoints for 2+ years for mobile apps. Version compatibility: maintain /v1/ indefinitely for old app versions, add /v2/ for new clients. Route by user-agent header or API version header to the appropriate backend. Feature flags: include min_required_version in API responses: { "min_required_version": "3.5.0" }. Old app versions check this and prompt for update before proceeding. Graceful degradation: design the app to handle missing fields — if a new field is absent (old API version), show a sensible default. Force upgrade: for critical security changes, use 426 Upgrade Required or a custom force_upgrade flag. Analytics: use app store data and API request analytics to understand user version distribution. Set the sunset date when fewer than 1% of users would be affected.' },
  { q: 'How do you manage breaking changes in a microservices architecture?', a: 'Microservices breaking change challenges: many services depend on each other. A breaking change in Service A can affect B, C, and D simultaneously. Coordinated deployment is complex and risky. Consumer-driven contracts: the primary safeguard — run consumer contracts from all dependent services against the new version in CI. If any contract fails, the change is blocked until that consumer updates. Canary deployment: deploy the new API version to a subset of instances. Route a small percentage of traffic to the new version. Monitor error rates from downstream consumers. Gradually shift traffic as confidence grows. API gateway versioning: route v1 traffic to old service instances and v2 traffic to new ones at the gateway level — infrastructure handles version routing without application-level changes. Expand-Contract pattern: for internal APIs, prefer Expand-Contract over version bumps. Internal services have faster deployment cycles than external clients, making gradual migration practical. Schema registry: use a schema registry (Confluent for Kafka/Avro, Buf for Protobuf) that enforces backward compatibility checks before schemas reach production — the registry rejects incompatible schema updates automatically.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Breaking changes require version bumps — prefer additive evolution; deprecate with Sunset headers; automate detection in CI with openapi-diff.',
  mustKnow: [
    'Breaking: removing/renaming fields, changing types, making optional required',
    'Non-breaking: adding new optional fields, new endpoints, new optional params',
    'Additive evolution: only add, never remove — safe by default strategy',
    'Deprecation process: Deprecation: true + Sunset header + 6–12 month notice',
    'openapi-diff in CI — auto-classify changes as breaking/non-breaking, fail on breaking',
    'Consumer-driven contract tests (Pact) — consumers define expectations; provider runs them',
  ],
  interviewFocus: [
    'What is a breaking API change? Give three examples.',
    'How do you handle an unavoidable breaking change in a public API?',
    'What is additive API evolution?',
  ],
};

@Component({
  selector: 'app-api-breaking-changes',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './breaking-changes.html',
  styleUrl: './breaking-changes.scss',
})
export class ApiBreakingChanges {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
