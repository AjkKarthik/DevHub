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
      'Tools: openapi-diff, Optic, or Bump.sh — diff two OpenAPI spec versions and classify each change as breaking or non-breaking.',
      'Run in CI: any PR that changes the API spec gets an automated breaking-change report. Reviewers must explicitly approve breaking changes.',
      'Consumer-driven contract tests (Pact): consumers write expectations; providers run them. A breaking change fails the provider\'s Pact tests before deployment.',
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
    explanation: 'Manual review of API diffs misses subtle breaking changes. Automated tools (openapi-diff, Optic, Bump.sh) classify every change as breaking or non-breaking and fail CI. This forces breaking changes to be deliberate, documented decisions — not accidental typos in a YAML file.',
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
