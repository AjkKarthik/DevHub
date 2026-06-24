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
