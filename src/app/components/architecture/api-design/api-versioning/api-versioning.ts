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
  { name: 'URL Segment',     type: 'keyword', desc: '/v1/users — most discoverable; easy to test in browser; breaks REST URI purity.' },
  { name: 'Header',          type: 'keyword', desc: 'API-Version: 2 or Accept: application/vnd.api.v2+json — clean URLs; less cacheable.' },
  { name: 'Query Param',     type: 'keyword', desc: '/users?version=2 — simple but pollutes query string; easy to cache.' },
  { name: 'Sunset Header',   type: 'keyword', desc: 'Sunset: Sat, 01 Jan 2026 00:00:00 GMT — signals deprecation date to clients.' },
  { name: 'Breaking Change', type: 'keyword', desc: 'Any change that requires existing clients to update code — requires a version bump.' },
  { name: 'Non-Breaking',    type: 'keyword', desc: 'Adding optional fields, new endpoints, new query params — clients can ignore them.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Why Version APIs',
    points: [
      'APIs are contracts. Once published, clients depend on the exact shape of requests and responses. Breaking that shape breaks clients.',
      'Versioning lets you evolve the API without forcing all consumers to update simultaneously. Old and new clients can coexist.',
      'Rule of thumb: API surface is forever. Every field you expose, every endpoint you create becomes a commitment. Design carefully the first time.',
      'Not all changes require versioning. Adding optional response fields, new optional query parameters, or entirely new endpoints are non-breaking — existing clients ignore what they don\'t know about.',
    ],
  },
  {
    heading: 'URL Segment Versioning',
    points: [
      'Pattern: /v1/users, /v2/users. The version number is part of the URL path.',
      'Advantages: most discoverable — visible in browser address bar, curl commands, logs, and documentation. Easy to route in load balancers and API gateways.',
      'Disadvantages: technically violates REST (the same resource has multiple URIs). Hard to navigate: /v1/users and /v2/users can return different shapes for the same logical resource.',
      'Used by: GitHub API (/v3/), Twitter API (/2/), Stripe API (/v1/). Despite the theoretical downside, URL versioning is the industry standard for public APIs.',
    ],
  },
  {
    heading: 'Header and Content Negotiation Versioning',
    points: [
      'Custom header: `API-Version: 2` or `X-API-Version: 2024-01-15` (date-based). The URL stays the same — /users always.',
      'Content negotiation: `Accept: application/vnd.myapi.v2+json`. REST-pure — the URI identifies the resource; the Accept header selects the representation version.',
      'Advantages: clean URLs that don\'t change between versions. Better for REST purists.',
      'Disadvantages: harder to test (can\'t just change the URL in a browser); less cacheable (version in a header, not the cache key URL); easy to forget to send the header.',
    ],
  },
  {
    heading: 'Deprecation and Sunset Strategy',
    points: [
      'Never remove a version abruptly. Announce deprecation at least 6-12 months in advance for public APIs.',
      'Use the `Sunset` response header on deprecated endpoints: `Sunset: Sat, 01 Jan 2026 00:00:00 GMT`. Clients can parse this header to detect the deadline programmatically.',
      'Send a `Deprecation: true` header and a `Link: </v2/users>; rel="successor-version"` header to point clients to the new version.',
      'Monitor which clients still call deprecated endpoints — send warning emails if you have contact info. Track usage by API key so you know who to chase.',
      'Date-based versioning (e.g., 2024-01-15) avoids the semantic debate of major vs minor; each date is a snapshot of the API contract.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'URL Versioning (Express)',
    language: 'typescript',
    code: `import express from 'express';
const app = express();

// Version 1 router
const v1 = express.Router();
v1.get('/users', async (req, res) => {
  // v1: returns { id, name, email }
  const users = await db.users.findMany({ select: { id: true, name: true, email: true } });
  res.json(users);
});

// Version 2 router — new shape with pagination
const v2 = express.Router();
v2.get('/users', async (req, res) => {
  // v2: returns { data: [...], pagination: {...} } + new displayName field
  const users = await db.users.findMany({
    select: { id: true, name: true, email: true, displayName: true },
  });
  res.json({ data: users, pagination: { total: users.length } });
});

// Mount versioned routers
app.use('/v1', v1);
app.use('/v2', v2);

// Deprecation headers on v1
v1.use((req, res, next) => {
  res.header('Sunset', 'Sat, 01 Jan 2026 00:00:00 GMT');
  res.header('Deprecation', 'true');
  res.header('Link', '</v2' + req.path + '>; rel="successor-version"');
  next();
});`,
  },
  {
    label: 'Header Versioning',
    language: 'typescript',
    code: `// Header-based versioning — URL stays the same
app.get('/users', (req, res, next) => {
  const version = req.headers['api-version'] || '1';

  if (version === '2') {
    return handleV2Users(req, res);
  }
  return handleV1Users(req, res);
});

// Middleware to warn on missing version header
app.use((req, res, next) => {
  if (!req.headers['api-version']) {
    res.header('Warning', '299 - "No API-Version header; defaulting to v1. Upgrade to v2."');
  }
  next();
});

// Date-based versioning (Stripe / Cloudflare style)
app.use((req, res, next) => {
  const version = req.headers['stripe-version'] as string ?? '2024-01-01';
  req.apiVersion = version;
  next();
});

app.get('/charges', (req, res) => {
  const version = req.apiVersion;
  if (version >= '2024-06-01') {
    // New response shape introduced in June 2024
    return res.json(buildV2ChargeResponse());
  }
  return res.json(buildV1ChargeResponse());
});`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Removing an API version without a deprecation period',
    wrong: `// v1 deleted on Monday with no warning
// All v1 clients wake up on Tuesday with 404s`,
    right: `// 1. Add Sunset header 6+ months ahead
res.header('Sunset', 'Sat, 01 Jan 2026 00:00:00 GMT');
// 2. Monitor v1 usage; contact clients still calling it
// 3. Remove v1 only after sunset date passes`,
    explanation: 'Deleting a version without notice breaks every client that hasn\'t migrated. Announce deprecation with a Sunset header at least 6 months in advance, monitor usage, and only delete after the deadline.',
  },
  {
    title: 'Bumping the major version for non-breaking changes',
    wrong: `// Added an optional 'displayName' field → new v2!
// Now every client has to update their code for no reason`,
    right: `// Adding optional fields is non-breaking — no version bump needed
// Old clients ignore the new field; new clients can use it`,
    explanation: 'Adding optional fields, new endpoints, or new optional query parameters is non-breaking. Clients that don\'t know about the new field simply ignore it. Reserve version bumps for genuinely breaking changes: removing fields, changing types, renaming fields, changing behaviour.',
  },
  {
    title: 'No version at all ("evergreen" API)',
    wrong: `// No versioning — any change can break clients
GET /users  → { name: string }
// Changed to: { firstName: string, lastName: string } — all clients break`,
    right: `GET /v1/users → { name: string }
// v1 stays stable forever
GET /v2/users → { firstName: string, lastName: string }`,
    explanation: 'An unversioned API cannot be changed without risking breaking clients. The longer the API lives, the more clients exist, the more painful any change becomes. Version from day one — even if you start at /v1/ with no v2 plans.',
  },
  {
    title: 'Using v1.0, v1.1, v1.2 for every small change',
    wrong: `GET /v1.2.3/users  // semantic versioning in the URL is awkward`,
    right: `GET /v1/users   // major version only in the URL
// Minor/patch versions are non-breaking — no URL change needed`,
    explanation: 'URL versioning should track major (breaking) versions only. Minor and patch changes (non-breaking) don\'t need a new URL. Semantic versioning in URLs clutters routes and confuses clients about which version to call.',
  },
];

const challenge: Challenge = {
  title: 'Version Router',
  language: 'typescript',
  description: `Implement routeByVersion(version: string, path: string): string that returns:
- If version is '1': '/v1' + path
- If version is '2': '/v2' + path
- If version is unrecognised: throw Error('Unsupported API version: ' + version)
Then implement isBreakingChange(change: string): boolean that returns true for:
'remove-field', 'rename-field', 'change-type', 'remove-endpoint'
and false for: 'add-optional-field', 'add-endpoint', 'add-query-param'`,
  hints: [
    'routeByVersion: use a simple lookup or switch',
    'isBreakingChange: use a Set of known breaking changes',
  ],
  starterCode: `function routeByVersion(version: string, path: string): string {
  // TODO
  return '';
}

function isBreakingChange(change: string): boolean {
  // TODO
  return false;
}`,
  solution: `function routeByVersion(version: string, path: string): string {
  const supported = ['1', '2'];
  if (!supported.includes(version)) throw new Error(\`Unsupported API version: \${version}\`);
  return \`/v\${version}\${path}\`;
}

function isBreakingChange(change: string): boolean {
  const BREAKING = new Set(['remove-field', 'rename-field', 'change-type', 'remove-endpoint']);
  return BREAKING.has(change);
}

console.log(routeByVersion('1', '/users'));         // /v1/users
console.log(routeByVersion('2', '/orders'));        // /v2/orders
console.log(isBreakingChange('remove-field'));      // true
console.log(isBreakingChange('add-optional-field')); // false`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which versioning strategy is used by most major public APIs (GitHub, Stripe, Twitter)?',
    options: [
      'Header versioning (API-Version: 2)',
      'Content negotiation (Accept: application/vnd.api.v2+json)',
      'URL segment versioning (/v1/users)',
      'Query parameter versioning (?version=2)',
    ],
    answer: 2,
    explanation: 'URL segment versioning (/v1/, /v2/) is by far the most common in public APIs. GitHub uses /v3/, Stripe uses /v1/ (stable) with date headers for sub-versions, Twitter uses /2/. It\'s discoverable, easy to route, and appears in logs and browser address bars.',
  },
  {
    q: 'Which of these changes requires a new API version (is a breaking change)?',
    options: [
      'Adding a new optional field to a response',
      'Adding a new endpoint',
      'Renaming a required field from "name" to "fullName"',
      'Adding a new optional query parameter',
    ],
    answer: 2,
    explanation: 'Renaming a required field is a breaking change — existing clients that read or send "name" will break. Adding optional fields, new endpoints, or new optional parameters are non-breaking — clients that don\'t know about them simply ignore the additions.',
  },
  { q: 'What are the main API versioning strategies and their tradeoffs?', options: ['Only URL path versioning is acceptable for production APIs', 'URL path (/v1/), query parameter (?version=1), custom header (X-API-Version), and content negotiation (Accept: application/vnd.api.v1+json); URL path is most visible and cacheable', 'API versioning should be avoided entirely by maintaining backward compatibility', 'All strategies are identical in terms of caching behavior and routing'], answer: 1, explanation: 'Versioning strategies: URL path versioning (/v1/users, /v2/users): most common. Explicit and easy to route in reverse proxies. URLs are bookmarkable. Works with all HTTP clients. Query parameter versioning (?api-version=2024-01-01): used by Azure APIs. Easy for clients. Cannot be used in some URL-only routing. Header versioning (X-API-Version: 2): cleaner URLs. Harder to test in a browser. Cannot be cached by CDN without Vary headers. Content negotiation (Accept: application/vnd.myapi.v2+json): follows HTTP spec most closely. Complex to implement. Rarely used in practice. Recommended: URL path versioning for external-facing public APIs. Date-based versioning (Azure style) for rapidly evolving internal APIs.' },
  { q: 'How long should deprecated API versions be maintained?', options: ['Deprecated API versions should be removed within 30 days', 'The deprecation period depends on the consumer ecosystem; internal APIs: 3-6 months; external partner APIs: 6-18 months; public APIs: 12-24 months with multiple notice channels', 'All API versions must be maintained forever to avoid breaking any caller', 'Deprecated versions should be removed immediately when the new version is released'], answer: 1, explanation: 'Deprecation timelines: internal APIs: teams are aware and can coordinate. 3-6 months allows migration sprints. External partner APIs: partners have release cycles. 6-18 months gives time for testing and deployment. Send deprecation notices via email, changelog, and Sunset HTTP header. Public/open APIs: consumers are unknown and may be inactive or slow to update. 12-24 months with multiple warning channels. Sunset header: Sunset: Wed, 01 Jan 2025 00:00:00 GMT. Clients that ignore documentation notice the header. Monitor usage: do not retire a version still receiving significant traffic regardless of the scheduled date. Forced migration: for security vulnerabilities, the timeline may be shortened; notify urgently.' },
  { q: 'What is the Sunset HTTP header and how does it communicate API retirement?', options: ['A header that schedules server maintenance windows', 'An HTTP response header indicating the date after which an API endpoint or version will no longer be available, allowing clients to plan migration', 'A webhook notification system for API deprecation events', 'A header that controls response caching behavior near an API expiry date'], answer: 1, explanation: 'Sunset header (RFC 8594): Sunset: Sat, 31 Dec 2025 23:59:59 GMT. The server includes this header in responses to indicate when the endpoint will cease to be available. Link header (optional companion): Link: <https://developer.example.com/migration-guide>; rel=sunset. Provides the URL of migration documentation. Client responsibilities: applications monitoring the Sunset header can notify operators proactively. Gateway can log or alert when calling a sunsetted endpoint. API gateway responsibility: the gateway can add Sunset headers to deprecated routes centrally without modifying backend services. Combine with Deprecation header (draft): Deprecation: Wed, 01 Jan 2025 00:00:00 GMT (when deprecation started) and Sunset (when it ends).' },
  { q: 'What is semantic versioning (semver) and how does it apply to API versioning?', options: ['APIs must follow the same exact semver format as software packages (MAJOR.MINOR.PATCH)', 'Semver provides a framework for communicating the impact of changes: MAJOR for breaking changes, MINOR for backward-compatible additions, PATCH for backward-compatible fixes', 'API versioning should only use MAJOR versions because MINOR and PATCH changes are transparent to callers', 'Semver applies only to SDK client libraries, not to the REST API itself'], answer: 1, explanation: 'Semantic versioning for APIs: MAJOR version (breaking change) — increment when you remove a field, change a field type, or remove an endpoint. MINOR version (non-breaking addition) — increment when you add a new optional field, new endpoint, or new optional parameter. PATCH version (non-breaking fix) — increment when you fix a bug that returns an incorrect value but does not change the schema. API versioning in URLs: typically only MAJOR is in the URL path (/v1/, /v2/). MINOR and PATCH changes are transparent. Internal changelog tracks all changes with their semver impact. Communicating impact: semver helps consumers evaluate whether they need to update. A major version increment is a migration trigger; minor/patch versions are safe to auto-update to.' },
];

const qna: QnaItem[] = [
  {
    q: 'How does Stripe handle API versioning so elegantly?',
    a: 'Stripe uses a hybrid approach: the base URL is always <code>/v1/</code> (one major version, considered stable). But each API change is tied to a date-based version (e.g. <code>2024-06-20</code>). Each Stripe account has a "default API version" set in the dashboard. Requests use the account\'s version by default, but you can override it per-request with the <code>Stripe-Version</code> header. This means clients on old versions keep working unchanged, but can opt into new behaviour for specific requests. Stripe maintains backwards compatibility indefinitely for all historical date versions.',
  },
  {
    q: 'How long should I keep old API versions alive?',
    a: 'For public/third-party APIs: minimum 6 months after announcing deprecation; 12 months is the industry norm. For internal APIs between teams: 3–6 months is acceptable if you can coordinate. Before removing: add <code>Sunset</code> header, send email/Slack warnings, monitor which API keys still call the version, and confirm zero usage before deleting. Never remove based on the calendar date alone — check actual traffic first.',
  },
  { q: 'How do you handle versioning for API clients who are slow to migrate?', a: 'Managing slow migration: identify all consumers of the deprecated version via access logs. Segment by traffic volume: high-traffic consumers need direct contact and migration support. Low-traffic consumers may be abandoned projects. Migration incentives: new features are only in the new version. Security patches may not be backported to the old version. SLA guarantees on the old version are reduced. Tools: provide a migration guide (diff of schema changes). Provide code examples for the most common operations. Offer a testing environment. For stuck consumers: some APIs offer a compatibility layer (the new version accepts old request format and transforms it). This is a maintenance burden but can be justified for large consumers. Last resort: if a consumer refuses to migrate past the deadline, serve 410 Gone with a migration URL. Log all failed requests for the ops team.' },
  { q: 'What is the difference between API versioning and API evolution?', a: 'API versioning: explicitly creating new versions (v1, v2) of an API when breaking changes are needed. The old version continues to run alongside the new version. API evolution: making changes to an existing API without creating a new version, relying on backward-compatible techniques. Evolution techniques: additive changes (add new fields, new endpoints). Tolerant readers (clients ignore unknown fields). Expand-contract pattern: the old field and the new field coexist temporarily, then the old field is retired after all clients switch. Consumer-driven contracts: tests that verify the API meets consumer requirements. Preference in practice: pure evolution (no versioning) works well for internal APIs where you control all consumers. Versioning is necessary for external APIs where you cannot coordinate with all consumers. Stripe has used sequential versioning (date-based) with extensive evolution: 2023-10-16 was a version.' },
  { q: 'How do you version APIs in a microservices architecture?', a: 'Microservice API versioning challenges: when service A is upgraded to v2, all services that call A may need to update. Big bang upgrades break the independent deployability of microservices. Strategies: consumer-driven contract testing (Pact): each consumer defines a contract of what it needs from the API. The provider verifies it satisfies all consumer contracts before deployment. This allows independent deployment without coordination. API gateway versioning: the gateway routes /v1/ to service-v1 and /v2/ to service-v2. Both service versions run simultaneously. Gradual traffic shift: deploy service-v2 and route 10% of traffic. Increase gradually as confidence grows. Internal vs external versioning: internal APIs between services can use date-based or simple integer versioning. External APIs exposed via gateway follow a stricter semver policy. Event versioning: for event-driven communication, include schema version in event metadata.' },
  { q: 'What is the expand-contract pattern for API migration?', a: 'Expand-contract (also called parallel change): a technique for backward-compatible API migration without a version bump. Phase 1 - Expand: add the new field or endpoint alongside the old one. Both are supported. New consumers start using the new field. Old consumers continue using the old field. Both fields are documented. Phase 2 - Contract: after all consumers have migrated to the new field (verified by monitoring usage of the old field), deprecate and eventually remove the old field. Example: renaming customer_name to customerName. Expand: response includes both customer_name and customerName with identical values. Contract: after migration, remove customer_name. Benefits: no version bump required. No big-bang migration. Consumers migrate at their own pace within the window. Cost: the API surface temporarily doubles for the affected fields. Requires monitoring to know when old fields are safe to remove.' },
];

const revision: RevisionSummary = {
  oneLiner: 'URL segment versioning (/v1/) is the industry standard; adding optional fields is non-breaking; use Sunset header for deprecation; never remove without a grace period.',
  mustKnow: [
    'URL versioning (/v1/users): most discoverable and widely used by GitHub, Stripe, Twitter',
    'Breaking changes: removing/renaming fields, changing types, removing endpoints',
    'Non-breaking: adding optional fields, new endpoints, new optional query params',
    'Sunset header: Sunset: <date> signals deprecation deadline to clients',
    'Deprecation period: 6–12 months minimum for public APIs',
    'Version from day one — never ship an unversioned public API',
  ],
  interviewFocus: [
    'What is the difference between breaking and non-breaking API changes?',
    'What are the trade-offs between URL versioning and header versioning?',
    'How would you deprecate and sunset an old API version?',
  ],
};

@Component({
  selector: 'app-api-versioning',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './api-versioning.html',
  styleUrl: './api-versioning.scss',
})
export class ApiVersioning {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
