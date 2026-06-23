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

@Component({
  selector: 'app-arch-microservices-principles',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './microservices-principles.html',
  styleUrl: './microservices-principles.scss',
})
export class ArchMicroservicesPrinciples {

  quickRef: QuickRefItem[] = [
    { name: 'Single Responsibility', type: 'keyword', desc: 'Each service does one thing well — aligned to a bounded context or business capability' },
    { name: 'Own Your Data', type: 'keyword', desc: 'Each service owns its own database — no shared schemas between services' },
    { name: 'Independent Deployability', type: 'keyword', desc: 'A service can be deployed, scaled, and rolled back without coordinating with others' },
    { name: 'Decentralised Governance', type: 'keyword', desc: 'Teams choose their own tech stack per service — polyglot persistence and languages' },
    { name: 'Design for Failure', type: 'keyword', desc: 'Assume services fail; implement retries, circuit breakers, and fallbacks' },
    { name: 'API-First', type: 'keyword', desc: 'Services communicate only via well-defined APIs — no shared in-process calls' },
    { name: 'Two-Pizza Team', type: 'keyword', desc: 'Service team small enough to be fed by two pizzas (~6–10 people) per Amazon' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Core Principles',
      points: [
        'Services are built around business capabilities, not technical functions (not "DatabaseService" or "HelperService").',
        'Each service owns its data: no other service reads its database directly. Cross-service data access goes through the API.',
        'Services are independently deployable: a change to Order Service does not require redeploying Inventory Service.',
        'Services are loosely coupled and highly cohesive: low coupling between services, high cohesion within a service.',
      ],
    },
    {
      heading: 'Team Topology and Conway\'s Law',
      points: [
        'Conway\'s Law: organisations design systems that mirror their communication structure.',
        'Microservices work best when teams are small, autonomous, and own a service end-to-end (design, build, deploy, operate).',
        'Inverse Conway Manoeuvre: design the team structure you want, then let the architecture follow.',
        'You build it, you run it (Werner Vogels, AWS): the team that builds the service also runs it in production.',
      ],
    },
    {
      heading: 'Operational Realities',
      points: [
        'Microservices distribute complexity from code into the network and infrastructure.',
        'You gain: independent scaling, technology choice, fault isolation, and small deployable units.',
        'You pay: distributed tracing, eventual consistency, network latency, operational overhead.',
        'Start with a Modular Monolith; adopt microservices when the team and domain are stable enough to absorb the operational cost.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Service Ownership Pattern',
      language: 'bash',
      code: `# Each service: its own repo (or folder), its own DB, its own pipeline
services/
  order-service/
    src/                 # owns all order logic
    docker-compose.yml   # own local DB (PostgreSQL)
    Dockerfile
    .github/workflows/   # own CI/CD pipeline
  inventory-service/
    src/
    docker-compose.yml   # own local DB (Redis)
    Dockerfile
    .github/workflows/
  payment-service/
    src/
    docker-compose.yml   # own local DB (PostgreSQL)
    Dockerfile
    .github/workflows/

# Services communicate ONLY via API — never shared DB!`
    },
    {
      label: 'API Contract (OpenAPI)',
      language: 'typescript',
      code: `// Order Service exposes a typed API contract
// Consumers must use this — no direct DB access allowed

// order-service/src/api/orders.contract.ts
export interface PlaceOrderRequest {
  customerId: string;
  lines: Array<{ productId: string; quantity: number; unitPrice: number }>;
}

export interface PlaceOrderResponse {
  orderId: string;
  status: 'PENDING';
  estimatedTotal: number;
}

// Inventory Service — separate contract, separate service
// inventory-service/src/api/inventory.contract.ts
export interface ReserveStockRequest {
  orderId: string;
  items: Array<{ productId: string; quantity: number }>;
}

export interface ReserveStockResponse {
  success: boolean;
  reservationId: string;
  failedItems: string[];  // productIds that could not be reserved
}`
    },
    {
      label: 'Decentralised Data',
      language: 'typescript',
      code: `// WRONG — Order Service reading Inventory DB directly
const product = await inventoryDb.products.findOne({ id: productId });

// CORRECT — Order Service calls Inventory API
const response = await fetch('http://inventory-service/api/products/' + productId);
const product: ProductDto = await response.json();

// If Inventory is unavailable, Order Service handles it gracefully:
async function getProductWithFallback(productId: string): Promise<ProductDto | null> {
  try {
    const res = await fetch(\`http://inventory-service/api/products/\${productId}\`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null; // circuit breaker / retry layer handles this upstream
  }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Sharing a database between services',
      wrong: `// InventoryService and OrderService both query the same "products" table`,
      right: `// Each service has its own schema; cross-service reads go via the API`,
      explanation: 'Shared databases couple services at the storage level — a schema change breaks multiple services simultaneously, eliminating independent deployability.',
    },
    {
      title: 'Services too fine-grained (nanoservices)',
      wrong: `// Separate services: GetCustomer, UpdateCustomer, DeleteCustomer, CreateCustomer`,
      right: `// One Customer Service owning the full customer lifecycle`,
      explanation: 'Over-splitting creates chatty network calls and distributed transaction nightmares. Align service boundaries to bounded contexts, not CRUD operations.',
    },
    {
      title: 'Synchronous calls chained across many services',
      wrong: `// Order → Inventory → Payment → Shipping — all synchronous, one slow = all slow`,
      right: `// Use async messaging for non-time-critical steps; sync only for immediate responses`,
      explanation: 'Long synchronous call chains amplify latency and create cascading failures. Design for asynchronous flows where possible.',
    },
    {
      title: 'No service versioning strategy',
      wrong: `// Breaking API change deployed; all consumers immediately fail`,
      right: `// Additive changes only; breaking changes via new version endpoint (/v2/)`,
      explanation: 'Without versioning, any breaking change requires coordinated rollout across all consumers — defeating independent deployability.',
    },
  ];

  challenge: Challenge = {
    title: 'Define Service Boundaries for an Online Bookstore',
    language: 'typescript',
    description: `An online bookstore has these operations:
- Browse and search books
- Manage customer accounts and addresses
- Place and track orders
- Process payments
- Handle inventory and stock levels
- Send email/SMS notifications

1. Define the services and their responsibilities.
2. Define the API contracts for PlaceOrder (what does Order Service need from others?).
3. Identify which flows should be synchronous vs asynchronous.`,
    hints: [
      'Align services to business capabilities, not technical functions',
      'PlaceOrder: sync call to check stock, async for payment/notifications',
      'Avoid a shared "User" database — each service stores only what it needs',
      'Notification service should subscribe to events, not be called directly',
    ],
    starterCode: `// Define your services:
const services = [
  // { name: '...', responsibilities: [...], ownedData: [...] }
];

// PlaceOrder flow:
// Order Service needs:
// - Catalog: product price (sync - needed to calculate total)
// - Inventory: stock check (sync - must confirm before order)
// - Payment: charge card (??? - sync or async?)
// - Notification: send confirmation (??? - sync or async?)`,
    solution: `const services = [
  { name: 'Catalog Service', responsibilities: ['Browse books', 'Search', 'Book details/pricing'], ownedData: ['books', 'categories', 'prices'] },
  { name: 'Customer Service', responsibilities: ['Account management', 'Address book', 'Preferences'], ownedData: ['customers', 'addresses'] },
  { name: 'Order Service',    responsibilities: ['Place orders', 'Order history', 'Track status'], ownedData: ['orders', 'order_lines'] },
  { name: 'Payment Service',  responsibilities: ['Charge cards', 'Refunds', 'Payment history'], ownedData: ['payments', 'refunds'] },
  { name: 'Inventory Service',responsibilities: ['Stock levels', 'Reserve/release stock'], ownedData: ['inventory'] },
  { name: 'Notification Service', responsibilities: ['Email', 'SMS', 'Push'], ownedData: ['notification_log'] },
];

// PlaceOrder flow:
// SYNC (needed for immediate response):
//   1. GET /catalog/products/:id  → price
//   2. POST /inventory/reserve    → stock check + reservation
// ASYNC (fire and forget after order saved):
//   3. Publish OrderPlaced event
//      → Payment Service subscribes → charges card → publishes PaymentCharged
//      → Notification Service subscribes → sends confirmation email
//      → Inventory Service updates committed stock on PaymentCharged`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What does "own your data" mean in microservices?',
      options: [
        'Each developer owns one database table',
        'Each service has its own database; no other service accesses it directly',
        'All data is stored in a central data warehouse',
        'Services use the same ORM framework',
      ],
      answer: 1,
      explanation: 'Each service owns its data store exclusively. Other services query data through the service\'s API, never via direct database access.',
    },
    {
      q: 'What is Conway\'s Law?',
      options: [
        'Microservices must use REST',
        'Systems mirror the communication structure of the organisations that build them',
        'Services should be no larger than 500 lines of code',
        'All services must use the same programming language',
      ],
      answer: 1,
      explanation: 'Conway\'s Law: organisations design systems that mirror their communication structure. Team topology drives architecture.',
    },
    {
      q: 'Why should microservice boundaries align with bounded contexts?',
      options: [
        'To minimise lines of code',
        'Because bounded contexts represent cohesive business domains with their own language and data model',
        'To share database schemas efficiently',
        'To use a single deployment pipeline',
      ],
      answer: 1,
      explanation: 'Bounded contexts define natural seams in the domain. Aligning services to them ensures high cohesion within services and low coupling between them.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How small should a microservice be?',
      a: '"Small enough to be owned by a two-pizza team" (Amazon). In practice: aligned to one bounded context or business capability, owned by one team, independently deployable. Size in lines of code is a poor proxy; domain cohesion is the right measure.',
    },
    {
      q: 'What is polyglot persistence?',
      a: 'Each service can use the database technology that best fits its needs: Order Service on PostgreSQL, Catalog Service on Elasticsearch, Session Service on Redis. Possible because services own their data and expose APIs — no shared schema.',
    },
    {
      q: 'When do microservices hurt more than they help?',
      a: 'Small teams (< 10–15 engineers), early-stage products with unstable domain models, apps with mostly CRUD and no complex business rules. The operational overhead (observability, service discovery, network latency) exceeds the benefit from independent deployability.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Microservices are small, independently deployable services aligned to business capabilities, each owning its own data and exposing only APIs.',
    mustKnow: [
      'Each service owns its own database — no shared schemas',
      'Align service boundaries to bounded contexts, not CRUD operations',
      'Independent deployability: deploy one service without redeploying others',
      'Conway\'s Law: team structure drives architecture',
      'Distribute complexity: from code into network, infrastructure, and ops',
    ],
    interviewFocus: [
      'How do you decide where to draw service boundaries?',
      'What does "own your data" mean and why does it matter?',
      'When would you NOT use microservices?',
    ],
  };
}
