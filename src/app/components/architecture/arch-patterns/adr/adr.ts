import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface AdrEntry {
  id: string;
  title: string;
  status: 'Accepted' | 'Proposed' | 'Superseded' | 'Deprecated';
  date: string;
  context: string;
  decision: string;
  consequences: { positive: string[]; negative: string[] };
  alternatives: string[];
  tags: string[];
}

@Component({
  selector: 'app-arch-adr',
  standalone: true,
  imports: [CommonModule, FormsModule, PageMetaComponent],
  templateUrl: './adr.html',
  styleUrl: './adr.scss',
})
export class ArchAdr {
  searchQuery = signal('');
  selectedStatus = signal('All');
  selectedTag = signal('All');
  expandedId = signal<string | null>(null);

  statuses = ['All', 'Accepted', 'Proposed', 'Superseded', 'Deprecated'];

  allTags = computed(() => {
    const tags = new Set<string>();
    this.adrs.forEach(a => a.tags.forEach(t => tags.add(t)));
    return ['All', ...Array.from(tags).sort()];
  });

  adrs: AdrEntry[] = [
    {
      id: 'ADR-001',
      title: 'Use Event Sourcing for Order Management',
      status: 'Accepted',
      date: '2024-01-15',
      context: 'Order management requires full audit history, support for replaying events to rebuild state, and the ability to derive new projections from historical data without re-querying all orders.',
      decision: 'Adopt Event Sourcing for the Order bounded context. Events are the source of truth; the relational read model is a projection. MassTransit handles event dispatch; EventStoreDB persists events.',
      consequences: {
        positive: [
          'Complete audit log with no extra code',
          'Can replay events to build new read models or fix projection bugs',
          'Natural fit for eventual consistency across bounded contexts',
        ],
        negative: [
          'Increases complexity — team must learn event sourcing concepts',
          'Eventual consistency requires UI to handle "processing" states',
          'Snapshot strategy needed for aggregates with many events (>500)',
        ],
      },
      alternatives: [
        'CRUD with audit log table — simpler but audit table diverges from state over time',
        'Change Data Capture (CDC) via Debezium — replication not replay; harder to derive new projections',
      ],
      tags: ['event-sourcing', 'cqrs', 'orders', 'data'],
    },
    {
      id: 'ADR-002',
      title: 'Adopt API Gateway Pattern (YARP) for Service Routing',
      status: 'Accepted',
      date: '2024-02-03',
      context: 'Multiple frontend clients (web SPA, mobile app, third-party partners) all call different microservices directly. This exposes internal topology, forces clients to handle service discovery, and makes cross-cutting concerns (auth, rate limiting) duplicated per service.',
      decision: 'Deploy YARP (Yet Another Reverse Proxy) as the API gateway. Single entry point at api.example.com. Gateway handles JWT validation, rate limiting, and request routing. Services remain internal-only.',
      consequences: {
        positive: [
          'Single HTTPS endpoint for all clients — no exposed internal topology',
          'Auth and rate limiting centralised — removed from every service',
          'Can add BFF routes in YARP config without deploying services',
        ],
        negative: [
          'Gateway is a single point of failure — requires redundant deployment',
          'All traffic passes through one process — must size appropriately',
          'Configuration drift risk if YARP config is not source-controlled',
        ],
      },
      alternatives: [
        'Nginx as API gateway — proven but limited dynamic routing without Lua scripts',
        'AWS API Gateway — managed but vendor lock-in; limited for on-prem hybrid scenarios',
        'No gateway — direct client-to-service — rejected due to topology exposure',
      ],
      tags: ['api-gateway', 'microservices', 'networking', 'yarp'],
    },
    {
      id: 'ADR-003',
      title: 'Use Outbox Pattern for Reliable Event Publishing',
      status: 'Accepted',
      date: '2024-02-20',
      context: 'Services write to the database and publish events to RabbitMQ. If the service crashes between the DB write and the MQ publish, events are lost — creating inconsistency between the Order service and Notification service.',
      decision: 'Implement the Transactional Outbox pattern. Events are written to an Outbox table in the same transaction as domain data. A relay process (using MassTransit\'s outbox feature) polls the table and publishes to RabbitMQ, then marks events as published.',
      consequences: {
        positive: [
          'At-least-once delivery guaranteed — no event loss on crash',
          'Database transaction is the atomicity boundary — no 2PC needed',
          'MassTransit Outbox provides the relay with minimal custom code',
        ],
        negative: [
          'Events may be published more than once — consumers must be idempotent',
          'Relay process adds operational complexity (polling interval, DLQ for relay failures)',
          'Outbox table grows indefinitely without a cleanup job',
        ],
      },
      alternatives: [
        'Dual-write (DB + MQ in application code) — rejected: not atomic, loses events on crash',
        'Saga choreography without outbox — rejected: same dual-write problem',
        'CDC via Debezium — valid alternative; rejected due to ops overhead of Kafka Connect cluster',
      ],
      tags: ['outbox', 'messaging', 'reliability', 'rabbitmq'],
    },
    {
      id: 'ADR-004',
      title: 'Adopt Strangler Fig for Legacy Monolith Migration',
      status: 'Accepted',
      date: '2024-03-10',
      context: 'The existing Order Management monolith is 8 years old, difficult to deploy independently, and blocks the team\'s ability to scale individual capabilities. A full rewrite is too risky — previous big-bang rewrites failed at day 1 cutover.',
      decision: 'Use the Strangler Fig pattern. Add YARP as the routing facade in front of the monolith. Extract one bounded context per quarter, starting with Customer Management (lowest coupling). Legacy monolith handles everything else until fully retired.',
      consequences: {
        positive: [
          'Zero downtime migration — old and new coexist during transition',
          'Each extraction is independently testable and rollback-safe via feature flag',
          'Team learns new stack incrementally rather than all at once',
        ],
        negative: [
          'Two systems to maintain during the 2-year migration window',
          'Shared database period creates coupling between monolith and new services',
          'Migration cadence must be enforced — risk of indefinite coexistence',
        ],
      },
      alternatives: [
        'Big-bang rewrite — rejected: previous attempts failed; too risky with no fallback',
        'Parallel build — rejected: maintaining feature parity with a moving target is impractical',
      ],
      tags: ['strangler-fig', 'migration', 'monolith', 'yarp'],
    },
    {
      id: 'ADR-005',
      title: 'Use Circuit Breaker (Polly) for External Service Calls',
      status: 'Accepted',
      date: '2024-03-25',
      context: 'The Order service calls Payment gateway and Shipping service synchronously. When Payment gateway is slow or down, Order service threads block, connection pools exhaust, and the entire order flow degrades. Cascading failures have caused three incidents in the past year.',
      decision: 'Wrap all outbound HTTP calls with Polly resilience policies: circuit breaker (break after 5 failures in 30 seconds, open for 15 seconds), retry with exponential back-off (3 retries, 1/2/4 second delays), and timeout (5 seconds per call).',
      consequences: {
        positive: [
          'Cascading failures stopped — open circuit returns fast failure, not thread starvation',
          'Polly policies are composable and testable in isolation',
          'Half-open state allows automatic recovery without manual intervention',
        ],
        negative: [
          'Configuration tuning required per dependency — wrong thresholds cause false positives',
          'Requires fallback strategy: what does Order do when Payment circuit is open?',
          'Circuit state is per-instance in stateless deployments — distributed circuit state needs Redis',
        ],
      },
      alternatives: [
        'Timeout only — insufficient: timeout after 5s × 100 concurrent requests = 500s of blocked threads',
        'Service mesh circuit breaker (Istio) — valid; rejected due to infrastructure complexity at current team size',
      ],
      tags: ['circuit-breaker', 'resilience', 'polly', 'microservices'],
    },
    {
      id: 'ADR-006',
      title: 'Migrate from Shared Database to Per-Service Databases',
      status: 'Proposed',
      date: '2024-04-01',
      context: 'Currently all microservices share a single SQL Server database. This creates tight coupling: any schema change requires coordination across all service teams. Deployments are serialised. A single DB is a scalability bottleneck for read-heavy Reporting service.',
      decision: 'Migrate to per-service databases over 6 months. Order service: SQL Server (retains ACID). Product Catalog: PostgreSQL (full-text search). Reporting: read replica + OLAP (Redshift). Services communicate via events (Outbox pattern) rather than shared DB joins.',
      consequences: {
        positive: [
          'Each service team owns and scales their DB independently',
          'Schema changes do not require cross-team coordination',
          'Reporting service can be scaled without affecting transactional DBs',
        ],
        negative: [
          'Cross-service queries now require event-driven denormalisation — no SQL joins across services',
          'Data migration from shared DB is high-risk — requires dual-write period',
          'Distributed transactions eliminated: must accept eventual consistency',
        ],
      },
      alternatives: [
        'Schema-per-service in shared instance — reduces some coupling but not scalability bottleneck',
        'Keep shared DB — rejected: blocks independent deployment and scaling goals',
      ],
      tags: ['database', 'microservices', 'migration', 'scalability'],
    },
    {
      id: 'ADR-007',
      title: 'Adopt Clean Architecture for New Microservices',
      status: 'Accepted',
      date: '2024-01-08',
      context: 'New microservices need a consistent internal structure. Previous services mixed business logic, HTTP concerns, and database queries in controller methods — making unit testing impossible without a running database and HTTP stack.',
      decision: 'All new microservices follow Clean Architecture: Entities + Domain Events (no dependencies), Use Cases (orchestrate entities), Adapters (controllers, repositories), Frameworks (ASP.NET, EF Core). Dependency Rule: outer layers depend on inner layers, never the reverse.',
      consequences: {
        positive: [
          'Use case layer is testable without HTTP, database, or external services',
          'Consistent structure across teams — engineers can navigate any service',
          'Infrastructure (DB, MQ) can be swapped without touching business logic',
        ],
        negative: [
          'More boilerplate vs CRUD controllers — higher initial setup time',
          'Risk of over-engineering simple CRUD services — Apply judgment on when Clean Arch is warranted',
          'Learning curve for engineers new to the pattern',
        ],
      },
      alternatives: [
        'Layered architecture (3-tier) — simpler but infrastructure dependencies still leak into service layer',
        'Vertical slice architecture — strong alternative for teams preferring feature-centric over layer-centric',
      ],
      tags: ['clean-architecture', 'structure', 'testing', 'asp-net'],
    },
    {
      id: 'ADR-008',
      title: 'Use Saga (Choreography) for Order Fulfilment Workflow',
      status: 'Superseded',
      date: '2024-02-15',
      context: 'Order fulfilment spans Payment, Inventory, and Shipping services. These must execute as a distributed unit — if payment fails, inventory must not be reserved. If shipping fails, payment must be refunded.',
      decision: 'Use Saga choreography: each service publishes events and listens to events. PaymentService publishes PaymentSucceeded → InventoryService reserves stock → ShippingService creates shipment. Compensating events on failure.',
      consequences: {
        positive: ['No central orchestrator — services remain decoupled'],
        negative: [
          'Difficult to understand overall flow — logic spread across 3 services',
          'Testing requires all 3 services to be running',
          'SUPERSEDED: Replaced by ADR-009 (orchestration via MassTransit state machine)',
        ],
      },
      alternatives: [],
      tags: ['saga', 'choreography', 'orders', 'workflow'],
    },
    {
      id: 'ADR-009',
      title: 'Replace Saga Choreography with Orchestration (MassTransit State Machine)',
      status: 'Accepted',
      date: '2024-04-10',
      context: 'ADR-008 (choreography) was implemented and is in production. However, debugging and understanding the order fulfilment flow requires tracing events across 3 services. The team cannot easily answer "what state is order X in?" without querying 3 databases.',
      decision: 'Replace choreography with orchestration using MassTransit\'s Saga State Machine. A central OrderFulfilmentSaga tracks the distributed workflow, sends commands to services, and handles compensation. Saga state persisted in SQL Server.',
      consequences: {
        positive: [
          'Single place to understand and debug the full workflow',
          'Saga state queryable — can answer "what state is order X in?"',
          'MassTransit handles message retry, deduplication, and fault compensation',
        ],
        negative: [
          'Saga orchestrator is coupled to the workflow — adding a new step requires saga changes',
          'Single point of failure if saga service goes down (mitigated by stateful persistence)',
          'Migration from choreography to orchestration requires careful cut-over',
        ],
      },
      alternatives: [
        'Keep choreography — rejected: ops pain exceeds coupling benefit at current workflow complexity',
        'Custom orchestrator — rejected: MassTransit state machine solves 90% with less code',
      ],
      tags: ['saga', 'orchestration', 'masstransit', 'workflow'],
    },
  ];

  filteredAdrs = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const status = this.selectedStatus();
    const tag = this.selectedTag();
    return this.adrs.filter(a => {
      const matchesSearch = !q || a.title.toLowerCase().includes(q) || a.context.toLowerCase().includes(q) || a.tags.some(t => t.includes(q));
      const matchesStatus = status === 'All' || a.status === status;
      const matchesTag = tag === 'All' || a.tags.includes(tag);
      return matchesSearch && matchesStatus && matchesTag;
    });
  });

  statusClass(status: string): string {
    const map: Record<string, string> = {
      Accepted: 'status-accepted',
      Proposed: 'status-proposed',
      Superseded: 'status-superseded',
      Deprecated: 'status-deprecated',
    };
    return map[status] ?? '';
  }

  toggle(id: string) {
    this.expandedId.update(cur => cur === id ? null : id);
  }
}
