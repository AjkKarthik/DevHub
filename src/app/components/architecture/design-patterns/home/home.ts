import { Component, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Topic {
  title: string; description: string; route: string; badge: string; available: boolean; keyPoints: string[];
}

const BADGE_CSS: Record<string, string> = {
  'Creational': 'creational', 'Structural': 'structural', 'Behavioral': 'behavioral',
  'Enterprise': 'enterprise', 'Principles': 'principles', 'Reference': 'reference',
};
const GROUP_ORDER = ['All', 'Creational', 'Structural', 'Behavioral', 'Enterprise', 'Principles', 'Reference'];

const ALL_TOPICS: Topic[] = [
  // Creational
  { title: 'Singleton Pattern',       route: '/design-patterns/singleton', badge: 'Creational', available: true,
    description: 'Ensure a class has exactly one instance with a global access point. When to use — and when NOT to.',
    keyPoints: ['Thread-safe singleton with double-checked locking', 'DI is usually a better alternative to static singletons', 'Test difficulty: singletons hide dependencies'] },
  { title: 'Factory Method',           route: '/design-patterns/factory-method', badge: 'Creational', available: true,
    description: 'Define an interface for creating objects and let subclasses decide which class to instantiate.',
    keyPoints: ['Creator declares factory method returning Product', 'ConcreteCreator overrides to return ConcreteProduct', 'Open/Closed: add products without changing creator'] },
  { title: 'Abstract Factory',         route: '/design-patterns/abstract-factory', badge: 'Creational', available: true,
    description: 'Create families of related objects without specifying their concrete classes.',
    keyPoints: ['Produces related objects that are designed to work together', 'Switching factories swaps the entire product family', 'Common in UI toolkits (Windows/macOS button families)'] },
  { title: 'Builder Pattern',          route: '/design-patterns/builder', badge: 'Creational', available: true,
    description: 'Construct complex objects step-by-step. Separate construction from representation.',
    keyPoints: ['Fluent builder: .WithName().WithAge().Build()', 'Director class controls build order', 'Avoids "telescoping constructor" anti-pattern'] },
  { title: 'Prototype Pattern',        route: '/design-patterns/prototype', badge: 'Creational', available: true,
    description: 'Create new objects by cloning existing ones. Useful when object creation is expensive.',
    keyPoints: ['Shallow vs deep copy — understand the difference', 'ICloneable in .NET; copy constructors are often clearer', 'Prototype registry stores pre-configured instances'] },
  { title: 'Object Pool',              route: '/design-patterns/object-pool', badge: 'Creational', available: true,
    description: 'Reuse a fixed set of initialised objects instead of creating/destroying on demand.',
    keyPoints: ['Amortises expensive initialisation cost', 'Thread-safety is critical for concurrent pools', 'Database connection pools, ArrayPool<T>, MemoryPool<T>'] },

  // Structural
  { title: 'Adapter Pattern',          route: '/design-patterns/adapter', badge: 'Structural', available: true,
    description: 'Convert the interface of a class into another interface clients expect. Bridge incompatible interfaces.',
    keyPoints: ['Object adapter (composition) vs class adapter (inheritance)', 'Adapter wraps the adaptee without changing it', 'Common for integrating legacy APIs with modern code'] },
  { title: 'Bridge Pattern',           route: '/design-patterns/bridge', badge: 'Structural', available: true,
    description: 'Decouple an abstraction from its implementation so both can vary independently.',
    keyPoints: ['Abstraction holds a reference to the Implementor', 'Avoids Cartesian explosion of subclasses', 'Runtime swappable implementations'] },
  { title: 'Composite Pattern',        route: '/design-patterns/composite', badge: 'Structural', available: true,
    description: 'Compose objects into tree structures to represent part-whole hierarchies. Treat individual and composite uniformly.',
    keyPoints: ['Component interface is shared by Leaf and Composite', 'Recursive operations (e.g. rendering a UI tree)', 'File system, expression trees, menu hierarchies'] },
  { title: 'Decorator Pattern',        route: '/design-patterns/decorator', badge: 'Structural', available: true,
    description: 'Attach additional responsibilities to an object dynamically. Flexible alternative to subclassing.',
    keyPoints: ['Decorator wraps the component and delegates', 'ASP.NET Core middleware is a decorator chain', 'Stack multiple decorators for layered behaviour'] },
  { title: 'Facade Pattern',           route: '/design-patterns/facade', badge: 'Structural', available: true,
    description: 'Provide a simplified interface to a complex subsystem — the most commonly used pattern.',
    keyPoints: ['Reduces coupling to internal subsystem complexity', 'Does not prevent direct access when needed', 'Service layer in an application is typically a facade'] },
  { title: 'Flyweight Pattern',        route: '/design-patterns/flyweight', badge: 'Structural', available: true,
    description: 'Share fine-grained objects to support large numbers efficiently. Separate intrinsic from extrinsic state.',
    keyPoints: ['Intrinsic state: shared, immutable', 'Extrinsic state: passed per operation', 'string interning in .NET is a flyweight example'] },
  { title: 'Proxy Pattern',            route: '/design-patterns/proxy', badge: 'Structural', available: true,
    description: 'Provide a surrogate or placeholder for another object to control access to it.',
    keyPoints: ['Virtual proxy: lazy loading; Remote proxy: network call', 'Protection proxy: authorisation checks', 'DispatchProxy and Castle DynamicProxy in .NET'] },

  // Behavioral
  { title: 'Chain of Responsibility',  route: '/design-patterns/chain-of-responsibility', badge: 'Behavioral', available: true,
    description: 'Pass a request along a chain of handlers until one handles it or the chain ends.',
    keyPoints: ['ASP.NET Core middleware and pipeline filters', 'Each handler decides to handle or pass along', 'Avoids coupling sender to all possible receivers'] },
  { title: 'Command Pattern',          route: '/design-patterns/command', badge: 'Behavioral', available: true,
    description: 'Encapsulate a request as an object to queue, log, and support undo/redo.',
    keyPoints: ['Command object: Execute() + Undo()', 'MediatR IRequest/IRequestHandler is command pattern', 'Enables command queuing, logging, and macro replay'] },
  { title: 'Iterator Pattern',         route: '/design-patterns/iterator', badge: 'Behavioral', available: true,
    description: 'Traverse elements of a collection without exposing its internal representation.',
    keyPoints: ['IEnumerable<T> / IEnumerator<T> in .NET', 'yield return creates iterator state machines', 'Supports multiple simultaneous iterators'] },
  { title: 'Mediator Pattern',         route: '/design-patterns/mediator', badge: 'Behavioral', available: true,
    description: 'Define an object that encapsulates how a set of objects interact. Reduces coupling.',
    keyPoints: ['MediatR library: Send() dispatches commands, Publish() dispatches events', 'Mediator knows all colleagues; they only know mediator', 'Good for complex component interaction in UI or services'] },
  { title: 'Memento Pattern',          route: '/design-patterns/memento', badge: 'Behavioral', available: true,
    description: 'Capture and externalise an object\'s internal state for later restoration without violating encapsulation.',
    keyPoints: ['Originator creates and restores mementos', 'Caretaker stores mementos (undo stack)', 'Snapshot pattern for domain aggregates'] },
  { title: 'Observer Pattern',         route: '/design-patterns/observer', badge: 'Behavioral', available: true,
    description: 'Define a one-to-many dependency — when one object changes, all dependents are notified.',
    keyPoints: ['IObserver<T> / IObservable<T> in .NET', 'C# events are a built-in observer pattern', 'Pub/sub and reactive streams extend this concept'] },
  { title: 'State Pattern',            route: '/design-patterns/state', badge: 'Behavioral', available: true,
    description: 'Allow an object to alter its behaviour when its internal state changes. Object appears to change its class.',
    keyPoints: ['State interface + ConcreteState classes', 'Context delegates to the current state', 'Stateless services switch state via domain enums'] },
  { title: 'Strategy Pattern',         route: '/design-patterns/strategy', badge: 'Behavioral', available: true,
    description: 'Define a family of algorithms, encapsulate each one, and make them interchangeable.',
    keyPoints: ['Inject the strategy via constructor DI', 'Avoids long if/switch chains for algorithm selection', 'Sorting comparers, payment processors, compression codecs'] },
  { title: 'Template Method',          route: '/design-patterns/template-method', badge: 'Behavioral', available: true,
    description: 'Define the skeleton of an algorithm in a base class, deferring some steps to subclasses.',
    keyPoints: ['Base class defines invariant steps; hook methods are overridden', 'BackgroundService.ExecuteAsync is a template method hook', 'Prefer composition (Strategy) over inheritance where possible'] },
  { title: 'Visitor Pattern',          route: '/design-patterns/visitor', badge: 'Behavioral', available: true,
    description: 'Represent an operation to be performed on the elements of an object structure.',
    keyPoints: ['Double dispatch: visitor.Visit(this) in accept()', 'Add operations without modifying element classes', 'Expression trees and AST walkers use visitor pattern'] },
  { title: 'Null Object Pattern',      route: '/design-patterns/null-object', badge: 'Behavioral', available: true,
    description: 'Provide a no-op default object instead of null to eliminate null checks throughout the code.',
    keyPoints: ['NullLogger<T> in .NET is a built-in null object', 'Eliminates null checks and NullReferenceException risk', 'Pair with Option/Maybe type for functional null safety'] },

  // Enterprise
  { title: 'Repository Pattern',       route: '/design-patterns/repository', badge: 'Enterprise', available: true,
    description: 'Abstract the data layer behind an interface. Domain logic never calls DbContext directly.',
    keyPoints: ['IRepository<T> with Add, Remove, FindById, Query', 'DbContext IS a unit of work — wrapping it adds abstraction', 'Test with in-memory or mock repositories'] },
  { title: 'Unit of Work',             route: '/design-patterns/unit-of-work', badge: 'Enterprise', available: true,
    description: 'Maintain a list of objects affected by a business transaction and coordinate writing out changes.',
    keyPoints: ['EF Core DbContext is a built-in Unit of Work', 'Commit all changes as one atomic SaveChanges()', 'Combine with Repository pattern for full DDD persistence'] },
  { title: 'CQRS',                     route: '/design-patterns/cqrs', badge: 'Enterprise', available: true,
    description: 'Command Query Responsibility Segregation — separate read and write models for scalability and clarity.',
    keyPoints: ['Commands mutate state; Queries return data', 'MediatR or separate handler classes per operation', 'Read model can be denormalised for query performance'] },
  { title: 'Event Sourcing',           route: '/design-patterns/event-sourcing', badge: 'Enterprise', available: true,
    description: 'Store the full history of state changes as an immutable event log rather than current state.',
    keyPoints: ['Aggregate state is replayed from events', 'Append-only store; projections build read models', 'Natural audit trail; time-travel and replay are built in'] },
  { title: 'Saga Pattern',             route: '/design-patterns/saga', badge: 'Enterprise', available: true,
    description: 'Manage long-running distributed transactions via a sequence of local transactions with compensating actions.',
    keyPoints: ['Choreography sagas: events trigger next steps', 'Orchestration sagas: central coordinator', 'Compensating transactions roll back on failure'] },
  { title: 'Outbox Pattern',           route: '/design-patterns/outbox', badge: 'Enterprise', available: true,
    description: 'Reliably publish messages after a database write by persisting them in the same transaction.',
    keyPoints: ['Write to outbox table atomically with domain changes', 'Background relay publishes pending outbox messages', 'Eliminates dual-write race conditions'] },
  { title: 'Specification Pattern',    route: '/design-patterns/specification', badge: 'Enterprise', available: true,
    description: 'Encapsulate business rules as composable, reusable, testable objects.',
    keyPoints: ['IsSatisfiedBy(entity) returns bool', 'Combine with And/Or/Not operators', 'Translatable to IQueryable for database-side filtering'] },
  { title: 'Clean Architecture',       route: '/design-patterns/clean-architecture', badge: 'Enterprise', available: true,
    description: 'Robert C. Martin\'s layered architecture — domain at the center, dependencies always pointing inward.',
    keyPoints: ['4 rings: Entities → Use Cases → Interface Adapters → Frameworks & Drivers', 'Dependency Rule: source code dependencies only point inward', 'Screaming Architecture: folder structure reveals intent, not framework'] },

  // Principles
  { title: 'SOLID Principles',         route: '/design-patterns/solid', badge: 'Principles', available: true,
    description: 'Five object-oriented design principles: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.',
    keyPoints: ['SRP: one reason to change per class', 'OCP: open for extension, closed for modification', 'DIP: depend on abstractions, not concretions'] },
  { title: 'GRASP Principles',         route: '/design-patterns/grasp', badge: 'Principles', available: true,
    description: 'General Responsibility Assignment Software Patterns — who should own this logic?',
    keyPoints: ['Information Expert: assign to the class with the data', 'Creator: assign object creation to the logical parent', 'Low Coupling + High Cohesion as guiding metrics'] },
  { title: 'DRY, KISS & YAGNI',        route: '/design-patterns/dry-kiss-yagni', badge: 'Principles', available: true,
    description: 'Three pragmatic principles: Don\'t Repeat Yourself, Keep It Simple, You Aren\'t Gonna Need It.',
    keyPoints: ['DRY eliminates duplication, not similarity', 'KISS warns against over-engineering before you have a problem', 'YAGNI: implement things when you actually need them'] },
  { title: 'Dependency Inversion',     route: '/design-patterns/dependency-inversion', badge: 'Principles', available: true,
    description: 'High-level modules should not depend on low-level modules. Both should depend on abstractions.',
    keyPoints: ['Register abstractions in the DI container', 'Interfaces belong to the consumer, not the implementation', 'Enables swapping implementations without changing callers'] },

  // Reference
  { title: 'Pattern Cheat Sheet',      route: '/design-patterns/cheatsheet', badge: 'Reference', available: true,
    description: 'Quick-reference card for all 23 GoF patterns — intent, participants, when to use, .NET examples.',
    keyPoints: ['All 23 original GoF patterns summarised', 'When to use each vs the common alternative', '.NET/C# real-world examples per pattern'] },
  { title: 'Interview Prep',           route: '/design-patterns/interview-prep', badge: 'Reference', available: true,
    description: '40+ design pattern interview questions — from junior (what is Singleton?) to senior (anti-patterns, trade-offs).',
    keyPoints: ['Levels: junior, mid, senior architect', 'Compare patterns: Decorator vs Proxy, Strategy vs State', 'Anti-patterns: God Object, Anemic Domain, Premature Optimization'] },
  { title: 'Pattern Decision Guide',   route: '/design-patterns/pattern-decision', badge: 'Reference', available: true,
    description: 'Side-by-side comparisons for the most-confused pattern pairs — with a "when to use each" rule of thumb.',
    keyPoints: ['Factory Method vs Abstract Factory vs Builder', 'Adapter vs Facade vs Proxy', 'Observer vs Mediator vs Event Sourcing'] },
];

@Component({
  selector: 'app-design-patterns-home',
  standalone: true, imports: [RouterLink],
  templateUrl: './home.html', styleUrl: './home.scss',
})
export class DesignPatternsHome {
  activeFilter = signal('All');
  expandedCard = signal<string | null>(null);
  topics = computed(() => { const f = this.activeFilter(); return f === 'All' ? ALL_TOPICS : ALL_TOPICS.filter(t => t.badge === f); });
  filters = GROUP_ORDER;
  counts = computed(() => { const map: Record<string, number> = { All: ALL_TOPICS.length }; for (const t of ALL_TOPICS) map[t.badge] = (map[t.badge] ?? 0) + 1; return map; });
  availableCount = ALL_TOPICS.filter(t => t.available).length;
  totalCount = ALL_TOPICS.length;
  setFilter(f: string) { this.activeFilter.set(f); }
  badgeCss(badge: string) { return 'badge badge-' + (BADGE_CSS[badge] ?? 'creational'); }
  toggleCard(key: string, event: Event) { event.preventDefault(); this.expandedCard.update(c => c === key ? null : key); }
}
