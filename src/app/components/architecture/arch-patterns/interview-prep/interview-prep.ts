import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface ArchQuestion {
  q: string;
  a: string;
  category: string;
  difficulty: 'Junior' | 'Mid' | 'Senior';
  tags: string[];
}

@Component({
  selector: 'app-arch-interview-prep',
  standalone: true,
  imports: [CommonModule, FormsModule, PageMetaComponent],
  templateUrl: './interview-prep.html',
  styleUrl: './interview-prep.scss',
})
export class ArchInterviewPrep {
  selectedDifficulty = signal('All');
  selectedCategory = signal('All');
  searchQuery = signal('');
  expandedIndex = signal<number | null>(null);

  difficulties = ['All', 'Junior', 'Mid', 'Senior'];
  categories = ['All', 'Architectural Styles', 'Microservices', 'Messaging', 'DDD', 'Integration'];

  questions: ArchQuestion[] = [
    // Architectural Styles
    {
      q: 'What is the difference between a Monolith and a Modular Monolith?',
      a: 'A Monolith is a single deployable unit with no enforced module boundaries — any code can call any other code, leading to a "Big Ball of Mud" over time. A Modular Monolith enforces clear module boundaries (separate assemblies or bounded packages) where modules communicate only via public interfaces, with no cross-module database joins. It deploys as one unit but is internally structured for future extraction. The key benefit: you get deployment simplicity with the internal discipline that makes future microservice extraction feasible.',
      category: 'Architectural Styles',
      difficulty: 'Junior',
      tags: ['monolith', 'modular'],
    },
    {
      q: 'Explain the Dependency Rule in Clean Architecture.',
      a: 'The Dependency Rule states that source code dependencies can only point inward — from outer layers toward inner layers. Outer layers (Frameworks, Adapters) depend on inner layers (Use Cases, Entities). Inner layers know nothing about outer layers. This means: your Entity classes have zero imports from ASP.NET, EF Core, or any infrastructure library. Use Cases import Entities but not HTTP controllers or database classes. Result: you can test Use Cases without a database, swap EF Core for Dapper without touching business logic, and replace ASP.NET with gRPC without rewriting use cases.',
      category: 'Architectural Styles',
      difficulty: 'Mid',
      tags: ['clean-architecture', 'dependency-rule'],
    },
    {
      q: 'What is Vertical Slice Architecture and when would you choose it over Layered?',
      a: 'Vertical Slice organises code by feature rather than by layer. Instead of Controllers/ + Services/ + Repositories/ folders, you have Features/PlaceOrder/ containing the command, handler, validator, and any DB query for that one feature. Each slice owns its own stack. Choose Vertical Slice when: (1) different features have very different tech needs (some CQRS, some simple CRUD), (2) team is feature-centric and wants to minimise cross-team merge conflicts, (3) features are relatively independent. Choose Layered when: shared services and repositories are genuinely reused across many features and centralisation reduces duplication.',
      category: 'Architectural Styles',
      difficulty: 'Mid',
      tags: ['vertical-slice', 'layered'],
    },
    {
      q: 'How do Ports and Adapters (Hexagonal Architecture) differ from Clean Architecture?',
      a: 'Both enforce the same core principle: business logic at the centre, infrastructure at the edges, with inward-only dependencies. The difference is framing. Hexagonal frames it as Ports (interfaces defined by the domain) and Adapters (implementations in infrastructure): Primary Adapters drive the app (HTTP controller, CLI); Secondary Adapters are driven by the app (database, message broker). Clean Architecture adds explicit concentric rings (Entities → Use Cases → Interface Adapters → Frameworks) and names the layers more precisely. In practice, a well-structured Clean Architecture is a Hexagonal Architecture — they are complementary, not competing.',
      category: 'Architectural Styles',
      difficulty: 'Senior',
      tags: ['hexagonal', 'clean-architecture', 'ports-adapters'],
    },
    // Microservices
    {
      q: 'What is the "own your data" principle in microservices?',
      a: 'Each microservice owns its database exclusively — no other service queries or writes to that database directly. Services communicate via APIs or events, not shared tables. This enforces loose coupling: the Catalog service can change its schema without breaking the Order service. The trade-off is that cross-service queries (joins) are no longer possible — you must denormalise data via events (e.g., Order service caches the product name from a ProductUpdated event) or aggregate via API calls at query time.',
      category: 'Microservices',
      difficulty: 'Junior',
      tags: ['microservices', 'data', 'coupling'],
    },
    {
      q: 'When would you use gRPC over REST for service communication?',
      a: 'gRPC advantages: binary Protocol Buffers (smaller payload, faster serialisation), strongly typed contracts, bidirectional streaming, HTTP/2 multiplexing. Choose gRPC when: (1) high-throughput internal service-to-service calls where latency matters, (2) streaming data (server push, bidirectional), (3) polyglot environments where contract-first code generation is valuable. Choose REST when: (1) browser clients (gRPC-Web is limited), (2) public APIs (REST is universally understood), (3) simplicity matters more than performance. Common pattern: REST for external-facing APIs, gRPC for internal service mesh.',
      category: 'Microservices',
      difficulty: 'Mid',
      tags: ['grpc', 'rest', 'service-communication'],
    },
    {
      q: 'How does a Circuit Breaker prevent cascading failures?',
      a: 'Without a circuit breaker: if Service B is slow (5s timeout), and Service A calls B 100 times/second, 500 threads are blocked simultaneously — Service A\'s connection pool exhausts and it too starts timing out for callers, cascading upstream. With a circuit breaker in Closed state: normal operation. After 5 failures in 30 seconds: transitions to Open state — subsequent calls immediately return a fallback (cached data, error response, or degraded result) without hitting Service B at all. After a recovery window: transitions to Half-Open — one probe call. If it succeeds: back to Closed. If it fails: back to Open. The fast failure from an Open circuit is what stops thread starvation from propagating upstream.',
      category: 'Microservices',
      difficulty: 'Mid',
      tags: ['circuit-breaker', 'resilience', 'cascading-failures'],
    },
    {
      q: 'What is the difference between client-side and server-side service discovery?',
      a: 'Client-side discovery (Consul + client library, Netflix Eureka): the calling service queries the registry directly, then load-balances client-side. Simpler infrastructure but every client needs a discovery library. Server-side discovery (Kubernetes CoreDNS, AWS ALB): caller sends request to a router (load balancer or DNS); router queries the registry and routes. Client stays simple — no SDK needed. Kubernetes uses server-side: a Service DNS name resolves to a ClusterIP, which is backed by kube-proxy routing to healthy pod IPs. .NET Aspire uses a hybrid: service URLs are injected via environment variables at startup, resolved by the Aspire host.',
      category: 'Microservices',
      difficulty: 'Senior',
      tags: ['service-discovery', 'kubernetes', 'load-balancing'],
    },
    {
      q: 'What is the BFF pattern and how is it different from an API Gateway?',
      a: 'API Gateway: a single entry point for all clients — handles cross-cutting concerns (auth, rate limiting, SSL, routing) but serves the same backend data to all clients. BFF (Backend for Frontend): a dedicated API layer per client type (mobile BFF, web BFF, partner BFF) that aggregates multiple microservice calls and shapes the response exactly for that client\'s needs. API Gateway sits in front of BFFs: gateway → mobile BFF → [Catalog, Inventory, Reviews]. Key distinction: the API Gateway is infrastructure-owned; each BFF is frontend-team-owned and evolves at UI speed. BFF solves over-fetching (mobile doesn\'t need 50 fields) and under-fetching (one BFF call vs 4 client-side calls).',
      category: 'Microservices',
      difficulty: 'Mid',
      tags: ['bff', 'api-gateway', 'microservices'],
    },
    // Messaging
    {
      q: 'What is the difference between a message queue and a pub/sub topic?',
      a: 'Message queue: point-to-point. One message is consumed by exactly one consumer. Used for work distribution (job queue, task queue). If you have 3 worker instances, each message is processed by one of the three. Pub/Sub topic: broadcast. One message is delivered to all subscribers independently. Each subscriber maintains its own cursor. Used for event notification (OrderPlaced → NotificationService AND InventoryService AND AnalyticsService all receive the same event independently). RabbitMQ supports both models: exchanges route to queues (queue = competing consumers; fanout exchange = pub/sub). Kafka is inherently pub/sub with consumer groups (group = queue, different groups = pub/sub).',
      category: 'Messaging',
      difficulty: 'Junior',
      tags: ['messaging', 'queue', 'pubsub'],
    },
    {
      q: 'Explain the Outbox pattern and what problem it solves.',
      a: 'The dual-write problem: an application writes to the database, then publishes a message to RabbitMQ. If it crashes between these two operations, the DB write is committed but the message is never published — event consumers never know the order was placed. The Outbox pattern: write the domain data AND the outgoing event to an Outbox table in the same database transaction. A separate relay process reads unpublished Outbox rows and publishes them to the message broker, then marks them as published. Atomicity is guaranteed by the DB transaction — either both the domain data and the event are saved, or neither is. The relay is a background process (or MassTransit\'s built-in outbox) that operates independently of the business request. Trade-off: at-least-once delivery — consumers must be idempotent.',
      category: 'Messaging',
      difficulty: 'Mid',
      tags: ['outbox', 'reliability', 'dual-write'],
    },
    {
      q: 'Compare Saga Choreography vs Orchestration — when would you choose each?',
      a: 'Choreography: services react to events from each other — PaymentSucceeded → InventoryService reserves stock → StockReserved → ShippingService creates shipment. No central coordinator. Advantages: loose coupling, services are independently deployable. Disadvantages: distributed logic, hard to trace the overall flow, difficult to add steps or handle complex compensation. Orchestration: a central Saga Orchestrator (state machine) sends commands to services and reacts to their results. Advantages: single place to understand the workflow, easy to add steps, state is queryable. Disadvantages: orchestrator is coupled to the workflow; must be deployed and scaled. Rule of thumb: choreography for simple 2–3 step flows; orchestration when flow has 4+ steps, complex compensation, or observability is critical.',
      category: 'Messaging',
      difficulty: 'Senior',
      tags: ['saga', 'choreography', 'orchestration'],
    },
    {
      q: 'What is CQRS and why is it often paired with Event Sourcing?',
      a: 'CQRS (Command Query Responsibility Segregation) separates write operations (Commands → write model) from read operations (Queries → read model). Write model can be normalised for consistency; read model can be denormalised for fast queries. They are naturally paired with Event Sourcing: when the write model is event-sourced (events as the source of truth, not the current state), the read model is built by projecting those events. This gives you: (1) full audit log (all events), (2) ability to replay events to build new read models, (3) temporal queries ("what was the order state last Tuesday?"). The trade-off: eventual consistency between write and read models (projection lag), and significantly higher complexity than a single CRUD model.',
      category: 'Messaging',
      difficulty: 'Senior',
      tags: ['cqrs', 'event-sourcing', 'projections'],
    },
    // DDD
    {
      q: 'What is the difference between an Entity and a Value Object?',
      a: 'Entity: has identity — two entities with the same data are NOT the same object if their IDs differ. Example: two Customer records with the same name are different customers. Mutable (the customer\'s address can change while identity stays the same). Value Object: has no identity — two value objects with the same data ARE the same. Example: Money(100, USD) == Money(100, USD) regardless of which object instance. Immutable — you don\'t change a Money; you create a new one. Use Value Objects for: Money, Address, DateRange, Email, PhoneNumber. They make the domain model richer without primitive obsession.',
      category: 'DDD',
      difficulty: 'Mid',
      tags: ['entity', 'value-object', 'ddd'],
    },
    {
      q: 'What is an Aggregate and why does it matter?',
      a: 'An Aggregate is a cluster of domain objects (entities and value objects) treated as a single unit for data changes. The Aggregate Root is the single entry point — all business rules are enforced through it. Example: Order is the aggregate root; OrderLine is an entity inside the aggregate. External code can only call methods on Order — it cannot directly modify OrderLine. This enforces invariants: "an order total must equal the sum of line totals" is enforced inside the Order aggregate, not in application code. An aggregate also defines the transaction boundary: a single DB transaction may only modify one aggregate. Cross-aggregate operations are coordinated via domain events and eventual consistency.',
      category: 'DDD',
      difficulty: 'Mid',
      tags: ['aggregate', 'ddd', 'consistency'],
    },
    {
      q: 'What is a Bounded Context and how does it relate to microservices?',
      a: 'A Bounded Context is a logical boundary within which a domain model is consistent and the ubiquitous language has a specific meaning. The same concept can have different meanings in different contexts: "Customer" in Sales means a lead with conversion probability; "Customer" in Delivery means an address and delivery schedule. A Bounded Context makes this explicit — separate models, separate codebases, communicate via explicit contracts. Bounded Contexts map naturally to microservices: one service per bounded context is a common guideline. But they are not equivalent — you can have a Bounded Context implemented as part of a modular monolith. The context boundary is a DDD concept; the service boundary is a deployment decision.',
      category: 'DDD',
      difficulty: 'Senior',
      tags: ['bounded-context', 'ddd', 'microservices'],
    },
    // Integration
    {
      q: 'What is an Anti-Corruption Layer and when do you need one?',
      a: 'The ACL is a translation layer between your domain model and an external model you do not control (Stripe, Salesforce, a legacy ERP). Without an ACL, external types, field names, and enums leak into your domain — when the external API changes, so does your domain. With an ACL: external changes are absorbed at the boundary; your domain remains stable. The ACL consists of a Facade (simplified interface over the external API), Adapter (converts external types to your types), and Translator (maps external concepts to your ubiquitous language). It lives in the Infrastructure layer; the Domain defines the interface it implements. Needed when: external model is significantly different from or richer than your domain language.',
      category: 'Integration',
      difficulty: 'Mid',
      tags: ['acl', 'ddd', 'integration'],
    },
    {
      q: 'How does the Strangler Fig pattern enable zero-downtime legacy migration?',
      a: 'The Strangler Fig keeps both legacy and new systems running simultaneously behind a routing facade (API gateway or reverse proxy). Step 1: insert the facade in front of the legacy — all traffic passes through, all goes to legacy initially. Step 2: implement one feature in the new system. Step 3: use a feature flag to route a percentage of traffic to the new system (0% → 5% → 25% → 100%). Step 4: retire the legacy feature. Step 5: repeat for the next feature. At no point does all traffic switch at once — there is always a rollback path (flip the flag back to legacy). This contrasts with a big-bang rewrite where the cutover is a high-stakes, all-or-nothing event.',
      category: 'Integration',
      difficulty: 'Senior',
      tags: ['strangler-fig', 'migration', 'legacy'],
    },
  ];

  filteredQuestions = computed(() => {
    const diff = this.selectedDifficulty();
    const cat = this.selectedCategory();
    const q = this.searchQuery().toLowerCase();
    return this.questions.filter(item => {
      const matchDiff = diff === 'All' || item.difficulty === diff;
      const matchCat = cat === 'All' || item.category === cat;
      const matchQ = !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q) || item.tags.some(t => t.includes(q));
      return matchDiff && matchCat && matchQ;
    });
  });

  diffClass(d: string) {
    return { Junior: 'd-junior', Mid: 'd-mid', Senior: 'd-senior' }[d] ?? '';
  }

  toggle(i: number) {
    this.expandedIndex.update(cur => cur === i ? null : i);
  }
}
