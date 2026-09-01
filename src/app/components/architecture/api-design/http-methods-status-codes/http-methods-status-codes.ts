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
  { name: '200 OK',              type: 'keyword', desc: 'Request succeeded. Use for GET, PUT, PATCH responses with a body.' },
  { name: '201 Created',         type: 'keyword', desc: 'Resource created. Use for POST. Include Location header with the new resource URI.' },
  { name: '204 No Content',      type: 'keyword', desc: 'Success with no response body. Use for DELETE and some PATCHes.' },
  { name: '400 Bad Request',     type: 'keyword', desc: 'Client sent invalid data. Use for malformed JSON or missing required fields.' },
  { name: '401 Unauthorized',    type: 'keyword', desc: 'Authentication required (or invalid credentials). NOT authorization.' },
  { name: '403 Forbidden',       type: 'keyword', desc: 'Authenticated but not permitted to perform this action.' },
  { name: '404 Not Found',       type: 'keyword', desc: 'Resource does not exist at this URI.' },
  { name: '422 Unprocessable',   type: 'keyword', desc: 'Request body is valid JSON but fails business/validation rules.' },
  { name: '429 Too Many Requests', type: 'keyword', desc: 'Rate limit exceeded. Include Retry-After header.' },
  { name: '500 Internal Error',  type: 'keyword', desc: 'Server-side unexpected error. Never expose stack traces to clients.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'HTTP Method Semantics',
    points: [
      'GET: retrieve a resource or collection. Safe (no side effects) and idempotent. Never changes state.',
      'POST: create a new resource at the collection URL. NOT idempotent — calling it twice creates two resources. Returns 201 with Location header.',
      'PUT: replace an entire resource at a known URI. Idempotent — calling it N times has the same result as once. If the resource doesn\'t exist, it may be created (server decides).',
      'PATCH: partial update — only the fields in the request body are changed. May or may not be idempotent depending on the operation. Use for "change name" but not for "increment counter".',
      'DELETE: remove a resource. Idempotent — deleting an already-deleted resource returns 204 or 404 but has no further effect.',
      'HEAD: same as GET but returns only headers (no body). Used for checking resource existence or metadata without downloading the full body.',
      'OPTIONS: returns allowed methods for a resource. Used by CORS preflight requests.',
    ],
  },
  {
    heading: '2xx Success Codes',
    points: [
      '200 OK: generic success. Use for GET (with body), PUT (updated resource), PATCH (updated resource). If there\'s a response body, use 200.',
      '201 Created: a new resource was created. Always include a Location header pointing to the new resource. Use for POST responses.',
      '202 Accepted: the request was accepted for async processing but not yet completed. Include a polling URL or webhook callback in the response.',
      '204 No Content: success with no response body. Use for DELETE and some PUT/PATCH operations where returning the updated resource is unnecessary.',
      '206 Partial Content: used with range requests (streaming video, resumable file downloads). Includes Content-Range header.',
    ],
  },
  {
    heading: '4xx Client Error Codes',
    points: [
      '400 Bad Request: the request is malformed — missing required fields, invalid JSON, type mismatches. Include an error body explaining what is wrong.',
      '401 Unauthorized: authentication failed or missing. The client should re-authenticate. Despite the name, this is about authentication, not authorization.',
      '403 Forbidden: authenticated but not permitted. The user\'s identity is known but they lack the required permission. Whether to reveal the resource\'s existence with 403 or hide it behind 404 is a deliberate security-posture decision, not a fixed rule — see the 404 bullet below.',
      '404 Not Found: the resource does not exist. Also use when hiding an unauthorized resource for security (so attackers can\'t enumerate valid IDs).',
      '409 Conflict: the request conflicts with current state — e.g., trying to create a resource that already exists, or concurrent update conflicts (ETag mismatch).',
      '422 Unprocessable Entity: the request body is syntactically valid JSON but fails semantic validation — e.g., end date before start date, insufficient balance. Prefer 422 over 400 for business rule violations.',
      '429 Too Many Requests: rate limit exceeded. Include Retry-After header indicating when the client can retry.',
    ],
  },
  {
    heading: '5xx Server Error Codes',
    points: [
      '500 Internal Server Error: unexpected server-side failure. Log the full error internally; return only a correlation ID to the client. NEVER expose stack traces.',
      '502 Bad Gateway: the server acting as a gateway received an invalid response from an upstream service.',
      '503 Service Unavailable: server is temporarily down (maintenance, overload). Include Retry-After header.',
      '504 Gateway Timeout: upstream service did not respond within the timeout. The gateway timed out waiting for a response.',
    ],
  },
  {
    heading: 'Building Institutional Consistency Around HTTP Semantics',
    points: [
      'Correct, consistent HTTP method and status code usage across an entire API surface is what lets generic HTTP tooling (caches, proxies, monitoring dashboards, client libraries) behave correctly without special-casing individual endpoints — deviating from standard semantics on even a few endpoints undermines this system-wide benefit.',
      'A style guide (enforced via an automated linter like Spectral, not just documentation) is the practical mechanism that keeps a growing API, built by multiple teams over time, consistent in its HTTP method and status code usage — without enforcement, inconsistency creeps in gradually as new engineers join and interpret conventions differently.',
      'Status code usage should be reviewed as part of API design review, not left to individual developer discretion at implementation time — the choice between 400 and 422, or between 403 and 404, has real semantic and security implications that benefit from deliberate, considered decision-making rather than whatever the framework happened to return by default.',
      'Documenting the exact meaning of each status code AS USED BY THIS SPECIFIC API (since real-world usage sometimes deviates slightly from the strict HTTP specification) helps consumers correctly interpret responses without needing to guess or reverse-engineer the API\'s specific conventions through trial and error.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Status Code Patterns',
    language: 'typescript',
    code: `import express from 'express';
const app = express();
app.use(express.json());

// POST → 201 Created + Location header
app.post('/users', async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201)
     .header('Location', \`/users/\${user.id}\`)
     .json(user);
});

// GET → 200 OK or 404 Not Found
app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) return res.status(404).json({
    type: 'https://api.example.com/errors/not-found',
    title: 'User not found',
    status: 404,
    detail: \`No user with id \${req.params.id}\`,
  });
  res.json(user); // 200 OK (default)
});

// DELETE → 204 No Content (idempotent)
app.delete('/users/:id', authenticate, async (req, res) => {
  await db.users.delete(req.params.id);
  // Don't return anything — 204 has no body
  res.status(204).send();
});

// PATCH → 200 or 204
app.patch('/users/:id', authenticate, async (req, res) => {
  const user = await db.users.update(req.params.id, req.body);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user); // 200 with updated resource
});

// Async operation → 202 Accepted
app.post('/reports', authenticate, async (req, res) => {
  const job = await queue.enqueue('generate-report', req.body);
  res.status(202).json({
    message: 'Report generation started',
    jobId: job.id,
    statusUrl: \`/reports/jobs/\${job.id}\`,
  });
});`,
  },
  {
    label: 'Error Response Design',
    language: 'typescript',
    code: `// RFC 9457 Problem Details — consistent error schema
interface ProblemDetails {
  type: string;    // URI identifying the error type
  title: string;   // human-readable summary
  status: number;  // HTTP status code
  detail: string;  // explanation of this specific occurrence
  instance?: string; // URI of the specific request/occurrence
  errors?: ValidationError[]; // for 422 validation failures
}

// 400 Bad Request — malformed or missing required fields
app.post('/orders', async (req, res) => {
  if (!req.body.productId) {
    return res.status(400).json({
      type: 'https://api.example.com/errors/bad-request',
      title: 'Bad Request',
      status: 400,
      detail: 'productId is required',
    });
  }
  // ...
});

// 422 Unprocessable Entity — valid JSON, fails business rules
app.post('/bookings', async (req, res) => {
  const { checkIn, checkOut } = req.body;
  if (new Date(checkOut) <= new Date(checkIn)) {
    return res.status(422).json({
      type: 'https://api.example.com/errors/invalid-dates',
      title: 'Invalid date range',
      status: 422,
      detail: 'checkOut must be after checkIn',
      errors: [{ field: 'checkOut', message: 'Must be after checkIn' }],
    });
  }
});

// 401 vs 403
function handleAuth(req: Request, res: Response) {
  if (!req.headers.authorization) {
    // No token at all → 401 Unauthorized (need to authenticate)
    return res.status(401).json({ error: 'Authentication required' });
  }
  const user = verifyToken(req.headers.authorization);
  if (!user.roles.includes('admin')) {
    // Authenticated but not permitted → 403 Forbidden
    return res.status(403).json({ error: 'Admin role required' });
  }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Returning 200 OK for resource creation (should be 201)',
    wrong: `// Returns 200 — client can't detect if resource was created or updated
res.status(200).json(newUser);`,
    right: `// 201 Created tells the client a new resource was created
res.status(201).header('Location', '/users/' + newUser.id).json(newUser);`,
    explanation: '201 Created is the correct status for POST that creates a resource. 200 OK means "success" without the specific meaning of creation. The Location header tells the client where to find the new resource.',
  },
  {
    title: 'Returning 401 when the user lacks permission (should be 403)',
    wrong: `// User is logged in but not admin — returning 401 is wrong
if (!user.isAdmin) return res.status(401).json({ error: 'Not allowed' });`,
    right: `// 401 = not authenticated; 403 = authenticated but not authorized
if (!user.isAdmin) return res.status(403).json({ error: 'Admin role required' });`,
    explanation: '401 Unauthorized means authentication is required or failed. 403 Forbidden means the user IS authenticated but lacks permission. Mixing them confuses clients — a 401 tells the client to re-authenticate, which won\'t help if they\'re already logged in as the wrong role.',
  },
  {
    title: 'Using 400 for business rule validation failures (should be 422)',
    wrong: `// 400 = malformed request. End-date before start-date is syntactically valid
res.status(400).json({ error: 'End date must be after start date' });`,
    right: `// 422 = valid syntax but fails business/semantic validation
res.status(422).json({ type: '...', title: 'Invalid date range', status: 422, detail: '...' });`,
    explanation: '400 Bad Request signals a malformed request (missing fields, invalid JSON, wrong types). 422 Unprocessable Entity signals that the request body is syntactically valid but fails business rules. Some teams use 400 for both — that\'s acceptable but less precise.',
  },
  {
    title: 'Returning 500 with a full stack trace exposed to the client',
    wrong: `app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message, stack: err.stack });
});`,
    right: `app.use((err, req, res, next) => {
  const id = generateCorrelationId();
  logger.error({ id, err }); // full details go to the log
  res.status(500).json({ error: 'Internal server error', correlationId: id });
});`,
    explanation: 'Stack traces reveal internal file paths, library versions, query structures, and architecture. This information helps attackers. Log the full error server-side and return only a correlation ID so support can find the log entry.',
  },
];

const challenge: Challenge = {
  title: 'HTTP Status Code Selector',
  language: 'typescript',
  description: `Implement selectStatusCode(scenario: string): number that returns the correct HTTP status code:
- 'user-not-found' → 404
- 'user-created' → 201
- 'invalid-json' → 400
- 'missing-permission' → 403
- 'no-auth-token' → 401
- 'rate-limit-exceeded' → 429
- 'end-date-before-start' → 422
- 'deleted-successfully' → 204
- anything else → 500`,
  hints: [
    'Use a Record<string, number> lookup map',
    'Return 500 as the default fallback',
  ],
  starterCode: `function selectStatusCode(scenario: string): number {
  // TODO: return the correct HTTP status code
  return 500;
}`,
  solution: `function selectStatusCode(scenario: string): number {
  const codes: Record<string, number> = {
    'user-not-found': 404,
    'user-created': 201,
    'invalid-json': 400,
    'missing-permission': 403,
    'no-auth-token': 401,
    'rate-limit-exceeded': 429,
    'end-date-before-start': 422,
    'deleted-successfully': 204,
  };
  return codes[scenario] ?? 500;
}

console.log(selectStatusCode('user-created'));        // 201
console.log(selectStatusCode('missing-permission'));  // 403
console.log(selectStatusCode('end-date-before-start')); // 422
console.log(selectStatusCode('server-crash'));        // 500`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the correct status code for a successful POST that creates a new resource?',
    options: ['200 OK', '201 Created', '202 Accepted', '204 No Content'],
    answer: 1,
    explanation: '201 Created is the correct response for a successful POST that creates a resource. It should include a Location header pointing to the new resource URI. 200 OK is for successful retrieval or update with a body; 204 No Content is for success without a response body (like DELETE).',
  },
  {
    q: 'A user is logged in but tries to access an admin-only endpoint. Which status code should be returned?',
    options: [
      '401 Unauthorized — they need to authenticate',
      '403 Forbidden — authenticated but not permitted',
      '404 Not Found — hide the endpoint from unauthorized users',
      '400 Bad Request — the request is malformed',
    ],
    answer: 1,
    explanation: '403 Forbidden is correct when the user IS authenticated (we know who they are) but lacks the required permission. 401 means authentication is missing or invalid — returning 401 here would tell the client to re-authenticate, which won\'t help since they\'re already logged in.',
  },
  { q: 'What is the difference between 401 Unauthorized and 403 Forbidden?', options: ['401 means the resource does not exist; 403 means access is denied', '401 means the client must authenticate (credentials are missing or invalid); 403 means the client is authenticated but does not have permission for this resource', '403 is for server errors; 401 is for client authentication errors only in OAuth flows', 'Both mean access denied; 403 is more severe than 401'], answer: 1, explanation: '401 Unauthorized (confusing name — it means unauthenticated): the client has not provided valid authentication credentials. The response should include a WWW-Authenticate header explaining how to authenticate. Next action for the client: present credentials. 403 Forbidden: the client is authenticated but lacks the permissions to access this resource or perform this action. The server knows who you are but you are not allowed. Next action for the client: request elevated permissions or contact the administrator. Security consideration: do not use 404 to hide the existence of a resource from unauthorized users — this is called security through obscurity. Return 403 for resources the user is authenticated to know exist but cannot access.' },
  { q: 'What HTTP method should be used for partial updates and what makes PATCH challenging to implement correctly?', options: ['PUT should always be used for updates; PATCH is not a standard HTTP method', 'PATCH is for partial updates; the challenge is defining the patch semantics: field-replacement patches apply provided fields, while JSON Patch (RFC 6902) defines atomic operations like add, remove, and replace', 'PATCH always replaces the entire resource like PUT but with a smaller payload', 'GET with a body is preferred for partial updates because PATCH is not idempotent'], answer: 1, explanation: 'PATCH semantics are not standardized by HTTP — the API must define them. Common approaches: field-replacement PATCH (most common): the body contains only the fields to change. Missing fields are unchanged. PATCH /users/123 with { email: new@example.com } changes only email. Problem: cannot set a field to null (null vs absent). JSON Patch (RFC 6902): explicit operation list: [{ op: replace, path: /email, value: new@example.com }, { op: remove, path: /nickname }]. Atomic — all or none. JSON Merge Patch (RFC 7396): the simpler version where null means delete the field. PATCH must be used for partial updates. PUT replaces the entire resource (omitted fields are deleted or reset to default).' },
  { q: 'What does HTTP 409 Conflict mean and in what scenarios is it appropriate?', options: ['409 is returned when the server has a conflict with the network configuration', 'The request conflicts with the current state of the resource — used for duplicate creation attempts, optimistic locking failures, or state machine violations', '409 is for security conflicts such as unauthorized concurrent modifications', '409 means the resource has been modified since the client last fetched it; it replaces 304 for modification detection'], answer: 1, explanation: 'HTTP 409 Conflict: the request cannot be completed due to a conflict with the current resource state. Appropriate scenarios: duplicate creation: POST /users with an already-used email. Return 409 with an error body indicating the duplicate. Optimistic locking: the client sends If-Match: etag123. The resource has changed since (ETag no longer matches). Return 409 (or 412 Precondition Failed). Business state violations: PATCH /orders/123 with status=shipped when the order is already cancelled. 409 Conflict is more descriptive than 400 Bad Request for state-related conflicts. Response body should explain the conflict: { error: { code: DUPLICATE_EMAIL, message: An account with this email already exists } }.' },
  { q: 'What is the HTTP OPTIONS method and what does CORS preflight use it for?', options: ['OPTIONS returns the documentation for an endpoint in HTML format', 'OPTIONS returns the allowed HTTP methods for a resource; browsers use OPTIONS preflight requests to ask the server whether a cross-origin request is allowed before sending it', 'OPTIONS is deprecated; CORS uses GET requests with special headers instead', 'OPTIONS returns API version information and deprecation notices for a resource'], answer: 1, explanation: 'HTTP OPTIONS: used by clients to discover the capabilities of a resource. Response includes: Allow header listing supported methods (Allow: GET, POST, PUT, DELETE). CORS preflight: browsers send OPTIONS before a cross-origin request that uses a non-simple HTTP method or custom headers. The browser sends: Origin: https://app.example.com, Access-Control-Request-Method: POST, Access-Control-Request-Headers: content-type. The server responds with: Access-Control-Allow-Origin: https://app.example.com, Access-Control-Allow-Methods: POST, Access-Control-Allow-Headers: content-type. The actual request follows if the preflight succeeds. CORS preflight caching: Access-Control-Max-Age: 3600 caches the preflight result for 1 hour, avoiding repeated OPTIONS requests.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I use 204 No Content vs 200 OK?',
    a: 'Use <strong>204 No Content</strong> when the operation succeeds but there\'s nothing meaningful to return: DELETE operations, and some PUT/PATCH when the client already knows the result and doesn\'t need the updated resource back. Use <strong>200 OK</strong> when you return the resource body in the response — the updated user after PATCH, the replaced document after PUT, or any GET that finds the resource. If in doubt: returning 200 with the resource is never wrong and is more useful to clients.',
  },
  {
    q: 'Should I return 404 or 403 when a user requests a resource they don\'t own?',
    a: 'It depends on your security posture. <strong>403 Forbidden</strong>: tells the client the resource exists but they\'re not allowed. This leaks existence information — an attacker now knows resource ID 42 exists. <strong>404 Not Found</strong>: hides the existence of the resource, preventing enumeration attacks but making debugging harder for legitimate users. Best practice: for resources that shouldn\'t be enumerable (private documents, other users\' data), return 404. For resources with known existence (public products a user doesn\'t own), return 403.',
  },
  { q: 'What is idempotency in HTTP and why does it matter for API reliability?', a: 'Idempotent: calling the same request N times has the same effect as calling it once. Idempotent methods: GET (read-only, no side effects). PUT (replaces the resource — calling twice produces the same result as once). DELETE (deleting an already-deleted resource returns 404 or 204 — the resource is gone either way). HEAD (like GET but no body). OPTIONS, TRACE. Non-idempotent: POST (creates a new resource on each call). PATCH (may not be idempotent: patching a counter increments it each time). Why it matters for reliability: clients can safely retry idempotent requests on network failure. A GET that times out can be retried. A POST that times out cannot be safely retried without idempotency keys (retrying might create a duplicate order). Idempotency keys: clients include a unique X-Idempotency-Key header with POST requests. The server stores the key and returns the same response for duplicate requests with the same key.' },
  { q: 'When should you return 200 OK vs 201 Created vs 204 No Content?', a: '200 OK: successful request that returns a body. GET requests return 200 with the resource. PUT that returns the updated resource returns 200. 201 Created: successful POST that created a new resource. Include Location header pointing to the new resource URL: Location: /users/123. Optionally return the created resource in the body. 204 No Content: successful request with no body to return. DELETE operations where no body is needed. PUT or PATCH that does not return the updated resource (client already knows what they sent). POST endpoints that trigger an action with no result to return. Common mistakes: returning 200 for creation (should be 201 — 201 signals to clients and monitoring that a new entity was created). Returning 200 with an empty body instead of 204 (the body is empty but a Content-Length or Transfer-Encoding header is still required for 200). Using 201 for updates (should be 200 or 204).' },
  { q: 'What is the HEAD HTTP method and what are its practical uses?', a: 'HEAD method: identical to GET but the server returns only the headers, no body. The response headers are exactly the same as GET including Content-Length, Content-Type, Last-Modified, ETag. Uses: check if a resource exists without downloading it: HEAD /files/large-video.mp4 returns Content-Length and status without transferring the file. Cache freshness check: HEAD /resource returns Last-Modified or ETag. The client compares with its cached copy. If unchanged, no full GET needed. Preflight for large download: check Content-Length before starting a big download to estimate time. Check if an endpoint supports conditional requests. Link checking: verify that URLs are accessible without downloading content. HEAD must be handled by all GET handlers. It is a safe, idempotent method. Most REST frameworks handle HEAD automatically by running the GET handler and stripping the body from the response.' },
  { q: 'What HTTP status codes should you use for async API operations?', a: 'Asynchronous operation patterns: 202 Accepted: the request has been accepted for processing but processing has not completed. The server will process it asynchronously. Response includes: a reference to check the status. 202 with polling location: Location: /jobs/abc123 — client polls GET /jobs/abc123 for status. 202 with estimated time: Retry-After: 60 — client should wait 60 seconds before polling. Status resource: GET /jobs/abc123 returns { status: processing, progress: 45, estimatedCompletion: ... }. When done: GET /jobs/abc123 returns { status: completed, resultUrl: /reports/xyz } or the result inline. Webhook alternative: the client provides a callback URL. The server calls the callback when done (eliminates polling). Long-running operation standards: Google APIs use an Operation resource returned from 200 OK, not 202. Azure uses 202 with Azure-AsyncOperation header.' },
];

const revision: RevisionSummary = {
  oneLiner: 'GET/HEAD are safe+idempotent; PUT/DELETE are idempotent; POST creates (201+Location); 401=auth missing, 403=forbidden, 422=business validation, 204=no body.',
  mustKnow: [
    'POST → 201 Created + Location header; DELETE → 204 No Content; GET → 200 OK or 404',
    '401 Unauthorized = not authenticated; 403 Forbidden = authenticated but no permission',
    '400 = malformed syntax; 422 = valid syntax but fails business rules',
    '429 Too Many Requests with Retry-After header for rate limiting',
    'GET, HEAD, OPTIONS are safe (no side effects); GET, PUT, DELETE are idempotent',
    'Never expose stack traces in 500 responses — use correlation IDs and server-side logging',
  ],
  interviewFocus: [
    'What is the difference between 401 and 403?',
    'When should you use 200 vs 204? When 400 vs 422?',
    'Which HTTP methods are idempotent and why does that matter?',
  ],
};

@Component({
  selector: 'app-api-http-methods',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './http-methods-status-codes.html',
  styleUrl: './http-methods-status-codes.scss',
})
export class ApiHttpMethods {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
