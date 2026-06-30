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
  { q: 'What is the difference between OpenAPI 3.0 and OpenAPI 3.1 schema handling?', options: ['OpenAPI 3.1 adds support for REST in addition to HTTP APIs', 'OpenAPI 3.1 uses full JSON Schema draft 2020-12 compatibility, resolving inconsistencies where OpenAPI 3.0 used a custom subset of JSON Schema', 'OpenAPI 3.1 only supports YAML; OpenAPI 3.0 supports both JSON and YAML', 'OpenAPI 3.1 removes webhook support that was added in 3.0'], answer: 1, explanation: 'OpenAPI 3.0 had its own schema dialect that was inspired by but not fully compatible with JSON Schema. Several keywords (nullable, discriminator mapping) were OpenAPI-specific extensions. Tools could not use general JSON Schema validators on OpenAPI 3.0 schemas. OpenAPI 3.1: aligns with JSON Schema draft 2020-12. Removes nullable (use type: [string, null] instead). Adds webhooks as a top-level concept. The schema object is now a full JSON Schema. Benefits: JSON Schema validators work directly on OpenAPI 3.1 schemas. Reuse JSON Schema tooling (validators, code generators). Better schema composition using JSON Schema keywords.' },
  { q: 'What is a reusable components section in OpenAPI and what types of elements can be shared?', options: ['The components section is for adding plugin extensions to the OpenAPI specification', 'The components section stores reusable definitions for schemas, responses, parameters, request bodies, headers, security schemes, links, and callbacks that are referenced throughout the specification', 'The components section is for documenting external dependencies and third-party integrations', 'OpenAPI does not support component reuse; all definitions must be inline in each endpoint'], answer: 1, explanation: 'OpenAPI components section: provides a centralized location for reusable elements. Reusable types: components/schemas (data models referenced as $ref). components/responses (common responses like 401, 403, 404). components/parameters (common query params, headers). components/requestBodies (common request body shapes). components/headers (common response headers). components/securitySchemes (Bearer, OAuth2, API Key definitions). components/links (relationships between operations). components/callbacks (webhook definitions). $ref syntax: $ref: #/components/schemas/User. Benefits: avoid repeating the User schema in every endpoint. Change the schema once and it updates everywhere. Generate cleaner documentation with reusable type definitions. Identify inconsistencies when the same concept is defined multiple ways across endpoints.' },
  { q: 'What is contract-first API development and how does it differ from code-first?', options: ['Contract-first writes client code first; code-first writes server code first', 'Contract-first defines the OpenAPI specification before writing any implementation code; code-first generates the OpenAPI spec from annotations on existing code', 'Contract-first is for public APIs; code-first is for private internal APIs', 'Both approaches produce identical OpenAPI documents at the end'], answer: 1, explanation: 'Contract-first (design-first): write the OpenAPI specification before coding. Teams agree on the API contract. Frontend and backend teams can develop in parallel (frontend uses mocks generated from the spec). Server stubs are generated from the spec. Benefits: clear API design decisions happen before implementation. Avoids implementation-driven design that may not be optimal. OpenAPI spec is authoritative. Code-first: write server code with annotations (Swagger annotations in Java Spring, ASP.NET Core attributes). The OpenAPI spec is generated from the code. Benefits: spec stays in sync with implementation automatically. Faster for small teams. Disadvantages: the API design is driven by implementation convenience, not consumer needs. The spec may reflect internal data models rather than clean API design. Recommended: contract-first for external-facing APIs. Code-first for internal APIs where speed matters more.' },
  { q: 'What are OpenAPI specification validators and why should they run in CI?', options: ['Validators that test API response times against SLA thresholds defined in OpenAPI', 'Tools that validate OpenAPI documents for correctness, consistency, and compliance with style guidelines; running in CI ensures the spec is always valid and consistent', 'Security scanners that test endpoints defined in OpenAPI for vulnerabilities', 'Tools that compare OpenAPI specs between versions to detect breaking changes'], answer: 1, explanation: 'OpenAPI validators in CI: structural validation: does the YAML/JSON conform to the OpenAPI specification schema? Tools: swagger-parser, openapi-validator. Linting (style guide enforcement): are all endpoints documented? Do all responses have examples? Are parameters described? Tools: Spectral (extensible rules). Redocly CLI. Breaking change detection: does the new spec introduce breaking changes compared to the previous version? Tools: openapi-diff, Optic. Contract testing: do API responses match the schema defined in the spec? Tools: Dredd, Schemathesis. CI integration: fail the build if the spec has structural errors. Warn or fail on lint violations (missing descriptions, inconsistent naming). Block merges that introduce breaking changes to public APIs. Benefits: the spec stays accurate. Documentation generated from the spec is reliable. Client SDK generators produce correct code.' },
  { q: 'What is the difference between OpenAPI 3.0 and OpenAPI 3.1 schema handling?', options: ['OpenAPI 3.1 adds support for REST in addition to HTTP APIs', 'OpenAPI 3.1 uses full JSON Schema draft 2020-12 compatibility, resolving inconsistencies where OpenAPI 3.0 used a custom subset of JSON Schema', 'OpenAPI 3.1 only supports YAML; OpenAPI 3.0 supports both JSON and YAML', 'OpenAPI 3.1 removes webhook support that was added in 3.0'], answer: 1, explanation: 'OpenAPI 3.0 had its own schema dialect that was inspired by but not fully compatible with JSON Schema. Several keywords (nullable, discriminator mapping) were OpenAPI-specific extensions. Tools could not use general JSON Schema validators on OpenAPI 3.0 schemas. OpenAPI 3.1: aligns with JSON Schema draft 2020-12. Removes nullable (use type: [string, null] instead). Adds webhooks as a top-level concept. The schema object is now a full JSON Schema. Benefits: JSON Schema validators work directly on OpenAPI 3.1 schemas. Reuse JSON Schema tooling (validators, code generators). Better schema composition using JSON Schema keywords.' },
  { q: 'What is a reusable components section in OpenAPI and what types of elements can be shared?', options: ['The components section is for adding plugin extensions to the OpenAPI specification', 'The components section stores reusable definitions for schemas, responses, parameters, request bodies, headers, security schemes, links, and callbacks that are referenced throughout the specification', 'The components section is for documenting external dependencies and third-party integrations', 'OpenAPI does not support component reuse; all definitions must be inline in each endpoint'], answer: 1, explanation: 'OpenAPI components section: provides a centralized location for reusable elements. Reusable types: components/schemas (data models referenced as $ref). components/responses (common responses like 401, 403, 404). components/parameters (common query params, headers). components/requestBodies (common request body shapes). components/headers (common response headers). components/securitySchemes (Bearer, OAuth2, API Key definitions). components/links (relationships between operations). components/callbacks (webhook definitions). $ref syntax: $ref: #/components/schemas/User. Benefits: avoid repeating the User schema in every endpoint. Change the schema once and it updates everywhere. Generate cleaner documentation with reusable type definitions. Identify inconsistencies when the same concept is defined multiple ways across endpoints.' },
  { q: 'What is contract-first API development and how does it differ from code-first?', options: ['Contract-first writes client code first; code-first writes server code first', 'Contract-first defines the OpenAPI specification before writing any implementation code; code-first generates the OpenAPI spec from annotations on existing code', 'Contract-first is for public APIs; code-first is for private internal APIs', 'Both approaches produce identical OpenAPI documents at the end'], answer: 1, explanation: 'Contract-first (design-first): write the OpenAPI specification before coding. Teams agree on the API contract. Frontend and backend teams can develop in parallel (frontend uses mocks generated from the spec). Server stubs are generated from the spec. Benefits: clear API design decisions happen before implementation. Avoids implementation-driven design that may not be optimal. OpenAPI spec is authoritative. Code-first: write server code with annotations (Swagger annotations in Java Spring, ASP.NET Core attributes). The OpenAPI spec is generated from the code. Benefits: spec stays in sync with implementation automatically. Faster for small teams. Disadvantages: the API design is driven by implementation convenience, not consumer needs. The spec may reflect internal data models rather than clean API design. Recommended: contract-first for external-facing APIs. Code-first for internal APIs where speed matters more.' },
  { q: 'What are OpenAPI specification validators and why should they run in CI?', options: ['Validators that test API response times against SLA thresholds defined in OpenAPI', 'Tools that validate OpenAPI documents for correctness, consistency, and compliance with style guidelines; running in CI ensures the spec is always valid and consistent', 'Security scanners that test endpoints defined in OpenAPI for vulnerabilities', 'Tools that compare OpenAPI specs between versions to detect breaking changes'], answer: 1, explanation: 'OpenAPI validators in CI: structural validation: does the YAML/JSON conform to the OpenAPI specification schema? Tools: swagger-parser, openapi-validator. Linting (style guide enforcement): are all endpoints documented? Do all responses have examples? Are parameters described? Tools: Spectral (extensible rules). Redocly CLI. Breaking change detection: does the new spec introduce breaking changes compared to the previous version? Tools: openapi-diff, Optic. Contract testing: do API responses match the schema defined in the spec? Tools: Dredd, Schemathesis. CI integration: fail the build if the spec has structural errors. Warn or fail on lint violations (missing descriptions, inconsistent naming). Block merges that introduce breaking changes to public APIs. Benefits: the spec stays accurate. Documentation generated from the spec is reliable. Client SDK generators produce correct code.' },
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
  { q: 'How do you generate client SDKs from an OpenAPI specification?', a: 'OpenAPI client SDK generation: tools: OpenAPI Generator (openapi-generator.tech) — supports 50+ target languages including TypeScript, Python, Go, Java, C#. Swagger Codegen (the predecessor). kiota (Microsoft, designed for Graph API patterns). Generated artifacts: model classes (User, Order, etc.). API client class (UsersApi with typed methods). TypeScript example: a generated TypeScript SDK provides full type safety and auto-completion. Methods match endpoint operations: usersApi.getUser({ userId: 123 }). Customization: use OpenAPI Generator templates to customize the generated code. Add custom headers, auth, and retry logic through template overrides. Integration: automate SDK generation as a CI step when the OpenAPI spec changes. Publish generated SDKs to npm, PyPI, or Maven so consumers always have the latest version. Challenges: generated code can be verbose. Custom templates require maintenance. Generated code may not match your codebase conventions.' },
  { q: 'What is Spectral and how do you write custom OpenAPI lint rules?', a: 'Spectral: an open-source OpenAPI linter by Stoplight. Built-in rulesets: OpenAPI 3.x recommended rules (missing descriptions, invalid status codes, etc.). ArazzoSpecification rules. Custom rules: rules are written in JavaScript or YAML. Anatomy of a rule: given (JSONPath to match elements in the spec), then (assertion to apply), severity (error, warn, info). Example rule: require all API operations to have a summary field. given: $.paths.*.*. then: field: summary, function: truthy. Usage: spectral lint openapi.yaml. Integration: run in CI as a build step. Block merges that violate error-severity rules. Allow warnings to pass with notification. Rule organization: group rules into rulesets. Extend built-in rulesets and add custom rules. Share rulesets across teams via npm packages. Common custom rules: require operationId on all operations. Require examples on all response schemas. Enforce a naming convention for path parameters.' },
  { q: 'How does API mocking work with OpenAPI specifications?', a: 'API mocking from OpenAPI: generate a working mock server from an OpenAPI spec without backend code. Mock server tools: Prism (Stoplight) — starts a mock server from an OpenAPI file. Returns examples from the spec or dynamically generates responses. WireMock — stub generation from OpenAPI. Microcks — more enterprise, supports both REST and messaging mocks. Mock response generation: static examples: the mock returns examples defined in the spec (example or examples fields). Dynamic generation: the mock generates realistic fake data matching the schema types and constraints. Validation mode: Prism can proxy requests to a real backend and validate that the response matches the spec. Use cases: frontend development before the backend is ready. Contract testing — run consumer tests against the mock. Demo and testing environments. Integration: serve the mock in CI for integration tests. Run frontend E2E tests against the mock rather than a real backend, enabling isolated testing.' },
  { q: 'What is API documentation generation from OpenAPI and what tools are available?', a: 'OpenAPI documentation tools: Swagger UI: interactive HTML documentation generated from an OpenAPI spec. Users can test endpoints directly in the browser (Try it out feature). Most widely used. Self-hosted or hosted on a CDN. Redoc: clean, three-panel documentation layout. Responsive and mobile-friendly. Renders complex nested schemas elegantly. Better for read-focused reference documentation. Scalar: modern API documentation with a clean design. Supports OpenAPI 3.x and HTTP client for testing. Stoplight Elements: embeddable documentation components for React, Angular, or plain HTML. Platform-hosted documentation: SwaggerHub, Readme.com, Bump.sh. These host your spec and generate documentation with versioning and changelogs. Code examples: add x-code-samples or use generation tools to embed code examples for multiple languages in the documentation. Versioned docs: maintain separate documentation for each major API version. Automate documentation deployment in CI: push the OpenAPI spec and trigger a documentation rebuild.' },
  { q: 'How do you generate client SDKs from an OpenAPI specification?', a: 'OpenAPI client SDK generation: tools: OpenAPI Generator (openapi-generator.tech) — supports 50+ target languages including TypeScript, Python, Go, Java, C#. Swagger Codegen (the predecessor). kiota (Microsoft, designed for Graph API patterns). Generated artifacts: model classes (User, Order, etc.). API client class (UsersApi with typed methods). TypeScript example: a generated TypeScript SDK provides full type safety and auto-completion. Methods match endpoint operations: usersApi.getUser({ userId: 123 }). Customization: use OpenAPI Generator templates to customize the generated code. Add custom headers, auth, and retry logic through template overrides. Integration: automate SDK generation as a CI step when the OpenAPI spec changes. Publish generated SDKs to npm, PyPI, or Maven so consumers always have the latest version. Challenges: generated code can be verbose. Custom templates require maintenance. Generated code may not match your codebase conventions.' },
  { q: 'What is Spectral and how do you write custom OpenAPI lint rules?', a: 'Spectral: an open-source OpenAPI linter by Stoplight. Built-in rulesets: OpenAPI 3.x recommended rules (missing descriptions, invalid status codes, etc.). ArazzoSpecification rules. Custom rules: rules are written in JavaScript or YAML. Anatomy of a rule: given (JSONPath to match elements in the spec), then (assertion to apply), severity (error, warn, info). Example rule: require all API operations to have a summary field. given: $.paths.*.*. then: field: summary, function: truthy. Usage: spectral lint openapi.yaml. Integration: run in CI as a build step. Block merges that violate error-severity rules. Allow warnings to pass with notification. Rule organization: group rules into rulesets. Extend built-in rulesets and add custom rules. Share rulesets across teams via npm packages. Common custom rules: require operationId on all operations. Require examples on all response schemas. Enforce a naming convention for path parameters.' },
  { q: 'How does API mocking work with OpenAPI specifications?', a: 'API mocking from OpenAPI: generate a working mock server from an OpenAPI spec without backend code. Mock server tools: Prism (Stoplight) — starts a mock server from an OpenAPI file. Returns examples from the spec or dynamically generates responses. WireMock — stub generation from OpenAPI. Microcks — more enterprise, supports both REST and messaging mocks. Mock response generation: static examples: the mock returns examples defined in the spec (example or examples fields). Dynamic generation: the mock generates realistic fake data matching the schema types and constraints. Validation mode: Prism can proxy requests to a real backend and validate that the response matches the spec. Use cases: frontend development before the backend is ready. Contract testing — run consumer tests against the mock. Demo and testing environments. Integration: serve the mock in CI for integration tests. Run frontend E2E tests against the mock rather than a real backend, enabling isolated testing.' },
  { q: 'What is API documentation generation from OpenAPI and what tools are available?', a: 'OpenAPI documentation tools: Swagger UI: interactive HTML documentation generated from an OpenAPI spec. Users can test endpoints directly in the browser (Try it out feature). Most widely used. Self-hosted or hosted on a CDN. Redoc: clean, three-panel documentation layout. Responsive and mobile-friendly. Renders complex nested schemas elegantly. Better for read-focused reference documentation. Scalar: modern API documentation with a clean design. Supports OpenAPI 3.x and HTTP client for testing. Stoplight Elements: embeddable documentation components for React, Angular, or plain HTML. Platform-hosted documentation: SwaggerHub, Readme.com, Bump.sh. These host your spec and generate documentation with versioning and changelogs. Code examples: add x-code-samples or use generation tools to embed code examples for multiple languages in the documentation. Versioned docs: maintain separate documentation for each major API version. Automate documentation deployment in CI: push the OpenAPI spec and trigger a documentation rebuild.' },
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
