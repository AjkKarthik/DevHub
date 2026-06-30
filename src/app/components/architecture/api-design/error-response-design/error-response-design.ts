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
  { name: 'RFC 9457',          type: 'keyword', desc: 'Problem Details for HTTP APIs — standard error format: type, title, status, detail, instance.' },
  { name: 'type',              type: 'keyword', desc: 'URI identifying the error type — a stable, machine-readable identifier.' },
  { name: 'title',             type: 'keyword', desc: 'Short human-readable summary of the error type.' },
  { name: 'detail',            type: 'keyword', desc: 'Human-readable explanation of this specific occurrence.' },
  { name: 'instance',          type: 'keyword', desc: 'URI of the specific error occurrence — links to logs or a support ticket.' },
  { name: 'errors[]',          type: 'keyword', desc: 'Extension array of field-level validation errors for 422 responses.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'RFC 9457 Problem Details',
    points: [
      'RFC 9457 (formerly RFC 7807) defines a standard JSON error format for HTTP APIs. Content type: application/problem+json.',
      'Five standard fields: type (URI, stable identifier), title (human-readable type summary), status (HTTP status code), detail (this specific occurrence explanation), instance (URI of the specific occurrence).',
      'The type URI does NOT need to be dereferenceable — it\'s used as a machine-readable identifier. Conventionally it points to documentation.',
      'Adopting Problem Details means client libraries can parse errors consistently across all your APIs and third-party APIs that follow the standard.',
    ],
  },
  {
    heading: 'Validation Error Design',
    points: [
      'For 422 Unprocessable Entity (validation failures), extend Problem Details with an errors array containing field-level errors.',
      'Each error should include: field (dot-notation path), message (human-readable), and optionally code (machine-readable error code for i18n).',
      'Return ALL validation errors at once — not just the first one. Clients should be able to show all issues in a single response cycle.',
      'Use consistent field paths: "user.address.zip" for nested objects, "items[0].quantity" for array elements.',
    ],
  },
  {
    heading: 'Error Consistency Principles',
    points: [
      'Every error, from every endpoint, in every version of your API should follow the same schema. Inconsistency forces clients to handle special cases.',
      'Machine-readable error codes (type URI or a code field) allow clients to handle specific errors programmatically — e.g., show a "verify email" modal on "account-not-verified" error.',
      'Never expose internal details: no stack traces, no SQL errors, no file paths, no internal service names. These help attackers and confuse users.',
      'Include a correlation ID or instance URI so support engineers can find the log entry. The client shows this ID to users: "Please contact support with error ID: XYZ".',
    ],
  },
  {
    heading: 'Error Handling in Clients',
    points: [
      'Clients should treat any response with a 4xx or 5xx status as an error, regardless of the body. Don\'t trust a 200 status with an error JSON body.',
      'Parse the error type to route to specific error handlers. Unknown types fall back to generic handling.',
      'Display field-level errors inline in the form. Display non-field errors as toasts or alerts. Never show raw error messages without sanitizing.',
      'Retry strategy: 429 (rate limit) → retry after Retry-After header; 5xx (server error) → exponential backoff with jitter; 4xx → don\'t retry (client bug, fix the request).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Problem Details Middleware',
    language: 'typescript',
    code: `// RFC 9457 Problem Details error handler middleware
import express, { ErrorRequestHandler } from 'express';
import { randomUUID } from 'crypto';

interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: FieldError[];
}

interface FieldError {
  field: string;
  message: string;
  code?: string;
}

// Custom error class carrying Problem Details
class ApiError extends Error {
  constructor(
    public status: number,
    public type: string,
    public title: string,
    public detail: string,
    public errors?: FieldError[]
  ) { super(detail); }
}

// Helper functions for common errors
const notFound = (what: string) =>
  new ApiError(404, 'https://api.example.com/errors/not-found',
    'Resource Not Found', what);

const forbidden = () =>
  new ApiError(403, 'https://api.example.com/errors/forbidden',
    'Forbidden', 'You do not have permission to perform this action');

const validationError = (errors: FieldError[]) =>
  new ApiError(422, 'https://api.example.com/errors/validation',
    'Validation Error', 'One or more fields failed validation', errors);

// Global error handler — last middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const correlationId = randomUUID();

  if (err instanceof ApiError) {
    const body: ProblemDetails = {
      type: err.type,
      title: err.title,
      status: err.status,
      detail: err.detail,
      instance: \`/errors/\${correlationId}\`,
      ...(err.errors && { errors: err.errors }),
    };
    return res.status(err.status)
              .contentType('application/problem+json')
              .json(body);
  }

  // Unexpected error — log full details, return minimal response
  console.error({ correlationId, err });
  res.status(500)
     .contentType('application/problem+json')
     .json({
       type: 'https://api.example.com/errors/internal',
       title: 'Internal Server Error',
       status: 500,
       detail: 'An unexpected error occurred',
       instance: \`/errors/\${correlationId}\`,
     });
};`,
  },
  {
    label: 'Validation Error Response',
    language: 'typescript',
    code: `import { z } from 'zod';

// Zod schema for request validation
const CreateOrderSchema = z.object({
  customerId: z.string().uuid('Must be a valid UUID'),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item required'),
  deliveryDate: z.string().datetime().optional(),
});

// Convert Zod errors → Problem Details format
app.post('/orders', async (req, res, next) => {
  const result = CreateOrderSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    return next(new ApiError(
      422,
      'https://api.example.com/errors/validation',
      'Validation Error',
      \`\${errors.length} field(s) failed validation\`,
      errors
    ));
  }

  const order = await db.orders.create(result.data);
  res.status(201).header('Location', \`/orders/\${order.id}\`).json(order);
});

/* Response example for invalid request:
{
  "type": "https://api.example.com/errors/validation",
  "title": "Validation Error",
  "status": 422,
  "detail": "2 field(s) failed validation",
  "instance": "/errors/a1b2c3d4-...",
  "errors": [
    { "field": "customerId", "message": "Must be a valid UUID", "code": "invalid_string" },
    { "field": "items[0].quantity", "message": "Quantity must be at least 1", "code": "too_small" }
  ]
}
*/`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Inconsistent error schemas across endpoints',
    wrong: `// /users: { error: "Not found" }
// /orders: { message: "Order does not exist", code: 404 }
// /products: { errors: [{ msg: "Invalid" }] }`,
    right: `// Every endpoint, always:
{ type: "...", title: "...", status: 404, detail: "...", instance: "..." }`,
    explanation: 'Inconsistent error formats force clients to write endpoint-specific error parsing. A single schema means one error handler for all responses. Adopt RFC 9457 as your standard from the start.',
  },
  {
    title: 'Returning only the first validation error',
    wrong: `if (!req.body.email) return res.status(422).json({ error: 'email required' });
// Client fixes email, resubmits, then sees 'phone required' — two round trips`,
    right: `// Return ALL validation errors at once
{ errors: [
  { field: 'email', message: 'Email is required' },
  { field: 'phone', message: 'Phone must be a valid E.164 number' }
]}`,
    explanation: 'Returning one error at a time forces clients into a validation whack-a-mole loop. Collect all field errors in a single pass and return them all in one 422 response so the client can show all issues at once.',
  },
  {
    title: 'Exposing internal error details to clients',
    wrong: `res.status(500).json({
  error: err.message,
  stack: err.stack, // reveals file paths, line numbers, library versions
  query: failedSql  // reveals table structure
})`,
    right: `const id = randomUUID();
logger.error({ id, err }); // full details go to logs
res.status(500).json({ type: '...', title: 'Internal Server Error', status: 500, instance: '/errors/' + id })`,
    explanation: 'Stack traces reveal internal architecture — file paths, library versions, table names — all useful to attackers. Log full details internally with a correlation ID; return only the correlation ID to clients so support can trace the issue.',
  },
  {
    title: 'Using 200 OK with an error body',
    wrong: `// Returns 200 but body signals failure — clients must parse every body
res.status(200).json({ success: false, error: 'User not found' })`,
    right: `// Let the HTTP status code carry the semantic meaning
res.status(404).json({ type: '...', title: 'Not Found', status: 404, detail: 'User not found' })`,
    explanation: 'HTTP status codes exist to carry semantic meaning. Returning 200 with an error body in the body forces every client to parse the body before they know if the request succeeded. Use the correct 4xx/5xx status code — HTTP clients, SDKs, and load balancers all understand status semantics.',
  },
];

const challenge: Challenge = {
  title: 'Problem Details Builder',
  language: 'typescript',
  description: `Implement buildProblemDetails(status: number, detail: string, fields?: {field: string, message: string}[]): object that:
1. Sets type to 'https://api.example.com/errors/' + status
2. Sets title based on status: 400='Bad Request', 401='Unauthorized', 403='Forbidden', 404='Not Found', 422='Validation Error', 429='Too Many Requests', 500='Internal Server Error'
3. Sets status and detail
4. If fields is provided, includes an errors array
Return the complete Problem Details object.`,
  hints: [
    'Use a Record<number, string> for status → title mapping',
    'Conditionally spread the errors field',
  ],
  starterCode: `function buildProblemDetails(status: number, detail: string, fields?: {field: string, message: string}[]) {
  // TODO: build Problem Details response
  return {};
}`,
  solution: `function buildProblemDetails(status: number, detail: string, fields?: {field: string, message: string}[]) {
  const titles: Record<number, string> = {
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 422: 'Validation Error',
    429: 'Too Many Requests', 500: 'Internal Server Error',
  };
  return {
    type: \`https://api.example.com/errors/\${status}\`,
    title: titles[status] ?? 'Error',
    status,
    detail,
    ...(fields && { errors: fields }),
  };
}

console.log(buildProblemDetails(404, 'User 42 not found'));
console.log(buildProblemDetails(422, '2 fields invalid', [
  { field: 'email', message: 'Invalid email format' },
]));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What content type should be used for RFC 9457 Problem Details error responses?',
    options: [
      'application/json',
      'application/problem+json',
      'text/plain',
      'application/error+json',
    ],
    answer: 1,
    explanation: 'RFC 9457 specifies application/problem+json as the content type for Problem Details responses. This allows clients and proxies to identify the response as a structured error without parsing the body. application/json is acceptable but loses the semantic signal.',
  },
  {
    q: 'What does the "instance" field in a Problem Details error response represent?',
    options: [
      'The class instance that threw the error on the server',
      'A URI identifying this specific occurrence of the error (e.g., for correlation/support)',
      'The instance of the API version that generated the error',
      'The server instance (hostname) that handled the request',
    ],
    answer: 1,
    explanation: 'The "instance" field is a URI reference that identifies the specific occurrence of the problem — typically a correlation ID or a link to logs or a support ticket. It lets a user or support engineer trace the exact error event. It differs from "type" which identifies the error class, not the specific occurrence.',
  },
  { q: 'What information should an API error response always include?', options: ['The full stack trace and database query that caused the error', 'A machine-readable error code, a human-readable message, and a correlation ID or request ID for support', 'Only the HTTP status code, as additional information creates security risks', 'The username of the requester and the timestamp of the error only'], answer: 1, explanation: 'Essential error response fields: HTTP status code (in the response line, not just the body). Machine-readable error code: a string like INVALID_EMAIL or ORDER_NOT_FOUND. Human-readable message: a description useful to the developer debugging the issue. Correlation ID: a unique identifier for the request, allowing the API operator to find the server-side log entry for this specific error. Optional but useful: a link to documentation for this error. Field-level validation errors (for 400 errors): an array of { field: string, message: string } indicating which fields failed validation. What to omit: stack traces (security risk). SQL query text. Internal server names or IP addresses. Full database error messages.' },
  { q: 'What is the RFC 9457 Problem Details specification and what fields does it define?', options: ['RFC 9457 is an HTTP caching specification for error responses', 'RFC 9457 (previously 7807) defines a standard JSON format for error responses with type (URI), title, status, detail, and instance fields', 'RFC 9457 defines the HTTP status codes for API errors', 'RFC 9457 specifies how to return machine-readable error codes in HTTP headers'], answer: 1, explanation: 'RFC 9457 Problem Details for HTTP APIs: type: a URI that identifies the error type (links to documentation). title: a short human-readable summary of the problem type. status: the HTTP status code. detail: a human-readable explanation specific to this occurrence. instance: a URI that identifies the specific occurrence of the problem (can be a unique URL linking to an error log entry). Extension fields: add domain-specific fields like errors (array of validation errors) or correlationId. Content-Type: application/problem+json. Adoption: used by ASP.NET Core ProblemDetails, Spring Boot, and many API frameworks natively. Benefits: a standard format allows generic error-handling libraries across multiple APIs.' },
  { q: 'What is the difference between a 400 Bad Request and a 422 Unprocessable Entity?', options: ['400 is for syntax errors; 422 is for semantic validation failures where the input is syntactically correct but violates business rules', 'They are interchangeable; use whichever is more common in your framework', '400 is for client authentication errors; 422 is for authorization failures', '422 is deprecated; all client errors should use 400'], answer: 0, explanation: '400 Bad Request: the request itself is malformed. The JSON cannot be parsed. A required header is missing. The Content-Type is wrong. The query parameter is not a valid number. 422 Unprocessable Entity: the request is syntactically valid but semantically wrong. The JSON parsed successfully, but the email field fails the email format check. The order quantity is a valid integer but is negative. The referenced user ID does not exist. The requested date is in the past. In practice many APIs use 400 for all client errors (simpler). RFC 9457 and REST purists prefer 422 for validation failures. What matters most: consistency within an API. Pick one approach and document it. Validation error responses should include field-level details regardless of the status code.' },
  { q: 'How should API error messages handle sensitive information?', options: ['Include full details in error messages to help developers debug issues', 'Return generic messages for server errors; for client errors include enough detail for the developer to fix the issue without exposing internal implementation', 'Hash all error messages to prevent information disclosure', 'Return error messages only in response headers, not in the body'], answer: 1, explanation: 'Error message security: server errors (5xx): return a generic message: something went wrong with a correlation ID. Log the full details server-side. Never include: stack traces, SQL query text, file paths, internal server names, ORM error messages. Client errors (4xx): the developer needs to know what was wrong to fix it. Include: which field failed, what the validation rule is, what value is invalid (if not sensitive). Sensitive data in errors: do not echo back the password field. Do not reveal whether a user exists by differentiating user not found from invalid password (use a generic authentication failure message). Field names from user input can be included but sanitize them (max length, strip special characters) before including in error responses.' },
];

const qna: QnaItem[] = [
  {
    q: 'Should I standardise on RFC 9457 or build my own error schema?',
    a: 'Adopt RFC 9457 unless you have a strong reason not to. It\'s a documented standard that client libraries understand, it\'s extensible (you can add custom fields), and it\'s what increasingly many frameworks generate by default (ASP.NET Core, Spring Boot). The main reason NOT to use it is if you already have a large ecosystem locked into a custom format and migration is not feasible. Otherwise: standard format, free documentation, client-side parsing libraries, and cross-API consistency.',
  },
  {
    q: 'How should I handle errors in async background jobs where there\'s no HTTP response to send?',
    a: 'For async jobs: <ol><li><strong>Webhook callback</strong>: send a POST to the caller\'s callback URL with a Problem Details-like body including the job ID, error type, and detail</li><li><strong>Polling endpoint</strong>: GET /jobs/{id} returns the job status; failed jobs include an <code>error</code> field with Problem Details</li><li><strong>Event stream</strong>: publish a "job.failed" event with the error details — consumers subscribe to their job\'s events</li></ol>The key principle: the error schema should be consistent whether the error is synchronous (HTTP response) or asynchronous (callback or status endpoint).',
  },
  { q: 'How do you design validation error responses for forms and APIs?', a: 'Validation error response design: single-error responses make it hard for clients to fix multiple issues at once. Batch validation: validate all fields before returning. Return all errors in one response. Structure for field-level errors: { status: 400, errors: [{ field: username, message: must be between 3 and 32 characters, code: FIELD_LENGTH_INVALID }, { field: email, message: invalid email format, code: INVALID_EMAIL }] }. Nested field paths: use dot notation for nested objects (address.zipCode). For arrays use index notation (items[0].quantity). Global errors: include both field-level and global (non-field-specific) errors. Global errors like order total exceeds your account limit do not belong to a specific field. Error codes: machine-readable codes allow frontend applications to show translated messages in the user language rather than embedding English messages in API responses.' },
  { q: 'What is a correlation ID and how does it help with API debugging?', a: 'Correlation ID (also called request ID or trace ID): a unique identifier attached to an API request that flows through all systems that process that request. Generation: the API gateway generates a UUID when the request arrives. Propagation: the gateway passes the correlation ID as a header (X-Correlation-ID or X-Request-ID) to all backend services. Each service logs the correlation ID alongside all log entries for that request. Response: the API returns the correlation ID in the response header and optionally in error response bodies. Benefits: when a user reports an error, they provide the correlation ID. Operations team searches the centralized log system for that ID. All log entries across all services for that one request appear together. Essential for debugging distributed systems. Standards: W3C Trace Context (traceparent header) is the standardized format for distributed tracing. OpenTelemetry implements this standard.' },
  { q: 'What HTTP status codes should be used for common API error scenarios?', a: 'Status code mapping: 400 Bad Request: malformed JSON, missing required parameters, failed validation. 401 Unauthorized: missing or invalid authentication credentials (confusing name — it means unauthenticated). 403 Forbidden: authenticated but not authorized for the requested resource or action. 404 Not Found: the requested resource does not exist. 405 Method Not Allowed: the HTTP method is not supported for this endpoint. 409 Conflict: the request conflicts with the current state (duplicate creation, optimistic locking failure). 410 Gone: the resource existed but has been permanently deleted. 422 Unprocessable Entity: syntactically valid but semantically invalid request. 429 Too Many Requests: rate limit exceeded. 500 Internal Server Error: unexpected server error. 502 Bad Gateway: upstream service error. 503 Service Unavailable: server overloaded or down for maintenance. 504 Gateway Timeout: upstream service timeout.' },
  { q: 'How do you design error responses for retryable vs non-retryable errors?', a: 'Distinguishing retryable errors: non-retryable errors (do not retry): 400 Bad Request — the request is wrong; retrying with the same request will always fail. 401 Unauthorized — need to re-authenticate first. 403 Forbidden — need different permissions. 422 Unprocessable Entity — business rule violation; the input is wrong. Retryable errors (safe to retry with backoff): 429 Too Many Requests — wait and retry after Retry-After header value. 500 Internal Server Error — transient server error; retry with exponential backoff. 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout — transient infrastructure issues. Signal in the response: include a retryable: true/false field in the error body. Include a Retry-After header for 429 and 503. Include a retryAfterSeconds value in the error body. Exponential backoff: even for retryable errors, use exponential backoff with jitter to avoid thundering herd when many clients retry simultaneously.' },
];

const revision: RevisionSummary = {
  oneLiner: 'RFC 9457 Problem Details (type, title, status, detail, instance) is the standard error schema; return all validation errors at once; never expose stack traces.',
  mustKnow: [
    'RFC 9457: { type, title, status, detail, instance } with content-type application/problem+json',
    'Validation errors (422): extend with errors[]: [{ field, message, code }] — return ALL at once',
    'Never expose: stack traces, SQL errors, file paths, internal service names',
    'Use correlation ID in instance field — log full error server-side, return ID to client',
    'Machine-readable type URI lets clients handle specific errors programmatically',
    'Never return 200 with an error body — use correct 4xx/5xx status codes',
  ],
  interviewFocus: [
    'What is RFC 9457 and what fields does it define?',
    'How do you return validation errors for multiple fields?',
    'Why should stack traces never be returned to API clients?',
  ],
};

@Component({
  selector: 'app-api-error-response',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './error-response-design.html',
  styleUrl: './error-response-design.scss',
})
export class ApiErrorResponse {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
