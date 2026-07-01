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
  selector: 'app-arch-service-oriented',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './service-oriented.html',
  styleUrl: './service-oriented.scss',
})
export class ArchServiceOriented {

  quickRef: QuickRefItem[] = [
    { name: 'SOA', type: 'keyword', desc: 'Service-Oriented Architecture — coarse-grained services communicating via standardised interfaces' },
    { name: 'ESB', type: 'keyword', desc: 'Enterprise Service Bus — central middleware for routing, transformation, and orchestration' },
    { name: 'WSDL', type: 'keyword', desc: 'Web Services Description Language — XML-based contract for SOAP web services' },
    { name: 'Service Contract', type: 'keyword', desc: 'Explicit interface definition that all consumers depend on — stable and versioned' },
    { name: 'Orchestration', type: 'keyword', desc: 'Central component coordinates service calls and business logic (ESB or orchestrator)' },
    { name: 'Choreography', type: 'keyword', desc: 'Services react to events with no central coordinator — each knows its own role' },
    { name: 'Service Granularity', type: 'keyword', desc: 'SOA services are large (Order Service, Customer Service); microservices are fine-grained' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is SOA?',
      points: [
        'SOA emerged in the late 1990s/early 2000s as a way to integrate large enterprise systems via standardised service interfaces.',
        'Services are coarse-grained, reusable, and expose standardised contracts (typically SOAP/WSDL over HTTP or messaging).',
        'An Enterprise Service Bus (ESB) acts as the central backbone: it routes messages, transforms data formats, enforces policies, and handles retries.',
        'SOA was revolutionary at the time — it replaced point-to-point integration spaghetti with a structured communication layer.',
      ],
    },
    {
      heading: 'SOA vs Microservices',
      points: [
        'Service size: SOA services are large and coarse (OrderService, CustomerService). Microservices are small, single-responsibility.',
        'Shared data: SOA services often share a central database or data warehouse. Microservices own their data.',
        'ESB vs lightweight: SOA relies on smart middleware (ESB) with logic. Microservices use dumb pipes (Kafka, HTTP) with smart endpoints.',
        'Deployment: SOA services can share a runtime. Microservices are independently deployable.',
        '"Microservices = SOA done right" — Sam Newman, author of Building Microservices.',
      ],
    },
    {
      heading: 'When SOA Patterns Still Apply',
      points: [
        'Enterprise integration: SOA tooling (MuleSoft, Azure Integration Services, IBM MQ) is dominant in large enterprises.',
        'Legacy modernisation: wrapping legacy systems in a service contract is a classic SOA approach.',
        'Regulated industries: canonical data models and audit trails are SOA strengths.',
        'ESB concepts (routing, transformation, protocol bridging) appear under new names in API gateways and service meshes.',
      ],
    },
    {
      heading: 'SOA\'s Enterprise Service Bus and Why Microservices Diverged From It',
      points: [
        'Classic SOA commonly centralized integration logic (routing, transformation, orchestration) in an Enterprise Service Bus (ESB) — a powerful but heavyweight central component that, over time, tended to accumulate business logic and become a bottleneck for change, similar to how a monolith accumulates coupling.',
        'Microservices architecture deliberately reacted against this centralization — favoring "smart endpoints, dumb pipes," where business logic lives IN the services themselves and the communication infrastructure (message brokers, simple HTTP) stays deliberately minimal and free of embedded business logic.',
        'This philosophical difference explains why an ESB-heavy SOA implementation and a microservices implementation can look superficially similar (both decompose a monolith into services) while having very different maintainability characteristics — the location of orchestration and business logic is the key distinguishing factor.',
        'Modern lightweight infrastructure (a simple message broker, a thin API gateway used only for cross-cutting concerns) attempts to capture SOA\'s original integration benefits while avoiding the ESB\'s tendency to become an overloaded, hard-to-change central bottleneck.',
      ],
    },
    {
      heading: 'Contract-First Design as a Shared SOA and Microservices Practice',
      points: [
        'Both SOA and microservices benefit from contract-first design — defining a service\'s interface (WSDL in classic SOA, OpenAPI/protobuf in microservices) before implementation, letting consumer teams build against a stable, agreed-upon contract while the provider team implements independently.',
        'A well-defined, versioned contract is what actually enables independent service evolution — without it, consumers end up depending on a provider\'s specific implementation details, creating exactly the tight coupling that service-oriented approaches (of either era) are meant to avoid.',
        'Contract testing (verifying a provider\'s actual behavior matches its published contract, and that consumers\' usage matches what the contract promises) catches breaking changes before they reach production, a discipline equally important whether the underlying architecture is classic SOA or modern microservices.',
        'The specific technology (SOAP/WSDL vs. REST/OpenAPI vs. gRPC/protobuf) matters far less than the underlying discipline of explicit, versioned, tested contracts between service boundaries — this principle has remained constant even as the specific tooling has evolved significantly over time.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SOA Service Contract (WSDL-style → REST)',
      language: 'typescript',
      code: `// Classic SOA exposed coarse-grained services via SOAP
// Modern equivalent: REST API with explicit versioned contract

// OrderService — coarse-grained; handles all order operations
interface OrderServiceContract {
  placeOrder(request: PlaceOrderRequest): Promise<OrderResponse>;
  cancelOrder(request: CancelOrderRequest): Promise<CancelResponse>;
  getOrderStatus(orderId: string): Promise<OrderStatusResponse>;
  updateShippingAddress(request: UpdateAddressRequest): Promise<UpdateResponse>;
  processReturn(request: ReturnRequest): Promise<ReturnResponse>;
}

// Versioned contract for stability
// v1 consumed by mobile app; v2 adds bulk order support
const V1_CONTRACT = '/api/v1/orders';
const V2_CONTRACT = '/api/v2/orders';`
    },
    {
      label: 'ESB-style Orchestration vs Event Choreography',
      language: 'typescript',
      code: `// SOA ORCHESTRATION — central ESB coordinates all steps
class OrderOrchestrator {
  async processOrder(order: Order): Promise<void> {
    // ESB calls each service in sequence — central control
    const inventoryResult = await this.inventoryService.reserve(order.items);
    if (!inventoryResult.success) {
      await this.notifyService.sendOutOfStock(order.customerId);
      return;
    }

    const paymentResult = await this.paymentService.charge(order.customerId, order.total);
    if (!paymentResult.success) {
      await this.inventoryService.release(order.items); // compensate
      await this.notifyService.sendPaymentFailed(order.customerId);
      return;
    }

    await this.shippingService.dispatch(order);
    await this.notifyService.sendConfirmation(order.customerId);
  }
}

// EVENT CHOREOGRAPHY — no central controller
// InventoryService listens for OrderPlaced, emits StockReserved
// PaymentService listens for StockReserved, emits PaymentCharged
// ShippingService listens for PaymentCharged, emits Dispatched`
    },
    {
      label: 'Canonical Data Model',
      language: 'typescript',
      code: `// SOA often uses a Canonical Data Model — shared schema across services
// This avoids N×N transformation mappings between services

// Canonical Order model (enterprise-wide agreement)
interface CanonicalOrder {
  orderId: string;          // UUID, globally unique
  customerId: string;       // maps to Customer Service ID
  orderDate: string;        // ISO-8601
  currency: string;         // ISO-4217
  totalAmount: number;
  lines: CanonicalOrderLine[];
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED';
}

// Each service transforms its internal model TO/FROM canonical
class OrderServiceAdapter {
  toCanonical(internal: InternalOrder): CanonicalOrder { ... }
  fromCanonical(canonical: CanonicalOrder): InternalOrder { ... }
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Building a distributed monolith instead of SOA',
      wrong: `// Services share the same database and call each other synchronously for every operation`,
      right: `// Each service owns its data; prefer async messaging for non-critical cross-service flows`,
      explanation: 'Sharing a database or tightly coupling synchronous calls combines the worst of both worlds: distributed complexity without service independence.',
    },
    {
      title: 'Putting business logic in the ESB',
      wrong: `// ESB applies discount rules and pricing logic during routing`,
      right: `// ESB routes, transforms format, and enforces policies — business logic stays in services`,
      explanation: 'An ESB with business logic becomes a "smart middleware" that is hard to test, version, and replace. Keep it dumb — routing and protocol bridging only.',
    },
    {
      title: 'Treating SOA and Microservices as mutually exclusive',
      wrong: `// Either full SOA with ESB or full microservices — pick one`,
      right: `// Use ESB tooling for legacy integration, microservices for new greenfield capabilities`,
      explanation: 'Modern enterprises often run both: ESB for legacy system integration and Kafka/HTTP-based microservices for new capabilities.',
    },
    {
      title: 'Versioning service contracts too frequently',
      wrong: `// New API version for every field change: v1, v2, v3, v4 in 3 months`,
      right: `// Use additive-only changes (new optional fields) until a breaking change is unavoidable`,
      explanation: 'Frequent version churn forces all consumers to update simultaneously — SOA\'s strength is stable, reusable contracts.',
    },
  ];

  challenge: Challenge = {
    title: 'Design a SOA Integration for a Legacy ERP',
    language: 'typescript',
    description: `A company has a legacy ERP system (IBM AS/400, SOAP-based) and a new React frontend.
Design an integration layer that:
1. Defines a canonical Order type.
2. Wraps the legacy SOAP endpoint in a REST adapter.
3. Maps the SOAP response to the canonical model.
Do not call real SOAP — simulate with a stub.`,
    hints: [
      'Canonical model: flat, JSON-friendly, ISO dates and codes',
      'SOAP stub: a function that returns XML-like structure',
      'Adapter: translates SOAP response fields to canonical fields',
      'REST facade: exposes GET /orders/:id that callers use',
    ],
    starterCode: `interface CanonicalOrder {
  orderId: string;
  customerId: string;
  totalAmount: number;
  status: string;
}

// SOAP stub (simulates legacy ERP response)
function soapGetOrder(id: string) {
  return { ORDER_ID: id, CUST_NO: 'C001', AMT: 299.99, STAT_CD: '10' };
}

// TODO: map SOAP response to CanonicalOrder
// TODO: REST adapter function getOrder(id)`,
    solution: `interface CanonicalOrder {
  orderId: string;
  customerId: string;
  totalAmount: number;
  status: string;
}

function soapGetOrder(id: string) {
  return { ORDER_ID: id, CUST_NO: 'C001', AMT: 299.99, STAT_CD: '10' };
}

const STATUS_MAP: Record<string, string> = {
  '10': 'PENDING', '20': 'CONFIRMED', '30': 'SHIPPED', '40': 'CANCELLED',
};

function mapToCanonical(soap: ReturnType<typeof soapGetOrder>): CanonicalOrder {
  return {
    orderId: soap.ORDER_ID,
    customerId: soap.CUST_NO,
    totalAmount: soap.AMT,
    status: STATUS_MAP[soap.STAT_CD] ?? 'UNKNOWN',
  };
}

async function getOrder(id: string): Promise<CanonicalOrder> {
  const soapResponse = soapGetOrder(id); // real: await soapClient.call(...)
  return mapToCanonical(soapResponse);
}

getOrder('ORD-123').then(console.log);`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the role of an ESB in SOA?',
      options: [
        'Stores all service data in a central database',
        'Routes, transforms, and mediates messages between services',
        'Generates service contracts automatically',
        'Replaces microservices',
      ],
      answer: 1,
      explanation: 'The ESB is the integration backbone: message routing, protocol bridging, data transformation, and policy enforcement.',
    },
    {
      q: 'How does SOA differ from Microservices in service granularity?',
      options: [
        'SOA has finer-grained services',
        'SOA has coarser-grained services (e.g., OrderService handles all order operations)',
        'They are identical in granularity',
        'Microservices use an ESB; SOA does not',
      ],
      answer: 1,
      explanation: 'SOA services are coarse-grained and reusable across the enterprise. Microservices are small, single-responsibility units.',
    },
    {
      q: 'What is a Canonical Data Model?',
      options: [
        'A database schema shared by all services',
        'An enterprise-wide agreed data schema that eliminates N×N service-to-service transformations',
        'A WSDL template',
        'A REST API standard',
      ],
      answer: 1,
      explanation: 'The Canonical Data Model defines a shared data contract so each service only needs to transform to/from canonical, not to/from every other service.',
    },
    { q: 'Why does SOA\'s reliance on a centralized ESB for orchestration logic create a different KIND of coupling problem than microservices typically face?', options: ['SOA has no coupling problems at all — that is unique to microservices', 'In SOA, business process/orchestration logic often lives centrally IN the ESB rather than in the services themselves, meaning changing how services interact requires modifying shared ESB configuration that all services depend on — a form of coupling through shared centralized infrastructure rather than direct service-to-service coupling', 'SOA services are coupled only at the database level, never at the integration level', 'The ESB eliminates coupling entirely by design', 'None of the above'], answer: 1, explanation: 'Microservices coupling concerns are usually about direct dependencies between services (chatty calls, shared databases). SOA introduces a different coupling axis: because the ESB centrally owns routing, transformation, and often orchestration rules for interactions BETWEEN services, teams cannot change how their service integrates with others without coordinating changes to shared ESB configuration — turning the integration layer itself into a bottleneck for organizational autonomy, which is a core reason microservices deliberately push orchestration logic back out to the edges (smart endpoints) rather than centralizing it.' },
    { q: 'What is an ESB (Enterprise Service Bus) and what were its drawbacks?', options: ['A high-speed network switch used to connect microservices in a cluster', 'A centralized middleware layer in SOA that routes, transforms, and orchestrates messages between services, but became a bottleneck and coupled all services to its logic', 'A message queue technology equivalent to Kafka in the SOA era', 'A database bus that replicates data between enterprise services'], answer: 1, explanation: 'An ESB is a centralized integration platform that handles routing, message transformation, protocol translation, and orchestration between services in SOA. The ESB became a dumping ground for business logic that did not belong there, creating a coupling point: all services depended on the ESB, which had to be changed when any service contract changed. It became a fragile, complex bottleneck that required specialized expertise and slowed down deployments. Microservices rejected the ESB model in favor of dumb pipes (message brokers) and smart endpoints (services containing their own logic).' },
    { q: 'What is service contract in SOA and how did WSDL formalize it?', options: ['A legal agreement between IT vendors providing infrastructure services', 'A formal specification of a service interface that defines operations, message formats, and protocols, expressed in SOA via WSDL (Web Services Description Language)', 'A database schema shared between services for data exchange', 'A configuration file specifying the service health check endpoint'], answer: 1, explanation: 'A service contract defines what a service does: its operations (methods), message formats (input and output data structures), and communication protocols. In SOA, WSDL (Web Services Description Language) formalized service contracts as XML documents describing SOAP operations, message types, and endpoint bindings. WSDL enabled tooling to auto-generate client stubs in multiple languages. In microservices, OpenAPI (Swagger) serves a similar purpose for REST APIs and proto files for gRPC.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'Is SOA dead?',
      a: 'The acronym is less fashionable, but the concepts are alive. API gateways are ESBs with better UX. Service meshes handle SOA-era cross-cutting concerns (security, observability). Enterprise integration platforms (MuleSoft, Azure Integration Services) are direct SOA descendants.',
    },
    {
      q: 'When would you choose SOA tooling over microservices?',
      a: 'When integrating heterogeneous legacy systems, regulated data flows requiring audit trails, or environments where the IT organisation is centralised and the ESB team provides shared infrastructure. Microservices suit fast-moving, team-per-service organisations.',
    },
    {
      q: 'What does "smart pipes, dumb endpoints" mean?',
      a: 'The SOA/ESB model: smart middleware (ESB) handles routing, transformation, retry. Microservices invert this: dumb pipes (HTTP, Kafka) and smart endpoints (services own their logic). The inversion reduces the ESB as a single point of failure and coupling.',
    },
    { q: 'What lessons from SOA failures influenced microservices design?', a: 'Key SOA lessons: avoid centralized middleware (ESB) that becomes a coupling and performance bottleneck; distribute integration logic to individual services. Services should be fine-grained with single responsibilities, not coarse-grained combining multiple domains. Use lightweight protocols (HTTP, JSON, gRPC) instead of heavy enterprise standards (SOAP, BPEL). Avoid shared databases between services even if they share infrastructure. Avoid orchestration logic in a central layer; prefer choreography via events. Invest in developer tooling and automation from the start because the operational burden of many services requires CI/CD, service discovery, and observability that SOA often lacked. Many microservices problems are SOA problems rediscovered at smaller scale.' },
    { q: 'What is service virtualization in SOA and how is it used for testing?', a: 'Service virtualization simulates the behavior of dependent services that are not available during testing: third-party APIs, backend services under development, or expensive-to-use production services. A virtual service intercepts calls to a real service and returns pre-configured responses based on the request content. Tools include WireMock, Mountebank, and Parasoft Virtualize. Benefits: test environments become available before all dependent services are ready. Tests are isolated from instability in external dependencies. Performance and load testing can run without hitting rate limits on production APIs. Service virtualization differs from mocking (in-process code substitution): virtual services operate at the network level and work across multiple services and languages.' },
    { q: 'How does SOA governance differ from modern microservices team autonomy?', a: 'SOA governance typically established a central architecture team that reviewed and approved all service designs, enforced shared data models across services, and mandated standard technology stacks and protocols. This created bottlenecks: services could not be deployed without governance approval. Microservices favors team autonomy: each team chooses its own technology stack, data model, and deployment pace as long as it satisfies the service contract. Lightweight governance is applied at the API boundary only: teams agree on communication protocols and API versioning conventions but are free in implementation choices. The difference reflects a cultural shift: from centralized control to federated autonomy with shared standards.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'SOA uses coarse-grained, reusable services communicating via a centralised ESB — foundational enterprise integration pattern that evolved into microservices.',
    mustKnow: [
      'SOA: coarse-grained services, ESB backbone, SOAP/WSDL contracts',
      'ESB role: routing, protocol bridging, transformation, policy enforcement',
      'Microservices = SOA + fine-grained services + smart endpoints + dumb pipes',
      'Canonical Data Model: enterprise-wide shared schema to avoid N×N transformations',
      'SOA patterns persist in API gateways, service meshes, and integration platforms',
    ],
    interviewFocus: [
      'Compare SOA and Microservices — what problems did microservices solve?',
      'What is a Canonical Data Model and when do you need one?',
      'Orchestration vs Choreography — trade-offs?',
    ],
  };
}
