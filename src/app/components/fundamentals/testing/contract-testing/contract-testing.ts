import { Component } from '@angular/core';
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

@Component({
  selector: 'app-contract-testing',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
            CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
            QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './contract-testing.html',
  styleUrl: './contract-testing.scss',
})
export class ContractTesting {
  quickRef: QuickRefItem[] = [
    { name: 'Consumer',       type: 'keyword', desc: 'The service that makes the API call (frontend, another microservice).' },
    { name: 'Provider',       type: 'keyword', desc: 'The service that exposes the API being called.' },
    { name: 'Pact',           type: 'keyword', desc: 'A JSON file recording the consumer\'s expectations of the provider.' },
    { name: 'Pact Broker',    type: 'keyword', desc: 'Central server that stores pacts and runs compatibility checks.' },
    { name: 'Can-I-Deploy',   type: 'keyword', desc: 'CLI check: is this version of consumer/provider compatible with what\'s in production?' },
    { name: 'Interaction',    type: 'keyword', desc: 'A single request/response pair recorded in a pact.' },
  ];

  theory: TheoryPoint[] = [
    { heading: 'The Contract Testing Problem', points: [
      'Microservices break when one team changes an API without telling consumers.',
      'E2E tests catch this but are slow, brittle, and require all services running together.',
      'Contract testing: consumers document their expectations; providers verify them — independently.',
      'Neither service needs to run the other. Contracts are the handshake.',
    ]},
    { heading: 'Consumer-Driven Contracts with Pact', points: [
      'The consumer writes a test that defines what it expects the provider to return.',
      'Pact generates a "pact file" (JSON) from that test.',
      'The pact file is published to Pact Broker.',
      'The provider verifies against the pact file — without running the consumer.',
    ]},
    { heading: 'The Pact Workflow', points: [
      '1. Consumer writes pact test → pact.json generated.',
      '2. pact.json published to Pact Broker (CI step).',
      '3. Provider CI pulls pacts from Broker and runs verifyProvider().',
      '4. Results reported back to Broker.',
      '5. can-i-deploy checks compatibility before any service is deployed.',
    ]},
    { heading: 'When to Use Contract Testing', points: [
      'Ideal for microservices where teams release independently.',
      'Best for HTTP REST and message-based contracts.',
      'Not a replacement for integration tests — it tests the contract shape, not business logic.',
      'GraphQL: use GraphQL-specific contract tools (schema comparison, operation compatibility).',
    ]},
  ];

  codeTabs: CodeTab[] = [
    { label: 'Consumer Test', language: 'typescript', code:
`import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { UserClient } from '../src/user.client';

const { like, string, integer } = MatchersV3;

const provider = new PactV3({
  consumer: 'UserFrontend',
  provider: 'UserService',
  dir: './pacts',
});

describe('UserClient pact', () => {
  it('fetches a user by ID', async () => {
    await provider
      .given('user with ID 1 exists')
      .uponReceiving('a request for user 1')
      .withRequest({ method: 'GET', path: '/users/1' })
      .willRespondWith({
        status: 200,
        body: {
          id:    integer(1),
          name:  string('Alice'),
          email: string('alice@example.com'),
        },
      })
      .executeTest(async mockServer => {
        const client = new UserClient(mockServer.url);
        const user   = await client.getUser(1);
        expect(user.name).toBe('Alice');
      });
  });
});` },
    { label: 'Provider Verification', language: 'typescript', code:
`import { Verifier } from '@pact-foundation/pact';
import { app } from '../src/app';
import * as http from 'http';

describe('Provider verification', () => {
  let server: http.Server;

  beforeAll(() => {
    server = app.listen(3001);
  });

  afterAll(() => server.close());

  it('verifies pacts from Pact Broker', async () => {
    const verifier = new Verifier({
      provider: 'UserService',
      providerBaseUrl: 'http://localhost:3001',
      pactBrokerUrl: 'https://my-broker.pactflow.io',
      pactBrokerToken: process.env.PACT_BROKER_TOKEN,
      publishVerificationResult: true,
      providerVersion: process.env.GIT_COMMIT,
      // State handlers set up provider data for each "given"
      stateHandlers: {
        'user with ID 1 exists': async () => {
          await db.users.upsert({ id: 1, name: 'Alice', email: 'alice@example.com' });
        },
      },
    });

    return verifier.verifyProvider();
  });
});` },
    { label: 'Can-I-Deploy', language: 'typescript', code:
`# In CI pipeline (GitHub Actions / Azure DevOps)

# After consumer publishes its pact:
- name: Publish pact
  run: npx pact-broker publish ./pacts --broker-base-url=$PACT_BROKER_URL

# Before deploying the consumer to production:
- name: Can I deploy consumer?
  run: |
    npx pact-broker can-i-deploy \\
      --pacticipant UserFrontend \\
      --version \${GIT_SHA} \\
      --to-environment production \\
      --broker-base-url \${PACT_BROKER_URL}

# Before deploying the provider:
- name: Can I deploy provider?
  run: |
    npx pact-broker can-i-deploy \\
      --pacticipant UserService \\
      --version \${GIT_SHA} \\
      --to-environment production` },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Testing business logic in contract tests', wrong: 'pact test asserts that discounts are applied correctly', right: 'pact test only asserts the response shape and HTTP status', explanation: 'Contract tests verify the API contract (shape, status codes, fields). Business logic belongs in unit and integration tests.' },
    { title: 'Consumer writing overly strict matchers', wrong: "body: { name: 'Alice', id: 1, createdAt: '2024-01-01T00:00:00Z' }", right: "body: { name: string('Alice'), id: integer(1) } // only fields the consumer uses", explanation: 'Strict matchers make pacts brittle — provider adds a new field and pact fails. Only match fields the consumer actually uses.' },
    { title: 'Not using state handlers in provider verification', wrong: 'provider test runs against empty database — user not found → 404', right: 'stateHandlers: { "user with ID 1 exists": () => db.seed({...}) }', explanation: 'Each "given" state in a pact must be set up by the provider before that interaction is verified. Missing state handlers cause false failures.' },
    { title: 'Skipping can-i-deploy check', wrong: 'deploy consumer directly after publishing pact', right: 'npx pact-broker can-i-deploy before every deployment', explanation: 'Publishing a pact does not mean the provider has verified it. can-i-deploy checks the actual compatibility matrix before you deploy.' },
    { title: 'Using contract tests instead of integration tests', wrong: 'replace all integration tests with pact tests for performance', right: 'contract tests complement integration tests — they do not replace them', explanation: 'Pact verifies the contract shape. Integration tests verify that the business logic is correct end-to-end. Both are needed.' },
  ];

  challenge: Challenge = {
    title: 'Design a consumer pact test',
    language: 'typescript',
    description: 'Design (write the test structure, not the full Pact setup) a consumer pact for a ProductClient that calls GET /products/:id and expects { id: number, name: string, price: number }. Write the interaction definition and the assertion.',
    hints: [
      'Use MatchersV3: integer() for id, string() for name, decimal() for price.',
      'The "given" state should describe the provider data needed: "product 42 exists".',
    ],
    starterCode:
`// Sketch the pact interaction (no need for full Pact setup)
const interaction = {
  given: '',       // what state the provider must be in
  uponReceiving: '',
  withRequest: { method: '', path: '' },
  willRespondWith: {
    status: 0,
    body: {},
  },
};`,
    solution:
`const interaction = {
  given: 'product with ID 42 exists',
  uponReceiving: 'a request for product 42',
  withRequest: { method: 'GET', path: '/products/42' },
  willRespondWith: {
    status: 200,
    body: {
      id:    integer(42),
      name:  string('Widget'),
      price: decimal(9.99),
    },
  },
};

// In the test:
// const client = new ProductClient(mockServer.url);
// const product = await client.getProduct(42);
// expect(product.name).toBe('Widget');
// expect(typeof product.price).toBe('number');`,
  };

  quiz: QuizQuestion[] = [
    { q: 'In consumer-driven contract testing, who defines the pact?', options: ['The provider team', 'The QA team', 'The consumer — it records its expectations of the provider', 'The Pact Broker automatically'], answer: 2, explanation: 'The consumer writes tests that express what it needs from the provider. These expectations are recorded as a pact file that the provider must verify.' },
    { q: 'What does can-i-deploy check?', options: ['Whether the code compiles', 'Whether a specific version of a service is compatible with what is in a given environment', 'Whether Docker is running', 'Whether pact tests passed locally'], answer: 1, explanation: 'can-i-deploy queries the Pact Broker\'s compatibility matrix: "Is version X of ServiceA compatible with all versions of its consumers/providers currently in production?"' },
    { q: 'Why should consumer matchers only assert on fields the consumer actually uses?', options: ['To make tests run faster', 'Overly strict matchers break when the provider adds new fields or changes unused data', 'Pact Broker requires minimal matchers', 'The provider cannot handle strict matching'], answer: 1, explanation: 'If the consumer matcher checks a timestamp field it never reads, a format change on the provider breaks the pact for no real reason. Match only what you consume.' },
  { q: 'What problem does Pact contract testing solve?', options: ['Performance regressions', 'Breaking changes when a provider API changes in ways consumers do not expect', 'Test data management', 'UI regression detection'], answer: 1, explanation: 'Pact prevents integration failures caused by provider changes. Consumers define their expectations as pacts; providers verify they still fulfill them — without needing a running consumer.' },
  { q: 'What is the Pact Broker used for?', options: ['Running Pact tests', 'Storing and sharing pact contracts between teams; enables can-i-deploy checks', 'Generating API stubs', 'Schema registry for events'], answer: 1, explanation: 'Pact Broker stores consumer pacts and provider verification results. Enables can-i-deploy: check if a provider version is safe to deploy given all consumer pacts are verified.' },
  { q: 'Who publishes pact files to the Pact Broker?', options: ['The provider team', 'The consumer team after consumer-side tests run', 'Both teams simultaneously', 'The CI/CD pipeline independently'], answer: 1, explanation: 'Consumers generate pact files from their consumer-side tests and publish them to the broker. Providers pull pacts from the broker and verify them during their CI pipeline.' },
  ];

  qna: QnaItem[] = [
    { q: 'Do I need a Pact Broker to use Pact?', a: 'No — you can use pactFile: "./pacts/consumer-provider.json" in the provider verifier to read local pact files. A Broker is needed for multi-team workflows, CI compatibility checks, and can-i-deploy. PactFlow offers a hosted Broker with a free tier.' },
    { q: 'How is contract testing different from API schema testing (OpenAPI)?', a: 'OpenAPI schema testing validates that the provider\'s API matches its documentation. Contract testing validates that the consumer\'s specific usage of the provider is satisfied. Contract testing is consumer-driven and checks what each consumer actually calls — OpenAPI tests check the full schema regardless of who uses it.' },
    { q: 'Can I use Pact for event-driven (Kafka/RabbitMQ) contracts?', a: 'Yes — Pact supports message contracts. The consumer defines the message structure it expects; the producer verifies it can produce a matching message. This is separate from HTTP pacts and is configured with MessageProviderPact.' },
  { q: 'How does Pact consumer-side testing work?', a: 'Consumer tests define the expected interactions: provider.addInteraction({ state: \'user exists\', uponReceiving: \'a request for user 1\', withRequest: { method: \'GET\', path: \'/users/1\' }, willRespondWith: { status: 200, body: { id: 1, name: like(\'Alice\') } } }). Pact runs a mock server; the consumer test hits it. On success, a pact file is generated.' },
  { q: 'How does provider verification work in Pact?', a: 'The provider runs its real service and replays each interaction from the pact file against it. Provider states (e.g., \'user exists\') trigger setup hooks that seed the DB. The verifier checks responses match the pact expectations. If all pass, results are published to Pact Broker. Failures block the can-i-deploy check.' },
  { q: 'What is the difference between consumer-driven contract testing and provider-driven?', a: '<strong>Consumer-driven</strong> (Pact): consumer defines what it needs; provider verifies it delivers. Prevents consumer breakage. <strong>Provider-driven</strong>: provider publishes an OpenAPI/JSON Schema spec; consumer tests validate the spec. Provider-driven is simpler but does not guarantee the provider actually implements the spec correctly without provider verification tests too.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Contract testing: consumer records API expectations as a pact; provider verifies — can-i-deploy guards deployments.',
    mustKnow: [
      'Consumer defines the pact (request + expected response shape)',
      'Pact Broker stores pacts and tracks compatibility',
      'Provider runs verifyProvider() against published pacts',
      'stateHandlers seed provider data for each "given" state',
      'can-i-deploy checks compatibility before deployment',
      'Match only fields the consumer uses — not the full response',
    ],
    interviewFocus: [
      'Consumer-driven vs provider-driven contracts',
      'What can-i-deploy prevents in microservice deployments',
      'How contract testing fits alongside integration tests',
    ],
  };
}
