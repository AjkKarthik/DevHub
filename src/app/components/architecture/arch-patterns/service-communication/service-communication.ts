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
  selector: 'app-arch-service-communication',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './service-communication.html',
  styleUrl: './service-communication.scss',
})
export class ArchServiceCommunication {

  quickRef: QuickRefItem[] = [
    { name: 'Synchronous', type: 'keyword', desc: 'Caller waits for response — REST/HTTP, gRPC; tight temporal coupling' },
    { name: 'Asynchronous', type: 'keyword', desc: 'Caller publishes and continues; consumer processes later — Kafka, RabbitMQ, Azure Service Bus' },
    { name: 'REST', type: 'keyword', desc: 'HTTP + JSON; human-readable, widely supported, looser contracts' },
    { name: 'gRPC', type: 'keyword', desc: 'HTTP/2 + Protobuf binary; typed contracts, bi-directional streaming, high throughput' },
    { name: 'Message Queue', type: 'keyword', desc: 'Point-to-point async delivery — one consumer per message (work queue)' },
    { name: 'Pub/Sub', type: 'keyword', desc: 'One publisher, many independent subscribers — each gets a copy of the event' },
    { name: 'Temporal Decoupling', type: 'keyword', desc: 'Producer and consumer do not need to be running at the same time' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Sync vs Async — the Fundamental Choice',
      points: [
        'Synchronous: caller sends a request and blocks until the response arrives. Simple but creates temporal coupling.',
        'If the downstream service is slow or unavailable, the caller is also slow or fails.',
        'Asynchronous: caller publishes a message and continues immediately. Consumer processes it when ready.',
        'Async decouples services in time — producer and consumer need not be running simultaneously.',
        'Rule of thumb: use sync for reads that need an immediate answer; use async for writes and notifications.',
      ],
    },
    {
      heading: 'REST vs gRPC',
      points: [
        'REST over HTTP/1.1 + JSON: human-readable, easy to debug, browser-compatible, loose contracts.',
        'gRPC over HTTP/2 + Protobuf: strongly typed contracts (`.proto` files), binary encoding (~7× smaller than JSON), bi-directional streaming.',
        'gRPC for internal high-throughput service-to-service calls; REST for public APIs and browser clients.',
        'Both are synchronous by default; gRPC supports server-streaming and bi-directional streaming for push scenarios.',
      ],
    },
    {
      heading: 'Message Brokers — Queue vs Pub/Sub',
      points: [
        'Queue (work queue): multiple consumers compete for messages; each message processed by exactly one consumer. Good for load distribution.',
        'Pub/Sub (topic/exchange): one publisher, multiple subscribers each get their own copy. Good for event broadcasting.',
        'Kafka: log-based, persistent, replayable, ordered within partitions. Best for high-throughput event streaming.',
        'RabbitMQ: AMQP, flexible routing rules, lower latency for smaller message volumes.',
        'Azure Service Bus / AWS SQS/SNS: managed, cloud-native, good for hybrid and serverless architectures.',
      ],
    },
    {
      heading: 'Synchronous vs. Asynchronous Communication Tradeoffs',
      points: [
        'Synchronous communication (REST, gRPC) gives an immediate response and is simpler to reason about (a direct call-and-response), but couples the caller\'s availability and latency directly to the callee\'s — a slow or down downstream service directly degrades the calling service\'s own responsiveness.',
        'Asynchronous communication (message queues, event streams) decouples caller and callee in time — the caller can continue without waiting for the callee to actually process the request, at the cost of added complexity (eventual consistency, no immediate response, message infrastructure) that must be explicitly designed for.',
        'Choosing between them per interaction should be driven by whether an immediate response is genuinely required by the business flow — a checkout confirmation likely needs a synchronous response, while sending a post-purchase marketing email does not, and forcing either interaction into the wrong communication style adds unnecessary friction.',
        'Most real-world microservices systems use BOTH styles for different interactions within the same overall system — treating synchronous vs. asynchronous as a single system-wide architectural choice, rather than a per-interaction decision, typically produces a worse fit for at least some of the system\'s actual communication needs.',
      ],
    },
    {
      heading: 'Service Mesh as Infrastructure-Level Communication Management',
      points: [
        'A service mesh (via sidecar proxies deployed alongside each service instance) handles cross-cutting communication concerns — retries, timeouts, mutual TLS, load balancing, observability — at the INFRASTRUCTURE level, removing the need for every service to reimplement this logic in application code.',
        'This separation means communication resilience policies (a retry budget, a circuit breaker threshold) can be configured and updated centrally through the mesh\'s control plane, without requiring a code change and redeployment of every individual service to adjust that policy.',
        'The tradeoff is added operational complexity — running and correctly configuring a service mesh (Istio, Linkerd) is itself a significant undertaking, and the sidecar proxies add a small amount of latency and resource overhead to every service-to-service call.',
        'A service mesh is most valuable at genuine microservices scale (many services, many teams, needing consistent cross-cutting communication policy) — for a small number of services, the mesh\'s operational overhead often exceeds the benefit compared to simpler in-application resilience libraries.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'REST HTTP Call (sync)',
      language: 'typescript',
      code: `// Synchronous REST call with timeout and error handling
async function getProductPrice(productId: string): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(\`http://catalog-service/api/products/\${productId}/price\`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(\`Catalog returned \${res.status}\`);
    const { price } = await res.json();
    return price;
  } finally {
    clearTimeout(timeout);
  }
}

// gRPC equivalent (typed, binary, ~7× smaller payload)
// const { price } = await catalogClient.getProductPrice({ productId });`
    },
    {
      label: 'Async Message Publishing',
      language: 'typescript',
      code: `// Async: publish event and return immediately
// Consumers process it independently, in their own time

interface OrderPlacedEvent {
  orderId: string;
  customerId: string;
  totalAmount: number;
  lines: Array<{ productId: string; qty: number }>;
  occurredAt: string;
}

class OrderService {
  constructor(
    private orderRepo: IOrderRepository,
    private messageBus: IMessageBus,
  ) {}

  async placeOrder(cmd: PlaceOrderCommand): Promise<string> {
    const order = Order.create(cmd);
    await this.orderRepo.save(order);

    // Publish event — does not wait for downstream processing
    await this.messageBus.publish<OrderPlacedEvent>('orders.placed', {
      orderId: order.id,
      customerId: order.customerId,
      totalAmount: order.total,
      lines: order.lines.map(l => ({ productId: l.productId, qty: l.qty })),
      occurredAt: new Date().toISOString(),
    });

    return order.id; // returned immediately; payment/notification happen async
  }
}

// Payment Service subscribes to 'orders.placed'
messageBus.subscribe('orders.placed', async (event: OrderPlacedEvent) => {
  await paymentService.chargeCard(event.customerId, event.totalAmount);
});`
    },
    {
      label: 'Queue vs Pub/Sub Patterns',
      language: 'typescript',
      code: `// WORK QUEUE — load distribution (one consumer processes each message)
// Good for: email sending, image resizing, report generation
queue.subscribe('email.send', async (msg) => {
  await emailClient.send(msg.to, msg.subject, msg.body);
  await msg.ack(); // remove from queue after processing
}, { concurrency: 5 }); // 5 workers competing for messages

// PUB/SUB — event broadcasting (ALL subscribers get a copy)
// Good for: domain events that multiple services care about
// Publisher:
await topic.publish('user.registered', { userId, email, name });

// Subscriber A — sends welcome email
topic.subscribe('user.registered', 'notification-service', async (e) => {
  await emailService.sendWelcome(e.email);
});

// Subscriber B — creates default preferences
topic.subscribe('user.registered', 'preference-service', async (e) => {
  await prefService.createDefaults(e.userId);
});

// Subscriber C — logs for analytics
topic.subscribe('user.registered', 'analytics-service', async (e) => {
  await analytics.track('user_registered', { userId: e.userId });
});`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Long synchronous chains across many services',
      wrong: `// Order → Inventory → Payment → Shipping → Notification (all sync, all blocking)`,
      right: `// Sync: Order → Inventory (check stock); Async: OrderPlaced event → Payment, Notification, Shipping`,
      explanation: 'Long sync chains amplify latency (sum of all calls) and cascade failures. Break at the natural async boundary after the synchronous response is needed.',
    },
    {
      title: 'Not handling message broker unavailability',
      wrong: `await messageBus.publish('orders.placed', event); // if broker down, order silently lost`,
      right: `// Use Outbox Pattern: write event to DB in same transaction; relay process publishes to broker`,
      explanation: 'Publishing to a broker can fail after the DB commit — use the Outbox Pattern to guarantee at-least-once delivery.',
    },
    {
      title: 'Using REST for everything, including high-throughput internal calls',
      wrong: `// 50,000 RPS internal product price lookups via REST/JSON`,
      right: `// Use gRPC with Protobuf for high-throughput internal service calls`,
      explanation: 'JSON parsing overhead and HTTP/1.1 connection management become bottlenecks at high throughput. gRPC binary + HTTP/2 multiplexing handles it efficiently.',
    },
    {
      title: 'Fire-and-forget without idempotency on the consumer',
      wrong: `// Consumer processes duplicate messages twice (double charge, double email)`,
      right: `// Consumer checks idempotency key before processing; marks as processed after`,
      explanation: 'Message brokers guarantee at-least-once delivery. Consumers must be idempotent — processing the same message twice must produce the same result.',
    },
  ];

  challenge: Challenge = {
    title: 'Design the Communication Pattern for Order Checkout',
    language: 'typescript',
    description: `A checkout flow involves: validate cart, check stock, charge payment, send confirmation email, update analytics.
1. Identify which calls should be synchronous (caller needs the result before continuing).
2. Publish an OrderCheckedOut event with the relevant payload.
3. Write two independent async consumers: EmailService and AnalyticsService.`,
    hints: [
      'Sync: validate cart, check stock — needed to tell the user if checkout succeeds',
      'Async after DB commit: payment charging can be sync OR async depending on UX requirements',
      'Email and analytics are always async — fire and forget',
      'Consumers must be idempotent (check orderId before processing)',
    ],
    starterCode: `interface OrderCheckedOutEvent {
  orderId: string;
  customerId: string;
  email: string;
  totalAmount: number;
  items: string[];
}

// TODO: publish event after successful checkout
// TODO: EmailService consumer
// TODO: AnalyticsService consumer`,
    solution: `interface OrderCheckedOutEvent {
  orderId: string;
  customerId: string;
  email: string;
  totalAmount: number;
  items: string[];
}

// Checkout handler (sync steps first, then async event)
async function checkout(cart: Cart): Promise<{ orderId: string }> {
  validateCart(cart);                              // sync: must succeed to continue
  const reserved = await inventoryService.reserve(cart.items); // sync: needed for response
  if (!reserved) throw new Error('Out of stock');

  const order = await orderRepo.save(cart);        // persist to DB

  await messageBus.publish<OrderCheckedOutEvent>('orders.checked-out', {
    orderId: order.id,
    customerId: cart.customerId,
    email: cart.customerEmail,
    totalAmount: order.total,
    items: cart.items.map(i => i.productId),
  });

  return { orderId: order.id };
}

// EmailService — async consumer
const processedOrders = new Set<string>(); // idempotency store (use DB in prod)

messageBus.subscribe('orders.checked-out', async (e: OrderCheckedOutEvent) => {
  if (processedOrders.has(e.orderId)) return; // idempotency check
  await emailClient.sendConfirmation(e.email, e.orderId, e.totalAmount);
  processedOrders.add(e.orderId);
});

// AnalyticsService — independent async consumer
messageBus.subscribe('orders.checked-out', async (e: OrderCheckedOutEvent) => {
  await analytics.track('checkout_completed', {
    orderId: e.orderId,
    revenue: e.totalAmount,
    itemCount: e.items.length,
  });
});`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'When should you prefer async messaging over synchronous REST calls?',
      options: [
        'When the caller needs an immediate answer',
        'For writes and notifications where the caller does not need to wait for downstream processing',
        'For all service-to-service communication',
        'Only when the services are in different data centres',
      ],
      answer: 1,
      explanation: 'Async is ideal for writes and events where the caller does not need immediate confirmation from downstream services.',
    },
    {
      q: 'What is the main advantage of gRPC over REST for internal service calls?',
      options: [
        'Browser compatibility',
        'Human-readable payloads',
        'Strongly typed contracts, binary encoding, and HTTP/2 multiplexing for higher throughput',
        'No need for service discovery',
      ],
      answer: 2,
      explanation: 'gRPC uses Protobuf (binary, smaller, schema-enforced) over HTTP/2 (multiplexed connections), giving significantly higher throughput and type safety.',
    },
    {
      q: 'What is temporal decoupling?',
      options: [
        'Services use the same clock for synchronisation',
        'Producer and consumer do not need to be running at the same time',
        'All messages are time-stamped',
        'Services use NTP for time synchronisation',
      ],
      answer: 1,
      explanation: 'Temporal decoupling means the producer publishes a message and the consumer can process it minutes or hours later — they are independent in time.',
    },
    { q: 'What is gRPC and what advantages does it offer over REST for inter-service communication?', options: ['gRPC uses HTTP/2 with Protocol Buffers for strongly typed, high-performance binary communication, offering lower latency and better tooling for service contracts than JSON REST', 'gRPC is a REST variant that uses GraphQL schema for request definition', 'gRPC only supports one-way streaming while REST supports bidirectional communication', 'gRPC requires WebSocket connections and is not compatible with standard HTTP load balancers'], answer: 0, explanation: 'gRPC uses HTTP/2 (multiplexing, header compression) and Protocol Buffers (compact binary format) for significantly lower payload size and latency than JSON over HTTP/1.1. Service contracts (proto files) are the single source of truth for both the API definition and code generation for client and server stubs in multiple languages. gRPC supports four communication patterns: unary (request-response), server streaming, client streaming, and bidirectional streaming. Disadvantages: less human-readable than REST, requires special tooling for browser clients.' },
    { q: 'When should you use asynchronous messaging over synchronous HTTP for inter-service communication?', options: ['Always; asynchronous messaging is strictly superior to synchronous HTTP', 'Use asynchronous when the operation does not need an immediate result, when temporal decoupling improves resilience, or when one event must trigger multiple consumers', 'Use asynchronous only for batch operations that run overnight', 'Use synchronous for writes and asynchronous for reads in all cases'], answer: 1, explanation: 'Use asynchronous messaging when: the caller does not need an immediate response (fire and forget operations, notifications, async workflows). When resilience matters more than immediacy: the producer can succeed even if the consumer is temporarily down. When one event must be consumed by multiple services (fan-out). When you need to smooth traffic spikes by buffering requests in a queue. Use synchronous HTTP when: the caller needs an immediate response to continue (user login, checkout), the operation is a query, or the latency of queue propagation is unacceptable for the user experience.' },
    { q: 'What is service mesh and how does it differ from application-level service communication libraries?', options: ['A service mesh is a database technology for storing service configuration', 'A service mesh handles service communication via sidecar proxies at the infrastructure level, providing mTLS, circuit breaking, and observability without requiring application code changes', 'A service mesh is a load balancer configuration that routes traffic between services', 'Service mesh and application-level libraries are interchangeable; choose based on language preference'], answer: 1, explanation: 'Application-level libraries (Resilience4j, Polly) handle circuit breaking, retries, and timeout logic in application code. Each service must implement and maintain these libraries independently. A service mesh moves this logic to sidecar proxies (Envoy, Linkerd) that intercept all service-to-service traffic transparently. The application code does not change: the proxy handles retries, circuit breaking, mTLS, and distributed tracing. Advantages: consistent policies across all services regardless of language, no code changes required, centralized configuration. Disadvantage: adds operational complexity with the control plane and sidecar lifecycle management.' },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the difference between a message queue and a topic?',
      a: 'Queue (work queue): multiple consumers compete; each message processed once by one consumer — used for load distribution. Topic (pub/sub): every subscriber gets its own copy of each message — used for event broadcasting where multiple services need the same event.',
    },
    {
      q: 'Why must async message consumers be idempotent?',
      a: 'Message brokers guarantee at-least-once delivery — network failures can cause a message to be delivered twice. If processing the same message twice produces side effects (double charge, duplicate email), the system is broken. Idempotency: processing the same message N times produces the same result as processing it once.',
    },
    {
      q: 'When is Kafka the right choice vs RabbitMQ?',
      a: 'Kafka: high-throughput event streaming, durable log, replayable history, ordered partitions. Best for analytics pipelines, event sourcing, audit logs. RabbitMQ: lower latency for smaller volumes, complex routing rules (topic/fanout/direct exchanges), per-message TTL/DLQ. Best for task queues and workflow messaging.',
    },
    { q: 'How do you implement request-response correlation in asynchronous service communication?', a: 'When using message queues for communication, tracking which reply corresponds to which request requires a correlation ID. The sender generates a unique correlation ID, includes it in the message, and specifies a reply-to queue or channel. The consumer processes the message, includes the same correlation ID in the reply, and publishes to the reply-to queue. The sender listens on the reply-to queue, matches incoming replies by correlation ID, and completes the waiting request. Libraries like Spring AMQP handle this pattern automatically. In Kafka, implement this via a separate reply topic per request or a shared reply topic with correlation ID filtering. Timeout logic must handle cases where a reply never arrives.' },
    { q: 'What is the difference between a message queue and a message topic (pub/sub) in inter-service communication?', a: 'Message queue (point-to-point): a message is delivered to exactly one consumer. Multiple consumers on the same queue compete for messages and each message is processed once. Used for task distribution: work items dispatched to worker instances. Message topic (pub/sub): a message is delivered to all current subscribers. Each subscriber receives a copy independently. Used for event broadcast: one service publishes an event that multiple services independently react to. Kafka blends both: consumer groups provide queue semantics within a group, while multiple consumer groups on the same topic provide pub/sub semantics across groups. Choose based on whether one processor or multiple independent processors should handle each message.' },
    { q: 'What is back-pressure and how do you handle it in service communication?', a: 'Back-pressure is the mechanism by which a slow consumer signals a fast producer to slow down rather than accumulating unbounded queues in memory. In synchronous communication, back-pressure is natural: if the downstream service is slow, the caller blocks and its own request throughput decreases, propagating the pressure back to callers. In async communication with unbounded queues, the producer can get far ahead of the consumer, eventually causing out-of-memory errors. Reactive Streams (Project Reactor, RxJava) define a back-pressure protocol for push/pull based on consumer demand. Kafka provides back-pressure via the consumer poll loop: the consumer controls how fast it reads by the rate it calls poll(). For HTTP: use rate limiting and circuit breakers to limit request rate to slow downstream services.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Use synchronous calls when you need an immediate answer; use async messaging for writes, events, and notifications to achieve temporal decoupling.',
    mustKnow: [
      'Sync (REST/gRPC): caller blocks; tight temporal coupling; simple; use for reads needing immediate response',
      'Async (Kafka/RabbitMQ): fire and forget; temporal decoupling; use for writes and events',
      'gRPC: binary, typed, high-throughput — prefer for internal high-load service calls',
      'Queue: one consumer per message (load distribution); Pub/Sub: all subscribers get the event',
      'Async consumers must be idempotent — at-least-once delivery guarantees duplicates',
    ],
    interviewFocus: [
      'When would you choose async messaging over synchronous REST?',
      'Explain temporal decoupling and why it matters',
      'What problem does idempotency solve in message consumers?',
    ],
  };
}
