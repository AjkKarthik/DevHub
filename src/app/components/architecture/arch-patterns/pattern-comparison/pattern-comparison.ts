import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';

interface PatternRow {
  pattern: string;
  category: string;
  useWhen: string;
  avoidWhen: string;
  keyTrade: string;
  complexity: 'Low' | 'Medium' | 'High';
  teamSize: 'Small' | 'Any' | 'Large';
  route: string;
}

@Component({
  selector: 'app-arch-pattern-comparison',
  standalone: true,
  imports: [CommonModule, FormsModule, PageMetaComponent],
  templateUrl: './pattern-comparison.html',
  styleUrl: './pattern-comparison.scss',
})
export class ArchPatternComparison {
  selectedCategory = signal('All');

  categories = ['All', 'Architectural Styles', 'Microservices', 'Messaging', 'DDD', 'Integration'];

  patterns: PatternRow[] = [
    // Architectural Styles
    {
      pattern: 'Monolith vs Modular',
      category: 'Architectural Styles',
      useWhen: 'Starting out; team < 10; domain is not well understood yet',
      avoidWhen: 'Independent scaling of components is needed; team > 20',
      keyTrade: 'Simplicity now vs scalability later — a modular monolith is the right middle ground',
      complexity: 'Low',
      teamSize: 'Small',
      route: '/arch-patterns/monolith-vs-modular',
    },
    {
      pattern: 'Layered Architecture',
      category: 'Architectural Styles',
      useWhen: 'Standard CRUD apps; well-understood domain; small team',
      avoidWhen: 'Business logic is complex; need to swap infrastructure independently',
      keyTrade: 'Familiar structure vs infrastructure coupling leaking upward',
      complexity: 'Low',
      teamSize: 'Any',
      route: '/arch-patterns/layered-architecture',
    },
    {
      pattern: 'Clean Architecture',
      category: 'Architectural Styles',
      useWhen: 'Complex business rules; need testability without infrastructure; long-lived codebase',
      avoidWhen: 'Simple CRUD with no business logic — unnecessary complexity',
      keyTrade: 'Testability and independence vs upfront boilerplate',
      complexity: 'High',
      teamSize: 'Any',
      route: '/arch-patterns/clean-architecture',
    },
    {
      pattern: 'Hexagonal Architecture',
      category: 'Architectural Styles',
      useWhen: 'Multiple external integrations that may change; swappable adapters needed',
      avoidWhen: 'Single integration point; team unfamiliar with ports/adapters mental model',
      keyTrade: 'Swap-ability of adapters vs learning curve for ports/adapters thinking',
      complexity: 'High',
      teamSize: 'Any',
      route: '/arch-patterns/hexagonal-architecture',
    },
    {
      pattern: 'Vertical Slice',
      category: 'Architectural Styles',
      useWhen: 'Feature teams; high feature churn; want to minimise coupling between features',
      avoidWhen: 'Many cross-cutting features; risk of shared logic duplication across slices',
      keyTrade: 'Feature isolation vs potential code duplication in shared logic',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/vertical-slice',
    },
    {
      pattern: 'Service-Oriented Architecture',
      category: 'Architectural Styles',
      useWhen: 'Enterprise integration of heterogeneous systems; ESB-based orchestration needed',
      avoidWhen: 'New greenfield projects — microservices or modular monolith is more appropriate',
      keyTrade: 'Reuse via ESB vs tight coupling to the ESB itself',
      complexity: 'High',
      teamSize: 'Large',
      route: '/arch-patterns/service-oriented',
    },
    // Microservices
    {
      pattern: 'Microservices Principles',
      category: 'Microservices',
      useWhen: 'Independent team deployments; polyglot services; scale individual capabilities',
      avoidWhen: 'Team < 10; domain not well understood; no DevOps maturity',
      keyTrade: 'Independent scalability vs distributed systems complexity (network, consistency)',
      complexity: 'High',
      teamSize: 'Large',
      route: '/arch-patterns/microservices-principles',
    },
    {
      pattern: 'Service Communication',
      category: 'Microservices',
      useWhen: 'Choosing sync (REST/gRPC) vs async (queue/pub-sub) per interaction pattern',
      avoidWhen: 'N/A — every microservices system must decide this',
      keyTrade: 'Sync = simpler error handling; Async = temporal decoupling but eventual consistency',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/service-communication',
    },
    {
      pattern: 'API Gateway',
      category: 'Microservices',
      useWhen: 'Multiple clients calling multiple services; need centralised auth/rate limiting',
      avoidWhen: 'Single backend; internal service-to-service calls (use direct calls instead)',
      keyTrade: 'Centralised cross-cutting concerns vs single point of failure',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/api-gateway-pattern',
    },
    {
      pattern: 'Service Discovery',
      category: 'Microservices',
      useWhen: 'Dynamic container environments (Kubernetes); services scale horizontally',
      avoidWhen: 'Fixed IP deployments; services rarely change addresses',
      keyTrade: 'Dynamic routing vs operational complexity of discovery registry',
      complexity: 'High',
      teamSize: 'Large',
      route: '/arch-patterns/service-discovery',
    },
    {
      pattern: 'Circuit Breaker',
      category: 'Microservices',
      useWhen: 'Any synchronous outbound call to an external service or dependency',
      avoidWhen: 'Internal in-process calls; pure async event-driven services with no sync calls',
      keyTrade: 'Resilience to downstream failures vs tuning complexity (thresholds, timeouts)',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/circuit-breaker',
    },
    {
      pattern: 'Sidecar / Service Mesh',
      category: 'Microservices',
      useWhen: 'mTLS between services; observability at mesh level; polyglot language teams',
      avoidWhen: 'Small teams; ops overhead not justified; simple service topologies',
      keyTrade: 'Automatic mTLS + observability vs significant infrastructure complexity',
      complexity: 'High',
      teamSize: 'Large',
      route: '/arch-patterns/sidecar-service-mesh',
    },
    // Messaging
    {
      pattern: 'Event-Driven Architecture',
      category: 'Messaging',
      useWhen: 'Fan-out to multiple consumers; temporal decoupling; audit trail of state changes',
      avoidWhen: 'Simple request-response workflows; team not ready for eventual consistency',
      keyTrade: 'Loose coupling and scalability vs debugging complexity across async flows',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/event-driven',
    },
    {
      pattern: 'CQRS + Event Sourcing',
      category: 'Messaging',
      useWhen: 'Audit log required; multiple read models; need to replay events for new projections',
      avoidWhen: 'Simple CRUD; team not familiar with event sourcing concepts',
      keyTrade: 'Full audit + replay capability vs significantly higher complexity',
      complexity: 'High',
      teamSize: 'Any',
      route: '/arch-patterns/cqrs-event-sourcing',
    },
    {
      pattern: 'Saga (Choreography vs Orchestration)',
      category: 'Messaging',
      useWhen: 'Long-running distributed transactions across services (replace 2PC)',
      avoidWhen: 'Single-service transactions; simple workflows (2 steps)',
      keyTrade: 'Choreography = decoupled but hard to trace; Orchestration = visible but coupled to orchestrator',
      complexity: 'High',
      teamSize: 'Any',
      route: '/arch-patterns/saga-choreography',
    },
    {
      pattern: 'Inbox / Outbox Pattern',
      category: 'Messaging',
      useWhen: 'At-least-once event delivery required; cannot tolerate lost events on crash',
      avoidWhen: 'Fire-and-forget events where loss is acceptable',
      keyTrade: 'Guaranteed delivery vs at-least-once requires idempotent consumers',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/inbox-outbox',
    },
    // DDD
    {
      pattern: 'DDD Core Concepts',
      category: 'DDD',
      useWhen: 'Complex domain; multiple teams; language alignment with domain experts critical',
      avoidWhen: 'Simple CRUD; domain experts unavailable; short-lived project',
      keyTrade: 'Rich domain model vs upfront investment in ubiquitous language',
      complexity: 'High',
      teamSize: 'Large',
      route: '/arch-patterns/ddd-core',
    },
    {
      pattern: 'Bounded Contexts',
      category: 'DDD',
      useWhen: 'Multiple sub-domains with different models; multiple teams owning different areas',
      avoidWhen: 'Small system where one shared model is clearer',
      keyTrade: 'Model isolation per context vs integration overhead between contexts',
      complexity: 'High',
      teamSize: 'Large',
      route: '/arch-patterns/bounded-contexts',
    },
    {
      pattern: 'Aggregates & Domain Events',
      category: 'DDD',
      useWhen: 'Need strict consistency boundaries; domain events drive side effects',
      avoidWhen: 'Aggregate design is overkill for simple read-write entities',
      keyTrade: 'Strong consistency within aggregate vs eventual consistency across aggregates',
      complexity: 'High',
      teamSize: 'Any',
      route: '/arch-patterns/aggregates-domain-events',
    },
    // Integration
    {
      pattern: 'Anti-Corruption Layer',
      category: 'Integration',
      useWhen: 'Integrating legacy or third-party systems with alien models',
      avoidWhen: 'External model is clean and compatible — Conformist may suffice',
      keyTrade: 'Domain model purity vs translation code to maintain',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/anti-corruption-layer',
    },
    {
      pattern: 'Strangler Fig',
      category: 'Integration',
      useWhen: 'Incremental legacy migration; cannot do a big-bang rewrite',
      avoidWhen: 'Greenfield — nothing to strangle',
      keyTrade: 'Zero-downtime migration vs dual-system maintenance during transition',
      complexity: 'High',
      teamSize: 'Any',
      route: '/arch-patterns/strangler-fig',
    },
    {
      pattern: 'Backend for Frontend (BFF)',
      category: 'Integration',
      useWhen: 'Multiple client types with different data needs (mobile vs web vs partner)',
      avoidWhen: 'Single client type; GraphQL already solves over/under-fetching',
      keyTrade: 'Client-optimised API vs additional BFF services to maintain',
      complexity: 'Medium',
      teamSize: 'Any',
      route: '/arch-patterns/backend-for-frontend',
    },
  ];

  filteredPatterns = computed(() => {
    const cat = this.selectedCategory();
    return cat === 'All' ? this.patterns : this.patterns.filter(p => p.category === cat);
  });

  complexityClass(c: string) {
    return { Low: 'c-low', Medium: 'c-medium', High: 'c-high' }[c] ?? '';
  }
}
