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
  { name: 'OpenAPI 3.x',        type: 'keyword', desc: 'Industry-standard YAML/JSON spec format for REST APIs — defines paths, schemas, auth, and responses.' },
  { name: '$ref',               type: 'syntax',  desc: '$ref: "#/components/schemas/Order" — reusable schema reference; avoids duplication across paths.' },
  { name: 'components/schemas', type: 'keyword', desc: 'Centralized schema definitions — define once, reference many times throughout the spec.' },
  { name: 'Spectral',           type: 'keyword', desc: 'OpenAPI linter — enforces naming conventions, required fields, and design rules across your spec.' },
  { name: 'oneOf / anyOf',      type: 'keyword', desc: 'Polymorphic schemas — discriminator field selects the right sub-schema at runtime.' },
  { name: 'Contract Testing',   type: 'keyword', desc: 'Pact / Dredd — verifies the provider implementation matches the consumer\'s expectations from the spec.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is OpenAPI?',
    points: [
      'OpenAPI (formerly Swagger) is a YAML or JSON document that describes a REST API — its endpoints, request/response schemas, authentication, and error shapes.',
      'The spec is machine-readable: tools generate documentation (Swagger UI, Redoc), client SDKs (openapi-generator), server stubs, and mock servers directly from it.',
      'OpenAPI 3.x is the current standard. OpenAPI 3.1 aligns with JSON Schema — use 3.1 for new projects.',
      'An OpenAPI spec IS the contract between your API team and consumers. If something is in the spec, consumers can rely on it. If it is not in the spec, it is an implementation detail that can change.',
    ],
  },
  {
    heading: 'Spec Structure',
    points: [
      'Top-level keys: `openapi`, `info` (title, version, contact), `servers` (base URLs), `paths` (endpoints), `components` (reusable schemas, params, responses), `security`.',
      '`paths` maps URL patterns to HTTP methods; each method defines `parameters`, `requestBody`, `responses`, `security`, and `tags`.',
      '`components/schemas` defines reusable data models. Reference them with `$ref` to avoid duplication — a schema defined once can be used in 20 endpoints.',
      '`components/responses` for shared response patterns (401 Unauthorized, 429 Too Many Requests) — define once, reference everywhere for consistency.',
    ],
  },
  {
    heading: 'Contract Testing',
    points: [
      'A spec is a promise — contract testing verifies the promise is kept. Tools like Pact (consumer-driven) or Dredd (spec-driven) run against your live API.',
      'Pact: the consumer generates a "pact file" describing what responses it expects; the provider runs tests verifying it returns those responses.',
      'Dredd: reads your OpenAPI spec and fires real HTTP requests at your API; fails if responses don\'t match the documented schemas.',
      'Without contract testing, spec drift happens — the implementation diverges from the spec, breaking consumers silently. CI should run contract tests on every PR.',
    ],
  },
  {
    heading: 'Tooling Ecosystem',
    points: [
      'Swagger UI / Redoc: auto-generated interactive documentation from the spec — zero effort for beautiful API docs.',
      'openapi-generator: generates typed client SDKs in TypeScript, Python, Java, C#, Go, etc. Consumers get a strongly-typed client without writing glue code.',
      'Prism / Stoplight: mock server from the spec — consumers build against a realistic mock before your API is built.',
      'Spectral: linter for OpenAPI specs — define rules like "all responses must include a requestId field" or "operationId must be camelCase" and run in CI.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'OpenAPI 3.1 Spec',
    language: 'bash',
    code: `# openapi.yaml — OpenAPI 3.1 specification
openapi: 3.1.0
info:
  title: Orders API
  version: 1.0.0
  contact:
    email: api-team@company.com

servers:
  - url: https://api.company.com/v1
    description: Production
  - url: https://api-staging.company.com/v1
    description: Staging

paths:
  /orders:
    get:
      operationId: listOrders
      summary: List orders for the authenticated user
      tags: [Orders]
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [pending, confirmed, shipped, delivered]
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
        - name: cursor
          in: query
          schema:
            type: string
      responses:
        '200':
          description: Paginated order list
          content:
            application/json:
              schema:
                \$ref: '#/components/schemas/OrderPage'
        '401':
          \$ref: '#/components/responses/Unauthorized'
        '429':
          \$ref: '#/components/responses/TooManyRequests'

    post:
      operationId: createOrder
      summary: Create a new order
      tags: [Orders]
      parameters:
        - name: Idempotency-Key
          in: header
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              \$ref: '#/components/schemas/CreateOrderRequest'
      responses:
        '201':
          description: Order created
          headers:
            Location:
              schema:
                type: string
                example: /orders/ord_abc123
          content:
            application/json:
              schema:
                \$ref: '#/components/schemas/Order'
        '400':
          \$ref: '#/components/responses/ValidationError'

components:
  schemas:
    Order:
      type: object
      required: [id, status, totalCents, createdAt]
      properties:
        id:
          type: string
          example: ord_abc123
        status:
          type: string
          enum: [pending, confirmed, shipped, delivered]
        totalCents:
          type: integer
          description: Total price in cents (avoid float precision issues)
          example: 9999
        createdAt:
          type: string
          format: date-time
          example: '2024-01-15T10:30:00Z'

    OrderPage:
      type: object
      required: [data, meta]
      properties:
        data:
          type: array
          items:
            \$ref: '#/components/schemas/Order'
        meta:
          type: object
          properties:
            nextCursor:
              type: string
              nullable: true
            total:
              type: integer

    CreateOrderRequest:
      type: object
      required: [items]
      properties:
        items:
          type: array
          minItems: 1
          items:
            type: object
            required: [productId, quantity]
            properties:
              productId:
                type: string
              quantity:
                type: integer
                minimum: 1

    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  issue:
                    type: string
            requestId:
              type: string

  responses:
    Unauthorized:
      description: Authentication required
      content:
        application/json:
          schema:
            \$ref: '#/components/schemas/ErrorResponse'
    TooManyRequests:
      description: Rate limit exceeded
      headers:
        Retry-After:
          schema:
            type: integer
            description: Seconds to wait before retrying
      content:
        application/json:
          schema:
            \$ref: '#/components/schemas/ErrorResponse'
    ValidationError:
      description: Request validation failed
      content:
        application/json:
          schema:
            \$ref: '#/components/schemas/ErrorResponse'

  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - BearerAuth: []`,
  },
  {
    label: 'Spectral Rules',
    language: 'bash',
    code: `# .spectral.yaml — custom OpenAPI linting rules
extends: spectral:oas

rules:
  # All operations must have an operationId
  operation-operationId:
    severity: error
    message: 'Every operation must have an operationId'

  # All operations must have at least one tag
  operation-tags:
    severity: warn

  # Custom rule: all POST operations need an Idempotency-Key parameter
  post-needs-idempotency-key:
    severity: warn
    message: 'POST operations should accept an Idempotency-Key header'
    given: '$.paths[*].post'
    then:
      function: schema
      functionOptions:
        schema:
          type: object
          properties:
            parameters:
              type: array
              contains:
                type: object
                properties:
                  name:
                    const: Idempotency-Key
                  in:
                    const: header

  # All responses must include requestId in error body
  error-includes-request-id:
    severity: warn
    message: 'Error schemas should include a requestId field'
    given: '$.components.schemas.ErrorResponse.properties.error.properties'
    then:
      field: requestId
      function: truthy`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Duplicating schemas instead of using $ref',
    wrong: `# Order schema duplicated in every endpoint — a nightmare to update
/orders:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object
              properties:
                id: { type: string }
                status: { type: string }
/orders/{id}:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              type: object  # duplicated!
              properties:
                id: { type: string }`,
    right: `# Define once in components/schemas, reference everywhere
components:
  schemas:
    Order:
      type: object
      properties:
        id: { type: string }
        status: { type: string }

/orders:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'`,
    explanation: 'Duplicating schemas means updating them in multiple places — easy to miss one and create inconsistency. Use $ref to define schemas once in components/schemas and reference them everywhere. Tools also use these references to generate accurate client SDKs.',
  },
  {
    title: 'Not validating request bodies against the spec',
    wrong: `// Spec says required: [productId, quantity] but server doesn't validate
app.post('/orders', (req, res) => {
  const order = createOrder(req.body); // crashes if productId missing
  res.json(order);
});`,
    right: `// Use express-openapi-validator or zod to enforce the spec at runtime
import { OpenApiValidator } from 'express-openapi-validator';
app.use(OpenApiValidator.middleware({ apiSpec: './openapi.yaml', validateRequests: true }));
// Now missing required fields return 400 with spec-defined error — automatically`,
    explanation: 'Writing a spec does not automatically enforce it. Use middleware that reads your OpenAPI spec and validates requests against it (express-openapi-validator, fastify-swagger). This keeps spec and behavior in sync and provides spec-compliant 400 error responses automatically.',
  },
  {
    title: 'Using type: number for monetary values in schemas',
    wrong: `# Schema allows float — causes precision bugs in clients
totalPrice:
  type: number
  example: 9.99`,
    right: `# Use integer cents — precise, unambiguous, works across all languages
totalCents:
  type: integer
  description: Price in cents. 999 = $9.99
  example: 999
# OR use string for decimal representation
totalPrice:
  type: string
  pattern: '^\\d+\\.\\d{2}$'
  example: '9.99'`,
    explanation: 'type: number in JSON Schema allows floating point. IEEE 754 floats cause precision errors: 9.99 may be stored as 9.990000000000001. Use integer cents (999 = $9.99) or string decimal. Document the unit clearly in the schema description.',
  },
  {
    title: 'Not documenting error responses',
    wrong: `# Only documents the happy path — consumers don't know what failures look like
/orders/{id}:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'`,
    right: `# Document ALL expected responses — including 4xx and 5xx
/orders/{id}:
  get:
    responses:
      '200':
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Order'
      '401':
        $ref: '#/components/responses/Unauthorized'
      '404':
        $ref: '#/components/responses/NotFound'
      '429':
        $ref: '#/components/responses/TooManyRequests'`,
    explanation: 'Error responses are part of the contract. If consumers don\'t know what a 404 looks like, they guess. Document all 4xx/5xx responses — use $ref to shared error response components so they are consistent and defined in one place.',
  },
];

const challenge: Challenge = {
  title: 'Build a mini schema validator',
  language: 'typescript',
  description: `Implement validateAgainstSchema(data: any, schema: SchemaSpec): string[] that validates:
- required fields are present
- field types match ('string', 'number', 'boolean')
Returns array of error strings (empty = valid).

type SchemaSpec = { required?: string[]; properties: Record<string, { type: string }> }`,
  hints: [
    'Check required fields first with Array.every / filter',
    'Use typeof for type checking',
  ],
  starterCode: `type SchemaSpec = {
  required?: string[];
  properties: Record<string, { type: string }>;
};

function validateAgainstSchema(data: any, schema: SchemaSpec): string[] {
  const errors: string[] = [];
  // Check required fields
  // Check property types for fields present in data
  return errors;
}

const schema: SchemaSpec = {
  required: ['productId', 'quantity'],
  properties: {
    productId: { type: 'string' },
    quantity: { type: 'number' },
    note: { type: 'string' },
  }
};
console.log(validateAgainstSchema({ productId: 'abc', quantity: 2 }, schema)); // []
console.log(validateAgainstSchema({ quantity: 'five' }, schema)); // 2 errors`,
  solution: `type SchemaSpec = {
  required?: string[];
  properties: Record<string, { type: string }>;
};

function validateAgainstSchema(data: any, schema: SchemaSpec): string[] {
  const errors: string[] = [];
  for (const field of schema.required ?? []) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(\`'\${field}' is required\`);
    }
  }
  for (const [field, def] of Object.entries(schema.properties)) {
    if (data[field] !== undefined && typeof data[field] !== def.type) {
      errors.push(\`'\${field}' must be \${def.type}, got \${typeof data[field]}\`);
    }
  }
  return errors;
}

const schema: SchemaSpec = {
  required: ['productId', 'quantity'],
  properties: {
    productId: { type: 'string' },
    quantity: { type: 'number' },
    note: { type: 'string' },
  }
};
console.log(validateAgainstSchema({ productId: 'abc', quantity: 2 }, schema));
console.log(validateAgainstSchema({ quantity: 'five' }, schema));`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the primary purpose of $ref in an OpenAPI specification?',
    options: [
      'To reference an external API endpoint for cross-service documentation',
      'To create a reusable reference to a schema or response defined in components — avoiding duplication',
      'To specify a required HTTP header that must be sent with each request',
      'To mark a field as optional in the request schema',
    ],
    answer: 1,
    explanation: '$ref creates a pointer to a reusable definition in the components section: $ref: "#/components/schemas/Order" means "use the Order schema defined in components." This avoids duplicating schema definitions across multiple endpoints. When you update the schema, all references automatically reflect the change.',
  },
  {
    q: 'What does contract testing (e.g., Pact or Dredd) verify?',
    options: [
      'That the OpenAPI YAML is valid and parses without syntax errors',
      'That the live API implementation matches the documented schemas and response codes',
      'That all API consumers have updated their client code after a schema change',
      'That API responses are faster than the SLA thresholds in the spec',
    ],
    answer: 1,
    explanation: 'Contract testing fires real HTTP requests at the live API and validates that responses match the schemas and status codes documented in the spec (Dredd) or in consumer pact files (Pact). This catches spec drift — where the implementation diverges from the spec — before consumers hit production failures.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'When should you use oneOf vs anyOf in OpenAPI schemas?',
    a: '<ul><li><strong>oneOf</strong>: exactly ONE of the listed schemas must validate. Use for strict polymorphism — a response is either a CreditCardPayment or a BankTransferPayment, never both. Pair with a <code>discriminator</code> field so parsers know which sub-schema to use without trying all of them.</li><li><strong>anyOf</strong>: one OR MORE schemas may validate. Use when a field can match multiple schemas simultaneously (rare — more often a design smell).</li><li><strong>allOf</strong>: ALL listed schemas must validate. Use for schema inheritance/composition: <code>allOf: [$ref: BaseEntity, $ref: OrderFields]</code> — the merged schema must satisfy both.</li></ul>Example discriminator pattern:<br><pre>PaymentMethod:\n  oneOf:\n    - $ref: \'#/components/schemas/CreditCard\'\n    - $ref: \'#/components/schemas/BankTransfer\'\n  discriminator:\n    propertyName: type\n    mapping:\n      credit_card: \'#/components/schemas/CreditCard\'\n      bank_transfer: \'#/components/schemas/BankTransfer\'</pre>',
  },
  {
    q: 'How do you generate client SDKs from an OpenAPI spec?',
    a: 'Use <strong>openapi-generator</strong> (most popular, supports 50+ languages):<br><br><code>npx @openapitools/openapi-generator-cli generate -i openapi.yaml -g typescript-fetch -o ./sdk/</code><br><br>This generates a typed TypeScript client with all request/response types derived from your spec. Options:<ul><li><code>typescript-fetch</code>: plain fetch-based client</li><li><code>typescript-axios</code>: axios-based with interceptors</li><li><code>typescript-angular</code>: Angular HttpClient + injectable services</li></ul>Key practice: generate the SDK in CI from the authoritative spec and publish it as an npm package. Consumers import the SDK, not raw fetch calls. When the API changes, bump the SDK version — consumers get type errors if they use removed fields.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'OpenAPI is a machine-readable contract for REST APIs — spec first, generate docs/SDKs/mocks, validate with Spectral, verify with contract tests.',
  mustKnow: [
    'OpenAPI 3.1 YAML/JSON spec describes paths, schemas, auth, and errors — machine-readable contract',
    '$ref: "#/components/schemas/X" — reuse schemas; avoids duplication, enables SDK generation',
    'components/schemas for models; components/responses for shared error envelopes',
    'Spectral: lint the spec in CI — enforce naming, required fields, idempotency-key rules',
    'Contract testing (Dredd/Pact) — verifies the live API matches the spec; catches spec drift',
    'openapi-generator — typed client SDKs in 50+ languages generated directly from the spec',
  ],
  interviewFocus: [
    'What is contract-first API design and why is it valuable?',
    'How does $ref work in OpenAPI and why use it?',
    'What is the difference between oneOf and allOf in OpenAPI schemas?',
  ],
};

@Component({
  selector: 'app-api-openapi-contracts',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './openapi-contracts.html',
  styleUrl: './openapi-contracts.scss',
})
export class ApiOpenapiContracts {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
