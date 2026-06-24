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
