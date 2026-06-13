import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Architectural Styles': 'styles', 'Microservices': 'micro', 'Messaging': 'messaging',
  'DDD': 'ddd', 'Integration': 'integration', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Architectural Styles', 'Microservices', 'Messaging', 'DDD', 'Integration', 'Reference'];

const ALL_TOPICS: Topic[] = [
  // Architectural Styles
  { title: 'Monolith vs Modular Monolith', route: '/arch-patterns', badge: 'Architectural Styles', available: false,
    description: 'When to stay monolith, how to modularise it, and the path to microservices if you ever need it.',
    keyPoints: ['Monolith-first approach: start simple, split when pain is proven', 'Modular Monolith: bounded modules with explicit interfaces', 'Strangler Fig: extract services from a monolith incrementally'] },
  { title: 'Layered Architecture',     route: '/arch-patterns', badge: 'Architectural Styles', available: false,
    description: 'Presentation → Application → Domain → Infrastructure. The most common enterprise pattern.',
    keyPoints: ['Strict layering: each layer depends only on the one below', 'Loose layering: upper layers can skip one', 'Pitfall: anemic domain model in the domain layer'] },
  { title: 'Clean / Onion Architecture', route: '/arch-patterns', badge: 'Architectural Styles', available: false,
    description: 'Domain at the centre, dependencies pointing inward. Infrastructure and UI are plugins.',
    keyPoints: ['Domain and Application layers have zero infrastructure deps', 'Ports & Adapters: interfaces in domain, implementations in infra', 'Testable without a database or web framework'] },
  { title: 'Hexagonal Architecture',   route: '/arch-patterns', badge: 'Architectural Styles', available: false,
    description: 'Ports (interfaces) and Adapters (implementations) isolate the application from external systems.',
    keyPoints: ['Primary ports: driving adapters (HTTP, CLI)', 'Secondary ports: driven adapters (DB, message broker)', 'Swap adapters without touching application core'] },
  { title: 'Vertical Slice Architecture', route: '/arch-patterns', badge: 'Architectural Styles', available: false,
    description: 'Organise by feature (slice) rather than by layer. Each slice is self-contained.',
    keyPoints: ['Feature folder: all code for one use case in one place', 'Minimal coupling between slices', 'MediatR handlers per feature: command + handler + validator'] },
  { title: 'Service-Oriented Architecture', route: '/arch-patterns', badge: 'Architectural Styles', available: false,
    description: 'Coarse-grained services communicating over an ESB or HTTP. SOA vs Microservices comparison.',
    keyPoints: ['SOA services are larger and more orchestrated than microservices', 'ESB provides routing, transformation, and mediation', 'Microservices = SOA done right with lighter infrastructure'] },

  // Microservices
  { title: 'Microservices Principles', route: '/arch-patterns', badge: 'Microservices', available: false,
    description: 'What makes a microservice — bounded contexts, single responsibility, independent deployability.',
    keyPoints: ['Each service owns its data — no shared databases', 'Independently deployable and scalable', 'Team topology: team size = "two-pizza rule"'] },
  { title: 'Service Communication',    route: '/arch-patterns', badge: 'Microservices', available: false,
    description: 'Sync (REST/gRPC) vs async (events/messages) communication — trade-offs and when to use each.',
    keyPoints: ['Sync = tight coupling; prefer for reads that need immediate response', 'Async = loose coupling; prefer for writes and notifications', 'gRPC for internal high-throughput sync calls'] },
  { title: 'API Gateway Pattern',      route: '/arch-patterns', badge: 'Microservices', available: false,
    description: 'Single entry point for clients — routing, aggregation, auth, rate limiting, and BFF pattern.',
    keyPoints: ['Routes requests to the correct downstream service', 'BFF: per-client gateway (mobile vs web)', 'YARP, Envoy, Kong, AWS API Gateway'] },
  { title: 'Service Discovery',        route: '/arch-patterns', badge: 'Microservices', available: false,
    description: 'How services find each other — client-side vs server-side discovery, service registries.',
    keyPoints: ['Client-side: client queries registry (Consul, Eureka)', 'Server-side: load balancer queries registry', '.NET Aspire service discovery: built-in DNS-based'] },
  { title: 'Circuit Breaker',          route: '/arch-patterns', badge: 'Microservices', available: false,
    description: 'Prevent cascade failures by short-circuiting calls to failing services — Closed/Open/Half-Open states.',
    keyPoints: ['Closed: calls pass through normally', 'Open: all calls fail fast for a cooldown period', 'Polly ResiliencePipeline with CircuitBreaker strategy'] },
  { title: 'Sidecar & Service Mesh',   route: '/arch-patterns', badge: 'Microservices', available: false,
    description: 'Offload cross-cutting concerns (mTLS, retries, tracing) to a co-deployed sidecar proxy.',
    keyPoints: ['Sidecar: Envoy proxy deployed alongside each service', 'Service mesh: infrastructure layer for service communication', 'Istio, Linkerd — observability without code changes'] },

  // Messaging
  { title: 'Event-Driven Architecture', route: '/arch-patterns', badge: 'Messaging', available: false,
    description: 'Services communicate by publishing and consuming events asynchronously.',
    keyPoints: ['Producers publish events; consumers subscribe independently', 'Temporal decoupling: producer and consumer need not be running simultaneously', 'Kafka, Azure Service Bus, RabbitMQ'] },
  { title: 'CQRS & Event Sourcing',    route: '/arch-patterns', badge: 'Messaging', available: false,
    description: 'CQRS splits commands (writes) from queries (reads). Event Sourcing stores state as an event log.',
    keyPoints: ['Read and write models can be independently scaled', 'Event log is the source of truth — replay to rebuild state', 'Complex; adopt only when audit/replay or read-scale needs justify it'] },
  { title: 'Saga & Choreography',      route: '/arch-patterns', badge: 'Messaging', available: false,
    description: 'Manage distributed transactions across services without 2PC using compensating actions.',
    keyPoints: ['Choreography: services react to events; no central controller', 'Orchestration: saga orchestrator directs participants', 'Compensating transactions undo completed steps on failure'] },
  { title: 'Inbox & Outbox Pattern',   route: '/arch-patterns', badge: 'Messaging', available: false,
    description: 'Guarantee exactly-once processing with transactional inbox/outbox tables.',
    keyPoints: ['Outbox: write event to DB in same transaction as state change', 'Inbox: idempotency check on the consumer side', 'Eliminates dual-write race and at-least-once delivery issues'] },

  // DDD
  { title: 'Domain-Driven Design Core', route: '/arch-patterns', badge: 'DDD', available: false,
    description: 'Strategic and tactical DDD — bounded contexts, ubiquitous language, aggregates, entities, value objects.',
    keyPoints: ['Bounded context: explicit boundary where a model applies', 'Aggregate root controls all access to the aggregate', 'Value objects: equality by value, not identity'] },
  { title: 'Bounded Contexts',         route: '/arch-patterns', badge: 'DDD', available: false,
    description: 'Define explicit model boundaries. Context mapping shows how bounded contexts relate.',
    keyPoints: ['Each bounded context has its own model and language', 'Context map: Shared Kernel, Customer/Supplier, Anti-Corruption Layer', 'Microservice boundaries often align with bounded contexts'] },
  { title: 'Aggregates & Domain Events', route: '/arch-patterns', badge: 'DDD', available: false,
    description: 'Cluster entities and value objects into aggregates. Domain events communicate what happened.',
    keyPoints: ['Only aggregate roots are referenced from outside', 'Load aggregates by ID; never query across aggregate boundaries', 'Domain events raised within the aggregate, published after commit'] },

  // Integration
  { title: 'Anti-Corruption Layer',    route: '/arch-patterns', badge: 'Integration', available: false,
    description: 'Translate between external model and your domain model. Protect domain from legacy system pollution.',
    keyPoints: ['Adapter + Facade between your domain and external system', 'Maps external concepts to internal ubiquitous language', 'Prevents external model changes from leaking into your domain'] },
  { title: 'Strangler Fig Pattern',    route: '/arch-patterns', badge: 'Integration', available: false,
    description: 'Incrementally replace a legacy system by routing traffic to new implementations.',
    keyPoints: ['Route requests to old or new system via a facade', 'Migrate feature-by-feature without a big-bang rewrite', 'Feature flags control routing during migration'] },
  { title: 'Backend for Frontend (BFF)', route: '/arch-patterns', badge: 'Integration', available: false,
    description: 'Create a dedicated API gateway per client type — mobile, web SPA, third-party — to match each client\'s needs.',
    keyPoints: ['Mobile BFF returns smaller payloads with offline-friendly formats', 'Web BFF can aggregate multiple service calls into one', 'Avoids a generic API being bloated by all client requirements'] },

  // Reference
  { title: 'Architecture Decision Records', route: '/arch-patterns', badge: 'Reference', available: false,
    description: 'Lightweight documents capturing architecture decisions, context, consequences, and alternatives considered.',
    keyPoints: ['Short: context, decision, consequences — one page max', 'ADRs live in the repo alongside the code they describe', 'Immutable history: supersede old ADRs rather than editing them'] },
  { title: 'Pattern Comparison Guide', route: '/arch-patterns', badge: 'Reference', available: false,
    description: 'Side-by-side: Layered vs Clean vs Hexagonal vs Vertical Slice — with a decision guide.',
    keyPoints: ['Criteria: team size, domain complexity, testability goals', 'Trade-offs table: coupling, cognitive load, tooling support', 'Pragmatic advice: start with layered, evolve when pain appears'] },
  { title: 'Architecture Interview Prep', route: '/arch-patterns', badge: 'Reference', available: false,
    description: '35+ system architecture interview questions — from junior (explain MVC) to staff engineer (design Twitter).',
    keyPoints: ['Junior: patterns, SOLID, basic architecture styles', 'Senior: trade-offs, scalability, distributed systems', 'Staff: whiteboard system design framework'] },
];

@Component({
  selector: 'app-arch-patterns-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class ArchPatternsHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'styles'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
