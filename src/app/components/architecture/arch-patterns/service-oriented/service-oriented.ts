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
